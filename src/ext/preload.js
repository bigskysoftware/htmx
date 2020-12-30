// This adds the "preload" extension to htmx.  By default, this will 
// preload the targets of any tags with `href` or `hx-get` attributes 
// if they also have a `preload` attribute as well.  See documentation
// for more detauls
htmx.defineExtension("preload", {

	onEvent: function(name, event) {

		// Only take actions on "htmx:processedNode"
		if (name !== "htmx:processedNode") {
			return;
		}

		// SOME HELPER FUNCTIONS WE'LL NEED ALONG THE WAY

		// closest gets the closest token value in the preload attribute of the node, so
		// calling closest(node, 'wait') on this node: <div preload="on:mouseover wait:100ms"> 
		// would return "100ms".
		var closest = function(node, token) {
			// Handle undefined inputs gracefully
			if (node == undefined) {return undefined;}

			// Get the attribute
			var attr = node.getAttribute("preload");

			// If we find a token in this attribute value, return it.  Otherwise, search parent elements.
			return parseToken(attr, token) || closest(node.parentElement, token);
		}

		// parseToken finds the value for a specific name:value pair
		// embedded in an input string.  
		// For example, parseToken("one:1 two:2 three:3", "two") => "2"
		var parseToken = function(input, name) {

			// Handle undefined inputs gracefully
			if (input == undefined) {
				return undefined;
			}

			// Split options on whitespace
			var options = input.split(/\s/);

			// Search all options for a matching name...
			for (var i = 0 ; i < options.length ; i++) {
				var option = options[i].split(":");
				if (option[0] === name) {
					return option[1]; // ... return token value
				}
			}

			// Nothing found, return undefined
			return undefined;
		}
		
		// load handles the actual HTTP fetch, and uses htmx.ajax in cases where we're 
		// preloading an htmx resource (this sends the same HTTP headers as a regular htmx request)
		var load = function(node) {

			return function() {

				// If this value has already been loaded, then do not try again.
				if (node.preloadState !== "READY") {
					return;
				}

				// Special handling for HX_GET - use built-in htmx.ajax function
				// so that headers match other htmx requests, then set 
				// node.preloadState = TRUE so that requests are not duplicated
				// in the future
				if (node.getAttribute("hx-get")) {
					htmx.ajax("GET", node.getAttribute("hx-get"), {handler:function() {
						node.preloadState = "DONE"
					}});
					return;
				}

				// Otherwise, perform a standard xhr request, then set 
				// node.preloadState = TRUE so that requests are not duplicated 
				// in the future.
				if (node.getAttribute("href")) {
					var r = new XMLHttpRequest();
					r.open("GET", node.getAttribute("href"));
					r.onload = function() {
						node.preloadState = "DONE";
					}
					r.send();
				}
			}
		}

		// Search for all child nodes that have a "preload" attribute.  Making this explicit
		// ensures that all elements in a large DOM tree are not accidentally targeted
		event.target.querySelectorAll("[preload]").forEach(function(node) {

			// Guarantee that we only process each node once.
			if (node.preloadState !== undefined) {
				return;
			}
			
			// This means that the node has been initialized
			node.preloadState = "PAUSE";

			// Get event name.  Default="mousedown"
			var on = closest(node, "on") || "mousedown";
			
			// One-Line monstrosity to get wait time.  For mouseover events, Default=100ms.  All others, default=0ms.
			var wait = htmx.parseInterval(closest(node, "wait")) || ((on == "mouseover") ? 100 : 0);

			// Special handling for "load" events.  No EventListener necessary, just trigger the timer now.
			if (on === "load") {
				node.preloadState = "READY";  // Required for the `load` function to trigger
				window.setTimeout(load(node), wait);
				return;
			}
			
			// FALL THROUGH to here means we need to add an EventListener
	
			// Apply the listener to the node
			node.addEventListener(on, function() {
				// Only add one event listener
				if (node.preloadState !== "READY") {
					node.preloadState = "READY"; // Requred for the `load` function to trigger
					window.setTimeout(load(node), wait);
				}
			})

			switch (on) {

				// Special handling for "mouseover" events
				case "mouseover":
					// Mirror `touchstart` events (fires immediately)
					node.addEventListener("touchstart", load(node));

					// WHhen the mouse leaves, immediately disable the preload
					node.addEventListener("mouseout", function(evt) {
						if (evt.target === node) {
							node.preloadState = "PAUSE"
						}
					})
					break;

				// Special handling for "mousedown" events
				case "mousedown":
					 // Mirror `touchstart` events (fires immediately)
					node.addEventListener("touchstart", load(node));
					break;
			}
		})
	}
})
