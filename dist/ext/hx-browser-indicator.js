(() => {

    if (typeof navigation === 'undefined') return;

    let api;
    let activeCount = 0;
    let activeAborts = new Set();

    let cleanupNavigation = null;

    function shouldShowIndicator(elt) {
        let val = api.attributeValue(elt, 'hx-browser-indicator');
        if (val != null && val !== 'false') return true;
        if (htmx.config.boostBrowserIndicator && elt._htmx?.boosted) return true;
        return false;
    }

    function listenForNavigate() {
        navigation.addEventListener('navigate', (event) => {
            if (!event.canIntercept) return;

            // save state before intercept — navigation.navigate() with {history:'replace'} wipes it
            let savedState = history.state;

            let hideBrowserIndicator;
            event.intercept({
                handler: () => new Promise(r => { hideBrowserIndicator = r }),
                scroll: 'manual',
                focusReset: 'manual'
            });

            event.signal.addEventListener('abort', () => {
                if (activeCount > 0) {
                    activeAborts.forEach(abort => abort());
                    activeAborts.clear();
                    activeCount = 0;
                }
                cleanupNavigation = null;
            });

            cleanupNavigation = () => {
                hideBrowserIndicator();
                // restore after resolving — replaceState during a pending intercept aborts the signal early
                history.replaceState(savedState, '');
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
            // stop indicator before htmx pushState fires a navigate event that would abort it
            stopIndicator();
        },

        htmx_before_request: (elt, detail) => {
            if (!shouldShowIndicator(elt)) return;
            detail.ctx._browserIndicator = true;
            activeCount++;
            if (activeCount === 1) startIndicator();
            // add abort after startIndicator() so it isn't present when navigate fires during navigation.navigate()
            if (detail.ctx.request?.abort) activeAborts.add(detail.ctx.request.abort);
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
