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
            maxOutgoingMessagesQueueSize: 100,
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
    
    const connections = new Set();
    
    function getOrCreateConnection(url, element) {
        if (element._htmx.ws.connection) return element._htmx.ws.connection;
        let normalizedUrl = normalizeWebSocketUrl(url);

        let connection = {
            url: normalizedUrl,
            config: getConfig(element),
            socket: null,
            attempt: 0,
            timer: null,
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

        element._htmx.ws.connection = connection;
        connections.add(connection);
        createWebSocket(element, connection);

        let config = connection.config;
        if (config.pauseOnBackground) {
            connection.visibilityHandler = () => {
                if (document.hidden) {
                    if (connection.socket && connection.socket.readyState === WebSocket.OPEN) {
                        connection.socket.close();
                    }
                } else if (!connection.socket || connection.socket.readyState === WebSocket.CLOSED) {
                    connection.attempt = 0;
                    createWebSocket(element, connection);
                }
            };
            document.addEventListener('visibilitychange', connection.visibilityHandler);
        }

        return connection;
    }
    
    function cleanupConnection(element, connection) {
        if (connection.timer) clearTimeout(connection.timer);
        if (connection.visibilityHandler) {
            document.removeEventListener('visibilitychange', connection.visibilityHandler);
        }
        if (connection.abortController) {
            connection.abortController.abort();
        }
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
        if (element._htmx?.ws?.connection === connection) delete element._htmx.ws.connection;
        connections.delete(connection);
    }

    function createWebSocket(element, connection) {
        let url = connection.url;
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
                if (element.isConnected) {
                    api.triggerHtmxEvent(element, 'htmx:ws:after:connection', {connection});
                } else {
                    cleanupConnection(element, connection);
                    return;
                }
                connection.attempt = 0;
                flushQueue(connection);
            }, opts);

            connection.socket.addEventListener('message', (event) => {
                connection.receiving = connection.receiving
                    .then(() => handleMessage(element, connection, event))
                    .catch(error => {
                        if (element.isConnected) api.triggerHtmxEvent(element, 'htmx:ws:error', { url, error });
                    });
            }, opts);

            connection.socket.addEventListener('close', (event) => {
                if (event.target !== connection.socket) return;

                if (element.isConnected) api.triggerHtmxEvent(element, 'htmx:ws:close', {
                    connection, reason: 'closed', code: event.code
                });

                if (!connections.has(connection)) return;

                let config = connection.config;
                if (config.pauseOnBackground && document.hidden) return;

                if (config.reconnect && config.reconnectCodes.includes(event.code) && element.isConnected) {
                    scheduleReconnect(element, connection);
                } else {
                    cleanupConnection(element, connection);
                }
            }, opts);

            connection.socket.addEventListener('error', (error) => {
                if (element.isConnected) api.triggerHtmxEvent(element, 'htmx:ws:error', { url, error });
            }, opts);

        } catch (error) {
            if (element.isConnected) api.triggerHtmxEvent(element, 'htmx:ws:error', { url, error });
        }
    }
    
    function scheduleReconnect(element, connection) {
        let config = connection.config;

        connection.attempt++;
        let attempt = connection.attempt;

        if (!config.reconnect || attempt > config.reconnectMaxAttempts) {
            cleanupConnection(element, connection);
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

        if (element.isConnected) {
            connection.cancelled = false;
            if (!api.triggerHtmxEvent(element, 'htmx:ws:before:connection', {connection}) || connection.cancelled) {
                api.triggerHtmxEvent(element, 'htmx:ws:close', {
                    connection, reason: 'cancelled', code: null
                });
                cleanupConnection(element, connection);
                return;
            }
        } else {
            cleanupConnection(element, connection);
            return;
        }

        connection.timer = setTimeout(() => {
            if (element.isConnected) {
                createWebSocket(element, connection);
            } else {
                cleanupConnection(element, connection);
            }
        }, delay);
    }
    
    // ========================================
    // MESSAGES
    // ========================================

    function transmitMessage(connection, element, message) {
        try {
            connection.socket.send(message.data);
            api.triggerHtmxEvent(element, 'htmx:ws:after:message:outgoing', {connection, message});
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
        let owner = element;
        if (!url) {
            owner = element.closest(wsSelector('connect'));
            if (owner) {
                url = api.attributeValue(owner, 'hx-ws:connect');
            }
        }

        if (!url) {
            api.triggerHtmxEvent(element, 'htmx:ws:error', {
                url: null, error: 'No WebSocket connection found for element'
            });
            return;
        }

        let normalizedUrl = normalizeWebSocketUrl(url);
        let connection = owner._htmx?.ws?.connection;

        if (!connection) {
            api.triggerHtmxEvent(element, 'htmx:ws:error', { url: normalizedUrl, error: 'Connection not open' });
            return;
        }

        // Build headers using core's request context (same as HTTP requests)
        let ctx = api.createRequestContext(element, event);
        let headers = {...ctx.request.headers};
        delete headers['Accept'];

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
                connection,
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
                if (!connections.has(connection)) {
                    api.triggerHtmxEvent(element, 'htmx:ws:error', { url: normalizedUrl, error: 'Connection closed' });
                    return;
                }

                if (connection.socket?.readyState === WebSocket.OPEN) {
                    transmitMessage(connection, element, message);
                } else if (connection.queue.length >= connection.config.maxOutgoingMessagesQueueSize) {
                    api.triggerHtmxEvent(element, 'htmx:ws:error', {
                        url: normalizedUrl,
                        error: 'Outgoing messages queue is full'
                    });
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
    
    async function handleMessage(element, connection, event) {
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
        let html;
        if (message.type === 'text') {
            try {
                json = await message.json();
            } catch (e) {
                html = await message.text();
            }
        }

        if (!element.isConnected) {
            cleanupConnection(element, connection);
            return;
        }

        let detail = {
            connection,
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

        api.triggerHtmxEvent(element, 'htmx:ws:after:message:incoming', {connection, message});
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
            getOrCreateConnection(connectUrl, element);
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
            if (sendUrl) {
                getOrCreateConnection(sendUrl, element);
            }
            await sendMessage(element, evt);
        });
        element._htmx.ws.sendInitialized = true;
    }
    
    function cleanupElement(element) {
        let connection = element._htmx?.ws?.connection;
        if (!connection) return;
        api.triggerHtmxEvent(element, 'htmx:ws:close', {
            connection, reason: 'removed', code: null
        });
        cleanupConnection(element, connection);
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
    
    if (typeof window !== 'undefined' && window.htmx) {
        // Clean up all WS connections on page navigation to prevent browser errors
        window.addEventListener('pagehide', () => {
            connections.forEach((connection) => {
                if (connection.socket) {
                    connection.socket.close(1000, 'page navigating away');
                }
            });
        });

    }
})();
