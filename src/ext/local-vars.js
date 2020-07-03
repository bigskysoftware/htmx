htmx.defineExtension('local-vars', {
    onEvent: function (name, evt) {
        if (!localStorage) {
            console.log("Warning: browser does not support local storage.")
        }
        var elt = evt.detail.elt;
        if (name === "htmx:configRequest") {
            if (elt.hasAttribute("include-local-vars") || elt.hasAttribute("data-include-local-vars") ) {
                var includeVars = elt.getAttribute("include-local-vars") || elt.getAttribute("data-include-local-vars");
                var data = {};
                includeVars.split(" ").forEach(function(key) {
                    var item = localStorage.getItem(key);
                    if(item) {
                        data[key] = item;
                    }
                });
                evt.detail.headers["Local-Vars"] = JSON.stringify(data);           
            }
            else {
                console.log("Warning: hx-local-vars without include-local-vars.")
            }
        }
    },
    transformResponse: function(text, xhr, elt) {
        if (elt.hasAttribute("include-local-vars") || elt.hasAttribute("data-include-local-vars")) {
            var localVars = xhr.getResponseHeader("Local-Vars");
            if (localVars) {
                var localVars = JSON.parse(localVars);
                for(var key in localVars) {
                    localStorage.setItem(key, localVars[key]);
                }
            }
        }
        return text;
    }
});
