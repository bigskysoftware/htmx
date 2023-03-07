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

    htmx.defineExtension('path-deps', {
        onEvent: function (name, evt) {
            if (name === "htmx:afterRequest") {
                var xhr = evt.detail.xhr;
                // mutating call
                if (xhr.method !== "GET") {
                    var eltsWithDeps = htmx.findAll("[path-deps]");
                    for (var i = 0; i < eltsWithDeps.length; i++) {
                        var elt = eltsWithDeps[i];
                        if (dependsOn(elt.getAttribute('path-deps'), xhr.url)) {
                            htmx.trigger(elt, "path-deps");
                        }
                    }
                }
            }
        }
    });
})();
