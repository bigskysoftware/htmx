(function(){

    function mergeObjects(obj1, obj2) {
        for (var key in obj2) {
            if (obj2.hasOwnProperty(key)) {
                obj1[key] = obj2[key];
            }
        }
        return obj1;
    }

    htmx.defineExtension('include-vals', {
        onEvent: function (name, evt) {
            if (name === "htmx:configRequest") {
                var includeValsElt = htmx.closest(evt.detail.elt, "[include-vals],[data-include-vals]");
                if (includeValsElt) {
                    var includeVals = includeValsElt.getAttribute("include-vals") || includeValsElt.getAttribute("data-include-vals");
                    var valuesToInclude = eval("({" + includeVals + "})");
                    mergeObjects(evt.detail.parameters, valuesToInclude);
                }
            }
        }
    });
})();
