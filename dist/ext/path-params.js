if (htmx.version && !htmx.version.startsWith("1.")) {
    console.warn("WARNING: You are using an htmx 1 extension with htmx " + htmx.version +
        ".  It is recommended that you move to the version of this extension found on https://htmx.org/extensions")
}
htmx.defineExtension('path-params', {
    onEvent: function(name, evt) {
        if (name === "htmx:configRequest") {
            evt.detail.path = evt.detail.path.replace(/{([^}]+)}/g, function (_, param) {
                var val = evt.detail.parameters[param];
                delete evt.detail.parameters[param];
                return val === undefined ? "{" + param + "}" : encodeURIComponent(val);
          })
        }
    }
});
