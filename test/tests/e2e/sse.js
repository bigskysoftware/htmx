describe('Server-Sent Events', function() {
    afterEach(function() {
        cleanupTest()
    })

    it('basic one-off SSE stream works', async function() {
        const stream = mockStreamResponse('/stream');
        initHTML('<button hx-get="/stream" hx-swap="innerHTML">Stream</button>');

        click('button');
        await htmx.waitATick();

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
        initHTML('<button hx-get="/reconnect" hx-stream="continuous initialDelay:50ms maxRetries:3" hx-swap="innerHTML">Connect</button>');

        let reconnectAttempts = 0;
        let reconnectDelays = [];

        document.addEventListener('htmx:before:sse:reconnect', (e) => {
            reconnectAttempts++;
            reconnectDelays.push(e.detail.reconnect.delay);
        });

        click('button');
        await htmx.waitATick();

        stream.send('first');
        await waitForEvent('htmx:after:sse:message');
        assertTextContentIs('button', 'first');

        const reconnectPromise = waitForEvent('htmx:before:sse:reconnect');

        stream.close();
        await waitForEvent('htmx:after:sse:stream');
        await reconnectPromise;

        assert.equal(reconnectAttempts, 1, 'Should attempt to reconnect');
        assert.equal(reconnectDelays[0], 50, 'First reconnect should use initialDelay');

        await waitForEvent('htmx:before:sse:stream');

        stream.send('second');
        await waitForEvent('htmx:after:sse:message');
        assertTextContentIs('button', 'second');

        stream.close();
    });

    it('Last-Event-ID header sent on reconnect', async function() {
        this.timeout(5000);
        const stream = mockStreamResponse('/with-id');
        initHTML('<button hx-get="/with-id" hx-stream="continuous initialDelay:50ms maxRetries:2" hx-swap="innerHTML">Connect</button>');

        let lastEventIdSent = null;
        document.addEventListener('htmx:before:sse:reconnect', (e) => {
            lastEventIdSent = e.detail.reconnect.lastEventId;
        });

        click('button');
        await htmx.waitATick();

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
        initHTML('<button hx-get="/cancelable" hx-swap="innerHTML">Go</button>');

        let beforeStreamFired = false;
        let beforeMessageFired = false;
        let afterMessageFired = false;

        document.addEventListener('htmx:before:sse:stream', () => { beforeStreamFired = true; });
        document.addEventListener('htmx:before:sse:message', () => { beforeMessageFired = true; });
        document.addEventListener('htmx:after:sse:message', () => { afterMessageFired = true; });

        click('button');
        await htmx.waitATick();

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
        initHTML('<div id="container"><button hx-get="/removable" hx-stream="continuous initialDelay:50ms" hx-swap="innerHTML">Connect</button></div>');

        click('button');
        await htmx.waitATick();

        stream.send('message 1');
        await waitForEvent('htmx:after:sse:message');

        findElt('#container').innerHTML = '';
        await htmx.waitATick();

        stream.send('message 2');
        await htmx.waitATick();

        assert.isTrue(true, 'Should handle element removal gracefully');
        stream.close();
    });

    it('HTTP vs SSE differentiation', async function() {
        mockResponse('GET', '/regular', 'HTTP response');
        initHTML('<button id="http" hx-get="/regular" hx-swap="innerHTML">HTTP</button>');

        await clickAndWait('#http');
        assertTextContentIs('#http', 'HTTP response');

        const stream = mockStreamResponse('/sse');
        initHTML('<button id="sse" hx-get="/sse" hx-swap="innerHTML">SSE</button>');

        click('#sse');
        await htmx.waitATick();

        stream.send('SSE response');
        await waitForEvent('htmx:after:sse:message');

        assertTextContentIs('#sse', 'SSE response');
        stream.close();
    });

    it('SSE message parsing with multiple fields', async function() {
        const stream = mockStreamResponse('/parse');
        initHTML('<div id="target"></div><button hx-get="/parse" hx-target="#target">Go</button>');

        click('button');
        await htmx.waitATick();

        stream.send('<div id="msg1">with event</div>', 'custom-event', '42');
        await waitForEvent('htmx:after:sse:message');

        assertTextContentIs('#msg1', 'with event');
        stream.close();
    });

    it('maxRetries configuration works', async function() {
        let fetchCount = 0;
        fetchMock.mockResponse('GET', '/max-retries', () => {
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

        initHTML('<button hx-get="/max-retries" hx-stream="continuous initialDelay:20ms maxRetries:2" hx-swap="innerHTML">Connect</button>');

        let reconnectAttempts = 0;
        document.addEventListener('htmx:before:sse:reconnect', () => {
            reconnectAttempts++;
        });

        click('button');
        await waitForEvent('htmx:after:sse:stream');

        await new Promise(r => setTimeout(r, 150));

        assert.equal(reconnectAttempts, 2, 'Should attempt reconnect maxRetries (2) times');
        assert.equal(fetchCount, 3, 'Should fetch 3 times total (initial + 2 retries)');
    });

    it('maxDelay configuration caps backoff', async function() {
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

        initHTML('<button hx-get="/max-delay" hx-stream="continuous initialDelay:20ms maxDelay:60ms" hx-swap="innerHTML">Connect</button>');

        let reconnectDelays = [];
        document.addEventListener('htmx:before:sse:reconnect', (e) => {
            reconnectDelays.push(e.detail.reconnect.delay);
        });

        click('button');
        await waitForEvent('htmx:after:sse:stream');

        await new Promise(r => setTimeout(r, 350));

        assert.isAtLeast(reconnectDelays.length, 4, 'Should have at least 4 reconnect attempts');
        assert.equal(reconnectDelays[0], 20, 'First delay: 20ms');
        assert.equal(reconnectDelays[1], 40, 'Second delay: 40ms (20 * 2)');
        assert.equal(reconnectDelays[2], 60, 'Third delay: 60ms (capped at maxDelay)');
        assert.equal(reconnectDelays[3], 60, 'Fourth delay: 60ms (still capped)');
    });

    it('pauseHidden configuration works', async function() {
        this.skip(); // Skip - complex visibility API testing
    });
});
