(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['htmx.org'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('htmx.org'));
    } else {
        // Browser globals (root is window)
        factory(root.htmx);
    }
}(typeof self !== 'undefined' ? self : this, function (htmx) {

(function(){
    function maybeRemoveMe(elt) {
        var timing = elt.getAttribute("remove-me") || elt.getAttribute("data-remove-me");
        if (timing) {
            setTimeout(function () {
                elt.parentElement.removeChild(elt);
            }, htmx.parseInterval(timing));
        }
    }

    htmx.defineExtension('remove-me', {
        onEvent: function (name, evt) {
            if (name === "htmx:afterProcessNode") {
                var elt = evt.detail.elt;
                if (elt.getAttribute) {
                    maybeRemoveMe(elt);
                    if (elt.querySelectorAll) {
                        var children = elt.querySelectorAll("[remove-me], [data-remove-me]");
                        for (var i = 0; i < children.length; i++) {
                            maybeRemoveMe(children[i]);
                        }
                    }
                }
            }
        }
    });
})();

return htmx;

}));
