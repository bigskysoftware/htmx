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

htmx.defineExtension('restored', {
    onEvent : function(name, evt) {
        if (name === 'htmx:restored'){
            var restoredElts = evt.detail.document.querySelectorAll(
                "[hx-trigger='restored'],[data-hx-trigger='restored']"
            );
            // need a better way to do this, would prefer to just trigger from evt.detail.elt
            var foundElt = Array.from(restoredElts).find(
                (x) => (x.outerHTML === evt.detail.elt.outerHTML)
            );
            var restoredEvent = evt.detail.triggerEvent(foundElt, 'restored');
        }
        return;
    }
})
return htmx;

}));
