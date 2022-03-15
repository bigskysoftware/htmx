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
		 * init is called once, when this extension is first registered.
		 * @param {import("../htmx").HtmxInternalApi} apiRef
		 */
		init: function(apiRef) {

			// Store reference to internal API
			api = apiRef;

			// Default function for creating new EventSource objects
			if (htmx.createWebSocket == undefined) {
				htmx.createWebSocket = createWebSocket;
			}

			// Default setting for reconnect delay
			if (htmx.config.wsReconnectDelay == undefined) {
				htmx.config.wsReconnectDelay = "full-jitter";
			}
		},

		/**
		 * onEvent handles all events passed to this extension.
		 *
		 * @param {string} name
		 * @param {Event} evt
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

				forEach(queryAttributeOnThisOrChildren(parent, "ws-connect"), function(child) {
					ensureWebSocket(child)
				});
				forEach(queryAttributeOnThisOrChildren(parent, "ws-send"), function (child) {
					ensureWebSocketSend(child)
				});
			}
		}
	});

	function splitOnWhitespace(trigger) {
		return trigger.trim().split(/\s+/);
	}

	function getLegacyWebsocketURL(elt) {
		var legacySSEValue = api.getAttributeValue(elt, "hx-ws");
		if (legacySSEValue) {
			var values = splitOnWhitespace(legacySSEValue);
			for (var i = 0; i < values.length; i++) {
				var value = values[i].split(/:(.+)/);
				if (value[0] === "connect") {
					return value[1];
				}
			}
		}
	}

	/**
	 * ensureWebSocket creates a new WebSocket on the designated element, using
	 * the element's "ws-connect" attribute.
	 * @param {HTMLElement} elt
	 * @param {number=} retryCount
	 * @returns
	 */
	function ensureWebSocket(elt, retryCount) {

		// If the element containing the WebSocket connection no longer exists, then
		// do not connect/reconnect the WebSocket.
		if (!api.bodyContains(elt)) {
			return;
		}

		// Get the source straight from the element's value
		var wssSource = api.getAttributeValue(elt, "ws-connect")

		if (wssSource == null || wssSource === "") {
			var legacySource = getLegacyWebsocketURL(elt);
			if (legacySource == null) {
				return;
			} else {
				wssSource = legacySource;
			}
		}

		// Default value for retryCount
		if (retryCount == undefined) {
			retryCount = 0;
		}

		// Guarantee that the wssSource value is a fully qualified URL
		if (wssSource.indexOf("/") == 0) {
			var base_part = location.hostname + (location.port ? ':'+location.port: '');
			if (location.protocol == 'https:') {
				wssSource = "wss://" + base_part + wssSource;
			} else if (location.protocol == 'http:') {
				wssSource = "ws://" + base_part + wssSource;
			}
		}

		// Create a new WebSocket and event handlers
		/** @type {WebSocket} */
		var socket = htmx.createWebSocket(wssSource);

		var messageQueue = [];

		socket.onopen = function (e) {
			retryCount = 0;
			handleQueuedMessages(messageQueue, socket);
		}

		socket.onclose = function (e) {
			// If Abnormal Closure/Service Restart/Try Again Later, then set a timer to reconnect after a pause.
			if ([1006, 1012, 1013].indexOf(e.code) >= 0) {
				var delay = getWebSocketReconnectDelay(retryCount);
				setTimeout(function() {
					ensureWebSocket(elt, retryCount+1);
				}, delay);
			}
		};

		socket.onerror = function (e) {
			api.triggerErrorEvent(elt, "htmx:wsError", {error:e, socket:socket});
			maybeCloseWebSocketSource(elt);
		};

		socket.addEventListener('message', function (event) {
			if (maybeCloseWebSocketSource(elt)) {
				return;
			}

			var response = event.data;
			api.withExtensions(elt, function(extension){
				response = extension.transformResponse(response, null, elt);
			});

			var settleInfo = api.makeSettleInfo(elt);
			var fragment = api.makeFragment(response);

			if (fragment.children.length) {
				var children = Array.from(fragment.children);
				for (var i = 0; i < children.length; i++) {
					api.oobSwap(api.getAttributeValue(children[i], "hx-swap-oob") || "true", children[i], settleInfo);
				}
			}

			api.settleImmediately(settleInfo.tasks);
		});

		// Put the WebSocket into the HTML Element's custom data.
		api.getInternalData(elt).webSocket = socket;
		api.getInternalData(elt).webSocketMessageQueue = messageQueue;
	}

	/**
	 * ensureWebSocketSend attaches trigger handles to elements with
	 * "ws-send" attribute
	 * @param {HTMLElement} elt
	 */
	function ensureWebSocketSend(elt) {
		var legacyAttribute = api.getAttributeValue(elt, "hx-ws");
		if (legacyAttribute && legacyAttribute !== 'send') {
			return;
		}

		var webSocketParent = api.getClosestMatch(elt, hasWebSocket)
		processWebSocketSend(webSocketParent, elt);
	}

	/**
	 * hasWebSocket function checks if a node has webSocket instance attached
	 * @param {HTMLElement} node
	 * @returns {boolean}
	 */
	function hasWebSocket(node) {
		return api.getInternalData(node).webSocket != null;
	}

	/**
	 * processWebSocketSend adds event listeners to the <form> element so that
	 * messages can be sent to the WebSocket server when the form is submitted.
	 * @param {HTMLElement} parent
	 * @param {HTMLElement} child
	 */
	function processWebSocketSend(parent, child) {
		var nodeData = api.getInternalData(child);
		let triggerSpecs = api.getTriggerSpecs(child);
		triggerSpecs.forEach(function(ts) {
			api.addTriggerHandler(child, ts, nodeData, function (evt) {
				var webSocket = api.getInternalData(parent).webSocket;
				var messageQueue = api.getInternalData(parent).webSocketMessageQueue;
				var headers = api.getHeaders(child, parent);
				var results = api.getInputValues(child, 'post');
				var errors = results.errors;
				var rawParameters = results.values;
				var expressionVars = api.getExpressionVars(child);
				var allParameters = api.mergeObjects(rawParameters, expressionVars);
				var filteredParameters = api.filterValues(allParameters, child);
				filteredParameters['HEADERS'] = headers;
				if (errors && errors.length > 0) {
					api.triggerEvent(child, 'htmx:validation:halted', errors);
					return;
				}
				webSocketSend(webSocket, JSON.stringify(filteredParameters), messageQueue);
				if(api.shouldCancel(evt, child)){
					evt.preventDefault();
				}
			});
		});
	}

	/**
	 * webSocketSend provides a safe way to send messages through a WebSocket.
	 * It checks that the socket is in OPEN state and, otherwise, awaits for it.
	 * @param {WebSocket} socket
	 * @param {string} message
	 * @param {string[]} messageQueue
	 * @return {boolean}
	 */
	function webSocketSend(socket, message, messageQueue) {
		if (socket.readyState != socket.OPEN) {
			messageQueue.push(message);
		} else {
			socket.send(message);
		}
	}

	/**
	 * handleQueuedMessages sends messages awaiting in the message queue
	 */
	function handleQueuedMessages(messageQueue, socket) {
		while (messageQueue.length > 0) {
			var message = messageQueue[0]
			if (socket.readyState == socket.OPEN) {
				socket.send(message);
				messageQueue.shift()
			} else {
				break;
			}
		}
	}

	/**
	 * getWebSocketReconnectDelay is the default easing function for WebSocket reconnects.
	 * @param {number} retryCount // The number of retries that have already taken place
	 * @returns {number}
	 */
	function getWebSocketReconnectDelay(retryCount) {

		/** @type {"full-jitter" | (retryCount:number) => number} */
		var delay = htmx.config.wsReconnectDelay;
		if (typeof delay === 'function') {
			return delay(retryCount);
		}
		if (delay === 'full-jitter') {
			var exp = Math.min(retryCount, 6);
			var maxDelay = 1000 * Math.pow(2, exp);
			return maxDelay * Math.random();
		}

		logError('htmx.config.wsReconnectDelay must either be a function or the string "full-jitter"');
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
	 * queryAttributeOnThisOrChildren returns all nodes that contain the requested attributeName, INCLUDING THE PROVIDED ROOT ELEMENT.
	 *
	 * @param {HTMLElement} elt
	 * @param {string} attributeName
	 */
	function queryAttributeOnThisOrChildren(elt, attributeName) {

		var result = []

		// If the parent element also contains the requested attribute, then add it to the results too.
		if (api.hasAttribute(elt, attributeName) || api.hasAttribute(elt, "hx-ws")) {
			result.push(elt);
		}

		// Search all child nodes that match the requested attribute
		elt.querySelectorAll("[" + attributeName + "], [data-" + attributeName + "], [data-hx-ws], [hx-ws]").forEach(function(node) {
			result.push(node)
		})

		return result
	}

	/**
	 * @template T
	 * @param {T[]} arr
	 * @param {(T) => void} func
	 */
	function forEach(arr, func) {
		if (arr) {
			for (var i = 0; i < arr.length; i++) {
				func(arr[i]);
			}
		}
	}

})();

