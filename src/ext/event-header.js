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
