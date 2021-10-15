htmx.defineExtension('swap-errors', {
    onEvent: function (name, evt) {
        if (name === "htmx:beforeSwap") {
            if ("HX-SWAP-ERRORS" in evt.detail.headers) {
                evt.detail.shouldSwap=true
            }
        }
    }
});