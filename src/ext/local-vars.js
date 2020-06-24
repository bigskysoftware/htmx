htmx.defineExtension('local-vars', {
    onEvent: function (name, evt) {
        if (!localStorage) {
            console.log("Warning: browser does not support local storage.")
        }
        elt = evt.detail.elt;
        if (name === "configRequest.htmx") {
            if (elt.hasAttribute("hx-include-local-vars") || elt.hasAttribute("data-hx-include-local-vars") ) {
                var includeVars = elt.getAttribute("hx-include-local-vars") || elt.getAttribute("data-hx-include-local-vars");
                var data = {};
                includeVars.split(" ").forEach(function(key) {
                    var item = localStorage.getItem(key);
                    if(item) {
                        data[key] = item;
                    }
                });
                evt.detail.headers["HX-Local-Vars"] = JSON.stringify(data);           
            }
            else {
                console.log("Warning: hx-local-vars without hx-include-local-vars.")
            }
        }
    },
    transformResponse: function(text, xhr, elt) {
        if (elt.hasAttribute("hx-include-local-vars") || elt.hasAttribute("data-hx-include-local-vars")) {
            var localVars = xhr.getResponseHeader("HX-Local-Vars");
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
