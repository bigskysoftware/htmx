htmx.defineExtension('local-vars', {
    onEvent: function (name, evt) {
        if (name === "configRequest.htmx") {
            var includeLocalVarsElt = htmx.closest(evt.detail.elt, "[include-local-vars],[data-include-local-vars]");
            if (includeLocalVarsElt) {
                var includeVars = includeLocalVarsElt.getAttribute("include-local-vars") || includeLocalVarsElt.getAttribute("data-include-local-vars");
                includeVars.split(" ").forEach(function(key) {
                    var item = localStorage.getItem(key);
                    if(item) {
                        evt.detail.parameters[key] = item;
                    }
                });                    
            }
        }
    },
    transformResponse: function(text, xhr, elt) {
        var includeLocalVarsElt = htmx.closest(elt, "[include-local-vars],[data-include-local-vars]");
        if (includeLocalVarsElt) {
            var localVars = xhr.getResponseHeader("HX-Set-Local-Vars");
            if (localVars) {
                var localVars = JSON.parse(localVars);
                for(key in localVars) {
                    localStorage.setItem(key, localVars[key]);
                }
            }
        }
        return text;
    }
});
