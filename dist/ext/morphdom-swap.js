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

htmx.defineExtension('morphdom-swap', {
    isInlineSwap: function(swapStyle) {
        return swapStyle === 'morphdom';
    },
    handleSwap: function (swapStyle, target, fragment) {
        if (swapStyle === 'morphdom') {
            if (fragment.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                morphdom(target, fragment.firstElementChild);
                return [target];
            } else {
                morphdom(target, fragment.outerHTML);
                return [target];
            }
        }
    }
});

return htmx;

}));
