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
            
            constructor(url, protocols) {
                this.url = url;
                this.protocols = protocols;
                this.readyState = MockWebSocket.CONNECTING;
                this.listeners = {};
                mockWebSocketInstances.push(this);
                
                // Simulate connection after a short delay
                setTimeout(() => {
                    if (this.readyState !== MockWebSocket.CONNECTING) return;
                    this.readyState = MockWebSocket.OPEN;
                    this.triggerEvent('open', {});
                }, 10);
            }
            
            addEventListener(event, handler, options) {
                if (options?.signal?.aborted) return;
                if (!this.listeners[event]) this.listeners[event] = [];
                this.listeners[event].push(handler);
                options?.signal?.addEventListener('abort', () => {
                    this.removeEventListener(event, handler);
                }, { once: true });
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
                this.sentMessages ??= [];
                this.sentMessages.push(data);
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
        // Reset global WS config to avoid test bleed
        htmx.config.ws = {};
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
    
    // Helper to get normalized connection URLs
    function getNormalizedUrl(path) {
        // The extension normalizes /path to ws://host/path or wss://host/path
        let protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return protocol + '//' + window.location.host + path;
    }

    function getConnection(element) {
        return element._htmx?.ws?.connection;
    }
    
    // ========================================
    // 1. CONNECTION LIFECYCLE TESTS
    // ========================================
    
    describe('Connection Lifecycle', function() {
        
        it('auto-connects on load by default', async function() {
            let div = createProcessedHTML('<div hx-ws:connect="/ws/test"></div>');
            await htmx.timeout(50);
            assert.equal(mockWebSocketInstances.length, 1);
            assert.isTrue(urlEndsWith(mockWebSocketInstances[0].url, '/ws/test'), 'URL should end with /ws/test');
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
            div.click();
            await htmx.timeout(50);
            assert.equal(mockWebSocketInstances.length, 1, 'Second click should not reconnect (once modifier)');
        });

        it('creates separate connections for separate elements with the same URL', async function() {
            let container = createProcessedHTML(`
                <div>
                    <div id="div1" hx-ws:connect="/ws/shared" hx-config="ws.protocols:one"></div>
                    <div id="div2" hx-ws:connect="/ws/shared" hx-config="ws.protocols:two"></div>
                </div>
            `);
            await htmx.timeout(50);
            assert.equal(mockWebSocketInstances.length, 2);
            assert.equal(mockWebSocketInstances[0].protocols, 'one');
            assert.equal(mockWebSocketInstances[1].protocols, 'two');
        });

        it('handles incoming messages through each connection owner', async function() {
            createProcessedHTML(`
                <div>
                    <div hx-ws:connect="/ws/shared" hx-target="#one"></div>
                    <div hx-ws:connect="/ws/shared" hx-target="#two"></div>
                    <div id="one"></div>
                    <div id="two"></div>
                </div>
            `);
            await htmx.timeout(20);

            mockWebSocketInstances[0].simulateRawMessage('<p>First</p>');
            mockWebSocketInstances[1].simulateRawMessage('<p>Second</p>');
            await htmx.timeout(20);

            assert.equal(document.getElementById('one').textContent, 'First');
            assert.equal(document.getElementById('two').textContent, 'Second');
        });
        
        it('creates separate connections for different URLs', async function() {
            let container = createProcessedHTML(`
                <div>
                    <div id="div1" hx-ws:connect="/ws/channel1"></div>
                    <div id="div2" hx-ws:connect="/ws/channel2"></div>
                </div>
            `);
            await htmx.timeout(50);
            assert.equal(mockWebSocketInstances.length, 2);
        });
        
        it('closes connection when last element is removed', async function() {
            let container = createProcessedHTML(`
                <div id="container">
                    <div id="div1" hx-ws:connect="/ws/test"></div>
                </div>
            `);
            await htmx.timeout(50);
            assert.equal(mockWebSocketInstances.length, 1);
            
            let ws = mockWebSocketInstances[0];
            let target = document.getElementById('container');

            await htmx.swap({ text: '', target, swap: 'innerHTML', sourceElement: target });
            await htmx.timeout(50);
            
            assert.equal(ws.readyState, mockWebSocket.CLOSED);
        });
        
        it('closes only the removed element connection', async function() {
            let container = createProcessedHTML(`
                <div id="container">
                    <div id="div1" hx-ws:connect="/ws/shared"></div>
                    <div id="div2" hx-ws:connect="/ws/shared"></div>
                </div>
            `);
            await htmx.timeout(50);
            
            let firstWs = mockWebSocketInstances[0];
            let secondWs = mockWebSocketInstances[1];
            let target = document.getElementById('div1');

            await htmx.swap({ text: '', target, swap: 'delete', sourceElement: target });
            await htmx.timeout(50);
            
            assert.equal(firstWs.readyState, mockWebSocket.CLOSED);
            assert.equal(secondWs.readyState, mockWebSocket.OPEN);
        });

        it('fires errors on each connection owner', async function() {
            let container = createProcessedHTML(`
                <div id="container">
                    <div id="div1" hx-ws:connect="/ws/shared"></div>
                    <div id="div2" hx-ws:connect="/ws/shared"></div>
                </div>
            `);
            await htmx.timeout(50);

            let errors = [];
            document.getElementById('div1').addEventListener('htmx:ws:error', () => errors.push('one'));
            document.getElementById('div2').addEventListener('htmx:ws:error', () => errors.push('two'));

            mockWebSocketInstances[0].triggerEvent('error', { message: 'first error' });
            mockWebSocketInstances[1].triggerEvent('error', { message: 'second error' });
            await htmx.timeout(20);

            assert.deepEqual(errors, ['one', 'two']);
        });
    });

    // ========================================
    // 2. MESSAGE SENDING TESTS
    // ========================================
    
    describe('Message Sending', function() {
        
        it('queues a message until the initial connection opens', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test">
                    <div id="load-sender" hx-ws:send hx-trigger="load" hx-vals='{"test": "load"}'></div>
                </div>
            `);
            await htmx.timeout(1);

            let ws = mockWebSocketInstances[0];
            let connection = getConnection(div);
            assert.equal(connection.queue.length, 1);
            assert.isUndefined(ws.lastSent);

            await htmx.timeout(30);

            assert.equal(connection.queue.length, 0);
            assert.equal(JSON.parse(ws.lastSent).test, 'load');
        });

        it('queues messages during reconnect and sends them in order', async function() {
            htmx.config.ws = { reconnectDelay: 50, reconnectJitter: 0 };
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test">
                    <button hx-ws:send hx-vals='{"order": "first"}'>First</button>
                    <button hx-ws:send hx-vals='{"order": "second"}'>Second</button>
                </div>
            `);
            await htmx.timeout(20);

            let sentOrders = [];
            div.addEventListener('htmx:ws:after:message:outgoing', event => {
                sentOrders.push(event.detail.message.values.order);
            });

            mockWebSocketInstances[0].close(1006);
            let buttons = div.querySelectorAll('button');
            buttons[0].click();
            buttons[1].click();
            await htmx.timeout(10);

            let connection = getConnection(div);
            assert.equal(connection.queue.length, 2);
            assert.deepEqual(sentOrders, []);

            await htmx.timeout(70);

            let sent = mockWebSocketInstances[1].sentMessages.map(JSON.parse);
            assert.deepEqual(sent.map(message => message.order), ['first', 'second']);
            assert.deepEqual(sentOrders, ['first', 'second']);
            assert.equal(connection.queue.length, 0);
        });

        it('rejects messages when the outgoing queue is full', async function() {
            htmx.config.ws = {
                reconnectDelay: 50,
                reconnectJitter: 0,
                maxOutgoingMessagesQueueSize: 1
            };
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test">
                    <button hx-ws:send hx-vals='{"order": "first"}'>First</button>
                    <button hx-ws:send hx-vals='{"order": "second"}'>Second</button>
                </div>
            `);
            await htmx.timeout(20);

            let errors = [];
            div.addEventListener('htmx:ws:error', event => errors.push(event.detail.error));
            mockWebSocketInstances[0].close(1006);
            let buttons = div.querySelectorAll('button');
            buttons[0].click();
            buttons[1].click();
            await htmx.timeout(10);

            let connection = getConnection(div);
            assert.equal(connection.queue.length, 1);
            assert.deepEqual(errors, ['Outgoing messages queue is full']);

            await htmx.timeout(70);

            let sent = mockWebSocketInstances[1].sentMessages.map(JSON.parse);
            assert.deepEqual(sent.map(message => message.order), ['first']);
        });

        it('sends message with hx-ws:send on form submit', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/chat">
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
            assert.equal(sent.message, 'hello');
            assert.notProperty(sent, 'body');
            assert.isDefined(sent.headers['HX-Source']);
            assert.isDefined(sent.headers['HX-Current-URL']);
        });
        
        // Submit inputs send through their activation event.
        it('uses click as the default trigger for submit inputs', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test">
                    <input type="submit" hx-ws:send hx-vals='{"action": "send"}'>
                </div>
            `);
            await htmx.timeout(50);

            let input = div.querySelector('input');
            let ws = mockWebSocketInstances[0];
            input.dispatchEvent(new Event('change', { bubbles: true }));
            await htmx.timeout(20);
            assert.isUndefined(ws.lastSent);

            input.click();
            await htmx.timeout(20);
            assert.isDefined(ws.lastSent);
        });

        it('includes hx-vals in sent message', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test">
                    <button hx-ws:send hx-vals='{"extra": "data"}' hx-trigger="click">Send</button>
                </div>
            `);
            await htmx.timeout(50);
            
            let button = div.querySelector('button');
            button.click();
            await htmx.timeout(20);
            
            let ws = mockWebSocketInstances[0];
            let sent = JSON.parse(ws.lastSent);
            assert.equal(sent.extra, 'data');
        });

        it('preserves JS types (number, boolean) from hx-vals', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test">
                    <button hx-ws:send hx-vals='{"count": 42, "active": true, "ratio": 1.5}' hx-trigger="click">Send</button>
                </div>
            `);
            await htmx.timeout(50);

            div.querySelector('button').click();
            await htmx.timeout(20);

            let sent = JSON.parse(mockWebSocketInstances[0].lastSent);
            assert.strictEqual(sent.count, 42, 'number should not be coerced to string');
            assert.strictEqual(sent.active, true, 'boolean should not be coerced to string');
            assert.strictEqual(sent.ratio, 1.5, 'float should not be coerced to string');
        });

        it('hx-vals overrides form field with correct type', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test">
                    <form hx-ws:send hx-vals='{"count": 99}' hx-trigger="submit">
                        <input name="count" value="1">
                    </form>
                </div>
            `);
            await htmx.timeout(50);

            div.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            await htmx.timeout(20);

            let sent = JSON.parse(mockWebSocketInstances[0].lastSent);
            assert.strictEqual(sent.count, 99, 'hx-vals number should win over form string value');
        });
        
        it('finds connection from nearest ancestor', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/outer">
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
        
        it('ignores the hx-ws:send value', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/owner">
                    <button hx-ws:send="/ws/ignored" name="action" value="save">Save</button>
                </div>
            `);
            await htmx.timeout(20);

            container.querySelector('button').click();
            await htmx.timeout(20);

            assert.equal(mockWebSocketInstances.length, 1);
            assert.isTrue(urlEndsWith(mockWebSocketInstances[0].url, '/ws/owner'));
            assert.equal(JSON.parse(mockWebSocketInstances[0].lastSent).action, 'save');
        });

        it('creates separate owned connections for separate send elements', async function() {
            let container = createProcessedHTML(`
                <div>
                    <button hx-ws:connect="/ws/direct" hx-ws:send hx-trigger="click" name="action" value="save">Save</button>
                    <button hx-ws:connect="/ws/direct" hx-ws:send hx-trigger="click" name="action" value="delete">Delete</button>
                </div>
            `);

            let buttons = container.querySelectorAll('button');
            buttons[0].click();
            buttons[1].click();
            await htmx.timeout(20);

            assert.equal(mockWebSocketInstances.length, 2);
            assert.equal(JSON.parse(mockWebSocketInstances[0].lastSent).action, 'save');
            assert.equal(JSON.parse(mockWebSocketInstances[1].lastSent).action, 'delete');
        });
        
        it('send respects delay modifier', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test">
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

        it('includes HX-Source with tag#id format', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test">
                    <button id="my-button" hx-ws:send hx-trigger="click">Send</button>
                </div>
            `);
            await htmx.timeout(50);
            
            document.getElementById('my-button').click();
            await htmx.timeout(20);
            
            let ws = mockWebSocketInstances[0];
            let sent = JSON.parse(ws.lastSent);
            assert.equal(sent.headers['HX-Source'], 'button#my-button');
        });
        
        it('includes HX-Target when hx-target is set', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test">
                    <button hx-ws:send hx-trigger="click" hx-target="#result">Send</button>
                    <div id="result"></div>
                </div>
            `);
            await htmx.timeout(50);

            div.querySelector('button').click();
            await htmx.timeout(20);

            let ws = mockWebSocketInstances[0];
            let sent = JSON.parse(ws.lastSent);
            assert.equal(sent.headers['HX-Target'], 'div#result');
        });

        it('includes async hx-vals (js:) in sent message', async function() {
            window.testAsyncValue = () => new Promise(resolve => setTimeout(() => resolve('asyncValue'), 10));
            
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test">
                    <button hx-ws:send hx-vals='js:{asyncField: await testAsyncValue()}' hx-trigger="click">Send</button>
                </div>
            `);
            await htmx.timeout(50);
            
            let button = div.querySelector('button');
            button.click();
            await htmx.timeout(20);
            
            let ws = mockWebSocketInstances[0];
            let sent = JSON.parse(ws.lastSent);
            assert.equal(sent.asyncField, 'asyncValue');
            
            delete window.testAsyncValue;
        });
    });
    
    // ========================================
    // 3. MESSAGE RECEIVING & HTML HANDLING
    // ========================================
    
    describe('Message Receiving and HTML Handling', function() {
        
        it('swaps HTML partial into target element', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#messages">
                    <div id="messages"></div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                content: '<hx-partial id="messages"><p>New message</p></hx-partial>'
            });
            await htmx.timeout(20);
            
            let messages = document.getElementById('messages');
            assert.include(messages.innerHTML, 'New message');
        });
        
        it('uses default swap strategy (innerHTML)', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#content">
                    <div id="content">Old</div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                content: '<hx-partial id="content">New</hx-partial>'
            });
            await htmx.timeout(20);
            
            assert.equal(document.getElementById('content').textContent, 'New');
        });
        
        it('respects hx-swap attribute on partial', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#list">
                    <div id="list"><p>Item 1</p></div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                content: '<hx-partial id="list" hx-swap="beforeend"><p>Item 2</p></hx-partial>'
            });
            await htmx.timeout(20);
            
            let list = document.getElementById('list');
            assert.include(list.innerHTML, 'Item 1');
            assert.include(list.innerHTML, 'Item 2');
        });
        
        it('handles multiple partials in one message', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test">
                    <div id="header"></div>
                    <div id="content"></div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                content: `
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
                <div hx-ws:connect="/ws/test" hx-target="#content">
                    <div id="content"></div>
                </div>
            `);
            await htmx.timeout(50);

            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                content: '<hx-partial id="content"><div>Content</div><script>window.wsScriptTestValue = "executed";</script></hx-partial>'
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
                <div hx-ws:connect="/ws/test" hx-target="#content">
                    <div id="content"></div>
                </div>
            `);
            await htmx.timeout(50);

            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                content: '<hx-partial id="content"><script>window.wsScriptTest1 = 1;</script><div>Content</div><script>window.wsScriptTest2 = 2;</script></hx-partial>'
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
                <div hx-ws:connect="/ws/test" hx-target="#content">
                    <div id="content"></div>
                </div>
            `);
            await htmx.timeout(50);

            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                content: '<hx-partial id="content"><script data-testattr="testvalue">window.wsScriptAttrTest = document.currentScript.getAttribute("data-testattr");</script></hx-partial>'
            });
            await htmx.timeout(20);

            assert.equal(window.wsScriptAttrTest, 'testvalue', 'Script should access its own attributes');

            // Clean up
            delete window.wsScriptAttrTest;
        });

    });
    
    // ========================================
    // 4. CUSTOM CHANNEL TESTS
    // ========================================
    
    describe('Custom Channels', function() {
        
        it('does not swap JSON messages without content field', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#content">
                    <div id="content">Original</div>
                </div>
            `);
            await htmx.timeout(50);

            let eventFired = false;
            let eventMessage = null;
            container.addEventListener('htmx:ws:after:message:incoming', async (e) => {
                eventFired = true;
                eventMessage = await e.detail.message.json();
            });

            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({ type: 'notification', text: 'hello' });
            await htmx.timeout(20);

            assert.isTrue(eventFired);
            assert.equal(eventMessage.type, 'notification');
            assert.equal(document.getElementById('content').textContent, 'Original', 'Data-only messages should not swap');
        });

        it('does not swap JSON primitives or arrays without content', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#content">
                    <div id="content">Original</div>
                </div>
            `);
            await htmx.timeout(20);

            let ws = mockWebSocketInstances[0];
            let received;
            container.addEventListener('htmx:ws:before:message:incoming', event => {
                event.detail.waitUntil(event.detail.message.json().then(value => received = value));
            });
            for (let value of [false, 0, null, '', true, 1, 'text', []]) {
                ws.simulateRawMessage(JSON.stringify(value));
                await htmx.timeout(10);
                assert.equal(document.getElementById('content').textContent, 'Original');
                assert.deepEqual(received, value);
            }
        });
        
        it('exposes binary messages without swapping them', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#content">
                    <div id="content">Original</div>
                </div>
            `);
            await htmx.timeout(50);

            let receivedMessage;
            container.addEventListener('htmx:ws:before:message:incoming', event => {
                receivedMessage = event.detail.message;
            });

            let data = new TextEncoder().encode(JSON.stringify({ content: '<p>Not swapped</p>' })).buffer;
            mockWebSocketInstances[0].simulateRawMessage(data);
            await htmx.timeout(20);

            assert.equal(document.getElementById('content').textContent, 'Original');
            assert.instanceOf(receivedMessage.data, ArrayBuffer);
            assert.strictEqual(receivedMessage.data, data);
            assert.equal((await receivedMessage.json()).content, '<p>Not swapped</p>');
        });

        it('fires htmx:ws:before:message:incoming for all messages', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test"></div>
            `);
            await htmx.timeout(50);
            
            let beforeFired = false;
            container.addEventListener('htmx:ws:before:message:incoming', () => {
                beforeFired = true;
            });
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                content: '<hx-partial id="test">Test</hx-partial>'
            });
            await htmx.timeout(20);
            
            assert.isTrue(beforeFired);
        });
        
        it('allows canceling message processing via event', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#content">
                    <div id="content">Original</div>
                </div>
            `);
            await htmx.timeout(50);

            container.addEventListener('htmx:ws:before:message:incoming', (e) => {
                e.preventDefault();
            });

            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                content: '<hx-partial id="content">Changed</hx-partial>'
            });
            await htmx.timeout(20);

            assert.equal(document.getElementById('content').textContent, 'Original');
        });

        it('processes replaced incoming data', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#content">
                    <div id="content">Original</div>
                </div>
            `);
            await htmx.timeout(50);

            container.addEventListener('htmx:ws:before:message:incoming', event => {
                event.detail.message.data = '<p>Replacement</p>';
            });

            mockWebSocketInstances[0].simulateRawMessage('<p>Ignored</p>');
            await htmx.timeout(20);

            assert.equal(document.getElementById('content').textContent, 'Replacement');
        });

        it('converts replaced incoming data', async function() {
            let container = createProcessedHTML('<div hx-ws:connect="/ws/test"></div>');
            await htmx.timeout(50);
            let text;

            container.addEventListener('htmx:ws:before:message:incoming', event => {
                event.detail.message.data = 'Replacement';
                event.detail.waitUntil(event.detail.message.text().then(value => text = value));
                event.detail.cancelled = true;
            });

            mockWebSocketInstances[0].simulateRawMessage('Ignored');
            await htmx.timeout(20);

            assert.equal(text, 'Replacement');
        });

        it('waits for incoming data replacement', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#content">
                    <div id="content">Original</div>
                </div>
            `);
            await htmx.timeout(50);

            container.addEventListener('htmx:ws:before:message:incoming', event => {
                event.detail.waitUntil(htmx.timeout(20).then(() => {
                    event.detail.message.data = '<p>Replacement</p>';
                }));
            });

            mockWebSocketInstances[0].simulateRawMessage('<p>Ignored</p>');
            await htmx.timeout(5);
            assert.equal(document.getElementById('content').textContent, 'Original');

            await htmx.timeout(30);
            assert.equal(document.getElementById('content').textContent, 'Replacement');
        });

        // Bare connections follow normal target and swap defaults.
        it('waits for incoming message work before processing', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#content">
                    <div id="content">Original</div>
                </div>
            `);
            await htmx.timeout(50);

            container.addEventListener('htmx:ws:before:message:incoming', (event) => {
                event.detail.waitUntil(htmx.timeout(20).then(() => {
                    event.detail.cancelled = true;
                }));
            });

            mockWebSocketInstances[0].simulateMessage({ content: '<p>Changed</p>' });
            await htmx.timeout(5);
            assert.equal(document.getElementById('content').textContent, 'Original');

            await htmx.timeout(30);
            assert.equal(document.getElementById('content').textContent, 'Original');
        });

        it('processes incoming messages in arrival order', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#value">
                    <div id="value">initial</div>
                </div>
            `);
            await htmx.timeout(50);

            let messageNumber = 0;
            container.addEventListener('htmx:ws:before:message:incoming', (event) => {
                if (++messageNumber === 1) event.detail.waitUntil(htmx.timeout(30));
            });

            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({ content: 'first' });
            ws.simulateMessage({ content: 'second' });
            await htmx.timeout(60);

            assert.equal(document.getElementById('value').textContent, 'second');
        });

        it('waits for an incoming swap before processing the next message', async function() {
            createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#value">
                    <div id="value">initial</div>
                </div>
            `);
            await htmx.timeout(50);

            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({ content: 'first', swap: 'innerHTML swap:30ms' });
            ws.simulateMessage({ content: 'second' });
            await htmx.timeout(60);

            assert.equal(document.getElementById('value').textContent, 'second');
        });

        it('swaps raw HTML into the connection element by default', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test">Original</div>
            `);
            await htmx.timeout(50);

            let ws = mockWebSocketInstances[0];
            ws.simulateRawMessage('<p>Updated</p>');
            await htmx.timeout(20);

            assert.equal(container.innerHTML, '<p>Updated</p>');
        });

        // JSON content uses the same target and swap defaults as raw HTML.
        it('swaps JSON content into the connection element by default', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test">Original</div>
            `);
            await htmx.timeout(50);

            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({ content: '<p>Updated</p>' });
            await htmx.timeout(20);

            assert.equal(container.innerHTML, '<p>Updated</p>');
        });

        it('swaps raw HTML into hx-target when set', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#content">
                    <div id="content">Original</div>
                </div>
            `);
            await htmx.timeout(50);

            let ws = mockWebSocketInstances[0];
            ws.simulateRawMessage('<p>Updated</p>');
            await htmx.timeout(20);

            assert.include(document.getElementById('content').innerHTML, 'Updated');
        });
    });
    
    // ========================================
    // 5. ERROR HANDLING & RECONNECTION
    // ========================================
    
    describe('Error Handling and Reconnection', function() {
        
        it('emits htmx:ws:error on connection error', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test"></div>
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
                <div hx-ws:connect="/ws/test"></div>
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
        
        it('uses transient close codes by default', async function() {
            let element = createProcessedHTML('<div hx-ws:connect="/ws/test"></div>');
            await htmx.timeout(20);

            let connection = getConnection(element);
            assert.deepEqual(connection.config.reconnectCodes, [1001, 1005, 1006, 1011, 1012, 1013, 1014]);
        });

        it('reconnects after every default close code', async function() {
            htmx.config.ws = { reconnectDelay: 5, reconnectJitter: 0 };

            createProcessedHTML('<div hx-ws:connect="/ws/test"></div>');
            await htmx.timeout(20);

            for (let code of [1001, 1005, 1006, 1011, 1012, 1013, 1014]) {
                let count = mockWebSocketInstances.length;
                mockWebSocketInstances[count - 1].close(code);
                await htmx.timeout(20);
                assert.equal(mockWebSocketInstances.length, count + 1, `close code ${code}`);
            }
        });

        it('does not reconnect after a normal close', async function() {
            htmx.config.ws = { reconnect: true, reconnectDelay: 20 };

            createProcessedHTML('<div hx-ws:connect="/ws/test"></div>');
            await htmx.timeout(50);

            mockWebSocketInstances[0].close(1000);
            await htmx.timeout(50);

            assert.equal(mockWebSocketInstances.length, 1);
        });

        it('can open a triggered connection again after a normal close', async function() {
            let element = createProcessedHTML('<div hx-ws:connect="/ws/test" hx-trigger="click"></div>');

            element.click();
            await htmx.timeout(20);
            mockWebSocketInstances[0].close(1000);

            element.click();
            await htmx.timeout(20);

            assert.equal(mockWebSocketInstances.length, 2);
        });

        it('reuses a connecting connection across repeated triggers', async function() {
            let element = createProcessedHTML('<div hx-ws:connect="/ws/test" hx-trigger="click"></div>');

            element.click();
            element.click();
            await htmx.timeout(20);

            assert.equal(mockWebSocketInstances.length, 1);
        });

        it('reuses an open connection across repeated triggers', async function() {
            let element = createProcessedHTML('<div hx-ws:connect="/ws/test" hx-trigger="click"></div>');

            element.click();
            await htmx.timeout(20);
            element.click();
            await htmx.timeout(20);

            assert.equal(mockWebSocketInstances.length, 1);
        });

        it('can reopen a sending element connection after a normal close', async function() {
            let button = createProcessedHTML('<button hx-ws:connect="/ws/test" hx-ws:send hx-trigger="click" name="action" value="save">Save</button>');

            button.click();
            await htmx.timeout(20);
            mockWebSocketInstances[0].close(1000);

            button.click();
            await htmx.timeout(20);

            assert.equal(mockWebSocketInstances.length, 2);
            assert.equal(JSON.parse(mockWebSocketInstances[1].lastSent).action, 'save');
        });

        it('reuses an open sending element connection', async function() {
            let button = createProcessedHTML('<button hx-ws:connect="/ws/test" hx-ws:send hx-trigger="click" name="action" value="save">Save</button>');

            button.click();
            await htmx.timeout(20);
            button.click();
            await htmx.timeout(20);

            assert.equal(mockWebSocketInstances.length, 1);
            assert.equal(mockWebSocketInstances[0].sentMessages.length, 2);
        });

        it('uses custom reconnectCodes', async function() {
            htmx.config.ws = { reconnectCodes: [1000], reconnectDelay: 20 };

            createProcessedHTML('<div hx-ws:connect="/ws/test"></div>');
            await htmx.timeout(50);

            mockWebSocketInstances[0].close(1000);
            await htmx.timeout(50);

            assert.equal(mockWebSocketInstances.length, 2);
        });
        
        it('does not reconnect when config.reconnect is false', async function() {
            htmx.config.ws = { reconnect: false };
            
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test"></div>
            `);
            await htmx.timeout(50);
            
            let firstWs = mockWebSocketInstances[0];
            firstWs.close(1006);
            await htmx.timeout(100);
            
            assert.equal(mockWebSocketInstances.length, 1);
        });
        
        it('emits htmx:ws:before:connection with attempt > 0 on reconnect', async function() {
            htmx.config.ws = { reconnect: true, reconnectDelay: 50 };

            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test"></div>
            `);

            let reconnectAttempt = null;
            container.addEventListener('htmx:ws:before:connection', (e) => {
                if (e.detail.connection.attempt > 0) {
                    reconnectAttempt = e.detail.connection.attempt;
                }
            });

            await htmx.timeout(50);
            let firstWs = mockWebSocketInstances[0];
            firstWs.close(1006);
            await htmx.timeout(100);

            assert.equal(reconnectAttempt, 1);
        });
        
        it('uses exponential backoff for reconnection', async function() {
            htmx.config.ws = { 
                reconnect: true, 
                reconnectDelay: 100,
                reconnectMaxDelay: 1000
            };
            
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test"></div>
            `);
            await htmx.timeout(50);
            
            let reconnectTimes = [];
            container.addEventListener('htmx:ws:before:connection', (e) => {
                if (e.detail.connection.attempt > 0) {
                    reconnectTimes.push(Date.now());
                }
            });
            
            // First close
            let ws = mockWebSocketInstances[mockWebSocketInstances.length - 1];
            ws.close(1006);
            await htmx.timeout(200);
            
            // Second close
            ws = mockWebSocketInstances[mockWebSocketInstances.length - 1];
            ws.close(1006);
            await htmx.timeout(300);
            
            // Third close
            ws = mockWebSocketInstances[mockWebSocketInstances.length - 1];
            ws.close(1006);
            await htmx.timeout(500);
            
            // Verify delays are increasing
            assert.isTrue(reconnectTimes.length >= 3, 'Should have at least 3 reconnect attempts');
            let firstDelay = reconnectTimes[1] - reconnectTimes[0];
            let secondDelay = reconnectTimes[2] - reconnectTimes[1];
            assert.isTrue(secondDelay >= firstDelay, 'Second delay should be >= first delay');
        });
        
        it('emits htmx:ws:error when send fails', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test">
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
                <div hx-ws:connect="/ws/test" hx-target="#content">
                    <div id="content">Original</div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateRawMessage('<hx-partial id="content"><p>Raw HTML update</p></hx-partial>');
            await htmx.timeout(20);
            
            assert.include(document.getElementById('content').innerHTML, 'Raw HTML update');
        });

        // OOB-only messages update their targets without clearing the connection element.
        it('defaults swapEmpty to false for OOB-only messages', async function() {
            let container = createProcessedHTML(`
                <div id="ws-conn" hx-ws:connect="/ws/test">Original</div>
                <div id="status">Waiting</div>
            `);
            await htmx.timeout(50);

            let ws = mockWebSocketInstances[0];
            ws.simulateRawMessage('<div id="status" hx-swap-oob="true">Connected</div>');
            await htmx.timeout(20);

            assert.equal(document.getElementById('ws-conn').textContent, 'Original');
            assert.equal(document.getElementById('status').textContent, 'Connected');
        });

        // Explicit swapEmpty:true restores the normal empty main swap.
        it('allows swapEmpty:true to clear the connection element', async function() {
            let container = createProcessedHTML(`
                <div id="ws-conn" hx-ws:connect="/ws/test" hx-swap="innerHTML swapEmpty:true">Original</div>
                <div id="status">Waiting</div>
            `);
            await htmx.timeout(50);

            let ws = mockWebSocketInstances[0];
            ws.simulateRawMessage('<div id="status" hx-swap-oob="true">Connected</div>');
            await htmx.timeout(20);

            assert.equal(document.getElementById('ws-conn').textContent, '');
            assert.equal(document.getElementById('status').textContent, 'Connected');
        });

        it('processes hx-partial in non-JSON messages even without hx-target', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test">
                    <div id="widget">Old</div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateRawMessage('<hx-partial id="widget"><p>Updated via partial</p></hx-partial>');
            await htmx.timeout(20);
            
            assert.include(document.getElementById('widget').innerHTML, 'Updated via partial');
        });

        it('fires htmx:ws:before:message:incoming for non-JSON data', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#content">
                    <div id="content">Original</div>
                </div>
            `);
            await htmx.timeout(50);

            let eventFired = false;
            let receivedData = null;
            container.addEventListener('htmx:ws:before:message:incoming', async (e) => {
                eventFired = true;
                receivedData = await e.detail.message.text();
            });

            let ws = mockWebSocketInstances[0];
            ws.simulateRawMessage('<p>Raw content</p>');
            await htmx.timeout(20);

            assert.isTrue(eventFired);
            assert.equal(receivedData, '<p>Raw content</p>');
        });

        it('prevents swap when htmx:ws:before:message:incoming is cancelled for raw data', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#content">
                    <div id="content">Original</div>
                </div>
            `);
            await htmx.timeout(50);

            container.addEventListener('htmx:ws:before:message:incoming', (e) => {
                if (typeof e.detail.message.data === 'string') e.detail.cancelled = true;
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
            htmx.config.ws = {
                reconnect: true,
                reconnectDelay: 200,
                reconnectJitter: 0
            };
            
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test"></div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            let closeTime = Date.now();
            ws.close(1006);
            
            await htmx.timeout(100);
            assert.equal(mockWebSocketInstances.length, 1, 'Should not reconnect yet');
            
            await htmx.timeout(150);
            assert.isTrue(mockWebSocketInstances.length > 1, 'Should reconnect after delay');
        });
        
        it('applies reconnectJitter when enabled', async function() {
            htmx.config.ws = { 
                reconnect: true, 
                reconnectDelay: 100,
                reconnectJitter: 0.3
            };
            
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test"></div>
            `);
            await htmx.timeout(50);
            
            // This test just ensures jitter doesn't break reconnection
            let ws = mockWebSocketInstances[0];
            ws.close(1006);
            await htmx.timeout(200);
            
            assert.isTrue(mockWebSocketInstances.length > 1);
        });

        it('reconnectMaxAttempts limits reconnection attempts on consecutive failures', async function() {
            htmx.config.ws = {
                reconnect: true,
                reconnectDelay: 20,
                reconnectMaxAttempts: 2,
                reconnectJitter: 0
            };

            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test"></div>
            `);
            await htmx.timeout(50);

            let reconnectCount = 0;
            container.addEventListener('htmx:ws:before:connection', (e) => {
                if (e.detail.connection.attempt > 0) reconnectCount++;
            });

            // Close the first connection — this triggers reconnect attempt 1
            let ws = mockWebSocketInstances[0];
            ws.close(1006);
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
            htmx.config.ws = {
                reconnect: true,
                reconnectDelay: 10,
                reconnectMaxAttempts: 5,
                reconnectJitter: 0.5
            };

            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test"></div>
            `);
            await htmx.timeout(50);

            let reconnectAttempts = [];
            container.addEventListener('htmx:ws:before:connection', (e) => {
                if (e.detail.connection.attempt > 0) {
                    reconnectAttempts.push(e.detail.connection.attempt);
                }
            });

            let ws = mockWebSocketInstances[mockWebSocketInstances.length - 1];
            ws.close(1006);
            await htmx.timeout(200);

            assert.isAtLeast(reconnectAttempts.length, 1, 'Should have at least 1 reconnect');
        });

        it('reconnectJitter of 0 produces exact base delay', async function() {
            htmx.config.ws = {
                reconnect: true,
                reconnectDelay: 20,
                reconnectMaxAttempts: 3,
                reconnectJitter: 0
            };

            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test"></div>
            `);
            await htmx.timeout(50);

            let reconnectAttempts = [];
            container.addEventListener('htmx:ws:before:connection', (e) => {
                if (e.detail.connection.attempt > 0) {
                    reconnectAttempts.push(e.detail.connection.attempt);
                }
            });

            // Each reconnect succeeds (mock auto-opens), so reconnectAttempts
            // resets to 0 — each subsequent close starts at attempt 1 again
            let ws = mockWebSocketInstances[mockWebSocketInstances.length - 1];
            ws.close(1006);
            await htmx.timeout(50);

            ws = mockWebSocketInstances[mockWebSocketInstances.length - 1];
            ws.close(1006);
            await htmx.timeout(50);

            assert.isAtLeast(reconnectAttempts.length, 2, 'Should have at least 2 reconnects');
        });

        it('per-element hx-config overrides global websockets config', async function() {
            htmx.config.ws = {
                reconnect: true,
                reconnectDelay: 5000,
                reconnectJitter: 0
            };

            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-config="ws.reconnectDelay:20 ws.reconnectMaxAttempts:2"></div>
            `);
            await htmx.timeout(50);

            let reconnectAttempts = [];
            container.addEventListener('htmx:ws:before:connection', (e) => {
                if (e.detail.connection.attempt > 0) {
                    reconnectAttempts.push(e.detail.connection.attempt);
                }
            });

            let ws = mockWebSocketInstances[mockWebSocketInstances.length - 1];
            ws.close(1006);
            await htmx.timeout(100);

            // Per-element config set reconnectDelay to 20ms (not global 5000ms),
            // so reconnection should have happened quickly
            assert.isAtLeast(reconnectAttempts.length, 1, 'Should reconnect using per-element delay');
        });

        it('per-element hx-config supports JSON object form', async function() {
            htmx.config.ws = {
                reconnect: true,
                reconnectDelay: 5000,
                reconnectJitter: 0
            };

            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-config='{"ws": {"reconnectCodes": [1000], "reconnectDelay": 20}}'></div>
            `);
            await htmx.timeout(50);

            let reconnectAttempts = [];
            container.addEventListener('htmx:ws:before:connection', (e) => {
                if (e.detail.connection.attempt > 0) {
                    reconnectAttempts.push(e.detail.connection.attempt);
                }
            });

            let ws = mockWebSocketInstances[mockWebSocketInstances.length - 1];
            ws.close(1000);
            await htmx.timeout(100);

            assert.isAtLeast(reconnectAttempts.length, 1, 'Should reconnect using per-element JSON config');
        });

        it('htmx:ws:error fires for send failures with error message', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test">
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

        it('raw messages go through incoming message events', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#content">
                    <div id="content">Original</div>
                </div>
            `);
            await htmx.timeout(50);

            let beforeDetail = null;
            let afterDetail = null;
            container.addEventListener('htmx:ws:before:message:incoming', (e) => {
                beforeDetail = e.detail;
            });
            container.addEventListener('htmx:ws:after:message:incoming', (e) => {
                afterDetail = e.detail;
            });

            let ws = mockWebSocketInstances[0];
            ws.simulateRawMessage('<hx-partial id="content"><p>Updated</p></hx-partial>');
            await htmx.timeout(20);

            assert.isNotNull(beforeDetail, 'ws:before:message:incoming should fire for raw messages');
            assert.equal(beforeDetail.message.data, '<hx-partial id="content"><p>Updated</p></hx-partial>');
            assert.equal(await beforeDetail.message.text(), beforeDetail.message.data);

            assert.isNotNull(afterDetail, 'ws:after:message:incoming should fire for raw messages');
            assert.strictEqual(afterDetail.message, beforeDetail.message);
        });

        it('JSON messages go through incoming message events', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#content">
                    <div id="content"></div>
                </div>
            `);
            await htmx.timeout(50);

            let beforeDetail = null;
            container.addEventListener('htmx:ws:before:message:incoming', (e) => {
                beforeDetail = e.detail;
            });

            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                content: '<hx-partial id="content">New</hx-partial>'
            });
            await htmx.timeout(20);

            assert.isNotNull(beforeDetail, 'ws:before:message:incoming should fire');
            let json = await beforeDetail.message.json();
            assert.isDefined(json.content, 'message.json() should parse the message');
        });
        it('passes protocols to WebSocket constructor', async function() {
            htmx.config.ws = { protocols: 'my-protocol' };

            createProcessedHTML('<div hx-ws:connect="/ws/test"></div>');
            await htmx.timeout(50);

            let ws = mockWebSocketInstances[0];
            assert.equal(ws.protocols, 'my-protocol', 'WebSocket should receive protocols from config');
        });

        it('passes protocols array to WebSocket constructor', async function() {
            htmx.config.ws = { protocols: ['proto1', 'proto2'] };

            createProcessedHTML('<div hx-ws:connect="/ws/test"></div>');
            await htmx.timeout(50);

            let ws = mockWebSocketInstances[0];
            assert.isArray(ws.protocols);
            assert.deepEqual(ws.protocols, ['proto1', 'proto2']);
        });

        it('protocols defaults to undefined when not configured', async function() {
            createProcessedHTML('<div hx-ws:connect="/ws/test"></div>');
            await htmx.timeout(50);

            let ws = mockWebSocketInstances[0];
            assert.isUndefined(ws.protocols, 'protocols should be undefined when not configured');
        });

        it('per-element protocols override global config', async function() {
            htmx.config.ws = { protocols: 'global-proto' };

            createProcessedHTML('<div hx-ws:connect="/ws/test" hx-config="ws.protocols:per-element-proto"></div>');
            await htmx.timeout(50);

            let ws = mockWebSocketInstances[0];
            assert.equal(ws.protocols, 'per-element-proto', 'Per-element protocols should override global');
        });

    });

    // ========================================
    // 7. EVENT EMISSION TESTS
    // ========================================
    
    describe('Event Emission', function() {
        
        it('emits htmx:ws:before:connection before connection', async function() {
            let beforeFired = false;
            let attempt = null;
            let container = document.createElement('div');
            container.innerHTML = '<div hx-ws:connect="/ws/test"></div>';

            container.addEventListener('htmx:ws:before:connection', (e) => {
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

        it('emits htmx:ws:after:connection after connection', async function() {
            let afterFired = false;
            let container = document.createElement('div');
            container.innerHTML = '<div hx-ws:connect="/ws/test"></div>';

            container.addEventListener('htmx:ws:after:connection', () => {
                afterFired = true;
            });

            document.body.appendChild(container);
            htmx.process(container);
            await htmx.timeout(50);

            assert.isTrue(afterFired);
            container.remove();
        });

        it('can cancel initial connection via htmx:ws:before:connection', async function() {
            let container = document.createElement('div');
            container.innerHTML = '<div hx-ws:connect="/ws/test"></div>';

            container.addEventListener('htmx:ws:before:connection', (e) => {
                e.detail.connection.cancelled = true;
            });

            document.body.appendChild(container);
            htmx.process(container);
            await htmx.timeout(50);

            assert.equal(mockWebSocketInstances.length, 0, 'Connection should be cancelled');
            container.remove();
        });

        it('can cancel reconnection via htmx:ws:before:connection', async function() {
            htmx.config.ws = { reconnect: true, reconnectDelay: 50 };

            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test"></div>
            `);

            container.addEventListener('htmx:ws:before:connection', (e) => {
                if (e.detail.connection.attempt > 0) {
                    e.detail.connection.cancelled = true;
                }
            });

            await htmx.timeout(50);
            let firstWs = mockWebSocketInstances[0];
            firstWs.close(1006);
            await htmx.timeout(150);

            assert.equal(mockWebSocketInstances.length, 1, 'Should not reconnect when cancelled');
        });
        
        it('emits htmx:ws:before:message:outgoing before sending', async function() {
            let beforeFired = false;
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test">
                    <button hx-ws:send hx-trigger="click">Send</button>
                </div>
            `);

            div.addEventListener('htmx:ws:before:message:outgoing', () => {
                beforeFired = true;
            });
            
            await htmx.timeout(50);
            div.querySelector('button').click();
            await htmx.timeout(20);
            
            assert.isTrue(beforeFired);
        });
        
        it('emits htmx:ws:after:message:outgoing after sending', async function() {
            let afterMessage;
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test">
                    <button hx-ws:send hx-trigger="click">Send</button>
                </div>
            `);

            div.addEventListener('htmx:ws:after:message:outgoing', (event) => {
                afterMessage = event.detail.message;
            });
            
            await htmx.timeout(50);
            div.querySelector('button').click();
            await htmx.timeout(20);
            
            assert.isString(afterMessage.data);
            assert.deepEqual(JSON.parse(afterMessage.data), {
                headers: afterMessage.headers
            });
        });

        it('includes the connection in every message event', async function() {
            let element = createProcessedHTML(`
                <div hx-ws:connect="/ws/test">
                    <button hx-ws:send>Send</button>
                </div>
            `);
            let connections = [];
            for (let name of [
                'htmx:ws:before:message:outgoing',
                'htmx:ws:after:message:outgoing',
                'htmx:ws:before:message:incoming',
                'htmx:ws:after:message:incoming'
            ]) {
                element.addEventListener(name, event => connections.push(event.detail.connection));
            }
            await htmx.timeout(20);

            element.querySelector('button').click();
            await htmx.timeout(10);
            mockWebSocketInstances[0].simulateMessage({type: 'notification'});
            await htmx.timeout(10);

            let connection = connections[0];
            assert.equal(connections.length, 4);
            assert.isTrue(connections.every(value => value === connection));
            assert.equal(connection.url, getNormalizedUrl('/ws/test'));
        });
        
        it('allows modifying message via htmx:ws:before:message:outgoing', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test">
                    <button hx-ws:send hx-trigger="click">Send</button>
                </div>
            `);

            div.addEventListener('htmx:ws:before:message:outgoing', (e) => {
                e.detail.message.values.custom = 'added';
            });

            await htmx.timeout(50);
            div.querySelector('button').click();
            await htmx.timeout(20);

            let ws = mockWebSocketInstances[0];
            let sent = JSON.parse(ws.lastSent);
            assert.equal(sent.custom, 'added');
        });
        
        it('waits for async authorization before sending', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test">
                    <button hx-ws:send hx-trigger="click">Send</button>
                </div>
            `);
            let resolveToken;
            let token = new Promise(resolve => resolveToken = resolve);

            div.addEventListener('htmx:ws:before:message:outgoing', (event) => {
                event.detail.waitUntil(token.then(value => {
                    event.detail.message.headers.Authorization = `Bearer ${value}`;
                }));
            });

            await htmx.timeout(50);
            div.querySelector('button').click();
            await htmx.timeout(5);

            let ws = mockWebSocketInstances[0];
            assert.isUndefined(ws.lastSent);

            resolveToken('abc123');
            await htmx.timeout(10);
            assert.equal(JSON.parse(ws.lastSent).headers.Authorization, 'Bearer abc123');
        });

        it('sends outgoing messages in trigger order', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test">
                    <button hx-ws:send hx-trigger="click">Send</button>
                </div>
            `);
            let messageNumber = 0;

            div.addEventListener('htmx:ws:before:message:outgoing', (event) => {
                event.detail.message.values.messageNumber = ++messageNumber;
                if (messageNumber === 1) event.detail.waitUntil(htmx.timeout(30));
            });

            await htmx.timeout(50);
            let button = div.querySelector('button');
            button.click();
            button.click();
            await htmx.timeout(60);

            let sent = mockWebSocketInstances[0].sentMessages.map(JSON.parse);
            assert.deepEqual(sent.map(message => message.messageNumber), [1, 2]);
        });

        it('sends replacement WebSocket data', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test">
                    <button hx-ws:send hx-trigger="click">Send</button>
                </div>
            `);
            let data = new Uint8Array([1, 2, 3]);
            let afterMessage;

            div.addEventListener('htmx:ws:before:message:outgoing', (event) => {
                event.detail.message.data = data;
            });
            div.addEventListener('htmx:ws:after:message:outgoing', (event) => {
                afterMessage = event.detail.message;
            });

            await htmx.timeout(50);
            div.querySelector('button').click();
            await htmx.timeout(20);

            let ws = mockWebSocketInstances[0];
            assert.strictEqual(ws.lastSent, data);
            assert.strictEqual(afterMessage.data, data);
        });

        it('can cancel send via htmx:ws:before:message:outgoing', async function() {
            let div = createProcessedHTML(`
                <div hx-ws:connect="/ws/test">
                    <button hx-ws:send hx-trigger="click">Send</button>
                </div>
            `);

            div.addEventListener('htmx:ws:before:message:outgoing', (e) => {
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
                <div hx-ext="ws" ws-connect="/ws/test"></div>
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
                <div hx-ext="ws" ws-connect="/ws/test">
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
                <div hx-ws:connect="/ws/chat" hx-target="#messages" hx-swap="beforeend">
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
                content: '<hx-partial id="messages"><p>Hello</p></hx-partial>'
            });
            await htmx.timeout(20);
            
            assert.include(document.getElementById('messages').innerHTML, 'Hello');
        });
        
        it('handles live notifications pattern', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/notifications" hx-target="#notifications">
                    <div id="notifications"></div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            
            // Receive multiple notifications
            ws.simulateMessage({
                content: '<hx-partial id="notifications" hx-swap="afterbegin"><div class="notif">Notification 1</div></hx-partial>'
            });
            await htmx.timeout(20);
            
            ws.simulateMessage({
                content: '<hx-partial id="notifications" hx-swap="afterbegin"><div class="notif">Notification 2</div></hx-partial>'
            });
            await htmx.timeout(20);
            
            let notifications = document.getElementById('notifications');
            assert.include(notifications.innerHTML, 'Notification 1');
            assert.include(notifications.innerHTML, 'Notification 2');
        });
        
        it('handles real-time dashboard with multiple widgets', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/dashboard">
                    <div id="widget1"></div>
                    <div id="widget2"></div>
                    <div id="widget3"></div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                content: `
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
        
        it('respects target override from message', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#default-target">
                    <div id="default-target">Default</div>
                    <div id="override-target">Override</div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                content: '<div>New Content</div>',
                target: '#override-target'
            });
            await htmx.timeout(20);
            
            assert.equal(document.getElementById('default-target').textContent, 'Default');
            assert.include(document.getElementById('override-target').innerHTML, 'New Content');
        });
        
        it('respects swap override from message', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#content" hx-swap="innerHTML">
                    <div id="content"><p>Item 1</p></div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                content: '<p>Item 2</p>',
                swap: 'beforeend'
            });
            await htmx.timeout(20);
            
            let content = document.getElementById('content');
            assert.include(content.innerHTML, 'Item 1');
            assert.include(content.innerHTML, 'Item 2');
        });
        
        it('uses element hx-target when message has no target', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#element-target">
                    <div id="element-target"></div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                content: '<div>Content</div>'
            });
            await htmx.timeout(20);
            
            assert.include(document.getElementById('element-target').innerHTML, 'Content');
        });
        
        it('uses element hx-swap when message has no swap', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#content" hx-swap="beforeend">
                    <div id="content"><p>Item 1</p></div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                content: '<p>Item 2</p>'
            });
            await htmx.timeout(20);
            
            let content = document.getElementById('content');
            assert.include(content.innerHTML, 'Item 1');
            assert.include(content.innerHTML, 'Item 2');
        });

        // Incoming HTML uses inherited hx-select before the main swap.
        it('uses element hx-select', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#content" hx-select=".message">
                    <div id="content"></div>
                </div>
            `);
            await htmx.timeout(50);

            let ws = mockWebSocketInstances[0];
            ws.simulateRawMessage('<main><p class="message">Selected</p><footer>Ignored</footer></main>');
            await htmx.timeout(20);

            assert.equal(document.getElementById('content').innerHTML, '<p class="message">Selected</p>');
        });

        // A JSON select overrides inherited hx-select for one incoming message.
        it('message select overrides element hx-select', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#content" hx-select=".default">
                    <div id="content"></div>
                </div>
            `);
            await htmx.timeout(50);

            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                content: '<main><p class="default">Default</p><p class="override">Override</p></main>',
                select: '.override'
            });
            await htmx.timeout(20);

            assert.equal(document.getElementById('content').innerHTML, '<p class="override">Override</p>');
        });

        // Incoming HTML uses inherited hx-select-oob for client-selected OOB updates.
        it('uses element hx-select-oob', async function() {
            let container = createProcessedHTML(`
                <div id="ws-conn" hx-ws:connect="/ws/test" hx-select-oob="#status">Original</div>
                <div id="status">Waiting</div>
            `);
            await htmx.timeout(50);

            let ws = mockWebSocketInstances[0];
            ws.simulateRawMessage('<div id="status">Connected</div>');
            await htmx.timeout(20);

            assert.equal(document.getElementById('ws-conn').textContent, 'Original');
            assert.equal(document.getElementById('status').textContent, 'Connected');
        });
        
        it('message target overrides element hx-target', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#element-target">
                    <div id="element-target">Element Target</div>
                    <div id="message-target">Message Target</div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                content: '<div>New</div>',
                target: '#message-target'
            });
            await htmx.timeout(20);
            
            assert.equal(document.getElementById('element-target').textContent, 'Element Target');
            assert.include(document.getElementById('message-target').innerHTML, 'New');
        });
        
        it('message swap overrides element hx-swap', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#content" hx-swap="innerHTML">
                    <div id="content"><p>Original</p></div>
                </div>
            `);
            await htmx.timeout(50);
            
            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                content: '<p>Appended</p>',
                swap: 'beforeend'
            });
            await htmx.timeout(20);
            
            let content = document.getElementById('content');
            assert.include(content.innerHTML, 'Original');
            assert.include(content.innerHTML, 'Appended');
        });
    });

    // ========================================
    // 11. BUG REGRESSION TESTS
    // ========================================

    describe('Bug Regressions', function() {

        it('htmx:ws:after:connection reports correct attempt number on reconnect', async function() {
            htmx.config.ws = { reconnect: true, reconnectDelay: 50, reconnectJitter: 0 };

            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test"></div>
            `);
            await htmx.timeout(50);

            let reportedAttempt = null;
            container.addEventListener('htmx:ws:after:connection', (e) => {
                reportedAttempt = e.detail.connection.attempt;
            });

            // Close to trigger reconnect
            let ws = mockWebSocketInstances[0];
            ws.close(1006);
            await htmx.timeout(150);

            assert.isNotNull(reportedAttempt, 'after:ws:connection should have fired on reconnect');
            assert.equal(reportedAttempt, 1, 'Reconnection attempt should be 1, not 0');
        });

        it('htmx:ws:before:message:incoming includes raw data string', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#content">
                    <div id="content"></div>
                </div>
            `);
            await htmx.timeout(50);

            let receivedMessage = null;
            container.addEventListener('htmx:ws:before:message:incoming', async (e) => {
                receivedMessage = e.detail.message;
            });

            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({ content: '<p>Hello</p>' });
            await htmx.timeout(20);

            assert.equal(receivedMessage.data, JSON.stringify({ content: '<p>Hello</p>' }));
            assert.equal(await receivedMessage.text(), receivedMessage.data);
            assert.equal((await receivedMessage.json()).content, '<p>Hello</p>');
        });
    });

    // ========================================
    // 12. ORPHANED CONNECTION CLEANUP TESTS (BLOCKER 1)
    // ========================================

    describe('Orphaned Connection Cleanup', function() {

        it('closes WebSocket when connect element is removed while connecting', async function() {
            let container = createProcessedHTML(`
                <div id="outer">
                    <div id="ws-host" hx-ws:connect="/ws/test"></div>
                </div>
            `);
            let ws = mockWebSocketInstances[0];
            let host = document.getElementById('ws-host');

            await htmx.swap({
                text: '',
                target: document.getElementById('outer'),
                swap: 'innerHTML',
                sourceElement: container
            });
            await htmx.timeout(20);

            assert.equal(ws.readyState, mockWebSocket.CLOSED);
            assert.isUndefined(getConnection(host));
        });

        it('closes WebSocket when connect element is swapped out mid-connection', async function() {
            let container = createProcessedHTML(`
                <div id="outer">
                    <div id="ws-host" hx-ws:connect="/ws/test">
                        <div id="content">Hello</div>
                    </div>
                </div>
            `);
            await htmx.timeout(50);

            let ws = mockWebSocketInstances[0];
            let host = document.getElementById('ws-host');
            assert.equal(ws.readyState, mockWebSocket.OPEN, 'WebSocket should be open');
            assert.isOk(getConnection(host));

            // Swap out the ws-host element entirely (simulates hx-swap replacing it)
            let target = document.getElementById('outer');
            await htmx.swap({
                text: '<div id="ws-host">Replaced — no hx-ws:connect</div>',
                target,
                swap: 'innerHTML',
                sourceElement: target
            });
            await htmx.timeout(50);

            assert.equal(ws.readyState, mockWebSocket.CLOSED, 'WebSocket should be closed after element removal');
            assert.isUndefined(getConnection(host));
        });

        it('cleans up connection when element is removed and message arrives', async function() {
            let container = createProcessedHTML(`
                <div id="outer">
                    <div id="ws-host" hx-ws:connect="/ws/test" hx-target="#content">
                        <div id="content"></div>
                    </div>
                </div>
            `);
            await htmx.timeout(50);

            let ws = mockWebSocketInstances[0];
            let host = document.getElementById('ws-host');

            // Remove the element without triggering htmx cleanup (simulates raw DOM removal)
            host.remove();
            await htmx.timeout(20);

            // Now a message arrives on the orphaned socket
            ws.simulateMessage({ content: '<p>Ghost message</p>' });
            await htmx.timeout(20);

            assert.equal(ws.readyState, mockWebSocket.CLOSED, 'WebSocket should be closed');
            assert.isUndefined(getConnection(host));
        });

        it('cleans up connection on close when element is gone (no reconnect)', async function() {
            htmx.config.ws = { reconnect: true, reconnectDelay: 20 };

            let container = createProcessedHTML(`
                <div id="outer">
                    <div id="ws-host" hx-ws:connect="/ws/test">
                        <div id="content">Hello</div>
                    </div>
                </div>
            `);
            await htmx.timeout(50);

            let ws = mockWebSocketInstances[0];
            let host = document.getElementById('ws-host');

            // Remove element from DOM without htmx cleanup
            host.remove();
            await htmx.timeout(20);

            // Server-side close
            ws.close();
            await htmx.timeout(100);

            // Should NOT attempt reconnection, should clean up
            assert.equal(mockWebSocketInstances.length, 1, 'Should not create new WebSocket');
            assert.isUndefined(getConnection(host));
        });

        it('cleans up when element removed during reconnect delay', async function() {
            htmx.config.ws = { reconnect: true, reconnectDelay: 200, reconnectJitter: 0 };

            let container = createProcessedHTML(`
                <div id="outer">
                    <div id="ws-host" hx-ws:connect="/ws/test">Content</div>
                </div>
            `);
            await htmx.timeout(50);

            let ws = mockWebSocketInstances[0];
            let host = document.getElementById('ws-host');

            // Close to trigger reconnect scheduling
            ws.close(1006);
            await htmx.timeout(20);

            // Remove element during the reconnect delay
            let target = document.getElementById('outer');
            await htmx.swap({
                text: '<div>No more WS</div>',
                target,
                swap: 'innerHTML',
                sourceElement: target
            });
            await htmx.timeout(250);

            // Reconnect timer should have fired but found no element, so no new socket
            assert.equal(mockWebSocketInstances.length, 1, 'Should not reconnect after element removal');
            assert.isUndefined(getConnection(host));
        });
    });

    // ========================================
    // 13. BACKWARDS COMPAT — json.payload (BLOCKER 2)
    // ========================================

    describe('Backwards Compatibility - json.payload', function() {

        it('swaps HTML from json.payload with deprecation warning', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#content">
                    <div id="content">Original</div>
                </div>
            `);
            await htmx.timeout(50);

            let warnMessage = null;
            let originalWarn = console.warn;
            console.warn = (msg) => { warnMessage = msg; };

            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                payload: '<hx-partial id="content"><p>Via payload</p></hx-partial>'
            });
            await htmx.timeout(20);

            console.warn = originalWarn;

            assert.include(document.getElementById('content').innerHTML, 'Via payload');
            assert.isNotNull(warnMessage, 'Should emit deprecation warning');
            assert.include(warnMessage, 'payload');
            assert.include(warnMessage, 'deprecated');
        });

        it('prefers json.content over json.payload when both present', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#content">
                    <div id="content">Original</div>
                </div>
            `);
            await htmx.timeout(50);

            let warnCalled = false;
            let originalWarn = console.warn;
            console.warn = () => { warnCalled = true; };

            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                content: '<p>From content</p>',
                payload: '<p>From payload</p>'
            });
            await htmx.timeout(20);

            console.warn = originalWarn;

            assert.include(document.getElementById('content').innerHTML, 'From content');
            assert.notInclude(document.getElementById('content').innerHTML, 'From payload');
            assert.isFalse(warnCalled, 'Should not warn when content is present');
        });

        it('does not swap when neither content nor payload is present', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test" hx-target="#content">
                    <div id="content">Original</div>
                </div>
            `);
            await htmx.timeout(50);

            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({ type: 'ping', data: 'hello' });
            await htmx.timeout(20);

            assert.equal(document.getElementById('content').textContent, 'Original');
        });

        it('handles json.payload with target and swap overrides', async function() {
            let container = createProcessedHTML(`
                <div hx-ws:connect="/ws/test">
                    <div id="list"><p>Item 1</p></div>
                </div>
            `);
            await htmx.timeout(50);

            let originalWarn = console.warn;
            console.warn = () => {}; // suppress

            let ws = mockWebSocketInstances[0];
            ws.simulateMessage({
                payload: '<p>Item 2</p>',
                target: '#list',
                swap: 'beforeend'
            });
            await htmx.timeout(20);

            console.warn = originalWarn;

            let list = document.getElementById('list');
            assert.include(list.innerHTML, 'Item 1');
            assert.include(list.innerHTML, 'Item 2');
        });
    });

    // ========================================
    // 14. ADDITIONAL FINDINGS — DEEP REVIEW
    // ========================================

    describe('Deep Review Fixes', function() {

        it('aborts socket listeners when the last connection element is removed', async function() {
            let container = createProcessedHTML(`
                <div id="outer">
                    <div id="ws-host" hx-ws:connect="/ws/test">Content</div>
                </div>
            `);
            await htmx.timeout(50);

            let conn = getConnection(document.getElementById('ws-host'));
            assert.isNotNull(conn, 'Connection should exist');
            assert.isNotNull(conn.abortController, 'AbortController should exist');
            let ac = conn.abortController;

            // Remove the element to trigger closeConnection
            let target = document.getElementById('outer');
            await htmx.swap({ text: '', target, swap: 'innerHTML', sourceElement: target });
            await htmx.timeout(50);

            assert.isTrue(ac.signal.aborted, 'AbortController should be aborted on close');
        });
    });
});
