(()=>{
    let api;

    function initializePreload(elt) {
        let preloadSpec = api.attributeValue(elt, "hx-preload");
        if (!preloadSpec) return;

        let specs = api.parseTriggerSpecs(preloadSpec);
        if (specs.length === 0) return;

        let spec = specs[0];
        let eventName = spec.name;
        let timeout = spec.timeout ? api.parseInterval(spec.timeout) : 5000;

        let preloadListener = async (evt) => {
            let {method} = api.determineMethodAndAction(elt, evt);
            if (method !== 'GET') return;

            if (elt.__htmx?.preload) return;

            let ctx = api.createRequestContext(elt, evt);
            let form = elt.form || elt.closest("form");
            let body = api.collectFormData(elt, form, evt.submitter);
            api.handleHxVals(elt, body);

            let action = ctx.request.action.replace?.(/#.*$/, '');
            let params = new URLSearchParams(body);
            if (params.size) action += (/\?/.test(action) ? "&" : "?") + params;

            elt.__htmx.preload = {
                prefetch: fetch(action, ctx.request),
                action: action,
                expiresAt: Date.now() + timeout
            };

            try {
                await elt.__htmx.preload.prefetch;
            } catch (error) {
                delete elt.__htmx.preload;
            }
        };
        elt.addEventListener(eventName, preloadListener);
        elt.__htmx.preloadListener = preloadListener;
        elt.__htmx.preloadEvent = eventName;
    }

    htmx.defineExtension('preload', {
        init: (internalAPI) => {
            api = internalAPI;
        },
        
        htmx_after_init: (elt) => {
            initializePreload(elt);
        },
        
        htmx_before_request: (elt, detail) => {
            let {ctx} = detail;
            if (elt.__htmx?.preload &&
                elt.__htmx.preload.action === ctx.request.action &&
                Date.now() < elt.__htmx.preload.expiresAt) {
                ctx.cachedResponse = elt.__htmx.preload.prefetch;
                delete elt.__htmx.preload;
            } else {
                if (elt.__htmx) delete elt.__htmx.preload;
            }
        },
        
        htmx_before_cleanup: (elt) => {
            if (elt.__htmx?.preloadListener) {
                elt.removeEventListener(elt.__htmx.preloadEvent, elt.__htmx.preloadListener);
            }
        }
    });
})()