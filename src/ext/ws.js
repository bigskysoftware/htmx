/*
WebSockets Extension
============================
This extension adds support for WebSockets to htmx.  See /www/extensions/ws.md for usage instructions.

*/

(function(){

	/** @type {import("../htmx").HtmxInternalApi} */
	var api;

	htmx.defineExtension("ws", {

		/**
		 * init stores a reference to the internal API.
		 * @param {import("../htmx").HtmxInternalApi} apiRef 
		 */
		init: function(apiRef) {
			api = apiRef;
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

				if (internalData.webSocket != undefined) {
					internalData.webSocket.close();
				}
				return;
	
			// Try to create EventSources when elements are processed
			case "htmx:afterProcessNode":

				var parent = evt.target;

				// get URL from element's attribute
				var wsURL = api.getAttributeValue(evt.target, "ws-url")

				if (wsURL == undefined) {
					return;
				}
		
				// Default function for creating new EventSource objects
				if (htmx.createWebSocket == undefined) {
					htmx.createWebSocket = createWebSocket;
				}

				if (htmx.config.wsReconnectDelay == undefined) {
					htmx.config.wsReconnectDelay = "full-jitter";
				}

				// Connect to the EventSource
				var socket = ensureWebSocket(parent, wsURL);

				source.onerror = function (err) {
					api.triggerErrorEvent(parent, "htmx:sseError", {error:err, source:source});
					maybeCloseWebSocketource(api, parent);
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
	 * createWebSocket is the default method for creating new WebSocket objects.
	 * it is hoisted into htmx.createWebSocket to be overridden by the user, if needed.
	 * 
	 * @param {string} url 
	 * @returns WebSocket
	 */
	 function createWebSocket(url){
		return new WebSocket(url, []);
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
	function queryAttributeOnThisOrChildren(elt, attributeName) {

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

	/********************************************/
	// ORIGINAL WS CODE

	function processWebSocketInfo(elt, nodeData, info) {
		var values = splitOnWhitespace(info);
		for (var i = 0; i < values.length; i++) {
			var value = values[i].split(/:(.+)/);
			if (value[0] === "connect") {
				ensureWebSocket(elt, value[1], 0);
			}
			if (value[0] === "send") {
				processWebSocketSend(elt);
			}
		}
	}

	function ensureWebSocket(elt, wssSource, retryCount) {
		if (!bodyContains(elt)) {
			return;  // stop ensuring websocket connection when socket bearing element ceases to exist
		}

		if (wssSource.indexOf("/") == 0) {  // complete absolute paths only
			var base_part = location.hostname + (location.port ? ':'+location.port: '');
			if (location.protocol == 'https:') {
				wssSource = "wss://" + base_part + wssSource;
			} else if (location.protocol == 'http:') {
				wssSource = "ws://" + base_part + wssSource;
			}
		}
		var socket = htmx.createWebSocket(wssSource);
		socket.onerror = function (e) {
			triggerErrorEvent(elt, "htmx:wsError", {error:e, socket:socket});
			maybeCloseWebSocketSource(elt);
		};

		socket.onclose = function (e) {
			if ([1006, 1012, 1013].indexOf(e.code) >= 0) {  // Abnormal Closure/Service Restart/Try Again Later
				var delay = getWebSocketReconnectDelay(retryCount);
				setTimeout(function() {
					ensureWebSocket(elt, wssSource, retryCount+1);  // creates a websocket with a new timeout
				}, delay);
			}
		};
		socket.onopen = function (e) {
			retryCount = 0;
		}

		api.getInternalData(elt).webSocket = socket;
		socket.addEventListener('message', function (event) {
			if (maybeCloseWebSocketSource(elt)) {
				return;
			}

			var response = event.data;
			withExtensions(elt, function(extension, api){
				response = extension.transformResponse(response, null, elt, api);
			});

			var settleInfo = makeSettleInfo(elt);
			var fragment = makeFragment(response);
			var children = toArray(fragment.children);
			for (var i = 0; i < children.length; i++) {
				var child = children[i];
				oobSwap(getAttributeValue(child, "hx-swap-oob") || "true", child, settleInfo);
			}

			settleImmediately(settleInfo.tasks);
		});
	}

	/**
	 * maybeCloseWebSocketSource checks to the if the element that created the WebSocket
	 * still exists in the DOM.  If NOT, then the WebSocket is closed and this function 
	 * returns TRUE.  If the element DOES EXIST, then no action is taken, and this function
	 * returns FALSE.
	 * 
	 * @param {*} elt 
	 * @returns 
	 */
	function maybeCloseWebSocketSource(elt) {
		if (!api.bodyContains(elt)) {
			api.getInternalData(elt).webSocket.close();
			return true;
		}
		return false;
	}

	function processWebSocketSend(elt) {
		var webSocketSourceElt = getClosestMatch(elt, function (parent) {
			return api.getInternalData(parent).webSocket != null;
		});
		if (webSocketSourceElt) {
			elt.addEventListener(getTriggerSpecs(elt)[0].trigger, function (evt) {
				var webSocket = api.getInternalData(webSocketSourceElt).webSocket;
				var headers = getHeaders(elt, webSocketSourceElt);
				var results = getInputValues(elt, 'post');
				var errors = results.errors;
				var rawParameters = results.values;
				var expressionVars = getExpressionVars(elt);
				var allParameters = mergeObjects(rawParameters, expressionVars);
				var filteredParameters = filterValues(allParameters, elt);
				filteredParameters['HEADERS'] = headers;
				if (errors && errors.length > 0) {
					triggerEvent(elt, 'htmx:validation:halted', errors);
					return;
				}
				webSocket.send(JSON.stringify(filteredParameters));
				if(shouldCancel(elt)){
					evt.preventDefault();
				}
			});
		} else {
			triggerErrorEvent(elt, "htmx:noWebSocketSourceError");
		}
	}

	function getWebSocketReconnectDelay(retryCount) {
		var delay = htmx.config.wsReconnectDelay;
		if (typeof delay === 'function') {
			// @ts-ignore
			return delay(retryCount);
		}
		if (delay === 'full-jitter') {
			var exp = Math.min(retryCount, 6);
			var maxDelay = 1000 * Math.pow(2, exp);
			return maxDelay * Math.random();
		}
		logError('htmx.config.wsReconnectDelay must either be a function or the string "full-jitter"');
	}

})();