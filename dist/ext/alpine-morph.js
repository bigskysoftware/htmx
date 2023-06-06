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

htmx.defineExtension('alpine-morph', {
    isInlineSwap: function (swapStyle) {
        return swapStyle === 'morph';
    },
    handleSwap: function (swapStyle, target, fragment) {
        if (swapStyle === 'morph') {
            if (fragment.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                Alpine.morph(target, fragment.firstElementChild);
                return [target];
            } else {
                Alpine.morph(target, fragment.outerHTML);
                return [target];
            }
        }
    }
});
return htmx;

}));
