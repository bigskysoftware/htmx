describe('hx-sse SSE extension', function() {

    let extBackup;
    let docListeners = [];

    function onDoc(event, handler) {
        document.addEventListener(event, handler);
        docListeners.push({event, handler});
    }

    before(async () => {
        extBackup = backupExtensions();
        clearExtensions();

        htmx.config.extensions = 'sse';
        htmx.__approvedExt = 'sse';

        let script = document.createElement('script');
        script.src = '../src/ext/hx-sse.js';
        await new Promise(resolve => {
            script.onload = resolve;
            document.head.appendChild(script);
        });

        if (!htmx.__registeredExt.has('sse')) {
            throw new Error('SSE extension failed to register - check approval');
        }
    });

    after(() => {
        restoreExtensions(extBackup);
    });

    afterEach(function() {
        // Clean up document-level listeners added during tests
        for (let l of docListeners) {
            document.removeEventListener(l.event, l.handler);
        }
        docListeners = [];

        // Restore document.hidden if overridden
        Object.defineProperty(document, 'hidden', {value: false, configurable: true});

        cleanupTest()
    })

    it('basic one-off SSE stream works', async function() {
        const stream = mockStreamResponse('/stream');
        createProcessedHTML('<button hx-get="/stream" hx-swap="innerHTML">Stream</button>');

        find('button').click();
        await htmx.timeout(1);

        stream.send('message 1');
        await waitForEvent('htmx:after:sse:message');
        assertTextContentIs('button', 'message 1');

        stream.send('message 2');
        await waitForEvent('htmx:after:sse:message');
        assertTextContentIs('button', 'message 2');

        stream.close();
    });

    it('continuous stream reconnects with exponential backoff', async function() {
        const stream = mockStreamResponse('/reconnect');
        createProcessedHTML('<button hx-get="/reconnect" hx-config="sse.reconnect:true sse.reconnectDelay:50ms sse.reconnectMaxAttempts:3 sse.reconnectJitter:0" hx-swap="innerHTML">Connect</button>');

        let reconnectAttempts = 0;
        let reconnectDelays = [];

        onDoc('htmx:before:sse:connection', (e) => {
            if (e.detail.connection.attempt > 0) {
                reconnectAttempts++;
                reconnectDelays.push(e.detail.connection.delay);
            }
        });

        find('button').click();
        await htmx.timeout(1);

        stream.send('first');
        await waitForEvent('htmx:after:sse:message');
        assertTextContentIs('button', 'first');

        stream.close();
        await waitForEvent('htmx:after:sse:connection');

        assert.equal(reconnectAttempts, 1, 'Should attempt to reconnect');
        assert.equal(reconnectDelays[0], 50, 'First reconnect should use initial delay (reconnectDelay)');

        stream.send('second');
        await waitForEvent('htmx:after:sse:message');
        assertTextContentIs('button', 'second');

        stream.close();
    });

    it('Last-Event-ID header sent on reconnect', async function() {
        this.timeout(5000);
        const stream = mockStreamResponse('/with-id');
        createProcessedHTML('<button hx-get="/with-id" hx-config="sse.reconnect:true sse.reconnectDelay:50ms sse.reconnectMaxAttempts:2" hx-swap="innerHTML">Connect</button>');

        let lastEventIdSent = null;
        onDoc('htmx:before:sse:connection', (e) => {
            if (e.detail.connection.attempt > 0) {
                lastEventIdSent = e.detail.connection.lastEventId;
            }
        });

        find('button').click();
        await htmx.timeout(1);

        stream.send('first message', null, 'msg-123');
        await waitForEvent('htmx:after:sse:message');
        assertTextContentIs('button', 'first message');

        await new Promise(r => setTimeout(r, 50));

        stream.close();
        await waitForEvent('htmx:after:sse:connection', 5000);

        assert.equal(lastEventIdSent, 'msg-123', 'Should send last event ID on reconnect');

        const lastCall = lastFetch();
        assert.equal(lastCall.request.headers['Last-Event-ID'], 'msg-123', 'Last-Event-ID header should be set');

        stream.close();
    });

    it('events fire correctly and can cancel operations', async function() {
        const stream = mockStreamResponse('/cancelable');
        createProcessedHTML('<button hx-get="/cancelable" hx-swap="innerHTML">Go</button>');

        let beforeConnectFired = false;
        let beforeMessageFired = false;
        let afterMessageFired = false;

        onDoc('htmx:before:sse:connection', () => { beforeConnectFired = true; });
        onDoc('htmx:before:sse:message', () => { beforeMessageFired = true; });
        onDoc('htmx:after:sse:message', () => { afterMessageFired = true; });

        find('button').click();
        await htmx.timeout(1);

        assert.isTrue(beforeConnectFired, 'before:sse:connect should fire');

        stream.send('test');
        await waitForEvent('htmx:after:sse:message');

        assert.isTrue(beforeMessageFired, 'before:sse:message should fire');
        assert.isTrue(afterMessageFired, 'after:sse:message should fire');
        assertTextContentIs('button', 'test');

        stream.close();
    });

    it('element removal stops streaming and fires close event', async function() {
        const stream = mockStreamResponse('/removable');
        createProcessedHTML('<div id="container"><button hx-get="/removable" hx-config="sse.reconnect:true sse.reconnectDelay:50ms" hx-swap="innerHTML">Connect</button></div>');

        find('button').click();
        await htmx.timeout(1);

        stream.send('message 1');
        await waitForEvent('htmx:after:sse:message');
        assertTextContentIs('button', 'message 1');

        let closeFired = false;
        let closeReason = null;
        onDoc('htmx:sse:close', (e) => {
            closeFired = true;
            closeReason = e.detail.reason;
        });

        // Remove the element
        find('#container').innerHTML = '';
        await htmx.timeout(50);

        // Verify no further messages are processed
        let messageAfterRemoval = false;
        onDoc('htmx:after:sse:message', () => { messageAfterRemoval = true; });
        stream.send('message 2');
        await htmx.timeout(50);

        assert.isFalse(messageAfterRemoval, 'Should not process messages after element removal');
        assert.isTrue(closeFired, 'htmx:sse:close should fire');
        assert.equal(closeReason, 'removed', 'Close reason should be "removed"');

        stream.close();
    });

    it('HTTP vs SSE differentiation', async function() {
        mockResponse('GET', '/regular', 'HTTP response');
        createProcessedHTML('<button id="http" hx-get="/regular" hx-swap="innerHTML">HTTP</button>');

        find('#http').click()
        await forRequest();
        assertTextContentIs('#http', 'HTTP response');

        const stream = mockStreamResponse('/sse');
        createProcessedHTML('<button id="sse" hx-get="/sse" hx-swap="innerHTML">SSE</button>');

        find('#sse').click();
        await htmx.timeout(1);

        stream.send('SSE response');
        await waitForEvent('htmx:after:sse:message');

        assertTextContentIs('#sse', 'SSE response');
        stream.close();
    });

    it('SSE message parsing with id field', async function() {
        const stream = mockStreamResponse('/parse');
        createProcessedHTML('<div id="target"></div><button hx-get="/parse" hx-target="#target">Go</button>');

        find('button').click();
        await htmx.timeout(1);

        // Send HTML with id field (no event field, so it swaps)
        stream.send('<div id="msg1">message with id</div>', null, '42');
        await waitForEvent('htmx:after:sse:message');

        assertTextContentIs('#msg1', 'message with id');
        stream.close();
    });

    it('reconnectMaxAttempts configuration works', async function() {
        let fetchCount = 0;
        fetchMock.mockResponse('GET', '/max-attempts', () => {
            fetchCount++;
            if (fetchCount === 1) {
                let ctrl;
                const body = new ReadableStream({ start(c) { ctrl = c; } });
                const response = new MockResponse(body, {
                    headers: { 'Content-Type': 'text/event-stream' }
                });
                response.body = body;
                setTimeout(() => ctrl.close(), 10);
                return response;
            }
            throw new Error('Network error');
        });

        createProcessedHTML('<button hx-get="/max-attempts" hx-config="sse.reconnect:true sse.reconnectDelay:20ms sse.reconnectMaxAttempts:2" hx-swap="innerHTML">Connect</button>');

        let reconnectAttempts = 0;
        onDoc('htmx:before:sse:connection', (e) => {
            if (e.detail.connection.attempt > 0) reconnectAttempts++;
        });

        find('button').click();
        await waitForEvent('htmx:before:sse:connection');

        await new Promise(r => setTimeout(r, 150));

        assert.equal(reconnectAttempts, 2, 'Should attempt reconnecting 2 times');
        assert.equal(fetchCount, 3, 'Should fetch 3 times total (initial + 2 retries)');
    });

    it('reconnectMaxDelay configuration caps backoff', async function() {
        let fetchCount = 0;
        fetchMock.mockResponse('GET', '/max-delay', () => {
            fetchCount++;
            if (fetchCount === 1) {
                let ctrl;
                const body = new ReadableStream({ start(c) { ctrl = c; } });
                const response = new MockResponse(body, {
                    headers: { 'Content-Type': 'text/event-stream' }
                });
                response.body = body;
                setTimeout(() => ctrl.close(), 10);
                return response;
            }
            throw new Error('Network error');
        });

        createProcessedHTML('<button hx-get="/max-delay" hx-config="sse.reconnect:true sse.reconnectDelay:20ms sse.reconnectMaxDelay:60ms sse.reconnectJitter:0" hx-swap="innerHTML">Connect</button>');

        let reconnectDelays = [];
        onDoc('htmx:before:sse:connection', (e) => {
            if (e.detail.connection.attempt > 0) reconnectDelays.push(e.detail.connection.delay);
        });

        find('button').click();
        await waitForEvent('htmx:before:sse:connection');

        await new Promise(r => setTimeout(r, 350));

        assert.isAtLeast(reconnectDelays.length, 4, 'Should have at least 4 reconnect attempts');
        assert.equal(reconnectDelays[0], 20, 'First delay: 20ms');
        assert.equal(reconnectDelays[1], 40, 'Second delay: 40ms (20 * 2)');
        assert.equal(reconnectDelays[2], 60, 'Third delay: 60ms (capped at reconnectMaxDelay)');
        assert.equal(reconnectDelays[3], 60, 'Fourth delay: 60ms (still capped)');
    });

    it('reconnectJitter randomizes reconnect delays', async function() {
        let fetchCount = 0;
        fetchMock.mockResponse('GET', '/jitter-test', () => {
            fetchCount++;
            if (fetchCount === 1) {
                let ctrl;
                const body = new ReadableStream({ start(c) { ctrl = c; } });
                const response = new MockResponse(body, {
                    headers: { 'Content-Type': 'text/event-stream' }
                });
                response.body = body;
                setTimeout(() => ctrl.close(), 10);
                return response;
            }
            throw new Error('Network error');
        });

        // Use a jitter of 0.5 (50%) and a reconnectDelay of 100ms
        createProcessedHTML('<button hx-get="/jitter-test" hx-config="sse.reconnect:true, sse.reconnectDelay:100ms, sse.reconnectJitter:0.5, sse.reconnectMaxAttempts: 5" hx-swap="innerHTML">Connect</button>');

        let reconnectDelays = [];
        onDoc('htmx:before:sse:connection', (e) => {
            if (e.detail.connection.attempt > 0) reconnectDelays.push(e.detail.connection.delay);
        });

        find('button').click();
        await waitForEvent('htmx:before:sse:connection');

        // Wait for multiple reconnects
        await new Promise(r => setTimeout(r, 800));

        // Verify we have multiple reconnects
        assert.isAtLeast(reconnectDelays.length, 3, 'Should have at least 3 reconnect attempts');

        // Check that delays are within the jitter range
        // First attempt: base = 100ms, jitter range = ±50ms, so 50-150ms
        assert.isAtLeast(reconnectDelays[0], 50, 'First delay should be >= 50ms (100 - 50)');
        assert.isAtMost(reconnectDelays[0], 150, 'First delay should be <= 150ms (100 + 50)');

        // Second attempt: base = 200ms (100 * 2), jitter range = ±100ms, so 100-300ms
        assert.isAtLeast(reconnectDelays[1], 100, 'Second delay should be >= 100ms (200 - 100)');
        assert.isAtMost(reconnectDelays[1], 300, 'Second delay should be <= 300ms (200 + 100)');

        // Verify delays are not all identical (showing randomness)
        let allIdentical = reconnectDelays.every((delay, i, arr) => i === 0 || Math.abs(delay - arr[i-1]) < 1);
        assert.isFalse(allIdentical, 'Delays should vary due to jitter');
    });

    it('reconnectJitter of 0 disables jitter', async function() {
        let fetchCount = 0;
        fetchMock.mockResponse('GET', '/no-jitter', () => {
            fetchCount++;
            if (fetchCount === 1) {
                let ctrl;
                const body = new ReadableStream({ start(c) { ctrl = c; } });
                const response = new MockResponse(body, {
                    headers: { 'Content-Type': 'text/event-stream' }
                });
                response.body = body;
                setTimeout(() => ctrl.close(), 10);
                return response;
            }
            throw new Error('Network error');
        });

        createProcessedHTML('<button hx-get="/no-jitter" hx-config="sse.reconnect:true, sse.reconnectDelay:100ms, sse.reconnectJitter:0, sse.reconnectMaxAttempts:3" hx-swap="innerHTML">Connect</button>');

        let reconnectDelays = [];
        onDoc('htmx:before:sse:connection', (e) => {
            if (e.detail.connection.attempt > 0) reconnectDelays.push(e.detail.connection.delay);
        });

        find('button').click();
        await waitForEvent('htmx:before:sse:connection');

        await new Promise(r => setTimeout(r, 450));

        assert.isAtLeast(reconnectDelays.length, 2, 'Should have at least 2 reconnect attempts');

        // With jitter of 0, delays should match exponential backoff exactly
        assert.equal(reconnectDelays[0], 100, 'First delay should be exactly 100ms');
        assert.equal(reconnectDelays[1], 200, 'Second delay should be exactly 200ms (100 * 2)');
    });

    it('pauseOnBackground stops reconnection while tab is hidden', async function() {
        this.timeout(5000);
        const stream = mockStreamResponse('/pause-test');
        createProcessedHTML('<button hx-get="/pause-test" hx-config="sse.reconnect:true sse.pauseOnBackground:true sse.reconnectDelay:50ms sse.reconnectJitter:0" hx-swap="innerHTML">Connect</button>');

        let connectionAttempts = 0;
        onDoc('htmx:before:sse:connection', () => { connectionAttempts++; });

        find('button').click();
        await waitForEvent('htmx:after:sse:connection');
        assert.equal(connectionAttempts, 1, 'Initial connection');

        stream.send('hello');
        await waitForEvent('htmx:after:sse:message');
        assertTextContentIs('button', 'hello');

        // Simulate tab going hidden
        Object.defineProperty(document, 'hidden', {value: true, configurable: true});
        document.dispatchEvent(new Event('visibilitychange'));

        // Wait long enough that reconnection would have happened if not paused
        await new Promise(r => setTimeout(r, 300));

        assert.equal(connectionAttempts, 1, 'Should NOT reconnect while tab is hidden');

        // Simulate tab becoming visible again
        Object.defineProperty(document, 'hidden', {value: false, configurable: true});
        document.dispatchEvent(new Event('visibilitychange'));

        await waitForEvent('htmx:after:sse:connection', 3000);
        assert.equal(connectionAttempts, 2, 'Should reconnect when tab becomes visible');

        stream.send('world');
        await waitForEvent('htmx:after:sse:message');
        assertTextContentIs('button', 'world');

        stream.close();
    });

    it('pauseOnBackground does not inflate attempt counter across pause cycles', async function() {
        this.timeout(5000);
        const stream = mockStreamResponse('/pause-counter');
        createProcessedHTML('<button hx-get="/pause-counter" hx-config="sse.reconnect:true sse.pauseOnBackground:true sse.reconnectDelay:50ms sse.reconnectJitter:0" hx-swap="innerHTML">Connect</button>');

        let delays = [];
        onDoc('htmx:before:sse:connection', (e) => {
            if (e.detail.connection.attempt > 0) {
                delays.push(e.detail.connection.delay);
            }
        });

        find('button').click();
        await waitForEvent('htmx:after:sse:connection');

        stream.send('msg1');
        await waitForEvent('htmx:after:sse:message');

        // First pause/resume cycle
        Object.defineProperty(document, 'hidden', {value: true, configurable: true});
        document.dispatchEvent(new Event('visibilitychange'));
        await new Promise(r => setTimeout(r, 50));
        Object.defineProperty(document, 'hidden', {value: false, configurable: true});
        document.dispatchEvent(new Event('visibilitychange'));
        await waitForEvent('htmx:after:sse:connection', 3000);

        stream.send('msg2');
        await waitForEvent('htmx:after:sse:message');

        // Second pause/resume cycle
        Object.defineProperty(document, 'hidden', {value: true, configurable: true});
        document.dispatchEvent(new Event('visibilitychange'));
        await new Promise(r => setTimeout(r, 50));
        Object.defineProperty(document, 'hidden', {value: false, configurable: true});
        document.dispatchEvent(new Event('visibilitychange'));
        await waitForEvent('htmx:after:sse:connection', 3000);

        // Both delays should be the same (not escalating)
        assert.equal(delays.length, 2, 'Should have 2 reconnections');
        assert.equal(delays[0], delays[1], 'Delays should not escalate across pause cycles');

        stream.close();
    });

    it('custom events trigger on element and bubble', async function() {
        const stream = mockStreamResponse('/custom-events');
        createProcessedHTML('<button hx-get="/custom-events" hx-swap="innerHTML">Connect</button>');

        let customEventFired = false;
        let customEventData = null;
        let customEventId = null;

        // Listen for custom event on the button
        find('button').addEventListener('update', (e) => {
            customEventFired = true;
            customEventData = e.detail.data;
            customEventId = e.detail.id;
        });

        find('button').click();
        await htmx.timeout(1);

        stream.send('some data', 'update', 'event-123');
        await htmx.timeout(1);

        assert.isTrue(customEventFired, 'Custom event should be triggered');
        assert.equal(customEventData, 'some data', 'Event should include data');
        assert.equal(customEventId, 'event-123', 'Event should include id');

        stream.close();
    });

    it('custom events bubble to document', async function() {
        const stream = mockStreamResponse('/bubble-test');
        createProcessedHTML('<button hx-get="/bubble-test" hx-swap="innerHTML">Connect</button>');

        let documentEventFired = false;
        let eventTarget = null;

        // Listen for custom event on document
        onDoc('notification', (e) => {
            documentEventFired = true;
            eventTarget = e.target;
        });

        find('button').click();
        await htmx.timeout(1);

        stream.send('notification message', 'notification');
        await htmx.timeout(1);

        assert.isTrue(documentEventFired, 'Event should bubble to document');
        assert.equal(eventTarget, find('button'), 'Event target should be the button');

        stream.close();
    });

    it('custom events work with hx-on attribute', async function() {
        const stream = mockStreamResponse('/hx-on-test');
        createProcessedHTML('<button hx-get="/hx-on-test" hx-swap="innerHTML" hx-on:progress="this.setAttribute(\'data-progress\', event.detail.data)">Connect</button>');

        find('button').click();
        await htmx.timeout(1);

        stream.send('50%', 'progress');
        await waitForEvent('htmx:after:sse:message');

        assert.equal(find('button').getAttribute('data-progress'), '50%', 'hx-on should handle custom event');

        stream.send('100%', 'progress');
        await waitForEvent('htmx:after:sse:message');

        assert.equal(find('button').getAttribute('data-progress'), '100%', 'hx-on should handle multiple custom events');

        stream.close();
    });

    it('custom events and HTML swaps can coexist', async function() {
        const stream = mockStreamResponse('/mixed-test');
        createProcessedHTML('<button hx-get="/mixed-test" hx-swap="innerHTML">Connect</button>');

        let statusEventFired = false;

        find('button').addEventListener('status', (e) => {
            statusEventFired = true;
        });

        find('button').click();
        await htmx.timeout(1);

        // Send a custom event (should NOT swap)
        stream.send('processing', 'status');
        await waitForEvent('htmx:after:sse:message');
        assert.isTrue(statusEventFired, 'Custom event should fire');
        assertTextContentIs('button', 'Connect', 'Content should NOT be swapped for custom events');

        // Send HTML content (no event field, so it swaps normally)
        stream.send('<div>Result</div>');
        await waitForEvent('htmx:after:sse:message');
        assertTextContentIs('button', 'Result');

        stream.close();
    });

    it('custom events do not swap content', async function() {
        const stream = mockStreamResponse('/event-only');
        createProcessedHTML('<button hx-get="/event-only" hx-swap="innerHTML">Connect</button>');

        let notifyFired = false;
        let notifyData = null;

        find('button').addEventListener('notify', (e) => {
            notifyFired = true;
            notifyData = e.detail.data;
        });

        find('button').click();
        await htmx.timeout(1);

        // Send event - should trigger event but NOT swap
        stream.send('notification data', 'notify');
        await waitForEvent('htmx:after:sse:message');

        assert.isTrue(notifyFired, 'Custom event should fire');
        assert.equal(notifyData, 'notification data', 'Event should have data');
        assertTextContentIs('button', 'Connect', 'Content should NOT be swapped');

        stream.close();
    });

    it('only trims single space after colon', async function() {
        const stream = mockStreamResponse('/sse-whitespace');
        createProcessedHTML('<button id="ws-btn" hx-get="/sse-whitespace" hx-swap="innerHTML">Whitespace</button>');

        find('#ws-btn').click();
        await htmx.timeout(1);

        stream.send('   \ttext-with-two-leading-spaces');
        await waitForEvent('htmx:after:sse:message');
        assertTextContentIs('#ws-btn', '   \ttext-with-two-leading-spaces');

        stream.send('NoTrim');
        await waitForEvent('htmx:after:sse:message');
        assertTextContentIs('#ws-btn', 'NoTrim');

        stream.close();
    });

    it('hx-sse:connect auto-connects on load and streams', async function() {
        const stream = mockStreamResponse('/connect-test');
        createProcessedHTML('<div hx-sse:connect="/connect-test" hx-swap="innerHTML">Waiting</div>');

        await htmx.timeout(1);

        stream.send('connected!');
        await waitForEvent('htmx:after:sse:message');
        assertTextContentIs('div', 'connected!');

        stream.close();
    });

    it('hx-sse:connect enables reconnect by default', async function() {
        const stream = mockStreamResponse('/connect-reconnect');
        createProcessedHTML('<div hx-sse:connect="/connect-reconnect" hx-swap="innerHTML">Waiting</div>');

        await htmx.timeout(1);

        stream.send('first');
        await waitForEvent('htmx:after:sse:message');
        assertTextContentIs('div', 'first');

        let reconnectFired = false;
        onDoc('htmx:before:sse:connection', (e) => {
            if (e.detail.connection.attempt > 0) reconnectFired = true;
        });

        stream.close();
        await waitForEvent('htmx:after:sse:connection');

        assert.isTrue(reconnectFired, 'connect should reconnect by default');
    });

    it('hx-sse:connect with hx-trigger="load delay:100ms" delays connection', async function() {
        const stream = mockStreamResponse('/delayed');
        createProcessedHTML('<div hx-sse:connect="/delayed" hx-trigger="load delay:100ms" hx-swap="innerHTML">Waiting</div>');

        // Should NOT have connected yet
        await htmx.timeout(10);
        stream.send('too early');
        await htmx.timeout(10);
        assertTextContentIs('div', 'Waiting');

        // Wait for delay to elapse + connection
        await htmx.timeout(150);

        stream.send('delayed!');
        await waitForEvent('htmx:after:sse:message');
        assertTextContentIs('div', 'delayed!');

        stream.close();
    });

    it('hx-sse:connect with hx-trigger="click" connects on click', async function() {
        const stream = mockStreamResponse('/on-click');
        createProcessedHTML('<button hx-sse:connect="/on-click" hx-trigger="click" hx-swap="innerHTML">Click me</button>');

        // Should NOT have connected yet
        await htmx.timeout(10);
        assertTextContentIs('button', 'Click me');

        find('button').click();
        await htmx.timeout(1);

        stream.send('clicked!');
        await waitForEvent('htmx:after:sse:message');
        assertTextContentIs('button', 'clicked!');

        stream.close();
    });

    it('hx-sse:connect with hx-trigger="click once" only connects once', async function() {
        let fetchCount = 0;
        fetchMock.mockResponse('GET', '/once-test', () => {
            fetchCount++;
            let ctrl;
            const body = new ReadableStream({ start(c) { ctrl = c; } });
            const response = new MockResponse(body, {
                headers: { 'Content-Type': 'text/event-stream' }
            });
            response.body = body;
            return response;
        });

        createProcessedHTML('<button hx-sse:connect="/once-test" hx-trigger="click once" hx-swap="innerHTML">Click</button>');

        find('button').click();
        await htmx.timeout(10);
        assert.equal(fetchCount, 1, 'First click should connect');

        find('button').click();
        await htmx.timeout(10);
        assert.equal(fetchCount, 1, 'Second click should be ignored (once modifier)');
    });

    it('hx-sse:connect with hx-target swaps into correct target', async function() {
        const stream = mockStreamResponse('/targeted');
        createProcessedHTML('<div><button hx-sse:connect="/targeted" hx-target="#output">Go</button><span id="output">empty</span></div>');

        await htmx.timeout(1);

        stream.send('targeted!');
        await waitForEvent('htmx:after:sse:message');
        assertTextContentIs('#output', 'targeted!');

        stream.close();
    });

    it('hx-sse:connect respects hx-swap style', async function() {
        const stream = mockStreamResponse('/append-test');
        createProcessedHTML('<div hx-sse:connect="/append-test" hx-swap="beforeend">start</div>');

        await htmx.timeout(1);

        stream.send('<span>1</span>');
        await waitForEvent('htmx:after:sse:message');
        stream.send('<span>2</span>');
        await waitForEvent('htmx:after:sse:message');

        assertTextContentIs('div', 'start12');

        stream.close();
    });

    it('named SSE event on parent does NOT trigger child hx-trigger without from:', async function() {
        const stream = mockStreamResponse('/bubble-down');
        mockResponse('GET', '/child-refresh', 'Refreshed!');
        createProcessedHTML('<div hx-sse:connect="/bubble-down"><div id="child" hx-get="/child-refresh" hx-trigger="update" hx-swap="innerHTML">Original</div></div>');

        await htmx.timeout(1);

        stream.send('payload', 'update');
        await waitForEvent('htmx:after:sse:message');
        await htmx.timeout(50);

        // Event dispatches on parent, bubbles UP — child doesn't see it
        assertTextContentIs('#child', 'Original');

        stream.close();
    });

    it('named SSE event triggers child with hx-trigger="... from:body"', async function() {
        const stream = mockStreamResponse('/bubble-from');
        mockResponse('GET', '/child-action', 'Updated!');
        createProcessedHTML('<div hx-sse:connect="/bubble-from"><div id="child" hx-get="/child-action" hx-trigger="update from:body" hx-swap="innerHTML">Original</div></div>');

        await htmx.timeout(1);

        stream.send('payload', 'update');
        await waitForEvent('htmx:after:sse:message');
        await forRequest();

        assertTextContentIs('#child', 'Updated!');

        stream.close();
    });

    // --- New tests ---

    it('htmx:sse:error fires on stream errors', async function() {
        let fetchCount = 0;
        fetchMock.mockResponse('GET', '/error-test', () => {
            fetchCount++;
            if (fetchCount === 1) {
                let ctrl;
                const body = new ReadableStream({
                    start(c) { ctrl = c; },
                });
                const response = new MockResponse(body, {
                    headers: { 'Content-Type': 'text/event-stream' }
                });
                response.body = body;
                // Trigger an error on the stream
                setTimeout(() => ctrl.error(new Error('stream broken')), 20);
                return response;
            }
            throw new Error('Network error');
        });

        createProcessedHTML('<button hx-get="/error-test" hx-swap="innerHTML">Go</button>');

        let errorFired = false;
        let errorDetail = null;
        onDoc('htmx:sse:error', (e) => {
            errorFired = true;
            errorDetail = e.detail;
        });

        find('button').click();
        await new Promise(r => setTimeout(r, 100));

        assert.isTrue(errorFired, 'htmx:sse:error should fire on stream error');
        assert.isNotNull(errorDetail.error, 'Error detail should contain error object');
    });

    it('htmx:sse:error fires on non-2xx reconnect response', async function() {
        this.timeout(5000);
        let fetchCount = 0;
        fetchMock.mockResponse('GET', '/status-error', () => {
            fetchCount++;
            if (fetchCount === 1) {
                let ctrl;
                const body = new ReadableStream({ start(c) { ctrl = c; } });
                const response = new MockResponse(body, {
                    headers: { 'Content-Type': 'text/event-stream' }
                });
                response.body = body;
                setTimeout(() => ctrl.close(), 10);
                return response;
            }
            // Return a 500 on reconnect
            const body = new ReadableStream({ start(c) { c.close(); } });
            const response = new MockResponse(body, {
                status: 500,
                headers: { 'Content-Type': 'text/event-stream' }
            });
            response.body = body;
            response.ok = false;
            return response;
        });

        createProcessedHTML('<button hx-get="/status-error" hx-config="sse.reconnect:true sse.reconnectDelay:20ms sse.reconnectMaxAttempts:1" hx-swap="innerHTML">Go</button>');

        let errorFired = false;
        let errorStatus = null;
        onDoc('htmx:sse:error', (e) => {
            errorFired = true;
            errorStatus = e.detail.status;
        });

        find('button').click();
        await new Promise(r => setTimeout(r, 200));

        assert.isTrue(errorFired, 'htmx:sse:error should fire for non-2xx reconnect');
        assert.equal(errorStatus, 500, 'Error detail should include status code');
    });

    it('htmx:before:sse:message cancellation prevents swap', async function() {
        const stream = mockStreamResponse('/cancel-msg');
        createProcessedHTML('<button hx-get="/cancel-msg" hx-swap="innerHTML">Original</button>');

        onDoc('htmx:before:sse:message', (e) => {
            if (e.detail.message.data === 'skip me') {
                e.detail.message.cancelled = true;
            }
        });

        find('button').click();
        await htmx.timeout(1);

        stream.send('skip me');
        await htmx.timeout(50);
        assertTextContentIs('button', 'Original', 'Cancelled message should not swap');

        stream.send('keep me');
        await waitForEvent('htmx:after:sse:message');
        assertTextContentIs('button', 'keep me', 'Non-cancelled message should swap');

        stream.close();
    });

    it('htmx:before:sse:message cancellation via preventDefault', async function() {
        const stream = mockStreamResponse('/cancel-prevent');
        createProcessedHTML('<button hx-get="/cancel-prevent" hx-swap="innerHTML">Original</button>');

        onDoc('htmx:before:sse:message', (e) => {
            if (e.detail.message.data === 'blocked') {
                e.preventDefault();
            }
        });

        find('button').click();
        await htmx.timeout(1);

        stream.send('blocked');
        await htmx.timeout(50);
        assertTextContentIs('button', 'Original', 'preventDefault should skip message');

        stream.send('allowed');
        await waitForEvent('htmx:after:sse:message');
        assertTextContentIs('button', 'allowed');

        stream.close();
    });

    it('hx-sse:close closes connection on matching event', async function() {
        const stream = mockStreamResponse('/close-test');
        createProcessedHTML('<div hx-sse:connect="/close-test" hx-sse:close="done" hx-swap="innerHTML">Waiting</div>');

        await htmx.timeout(1);

        stream.send('message 1');
        await waitForEvent('htmx:after:sse:message');
        assertTextContentIs('div', 'message 1');

        let closeFired = false;
        let closeReason = null;
        onDoc('htmx:sse:close', (e) => {
            closeFired = true;
            closeReason = e.detail.reason;
        });

        // Send the close event
        stream.send('goodbye', 'done');
        await waitForEvent('htmx:sse:close');

        assert.isTrue(closeFired, 'htmx:sse:close should fire');
        assert.equal(closeReason, 'message', 'Close reason should be "message"');

        // Verify no reconnection occurs
        let reconnectFired = false;
        onDoc('htmx:before:sse:connection', (e) => {
            if (e.detail.connection.attempt > 0) reconnectFired = true;
        });

        await htmx.timeout(100);
        assert.isFalse(reconnectFired, 'Should NOT attempt reconnect after hx-sse:close');
    });

    it('hx-sse:close does not close on non-matching events', async function() {
        const stream = mockStreamResponse('/close-nomatch');
        createProcessedHTML('<div hx-sse:connect="/close-nomatch" hx-sse:close="done" hx-swap="innerHTML">Waiting</div>');

        await htmx.timeout(1);

        let closeFired = false;
        onDoc('htmx:sse:close', () => { closeFired = true; });

        // Send a different named event — should NOT close
        stream.send('status update', 'status');
        await waitForEvent('htmx:after:sse:message');

        assert.isFalse(closeFired, 'Should NOT close on non-matching event');

        // Regular messages should still swap
        stream.send('content');
        await waitForEvent('htmx:after:sse:message');
        assertTextContentIs('div', 'content');

        stream.close();
    });

    it('htmx:sse:close fires with "ended" reason when stream ends naturally', async function() {
        let ctrl;
        fetchMock.mockResponse('GET', '/end-test', () => {
            const body = new ReadableStream({ start(c) { ctrl = c; } });
            const response = new MockResponse(body, {
                headers: { 'Content-Type': 'text/event-stream' }
            });
            response.body = body;
            return response;
        });

        createProcessedHTML('<button hx-get="/end-test" hx-swap="innerHTML">Go</button>');

        let closeReason = null;
        onDoc('htmx:sse:close', (e) => { closeReason = e.detail.reason; });

        find('button').click();
        await htmx.timeout(1);

        // Close the stream (no reconnect configured)
        ctrl.close();
        await waitForEvent('htmx:sse:close');

        assert.equal(closeReason, 'ended', 'Close reason should be "ended"');
    });

    it('server retry field updates reconnect delay', async function() {
        this.timeout(5000);
        const stream = mockStreamResponse('/retry-test');
        createProcessedHTML('<button hx-get="/retry-test" hx-config="sse.reconnect:true sse.reconnectDelay:50ms sse.reconnectMaxAttempts:2 sse.reconnectJitter:0" hx-swap="innerHTML">Go</button>');

        let reconnectDelays = [];
        onDoc('htmx:before:sse:connection', (e) => {
            if (e.detail.connection.attempt > 0) reconnectDelays.push(e.detail.connection.delay);
        });

        find('button').click();
        await htmx.timeout(1);

        // Send a message with retry field set to 200ms
        stream.sendRaw('retry: 200\ndata: hello\n\n');
        await waitForEvent('htmx:after:sse:message');

        stream.close();
        await waitForEvent('htmx:after:sse:connection', 5000);

        // First reconnect should use the server-provided retry delay
        assert.equal(reconnectDelays[0], 200, 'Reconnect delay should be updated by retry field');

        stream.close();
    });
});
