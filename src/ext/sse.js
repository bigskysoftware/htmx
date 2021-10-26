/*
Server Sent Events Extension
============================
This extension adds support for Server Sent Events to htmx.  See /www/extensions/sse.md for usage instructions.

*/

(function(){

	htmx.defineExtension("sse", {

		/**
		 * onEvent handles all events passed to this extension.
		 * 
		 * @param {string} name 
		 * @param {Event} evt 
		 * @param {import("../htmx").HtmxExtensionApi} api 
		 * @returns void
		 */
		onEvent: function(name, evt, api) {

			switch (name) {

			// Try to remove remove an EventSource when elements are removed
			case "htmx:beforeCleanupElement":
				var source = api.getInternalData(evt.target, "sseEventSource")
				if (source != null) {
					source.close();
				}
				return;

			// Try to create EventSources when elements are processed
			case "htmx:afterProcessNode":

				var parent = evt.target;

				// get URL from element's attribute
				var sseURL = api.getAttributeValue(evt.target, "sse-url")

				if (sseURL == undefined) {
					return;
				}
		
				// Default function for creating new EventSource objects
				if (htmx.createEventSource == undefined) {
					htmx.createEventSource = createEventSource;
				}

				// Connect to the EventSource
				var source = htmx.createEventSource(sseURL);

				source.onerror = function (err) {
					api.triggerErrorEvent(parent, "htmx:sseError", {error:err, source:source});
					maybeCloseSSESource(api, parent);
				};
				
				api.getInternalData(parent).sseEventSource = source;

				// Add message handlers for every `sse-swap` attribute
				queryAttributeOnThisOrChildren(api, parent, "sse-swap").forEach(function(child) {

					var sseEventName = api.getAttributeValue(child, "sse-swap")

					var listener = function(event) {

						// If the parent is missing then close SSE and remove listener
						if (maybeCloseSSESource(api, parent)) {
							source.removeEventListener(sseEventName, listener);
							return;
						}
			
						// swap the response into the DOM and trigger a notification
						api.swap(child, event.data)
						api.triggerEvent(parent, "htmx:sseMessage", event)
					};
			
					// Register the new listener
					api.getInternalData(parent).sseEventListener = listener;
					source.addEventListener(sseEventName, listener);
				});

				// Add message handlers for every `hx-trigger="sse:*"` attribute
				queryAttributeOnThisOrChildren(api, parent, "hx-trigger").forEach(function(child) {

					var sseEventName = api.getAttributeValue(child, "hx-trigger")

					// Only process hx-triggers for events with the "sse:" prefix
					if (sseEventName.slice(0, 4) != "sse:") {
						return;
					}

					var listener = function(event) {

						// If parent is missing, then close SSE and remove listener
						if (maybeCloseSSESource(api, parent)) {
							source.removeEventListener(sseEventName, listener);
							return;
						}

						// Trigger events to be handled by the rest of htmx
						htmx.trigger(child, sseEventName, event)
						htmx.trigger(child, "htmx:sseMessage", event)
					}

					// Register the new listener
					api.getInternalData(parent).sseEventListener = listener;
					source.addEventListener(sseEventName.slice(4), listener);
				})
			}
		}
	});

	///////////////////////////////////////////////
	// HELPER FUNCTIONS
	///////////////////////////////////////////////


	/**
	 * createEventSource is the default method for creating new EventSource objects.
	 * it is hoisted into htmx.config.createEventSource to be overridden by the user, if needed.
	 * 
	 * @param {string} url 
	 * @returns EventSource
	 */
	 function createEventSource(url){
		return new EventSource(url, {withCredentials:true})
	}

	/**
	 * maybeCloseSSESource confirms that the parent element still exists.
	 * If not, then any associated SSE source is closed and the function returns true.
	 * 
	 * @param {import("../htmx").HtmxExtensionApi} api 
	 * @param {HTMLElement} elt 
	 * @returns boolean
	 */
	function maybeCloseSSESource(api, elt) {
		if (!api.bodyContains(elt)) {
			var source = api.getInternalData("sseEventSource")            
			if (source != undefined) {
				source.close()
				// source = null
				return true;
			}
		}
		return false;
	}

	/**
	 * queryAttributeOnThisOrChildren returns all nodes that contain the requested attributeName, INCLUDING THE PROVIDED ROOT ELEMENT.
	 * 
	 * @param {HTMLElement} elt 
	 * @param {string} attributeName 
	 */
	function queryAttributeOnThisOrChildren(api, elt, attributeName) {

		var result = []

		// If the parent element also contains the requested attribute, then add it to the results too.
		if (api.hasAttribute(elt, attributeName)) {
			result.push(elt);
		}

		// Search all child nodes that match the requested attribute
		elt.querySelectorAll("[" + attributeName + "], [data-" + attributeName + "]").forEach(function(node) {
			result.push(node)
		})

		return result
	}
})();