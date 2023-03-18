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