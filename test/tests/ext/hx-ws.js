describe('hx-ws WebSocket extension', function() {
    
    let extBackup;
    let mockWebSocket;
    let mockWebSocketInstances = [];
    
    before(async () => {
        extBackup = backupExtensions();
        clearExtensions();
        
        // Mock WebSocket
        mockWebSocket = class MockWebSocket {
            static CONNECTING = 0;
            static OPEN = 1;
            static CLOSING = 2;
            static CLOSED = 3;
            
            constructor(url) {
                this.url = url;
                this.readyState = MockWebSocket.CONNECTING;
                this.listeners = {};
                mockWebSocketInstances.push(this);
                
                // Simulate connection after a short delay
                setTimeout(() => {
                    this.readyState = MockWebSocket.OPEN;
                    this.triggerEvent('open', {});
                }, 10);
            }
            
            addEventListener(event, handler) {
                if (!this.listeners[event]) this.listeners[event] = [];
                this.listeners[event].push(handler);
            }
            
            removeEventListener(event, handler) {
                if (!this.listeners[event]) return;
                this.listeners[event] = this.listeners[event].filter(h => h !== handler);
            }
            
            send(data) {
                if (this.readyState !== MockWebSocket.OPEN) {
                    throw new Error('WebSocket is not open');
                }
                this.lastSent = data;
            }
            
            close(code = 1000, reason = '') {
                this.readyState = MockWebSocket.CLOSED;
                this.triggerEvent('close', { code, reason });
            }
            
            triggerEvent(event, data) {
                if (this.listeners[event]) {
                    // Add target property to event object for proper event handling
                    const eventObj = { ...data, target: this };
                    this.listeners[event].forEach(handler => handler(eventObj));
                }
            }
            
            // Helper to simulate receiving a message (JSON)
            simulateMessage(data) {
                this.triggerEvent('message', { data: JSON.stringify(data) });
            }
            
            // Helper to simulate receiving raw (non-JSON) message
            simulateRawMessage(data) {
                this.triggerEvent('message', { data: data });
            }
        };
        
        window.WebSocket = mockWebSocket;
        
        // CRITICAL: Approve extension BEFORE loading it
        // Extension registration silently fails if not approved
        htmx.config.extensions = 'ws';
        htmx.__approvedExt = 'ws';
        
        let script = document.createElement('script');
        script.src = '../src/ext/hx-ws.js';
        await new Promise(resolve => {
            script.onload = resolve;
            document.head.appendChild(script);
        });
        
        // Verify extension loaded and registered
        if (!htmx.ext || !htmx.ext.ws) {
            throw new Error('WebSocket extension failed to load');
        }
        if (!htmx.__registeredExt.has('ws')) {
            throw new Error('WebSocket extension failed to register - check approval');
        }
    });
    
    after(() => {
        restoreExtensions(extBackup);
    });
    
    beforeEach(() => {
        setupTest(this.currentTest);
        mockWebSocketInstances = [];
        if (htmx.ext && htmx.ext.ws && htmx.ext.ws.getRegistry) {
            htmx.ext.ws.getRegistry().clear();
        }
    });
    
    afterEach(() => {
        cleanupTest(this.currentTest);
        // Close all mock WebSocket connections
        mockWebSocketInstances.forEach(ws => {
            if (ws.readyState === mockWebSocket.OPEN) {
                ws.close();
            }
        });
    });
    
    // Helper to check if URL ends with expected path (accounts for URL normalization)
    function urlEndsWith(url, expectedPath) {
        return url.endsWith(expectedPath);
    }
    
    // Helper to get normalized URL for registry lookups
    function getNormalizedUrl(path) {
        // The extension normalizes /path to ws://host/path or wss://host/path
        let protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return protocol + '//' + window.location.host + path;
    }
    
    // ========================================
    // 1. CONNECTION LIFECYCLE TESTS
    // ========================================
    
    describe('Connection Lifecycle', function() {
        
        it('creates connection on hx-ws:connect with load trigger', async function() {
            let div = createProcessedHTML('<div hx-ext="ws" hx-ws:connect="/ws/test" hx-trigger="load"></div>');
            await htmx.timeout(50);
            assert.equal(mockWebSocketInstances.length, 1);
            assert.isTrue(urlEndsWith(mockWebSocketInstances[0].url, '/ws/test'), 'URL should end with /ws/test');
        });
        
        it('auto-connects by default without explicit trigger', async function() {
            let div = createProcessedHTML('<div hx-ws:connect="/ws/test"></div>');
            await htmx.timeout(50);
            assert.equal(mockWebSocketInstances.length, 1, 'Should auto-connect when no trigger is specified');
        });
        
        it('connects on custom trigger event', async function() {
            let div = createProcessedHTML('<div hx-ws:connect="/ws/test" hx-trigger="click"></div>');
            await htmx.timeout(20);
            assert.equal(mockWebSocketInstances.length, 0);
            
            div.click();
            await htmx.timeout(50);
            assert.equal(mockWebSocketInstances.length, 1);
        });

        it('connects with delay modifier', async function() {
            createProcessedHTML('<div hx-ws:connect="/ws/test" hx-trigger="load delay:100ms"></div>');
            await htmx.timeout(20);
            assert.equal(mockWebSocketInstances.length, 0, 'Should not connect before delay');
            await htmx.timeout(120);
            assert.equal(mockWebSocketInstances.length, 1, 'Should connect after delay');
        });

        it('connects on click once modifier', async function() {
            let div = createProcessedHTML('<div hx-ws:connect="/ws/test" hx-trigger="click once"></div>');
            await htmx.timeout(20);
            assert.equal(mockWebSocketInstances.length, 0, 'Should not connect before click');

            div.click();
            await htmx.timeout(50);
            assert.equal(mockWebSocketInstances.length, 1, 'Should connect on first click');

            // Reset to check that second click doesn't create new connection attempt
            // (once modifier removes the listener after first fire)
            div._htmx.wsUrl = null;
            div._htmx.wsInitialized = false;
            div.click();
            await htmx.timeout(50);
            assert.equal(mockWebSocketInstances.length, 1, 'Second click should not reconnect (once modifier)');
        });

        it('reuses connection for same URL', async function() {
            let container = createProcessedHTML(`
                <div>
                    <div id="div1" hx-ws:connect="/ws/shared" hx-trigger="load"></div>
                    <div id="div2" hx-ws:connect="/ws/shared" hx-trigger="load"></div>
                </div>
            `);
            await htmx.timeout(50);
            assert.equal(mockWebSocketInstances.length, 1, 'Should only create one WebSocket for shared URL');
        });
        
        it('creates separate connections for different URLs', async function() {
            let container = createProcessedHTML(`
                <div>
                    <div id="div1" hx-ws:connect="/ws/channel1" hx-trigger="load"></div>
                    <div id="div2" hx-ws:connect="/ws/channel2" hx-trigger="load"></div>
                </div>
            `);
            await htmx.timeout(50);
            assert.equal(mockWebSocketInstances.length, 2);
        });
        
        it('increments refCount for shared connections', async function() {
            let container = createProcessedHTML(`
                <div>
                    <div id="div1" hx-ws:connect="/ws/shared" hx-trigger="load"></div>
                    <div id="div2" hx-ws:connect="/ws/shared" hx-trigger="load"></div>
                </div>
            `);
            await htmx.timeout(50);
            
            // Access internal registry (this assumes the extension exposes it for testing)
            // Registry now uses normalized URLs, so we can pass relative path (it normalizes internally)
            let registry = htmx.ext.ws.getRegistry?.();
            if (registry) {
                let entry = registry.get('/ws/shared');
                assert.isNotNull(entry, 'Should find entry for /ws/shared');
                assert.equal(entry.refCount, 2);
            }
        });
        
        it('closes connection when last element is removed', async function() {
            let container = createProcessedHTML(`
                <div id="container">
                    <div id="div1" hx-ws:connect="/ws/test" hx-trigger="load"></div>
                </div>
            `);
            await htmx.timeout(50);
            assert.equal(mockWebSocketInstances.length, 1);
            
            let ws = mockWebSocketInstances[0];
            
            await htmx.swap({
                text: '',
                target: document.getElementById('container'),
                swap: 'innerHTML'
            });
            await htmx.timeout(50);
            
            assert.equal(ws.readyState, mockWebSocket.CLOSED);
        });
        
        it('keeps connection open when one of multiple elements is removed', async function() {
            let container = createProcessedHTML(`
                <div id="container">
                    <div id="div1" hx-ws:connect="/ws/shared" hx-trigger="load"></div>
                    <div id="div2" hx-ws:connect="/ws/shared" hx-trigger="load"></div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            
            await htmx.swap({
                text: '',
                target: document.getElementById('div1'),
                swap: 'delete'
            });
            await htmx.timeout(50);
            
            assert.equal(ws.readyState, mockWebSocket.OPEN);
        });
    });
    
    // ========================================
    // 2. MESSAGE SENDING TESTS
    // ========================================
    
    describe('Message Sending', function() {
        
        it('sends message with hx-ws:send on form submit', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/chat" hx-trigger="load">
                    <form hx-ws:send hx-trigger="submit">
                        <input name="message" value="hello">
                        <button type="submit">Send</button>
                    </form>
                </div>
            `);
            await htmx.timeout(50);
            
            let form = div.querySelector('form');
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            await htmx.timeout(20);
            
            let ws = mockWebSocketInstances[0];
            assert.isDefined(ws.lastSent);
            
            let sent = JSON.parse(ws.lastSent);
            assert.equal(sent.type, 'request');
            assert.isDefined(sent.request_id);
            assert.equal(sent.values.message, 'hello');
        });
        
        it('includes hx-vals in sent message', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load">
                    <button hx-ws:send hx-vals='{"extra": "data"}' hx-trigger="click">Send</button>
                </div>
            `);
            await htmx.timeout(50);
            
            let button = div.querySelector('button');
            button.click();
            await htmx.timeout(20);
            
            let ws = mockWebSocketInstances[0];
            let sent = JSON.parse(ws.lastSent);
            assert.equal(sent.values.extra, 'data');
        });
        
        it('finds connection from nearest ancestor', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/outer" hx-trigger="load">
                    <div>
                        <button id="btn" hx-ws:send hx-trigger="click">Send</button>
                    </div>
                </div>
            `);
            await htmx.timeout(50);
            
            document.getElementById('btn').click();
            await htmx.timeout(20);
            
            let ws = mockWebSocketInstances[0];
            assert.isDefined(ws.lastSent);
        });
        
        it('creates own connection if hx-ws:send has path', async function() {
            let button = createProcessedHTML('<button hx-ws:send="/ws/direct" hx-trigger="click">Send</button>');
            button.click();
            await htmx.timeout(50);
            
            assert.equal(mockWebSocketInstances.length, 1);
            assert.isTrue(urlEndsWith(mockWebSocketInstances[0].url, '/ws/direct'), 'URL should end with /ws/direct');
        });
        
        it('send respects delay modifier', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load">
                    <button id="delayed-btn" hx-ws:send hx-trigger="click delay:100ms">Send</button>
                </div>
            `);
            await htmx.timeout(50);
            let ws = mockWebSocketInstances[0];

            document.getElementById('delayed-btn').click();
            await htmx.timeout(20);
            assert.isUndefined(ws.lastSent, 'Should not send before delay');

            await htmx.timeout(120);
            assert.isDefined(ws.lastSent, 'Should send after delay');
        });

        it('includes element id in message context', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load">
                    <button id="my-button" hx-ws:send hx-trigger="click">Send</button>
                </div>
            `);
            await htmx.timeout(50);
            
            document.getElementById('my-button').click();
            await htmx.timeout(20);
            
            let ws = mockWebSocketInstances[0];
            let sent = JSON.parse(ws.lastSent);
            assert.equal(sent.id, 'my-button');
        });
        
        it('generates unique request_id for each message', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load">
                    <button hx-ws:send hx-trigger="click">Send</button>
                </div>
            `);
            await htmx.timeout(50);
            
            let button = div.querySelector('button');
            button.click();
            await htmx.timeout(20);
            let firstId = JSON.parse(mockWebSocketInstances[0].lastSent).request_id;
            
            button.click();
            await htmx.timeout(20);
            let secondId = JSON.parse(mockWebSocketInstances[0].lastSent).request_id;
            
            assert.notEqual(firstId, secondId);
        });
        
        it('includes async hx-vals (js:) in sent message', async function() {
            window.testAsyncValue = () => new Promise(resolve => setTimeout(() => resolve('asyncValue'), 10));
            
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load">
                    <button hx-ws:send hx-vals='js:{asyncField: await testAsyncValue()}' hx-trigger="click">Send</button>
                </div>
            `);
            await htmx.timeout(50);
            
            let button = div.querySelector('button');
            button.click();
            await htmx.timeout(20);
            
            let ws = mockWebSocketInstances[0];
            let sent = JSON.parse(ws.lastSent);
            assert.equal(sent.values.asyncField, 'asyncValue');
            
            delete window.testAsyncValue;
        });
    });
    
    // ========================================
    // 3. MESSAGE RECEIVING & HTML HANDLING
    // ========================================
    
    describe('Message Receiving and HTML Handling', function() {
        
        it('swaps HTML partial into target element', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load" hx-target="#messages">
                    <div id="messages"></div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                channel: 'ui',
                format: 'html',
                payload: '<hx-partial id="messages"><p>New message</p></hx-partial>'
            });
            await htmx.timeout(20);
            
            let messages = document.getElementById('messages');
            assert.include(messages.innerHTML, 'New message');
        });
        
        it('uses default swap strategy (innerHTML)', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load" hx-target="#content">
                    <div id="content">Old</div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                channel: 'ui',
                format: 'html',
                payload: '<hx-partial id="content">New</hx-partial>'
            });
            await htmx.timeout(20);
            
            assert.equal(document.getElementById('content').textContent, 'New');
        });
        
        it('respects hx-swap attribute on partial', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load" hx-target="#list">
                    <div id="list"><p>Item 1</p></div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                channel: 'ui',
                format: 'html',
                payload: '<hx-partial id="list" hx-swap="beforeend"><p>Item 2</p></hx-partial>'
            });
            await htmx.timeout(20);
            
            let list = document.getElementById('list');
            assert.include(list.innerHTML, 'Item 1');
            assert.include(list.innerHTML, 'Item 2');
        });
        
        it('handles multiple partials in one message', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load">
                    <div id="header"></div>
                    <div id="content"></div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                channel: 'ui',
                format: 'html',
                payload: `
                    <hx-partial id="header"><h1>Title</h1></hx-partial>
                    <hx-partial id="content"><p>Body</p></hx-partial>
                `
            });
            await htmx.timeout(20);
            
            assert.include(document.getElementById('header').innerHTML, 'Title');
            assert.include(document.getElementById('content').innerHTML, 'Body');
        });
        
        it('executes script tags in swapped content', async function() {
            // Clean up any existing test variable
            delete window.wsScriptTestValue;

            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load" hx-target="#content">
                    <div id="content"></div>
                </div>
            `);
            await htmx.timeout(50);

            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                channel: 'ui',
                format: 'html',
                payload: '<hx-partial id="content"><div>Content</div><script>window.wsScriptTestValue = "executed";</script></hx-partial>'
            });
            await htmx.timeout(20);

            assert.equal(window.wsScriptTestValue, 'executed', 'Script tag should have been executed');

            // Clean up
            delete window.wsScriptTestValue;
        });

        it('executes multiple script tags in swapped content', async function() {
            // Clean up any existing test variables
            delete window.wsScriptTest1;
            delete window.wsScriptTest2;

            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load" hx-target="#content">
                    <div id="content"></div>
                </div>
            `);
            await htmx.timeout(50);

            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                channel: 'ui',
                format: 'html',
                payload: '<hx-partial id="content"><script>window.wsScriptTest1 = 1;</script><div>Content</div><script>window.wsScriptTest2 = 2;</script></hx-partial>'
            });
            await htmx.timeout(20);

            assert.equal(window.wsScriptTest1, 1, 'First script tag should have been executed');
            assert.equal(window.wsScriptTest2, 2, 'Second script tag should have been executed');

            // Clean up
            delete window.wsScriptTest1;
            delete window.wsScriptTest2;
        });

        it('preserves script tag attributes when executing', async function() {
            // Clean up any existing test variable
            delete window.wsScriptAttrTest;

            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load" hx-target="#content">
                    <div id="content"></div>
                </div>
            `);
            await htmx.timeout(50);

            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                channel: 'ui',
                format: 'html',
                payload: '<hx-partial id="content"><script data-testattr="testvalue">window.wsScriptAttrTest = document.currentScript.getAttribute("data-testattr");</script></hx-partial>'
            });
            await htmx.timeout(20);

            assert.equal(window.wsScriptAttrTest, 'testvalue', 'Script should access its own attributes');

            // Clean up
            delete window.wsScriptAttrTest;
        });

        it('matches request_id for request/response pattern', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load">
                    <button id="btn" hx-ws:send hx-trigger="click" hx-target="#result">Send</button>
                    <div id="result"></div>
                </div>
            `);
            await htmx.timeout(50);
            
            let button = document.getElementById('btn');
            button.click();
            await htmx.timeout(20);
            
            let ws = mockWebSocketInstances[0];
            let sent = JSON.parse(ws.lastSent);
            
            ws.simulateMessage({
                channel: 'ui',
                format: 'html',
                payload: '<hx-partial id="result">Response</hx-partial>',
                request_id: sent.request_id
            });
            await htmx.timeout(20);
            
            assert.include(document.getElementById('result').innerHTML, 'Response');
        });
    });
    
    // ========================================
    // 4. CUSTOM CHANNEL TESTS
    // ========================================
    
    describe('Custom Channels', function() {
        
        it('emits after:ws:message for non-ui channel messages without swapping', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load" hx-target="#content">
                    <div id="content">Original</div>
                </div>
            `);
            await htmx.timeout(50);

            let eventFired = false;
            let eventEnvelope = null;
            container.addEventListener('htmx:after:ws:message', (e) => {
                eventFired = true;
                eventEnvelope = e.detail.envelope;
            });

            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                channel: 'audio',
                format: 'binary',
                payload: 'base64data'
            });
            await htmx.timeout(20);

            assert.isTrue(eventFired);
            assert.equal(eventEnvelope.channel, 'audio');
            assert.equal(document.getElementById('content').textContent, 'Original', 'Non-ui messages should not swap');
        });
        
        it('does not auto-swap JSON channel messages', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load" hx-target="#data">
                    <div id="data"></div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                channel: 'json',
                format: 'json',
                payload: { foo: 'bar' }
            });
            await htmx.timeout(20);
            
            assert.equal(document.getElementById('data').innerHTML, '');
        });
        
        it('fires htmx:before:ws:message for all messages', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load"></div>
            `);
            await htmx.timeout(50);
            
            let beforeFired = false;
            container.addEventListener('htmx:before:ws:message', () => {
                beforeFired = true;
            });
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                channel: 'ui',
                format: 'html',
                payload: '<hx-partial id="test">Test</hx-partial>'
            });
            await htmx.timeout(20);
            
            assert.isTrue(beforeFired);
        });
        
        it('allows canceling message processing via event', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load" hx-target="#content">
                    <div id="content">Original</div>
                </div>
            `);
            await htmx.timeout(50);
            
            container.addEventListener('htmx:before:ws:message', (e) => {
                e.preventDefault();
            });
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                channel: 'ui',
                format: 'html',
                payload: '<hx-partial id="content">Changed</hx-partial>'
            });
            await htmx.timeout(20);
            
            assert.equal(document.getElementById('content').textContent, 'Original');
        });
    });
    
    // ========================================
    // 5. ERROR HANDLING & RECONNECTION
    // ========================================
    
    describe('Error Handling and Reconnection', function() {
        
        it('emits htmx:ws:error on connection error', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load"></div>
            `);
            
            let errorFired = false;
            container.addEventListener('htmx:ws:error', () => {
                errorFired = true;
            });
            
            await htmx.timeout(50);
            let ws = mockWebSocketInstances[0];
            ws.triggerEvent('error', { message: 'Connection failed' });
            await htmx.timeout(20);
            
            assert.isTrue(errorFired);
        });
        
        it('emits htmx:ws:close on connection close', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load"></div>
            `);
            
            let closeFired = false;
            container.addEventListener('htmx:ws:close', () => {
                closeFired = true;
            });
            
            await htmx.timeout(50);
            let ws = mockWebSocketInstances[0];
            ws.close();
            await htmx.timeout(20);
            
            assert.isTrue(closeFired);
        });
        
        it('attempts reconnection on close when config.reconnect is true', async function() {
            htmx.config.websockets = { reconnect: true, reconnectDelay: 50 };
            
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load"></div>
            `);
            await htmx.timeout(50);
            
            let firstWs = mockWebSocketInstances[0];
            firstWs.close();
            await htmx.timeout(100);
            
            assert.isTrue(mockWebSocketInstances.length > 1, 'Should create new WebSocket for reconnection');
        });
        
        it('does not reconnect when config.reconnect is false', async function() {
            htmx.config.websockets = { reconnect: false };
            
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load"></div>
            `);
            await htmx.timeout(50);
            
            let firstWs = mockWebSocketInstances[0];
            firstWs.close();
            await htmx.timeout(100);
            
            assert.equal(mockWebSocketInstances.length, 1);
        });
        
        it('emits htmx:before:ws:connection with attempt > 0 on reconnect', async function() {
            htmx.config.websockets = { reconnect: true, reconnectDelay: 50 };

            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load"></div>
            `);

            let reconnectAttempt = null;
            container.addEventListener('htmx:before:ws:connection', (e) => {
                if (e.detail.connection.attempt > 0) {
                    reconnectAttempt = e.detail.connection.attempt;
                }
            });

            await htmx.timeout(50);
            let firstWs = mockWebSocketInstances[0];
            firstWs.close();
            await htmx.timeout(100);

            assert.equal(reconnectAttempt, 1);
        });
        
        it('uses exponential backoff for reconnection', async function() {
            htmx.config.websockets = { 
                reconnect: true, 
                reconnectDelay: 100,
                reconnectMaxDelay: 1000
            };
            
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load"></div>
            `);
            await htmx.timeout(50);
            
            let reconnectTimes = [];
            container.addEventListener('htmx:before:ws:connection', (e) => {
                if (e.detail.connection.attempt > 0) {
                    reconnectTimes.push(Date.now());
                }
            });
            
            // First close
            let ws = mockWebSocketInstances[mockWebSocketInstances.length - 1];
            ws.close();
            await htmx.timeout(200);
            
            // Second close
            ws = mockWebSocketInstances[mockWebSocketInstances.length - 1];
            ws.close();
            await htmx.timeout(300);
            
            // Third close
            ws = mockWebSocketInstances[mockWebSocketInstances.length - 1];
            ws.close();
            await htmx.timeout(500);
            
            // Verify delays are increasing
            assert.isTrue(reconnectTimes.length >= 3, 'Should have at least 3 reconnect attempts');
            let firstDelay = reconnectTimes[1] - reconnectTimes[0];
            let secondDelay = reconnectTimes[2] - reconnectTimes[1];
            assert.isTrue(secondDelay >= firstDelay, 'Second delay should be >= first delay');
        });
        
        it('emits htmx:ws:error when send fails', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load">
                    <button hx-ws:send hx-trigger="click">Send</button>
                </div>
            `);
            await htmx.timeout(50);

            let errorFired = false;
            container.addEventListener('htmx:ws:error', () => {
                errorFired = true;
            });
            
            // Close the connection
            let ws = mockWebSocketInstances[0];
            ws.close();
            await htmx.timeout(20);
            
            // Try to send
            container.querySelector('button').click();
            await htmx.timeout(20);
            
            assert.isTrue(errorFired);
        });
        
        it('swaps non-JSON messages as raw HTML into hx-target', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load" hx-target="#content">
                    <div id="content">Original</div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateRawMessage('<hx-partial id="content"><p>Raw HTML update</p></hx-partial>');
            await htmx.timeout(20);
            
            assert.include(document.getElementById('content').innerHTML, 'Raw HTML update');
        });

        it('uses swap:none for non-JSON messages without hx-target', async function() {
            let container = createProcessedHTML(`
                <div id="ws-conn" hx-ws:connect="/ws/test" hx-trigger="load">
                    <div id="content">Original</div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            // Send raw HTML without hx-partial targeting — should not wipe connection element
            ws.simulateRawMessage('<p>Should not appear</p>');
            await htmx.timeout(20);
            
            // Connection element content should be preserved
            assert.include(document.getElementById('ws-conn').innerHTML, 'Original');
        });

        it('processes hx-partial in non-JSON messages even without hx-target', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load">
                    <div id="widget">Old</div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateRawMessage('<hx-partial id="widget"><p>Updated via partial</p></hx-partial>');
            await htmx.timeout(20);
            
            assert.include(document.getElementById('widget').innerHTML, 'Updated via partial');
        });

        it('fires htmx:before:ws:message for non-JSON data with envelope=null', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load" hx-target="#content">
                    <div id="content">Original</div>
                </div>
            `);
            await htmx.timeout(50);

            let eventFired = false;
            let receivedData = null;
            let receivedEnvelope = 'not-set';
            container.addEventListener('htmx:before:ws:message', (e) => {
                eventFired = true;
                receivedData = e.detail.data;
                receivedEnvelope = e.detail.envelope;
            });

            let ws = mockWebSocketInstances[0];
            ws.simulateRawMessage('<p>Raw content</p>');
            await htmx.timeout(20);

            assert.isTrue(eventFired);
            assert.equal(receivedData, '<p>Raw content</p>');
            assert.isNull(receivedEnvelope, 'envelope should be null for raw messages');
        });

        it('prevents swap when htmx:before:ws:message is cancelled for raw data', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load" hx-target="#content">
                    <div id="content">Original</div>
                </div>
            `);
            await htmx.timeout(50);

            container.addEventListener('htmx:before:ws:message', (e) => {
                if (!e.detail.envelope) e.preventDefault();
            });

            let ws = mockWebSocketInstances[0];
            ws.simulateRawMessage('<hx-partial id="content"><p>Should not appear</p></hx-partial>');
            await htmx.timeout(20);

            assert.equal(document.getElementById('content').textContent, 'Original');
        });
    });
    
    // ========================================
    // 6. CONFIGURATION TESTS
    // ========================================
    
    describe('Configuration', function() {
        
        it('defers connection when explicit trigger is specified', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="click"></div>
            `);
            await htmx.timeout(50);
            
            // Should not connect immediately when explicit trigger is set
            assert.equal(mockWebSocketInstances.length, 0, 'Should not connect until trigger fires');
        });
        
        it('uses custom reconnectDelay from config', async function() {
            htmx.config.websockets = { 
                reconnect: true, 
                reconnectDelay: 200 
            };
            
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load"></div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            let closeTime = Date.now();
            ws.close();
            
            await htmx.timeout(100);
            assert.equal(mockWebSocketInstances.length, 1, 'Should not reconnect yet');
            
            await htmx.timeout(150);
            assert.isTrue(mockWebSocketInstances.length > 1, 'Should reconnect after delay');
        });
        
        it('applies reconnectJitter when enabled', async function() {
            htmx.config.websockets = { 
                reconnect: true, 
                reconnectDelay: 100,
                reconnectJitter: 0.3
            };
            
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load"></div>
            `);
            await htmx.timeout(50);
            
            // This test just ensures jitter doesn't break reconnection
            let ws = mockWebSocketInstances[0];
            ws.close();
            await htmx.timeout(200);
            
            assert.isTrue(mockWebSocketInstances.length > 1);
        });

        it('reconnectMaxAttempts limits reconnection attempts on consecutive failures', async function() {
            htmx.config.websockets = {
                reconnect: true,
                reconnectDelay: 20,
                reconnectMaxAttempts: 2,
                reconnectJitter: 0
            };

            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load"></div>
            `);
            await htmx.timeout(50);

            let reconnectCount = 0;
            container.addEventListener('htmx:before:ws:connection', (e) => {
                if (e.detail.connection.attempt > 0) reconnectCount++;
            });

            // Close the first connection — this triggers reconnect attempt 1
            let ws = mockWebSocketInstances[0];
            ws.close();
            await htmx.timeout(50);

            // The reconnected socket auto-opens (mock behavior), which resets
            // attempts to 0. Close it immediately before it opens to simulate
            // consecutive failures. Override mock to not auto-open.
            for (let i = 1; i < mockWebSocketInstances.length; i++) {
                let reconnectedWs = mockWebSocketInstances[i];
                // Close immediately to prevent the open handler from resetting attempts
                reconnectedWs.readyState = mockWebSocket.CLOSED;
                reconnectedWs.triggerEvent('close', { code: 1006, reason: '', target: reconnectedWs });
            }

            // Wait for remaining reconnect attempts to exhaust
            await htmx.timeout(200);

            assert.equal(reconnectCount, 2, 'Should fire before:ws:connection for exactly 2 reconnect attempts');
        });

        it('reconnectJitter with numeric factor varies delays', async function() {
            htmx.config.websockets = {
                reconnect: true,
                reconnectDelay: 100,
                reconnectMaxAttempts: 5,
                reconnectJitter: 0.5
            };

            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load"></div>
            `);
            await htmx.timeout(50);

            let delays = [];
            container.addEventListener('htmx:before:ws:connection', (e) => {
                if (e.detail.connection.attempt > 0) {
                    delays.push(e.detail.connection.delay);
                }
            });

            let ws = mockWebSocketInstances[mockWebSocketInstances.length - 1];
            ws.close();
            await htmx.timeout(200);

            assert.isAtLeast(delays.length, 1, 'Should have at least 1 reconnect');
            // With jitter 0.5, first delay should be in range [50, 150]
            assert.isAtLeast(delays[0], 50, 'Delay should be >= 50 (100 - 50)');
            assert.isAtMost(delays[0], 150, 'Delay should be <= 150 (100 + 50)');
        });

        it('reconnectJitter of 0 produces exact base delay', async function() {
            htmx.config.websockets = {
                reconnect: true,
                reconnectDelay: 20,
                reconnectMaxAttempts: 3,
                reconnectJitter: 0
            };

            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load"></div>
            `);
            await htmx.timeout(50);

            let delays = [];
            container.addEventListener('htmx:before:ws:connection', (e) => {
                if (e.detail.connection.attempt > 0) {
                    delays.push(e.detail.connection.delay);
                }
            });

            // Each reconnect succeeds (mock auto-opens), so reconnectAttempts
            // resets to 0 — each subsequent close starts at attempt 1 again
            let ws = mockWebSocketInstances[mockWebSocketInstances.length - 1];
            ws.close();
            await htmx.timeout(50);

            ws = mockWebSocketInstances[mockWebSocketInstances.length - 1];
            ws.close();
            await htmx.timeout(50);

            assert.isAtLeast(delays.length, 2, 'Should have at least 2 reconnects');
            assert.equal(delays[0], 20, 'First delay should be exactly 20ms');
            assert.equal(delays[1], 20, 'Second delay should also be 20ms (attempts reset on successful open)');
        });

        it('htmx:before:ws:connection allows modifying reconnect delay', async function() {
            htmx.config.websockets = {
                reconnect: true,
                reconnectDelay: 500,
                reconnectMaxAttempts: 2,
                reconnectJitter: 0
            };

            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load"></div>
            `);
            await htmx.timeout(50);

            // Override delay to be very short
            container.addEventListener('htmx:before:ws:connection', (e) => {
                if (e.detail.connection.attempt > 0) {
                    e.detail.connection.delay = 10;
                }
            });

            let ws = mockWebSocketInstances[0];
            ws.close();
            // With original 500ms delay this would timeout, but we override to 10ms
            await htmx.timeout(50);

            assert.isTrue(mockWebSocketInstances.length > 1, 'Should reconnect with modified delay');
        });

        it('htmx:ws:error fires for send failures with error message', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load">
                    <button hx-ws:send hx-trigger="click">Send</button>
                </div>
            `);
            await htmx.timeout(50);

            let errorMsg = null;
            container.addEventListener('htmx:ws:error', (e) => {
                errorMsg = e.detail.error;
            });

            mockWebSocketInstances[0].close();
            await htmx.timeout(20);

            container.querySelector('button').click();
            await htmx.timeout(20);

            assert.equal(errorMsg, 'Connection not open');
        });

        it('raw messages go through before/after:ws:message with envelope=null', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load" hx-target="#content">
                    <div id="content">Original</div>
                </div>
            `);
            await htmx.timeout(50);

            let beforeDetail = null;
            let afterDetail = null;
            container.addEventListener('htmx:before:ws:message', (e) => {
                beforeDetail = e.detail;
            });
            container.addEventListener('htmx:after:ws:message', (e) => {
                afterDetail = e.detail;
            });

            let ws = mockWebSocketInstances[0];
            ws.simulateRawMessage('<hx-partial id="content"><p>Updated</p></hx-partial>');
            await htmx.timeout(20);

            assert.isNotNull(beforeDetail, 'before:ws:message should fire for raw messages');
            assert.isNull(beforeDetail.envelope, 'envelope should be null for raw messages');
            assert.equal(beforeDetail.data, '<hx-partial id="content"><p>Updated</p></hx-partial>');

            assert.isNotNull(afterDetail, 'after:ws:message should fire for raw messages');
            assert.isNull(afterDetail.envelope, 'envelope should be null in after event too');
        });

        it('JSON messages go through before/after:ws:message with envelope', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load" hx-target="#content">
                    <div id="content"></div>
                </div>
            `);
            await htmx.timeout(50);

            let beforeDetail = null;
            container.addEventListener('htmx:before:ws:message', (e) => {
                beforeDetail = e.detail;
            });

            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                channel: 'ui',
                format: 'html',
                payload: '<hx-partial id="content">New</hx-partial>'
            });
            await htmx.timeout(20);

            assert.isNotNull(beforeDetail, 'before:ws:message should fire');
            assert.isNotNull(beforeDetail.envelope, 'envelope should be set for JSON messages');
            assert.equal(beforeDetail.envelope.channel, 'ui');
            assert.isString(beforeDetail.data, 'data should be the raw JSON string');
        });
    });

    // ========================================
    // 7. EVENT EMISSION TESTS
    // ========================================
    
    describe('Event Emission', function() {
        
        it('emits htmx:before:ws:connection before connection', async function() {
            let beforeFired = false;
            let attempt = null;
            let container = document.createElement('div');
            container.innerHTML = '<div hx-ws:connect="/ws/test" hx-trigger="load"></div>';

            container.addEventListener('htmx:before:ws:connection', (e) => {
                beforeFired = true;
                attempt = e.detail.connection.attempt;
            });

            document.body.appendChild(container);
            htmx.process(container);
            await htmx.timeout(20);

            assert.isTrue(beforeFired);
            assert.equal(attempt, 0, 'Initial connection should have attempt=0');
            container.remove();
        });

        it('emits htmx:after:ws:connection after connection', async function() {
            let afterFired = false;
            let container = document.createElement('div');
            container.innerHTML = '<div hx-ws:connect="/ws/test" hx-trigger="load"></div>';

            container.addEventListener('htmx:after:ws:connection', () => {
                afterFired = true;
            });

            document.body.appendChild(container);
            htmx.process(container);
            await htmx.timeout(50);

            assert.isTrue(afterFired);
            container.remove();
        });

        it('can cancel initial connection via htmx:before:ws:connection', async function() {
            let container = document.createElement('div');
            container.innerHTML = '<div hx-ws:connect="/ws/test" hx-trigger="load"></div>';

            container.addEventListener('htmx:before:ws:connection', (e) => {
                e.detail.connection.cancelled = true;
            });

            document.body.appendChild(container);
            htmx.process(container);
            await htmx.timeout(50);

            assert.equal(mockWebSocketInstances.length, 0, 'Connection should be cancelled');
            container.remove();
        });

        it('can cancel reconnection via htmx:before:ws:connection', async function() {
            htmx.config.websockets = { reconnect: true, reconnectDelay: 50 };

            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load"></div>
            `);

            container.addEventListener('htmx:before:ws:connection', (e) => {
                if (e.detail.connection.attempt > 0) {
                    e.detail.connection.cancelled = true;
                }
            });

            await htmx.timeout(50);
            let firstWs = mockWebSocketInstances[0];
            firstWs.close();
            await htmx.timeout(150);

            assert.equal(mockWebSocketInstances.length, 1, 'Should not reconnect when cancelled');
        });
        
        it('emits htmx:before:ws:send before sending', async function() {
            let beforeFired = false;
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load">
                    <button hx-ws:send hx-trigger="click">Send</button>
                </div>
            `);
            
            div.addEventListener('htmx:before:ws:send', () => {
                beforeFired = true;
            });
            
            await htmx.timeout(50);
            div.querySelector('button').click();
            await htmx.timeout(20);
            
            assert.isTrue(beforeFired);
        });
        
        it('emits htmx:after:ws:send after sending', async function() {
            let afterFired = false;
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load">
                    <button hx-ws:send hx-trigger="click">Send</button>
                </div>
            `);
            
            div.addEventListener('htmx:after:ws:send', () => {
                afterFired = true;
            });
            
            await htmx.timeout(50);
            div.querySelector('button').click();
            await htmx.timeout(20);
            
            assert.isTrue(afterFired);
        });
        
        it('allows modifying message via htmx:before:ws:send', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load">
                    <button hx-ws:send hx-trigger="click">Send</button>
                </div>
            `);
            
            div.addEventListener('htmx:before:ws:send', (e) => {
                e.detail.data.custom = 'added';
            });
            
            await htmx.timeout(50);
            div.querySelector('button').click();
            await htmx.timeout(20);
            
            let ws = mockWebSocketInstances[0];
            let sent = JSON.parse(ws.lastSent);
            assert.equal(sent.custom, 'added');
        });
        
        it('can cancel send via htmx:before:ws:send', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load">
                    <button hx-ws:send hx-trigger="click">Send</button>
                </div>
            `);
            
            div.addEventListener('htmx:before:ws:send', (e) => {
                e.preventDefault();
            });
            
            await htmx.timeout(50);
            div.querySelector('button').click();
            await htmx.timeout(20);
            
            let ws = mockWebSocketInstances[0];
            assert.isUndefined(ws.lastSent);
        });
    });
    
    // ========================================
    // 8. BACKWARD COMPATIBILITY TESTS
    // ========================================
    
    describe('Backward Compatibility', function() {
        
        it('supports legacy ws-connect attribute with deprecation warning', async function() {
            let warnCalled = false;
            let originalWarn = console.warn;
            console.warn = () => { warnCalled = true; };
            
            let container = createProcessedHTML(`
                <div hx-ext="ws" ws-connect="/ws/test" hx-trigger="load"></div>
            `);
            await htmx.timeout(50);
            
            console.warn = originalWarn;
            
            // Should still create connection
            assert.equal(mockWebSocketInstances.length, 1);
            // Should warn about deprecation
            assert.isTrue(warnCalled);
        });
        
        it('supports legacy ws-send attribute', async function() {
            let div = createProcessedHTML(`
                <div hx-ext="ws" ws-connect="/ws/test" hx-trigger="load">
                    <button ws-send hx-trigger="click">Send</button>
                </div>
            `);
            await htmx.timeout(50);
            
            div.querySelector('button').click();
            await htmx.timeout(20);
            
            let ws = mockWebSocketInstances[0];
            assert.isDefined(ws.lastSent);
        });
    });
    
    // ========================================
    // 9. INTEGRATION TESTS
    // ========================================
    
    describe('Integration Scenarios', function() {
        
        it('handles chat application pattern', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/chat" hx-trigger="load" hx-target="#messages" hx-swap="beforeend">
                    <div id="messages"></div>
                    <form hx-ws:send hx-trigger="submit">
                        <input name="message" value="Hello">
                        <button type="submit">Send</button>
                    </form>
                </div>
            `);
            await htmx.timeout(50);
            
            // Send a message
            let form = div.querySelector('form');
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            await htmx.timeout(20);
            
            // Simulate server response
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                channel: 'ui',
                format: 'html',
                payload: '<hx-partial id="messages"><p>Hello</p></hx-partial>'
            });
            await htmx.timeout(20);
            
            assert.include(document.getElementById('messages').innerHTML, 'Hello');
        });
        
        it('handles live notifications pattern', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/notifications" hx-trigger="load" hx-target="#notifications">
                    <div id="notifications"></div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            
            // Receive multiple notifications
            ws.simulateMessage({
                channel: 'ui',
                format: 'html',
                payload: '<hx-partial id="notifications" hx-swap="afterbegin"><div class="notif">Notification 1</div></hx-partial>'
            });
            await htmx.timeout(20);
            
            ws.simulateMessage({
                channel: 'ui',
                format: 'html',
                payload: '<hx-partial id="notifications" hx-swap="afterbegin"><div class="notif">Notification 2</div></hx-partial>'
            });
            await htmx.timeout(20);
            
            let notifications = document.getElementById('notifications');
            assert.include(notifications.innerHTML, 'Notification 1');
            assert.include(notifications.innerHTML, 'Notification 2');
        });
        
        it('handles real-time dashboard with multiple widgets', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/dashboard" hx-trigger="load">
                    <div id="widget1"></div>
                    <div id="widget2"></div>
                    <div id="widget3"></div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                channel: 'ui',
                format: 'html',
                payload: `
                    <hx-partial id="widget1"><span>Data 1</span></hx-partial>
                    <hx-partial id="widget2"><span>Data 2</span></hx-partial>
                    <hx-partial id="widget3"><span>Data 3</span></hx-partial>
                `
            });
            await htmx.timeout(20);
            
            assert.include(document.getElementById('widget1').innerHTML, 'Data 1');
            assert.include(document.getElementById('widget2').innerHTML, 'Data 2');
            assert.include(document.getElementById('widget3').innerHTML, 'Data 3');
        });
    });

    // ========================================
    // 10. TARGET AND SWAP OVERRIDE TESTS
    // ========================================
    
    describe('Target and Swap Overrides', function() {
        
        it('respects target override from message envelope', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load" hx-target="#default-target">
                    <div id="default-target">Default</div>
                    <div id="override-target">Override</div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                channel: 'ui',
                format: 'html',
                payload: '<div>New Content</div>',
                target: '#override-target'
            });
            await htmx.timeout(20);
            
            assert.equal(document.getElementById('default-target').textContent, 'Default');
            assert.include(document.getElementById('override-target').innerHTML, 'New Content');
        });
        
        it('respects swap override from message envelope', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load" hx-target="#content" hx-swap="innerHTML">
                    <div id="content"><p>Item 1</p></div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                channel: 'ui',
                format: 'html',
                payload: '<p>Item 2</p>',
                swap: 'beforeend'
            });
            await htmx.timeout(20);
            
            let content = document.getElementById('content');
            assert.include(content.innerHTML, 'Item 1');
            assert.include(content.innerHTML, 'Item 2');
        });
        
        it('uses element hx-target when message has no target', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load" hx-target="#element-target">
                    <div id="element-target"></div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                channel: 'ui',
                format: 'html',
                payload: '<div>Content</div>'
            });
            await htmx.timeout(20);
            
            assert.include(document.getElementById('element-target').innerHTML, 'Content');
        });
        
        it('uses element hx-swap when message has no swap', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load" hx-target="#content" hx-swap="beforeend">
                    <div id="content"><p>Item 1</p></div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                channel: 'ui',
                format: 'html',
                payload: '<p>Item 2</p>'
            });
            await htmx.timeout(20);
            
            let content = document.getElementById('content');
            assert.include(content.innerHTML, 'Item 1');
            assert.include(content.innerHTML, 'Item 2');
        });
        
        it('message target overrides element hx-target', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load" hx-target="#element-target">
                    <div id="element-target">Element Target</div>
                    <div id="message-target">Message Target</div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                channel: 'ui',
                format: 'html',
                payload: '<div>New</div>',
                target: '#message-target'
            });
            await htmx.timeout(20);
            
            assert.equal(document.getElementById('element-target').textContent, 'Element Target');
            assert.include(document.getElementById('message-target').innerHTML, 'New');
        });
        
        it('message swap overrides element hx-swap', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load" hx-target="#content" hx-swap="innerHTML">
                    <div id="content"><p>Original</p></div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                channel: 'ui',
                format: 'html',
                payload: '<p>Appended</p>',
                swap: 'beforeend'
            });
            await htmx.timeout(20);
            
            let content = document.getElementById('content');
            assert.include(content.innerHTML, 'Original');
            assert.include(content.innerHTML, 'Appended');
        });
    });
});
