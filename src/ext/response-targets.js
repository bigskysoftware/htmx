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

    htmx.defineExtension('response-targets', {

        /** @param {import("../htmx").HtmxInternalApi} apiRef */
        init: function (apiRef) {
            api = apiRef;

            if (htmx.config.responseTargetUnsetsError === undefined) {
                htmx.config.responseTargetUnsetsError = true;
            }
            if (htmx.config.responseTargetUnsetsError === undefined) {
                htmx.config.responseTargetSetsError = false;
            }
        },

        /**
         * @param {string} name
         * @param {Event} evt
         */
        onEvent: function (name, evt) {
             if (name === "htmx:beforeSwap"    &&
                 evt.detail.xhr                &&
                 evt.detail.xhr.status !== 200 &&
                 evt.detail.requestConfig) {
                var target = getRespCodeTarget(evt.detail.requestConfig.elt, evt.detail.xhr.status);
                if (target) {
                    if (evt.detail.isError) {
                        if (htmx.config.responseTargetUnsetsError) {
                            evt.detail.isError = false;
                        }
                    } else if (htmx.config.responseTargetSetsError) {
                        evt.detail.isError = true;
                    }
                    evt.detail.shouldSwap = true;
                    evt.detail.target = target;
                }
                return true;
            }
        }
    });
})();
