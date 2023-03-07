htmx.defineExtension('json-enc', {
    onEvent: function (name, evt) {
        if (name === "configRequest.htmx") {
            evt.detail.headers['Content-Type'] = "application/json";
        }
    },
    
    encodeParameters : function(xhr, parameters, elt) {
        xhr.overrideMimeType('text/json');
        return (JSON.stringify(parameters));
    }
});