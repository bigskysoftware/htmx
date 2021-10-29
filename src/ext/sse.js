/*
Server Sent Events Extension
============================
This extension adds support for Server Sent Events to htmx.  See /www/extensions/sse.md for usage instructions.

*/

(function(){

	/** @type {import("../htmx").HtmxInternalApi} */
	var api;

	htmx.defineExtension("sse", {

		/**
		 * Init saves the provided reference to the internal HTMX API.
		 * 
		 * @param {import("../htmx").HtmxInternalApi} api 
		 * @returns void
		 */
		init: function(apiRef) {
			// store a reference to the internal API.
			api = apiRef;

			// set a function in the public API for creating new EventSource objects
			if (htmx.createEventSource == undefined) {
				htmx.createEventSource = createEventSource;
			}
		},

		/**
		 * onEvent handles all events passed to this extension.
		 * 
		 * @param {string} name 
		 * @param {Event} evt 
		 * @returns void
		 */
		onEvent: function(name, evt) {

			switch (name) {

			// Try to remove remove an EventSource when elements are removed
			case "htmx:beforeCleanupElement":
				var internalData = api.getInternalData(evt.target)
				if (internalData.sseEventSource) {
					internalData.sseEventSource.close();
				}
				return;

			// Try to create EventSources when elements are processed
			case "htmx:afterProcessNode":
				createEventSourceOnElement(evt.target);
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
	 function createEventSource(url) {
		return new EventSource(url, {withCredentials:true});
	}

	/**
	 * createEventSourceOnElement creates a new EventSource connection on the provided element.
	 * If a usable EventSource already exists, then it is returned.  If not, then a new EventSource
	 * is created and stored in the element's internalData.
	 * @param {HTMLElement} parent 
	 * @param {number} retryCount
	 * @returns {EventSource | null}
	 */
	function createEventSourceOnElement(parent, retryCount) {

		var internalData = api.getInternalData(parent);

		// get URL from element's attribute
		var sseURL = api.getAttributeValue(parent, "sse-url");

		if (sseURL == undefined) {
			return;
		}

		// Connect to the EventSource
		var source = htmx.createEventSource(sseURL);
		internalData.sseEventSource = source;

		// Create event handlers
		source.onerror = function (err) {

			// Log an error event
			api.triggerErrorEvent(parent, "htmx:sseError", {error:err, source:source});

			// If parent no longer exists in the document, then clean up this EventSource
			if (maybeCloseSSESource(parent)) {
				return;
			}

			// Otherwise, try to reconnect the EventSource
			if (source.readyState == EventSource.CLOSED) {
				retryCount = retryCount || 0;
				var timeout = Math.random() * (2 ^ retryCount) * 500;
				window.setTimeout(function() {
					createEventSourceOnElement(parent, Math.min(7, retryCount+1));
				}, timeout);
			}			
		};
		
		// Add message handlers for every `sse-swap` attribute
		queryAttributeOnThisOrChildren(parent, "sse-swap").forEach(function(child) {

			var sseEventName = api.getAttributeValue(child, "sse-swap");

			var listener = function(event) {

				// If the parent is missing then close SSE and remove listener
				if (maybeCloseSSESource(parent)) {
					source.removeEventListener(sseEventName, listener);
					return;
				}
	
				// swap the response into the DOM and trigger a notification
				swap(child, event.data);
				api.triggerEvent(parent, "htmx:sseMessage", event);
			};
	
			// Register the new listener
			api.getInternalData(parent).sseEventListener = listener;
			source.addEventListener(sseEventName, listener);
		});

		// Add message handlers for every `hx-trigger="sse:*"` attribute
		queryAttributeOnThisOrChildren(parent, "hx-trigger").forEach(function(child) {

			var sseEventName = api.getAttributeValue(child, "hx-trigger");

			// Only process hx-triggers for events with the "sse:" prefix
			if (sseEventName.slice(0, 4) != "sse:") {
				return;
			}

			var listener = function(event) {

				// If parent is missing, then close SSE and remove listener
				if (maybeCloseSSESource(parent)) {
					source.removeEventListener(sseEventName, listener);
					return;
				}

				// Trigger events to be handled by the rest of htmx
				htmx.trigger(child, sseEventName, event);
				htmx.trigger(child, "htmx:sseMessage", event);
			}

			// Register the new listener
			api.getInternalData(parent).sseEventListener = listener;
			source.addEventListener(sseEventName.slice(4), listener);
		});
	}

	/**
	 * maybeCloseSSESource confirms that the parent element still exists.
	 * If not, then any associated SSE source is closed and the function returns true.
	 * 
	 * @param {HTMLElement} elt 
	 * @returns boolean
	 */
	function maybeCloseSSESource(elt) {
		if (!api.bodyContains(elt)) {
			var source = api.getInternalData(elt, "sseEventSource");        
			if (source != undefined) {
				source.close();
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
	function queryAttributeOnThisOrChildren(elt, attributeName) {

		var result = [];

		// If the parent element also contains the requested attribute, then add it to the results too.
		if (api.hasAttribute(elt, attributeName)) {
			result.push(elt);
		}

		// Search all child nodes that match the requested attribute
		elt.querySelectorAll("[" + attributeName + "], [data-" + attributeName + "]").forEach(function(node) {
			result.push(node);
		});

		return result;
	}

	/**
	 * @param {HTMLElement} elt
	 * @param {string} content 
	 */
	function swap(elt, content) {

		api.withExtensions(elt, function(extension) {
			content = extension.transformResponse(content, null, elt);
		});

		var swapSpec = api.getSwapSpecification(elt);
		var target = api.getTarget(elt);
		var settleInfo = api.makeSettleInfo(elt);

		api.selectAndSwap(swapSpec.swapStyle, elt, target, content, settleInfo);
		api.settleImmediately(settleInfo.tasks);
	}

})();