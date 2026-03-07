(() => {

    if (typeof navigation === 'undefined') return;

    let api;
    let activeCount = 0;
    let activeAborts = new Set();
    let historyUpdating = false;
    let cleanupNavigation = null;

    function shouldShowIndicator(elt) {
        if (api.attributeValue(elt, 'hx-browser-indicator') === 'true') return true;
        if (htmx.config.boostBrowserIndicator && elt._htmx?.boosted) return true;
        return false;
    }

    function listenForNavigate() {
        navigation.addEventListener('navigate', (event) => {
            let hideBrowserIndicator;
            event.intercept({
                handler: () => new Promise(r => { hideBrowserIndicator = r }),
                scroll: 'manual',
                focusReset: 'manual'
            });
            let abortHandler = () => {
                if (historyUpdating) {
                    // History update, re-hijack the navigation
                    listenForNavigate();
                } else {
                    // User clicked the browser stop button - abort all in-flight requests
                    activeAborts.forEach( abort => abort() );
                    activeAborts.clear();
                    activeCount = 0;
                    cleanupNavigation = null;
                }
            };
            event.signal.addEventListener('abort', abortHandler);
            cleanupNavigation = () => {
                event.signal.removeEventListener('abort', abortHandler);
                hideBrowserIndicator();
            };
        }, {once: true});
    }

    function startIndicator() {
        listenForNavigate();
        navigation.navigate(location.href, { history: 'replace' });
    }

    function stopIndicator() {
        if (cleanupNavigation) {
            cleanupNavigation();
            cleanupNavigation = null;
        }
    }

    htmx.registerExtension('browser-indicator', {
        init: (internalAPI) => {
            api = internalAPI;
        },

        htmx_before_history_update: () => {
            historyUpdating = true;
        },

        htmx_after_history_update: () => {
            historyUpdating = false;
        },

        htmx_before_request: (elt, detail) => {
            if (!shouldShowIndicator(elt)) return;
            detail.ctx._browserIndicator = true;
            if (detail.ctx.request?.abort) activeAborts.add(detail.ctx.request.abort);
            activeCount++;
            if (activeCount === 1) startIndicator();
        },

        htmx_finally_request: (elt, detail) => {
            if (!detail.ctx._browserIndicator) return;
            if (detail.ctx.request?.abort) activeAborts.delete(detail.ctx.request.abort);
            if (activeCount === 0) return;
            activeCount--;
            if (activeCount === 0) stopIndicator();
        }
    });
})();
