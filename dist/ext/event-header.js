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

(function(){
    function stringifyEvent(event) {
        var obj = {};
        for (var key in event) {
            obj[key] = event[key];
        }
        return JSON.stringify(obj, function(key, value){
            if(value instanceof Node){
                var nodeRep = value.tagName;
                if (nodeRep) {
                    nodeRep = nodeRep.toLowerCase();
                    if(value.id){
                        nodeRep += "#" + value.id;
                    }
                    if(value.classList && value.classList.length){
                        nodeRep += "." + value.classList.toString().replace(" ", ".")
                    }
                    return nodeRep;
                } else {
                    return "Node"
                }
            }
            if (value instanceof Window) return 'Window';
            return value;
        });
    }

    htmx.defineExtension('event-header', {
        onEvent: function (name, evt) {
            if (name === "htmx:configRequest") {
                if (evt.detail.triggeringEvent) {
                    evt.detail.headers['Triggering-Event'] = stringifyEvent(evt.detail.triggeringEvent);
                }
            }
        }
    });
})();

return htmx;

}));
