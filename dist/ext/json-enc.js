if (htmx.version && !htmx.version.startsWith("1.")) {
    console.warn("WARNING: You are using an htmx 1 extension with htmx " + htmx.version +
        ".  It is recommended that you move to the version of this extension found on https://htmx.org/extensions")
}
htmx.defineExtension('json-enc', {
    onEvent: function (name, evt) {
        if (name === "htmx:configRequest") {
            evt.detail.headers['Content-Type'] = "application/json";
        }
    },

    encodeParameters : function(xhr, parameters, elt) {
        xhr.overrideMimeType('text/json');
        return (JSON.stringify(parameters));
    }
});
