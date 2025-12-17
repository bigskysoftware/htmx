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
            reconnectDelay: 1000,
            reconnectMaxDelay: 30000,
            reconnectJitter: true,
            // Note: pauseInBackground is NOT implemented. Reconnection continues in background tabs.
            // To implement visibility-aware behavior, listen for htmx:ws:reconnect and cancel if needed.
            pendingRequestTTL: 30000  // TTL for pending requests in ms
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
        if (!triggerEvent(element, 'htmx:before:ws:connect', { url: normalizedUrl })) {
            // Event was cancelled - don't create connection or store entry
            return null;
        }
        
        // Event passed - now store in registry and create socket
        connectionRegistry.set(normalizedUrl, entry);
        createWebSocket(normalizedUrl, entry);
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
                    triggerEvent(firstElement, 'htmx:after:ws:connect', { url, socket: entry.socket });
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
        
        // Increment attempts FIRST, then calculate delay
        entry.reconnectAttempts++;
        let attempts = entry.reconnectAttempts;
        
        let delay = Math.min(
            (config.reconnectDelay || 1000) * Math.pow(2, attempts - 1),
            config.reconnectMaxDelay || 30000
        );
        
        if (config.reconnectJitter) {
            delay = delay * (0.75 + Math.random() * 0.5);
        }
        
        entry.reconnectTimer = setTimeout(() => {
            if (entry.refCount > 0) {
                let firstElement = entry.elements.values().next().value;
                if (firstElement) {
                    // attempts now means "this is attempt number N"
                    triggerEvent(firstElement, 'htmx:ws:reconnect', { url, attempts });
                }
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
            // Emit error event instead of console.error
            triggerEvent(element, 'htmx:wsSendError', { 
                element, 
                error: 'No WebSocket connection found for element' 
            });
            return;
        }
        
        let normalizedUrl = normalizeWebSocketUrl(url);
        let entry = connectionRegistry.get(normalizedUrl);
        if (!entry || !entry.socket || entry.socket.readyState !== WebSocket.OPEN) {
            triggerEvent(element, 'htmx:wsSendError', { url: normalizedUrl, error: 'Connection not open' });
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
            triggerEvent(element, 'htmx:wsSendError', { url: normalizedUrl, error });
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
        let envelope;
        try {
            envelope = JSON.parse(event.data);
        } catch (e) {
            // Not JSON, emit unknown message event for parse failures
            let firstElement = entry.elements.values().next().value;
            if (firstElement) {
                triggerEvent(firstElement, 'htmx:wsUnknownMessage', { data: event.data, parseError: e });
            }
            return;
        }
        
        // Apply defaults for channel and format
        envelope.channel = envelope.channel || 'ui';
        envelope.format = envelope.format || 'html';
        
        // Find target element for this message
        let targetElement = null;
        if (envelope.request_id && entry.pendingRequests.has(envelope.request_id)) {
            targetElement = entry.pendingRequests.get(envelope.request_id).element;
            entry.pendingRequests.delete(envelope.request_id);
        } else {
            // Use first element in the connection
            targetElement = entry.elements.values().next().value;
        }
        
        // Emit before:message event (cancelable)
        if (!triggerEvent(targetElement, 'htmx:before:ws:message', { envelope, element: targetElement })) {
            return;
        }
        
        // Route based on channel
        if (envelope.channel === 'ui' && envelope.format === 'html') {
            handleHtmlMessage(targetElement, envelope);
        } else {
            // Any non-ui/html message emits htmx:wsMessage for application handling
            // This is extensible - apps can handle json, audio, binary, custom channels, etc.
            triggerEvent(targetElement, 'htmx:wsMessage', { ...envelope, element: targetElement });
        }
        
        triggerEvent(targetElement, 'htmx:after:ws:message', { envelope, element: targetElement });
    }
    
    // ========================================
    // HTML PARTIAL HANDLING - Using htmx.swap(ctx)
    // ========================================
    
    function handleHtmlMessage(element, envelope) {
        let parser = new DOMParser();
        let doc = parser.parseFromString(envelope.payload || '', 'text/html');
        
        // Find all hx-partial elements (legacy format)
        let partials = doc.querySelectorAll('hx-partial');
        
        if (partials.length === 0) {
            // No partials, treat entire payload as content for element's target
            let target = resolveTarget(element, envelope.target);
            if (target) {
                swapWithHtmx(target, envelope.payload, element, envelope.swap);
            }
            return;
        }
        
        // Process each partial
        for (let partial of partials) {
            let targetId = partial.getAttribute('id');
            if (!targetId) continue;
            
            let target = document.getElementById(targetId);
            if (!target) continue;
            
            swapWithHtmx(target, partial.innerHTML, element);
        }
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
    
    function swapWithHtmx(target, content, sourceElement, envelopeSwap) {
        // Determine swap style from envelope, element attribute, or default
        let swapStyle = envelopeSwap || api.attributeValue(sourceElement, 'hx-swap') || htmx.config.defaultSwap;
        
        // Create a document fragment from the HTML content
        let template = document.createElement('template');
        template.innerHTML = content || '';
        let fragment = template.content;
        
        // Use htmx's internal insertContent which handles:
        // - All swap styles correctly
        // - Processing new content with htmx.process()
        // - Preserved elements
        // - Auto-focus
        // - Scroll handling
        let task = {
            target: target,
            swapSpec: swapStyle,  // Can be a string - insertContent will parse it
            fragment: fragment
        };
        
        api.insertContent(task);
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

        element._htmx = element._htmx || {};
        element._htmx.wsInitialized = true;
        
        let triggerSpec = api.attributeValue(element, 'hx-trigger');
        
        if (!triggerSpec) {
            // No trigger specified - connect immediately (default behavior)
            // This is the most common use case: connect when element appears
            let entry = getOrCreateConnection(connectUrl, element);
            if (entry) {
                element._htmx.wsUrl = entry.url;
            }
        } else {
            // Connect based on explicit trigger
            // Note: We only support bare event names for connection triggers.
            // Modifiers like once, delay, throttle, from, target are NOT supported
            // for connection establishment. Use htmx:before:ws:connect event for
            // custom connection control logic.
            let specs = api.parseTriggerSpecs(triggerSpec);
            if (specs.length > 0) {
                let spec = specs[0];
                if (spec.name === 'load') {
                    // Explicit load trigger - connect immediately
                    let entry = getOrCreateConnection(connectUrl, element);
                    if (entry) {
                        element._htmx.wsUrl = entry.url;
                    }
                } else {
                    // Set up event listener for other triggers (bare event name only)
                    element.addEventListener(spec.name, () => {
                        if (!element._htmx?.wsUrl) {
                            let entry = getOrCreateConnection(connectUrl, element);
                            if (entry) {
                                element._htmx.wsUrl = entry.url;
                            }
                        }
                    }, { once: true });
                }
            }
        }
    }
    
    function initializeSendElement(element) {
        if (element._htmx?.wsSendInitialized) return;

        let sendAttr = getWsAttribute(element, 'send');
        // Only treat as URL if it looks like one (not "", "true", etc.)
        let sendUrl = looksLikeUrl(sendAttr) ? sendAttr : null;
        let triggerSpec = api.attributeValue(element, 'hx-trigger');
        
        if (!triggerSpec) {
            // Default trigger based on element type
            triggerSpec = element.matches('form') ? 'submit' :
                         element.matches('input:not([type=button]),select,textarea') ? 'change' :
                         'click';
        }
        
        // Note: We only support bare event names for send triggers.
        // Modifiers like once, delay, throttle, from, target are NOT supported.
        // For complex trigger logic, use htmx:before:ws:send to implement custom behavior.
        let specs = api.parseTriggerSpecs(triggerSpec);
        if (specs.length > 0) {
            let spec = specs[0];
            
            let handler = async (evt) => {
                // Prevent default for forms
                if (element.matches('form') && evt.type === 'submit') {
                    evt.preventDefault();
                }
                
                // If this element has its own URL, ensure connection exists
                if (sendUrl) {
                    if (!element._htmx?.wsUrl) {
                        let entry = getOrCreateConnection(sendUrl, element);
                        if (entry) {
                            element._htmx.wsUrl = entry.url;
                        }
                    }
                }
                
                await sendMessage(element, evt);
            };
            
            element.addEventListener(spec.name, handler);
            element._htmx = element._htmx || {};
            element._htmx.wsSendInitialized = true;
            element._htmx.wsSendHandler = handler;
            element._htmx.wsSendEvent = spec.name;
        }
    }
    
    function cleanupElement(element) {
        if (element._htmx?.wsUrl) {
            decrementRef(element._htmx.wsUrl, element);
        }
        
        if (element._htmx?.wsSendHandler) {
            element.removeEventListener(element._htmx.wsSendEvent, element._htmx.wsSendHandler);
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
                        entry.refCount = 0; // Prevent pending timeouts from reconnecting
                        if (entry.reconnectTimer) {
                            clearTimeout(entry.reconnectTimer);
                        }
                        if (entry.socket) {
                            // Remove listeners if possible or just close
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
