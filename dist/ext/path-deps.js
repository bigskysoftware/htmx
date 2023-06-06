(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['htmx.org'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('htmx.org'));
    } else {
        // Browser globals (root is window)
        factory(root.htmx);
    }
}(typeof self !== 'undefined' ? self : this, function (htmx) {

(function(undefined){
    'use strict';

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

return htmx;

}));
