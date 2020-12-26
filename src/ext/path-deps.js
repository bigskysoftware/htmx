(function(){
    function dependsOn(pathSpec, url) {
        var dependencyPath = pathSpec.split("/");
        var urlPath = url.split("/");
        for (var i = 0; i < urlPath.length; i++) {
            var dependencyElement = dependencyPath.shift();
            var pathElement = urlPath[i];
            if (dependencyElement !== pathElement && dependencyElement !== "*") {
                return false;
            }
            if (dependencyPath.length === 0 || (dependencyPath.length === 1 && dependencyPath[0] === "")) {
                return true;
            }
        }
        return false;
    }

    function refreshPath(path) {
        var eltsWithDeps = htmx.findAll("[path-deps]");
        for (var i = 0; i < eltsWithDeps.length; i++) {
            var elt = eltsWithDeps[i];
            if (dependsOn(elt.getAttribute('path-deps'), path)) {
                htmx.trigger(elt, "path-deps");
            }
        }      
    }

    htmx.defineExtension('path-deps', {
        onEvent: function (name, evt) {
            if (name === "htmx:afterRequest") {
                var config = evt.detail.requestConfig;
                // mutating call
                if (config.verb !== "get") {
                    refreshPath(config.path);
                }
            } else if (name === "htmx:refreshPath") {
                refreshPath(evt.path);
            } else if (name === "htmx:refresh") {
                var elt = evt.detail.elt;
                htmx.trigger(elt, "path-deps");
            }
        }
    });
})();
