if (htmx.version && !htmx.version.startsWith("1.")) {
    console.warn("WARNING: You are using an htmx 1 extension with htmx " + htmx.version +
        ".  It is recommended that you move to the version of this extension found on https://htmx.org/extensions")
}
htmx.defineExtension('rails-method', {
    onEvent: function (name, evt) {
        if (name === "configRequest.htmx") {
            var methodOverride = evt.detail.headers['X-HTTP-Method-Override'];
            if (methodOverride) {
                evt.detail.parameters['_method'] = methodOverride;
            }
        }
    }
});
