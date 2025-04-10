(function(){
    if (htmx.version && !htmx.version.startsWith("1.")) {
        console.warn("WARNING: You are using an htmx 1 extension with htmx " + htmx.version +
            ".  It is recommended that you move to the version of this extension found on https://htmx.org/extensions")
    }
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
