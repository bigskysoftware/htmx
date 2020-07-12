htmx.defineExtension('local-vars', {

    privateGetStorage: function(params) {
        var sessionRequested = params.indexOf("sessionStorage:1") != -1;
        var storage = (sessionRequested) ? sessionStorage : localStorage;

        if (!localStorage && !sessionRequested) {
            console.log("Warning: browser does not support local storage.");
        }
        if (!sessionStorage && sessionRequested) {
            console.log("Warning: browser does not support session storage.");
        }
        return storage;
    },

    onEvent: function (name, evt) {
        var elt = evt.detail.elt;
        if (name === "htmx:configRequest" || name === "configRequest.htmx") {
            var includeVars = elt.getAttribute("include-local-vars") || elt.getAttribute("data-include-local-vars");
            if (includeVars) {
                var data = {};
                var storage = this.privateGetStorage(includeVars);
                includeVars.split(" ").forEach(function(key) {
                    if (key != "sessionStorage:1") {
                        var item = storage.getItem(key);
                        if(item) {
                            data[key] = item;
                        }    
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
        var includeVars = elt.getAttribute("include-local-vars") || elt.getAttribute("data-include-local-vars");
        if (includeVars) {
            var localVars = xhr.getResponseHeader("Local-Vars");
            if (localVars) {
                var localVars = JSON.parse(localVars);
                var storage = this.privateGetStorage(includeVars);
                for(var key in localVars) {
                    storage.setItem(key, localVars[key]);
                }
            }
        }
        return text;
    }
});
