htmx.defineExtension("swap-errors", {
  onEvent: function (name, evt) {
    if (name === "htmx:beforeSwap") {
      if (evt.detail.xhr.getResponseHeader("HX-Swap-Errors") !== null) {
        evt.detail.shouldSwap = true;
      }
    }
  },
});
