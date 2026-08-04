(() => {
    let api;
    
    // Build a CSS selector for querySelectorAll, respecting prefix + metaCharacter
    function wsSelector(suffix) {
        let mc = htmx.config.metaCharacter || ':';
        let sel = `[${CSS.escape('hx-ws' + mc + suffix)}]`;
        if (htmx.config.prefix) sel += `,[${CSS.escape(htmx.config.prefix + 'ws' + mc + suffix)}]`;
        return sel;
    }


    // ========================================
    // CONFIGURATION
    // ========================================
    
    function getConfig(element) {
        let hxConfig = api.HCON.parse(api.attributeValue(element, 'hx-config')).ws || {};

        return {
            reconnect: true,
            reconnectCodes: [
                1001, // Going Away
                1005, // No Status Received
                1006, // Abnormal Closure
                1011, // Internal Error
                1012, // Service Restart
                1013, // Try Again Later
                1014  // Bad Gateway
            ],
            reconnectDelay: 500,
            reconnectMaxDelay: 60000,
            reconnectMaxAttempts: Infinity,
            reconnectJitter: 0.3,
            pauseOnBackground: true,
            pendingMessageTTL: 30000,
            ...htmx.config.ws, // global defaults
            ...hxConfig // hx-config overrides
        };
    }
    
    // ========================================
    // URL NORMALIZATION
    // ========================================
    
    function normalizeWebSocketUrl(url) {
        // Already a WebSocket URL
        if (url.startsWith('ws://') || url.startsWith('wss://')) {
            return url;
        }

        // Convert http(s):// to ws(s)://
        if (url.startsWith('http://')) {
            return 'ws://' + url.slice(7);
        }
        if (url.startsWith('https://')) {
            return 'wss://' + url.slice(8);
        }

        // Relative URL - build absolute ws(s):// URL
        let protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        let host = window.location.host;
        
        if (url.startsWith('//')) {
            // Protocol-relative URL
            return protocol + url;
        }
        
        if (url.startsWith('/')) {
            // Absolute path
            return protocol + '//' + host + url;
        }
        
        // Relative path - resolve against current location
        let basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        return protocol + '//' + host + basePath + url;
    }
    
    // ========================================
    // CONNECTIONS
    // ========================================
    
    const connections = new Map();
    
    function getOrCreateConnection(url, element) {
        let normalizedUrl = normalizeWebSocketUrl(url);

        if (connections.has(normalizedUrl)) {
            return connections.get(normalizedUrl);
        }

        let connection = {
            url: normalizedUrl,
            config: getConfig(element),
            socket: null,
            attempt: 0,
            timer: null,
            pendingMessages: new Map(),
            queue: [],
            receiving: Promise.resolve(),
            sending: Promise.resolve(),
            abortController: null,
            visibilityHandler: null,
            cancelled: false
        };

        if (!api.triggerHtmxEvent(element, 'htmx:ws:before:connection', {connection}) || connection.cancelled) {
            api.triggerHtmxEvent(element, 'htmx:ws:close', {
                connection, reason: 'cancelled', code: null
            });
            return null;
        }

        // Event passed - now store in registry and create socket
        connections.set(normalizedUrl, connection);
        createWebSocket(normalizedUrl, connection);

        let config = connection.config;
        if (config.pauseOnBackground) {
            connection.visibilityHandler = () => {
                if (document.hidden) {
                    if (connection.socket && connection.socket.readyState === WebSocket.OPEN) {
                        connection.socket.close();
                    }
                } else if (!connection.socket || connection.socket.readyState === WebSocket.CLOSED) {
                    connection.attempt = 0;
                    createWebSocket(normalizedUrl, connection);
                }
            };
            document.addEventListener('visibilitychange', connection.visibilityHandler);
        }

        return connection;
    }
    
    function findConnectedElement(url) {
        let sel = wsSelector('connect') + ',' + wsSelector('send');
        for (let el of document.querySelectorAll(sel)) {
            if (el._htmx?.ws?.url === url) return el;
        }
        return null;
    }

    // Close and fully clean up an orphaned connection (no owning element in DOM)
    function cleanupOrphanedConnection(url, connection) {
        if (connection.timer) clearTimeout(connection.timer);
        if (connection.visibilityHandler) {
            document.removeEventListener('visibilitychange', connection.visibilityHandler);
        }
        if (connection.abortController) {
            connection.abortController.abort();
        }
        connection.pendingMessages.clear();
        connection.queue.length = 0;
        if (connection.socket) {
            try {
                if (connection.socket.readyState === WebSocket.OPEN || connection.socket.readyState === WebSocket.CONNECTING) {
                    connection.socket.close();
                }
            } catch (e) {
                // Socket may already be in an invalid state
            }
        }
        connections.delete(url);
    }

    function createWebSocket(url, connection) {
        // Abort old socket's listeners and close it
        if (connection.abortController) {
            connection.abortController.abort();
        }
        if (connection.socket) {
            let oldSocket = connection.socket;
            connection.socket = null;
            try {
                if (oldSocket.readyState === WebSocket.OPEN || oldSocket.readyState === WebSocket.CONNECTING) {
                    oldSocket.close();
                }
            } catch (e) {
                // Socket may already be in an invalid state
            }
        }

        try {
            connection.socket = new WebSocket(url, connection.config?.protocols);
            let ac = new AbortController();
            connection.abortController = ac;
            let opts = { signal: ac.signal };

            connection.socket.addEventListener('open', () => {
                let elt = findConnectedElement(url);
                if (elt) {
                    api.triggerHtmxEvent(elt, 'htmx:ws:after:connection', {connection});
                } else {
                    // Element was removed while connecting — orphaned socket
                    cleanupOrphanedConnection(url, connection);
                    return;
                }
                connection.attempt = 0;
                flushQueue(connection);
            }, opts);

            connection.socket.addEventListener('message', (event) => {
                connection.receiving = connection.receiving
                    .then(() => handleMessage(connection, event))
                    .catch(error => {
                        let elt = findConnectedElement(connection.url);
                        if (elt) api.triggerHtmxEvent(elt, 'htmx:ws:error', { url: connection.url, error });
                    });
            }, opts);

            connection.socket.addEventListener('close', (event) => {
                if (event.target !== connection.socket) return;

                let elt = findConnectedElement(url);
                if (elt) api.triggerHtmxEvent(elt, 'htmx:ws:close', {
                    connection, reason: 'closed', code: event.code
                });

                if (!connections.has(url)) return;

                let config = connection.config;
                if (config.pauseOnBackground && document.hidden) return;

                if (config.reconnect && config.reconnectCodes.includes(event.code) && findConnectedElement(url)) {
                    scheduleReconnect(url, connection);
                } else {
                    // No element or reconnect disabled — full cleanup
                    cleanupOrphanedConnection(url, connection);
                }
            }, opts);

            connection.socket.addEventListener('error', (error) => {
                let elt = findConnectedElement(url);
                if (elt) api.triggerHtmxEvent(elt, 'htmx:ws:error', { url, error });
            }, opts);

        } catch (error) {
            let elt = findConnectedElement(url);
            if (elt) api.triggerHtmxEvent(elt, 'htmx:ws:error', { url, error });
        }
    }
    
    function scheduleReconnect(url, connection) {
        let config = connection.config;

        connection.attempt++;
        let attempt = connection.attempt;

        if (!config.reconnect || attempt > config.reconnectMaxAttempts) {
            cleanupOrphanedConnection(url, connection);
            return;
        }

        let baseDelay = htmx.parseInterval(config.reconnectDelay) ?? config.reconnectDelay;
        let maxDelay = htmx.parseInterval(config.reconnectMaxDelay) ?? config.reconnectMaxDelay;

        let delay = Math.min(
            baseDelay * Math.pow(2, attempt - 1),
            maxDelay
        );

        if (config.reconnectJitter > 0) {
            let jitterRange = delay * config.reconnectJitter;
            delay = Math.max(0, delay + (Math.random() * 2 - 1) * jitterRange);
        }

        let elt = findConnectedElement(url);
        if (elt) {
            connection.cancelled = false;
            if (!api.triggerHtmxEvent(elt, 'htmx:ws:before:connection', {connection}) || connection.cancelled) {
                api.triggerHtmxEvent(elt, 'htmx:ws:close', {
                    connection, reason: 'cancelled', code: null
                });
                cleanupOrphanedConnection(url, connection);
                return;
            }
        } else {
            // Element gone — no point scheduling reconnect
            cleanupOrphanedConnection(url, connection);
            return;
        }

        connection.timer = setTimeout(() => {
            if (findConnectedElement(url)) {
                createWebSocket(url, connection);
            } else {
                cleanupOrphanedConnection(url, connection);
            }
        }, delay);
    }
    
    function closeConnection(url, element) {
        let connection = connections.get(url);
        if (!connection) return;

        if (connection.timer) clearTimeout(connection.timer);
        if (connection.visibilityHandler) {
            document.removeEventListener('visibilitychange', connection.visibilityHandler);
        }
        if (connection.abortController) {
            connection.abortController.abort();
        }
        connection.pendingMessages.clear();
        connection.queue.length = 0;
        api.triggerHtmxEvent(element, 'htmx:ws:close', {
            connection, reason: 'removed', code: null
        });
        if (connection.socket && connection.socket.readyState === WebSocket.OPEN) {
            connection.socket.close();
        }
        connections.delete(url);
    }
    
    // ========================================
    // PENDING MESSAGE MANAGEMENT
    // ========================================
    
    function cleanupExpiredMessages(connection) {
        let config = connection.config;
        let now = Date.now();
        let timeout = config.pendingMessageTTL || 30000;

        for (let [messageId, pending] of connection.pendingMessages) {
            if (now - pending.timestamp > timeout) {
                connection.pendingMessages.delete(messageId);
            }
        }
    }
    
    // ========================================
    // MESSAGES
    // ========================================

    function transmitMessage(connection, element, message) {
        try {
            connection.socket.send(message.data);
            let messageId = message.headers['HX-Message-ID'];
            if (messageId) connection.pendingMessages.set(messageId, { element, timestamp: Date.now() });
            api.triggerHtmxEvent(element, 'htmx:ws:after:message:outgoing', {message});
        } catch (error) {
            api.triggerHtmxEvent(element, 'htmx:ws:error', { url: connection.url, error });
        }
    }

    function flushQueue(connection) {
        while (connection.queue.length && connection.socket?.readyState === WebSocket.OPEN) {
            let queuedMessage = connection.queue.shift();
            transmitMessage(connection, queuedMessage.element, queuedMessage.message);
        }
    }

    async function sendMessage(element, event) {
        // hx-ws:send="/url" creates its own connection; hx-ws:send (no value) uses ancestor's
        let sendAttr = api.attributeValue(element, 'hx-ws:send');
        let url = (sendAttr && sendAttr !== 'true') ? sendAttr : null;
        if (!url) {
            let ancestor = element.closest(wsSelector('connect'));
            if (ancestor) {
                url = api.attributeValue(ancestor, 'hx-ws:connect');
            }
        }

        if (!url) {
            api.triggerHtmxEvent(element, 'htmx:ws:error', {
                url: null, error: 'No WebSocket connection found for element'
            });
            return;
        }

        let normalizedUrl = normalizeWebSocketUrl(url);
        let connection = connections.get(normalizedUrl);

        if (!connection) {
            api.triggerHtmxEvent(element, 'htmx:ws:error', { url: normalizedUrl, error: 'Connection not open' });
            return;
        }

        // [Correlation] Cleanup expired pending messages periodically
        cleanupExpiredMessages(connection);

        // Build headers using core's request context (same as HTTP requests)
        let ctx = api.createRequestContext(element, event);
        let headers = {...ctx.request.headers};
        delete headers['Accept'];

        // [Correlation] Add message ID as a header
        headers['HX-Message-ID'] = crypto.randomUUID();

        // Build outgoing values from form data.
        let form = element.form || element.closest('form');
        let formData = api.collectFormData(element, form, event.submitter);

        // Preserve multi-value form fields (checkboxes, multi-selects)
        let values = {};
        for (let [key, value] of formData) {
            if (key in values) {
                values[key] = [].concat(values[key], value);
            } else {
                values[key] = value;
            }
        }

        // Merge hx-vals after serialization to preserve JS types (numbers, booleans)
        let hxValsResult = api.getAttributeObject(element, 'hx-vals', obj => Object.assign(values, obj));

        let outgoingMessage = connection.sending.then(async () => {
            if (hxValsResult) await hxValsResult;
            delete values.headers;

            let pendingWork = [];
            let message = {
                headers,
                values,
                data: undefined
            };
            let detail = {
                message,
                cancelled: false,
                waitUntil(promise) {
                    pendingWork.push(Promise.resolve(promise));
                }
            };
            let shouldSend = api.triggerHtmxEvent(element, 'htmx:ws:before:message:outgoing', detail);

            try {
                await Promise.all(pendingWork);
                if (!shouldSend || detail.cancelled) return;

                message.data ??= JSON.stringify({ ...message.values, headers: message.headers });
                if (connections.get(normalizedUrl) !== connection) {
                    api.triggerHtmxEvent(element, 'htmx:ws:error', { url: normalizedUrl, error: 'Connection closed' });
                    return;
                }

                if (connection.socket?.readyState === WebSocket.OPEN) {
                    transmitMessage(connection, element, message);
                } else {
                    connection.queue.push({element, message});
                }
            } catch (error) {
                api.triggerHtmxEvent(element, 'htmx:ws:error', { url: normalizedUrl, error });
            }
        });
        connection.sending = outgoingMessage.catch(() => {});
        await outgoingMessage;
    }
    
    // ========================================
    // MESSAGE RECEIVING & ROUTING
    // ========================================
    
    async function handleMessage(connection, event) {
        let data = event.data;
        let textResult;
        let jsonResult;
        let arrayBufferResult;
        let blobResult;
        let pendingWork = [];
        let message = {
            data,
            type: typeof data === 'string' ? 'text' : 'binary',
            text() {
                return textResult ??= typeof data === 'string'
                    ? Promise.resolve(data)
                    : data instanceof Blob
                        ? data.text()
                        : Promise.resolve(new TextDecoder().decode(data));
            },
            json() {
                return jsonResult ??= message.text().then(JSON.parse);
            },
            arrayBuffer() {
                return arrayBufferResult ??= data instanceof ArrayBuffer
                    ? Promise.resolve(data)
                    : data instanceof Blob
                        ? data.arrayBuffer()
                        : Promise.resolve(new TextEncoder().encode(data).buffer);
            },
            blob() {
                return blobResult ??= data instanceof Blob
                    ? Promise.resolve(data)
                    : Promise.resolve(new Blob([data]));
            }
        };

        let json = null;
        if (message.type === 'text') {
            try {
                json = await message.json();
            } catch (e) {
                // Non-JSON text is treated as raw HTML.
            }
        }

        // [Correlation] Cleanup expired pending messages on every message
        cleanupExpiredMessages(connection);

        let messageId = json?.headers?.['HX-Message-ID'];
        let pending = connection.pendingMessages.get(messageId);
        if (pending) connection.pendingMessages.delete(messageId);

        // Route associated incoming messages through their sender.
        let element = pending?.element;
        if (!element?.isConnected) element = findConnectedElement(connection.url);

        if (!element) {
            // No element in DOM for this connection — orphan cleanup
            cleanupOrphanedConnection(connection.url, connection);
            return;
        }

        let detail = {
            message,
            cancelled: false,
            waitUntil(promise) {
                pendingWork.push(Promise.resolve(promise));
            }
        };
        let shouldProcess = api.triggerHtmxEvent(element, 'htmx:ws:before:message:incoming', detail);

        await Promise.all(pendingWork);
        if (!shouldProcess || detail.cancelled) return;

        // JSON with 'content' or 'payload' field: swap the HTML
        // Raw (non-JSON) string: swap the entire string as HTML
        // JSON without 'content'/'payload': data-only message, no swap (handle via events)
        let html;
        if (json) {
            if (json.content !== undefined) {
                html = json.content;
            } else if (json.payload !== undefined) {
                html = json.payload; // backwards compat
                // Warn once per connection (not on every message)
                if (!connection._payloadWarnFired) {
                    console.warn('htmx: [hx-ws] json.payload is deprecated; use json.content instead');
                    connection._payloadWarnFired = true;
                }
            }
        } else if (message.type === 'text') {
            html = await message.text();
        }
        if (html != null) {
            let target = json?.target || api.attributeValue(element, 'hx-target');
            let swap = json?.swap || api.attributeValue(element, 'hx-swap') || htmx.config.defaultSwap;
            if (!/(?:^|\s)swapEmpty(?::(?:true|false))?(?=\s|$)/.test(swap)) swap += ' swapEmpty:false';

            await htmx.swap({
                sourceElement: element,
                target: target || element,
                swap,
                select: json?.select ?? api.attributeValue(element, 'hx-select'),
                selectOOB: api.attributeValue(element, 'hx-select-oob'),
                text: html,
                transition: false
            });
        }

        api.triggerHtmxEvent(element, 'htmx:ws:after:message:incoming', {message});
    }
    
    // ========================================
    // ELEMENT LIFECYCLE
    // ========================================
    
    function initializeElement(element) {
        api.htmxProp(element).ws ??= {};
        if (element._htmx.ws.initialized) return;

        let connectUrl = api.attributeValue(element, 'hx-ws:connect');
        if (!connectUrl) return;

        let specString = api.attributeValue(element, 'hx-trigger') || 'load';
        api.onTrigger(element, specString, () => {
            if (element._htmx?.ws?.url) return;
            let connection = getOrCreateConnection(connectUrl, element);
            if (connection) {
                element._htmx.ws.url = connection.url;
            }
        });
        element._htmx.ws.initialized = true;
    }
    
    function initializeSendElement(element) {
        api.htmxProp(element).ws ??= {};
        if (element._htmx.ws.sendInitialized) return;

        let sendAttr = api.attributeValue(element, 'hx-ws:send');
        let sendUrl = (sendAttr && sendAttr !== 'true') ? sendAttr : null;
        let specString = api.attributeValue(element, 'hx-trigger');
        if (!specString) {
            specString = element.matches('form') ? 'submit' :
                         element.matches('input:not([type=button]):not([type=submit]),select,textarea') ? 'change' :
                         'click';
        }

        api.onTrigger(element, specString, async (evt) => {
            if (element.matches('form') && evt.type === 'submit') {
                evt.preventDefault();
            }
            if (sendUrl && !element._htmx?.ws?.url) {
                let connection = getOrCreateConnection(sendUrl, element);
                if (connection) {
                    element._htmx.ws.url = connection.url;
                }
            }
            await sendMessage(element, evt);
        });
        element._htmx.ws.sendInitialized = true;
    }
    
    function cleanupElement(element) {
        let url = element._htmx?.ws?.url;
        if (!url || !connections.has(url)) return;
        element._htmx.ws.url = null;
        if (!findConnectedElement(url)) {
            closeConnection(url, element);
        }
    }
    
    // ========================================
    // BACKWARD COMPATIBILITY
    // ========================================
    
    function checkLegacyAttributes(element) {
        if (element.hasAttribute('ws-connect') || element.hasAttribute('ws-send')) {
            console.warn('htmx: [hx-ws] legacy attributes ws-connect and ws-send are deprecated; use hx-ws:connect and hx-ws:send instead');

            if (element.hasAttribute('ws-connect')) {
                let url = element.getAttribute('ws-connect');
                let mc = htmx.config.metaCharacter || ':';
                let attr = (htmx.config.prefix || 'hx-') + 'ws' + mc + 'connect';
                if (!element.hasAttribute(attr)) {
                    element.setAttribute(attr, url);
                }
            }

            if (element.hasAttribute('ws-send')) {
                let mc = htmx.config.metaCharacter || ':';
                let attr = (htmx.config.prefix || 'hx-') + 'ws' + mc + 'send';
                if (!element.hasAttribute(attr)) {
                    element.setAttribute(attr, '');
                }
            }
        }
    }
    
    // ========================================
    // EXTENSION REGISTRATION
    // ========================================
    
    htmx.registerExtension('ws', {
        init: (internalAPI) => {
            api = internalAPI;
            
            // Initialize default config if not set
            if (!htmx.config.ws) {
                htmx.config.ws = {};
            }
        },
        
        htmx_after_process: (element) => {
            const processNode = (node) => {
                checkLegacyAttributes(node);

                if (api.attributeValue(node, 'hx-ws:connect') != null) {
                    initializeElement(node);
                }

                if (api.attributeValue(node, 'hx-ws:send') != null) {
                    initializeSendElement(node);
                }
            };

            processNode(element);

            let sel = wsSelector('connect') + ',' + wsSelector('send') + ',[ws-connect],[ws-send]';
            element.querySelectorAll(sel).forEach(processNode);
        },
        
        htmx_before_cleanup: (element) => {
            cleanupElement(element);
        }
    });
    
    // Expose connections for testing
    if (typeof window !== 'undefined' && window.htmx) {
        // Clean up all WS connections on page navigation to prevent browser errors
        window.addEventListener('pagehide', () => {
            connections.forEach((connection) => {
                if (connection.socket) {
                    connection.socket.close(1000, 'page navigating away');
                }
            });
        });

        window.htmx.ext = window.htmx.ext || {};
        window.htmx.ext.ws = {
            getRegistry: () => ({
                clear: () => {
                    let activeConnections = Array.from(connections.values());
                    connections.clear(); // Clear first to prevent reconnects

                    activeConnections.forEach(connection => {
                        if (connection.timer) {
                            clearTimeout(connection.timer);
                        }
                        if (connection.visibilityHandler) {
                            document.removeEventListener('visibilitychange', connection.visibilityHandler);
                        }
                        if (connection.abortController) {
                            connection.abortController.abort();
                        }
                        if (connection.socket) {
                            connection.socket.close();
                        }
                        connection.pendingMessages.clear();
                        connection.queue.length = 0;
                    });
                },
                get: (key) => connections.get(normalizeWebSocketUrl(key)),
                has: (key) => connections.has(normalizeWebSocketUrl(key)),
                get size() { return connections.size; }
            })
        };
    }
})();
