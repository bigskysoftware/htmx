"use strict";

// Disable Submit Button
htmx.defineExtension('disable-element', {
    onEvent: function (name, evt) {
        let elt = evt.detail.elt;
        let target = elt.getAttribute("hx-disable-element");
        let targetElements = (target == "self") ? [ elt ] : document.querySelectorAll(target);

        for (var i = 0; i < targetElements.length; i++) {
            if (name === "htmx:beforeRequest" && targetElements[i]) {
                targetElements[i].disabled = true;
            } else if (name == "htmx:afterRequest" && targetElements[i]) {
                targetElements[i].disabled = false;
            }
        }
    }
});