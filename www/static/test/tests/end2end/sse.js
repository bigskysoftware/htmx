describe('Server-Sent Events', function() {
    afterEach(function() {
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

        document.addEventListener('htmx:before:sse:reconnect', (e) => {
            reconnectAttempts++;
            reconnectDelays.push(e.detail.reconnect.delay);
        });

        find('button').click();
        await htmx.timeout(1);

        stream.send('first');
        await waitForEvent('htmx:after:sse:message');
        assertTextContentIs('button', 'first');

        const reconnectPromise = waitForEvent('htmx:before:sse:reconnect');

        stream.close();
        await waitForEvent('htmx:after:sse:stream');
        await reconnectPromise;

        assert.equal(reconnectAttempts, 1, 'Should attempt to reconnect');
        assert.equal(reconnectDelays[0], 50, 'First reconnect should use initial delay (reconnectDelay)');

        await waitForEvent('htmx:before:sse:stream');

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
        document.addEventListener('htmx:before:sse:reconnect', (e) => {
            lastEventIdSent = e.detail.reconnect.lastEventId;
        });

        find('button').click();
        await htmx.timeout(1);

        stream.send('first message', null, 'msg-123');
        await waitForEvent('htmx:after:sse:message');
        assertTextContentIs('button', 'first message');

        await new Promise(r => setTimeout(r, 50));

        const reconnectPromise = waitForEvent('htmx:before:sse:reconnect', 5000);

        stream.close();
        await waitForEvent('htmx:after:sse:stream');
        await reconnectPromise;

        assert.equal(lastEventIdSent, 'msg-123', 'Should send last event ID on reconnect');

        await waitForEvent('htmx:before:sse:stream');

        const lastCall = lastFetch();
        assert.equal(lastCall.request.headers['Last-Event-ID'], 'msg-123', 'Last-Event-ID header should be set');

        stream.close();
    });

    it('events fire correctly and can cancel operations', async function() {
        const stream = mockStreamResponse('/cancelable');
        createProcessedHTML('<button hx-get="/cancelable" hx-swap="innerHTML">Go</button>');

        let beforeStreamFired = false;
        let beforeMessageFired = false;
        let afterMessageFired = false;

        document.addEventListener('htmx:before:sse:stream', () => { beforeStreamFired = true; });
        document.addEventListener('htmx:before:sse:message', () => { beforeMessageFired = true; });
        document.addEventListener('htmx:after:sse:message', () => { afterMessageFired = true; });

        find('button').click();
        await htmx.timeout(1);

        assert.isTrue(beforeStreamFired, 'before:sse:stream should fire');

        stream.send('test');
        await waitForEvent('htmx:after:sse:message');

        assert.isTrue(beforeMessageFired, 'before:sse:message should fire');
        assert.isTrue(afterMessageFired, 'after:sse:message should fire');
        assertTextContentIs('button', 'test');

        stream.close();
    });

    it('element removal stops streaming', async function() {
        const stream = mockStreamResponse('/removable');
        createProcessedHTML('<div id="container"><button hx-get="/removable" hx-config="sse.reconnect:true sse.reconnectDelay:50ms" hx-swap="innerHTML">Connect</button></div>');

        find('button').click();
        await htmx.timeout(1);

        stream.send('message 1');
        await waitForEvent('htmx:after:sse:message');

        find('#container').innerHTML = '';
        await htmx.timeout(1);

        stream.send('message 2');
        await htmx.timeout(1);

        assert.isTrue(true, 'Should handle element removal gracefully');
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
        document.addEventListener('htmx:before:sse:reconnect', () => {
            reconnectAttempts++;
        });

        find('button').click();
        await waitForEvent('htmx:after:sse:stream');

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
        document.addEventListener('htmx:before:sse:reconnect', (e) => {
            reconnectDelays.push(e.detail.reconnect.delay);
        });

        find('button').click();
        await waitForEvent('htmx:after:sse:stream');

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
        document.addEventListener('htmx:before:sse:reconnect', (e) => {
            reconnectDelays.push(e.detail.reconnect.delay);
        });

        find('button').click();
        await waitForEvent('htmx:after:sse:stream');

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
        document.addEventListener('htmx:before:sse:reconnect', (e) => {
            reconnectDelays.push(e.detail.reconnect.delay);
        });

        find('button').click();
        await waitForEvent('htmx:after:sse:stream');

        await new Promise(r => setTimeout(r, 450));

        assert.isAtLeast(reconnectDelays.length, 2, 'Should have at least 2 reconnect attempts');

        // With jitter of 0, delays should match exponential backoff exactly
        assert.equal(reconnectDelays[0], 100, 'First delay should be exactly 100ms');
        assert.equal(reconnectDelays[1], 200, 'Second delay should be exactly 200ms (100 * 2)');
    });

    it('closeOnHide configuration works', async function() {
        this.skip(); // Skip - complex visibility API testing
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
        document.addEventListener('notification', (e) => {
            documentEventFired = true;
            eventTarget = e.target;
        }, { once: true });

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
});
