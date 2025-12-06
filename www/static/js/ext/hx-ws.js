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
    // CONFIGURATION
    // ========================================
    
    function getConfig() {
        const defaults = {
            reconnect: true,
            reconnectDelay: 1000,
            reconnectMaxDelay: 30000,
            reconnectJitter: true,
            autoConnect: false,
            pauseInBackground: true
        };
        return { ...defaults, ...(htmx.config.websockets || {}) };
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
        let firstElement = entry.elements.values().next().value;
        if (firstElement) {
            if (!triggerEvent(firstElement, 'htmx:before:ws:connect', { url })) {
                return;
            }
        }
        
        // Close and remove listeners from old socket
        if (entry.socket) {
            let oldSocket = entry.socket;
            entry.socket = null;
            
            oldSocket.onopen = null;
            oldSocket.onmessage = null;
            oldSocket.onclose = null;
            oldSocket.onerror = null;
            
            try {
                if (oldSocket.readyState === WebSocket.OPEN || oldSocket.readyState === WebSocket.CONNECTING) {
                    oldSocket.close();
                }
            } catch (e) {}
        }
        
        try {
            entry.socket = new WebSocket(url);
            
            entry.socket.addEventListener('open', () => {
                // Don't reset reconnectAttempts immediately - allow backoff to persist across quick reconnections
                // It will naturally decrease as the connection remains stable
                if (firstElement) {
                    triggerEvent(firstElement, 'htmx:after:ws:connect', { url, socket: entry.socket });
                }
            });
            
            entry.socket.addEventListener('message', (event) => {
                handleMessage(entry, event);
            });
            
            entry.socket.addEventListener('close', (event) => {
                // Check if this socket is still the active one
                if (event.target !== entry.socket) return;
                
                if (firstElement) {
                    triggerEvent(firstElement, 'htmx:ws:close', { url });
                }
                
                // Check if entry is still valid (not cleared)
                if (!connectionRegistry.has(url)) return;
                
                let config = getConfig();
                if (config.reconnect && entry.refCount > 0) {
                    scheduleReconnect(url, entry);
                } else {
                    connectionRegistry.delete(url);
                }
            });
            
            entry.socket.addEventListener('error', (error) => {
                if (firstElement) {
                    triggerEvent(firstElement, 'htmx:ws:error', { url, error });
                }
            });
        } catch (error) {
            if (firstElement) {
                triggerEvent(firstElement, 'htmx:ws:error', { url, error });
            }
        }
    }
    
    function scheduleReconnect(url, entry) {
        let config = getConfig();
        
        // Increment attempts before calculating delay for proper exponential backoff
        let attempts = entry.reconnectAttempts;
        entry.reconnectAttempts++;
        
        let delay = Math.min(
            (config.reconnectDelay || 1000) * Math.pow(2, attempts),
            config.reconnectMaxDelay || 30000
        );
        
        if (config.reconnectJitter) {
            delay = delay * (0.75 + Math.random() * 0.5);
        }
        
        entry.reconnectTimer = setTimeout(() => {
            if (entry.refCount > 0) {
                let firstElement = entry.elements.values().next().value;
                if (firstElement) {
                    triggerEvent(firstElement, 'htmx:ws:reconnect', { url, attempts });
                }
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
            let prefix = htmx.config.prefix || '';
            let ancestor = element.closest('[' + prefix + 'hx-ws\\:connect],[' + prefix + 'hx-ws-connect]');
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
            if (firstElement) {
                triggerEvent(firstElement, 'htmx:wsUnknownMessage', { data: event.data });
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
        } else if (envelope.channel && (envelope.channel === 'audio' || envelope.channel === 'json' || envelope.channel === 'binary')) {
            // Known custom channel - emit event for extensions to handle
            triggerEvent(targetElement, 'htmx:wsMessage', { ...envelope, element: targetElement });
        } else {
            // Unknown channel/format - emit unknown message event
            triggerEvent(targetElement, 'htmx:wsUnknownMessage', { ...envelope, element: targetElement });
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
            let target = resolveTarget(element, envelope.target);
            if (target) {
                swapContent(target, envelope.payload, element, envelope.swap);
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
    
    function swapContent(target, content, sourceElement, envelopeSwap) {
        let swapStyle = envelopeSwap || api.attributeValue(sourceElement, 'hx-swap') || htmx.config.defaultSwap;
        
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
        
        let config = getConfig();
        let triggerSpec = api.attributeValue(element, 'hx-trigger');
        
        if (!triggerSpec && config.autoConnect === true) {
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
        if (element._htmx?.wsSendInitialized) return;

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
                if (!element.hasAttribute('hx-ws-connect')) {
                    element.setAttribute('hx-ws-connect', url);
                }
            }
            
            if (element.hasAttribute('ws-send')) {
                if (!element.hasAttribute('hx-ws-send')) {
                    element.setAttribute('hx-ws-send', '');
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
            
            // Process descendants
                element.querySelectorAll('[hx-ws\\:connect], [hx-ws-connect], [hx-ws\\:send], [hx-ws-send], [hx-ws], [ws-connect], [ws-send]').forEach(processNode);
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
                get: (key) => connectionRegistry.get(key),
                has: (key) => connectionRegistry.has(key),
                size: connectionRegistry.size
            })
        };
    }
})();
