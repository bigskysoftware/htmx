(function(){

    /** @type {import("../htmx").HtmxInternalApi} */
    var api;

    const targetAttrPrefix = 'hx-target-';
    const targetAttrMinLen = targetAttrPrefix.length - 1;

    /**
     * @param {HTMLElement} elt
     * @param {number} respCode
     * @returns {HTMLElement | null}
     */
    function getRespCodeTarget(elt, respCode) {
        if (!elt || !respCode) return null;

        var targetAttr = targetAttrPrefix + respCode;
        var targetStr  = api.getClosestAttributeValue(elt, targetAttr);

        if (targetStr) {
            if (targetStr === "this") {
                return api.findThisElement(elt, targetAttr);
            } else {
                return api.querySelectorExt(elt, targetStr);
            }
        } else {
            for (let l = targetAttr.length - 1; l > targetAttrMinLen; l--) {
                targetAttr = targetAttr.substring(0, l) + '*';
                targetStr  = api.getClosestAttributeValue(elt, targetAttr);
                if (targetStr) break;
            }
        }

        if (targetStr) {
            if (targetStr === "this") {
                return api.findThisElement(elt, targetAttr);
            } else {
                return api.querySelectorExt(elt, targetStr);
            }
        } else {
            return null;
        }
    }

    /** @param {Event} evt */
    function handleErrorFlag(evt) {
        if (evt.detail.isError) {
            if (htmx.config.responseTargetUnsetsError) {
                evt.detail.isError = false;
            }
        } else if (htmx.config.responseTargetSetsError) {
            evt.detail.isError = true;
        }
    }

    htmx.defineExtension('response-targets', {

        /** @param {import("../htmx").HtmxInternalApi} apiRef */
        init: function (apiRef) {
            api = apiRef;

            if (htmx.config.responseTargetUnsetsError === undefined) {
                htmx.config.responseTargetUnsetsError = true;
            }
            if (htmx.config.responseTargetSetsError === undefined) {
                htmx.config.responseTargetSetsError = false;
            }
            if (htmx.config.responseTargetPrefersExisting === undefined) {
                htmx.config.responseTargetPrefersExisting = false;
            }
            if (htmx.config.responseTargetPrefersRetargetHeader === undefined) {
                htmx.config.responseTargetPrefersRetargetHeader = true;
            }
        },

        /**
         * @param {string} name
         * @param {Event} evt
         */
        onEvent: function (name, evt) {
            if (name === "htmx:beforeSwap"    &&
                evt.detail.xhr                &&
                evt.detail.xhr.status !== 200) {
                if (evt.detail.target) {
                    if (htmx.config.responseTargetPrefersExisting) {
                        evt.detail.shoudSwap = true;
                        handleErrorFlag(evt);
                        return true;
                    }
                    if (htmx.config.responseTargetPrefersRetargetHeader &&
                        evt.detail.xhr.getAllResponseHeaders().match(/HX-Retarget:/i)) {
                        evt.detail.shouldSwap = true;
                        handleErrorFlag(evt);
                        return true;
                    }
                }
                if (!evt.detail.requestConfig) {
                    return true;
                }
                var target = getRespCodeTarget(evt.detail.requestConfig.elt, evt.detail.xhr.status);
                if (target) {
                    handleErrorFlag(evt);
                    evt.detail.shouldSwap = true;
                    evt.detail.target = target;
                }
                return true;
            }
        }
    });
})();
