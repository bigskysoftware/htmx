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
