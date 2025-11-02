(()=>{

    async function tmp(elt) {
        if (elt.__htmx?.preload &&
            elt.__htmx.preload.action === ctx.request.action &&
            Date.now() < elt.__htmx.preload.expiresAt) {
            response = await elt.__htmx.preload.prefetch;
            delete elt.__htmx.preload;
        }
    }

    function initializePreload(elt) {
        let preloadSpec = this.__attributeValue(elt, "hx-preload");
        if (!preloadSpec) return;

        let specs = this.__parseTriggerSpecs(preloadSpec);
        if (specs.length === 0) return;

        let spec = specs[0];
        let eventName = spec.name;
        let timeout = spec.timeout ? this.parseInterval(spec.timeout) : 5000;

        let preloadListener = async (evt) => {
            // Only preload GET requests
            let {method} = this.__determineMethodAndAction(elt, evt);
            if (method !== 'GET') return;

            // Skip if already preloading
            if (elt.__htmx.preload) return;

            // Create config and build full action URL with params
            let ctx = this.__createRequestContext(elt, evt);
            let form = elt.form || elt.closest("form");
            let body = this.__collectFormData(elt, form, evt.submitter);
            this.__handleHxVals(elt, body);

            let action = ctx.request.action.replace?.(/#.*$/, '');
            let params = new URLSearchParams(body);
            if (params.size) action += (/\?/.test(action) ? "&" : "?") + params;

            // Store preload info
            elt.__htmx.preload = {
                prefetch: fetch(action, ctx.request),
                action: action,
                expiresAt: Date.now() + timeout
            };

            try {
                await elt.__htmx.preload.prefetch;
            } catch (error) {
                // Clear on error so actual trigger will retry
                delete elt.__htmx.preload;
            }
        };
        elt.addEventListener(eventName, preloadListener);
        elt.__htmx.preloadListener = preloadListener;
        elt.__htmx.preloadEvent = eventName;
    }

})()