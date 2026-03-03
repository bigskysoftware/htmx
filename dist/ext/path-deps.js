(function(undefined){
    'use strict';
    if (htmx.version && !htmx.version.startsWith("1.")) {
        console.warn("WARNING: You are using an htmx 1 extension with htmx " + htmx.version +
            ".  It is recommended that you move to the version of this extension found on https://htmx.org/extensions")
    }
    // Save a reference to the global object (window in the browser)
    var _root = this;

    function dependsOn(pathSpec, url) {
        if (pathSpec === "ignore") {
            return false;
        }
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
            if (name === "htmx:beforeOnLoad") {
                var config = evt.detail.requestConfig;
                // mutating call
                if (config.verb !== "get" && evt.target.getAttribute('path-deps') !== 'ignore') {
                    refreshPath(config.path);
                }
            }
        }
    });

    /**
     *  ********************
     *  Expose functionality
     *  ********************
     */

    _root.PathDeps = {
        refresh: function(path) {
            refreshPath(path);
        }
    };

}).call(this);
