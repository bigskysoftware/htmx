(()=>{
    let api;

    function initializePreload(elt) {
        let preloadSpec = api.attributeValue(elt, "hx-preload");
        if (!preloadSpec && !elt._htmx?.boosted) return;

        let preloadEvents = []
        let timeout = 5000;
        if (preloadSpec) {
            let specs = api.parseTriggerSpecs(preloadSpec);
            if (specs.length === 0) return;
            for (const spec of specs) {
                preloadEvents.push(spec.name)
                if (spec.timeout) {
                    timeout = htmx.parseInterval(spec.timeout)
                }
            }
        } else {
            //only boosted links are supported
            if (elt.tagName === "A") {
                if(htmx.config?.preload?.boostTimeout) {
                    timeout = htmx.parseInterval(htmx.config.preload.boostTimeout)
                }
                preloadEvents.push(htmx.config?.preload?.boostEvent || "mousedown");
                preloadEvents.push("touchstart");
            }
        }

        let preloadListener = async (evt) => {
            let {method} = api.determineMethodAndAction(elt, evt);
            if (method !== 'GET') return;

            if (elt._htmx?.preload) return;

            let ctx = api.createRequestContext(elt, evt);
            let form = elt.form || elt.closest("form");
            let body = api.collectFormData(elt, form, evt.submitter);
            api.handleHxVals(elt, body);

            let action = ctx.request.action.replace?.(/#.*$/, '');


            let params = new URLSearchParams(body);
            if (params.size) action += (/\?/.test(action) ? "&" : "?") + params;

            elt._htmx.preload = {
                prefetch: fetch(action, ctx.request),
                action: action,
                expiresAt: Date.now() + timeout
            };

            try {
                await elt._htmx.preload.prefetch;
            } catch (error) {
                delete elt._htmx.preload;
            }
        };
        for (let eventName of preloadEvents) {
            elt.addEventListener(eventName, preloadListener);
        }
        elt._htmx.preloadListener = preloadListener;
        elt._htmx.preloadEvents = preloadEvents;
    }

    htmx.registerExtension('preload', {
        init: (internalAPI) => {
            api = internalAPI;
        },

        htmx_after_init: (elt) => {
            initializePreload(elt);
        },

        htmx_before_request: (elt, detail) => {
            let {ctx} = detail;
            if (elt._htmx?.preload &&
                elt._htmx.preload.action === ctx.request.action &&
                Date.now() < elt._htmx.preload.expiresAt) {
                let prefetch = elt._htmx.preload.prefetch;
                ctx.fetch = () => prefetch;
                delete elt._htmx.preload;
            } else {
                if (elt._htmx) delete elt._htmx.preload;
            }
        },

        htmx_before_cleanup: (elt) => {
            if (elt._htmx?.preloadListener) {
                for (let eventName of elt._htmx.preloadEvents) {
                    elt.removeEventListener(eventName, elt._htmx.preloadListener);
                }
            }
        }
    });
})()