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