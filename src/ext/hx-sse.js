(() => {
    let api;
    let warnedLegacyAttributes = new Set();

    // ========================================
    // HELPERS
    // ========================================

    function getConfig(element) {
        let hasHxSseConnect = api.attributeValue(element, 'hx-sse:connect') != null;
        let hxConfig = api.HCON.parse(api.attributeValue(element, 'hx-config')).sse || {};

        return {
            reconnect: hasHxSseConnect,
            reconnectDelay: 500,
            reconnectMaxDelay: 60000,
            reconnectMaxAttempts: Infinity,
            reconnectJitter: 0.3,
            pauseOnBackground: hasHxSseConnect,
            releaseOn: hasHxSseConnect ? 'immediate' : 'first',
            ...htmx.config.sse,
            ...hxConfig
        };
    }

    function clearLastEventIdHeader(headers) {
        for (let name of Object.keys(headers)) {
            if (name.toLowerCase() === 'last-event-id') delete headers[name];
        }
    }

    // ========================================
    // SSE PARSER
    // ========================================

    async function* parseSSE(connection) {
        let reader = connection.reader;
        let lastEventId = connection.lastEventId;
        let decoder = new TextDecoder();
        let buffer = '';
        let hasData = false;
        let hasId = false;
        let message = {data: '', event: '', retry: null};
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
                        if (hasData || hasId || message.event) {
                            yield {...message, id: lastEventId, hasData, hasId};
                        }
                        hasData = false;
                        hasId = false;
                        message = {data: '', event: '', retry: null};
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
                        if (!value.includes('\0')) {
                            lastEventId = value;
                            hasId = true;
                        }
                    } else if (field === 'retry') {
                        let retryValue = parseInt(value, 10);
                        if (!isNaN(retryValue)) message.retry = retryValue;
                    }
                }
            }
        } finally {
            reader.releaseLock();
            // On the same tick as releaseLock(), so cleanup() or visibilityHandler 
            // calling connection.reader?.cancel() can't hit a released reader.
            connection.reader = null;
        }
    }

    // ========================================
    // STREAMING LOOP
    // ========================================

    // Starts streaming from a response. Handles reconnection by re-fetching
    // with the saved request context (no full pipeline re-run).
    async function handleSSEResponse(ctx, releaseRequest) {
        let element = ctx.sourceElement;
        let config = getConfig(element);
        let reconnectRequested = false;

        function release() {
            if (releaseRequest) {
                releaseRequest();
                releaseRequest = null;
            }
        }

        if (config.releaseOn === 'immediate') release();

        let connection = {
            url: ctx.request.action,
            config: config,
            abortController: null,
            reader: null,
            lastEventId: '',
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
        if (!api.triggerHtmxEvent(element, 'htmx:sse:before:connection', {connection}) || connection.cancelled) {
            cleanup(element, 'cancelled');
            return;
        }

        connection.status = ctx.response.status;
        api.triggerHtmxEvent(element, 'htmx:sse:after:connection', {connection});

        let currentResponse = ctx.response.raw;

        try {
            while (element.isConnected) {
                // Reconnection (not on first iteration, we already have the response)
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
                    if (!api.triggerHtmxEvent(element, 'htmx:sse:before:connection', {connection}) || connection.cancelled) break;

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
                        clearLastEventIdHeader(ctx.request.headers);
                        if (connection.lastEventId) ctx.request.headers['Last-Event-ID'] = connection.lastEventId;
                        currentResponse = await fetch(ctx.request.action, {
                            ...ctx.request,
                            signal: ac.signal
                        });
                    } catch (e) {
                        if (ac.signal.aborted) break;
                        api.triggerHtmxEvent(element, 'htmx:sse:error', {connection, error: e});
                        reconnectRequested = false;
                        connection.attempt++;
                        continue;
                    }

                    if (!currentResponse.ok) {
                        api.triggerHtmxEvent(element, 'htmx:sse:error', {
                            connection,
                            error: new Error(`SSE reconnect failed with status ${currentResponse.status}`),
                            status: currentResponse.status
                        });
                        reconnectRequested = false;
                        connection.attempt++;
                        continue;
                    }

                    connection.status = currentResponse.status;
                    api.triggerHtmxEvent(element, 'htmx:sse:after:connection', {connection});
                    connection.attempt = 0;
                }

                // Stream messages
                reconnectRequested = false;

                try {
                    connection.reader = currentResponse.body.getReader();

                    for await (let msg of parseSSE(connection)) {
                        if (!element.isConnected || reconnectRequested) break;

                        if (msg.hasId) {
                            connection.lastEventId = msg.id;
                            if (!msg.id) clearLastEventIdHeader(ctx.request.headers);
                        }

                        if (!msg.hasData && !msg.event) continue;

                        let pendingWork = [];
                        let detail = {
                            connection,
                            message: {data: msg.data, event: msg.event, id: msg.id},
                            cancelled: false,
                            waitUntil: promise => pendingWork.push(Promise.resolve(promise))
                        };
                        let shouldProcess = api.triggerHtmxEvent(element, 'htmx:sse:before:message', detail);

                        await Promise.all(pendingWork);
                        if (!shouldProcess || detail.cancelled) continue;

                        if (msg.retry != null) config.reconnectDelay = msg.retry;

                        if (detail.message.event) {
                            // hx:release triggers early release
                            if (detail.message.event === 'hx:release') release();

                            htmx.trigger(element, detail.message.event, {data: detail.message.data, id: detail.message.id});
                            api.triggerHtmxEvent(element, 'htmx:sse:after:message', {connection, message: detail.message});

                            // hx-sse:close="eventname": close connection on matching event
                            let closeEvent = api.attributeValue(element, 'hx-sse:close');
                            if (closeEvent && detail.message.event === closeEvent) {
                                cleanup(element, 'message');
                                return;
                            }
                            continue;
                        }

                        // Swap content using the ctx from core (target/swap already resolved)
                        ctx.text = detail.message.data;
                        // Always prevent empty swap for SSE - protects against empty data and
                        // ensures OOB-only messages don't clear target (regardless of allowEmptySwapAfterOOB)
                        if (!ctx.swap.includes('swapEmpty')) ctx.swap += ' swapEmpty:false';
                        await htmx.swap(ctx);
                        if (config.releaseOn === 'first') release();
                        api.triggerHtmxEvent(element, 'htmx:sse:after:message', {connection, message: detail.message});
                    }
                } catch (e) {
                    // core aborts its own controller, so check the error too
                    if (!connection.abortController?.signal?.aborted && e.name !== 'AbortError') {
                        api.triggerHtmxEvent(element, 'htmx:sse:error', {connection, error: e});
                    }
                }

                if (!element.isConnected) break;

                connection.attempt++;
            }
        } finally {
            release();  // Always release when stream ends
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

        let hxTrigger = api.attributeValue(element, 'hx-trigger') || 'load';
        api.onTrigger(element, hxTrigger, () => {
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
        for (let attribute of ['sse-connect', 'sse-close', 'sse-swap']) {
            if (!element.hasAttribute(attribute) || warnedLegacyAttributes.has(attribute)) continue;

            if (attribute === 'sse-swap') {
                console.warn('htmx: [hx-sse] sse-swap is removed in htmx 4. Unnamed SSE messages are swapped automatically. Named events are dispatched as DOM events.');
            } else {
                console.warn(`htmx: [hx-sse] legacy attribute ${attribute} is deprecated; use hx-sse:${attribute.slice(4)} instead`);
            }
            warnedLegacyAttributes.add(attribute);
        }
    }

    // ========================================
    // EXTENSION REGISTRATION
    // ========================================

    htmx.registerExtension('sse', {
        init: (internalAPI) => {
            api = internalAPI;
        },

        htmx_config_request: (element, {ctx: {request}}) => {
            request.headers.Accept =
                `${request.headers.Accept ?? request.headers.accept ?? 'text/html'}, text/event-stream`;
        },

        // Intercept SSE responses before core consumes the body
        htmx_before_response: (element, detail) => {
            let ctx = detail.ctx;
            let contentType = ctx.response.raw.headers.get('Content-Type');
            if (!contentType?.includes('text/event-stream')) return;

            // Take over streaming; use extensionPromise to hold the request open
            clearTimeout(ctx.requestTimeout);
            let releaseRequest;
            ctx.extensionPromise = new Promise(resolve => releaseRequest = resolve);
            handleSSEResponse(ctx, releaseRequest).catch(e => {
                // an aborted stream is a normal end, not an error
                if (e.name !== 'AbortError') {
                    api.triggerHtmxEvent(element, 'htmx:sse:error', {error: e, url: ctx.request.action});
                }
            });
            return false;
        },

        htmx_after_process: (element) => {
            let mc = htmx.config.metaCharacter || ':';
            let processSSEElement = (element) => {
                checkLegacyAttributes(element);
                for (let name of ['connect', 'close']) {
                    let legacyAttr = `sse-${name}`;
                    if (!element.hasAttribute(legacyAttr)) continue;

                    let attr = (htmx.config.prefix || 'hx-') + 'sse' + mc + name;
                    if (!element.hasAttribute(attr)) element.setAttribute(attr, element.getAttribute(legacyAttr));
                }
                processElement(element);
            };

            processSSEElement(element);
            let sseAttr = CSS.escape('hx-sse' + mc + 'connect');
            let sseSelector = `[${sseAttr}]`;
            if (htmx.config.prefix) sseSelector += `,[${CSS.escape(htmx.config.prefix + 'sse' + mc + 'connect')}]`;
            element.querySelectorAll(`${sseSelector},[sse-connect],[sse-close],[sse-swap]`).forEach(processSSEElement);
        },

        htmx_before_cleanup: (element) => {
            cleanup(element);
        }
    });
})();
