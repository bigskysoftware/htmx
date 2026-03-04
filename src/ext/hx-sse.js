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
        let lastEventId = null;
        let attempt = 0;
        let reader = null;
        let reconnectRequested = false;
        let delayCanceller = null;

        let state = {
            abortController: null,
            reader: null,
            lastEventId: null,
            delayCanceller: null,
            visibilityHandler: null
        };
        api.htmxProp(element).sse = state;

        let reconnect = () => {
            if (!element.isConnected || reconnectRequested) return;
            reconnectRequested = true;
            if (delayCanceller) delayCanceller();
            reader?.cancel();
        };

        let paused = false;
        let unpauseResolver = null;

        if (config.pauseOnBackground) {
            let visibilityHandler = () => {
                if (document.hidden) {
                    paused = true;
                    reader?.cancel();
                } else if (paused) {
                    paused = false;
                    if (unpauseResolver) unpauseResolver();
                }
            };
            document.addEventListener('visibilitychange', visibilityHandler);
            state.visibilityHandler = visibilityHandler;
        }

        let connectDetail = {attempt: 0, delay: 0, url: ctx.request.action, lastEventId: null, cancelled: false};
        if (!htmx.trigger(element, 'htmx:before:sse:connection', {connection: connectDetail}) || connectDetail.cancelled) {
            cleanup(element, 'cancelled');
            return;
        }

        htmx.trigger(element, 'htmx:after:sse:connection', {
            connection: {attempt: 0, url: ctx.request.action, status: ctx.response.status, lastEventId: null}
        });

        let currentResponse = ctx.response.raw;

        try {
            while (element.isConnected) {
                // Reconnection (not on first iteration — we already have the response)
                if (attempt > 0) {
                    // Wait while paused (tab backgrounded with pauseOnBackground)
                    if (paused) {
                        await new Promise(r => { unpauseResolver = r; });
                        unpauseResolver = null;
                        if (!element.isConnected) break;
                        attempt = 1; // reset so delay doesn't escalate from pauses
                        reconnectRequested = true; // bypass maxAttempts check
                    }

                    if (!reconnectRequested) {
                        if (!config.reconnect || attempt > config.reconnectMaxAttempts) break;
                    }

                    let baseDelay = htmx.parseInterval(config.reconnectDelay) ?? config.reconnectDelay;
                    let maxDelay = htmx.parseInterval(config.reconnectMaxDelay) ?? config.reconnectMaxDelay;
                    let delay = Math.min(
                        baseDelay * Math.pow(2, attempt - 1),
                        maxDelay
                    );
                    if (config.reconnectJitter > 0) {
                        let jitterRange = delay * config.reconnectJitter;
                        delay = Math.max(0, delay + (Math.random() * 2 - 1) * jitterRange);
                    }

                    let detail = {attempt, delay, url: ctx.request.action, lastEventId, cancelled: false};
                    if (!htmx.trigger(element, 'htmx:before:sse:connection', {connection: detail}) || detail.cancelled) break;

                    await new Promise(r => {
                        delayCanceller = r;
                        state.delayCanceller = r;
                        setTimeout(r, detail.delay);
                    });
                    delayCanceller = null;
                    state.delayCanceller = null;
                    if (!element.isConnected) break;

                    // Re-fetch using saved request context (no full pipeline re-run)
                    let ac = new AbortController();
                    state.abortController = ac;
                    try {
                        if (lastEventId) ctx.request.headers['Last-Event-ID'] = lastEventId;
                        currentResponse = await fetch(ctx.request.action, {
                            ...ctx.request,
                            signal: ac.signal
                        });
                    } catch (e) {
                        if (ac.signal.aborted) break;
                        htmx.trigger(element, 'htmx:sse:error', {error: e});
                        reconnectRequested = false;
                        attempt++;
                        continue;
                    }

                    if (!currentResponse.ok) {
                        htmx.trigger(element, 'htmx:sse:error', {
                            error: new Error(`SSE reconnect failed with status ${currentResponse.status}`),
                            status: currentResponse.status
                        });
                        reconnectRequested = false;
                        attempt++;
                        continue;
                    }

                    htmx.trigger(element, 'htmx:after:sse:connection', {
                        connection: {attempt, url: ctx.request.action, status: currentResponse.status, lastEventId}
                    });
                    attempt = 0;
                }

                // Stream messages
                reconnectRequested = false;

                try {
                    reader = currentResponse.body.getReader();
                    state.reader = reader;

                    for await (let msg of parseSSE(reader)) {
                        if (!element.isConnected || reconnectRequested) break;

                        let detail = {data: msg.data, event: msg.event, id: msg.id, cancelled: false};
                        if (!htmx.trigger(element, 'htmx:before:sse:message', {message: detail}) || detail.cancelled) continue;

                        if (msg.id) {
                            lastEventId = msg.id;
                            state.lastEventId = msg.id;
                        }
                        if (msg.retry != null) config.reconnectDelay = msg.retry;

                        if (detail.event) {
                            htmx.trigger(element, detail.event, {data: detail.data, id: detail.id});
                            htmx.trigger(element, 'htmx:after:sse:message', {message: detail});

                            // hx-sse:close="eventname" — close connection on matching event
                            let closeEvent = api.attributeValue(element, 'hx-sse:close');
                            if (closeEvent && detail.event === closeEvent) {
                                cleanup(element, 'message');
                                return;
                            }
                            continue;
                        }

                        // Swap content using the ctx from core (target/swap already resolved)
                        ctx.text = detail.data;
                        await htmx.swap(ctx);
                        htmx.trigger(element, 'htmx:after:sse:message', {message: detail});
                    }
                } catch (e) {
                    if (!state.abortController?.signal?.aborted) {
                        htmx.trigger(element, 'htmx:sse:error', {error: e});
                    }
                }

                reader = null;
                state.reader = null;
                if (!element.isConnected) break;

                attempt++;
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
        let state = element?._htmx?.sse;
        if (!state) return;

        state.abortController?.abort();
        state.reader?.cancel?.();
        if (state.delayCanceller) state.delayCanceller();
        if (state.visibilityHandler) {
            document.removeEventListener('visibilitychange', state.visibilityHandler);
        }
        delete element._htmx.sse;
        htmx.trigger(element, 'htmx:sse:close', {reason: reason || 'cleanup'});
    }

    // ========================================
    // EXTENSION REGISTRATION
    // ========================================

    htmx.registerExtension('sse', {
        init: (internalAPI) => {
            api = internalAPI;
        },

        // Intercept SSE responses before core consumes the body
        htmx_before_response: (element, detail) => {
            let ctx = detail.ctx;
            let contentType = ctx.response.raw.headers.get('Content-Type');
            if (!contentType?.includes('text/event-stream')) return;

            // Take over — core will return without calling response.text()
            handleSSEResponse(ctx).catch(e => {
                htmx.trigger(element, 'htmx:sse:error', {error: e});
                cleanup(element);
            });
            return false;
        },

        htmx_after_process: (element) => {
            processElement(element);
            // Find hx-sse:connect descendants (respects prefix + metaCharacter config)
            let attr = CSS.escape((htmx.config.prefix || 'hx-') + 'sse' + (htmx.config.metaCharacter || ':') + 'connect');
            element.querySelectorAll(`[${attr}]`).forEach(processElement);
        },

        htmx_before_cleanup: (element) => {
            cleanup(element);
        }
    });
})();
