if (htmx.version && !htmx.version.startsWith("1.")) {
    console.warn("WARNING: You are using an htmx 1 extension with htmx " + htmx.version +
        ".  It is recommended that you move to the version of this extension found on https://htmx.org/extensions")
}
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
