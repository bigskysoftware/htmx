(() => {
    let api;
    
    // Helper to get attribute value, checking colon, hyphen, and plain variants
    function getWsAttribute(element, attrName) {
        // Try colon variant first (hx-ws:connect)
        let colonValue = api.attributeValue(element, 'hx-ws:' + attrName);
        if (colonValue !== null && colonValue !== undefined) return colonValue;
        
        // Try hyphen variant for JSX (hx-ws-connect)
        let hyphenValue = api.attributeValue(element, 'hx-ws-' + attrName);
        if (hyphenValue !== null && hyphenValue !== undefined) return hyphenValue;
        
        // For 'send', also check plain 'hx-ws' (marker attribute)
        if (attrName === 'send') {
            let plainValue = api.attributeValue(element, 'hx-ws');
            if (plainValue !== null && plainValue !== undefined) return plainValue;
        }
        
        return null;
    }
    
    // Helper to check if element has WebSocket attribute (any variant)
    function hasWsAttribute(element, attrName) {
        let value = getWsAttribute(element, attrName);
        return value !== null && value !== undefined;
    }
    
    // ========================================
    // CONNECTION REGISTRY
    // ========================================
    
    const connectionRegistry = new Map();
    
    function getOrCreateConnection(url, element) {
        if (connectionRegistry.has(url)) {
            let entry = connectionRegistry.get(url);
            entry.refCount++;
            entry.elements.add(element);
            return entry;
        }
        
        let entry = {
            socket: null,
            refCount: 1,
            elements: new Set([element]),
            reconnectAttempts: 0,
            reconnectTimer: null,
            pendingRequests: new Map()
        };
        
        connectionRegistry.set(url, entry);
        createWebSocket(url, entry);
        return entry;
    }
    
    function createWebSocket(url, entry) {
        let config = htmx.config.websockets || {};
        
        // Emit before:connect event
        let firstElement = entry.elements.values().next().value;
        if (!triggerEvent(firstElement, 'htmx:before:ws:connect', { url })) {
            return;
        }
        
        try {
            entry.socket = new WebSocket(url);
            
            entry.socket.addEventListener('open', () => {
                entry.reconnectAttempts = 0;
                triggerEvent(firstElement, 'htmx:after:ws:connect', { url, socket: entry.socket });
            });
            
            entry.socket.addEventListener('message', (event) => {
                handleMessage(entry, event);
            });
            
            entry.socket.addEventListener('close', () => {
                triggerEvent(firstElement, 'htmx:ws:close', { url });
                
                if (config.reconnect && entry.refCount > 0) {
                    scheduleReconnect(url, entry);
                } else {
                    connectionRegistry.delete(url);
                }
            });
            
            entry.socket.addEventListener('error', (error) => {
                triggerEvent(firstElement, 'htmx:ws:error', { url, error });
            });
        } catch (error) {
            triggerEvent(firstElement, 'htmx:ws:error', { url, error });
        }
    }
    
    function scheduleReconnect(url, entry) {
        let config = htmx.config.websockets || {};
        let delay = Math.min(
            (config.reconnectDelay || 1000) * Math.pow(2, entry.reconnectAttempts),
            config.reconnectMaxDelay || 30000
        );
        
        if (config.reconnectJitter) {
            delay = delay * (0.75 + Math.random() * 0.5);
        }
        
        entry.reconnectTimer = setTimeout(() => {
            if (entry.refCount > 0) {
                let firstElement = entry.elements.values().next().value;
                triggerEvent(firstElement, 'htmx:ws:reconnect', { url, attempts: entry.reconnectAttempts });
                entry.reconnectAttempts++;
                createWebSocket(url, entry);
            }
        }, delay);
    }
    
    function decrementRef(url, element) {
        if (!connectionRegistry.has(url)) return;
        
        let entry = connectionRegistry.get(url);
        entry.elements.delete(element);
        entry.refCount--;
        
        if (entry.refCount <= 0) {
            if (entry.reconnectTimer) {
                clearTimeout(entry.reconnectTimer);
            }
            if (entry.socket && entry.socket.readyState === WebSocket.OPEN) {
                entry.socket.close();
            }
            connectionRegistry.delete(url);
        }
    }
    
    // ========================================
    // MESSAGE SENDING
    // ========================================
    
    function sendMessage(element, event) {
        // Find connection URL
        let url = getWsAttribute(element, 'send');
        if (!url) {
            // Look for nearest ancestor with hx-ws:connect or hx-ws-connect
            let ancestor = element.closest('[' + htmx.config.prefix + 'hx-ws\\:connect],[' + htmx.config.prefix + 'hx-ws-connect]');
            if (ancestor) {
                url = getWsAttribute(ancestor, 'connect');
            }
        }
        
        if (!url) {
            console.error('No WebSocket connection found for hx-ws:send element', element);
            return;
        }
        
        let entry = connectionRegistry.get(url);
        if (!entry || !entry.socket || entry.socket.readyState !== WebSocket.OPEN) {
            triggerEvent(element, 'htmx:wsSendError', { url, error: 'Connection not open' });
            return;
        }
        
        // Build message
        let form = element.form || element.closest('form');
        let body = api.collectFormData(element, form, event.submitter);
        api.handleHxVals(element, body);
        
        let values = {};
        for (let [key, value] of body) {
            values[key] = value;
        }
        
        let requestId = generateUUID();
        let message = {
            type: 'request',
            request_id: requestId,
            event: event.type,
            values: values,
            path: url
        };
        
        if (element.id) {
            message.id = element.id;
        }
        
        // Allow modification via event
        let detail = { message, element, url };
        if (!triggerEvent(element, 'htmx:before:ws:send', detail)) {
            return;
        }
        
        try {
            entry.socket.send(JSON.stringify(detail.message));
            
            // Store pending request for response matching
            entry.pendingRequests.set(requestId, { element, timestamp: Date.now() });
            
            triggerEvent(element, 'htmx:after:ws:send', { message: detail.message, url });
        } catch (error) {
            triggerEvent(element, 'htmx:wsSendError', { url, error });
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
            // Not JSON, emit unknown message event
            let firstElement = entry.elements.values().next().value;
            triggerEvent(firstElement, 'htmx:wsUnknownMessage', { data: event.data });
            return;
        }
        
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
            // Custom channel - emit event for extensions to handle
            triggerEvent(targetElement, 'htmx:wsMessage', { envelope, element: targetElement });
        }
        
        triggerEvent(targetElement, 'htmx:after:ws:message', { envelope, element: targetElement });
    }
    
    // ========================================
    // HTML PARTIAL HANDLING
    // ========================================
    
    function handleHtmlMessage(element, envelope) {
        let parser = new DOMParser();
        let doc = parser.parseFromString(envelope.payload, 'text/html');
        
        // Find all hx-partial elements
        let partials = doc.querySelectorAll('hx-partial');
        
        if (partials.length === 0) {
            // No partials, treat entire payload as content for element's target
            let target = resolveTarget(element);
            if (target) {
                swapContent(target, envelope.payload, element);
            }
            return;
        }
        
        partials.forEach(partial => {
            let targetId = partial.getAttribute('id');
            if (!targetId) return;
            
            let target = document.getElementById(targetId);
            if (!target) return;
            
            swapContent(target, partial.innerHTML, element);
        });
    }
    
    function resolveTarget(element) {
        let targetSelector = api.attributeValue(element, 'hx-target');
        if (targetSelector) {
            if (targetSelector === 'this') {
                return element;
            }
            return document.querySelector(targetSelector);
        }
        return element;
    }
    
    function swapContent(target, content, sourceElement) {
        let swapStyle = api.attributeValue(sourceElement, 'hx-swap') || htmx.config.defaultSwap;
        
        // Parse swap style (just get the main style, ignore modifiers for now)
        let style = swapStyle.split(' ')[0];
        
        // Normalize swap style
        style = normalizeSwapStyle(style);
        
        // Perform swap
        switch (style) {
            case 'innerHTML':
                target.innerHTML = content;
                break;
            case 'outerHTML':
                target.outerHTML = content;
                break;
            case 'beforebegin':
                target.insertAdjacentHTML('beforebegin', content);
                break;
            case 'afterbegin':
                target.insertAdjacentHTML('afterbegin', content);
                break;
            case 'beforeend':
                target.insertAdjacentHTML('beforeend', content);
                break;
            case 'afterend':
                target.insertAdjacentHTML('afterend', content);
                break;
            case 'delete':
                target.remove();
                break;
            case 'none':
                // Do nothing
                break;
            default:
                target.innerHTML = content;
        }
        
        // Process new content with HTMX
        htmx.process(target);
    }
    
    function normalizeSwapStyle(style) {
        return style === 'before' ? 'beforebegin' :
               style === 'after' ? 'afterend' :
               style === 'prepend' ? 'afterbegin' :
               style === 'append' ? 'beforeend' : style;
    }
    
    // ========================================
    // EVENT HELPERS
    // ========================================
    
    function triggerEvent(element, eventName, detail = {}) {
        return htmx.trigger(element, eventName, detail);
    }
    
    // ========================================
    // ELEMENT LIFECYCLE
    // ========================================
    
    function initializeElement(element) {
        let connectUrl = getWsAttribute(element, 'connect');
        if (!connectUrl) return;
        
        // Check if we should auto-connect
        let config = htmx.config.websockets || {};
        let triggerSpec = api.attributeValue(element, 'hx-trigger');
        
        if (!triggerSpec && config.autoConnect !== false) {
            // Auto-connect on element initialization
            getOrCreateConnection(connectUrl, element);
            element._htmx = element._htmx || {};
            element._htmx.wsUrl = connectUrl;
        } else if (triggerSpec) {
            // Connect based on trigger
            let specs = api.parseTriggerSpecs(triggerSpec);
            if (specs.length > 0) {
                let spec = specs[0];
                if (spec.name === 'load') {
                    getOrCreateConnection(connectUrl, element);
                    element._htmx = element._htmx || {};
                    element._htmx.wsUrl = connectUrl;
                } else {
                    // Set up event listener for other triggers
                    element.addEventListener(spec.name, () => {
                        if (!element._htmx?.wsUrl) {
                            getOrCreateConnection(connectUrl, element);
                            element._htmx = element._htmx || {};
                            element._htmx.wsUrl = connectUrl;
                        }
                    }, { once: true });
                }
            }
        }
    }
    
    function initializeSendElement(element) {
        let sendUrl = getWsAttribute(element, 'send');
        let triggerSpec = api.attributeValue(element, 'hx-trigger');
        
        if (!triggerSpec) {
            // Default trigger based on element type
            triggerSpec = element.matches('form') ? 'submit' :
                         element.matches('input:not([type=button]),select,textarea') ? 'change' :
                         'click';
        }
        
        let specs = api.parseTriggerSpecs(triggerSpec);
        if (specs.length > 0) {
            let spec = specs[0];
            
            let handler = (evt) => {
                // Prevent default for forms
                if (element.matches('form') && evt.type === 'submit') {
                    evt.preventDefault();
                }
                
                // If this element has its own URL, ensure connection exists
                if (sendUrl) {
                    if (!element._htmx?.wsUrl) {
                        getOrCreateConnection(sendUrl, element);
                        element._htmx = element._htmx || {};
                        element._htmx.wsUrl = sendUrl;
                    }
                }
                
                sendMessage(element, evt);
            };
            
            element.addEventListener(spec.name, handler);
            element._htmx = element._htmx || {};
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
                element.setAttribute('hx-ws-connect', url);
            }
            
            if (element.hasAttribute('ws-send')) {
                element.setAttribute('hx-ws-send', '');
            }
        }
    }
    
    // ========================================
    // EXTENSION REGISTRATION
    // ========================================
    
    htmx.registerExtension('ws', {
        init: (internalAPI) => {
            api = internalAPI;
            
            // Initialize default config
            if (!htmx.config.websockets) {
                htmx.config.websockets = {
                    reconnect: true,
                    reconnectDelay: 1000,
                    reconnectMaxDelay: 30000,
                    reconnectJitter: true,
                    autoConnect: true,
                    pauseInBackground: true
                };
            }
        },
        
        htmx_after_init: (element) => {
            // Check for legacy attributes
            checkLegacyAttributes(element);
            
            // Initialize WebSocket connection elements (check both variants)
            if (hasWsAttribute(element, 'connect')) {
                initializeElement(element);
            }
            
            // Initialize send elements (check both variants)
            if (hasWsAttribute(element, 'send')) {
                initializeSendElement(element);
            }
        },
        
        htmx_before_cleanup: (element) => {
            cleanupElement(element);
        }
    });
    
    // Expose registry for testing
    if (typeof window !== 'undefined' && window.htmx) {
        window.htmx.ext = window.htmx.ext || {};
        window.htmx.ext.ws = {
            getRegistry: () => connectionRegistry
        };
    }
})();
