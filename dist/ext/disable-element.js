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

"use strict";

// Disable Submit Button
htmx.defineExtension('disable-element', {
    onEvent: function (name, evt) {
        let elt = evt.detail.elt;
        let target = elt.getAttribute("hx-disable-element");
        let targetElement = (target == "self") ? elt : document.querySelector(target);

        if (name === "htmx:beforeRequest" && targetElement) {
            targetElement.disabled = true;
        } else if (name == "htmx:afterRequest" && targetElement) {
            targetElement.disabled = false;
        }
    }
});
return htmx;

}));
