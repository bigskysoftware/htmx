describe('hx-ws WebSocket extension', function() {
    
    let extBackup;
    let mockWebSocket;
    let mockWebSocketInstances = [];
    
    before(async () => {
        extBackup = backupExtensions();
        clearExtensions();
        
        // Mock WebSocket
        mockWebSocket = class MockWebSocket {
            constructor(url) {
                this.url = url;
                this.readyState = WebSocket.CONNECTING;
                this.listeners = {};
                mockWebSocketInstances.push(this);
                
                // Simulate connection after a short delay
                setTimeout(() => {
                    this.readyState = WebSocket.OPEN;
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
                this.lastSent = data;
            }
            
            close() {
                this.readyState = WebSocket.CLOSED;
                this.triggerEvent('close', {});
            }
            
            triggerEvent(event, data) {
                if (this.listeners[event]) {
                    this.listeners[event].forEach(handler => handler(data));
                }
            }
            
            // Helper to simulate receiving a message
            simulateMessage(data) {
                this.triggerEvent('message', { data: JSON.stringify(data) });
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
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        });
    });
    
    // ========================================
    // 1. CONNECTION LIFECYCLE TESTS
    // ========================================
    
    describe('Connection Lifecycle', function() {
        
        it('creates connection on hx-ws:connect with load trigger', async function() {
            let div = createProcessedHTML('<div hx-ext="ws" hx-ws:connect="/ws/test" hx-trigger="load"></div>');
            await htmx.timeout(50);
            assert.equal(mockWebSocketInstances.length, 1);
            assert.equal(mockWebSocketInstances[0].url, '/ws/test');
        });
        
        it('does not auto-connect without trigger', async function() {
            let div = createProcessedHTML('<div hx-ws:connect="/ws/test"></div>');
            await htmx.timeout(50);
            assert.equal(mockWebSocketInstances.length, 0);
        });
        
        it('connects on custom trigger event', async function() {
            let div = createProcessedHTML('<div hx-ws:connect="/ws/test" hx-trigger="click"></div>');
            await htmx.timeout(20);
            assert.equal(mockWebSocketInstances.length, 0);
            
            div.click();
            await htmx.timeout(50);
            assert.equal(mockWebSocketInstances.length, 1);
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
            let registry = htmx.ext.ws.getRegistry?.();
            if (registry) {
                assert.equal(registry.get('/ws/shared').refCount, 2);
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
            document.getElementById('div1').remove();
            await htmx.timeout(50);
            
            assert.equal(ws.readyState, WebSocket.CLOSED);
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
            document.getElementById('div1').remove();
            await htmx.timeout(50);
            
            assert.equal(ws.readyState, WebSocket.OPEN);
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
            assert.equal(mockWebSocketInstances[0].url, '/ws/direct');
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
        
        it('respects hx-swap attribute', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load" hx-target="#list" hx-swap="beforeend">
                    <div id="list"><p>Item 1</p></div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                channel: 'ui',
                format: 'html',
                payload: '<hx-partial id="list"><p>Item 2</p></hx-partial>'
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
        
        it('emits event for non-ui channel messages', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load"></div>
            `);
            await htmx.timeout(50);
            
            let eventFired = false;
            let eventDetail = null;
            container.addEventListener('htmx:wsMessage', (e) => {
                eventFired = true;
                eventDetail = e.detail;
            });
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                channel: 'audio',
                format: 'binary',
                payload: 'base64data'
            });
            await htmx.timeout(20);
            
            assert.isTrue(eventFired);
            assert.equal(eventDetail.channel, 'audio');
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
        
        it('emits htmx:ws:reconnect on reconnection attempt', async function() {
            htmx.config.websockets = { reconnect: true, reconnectDelay: 50 };
            
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load"></div>
            `);
            
            let reconnectFired = false;
            container.addEventListener('htmx:ws:reconnect', () => {
                reconnectFired = true;
            });
            
            await htmx.timeout(50);
            let firstWs = mockWebSocketInstances[0];
            firstWs.close();
            await htmx.timeout(100);
            
            assert.isTrue(reconnectFired);
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
            container.addEventListener('htmx:ws:reconnect', () => {
                reconnectTimes.push(Date.now());
            });
            
            // Close and trigger multiple reconnects
            for (let i = 0; i < 3; i++) {
                let ws = mockWebSocketInstances[mockWebSocketInstances.length - 1];
                ws.close();
                await htmx.timeout(300);
            }
            
            // Verify delays are increasing
            if (reconnectTimes.length >= 2) {
                let firstDelay = reconnectTimes[1] - reconnectTimes[0];
                let secondDelay = reconnectTimes[2] - reconnectTimes[1];
                assert.isTrue(secondDelay >= firstDelay, 'Second delay should be >= first delay');
            }
        });
        
        it('emits htmx:wsSendError when send fails', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load">
                    <button hx-ws:send hx-trigger="click">Send</button>
                </div>
            `);
            await htmx.timeout(50);
            
            let errorFired = false;
            container.addEventListener('htmx:wsSendError', () => {
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
        
        it('emits htmx:wsUnknownMessage for unrecognized format', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-trigger="load"></div>
            `);
            await htmx.timeout(50);
            
            let unknownFired = false;
            container.addEventListener('htmx:wsUnknownMessage', () => {
                unknownFired = true;
            });
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                channel: 'unknown',
                format: 'weird',
                payload: 'something'
            });
            await htmx.timeout(20);
            
            assert.isTrue(unknownFired);
        });
    });
    
    // ========================================
    // 6. CONFIGURATION TESTS
    // ========================================
    
    describe('Configuration', function() {
        
        it('respects htmx.config.websockets.autoConnect', async function() {
            htmx.config.websockets = { autoConnect: false };
            
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test"></div>
            `);
            await htmx.timeout(50);
            
            assert.equal(mockWebSocketInstances.length, 0);
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
                reconnectJitter: true
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
    });
    
    // ========================================
    // 7. EVENT EMISSION TESTS
    // ========================================
    
    describe('Event Emission', function() {
        
        it('emits htmx:before:ws:connect before connection', async function() {
            let beforeFired = false;
            let container = document.createElement('div');
            container.innerHTML = '<div hx-ws:connect="/ws/test" hx-trigger="load"></div>';
            
            container.addEventListener('htmx:before:ws:connect', () => {
                beforeFired = true;
            });
            
            document.body.appendChild(container);
            htmx.process(container);
            await htmx.timeout(20);
            
            assert.isTrue(beforeFired);
            container.remove();
        });
        
        it('emits htmx:after:ws:connect after connection', async function() {
            let afterFired = false;
            let container = document.createElement('div');
            container.innerHTML = '<div hx-ws:connect="/ws/test" hx-trigger="load"></div>';
            
            container.addEventListener('htmx:after:ws:connect', () => {
                afterFired = true;
            });
            
            document.body.appendChild(container);
            htmx.process(container);
            await htmx.timeout(50);
            
            assert.isTrue(afterFired);
            container.remove();
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
                e.detail.message.custom = 'added';
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
                <div hx-ws:connect="/ws/notifications" hx-trigger="load" hx-target="#notifications" hx-swap="afterbegin">
                    <div id="notifications"></div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            
            // Receive multiple notifications
            ws.simulateMessage({
                channel: 'ui',
                format: 'html',
                payload: '<hx-partial id="notifications"><div class="notif">Notification 1</div></hx-partial>'
            });
            await htmx.timeout(20);
            
            ws.simulateMessage({
                channel: 'ui',
                format: 'html',
                payload: '<hx-partial id="notifications"><div class="notif">Notification 2</div></hx-partial>'
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
});
