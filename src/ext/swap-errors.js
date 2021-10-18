htmx.defineExtension("swap-errors", {
  onEvent: function (name, evt) {
    if (name === "htmx:beforeSwap") {
      if (evt.detail.xhr.getResponseHeader("HX-SWAP-ERRORS") !== null) {
        evt.detail.shouldSwap = true;
      }
    }
  },
});

