/**
 * Mock implementation of the EventSource (Server-Sent Events) API for testing
 */

class MockMessageEvent {
    constructor(type, eventInitDict = {}) {
        this.type = type;
        this.data = eventInitDict.data || '';
        this.lastEventId = eventInitDict.lastEventId || '';
        this.origin = eventInitDict.origin || '';
        this.source = eventInitDict.source || null;
    }
}

class MockEventSource {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSED = 2;

    constructor(url, eventSourceInitDict = {}) {
        this.url = url;
        this.withCredentials = eventSourceInitDict.withCredentials || false;
        this.readyState = MockEventSource.CONNECTING;

        this.onopen = null;
        this.onmessage = null;
        this.onerror = null;

        this._listeners = new Map();
        this._lastEventId = '';

        // Store this instance in the registry
        MockEventSource._instances.push(this);

        // Auto-open after next tick (simulates async connection)
        if (MockEventSource._autoConnect) {
            setTimeout(() => {
                if (this.readyState === MockEventSource.CONNECTING) {
                    this._open();
                }
            }, 0);
        }
    }

    addEventListener(type, listener) {
        if (!this._listeners.has(type)) {
            this._listeners.set(type, []);
        }
        this._listeners.get(type).push(listener);
    }

    removeEventListener(type, listener) {
        if (this._listeners.has(type)) {
            const listeners = this._listeners.get(type);
            const index = listeners.indexOf(listener);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    close() {
        this.readyState = MockEventSource.CLOSED;
    }

    // Internal method to trigger opening
    _open() {
        if (this.readyState !== MockEventSource.CONNECTING) return;

        this.readyState = MockEventSource.OPEN;
        const event = new MockMessageEvent('open');

        if (this.onopen) {
            this.onopen(event);
        }
        this._dispatchEvent('open', event);
    }

    // Internal method to dispatch events
    _dispatchEvent(type, event) {
        if (this._listeners.has(type)) {
            const listeners = this._listeners.get(type);
            listeners.forEach(listener => listener(event));
        }
    }

    // Simulate receiving a message
    _simulateMessage(data, eventType = 'message', id = '') {
        if (this.readyState !== MockEventSource.OPEN) {
            console.warn('EventSource is not open, cannot simulate message');
            return;
        }

        if (id) {
            this._lastEventId = id;
        }

        const event = new MockMessageEvent(eventType, {
            data: typeof data === 'string' ? data : JSON.stringify(data),
            lastEventId: this._lastEventId,
            origin: new URL('https://localhost:' + this.url).origin
        });

        if (eventType === 'message' && this.onmessage) {
            this.onmessage(event);
        }

        this._dispatchEvent(eventType, event);
    }

    // Simulate an error
    _simulateError(error = {}) {
        const event = Object.assign(new Event('error'), error);

        if (this.onerror) {
            this.onerror(event);
        }
        this._dispatchEvent('error', event);
    }

    // Simulate connection close
    _simulateClose() {
        this.readyState = MockEventSource.CLOSED;
    }

    // Static registry of all instances
    static _instances = [];
    static _autoConnect = true;

    // Get all created instances
    static getInstances() {
        return this._instances;
    }

    // Get the last created instance
    static getLastInstance() {
        return this._instances[this._instances.length - 1];
    }

    // Reset the registry
    static reset() {
        this._instances = [];
        this._autoConnect = true;
    }

    // Configure auto-connect behavior
    static setAutoConnect(autoConnect) {
        this._autoConnect = autoConnect;
    }
}

class SSEMock {
    constructor() {
        this.reset();
    }

    reset() {
        MockEventSource.reset();
        this.simulatedConnections = [];
    }

    // Get all EventSource instances created
    getConnections() {
        return MockEventSource.getInstances();
    }

    // Get the last EventSource instance
    getLastConnection() {
        return MockEventSource.getLastInstance();
    }

    // Send a message to a specific connection
    sendMessage(connection, data, eventType = 'message', id = '') {
        connection._simulateMessage(data, eventType, id);
    }

    // Send a message to all connections
    broadcast(data, eventType = 'message', id = '') {
        this.getConnections().forEach(conn => {
            if (conn.readyState === MockEventSource.OPEN) {
                this.sendMessage(conn, data, eventType, id);
            }
        });
    }

    // Send an error to a connection
    sendError(connection, error) {
        connection._simulateError(error);
    }

    // Open a connection
    open(connection) {
        connection._open();
    }

    // Close a connection
    close(connection) {
        connection._simulateClose();
    }

    // Disable auto-connect for manual control
    disableAutoConnect() {
        MockEventSource.setAutoConnect(false);
    }

    // Enable auto-connect (default)
    enableAutoConnect() {
        MockEventSource.setAutoConnect(true);
    }
}

// Create a global instance
const sseMock = new SSEMock();

// Install the mock globally
let originalEventSource;
function installSSEMock() {
    if (typeof globalThis.EventSource !== 'undefined') {
        originalEventSource = globalThis.EventSource;
    }
    globalThis.EventSource = MockEventSource;
}

// Uninstall the mock and restore original EventSource
function uninstallSSEMock() {
    if (originalEventSource) {
        globalThis.EventSource = originalEventSource;
    } else {
        delete globalThis.EventSource;
    }
}