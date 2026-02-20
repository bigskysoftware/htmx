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
        let message = {data: '', event: '', id: '', retry: null};

        try {
            while (true) {
                let {done, value} = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, {stream: true});
                let lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (let line of lines) {
                    if (!line || line === '\r') {
                        if (message.data) {
                            yield message;
                            message = {data: '', event: '', id: '', retry: null};
                        }
                        continue;
                    }

                    let colonIndex = line.indexOf(':');
                    if (colonIndex <= 0) continue;

                    let field = line.slice(0, colonIndex);
                    let value = line.slice(colonIndex + 1);
                    if (value[0] === ' ') value = value.slice(1);

                    if (field === 'data') {
                        message.data += (message.data ? '\n' : '') + value;
                    } else if (field === 'event') {
                        message.event = value;
                    } else if (field === 'id') {
                        message.id = value;
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
        element._htmx = element._htmx || {};
        element._htmx.sse = state;

        let reconnect = () => {
            if (!element.isConnected || reconnectRequested) return;
            reconnectRequested = true;
            if (delayCanceller) delayCanceller();
            reader?.cancel();
        };

        if (config.pauseOnBackground) {
            let visibilityHandler = () => {
                if (document.hidden) {
                    reader?.cancel();
                } else {
                    reconnect();
                }
            };
            document.addEventListener('visibilitychange', visibilityHandler);
            state.visibilityHandler = visibilityHandler;
        }

        let connectDetail = {attempt: 0, delay: 0, lastEventId: null, cancelled: false};
        if (!htmx.trigger(element, 'htmx:before:sse:connection', {connection: connectDetail}) || connectDetail.cancelled) {
            cleanup(element);
            return;
        }

        htmx.trigger(element, 'htmx:after:sse:connection', {
            url: ctx.request.action,
            status: ctx.response.status
        });

        let currentResponse = ctx.response.raw;

        try {
            while (element.isConnected) {
                // Reconnection (not on first iteration — we already have the response)
                if (attempt > 0) {
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

                    let detail = {attempt, delay, lastEventId, cancelled: false};
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

                    htmx.trigger(element, 'htmx:after:sse:connection', {
                        url: ctx.request.action,
                        status: currentResponse.status
                    });
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

                        if (msg.event) {
                            htmx.trigger(element, msg.event, {data: msg.data, id: msg.id});
                            htmx.trigger(element, 'htmx:after:sse:message', {message: detail});
                            continue;
                        }

                        // Swap content using the ctx from core (target/swap already resolved)
                        ctx.text = msg.data;
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
            cleanup(element);
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
            htmx.ajax('GET', connectUrl, {source: element});
        });
    }

    // ========================================
    // CLEANUP
    // ========================================

    function cleanup(element) {
        let state = element?._htmx?.sse;
        if (!state) return;

        state.abortController?.abort();
        state.reader?.cancel?.();
        if (state.delayCanceller) state.delayCanceller();
        if (state.visibilityHandler) {
            document.removeEventListener('visibilitychange', state.visibilityHandler);
        }
        delete element._htmx.sse;
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
            handleSSEResponse(ctx);
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
