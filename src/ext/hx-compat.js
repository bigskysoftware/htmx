(()=>{
    //========================================================
    // htmx 2.0 compatibility extension
    //========================================================
    let api

    function maybeRetriggerEvent(elt, evtName, detail) {
        if (!htmx.config.compat?.doNotTriggerOldEvents) {
            htmx.trigger(elt, evtName, detail);
        }
    }

    htmx.registerExtension('compat', {
        init: (internalAPI) => {
            api = internalAPI;

            // revert inheritance
            if (!htmx.config.compat?.useExplicitInheritace) {
                htmx.config.implicitInheritance = true;
            }

            // do not swap 4xx and 5xx responses
            if (!htmx.config.compat?.swapErrorResponseCodes) {
                htmx.config.noSwap.push("4xx", "5xx");
            }
        },
        // Re-delegate new events to old event names for backwards compatibility
        htmx_after_implicitInheritance: function (elt, detail) {
            if (!htmx.config.compat?.suppressInheritanceLogs) {
                console.log("IMPLICIT INHERITANCE DETECTED, attribute: " + detail.name + ", elt: ", elt, ", inherited from: ", detail.parent)
                let evt = new CustomEvent("htmxImplicitInheritace", {
                    detail,turn
                    cancelable: true,
                    bubbles : true,
                    composed: true,
                });
                elt.dispatchEvent(evt)
            }
        },
        htmx_after_init: function (elt, detail) {
            maybeRetriggerEvent(elt, "htmx:afterOnLoad", detail);
            maybeRetriggerEvent(elt, "htmx:afterProcessNode", detail);
            maybeRetriggerEvent(elt, "htmx:load", detail);
        },
        htmx_after_request: function (elt, detail) {
            maybeRetriggerEvent(elt, "htmx:afterRequest", detail);
        },
        htmx_after_swap: function (elt, detail) {
            maybeRetriggerEvent(elt, "htmx:afterSettle", detail);
            maybeRetriggerEvent(elt, "htmx:afterSwap", detail);
        },
        htmx_before_cleanup: function (elt, detail) {
            maybeRetriggerEvent(elt, "htmx:beforeCleanupElement", detail);
        },
        htmx_before_history_update: function (elt, detail) {
            maybeRetriggerEvent(elt, "htmx:beforeHistoryUpdate", detail);
            maybeRetriggerEvent(elt, "htmx:beforeHistorySave", detail);
        },
        htmx_before_init: function (elt, detail) {
            maybeRetriggerEvent(elt, "htmx:beforeOnLoad", detail);
        },
        htmx_before_process: function (elt, detail) {
            maybeRetriggerEvent(elt, "htmx:beforeProcessNode", detail);
        },
        htmx_before_request: function (elt, detail) {
            maybeRetriggerEvent(elt, "htmx:beforeRequest", detail);
            maybeRetriggerEvent(elt, "htmx:beforeSend", detail);
        },
        htmx_before_swap: function (elt, detail) {
            maybeRetriggerEvent(elt, "htmx:beforeSwap", detail);
        },
        htmx_before_viewTransition: function (elt, detail) {
            maybeRetriggerEvent(elt, "htmx:beforeTransition", detail);
        },
        htmx_config_request: function (elt, detail) {
            maybeRetriggerEvent(elt, "htmx:configRequest", detail);
        },
        htmx_before_restore_history: function (elt, detail) {
            maybeRetriggerEvent(elt, "htmx:historyRestore", detail);
        },
        htmx_after_push_into_history: function (elt, detail) {
            maybeRetriggerEvent(elt, "htmx:pushedIntoHistory", detail);
        },
        htmx_after_replace_into_history: function (elt, detail) {
            maybeRetriggerEvent(elt, "htmx:replacedInHistory", detail);
        },
        htmx_error: function (elt, detail) {
            maybeRetriggerEvent(elt, "htmx:targetError", detail);
        },
    });
})()