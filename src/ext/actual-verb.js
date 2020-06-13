htmx.defineExtension('actual-verb', {
    onEvent: function (name, evt) {
        if (name === "configRequest.htmx") {
            evt.detail.xhrVerb = evt.detail.verb.toUpperCase();
        }
    }
});