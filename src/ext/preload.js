htmx.defineExtension("preload", {
    onEvent: function(name, event) {
        if (name == "htmx:processedNode") {
            event.target.querySelectorAll("[preload]").forEach(function(node) {
                if (node.preload == undefined) {
                    var target = node.getAttribute("href") || node.getAttribute("hx-get")
                    if (target != undefined) {
                        node.addEventListener("mouseover", function() {

                            if (node.preloaded == undefined) {
                                var r = new XMLHttpRequest();
                                r.open("GET", target);
                                r.send();
                                node.preloaded = true;
                            }
                        })
                        node.preload = true;
                    }
                }
            })
        }
    }
})
