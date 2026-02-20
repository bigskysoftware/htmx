(() => {
    let api;
    
    // ========================================
    // ATTRIBUTE HELPERS
    // ========================================
    
    // Helper to build proper attribute name respecting htmx prefix
    function buildAttrName(suffix) {
        // htmx.config.prefix replaces 'hx-' entirely, e.g. 'data-hx-' 
        // So 'hx-ws:connect' becomes 'data-hx-ws:connect'
        let prefix = htmx.config.prefix || 'hx-';
        return prefix + 'ws' + suffix;
    }
    
    // Helper to get attribute value, checking colon, hyphen, and plain variants
    // Uses api.attributeValue for automatic prefix handling and inheritance support
    function getWsAttribute(element, attrName) {
        // Try colon variant first (hx-ws:connect) - prefix applied automatically by htmx
        let colonValue = api.attributeValue(element, 'hx-ws:' + attrName);
        if (colonValue != null) return colonValue;
        
        // Try hyphen variant for JSX (hx-ws-connect)
        let hyphenValue = api.attributeValue(element, 'hx-ws-' + attrName);
        if (hyphenValue != null) return hyphenValue;
        
        // For 'send', also check plain 'hx-ws' (marker attribute)
        if (attrName === 'send') {
            let plainValue = api.attributeValue(element, 'hx-ws');
            if (plainValue != null) return plainValue;
        }
        
        return null;
    }
    
    // Helper to check if element has WebSocket attribute (any variant)
    function hasWsAttribute(element, attrName) {
        let value = getWsAttribute(element, attrName);
        return value !== null && value !== undefined;
    }
    
    // Build selector for WS attributes
    function buildWsSelector(attrName) {
        let colonAttr = buildAttrName(':' + attrName);
        let hyphenAttr = buildAttrName('-' + attrName);
        // Escape colon for CSS selector
        return `[${colonAttr.replace(':', '\\:')}],[${hyphenAttr}]`;
    }
    
    // ========================================
    // CONFIGURATION
    // ========================================
    
    function getConfig() {
        const defaults = {
            reconnect: true,
            reconnectDelay: 500,
            reconnectMaxDelay: 60000,
            reconnectMaxAttempts: Infinity,
            reconnectJitter: 0.3,
            pauseOnBackground: true,
            pendingRequestTTL: 30000
        };
        return { ...defaults, ...(htmx.config.websockets || {}) };
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
        
        // Relative URL - build absolute ws(s):// URL based on current location
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
    // CONNECTION REGISTRY
    // ========================================
    
    const connectionRegistry = new Map();
    
    function getOrCreateConnection(url, element) {
        let normalizedUrl = normalizeWebSocketUrl(url);
        
        if (connectionRegistry.has(normalizedUrl)) {
            let entry = connectionRegistry.get(normalizedUrl);
            entry.refCount++;
            entry.elements.add(element);
            return entry;
        }
        
        // Create entry but DON'T add to registry yet - wait for before:ws:connect
        let entry = {
            url: normalizedUrl,
            socket: null,
            refCount: 1,
            elements: new Set([element]),
            reconnectAttempts: 0,
            reconnectTimer: null,
            pendingRequests: new Map(),
            listeners: {}  // Store listener references for proper cleanup
        };
        
        // Fire cancelable event BEFORE storing in registry
        let connectDetail = {attempt: 0, delay: 0, url: normalizedUrl, cancelled: false};
        if (!triggerEvent(element, 'htmx:before:ws:connection', {connection: connectDetail}) || connectDetail.cancelled) {
            return null;
        }
        
        // Event passed - now store in registry and create socket
        connectionRegistry.set(normalizedUrl, entry);
        createWebSocket(normalizedUrl, entry);

        let config = getConfig();
        if (config.pauseOnBackground) {
            entry.visibilityHandler = () => {
                if (document.hidden) {
                    if (entry.socket && entry.socket.readyState === WebSocket.OPEN) {
                        entry.socket.close();
                    }
                } else if (!entry.socket || entry.socket.readyState === WebSocket.CLOSED) {
                    entry.reconnectAttempts = 0;
                    createWebSocket(normalizedUrl, entry);
                }
            };
            document.addEventListener('visibilitychange', entry.visibilityHandler);
        }

        return entry;
    }
    
    function createWebSocket(url, entry) {
        let firstElement = entry.elements.values().next().value;
        
        // Close and remove listeners from old socket properly
        if (entry.socket) {
            let oldSocket = entry.socket;
            entry.socket = null;
            
            // Remove listeners using stored references
            if (entry.listeners.open) oldSocket.removeEventListener('open', entry.listeners.open);
            if (entry.listeners.message) oldSocket.removeEventListener('message', entry.listeners.message);
            if (entry.listeners.close) oldSocket.removeEventListener('close', entry.listeners.close);
            if (entry.listeners.error) oldSocket.removeEventListener('error', entry.listeners.error);
            
            try {
                if (oldSocket.readyState === WebSocket.OPEN || oldSocket.readyState === WebSocket.CONNECTING) {
                    oldSocket.close();
                }
            } catch (e) {}
        }
        
        try {
            entry.socket = new WebSocket(url);
            
            // Create and store listener references
            entry.listeners.open = () => {
                // Reset reconnect attempts on successful connection
                entry.reconnectAttempts = 0;
                
                if (firstElement) {
                    triggerEvent(firstElement, 'htmx:after:ws:connection', { url, socket: entry.socket });
                }
            };
            
            entry.listeners.message = (event) => {
                handleMessage(entry, event);
            };
            
            entry.listeners.close = (event) => {
                // Check if this socket is still the active one
                if (event.target !== entry.socket) return;
                
                if (firstElement) {
                    triggerEvent(firstElement, 'htmx:ws:close', { 
                        url, 
                        code: event.code,
                        reason: event.reason 
                    });
                }
                
                // Check if entry is still valid (not cleared)
                if (!connectionRegistry.has(url)) return;
                
                let config = getConfig();
                // If pauseOnBackground triggered the close, the visibility handler
                // will reconnect on tab show — skip normal reconnect logic
                if (config.pauseOnBackground && document.hidden) return;

                if (config.reconnect && entry.refCount > 0) {
                    scheduleReconnect(url, entry);
                } else {
                    cleanupPendingRequests(entry);
                    connectionRegistry.delete(url);
                }
            };
            
            entry.listeners.error = (error) => {
                if (firstElement) {
                    triggerEvent(firstElement, 'htmx:ws:error', { url, error });
                }
            };
            
            // Add listeners
            entry.socket.addEventListener('open', entry.listeners.open);
            entry.socket.addEventListener('message', entry.listeners.message);
            entry.socket.addEventListener('close', entry.listeners.close);
            entry.socket.addEventListener('error', entry.listeners.error);
            
        } catch (error) {
            if (firstElement) {
                triggerEvent(firstElement, 'htmx:ws:error', { url, error });
            }
        }
    }
    
    function scheduleReconnect(url, entry) {
        let config = getConfig();

        entry.reconnectAttempts++;
        let attempt = entry.reconnectAttempts;

        if (!config.reconnect || attempt > config.reconnectMaxAttempts) {
            cleanupPendingRequests(entry);
            connectionRegistry.delete(url);
            return;
        }

        let delay = Math.min(
            config.reconnectDelay * Math.pow(2, attempt - 1),
            config.reconnectMaxDelay
        );

        if (config.reconnectJitter > 0) {
            let jitterRange = delay * config.reconnectJitter;
            delay = Math.max(0, delay + (Math.random() * 2 - 1) * jitterRange);
        }

        let firstElement = entry.elements.values().next().value;
        if (firstElement) {
            let detail = {attempt, delay, url, cancelled: false};
            if (!triggerEvent(firstElement, 'htmx:before:ws:connection', {connection: detail}) || detail.cancelled) {
                cleanupPendingRequests(entry);
                connectionRegistry.delete(url);
                return;
            }
            delay = detail.delay;
        }

        entry.reconnectTimer = setTimeout(() => {
            if (entry.refCount > 0) {
                createWebSocket(url, entry);
            }
        }, delay);
    }
    
    function decrementRef(url, element) {
        // Try both original and normalized URL
        let normalizedUrl = normalizeWebSocketUrl(url);
        
        if (!connectionRegistry.has(normalizedUrl)) return;
        
        let entry = connectionRegistry.get(normalizedUrl);
        entry.elements.delete(element);
        entry.refCount--;
        
        if (entry.refCount <= 0) {
            if (entry.reconnectTimer) {
                clearTimeout(entry.reconnectTimer);
            }
            if (entry.visibilityHandler) {
                document.removeEventListener('visibilitychange', entry.visibilityHandler);
            }
            cleanupPendingRequests(entry);
            if (entry.socket && entry.socket.readyState === WebSocket.OPEN) {
                entry.socket.close();
            }
            connectionRegistry.delete(normalizedUrl);
        }
    }
    
    // ========================================
    // PENDING REQUEST MANAGEMENT
    // ========================================
    
    function cleanupPendingRequests(entry) {
        entry.pendingRequests.clear();
    }
    
    function cleanupExpiredRequests(entry) {
        let config = getConfig();
        let now = Date.now();
        let ttl = config.pendingRequestTTL || 30000;
        
        for (let [requestId, pending] of entry.pendingRequests) {
            if (now - pending.timestamp > ttl) {
                entry.pendingRequests.delete(requestId);
            }
        }
    }
    
    // ========================================
    // MESSAGE SENDING
    // ========================================
    
    // Check if a value looks like a URL (vs a boolean marker like "" or "true")
    function looksLikeUrl(value) {
        if (!value) return false;
        // Check for URL-like patterns: paths, protocols, protocol-relative
        return value.startsWith('/') || 
               value.startsWith('.') ||
               value.startsWith('ws:') || 
               value.startsWith('wss:') || 
               value.startsWith('http:') || 
               value.startsWith('https:') ||
               value.startsWith('//');
    }
    
    async function sendMessage(element, event) {
        // Find connection URL
        let url = getWsAttribute(element, 'send');
        if (!looksLikeUrl(url)) {
            // Value is empty, "true", or other non-URL marker - look for ancestor connection
            let selector = buildWsSelector('connect');
            let ancestor = element.closest(selector);
            if (ancestor) {
                url = getWsAttribute(ancestor, 'connect');
            } else {
                url = null;
            }
        }
        
        if (!url) {
            triggerEvent(element, 'htmx:ws:error', {
                url: null, error: 'No WebSocket connection found for element'            });
            return;
        }

        let normalizedUrl = normalizeWebSocketUrl(url);
        let entry = connectionRegistry.get(normalizedUrl);
        if (!entry || !entry.socket || entry.socket.readyState !== WebSocket.OPEN) {
            triggerEvent(element, 'htmx:ws:error', { url: normalizedUrl, error: 'Connection not open' });
            return;
        }
        
        // Cleanup expired pending requests periodically
        cleanupExpiredRequests(entry);
        
        // Build message
        let form = element.form || element.closest('form');
        let body = api.collectFormData(element, form, event.submitter);
        let valsResult = api.handleHxVals(element, body);
        if (valsResult) await valsResult;
        
        // Preserve multi-value form fields (checkboxes, multi-selects)
        let values = {};
        for (let [key, value] of body) {
            if (key in values) {
                // Convert to array if needed
                if (!Array.isArray(values[key])) {
                    values[key] = [values[key]];
                }
                values[key].push(value);
            } else {
                values[key] = value;
            }
        }
        
        // Build headers object
        let headers = {
            'HX-Request': 'true',
            'HX-Current-URL': window.location.href
        };
        if (element.id) {
            headers['HX-Trigger'] = element.id;
        }
        let targetAttr = api.attributeValue(element, 'hx-target');
        if (targetAttr) {
            headers['HX-Target'] = targetAttr;
        }
        
        let requestId = generateUUID();
        let message = {
            type: 'request',
            request_id: requestId,
            event: event.type,
            headers: headers,
            values: values,
            path: normalizedUrl
        };
        
        if (element.id) {
            message.id = element.id;
        }
        
        // Allow modification via event - use 'data' as documented
        let detail = { data: message, element, url: normalizedUrl };
        if (!triggerEvent(element, 'htmx:before:ws:send', detail)) {
            return;
        }
        
        try {
            entry.socket.send(JSON.stringify(detail.data));
            
            // Store pending request for response matching
            entry.pendingRequests.set(requestId, { element, timestamp: Date.now() });
            
            triggerEvent(element, 'htmx:after:ws:send', { data: detail.data, url: normalizedUrl });
        } catch (error) {
            triggerEvent(element, 'htmx:ws:error', { url: normalizedUrl, error });
        }
    }
    
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            let r = Math.random() * 16 | 0;
            let v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    // ========================================
    // MESSAGE RECEIVING & ROUTING
    // ========================================
    
    function handleMessage(entry, event) {
        let envelope = null;
        try {
            envelope = JSON.parse(event.data);
        } catch (e) {}

        // Find target element for this message
        let targetElement = null;
        if (envelope?.request_id && entry.pendingRequests.has(envelope.request_id)) {
            targetElement = entry.pendingRequests.get(envelope.request_id).element;
            entry.pendingRequests.delete(envelope.request_id);
        } else {
            targetElement = entry.elements.values().next().value;
        }

        // All messages go through before/after:ws:message (cancelable)
        if (!triggerEvent(targetElement, 'htmx:before:ws:message', { envelope, data: event.data, element: targetElement })) {
            return;
        }

        if (envelope) {
            // JSON message — route based on channel
            envelope.channel = envelope.channel || 'ui';
            envelope.format = envelope.format || 'html';

            if (envelope.channel === 'ui' && envelope.format === 'html') {
                handleHtmlMessage(targetElement, envelope);
            }
            // Non-ui messages: no auto-swap, users handle via after:ws:message
        } else {
            // Raw (non-JSON) message — swap as HTML
            handleRawMessage(targetElement, event.data);
        }

        triggerEvent(targetElement, 'htmx:after:ws:message', { envelope, data: event.data, element: targetElement });
    }

    // ========================================
    // RAW (NON-JSON) MESSAGE HANDLING
    // ========================================

    function handleRawMessage(element, data) {
        let target = resolveTarget(element, null);
        let targetSelector = api.attributeValue(element, 'hx-target');

        // If no explicit hx-target, use swap:none so we don't wipe the
        // connection element — but partials in the payload can still
        // target their own destinations
        let swapStyle = targetSelector
            ? (api.attributeValue(element, 'hx-swap') || htmx.config.defaultSwap)
            : 'none';

        htmx.swap({
            sourceElement: element,
            target: target,
            swap: swapStyle,
            text: data,
            transition: false
        });
    }

    // ========================================
    // HTML PARTIAL HANDLING - Using htmx.swap(ctx)
    // ========================================
    
    function handleHtmlMessage(element, envelope) {
        let target = resolveTarget(element, envelope.target);
        let swapStyle = envelope.swap || api.attributeValue(element, 'hx-swap') || htmx.config.defaultSwap;
        
        // Always call swap even if target is null - partials in payload may have their own targets
        htmx.swap({
            sourceElement: element,
            target: target,
            swap: swapStyle,
            text: envelope.payload || '',
            transition: false
        });
    }
    
    function resolveTarget(element, envelopeTarget) {
        if (envelopeTarget) {
            if (envelopeTarget === 'this') {
                return element;
            }
            return document.querySelector(envelopeTarget);
        }
        let targetSelector = api.attributeValue(element, 'hx-target');
        if (targetSelector) {
            if (targetSelector === 'this') {
                return element;
            }
            return document.querySelector(targetSelector);
        }
        return element;
    }
    
    // ========================================
    // EVENT HELPERS
    // ========================================
    
    function triggerEvent(element, eventName, detail = {}) {
        if (!element) return true;
        return htmx.trigger(element, eventName, detail);
    }
    
    // ========================================
    // ELEMENT LIFECYCLE
    // ========================================
    
    function initializeElement(element) {
        if (element._htmx?.wsInitialized) return;

        let connectUrl = getWsAttribute(element, 'connect');
        if (!connectUrl) return;

        let specString = api.attributeValue(element, 'hx-trigger') || 'load';
        api.onTrigger(element, specString, () => {
            if (element._htmx?.wsUrl) return;
            let entry = getOrCreateConnection(connectUrl, element);
            if (entry) {
                element._htmx = element._htmx || {};
                element._htmx.wsUrl = entry.url;
            }
        });
        element._htmx = element._htmx || {};
        element._htmx.wsInitialized = true;
    }
    
    function initializeSendElement(element) {
        if (element._htmx?.wsSendInitialized) return;

        let sendAttr = getWsAttribute(element, 'send');
        let sendUrl = looksLikeUrl(sendAttr) ? sendAttr : null;
        let specString = api.attributeValue(element, 'hx-trigger');
        if (!specString) {
            specString = element.matches('form') ? 'submit' :
                         element.matches('input:not([type=button]),select,textarea') ? 'change' :
                         'click';
        }

        api.onTrigger(element, specString, async (evt) => {
            if (element.matches('form') && evt.type === 'submit') {
                evt.preventDefault();
            }
            if (sendUrl && !element._htmx?.wsUrl) {
                let entry = getOrCreateConnection(sendUrl, element);
                if (entry) {
                    element._htmx = element._htmx || {};
                    element._htmx.wsUrl = entry.url;
                }
            }
            await sendMessage(element, evt);
        });
        element._htmx = element._htmx || {};
        element._htmx.wsSendInitialized = true;
    }
    
    function cleanupElement(element) {
        if (element._htmx?.wsUrl) {
            decrementRef(element._htmx.wsUrl, element);
        }
    }
    
    // ========================================
    // BACKWARD COMPATIBILITY
    // ========================================
    
    function checkLegacyAttributes(element) {
        // Check for old ws-connect / ws-send attributes
        if (element.hasAttribute('ws-connect') || element.hasAttribute('ws-send')) {
            console.warn('HTMX WebSocket: Legacy attributes ws-connect and ws-send are deprecated. Please use hx-ws:connect/hx-ws-connect and hx-ws:send/hx-ws-send instead.');
            
            // Map legacy attributes to new ones (prefer hyphen variant for broader compatibility)
            if (element.hasAttribute('ws-connect')) {
                let url = element.getAttribute('ws-connect');
                let hyphenAttr = buildAttrName('-connect');
                if (!element.hasAttribute(hyphenAttr)) {
                    element.setAttribute(hyphenAttr, url);
                }
            }
            
            if (element.hasAttribute('ws-send')) {
                let hyphenAttr = buildAttrName('-send');
                if (!element.hasAttribute(hyphenAttr)) {
                    element.setAttribute(hyphenAttr, '');
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
            if (!htmx.config.websockets) {
                htmx.config.websockets = {};
            }
        },
        
        htmx_after_process: (element) => {
            const processNode = (node) => {
                // Check for legacy attributes
                checkLegacyAttributes(node);
                
                // Initialize WebSocket connection elements (check both variants)
                if (hasWsAttribute(node, 'connect')) {
                    initializeElement(node);
                }
                
                // Initialize send elements (check both variants)
                if (hasWsAttribute(node, 'send')) {
                    initializeSendElement(node);
                }
            };

            // Process the element itself
            processNode(element);
            
            // Process descendants - build proper selector respecting prefix
            let connectSelector = buildWsSelector('connect');
            let sendSelector = buildWsSelector('send');
            let plainAttr = buildAttrName('');
            let fullSelector = `${connectSelector},${sendSelector},[${plainAttr}],[ws-connect],[ws-send]`;
            
            element.querySelectorAll(fullSelector).forEach(processNode);
        },
        
        htmx_before_cleanup: (element) => {
            cleanupElement(element);
        }
    });
    
    // Expose registry for testing
    if (typeof window !== 'undefined' && window.htmx) {
        window.htmx.ext = window.htmx.ext || {};
        window.htmx.ext.ws = {
            getRegistry: () => ({
                clear: () => {
                    let entries = Array.from(connectionRegistry.values());
                    connectionRegistry.clear(); // Clear first to prevent reconnects
                    
                    entries.forEach(entry => {
                        entry.refCount = 0;
                        if (entry.reconnectTimer) {
                            clearTimeout(entry.reconnectTimer);
                        }
                        if (entry.visibilityHandler) {
                            document.removeEventListener('visibilitychange', entry.visibilityHandler);
                        }
                        if (entry.socket) {
                            entry.socket.close();
                        }
                        entry.elements.clear();
                        entry.pendingRequests.clear();
                    });
                },
                get: (key) => connectionRegistry.get(normalizeWebSocketUrl(key)),
                has: (key) => connectionRegistry.has(normalizeWebSocketUrl(key)),
                size: connectionRegistry.size
            })
        };
    }
})();
