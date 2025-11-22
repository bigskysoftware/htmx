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

    htmx.defineExtension('compat', {
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
        htmx_after_implicitInheritance : function(elt, detail) {
            // TODO - how should we alert users?  collect a report?  just log?
            // TODO - needs a config option to enable
        },
        // TODO - catch all new events and redelegate to old event names as best we can
        //        this can probably be done as a map... See www/content/migration-guide-htmx-4.md:94
        htmx_after_init: function (elt, detail) {
            maybeRetriggerEvent(elt, "htmx:afterOnLoad", detail);
        },
    });
})()