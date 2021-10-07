htmx.defineExtension('method-override', {
    onEvent: function (name, evt) {
        if (name === "htmx:configRequest") {
            var method = evt.detail.verb;
            if (method !== "get" || method !== "post") {
                evt.detail.headers['X-HTTP-Method-Override'] = method.toUpperCase();
                evt.detail.verb = "post";
            }
        }
    }
});
