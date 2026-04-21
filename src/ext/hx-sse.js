(() => {
    let api;

    // ========================================
    // HELPERS
    // ========================================

    function getConfig(ctx) {
        let isConnect = api.attributeValue(ctx.sourceElement, 'hx-sse:connect') != null;
        let defaults = {
            reconnect: isConnect,
            reconnectDelay: 500,
            reconnectMaxDelay: 60000,
            reconnectMaxAttempts: Infinity,
            reconnectJitter: 0.3,
            pauseOnBackground: isConnect
        };
        let global = htmx.config.sse || {};
        // hx-config="sse.reconnect:true sse.reconnectDelay:50ms" is parsed by
        // core's __mergeConfig into ctx.request.sse during createRequestContext
        let perElement = ctx.request.sse || {};
        return {...defaults, ...global, ...perElement};
    }

    // ========================================
    // SSE PARSER
    // ========================================

    async function* parseSSE(reader) {
        let decoder = new TextDecoder();
        let buffer = '';
        let hasData = false;
        let message = {data: '', event: '', id: '', retry: null};
        let firstChunk = true;

        try {
            while (true) {
                let {done, value} = await reader.read();
                if (done) break;

                let chunk = decoder.decode(value, {stream: true});
                // Strip leading BOM (U+FEFF) per SSE spec
                if (firstChunk) {
                    if (chunk.charCodeAt(0) === 0xFEFF) chunk = chunk.slice(1);
                    firstChunk = false;
                }
                buffer += chunk;

                // Split on \r\n, \r, or \n (SSE spec allows all three)
                let lines = buffer.split(/\r\n|\r|\n/);
                buffer = lines.pop() || '';

                for (let line of lines) {
                    if (!line) {
                        if (hasData) {
                            yield message;
                            hasData = false;
                            message = {data: '', event: '', id: '', retry: null};
                        }
                        continue;
                    }

                    let colonIndex = line.indexOf(':');
                    if (colonIndex === 0) continue; // comment line

                    let field, value;
                    if (colonIndex < 0) {
                        // No colon: entire line is field name, value is empty string
                        field = line;
                        value = '';
                    } else {
                        field = line.slice(0, colonIndex);
                        value = line.slice(colonIndex + 1);
                        if (value[0] === ' ') value = value.slice(1);
                    }

                    if (field === 'data') {
                        message.data += (hasData ? '\n' : '') + value;
                        hasData = true;
                    } else if (field === 'event') {
                        message.event = value;
                    } else if (field === 'id') {
                        if (!value.includes('\0')) message.id = value;
                    } else if (field === 'retry') {
                        let retryValue = parseInt(value, 10);
                        if (!isNaN(retryValue)) message.retry = retryValue;
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    // ========================================
    // STREAMING LOOP
    // ========================================

    // Starts streaming from a response. Handles reconnection by re-fetching
    // with the saved request context (no full pipeline re-run).
    async function handleSSEResponse(ctx) {
        let element = ctx.sourceElement;
        let config = getConfig(ctx);
        let reconnectRequested = false;

        let connection = {
            url: ctx.request.action,
            config: config,
            abortController: null,
            reader: null,
            lastEventId: null,
            delayCanceller: null,
            visibilityHandler: null,
            attempt: 0,
            cancelled: false,
            status: null
        };
        api.htmxProp(element).sse = connection;

        let reconnect = () => {
            if (!element.isConnected || reconnectRequested) return;
            reconnectRequested = true;
            if (connection.delayCanceller) connection.delayCanceller();
            connection.reader?.cancel();
        };

        let paused = false;
        let unpauseResolver = null;

        if (config.pauseOnBackground) {
            let visibilityHandler = () => {
                if (document.hidden) {
                    paused = true;
                    connection.reader?.cancel();
                } else if (paused) {
                    paused = false;
                    if (unpauseResolver) unpauseResolver();
                }
            };
            document.addEventListener('visibilitychange', visibilityHandler);
            connection.visibilityHandler = visibilityHandler;
        }

        connection.cancelled = false;
        if (!api.triggerHtmxEvent(element, 'htmx:before:sse:connection', {connection}) || connection.cancelled) {
            cleanup(element, 'cancelled');
            return;
        }

        connection.status = ctx.response.status;
        api.triggerHtmxEvent(element, 'htmx:after:sse:connection', {connection});

        let currentResponse = ctx.response.raw;

        try {
            while (element.isConnected) {
                // Reconnection (not on first iteration — we already have the response)
                if (connection.attempt > 0) {
                    // Wait while paused (tab backgrounded with pauseOnBackground)
                    if (paused) {
                        await new Promise(r => { unpauseResolver = r; });
                        unpauseResolver = null;
                        if (!element.isConnected) break;
                        connection.attempt = 1; // reset so delay doesn't escalate from pauses
                        reconnectRequested = true; // bypass maxAttempts check
                    }

                    if (!reconnectRequested) {
                        if (!config.reconnect || connection.attempt > config.reconnectMaxAttempts) break;
                    }

                    let baseDelay = htmx.parseInterval(config.reconnectDelay) ?? config.reconnectDelay;
                    let maxDelay = htmx.parseInterval(config.reconnectMaxDelay) ?? config.reconnectMaxDelay;
                    let delay = Math.min(
                        baseDelay * Math.pow(2, connection.attempt - 1),
                        maxDelay
                    );
                    if (config.reconnectJitter > 0) {
                        let jitterRange = delay * config.reconnectJitter;
                        delay = Math.max(0, delay + (Math.random() * 2 - 1) * jitterRange);
                    }

                    connection.cancelled = false;
                    if (!api.triggerHtmxEvent(element, 'htmx:before:sse:connection', {connection}) || connection.cancelled) break;

                    await new Promise(r => {
                        connection.delayCanceller = r;
                        setTimeout(r, delay);
                    });
                    connection.delayCanceller = null;
                    if (!element.isConnected) break;

                    // Re-fetch using saved request context (no full pipeline re-run)
                    let ac = new AbortController();
                    connection.abortController = ac;
                    try {
                        if (connection.lastEventId) ctx.request.headers['Last-Event-ID'] = connection.lastEventId;
                        currentResponse = await fetch(ctx.request.action, {
                            ...ctx.request,
                            signal: ac.signal
                        });
                    } catch (e) {
                        if (ac.signal.aborted) break;
                        api.triggerHtmxEvent(element, 'htmx:sse:error', {error: e, url: ctx.request.action});
                        reconnectRequested = false;
                        connection.attempt++;
                        continue;
                    }

                    if (!currentResponse.ok) {
                        api.triggerHtmxEvent(element, 'htmx:sse:error', {
                            error: new Error(`SSE reconnect failed with status ${currentResponse.status}`),
                            status: currentResponse.status,
                            url: ctx.request.action
                        });
                        reconnectRequested = false;
                        connection.attempt++;
                        continue;
                    }

                    connection.status = currentResponse.status;
                    api.triggerHtmxEvent(element, 'htmx:after:sse:connection', {connection});
                    connection.attempt = 0;
                }

                // Stream messages
                reconnectRequested = false;

                try {
                    connection.reader = currentResponse.body.getReader();

                    for await (let msg of parseSSE(connection.reader)) {
                        if (!element.isConnected || reconnectRequested) break;

                        let detail = {
                            message: {data: msg.data, event: msg.event, id: msg.id, cancelled: false}
                        };
                        if (!api.triggerHtmxEvent(element, 'htmx:before:sse:message', detail) || detail.message.cancelled) continue;

                        if (msg.id) {
                            connection.lastEventId = msg.id;
                        }
                        if (msg.retry != null) config.reconnectDelay = msg.retry;

                        if (detail.message.event) {
                            htmx.trigger(element, detail.message.event, {data: detail.message.data, id: detail.message.id});
                            delete detail.message.cancelled;
                            api.triggerHtmxEvent(element, 'htmx:after:sse:message', detail);

                            // hx-sse:close="eventname" — close connection on matching event
                            let closeEvent = api.attributeValue(element, 'hx-sse:close');
                            if (closeEvent && detail.message.event === closeEvent) {
                                cleanup(element, 'message');
                                return;
                            }
                            continue;
                        }

                        // Swap content using the ctx from core (target/swap already resolved)
                        ctx.text = detail.message.data;
                        await htmx.swap(ctx);
                        delete detail.message.cancelled;
                        api.triggerHtmxEvent(element, 'htmx:after:sse:message', detail);
                    }
                } catch (e) {
                    if (!connection.abortController?.signal?.aborted) {
                        api.triggerHtmxEvent(element, 'htmx:sse:error', {error: e, url: ctx.request.action});
                    }
                }

                connection.reader = null;
                if (!element.isConnected) break;

                connection.attempt++;
            }
        } finally {
            cleanup(element, element.isConnected ? 'ended' : 'removed');
        }
    }

    // ========================================
    // ELEMENT PROCESSING
    // ========================================

    function processElement(element) {
        let connectUrl = api.attributeValue(element, 'hx-sse:connect');
        if (!connectUrl) return;
        if (element._htmx?.sse) return; // already set up

        let specString = api.attributeValue(element, 'hx-trigger') || 'load';
        api.onTrigger(element, specString, () => {
            if (element._htmx?.sse) return; // prevent duplicate connections
            htmx.ajax('GET', connectUrl, {source: element});
        });
    }

    // ========================================
    // CLEANUP
    // ========================================

    function cleanup(element, reason) {
        let connection = element?._htmx?.sse;
        if (!connection) return;

        connection.abortController?.abort();
        connection.reader?.cancel?.();
        if (connection.delayCanceller) connection.delayCanceller();
        if (connection.visibilityHandler) {
            document.removeEventListener('visibilitychange', connection.visibilityHandler);
        }
        api.triggerHtmxEvent(element, 'htmx:sse:close', {connection, reason: reason || 'cleanup'});
        delete element._htmx.sse;
    }

    // ========================================
    // BACKWARD COMPATIBILITY
    // ========================================

    function checkLegacyAttributes(element) {
        if (element.hasAttribute('sse-connect')) {
            console.warn('HTMX SSE: Legacy attribute sse-connect is deprecated. Use hx-sse:connect instead.');

            let url = element.getAttribute('sse-connect');
            let attr = (htmx.config.prefix || 'hx-') + 'sse' + (htmx.config.metaCharacter || ':') + 'connect';
            if (!element.hasAttribute(attr)) {
                element.setAttribute(attr, url);
            }
        }
        if (element.hasAttribute('sse-swap')) {
            console.warn('HTMX SSE: sse-swap is removed in htmx 4. Unnamed SSE messages are swapped automatically. Named events are dispatched as DOM events.');
        }
    }

    // ========================================
    // EXTENSION REGISTRATION
    // ========================================

    htmx.registerExtension('sse', {
        init: (internalAPI) => {
            api = internalAPI;
        },

        htmx_config_request: (element, detail) => {
            detail.ctx.request.headers['Accept'] = 'text/html, text/event-stream';
        },

        // Intercept SSE responses before core consumes the body
        htmx_before_response: (element, detail) => {
            let ctx = detail.ctx;
            let contentType = ctx.response.raw.headers.get('Content-Type');
            if (!contentType?.includes('text/event-stream')) return;

            // Take over — core will return without calling response.text()
            handleSSEResponse(ctx).catch(e => {
                api.triggerHtmxEvent(element, 'htmx:sse:error', {error: e, url: ctx.request.action});
                cleanup(element);
            });
            return false;
        },

        htmx_after_process: (element) => {
            checkLegacyAttributes(element);
            processElement(element);
            let mc = htmx.config.metaCharacter || ':';
            let sseAttr = CSS.escape('hx-sse' + mc + 'connect');
            let sseSelector = `[${sseAttr}]`;
            if (htmx.config.prefix) sseSelector += `,[${CSS.escape(htmx.config.prefix + 'sse' + mc + 'connect')}]`;
            element.querySelectorAll(`${sseSelector},[sse-connect]`).forEach((el) => {
                checkLegacyAttributes(el);
                processElement(el);
            });
        },

        htmx_before_cleanup: (element) => {
            cleanup(element);
        }
    });
})();
