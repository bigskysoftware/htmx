htmx.defineExtension("preload", {

	onEvent: function(name, event) {

		if (name == "htmx:processedNode") {

			event.target.querySelectorAll("[preload]").forEach(function(node) {

				if (node.preloadState == undefined) {
					node.preloadState = false;

					var closest = function(node,attr) {
						if (node == undefined) {return undefined}
						return node.getAttribute(attr) || closest(node.parent)
					}
			
					var preload = function(node) {
						if (node.preloadState !== true) {
							var target = node.getAttribute("href") || node.getAttribute("hx-get")
							if (target != undefined) {
								var r = new XMLHttpRequest();
								r.open("GET", target);
								r.send();
								node.preloadState = true;
							}
						}
					}

					var events = (closest(node, "preload") || "mouseover,touchstart").split(",")

					events.forEach(function(event) {
						if (event === "load") {
							preload(node)
							return
						}                        
						node.addEventListener(event, function() {
							preload(node)
						})
					})
				}
			})
		}
	}
})
