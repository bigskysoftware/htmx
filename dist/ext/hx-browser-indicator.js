(() => {

    if (typeof navigation === 'undefined') return;

    let api;
    let activeCount = 0;
    let activeAborts = new Set();

    // FIX: removed `historyUpdating` flag. The original used this to distinguish
    // between the intercept being aborted by htmx's pushState vs the user clicking
    // the stop button, and would re-hijack listenForNavigate() on history updates.
    // This was fragile — the abort from navigation.navigate() fires asynchronously
    // (as a microtask), so the flag was already reset to false by the time the abort
    // handler ran. Instead we now call stopIndicator() pre-emptively in
    // htmx_before_history_update before the pushState abort can fire, making the
    // flag unnecessary entirely.

    let cleanupNavigation = null;

    function shouldShowIndicator(elt) {
        if (api.attributeValue(elt, 'hx-browser-indicator') === 'true') return true;
        if (htmx.config.boostBrowserIndicator && elt._htmx?.boosted) return true;
        return false;
    }

    function listenForNavigate() {
        navigation.addEventListener('navigate', (event) => {
            // FIX: added canIntercept guard. Without this, calling event.intercept()
            // on a non-interceptable navigation (e.g. cross-origin) throws an error.
            if (!event.canIntercept) return;

            // FIX: capture history.state before the intercept. navigation.navigate()
            // with {history:'replace'} wipes history.state to null on the replaced
            // entry. This meant that when the user pressed Back, popstate fired with
            // event.state === null, htmx's check `event.state.htmx` failed, and
            // __restoreHistory() was never called — leaving stale page content.
            // We save it here so we can restore it in cleanupNavigation.
            let savedState = history.state;

            let hideBrowserIndicator;
            event.intercept({
                handler: () => new Promise(r => { hideBrowserIndicator = r }),
                scroll: 'manual',
                focusReset: 'manual'
            });

            let abortHandler = () => {
                // FIX: simplified abort handler — no more historyUpdating branch.
                // The only time we reach here now is if the user clicks the browser
                // stop button, because htmx_before_history_update calls stopIndicator()
                // (which nulls cleanupNavigation and resolves the indicator) before
                // htmx's pushState fires its own navigate event that would abort this
                // signal. So if we get here with activeCount > 0, it's a genuine stop.
                if (activeCount > 0) {
                    activeAborts.forEach(abort => abort());
                    activeAborts.clear();
                    activeCount = 0;
                }
                // FIX: always null cleanupNavigation on abort regardless of activeCount,
                // so stopIndicator() doesn't try to call an already-aborted handler.
                cleanupNavigation = null;
            };
            event.signal.addEventListener('abort', abortHandler);

            cleanupNavigation = () => {
                hideBrowserIndicator();
                // FIX: restore the saved history.state after resolving the intercept.
                // We do this AFTER calling hideBrowserIndicator() because calling
                // history.replaceState() while the Navigation API intercept is still
                // pending immediately aborts the intercept signal — killing the browser
                // loading indicator prematurely. By resolving first then restoring,
                // the indicator completes its full lifecycle before we touch history.
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
            // FIX: replaced historyUpdating=true with a direct stopIndicator() call.
            // htmx is about to call history.pushState() for the new URL. That pushState
            // fires a navigate event of type 'push' which aborts our current replace
            // intercept's signal. If we let that abort fire naturally, the abort handler
            // would see activeCount > 0 and incorrectly treat it as a stop-button press,
            // aborting all in-flight requests. By calling stopIndicator() here first we:
            //   1. Resolve hideBrowserIndicator() — stops the browser spinner cleanly
            //   2. Restore history.state on the current entry BEFORE htmx pushes the
            //      new entry, so the current entry retains {htmx:true} and Back works
            //   3. Null cleanupNavigation so the subsequent abort is a no-op
            stopIndicator();
        },

        // FIX: removed htmx_after_history_update entirely — it only reset historyUpdating
        // to false which is no longer needed.

        htmx_before_request: (elt, detail) => {
            if (!shouldShowIndicator(elt)) return;
            detail.ctx._browserIndicator = true;
            activeCount++;
            if (activeCount === 1) startIndicator();
            // FIX: moved activeAborts.add to AFTER startIndicator(). Previously it was
            // before startIndicator(), which meant when navigation.navigate() fired its
            // navigate event synchronously and then aborted the previous intercept, the
            // abort handler would find the new request's abort already in activeAborts
            // and call it immediately — cancelling the request before it even started.
            // Adding it after startIndicator() means activeAborts is empty when the
            // abort fires during navigation.navigate(), so nothing gets incorrectly cancelled.
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
