describe('hx-multipart extension', function() {

    let extBackup;
    let configExtensions;
    let partsDescriptor;

    before(async () => {
        extBackup = backupExtensions();
        configExtensions = htmx.config.extensions;
        partsDescriptor = Object.getOwnPropertyDescriptor(Response.prototype, 'parts');
        clearExtensions();

        htmx.config.extensions = 'hx-multipart';
        htmx.__approvedExt = 'hx-multipart';

        let script = document.createElement('script');
        script.src = '../src/ext/hx-multipart.js';
        await new Promise(resolve => {
            script.onload = resolve;
            document.head.appendChild(script);
        });

        if (!htmx.__registeredExt.has('hx-multipart')) {
            throw new Error('hx-multipart extension failed to register - check approval');
        }
    });

    after(() => {
        restoreExtensions(extBackup);
        htmx.config.extensions = configExtensions;
        if (partsDescriptor) {
            Object.defineProperty(Response.prototype, 'parts', partsDescriptor);
        } else {
            delete Response.prototype.parts;
        }
    });

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    it('installs Response.prototype.parts', function() {
        assert.equal(typeof Response.prototype.parts, 'function');
    });

    it('closes Content-Length bodies before the next boundary arrives', async function() {
        let controller;
        let response = new Response(new ReadableStream({
            start(value) {
                controller = value;
            }
        }), {
            headers: {'Content-Type': 'multipart/mixed; boundary=updates'}
        });
        let encode = value => new TextEncoder().encode(value);

        controller.enqueue(encode('--updates\r\nContent-Length: 5\r\n\r\nhello'));
        let iterator = response.parts()[Symbol.asyncIterator]();
        let {value: part} = await iterator.next();
        let result = await Promise.race([
            part.text().then(value => ({value})),
            htmx.timeout(20).then(() => ({pending: true}))
        ]);

        controller.enqueue(encode('\r\n--updates--'));
        controller.close();
        await iterator.next();

        assert.deepEqual(result, {value: 'hello'});
    });

    it('appends multipart types to an existing Accept header', async function() {
        mockResponse('GET', '/test', 'OK');
        let button = createProcessedHTML('<button hx-get="/test" hx-swap="none" hx-headers=\'"Accept":"text/html, text/event-stream"\'>Go</button>');

        button.click();
        await forRequest();

        assert.equal(
            lastFetch().request.headers.Accept,
            'text/html, text/event-stream, multipart/mixed, multipart/parallel'
        );
    });

    async function waitUntil(condition, timeout = 200) {
        let start = Date.now();
        while (Date.now() - start < timeout) {
            if (condition()) return true;
            await htmx.timeout(5);
        }
        return false;
    }

    it('applies request, envelope, and part swap settings in order', async function() {
        let content = [
            '<span class="request-choice">request</span>',
            '<span class="envelope-choice">envelope</span>',
            '<span class="part-choice">part</span>',
            '<span class="re-choice">re</span>'
        ].join('');
        let response = (partHeaders = [], envelopeHeaders = {}) => new Response([
            '--updates\r\n',
            'Content-Type: text/html\r\n',
            ...partHeaders.map(header => `${header}\r\n`),
            '\r\n',
            content,
            '\r\n--updates--\r\n'
        ].join(''), {
            headers: {
                'Content-Type': 'multipart/mixed; boundary=updates',
                ...envelopeHeaders
            }
        });

        fetchMock.mockResponse('GET', '/request-defaults', response());
        fetchMock.mockResponse('GET', '/envelope-defaults', response([], {
            'HX-Target': '#envelope-target',
            'HX-Swap': 'beforeend',
            'HX-Select': '.envelope-choice'
        }));
        fetchMock.mockResponse('GET', '/envelope-re', response([], {
            'HX-Target': '#request-target',
            'HX-Swap': 'innerHTML',
            'HX-Select': '.envelope-choice',
            'HX-Retarget': '#envelope-re-target',
            'HX-Reswap': 'beforeend',
            'HX-Reselect': '.re-choice'
        }));
        fetchMock.mockResponse('GET', '/part-direct', response([
            'HX-Target: #part-target',
            'HX-Swap: innerHTML',
            'HX-Select: .part-choice'
        ], {
            'HX-Retarget': '#envelope-target',
            'HX-Reswap': 'beforeend',
            'HX-Reselect': '.envelope-choice'
        }));
        fetchMock.mockResponse('GET', '/part-re', response([
            'HX-Target: #part-target',
            'HX-Swap: innerHTML',
            'HX-Select: .part-choice',
            'HX-Retarget: #re-target',
            'HX-Reswap: beforeend',
            'HX-Reselect: .re-choice'
        ]));

        createProcessedHTML([
            '<button id="request" hx-get="/request-defaults" hx-target="#request-target" hx-swap="innerHTML" hx-select=".request-choice">request</button>',
            '<button id="envelope" hx-get="/envelope-defaults" hx-target="#request-target">envelope</button>',
            '<button id="envelope-re" hx-get="/envelope-re">envelope re</button>',
            '<button id="part" hx-get="/part-direct">part</button>',
            '<button id="re" hx-get="/part-re">re</button>',
            '<div id="request-target">existing</div>',
            '<div id="envelope-target">existing</div>',
            '<div id="envelope-re-target">existing</div>',
            '<div id="part-target">existing</div>',
            '<div id="re-target">existing</div>'
        ].join(''));

        find('#request').click();
        await forRequest();
        assertTextContentIs('#request-target', 'request');

        find('#envelope').click();
        await forRequest();
        assertTextContentIs('#envelope-target', 'existingenvelope');

        find('#envelope-re').click();
        await forRequest();
        assertTextContentIs('#envelope-re-target', 'existingre');

        find('#part').click();
        await forRequest();
        assertTextContentIs('#part-target', 'part');

        find('#re').click();
        await forRequest();
        assertTextContentIs('#re-target', 'existingre');
    });

    it('reconnects hx-multipart:connect after clean EOF and stops on removal', async function() {
        let requestCount = 0;
        let closeReason;
        document.addEventListener(
            'htmx:multipart:close',
            event => closeReason = event.detail.reason,
            {once: true}
        );

        fetchMock.mockResponse('GET', '/connect', () => {
            requestCount++;
            return new Response([
                '--updates\r\n',
                'Content-Type: text/html\r\n',
                'HX-Target: #connection-target\r\n',
                'HX-Swap: innerHTML\r\n',
                '\r\n',
                `<span>${requestCount}</span>`,
                '\r\n--updates--\r\n'
            ].join(''), {
                headers: {'Content-Type': 'multipart/mixed; boundary=updates'}
            });
        });

        createProcessedHTML([
            '<div id="source" hx-multipart:connect="/connect" ',
            'hx-config="multipart.reconnectDelay:1ms multipart.reconnectMaxDelay:1ms multipart.reconnectJitter:0"></div>',
            '<div id="connection-target"></div>'
        ].join(''));

        assert.isTrue(await waitUntil(() => requestCount >= 2, 500));
        await htmx.swap('', '#source', {style: 'delete'});

        let stoppedAt = requestCount;
        await htmx.timeout(20);

        assert.equal(requestCount, stoppedAt);
        assert.equal(closeReason, 'removed');
    });

    it('reconnects hx-multipart:connect after a broken stream', async function() {
        let requestCount = 0;
        let encoder = new TextEncoder();
        fetchMock.mockResponse('GET', '/broken', () => {
            requestCount++;
            let content = [
                '--updates\r\n',
                'Content-Type: text/html\r\n',
                'HX-Target: #broken-target\r\n',
                '\r\n',
                `<span>${requestCount}</span>`
            ].join('');
            let body = requestCount === 1
                ? content
                : new ReadableStream({
                    start(controller) {
                        controller.enqueue(encoder.encode(`${content}\r\n--updates\r\nContent-Type: text/html\r\n\r\n`));
                    }
                });
            return new Response(body, {
                headers: {'Content-Type': 'multipart/mixed; boundary=updates'}
            });
        });

        createProcessedHTML([
            '<div id="broken-source" hx-multipart:connect="/broken" ',
            'hx-config="multipart.reconnectDelay:1ms multipart.reconnectMaxDelay:1ms multipart.reconnectJitter:0"></div>',
            '<div id="broken-target"></div>'
        ].join(''));

        assert.isTrue(await waitUntil(() => requestCount >= 2, 500));
        assert.isTrue(await waitUntil(() => htmx.find('#broken-target').textContent === '2', 500));
        await htmx.swap('', '#broken-source', {style: 'delete'});
    });

    it('keeps hx-multipart:connect alive after HX-Location', async function() {
        let requestCount = 0;
        let locationCount = 0;
        fetchMock.mockResponse('GET', '/location-stream', () => {
            requestCount++;
            let body = requestCount === 1
                ? [
                    '--updates\r\n',
                    'Content-Type: text/html\r\n',
                    'HX-Location: path:"/destination" target:"#location-target" push:false\r\n',
                    '\r\n',
                    'ignored',
                    '\r\n--updates--\r\n'
                ].join('')
                : new ReadableStream();
            return new Response(body, {
                headers: {'Content-Type': 'multipart/mixed; boundary=updates'}
            });
        });
        fetchMock.mockResponse('GET', '/destination', () => {
            locationCount++;
            return new Response('done');
        });

        createProcessedHTML([
            '<div id="location-source" hx-multipart:connect="/location-stream" ',
            'hx-config="multipart.reconnectDelay:1ms multipart.reconnectMaxDelay:1ms multipart.reconnectJitter:0"></div>',
            '<div id="location-target"></div>'
        ].join(''));

        assert.isTrue(await waitUntil(() => locationCount >= 1, 500), `HX-Location count: ${locationCount}`);
        assert.isTrue(await waitUntil(() => requestCount >= 2, 500), `stream request count: ${requestCount}`);
        await htmx.swap('', '#location-source', {style: 'delete'});

        assertTextContentIs('#location-target', 'done');
    });

    it('closes hx-multipart:connect when a part triggers hx-multipart:close', async function() {
        let requestCount = 0;
        fetchMock.mockResponse('GET', '/close-stream', () => {
            requestCount++;
            return new Response([
                '--updates\r\n',
                'Content-Type: text/html\r\n',
                'HX-Trigger: done\r\n',
                '\r\n',
                'final update',
                '\r\n--updates--\r\n'
            ].join(''), {
                headers: {'Content-Type': 'multipart/mixed; boundary=updates'}
            });
        });

        let source = createProcessedHTML([
            '<div id="close-source" hx-multipart:connect="/close-stream" hx-multipart:close="done" ',
            'hx-trigger="click" hx-target="#close-target" ',
            'hx-config="multipart.reconnectDelay:1ms multipart.reconnectMaxDelay:1ms multipart.reconnectJitter:0"></div>',
            '<div id="close-target"></div>'
        ].join(''));
        let doneFired = false;
        let closeReason;
        source.addEventListener('done', () => doneFired = true);
        source.addEventListener('htmx:multipart:close', event => closeReason = event.detail.reason);

        source.click();
        assert.isTrue(await waitUntil(() => closeReason != null, 500));
        await htmx.timeout(20);

        assert.isTrue(doneFired);
        assert.equal(closeReason, 'part');
        assert.equal(requestCount, 1);
        assertTextContentIs('#close-target', 'final update');
    });

    it('runs envelope and part actions', async function() {
        let button = createProcessedHTML('<button hx-get="/stream">Go</button><div id="one">one</div><div id="two">two</div>');
        let partTriggered = false;
        let envelopeTriggered = false;
        let actionDetail;
        let afterRequestCount = 0;
        button.addEventListener('partEvent', () => partTriggered = true);
        button.addEventListener('envelopeEvent', () => envelopeTriggered = true);
        button.addEventListener('htmx:before:actions', event => {
            if (event.detail.part) actionDetail = event.detail;
        });
        button.addEventListener('htmx:after:request', () => afterRequestCount++);

        let body = [
            '--updates\r\n',
            'Content-Type: text/html\r\n',
            'HX-Retarget: #one\r\n',
            '\r\n',
            'First',
            '\r\n--updates\r\n',
            'Content-Type: text/html\r\n',
            'HX-Retarget: #two\r\n',
            'HX-Trigger: partEvent\r\n',
            '\r\n',
            'Second',
            '\r\n--updates--\r\n'
        ].join('');

        fetchMock.mockResponse('GET', '/stream', new Response(body, {
            headers: {
                'Content-Type': 'multipart/mixed; boundary=updates',
                'HX-Trigger': 'envelopeEvent'
            }
        }));

        button.click();
        await forRequest();

        assertTextContentIs('#one', 'First');
        assertTextContentIs('#two', 'Second');
        assert.isTrue(partTriggered);
        assert.isTrue(envelopeTriggered);
        assert.equal(actionDetail.ctx.sourceElement, button);
        assert.equal(actionDetail.part.headers.get('HX-Trigger'), 'partEvent');
        assert.equal(afterRequestCount, 1);
        assert.equal(button.textContent, 'Go');
    });

    it('lets listeners take over a part before HTML handling', async function() {
        let button = createProcessedHTML('<button hx-get="/mixed-data">Go</button><div id="result"></div>');
        let json;
        let handledParts = 0;

        button.addEventListener('htmx:multipart:before:part', event => {
            if (event.detail.part.headers.get('Content-Type') !== 'application/json') return;

            event.preventDefault();
            event.detail.waitUntil(event.detail.part.json().then(value => json = value));
        });
        button.addEventListener('htmx:multipart:after:part', () => handledParts++);

        fetchMock.mockResponse('GET', '/mixed-data', new Response([
            '--updates\r\n',
            'Content-Type: application/json\r\n',
            '\r\n',
            '{"unread":3}',
            '\r\n--updates\r\n',
            'Content-Type: text/html\r\n',
            'HX-Target: #result\r\n',
            '\r\n',
            '<p>Done</p>',
            '\r\n--updates--\r\n'
        ].join(''), {
            headers: {'Content-Type': 'multipart/mixed; boundary=updates'}
        }));

        button.click();
        await forRequest();

        assert.deepEqual(json, {unread: 3});
        assertTextContentIs('#result', 'Done');
        assert.equal(button.textContent, 'Go');
        assert.equal(handledParts, 1);
    });

    it('lets another extension take over a part', async function() {
        let received;
        let approvedExt = htmx.__approvedExt;
        htmx.__approvedExt = `${approvedExt},multipart-consumer-test`;
        htmx.registerExtension('multipart-consumer-test', {
            htmx_multipart_before_part(element, detail) {
                if (detail.part.headers.get('Content-Type') !== 'application/x.test') return;

                detail.waitUntil(new Response(detail.part.body).text().then(value => received = value));
                return false;
            }
        });
        htmx.__approvedExt = approvedExt;

        let button = createProcessedHTML('<button hx-get="/extension-data">Go</button><div id="result"></div>');
        fetchMock.mockResponse('GET', '/extension-data', new Response([
            '--updates\r\n',
            'Content-Type: application/x.test\r\n',
            '\r\n',
            'custom data',
            '\r\n--updates\r\n',
            'Content-Type: text/html\r\n',
            'HX-Target: #result\r\n',
            '\r\n',
            'Done',
            '\r\n--updates--\r\n'
        ].join(''), {
            headers: {'Content-Type': 'multipart/mixed; boundary=updates'}
        }));

        button.click();
        await forRequest();

        assert.equal(received, 'custom data');
        assertTextContentIs('#result', 'Done');
        assert.equal(button.textContent, 'Go');
    });

    it('swaps multipart/mixed parts before the response stream closes', async function() {
        let button = createProcessedHTML('<button hx-get="/stream">Go</button><div id="one">one</div><div id="two">two</div>');
        let controller;
        let encoder = new TextEncoder();
        let stream = new ReadableStream({
            start(c) { controller = c; }
        });

        fetchMock.mockResponse('GET', '/stream', new Response(stream, {
            headers: {'Content-Type': 'multipart/mixed; boundary=updates'}
        }));

        button.click();
        await htmx.timeout(0);

        controller.enqueue(encoder.encode([
            '--updates\r\n',
            'Content-Type: text/html\r\n',
            'HX-Retarget: #one\r\n',
            '\r\n',
            'First',
            '\r\n--updates\r\n',
            'Content-Type: text/html\r\n',
            'HX-Retarget: #two\r\n',
            '\r\n'
        ].join('')));

        assert.isTrue(await waitUntil(() => htmx.find('#one').textContent === 'First', 500));
        assertTextContentIs('#two', 'two');

        let requestFinished = false;
        let done = forRequest(500).then(() => requestFinished = true);
        await htmx.timeout(20);
        assert.isFalse(requestFinished);

        controller.enqueue(encoder.encode('Second\r\n--updates--\r\n'));
        controller.close();
        await done;

        assertTextContentIs('#one', 'First');
        assertTextContentIs('#two', 'Second');
    });

    it('reads delayed multipart/parallel bodies before handling them', async function() {
        let button = createProcessedHTML('<button hx-get="/parallel">Go</button><div id="one"></div><div id="two"></div>');
        let encoder = new TextEncoder();
        let stream = new ReadableStream({
            start(controller) {
                controller.enqueue(encoder.encode([
                    '--updates\r\n',
                    'Content-Type: text/html\r\n',
                    'HX-Target: #one\r\n',
                    '\r\n',
                    'Fir'
                ].join('')));
                setTimeout(() => {
                    controller.enqueue(encoder.encode([
                        'st',
                        '\r\n--updates\r\n',
                        'Content-Type: text/html\r\n',
                        'HX-Target: #two\r\n',
                        '\r\n',
                        'Second',
                        '\r\n--updates--\r\n'
                    ].join('')));
                    controller.close();
                }, 20);
            }
        });

        fetchMock.mockResponse('GET', '/parallel', new Response(stream, {
            headers: {'Content-Type': 'multipart/parallel; boundary=updates'}
        }));

        button.click();
        let done = await forRequest(500);

        assert.isNotNull(done, 'parallel request did not finish');
        assertTextContentIs('#one', 'First');
        assertTextContentIs('#two', 'Second');
    });

    it('waits for mixed swaps and overlaps parallel swaps', async function() {
        let response = (type, prefix) => new Response([
            '--updates\r\n',
            'Content-Type: text/html\r\n',
            `HX-Target: #${prefix}-one\r\n`,
            'HX-Swap: innerHTML swap:100ms\r\n',
            '\r\n',
            'First',
            '\r\n--updates\r\n',
            'Content-Type: text/html\r\n',
            `HX-Target: #${prefix}-two\r\n`,
            '\r\n',
            'Second',
            '\r\n--updates--\r\n'
        ].join(''), {
            headers: {'Content-Type': `multipart/${type}; boundary=updates`}
        });

        fetchMock.mockResponse('GET', '/mixed', response('mixed', 'mixed'));
        fetchMock.mockResponse('GET', '/parallel', response('parallel', 'parallel'));
        createProcessedHTML([
            '<button id="mixed" hx-get="/mixed">Mixed</button>',
            '<div id="mixed-one">one</div><div id="mixed-two">two</div>',
            '<button id="parallel" hx-get="/parallel">Parallel</button>',
            '<div id="parallel-one">one</div><div id="parallel-two">two</div>'
        ].join(''));

        let mixedDone = forRequest(500);
        find('#mixed').click();
        await htmx.timeout(20);
        assertTextContentIs('#mixed-one', 'one');
        assertTextContentIs('#mixed-two', 'two');
        assert.isNotNull(await mixedDone, 'mixed request did not finish');
        assertTextContentIs('#mixed-one', 'First');
        assertTextContentIs('#mixed-two', 'Second');

        let parallelDone = forRequest(500);
        find('#parallel').click();
        assert.isTrue(await waitUntil(() => htmx.find('#parallel-two').textContent === 'Second', 500));
        assertTextContentIs('#parallel-one', 'one');
        assert.isNotNull(await parallelDone, 'parallel request did not finish');
        assertTextContentIs('#parallel-one', 'First');
    });

    it('handles the next parallel part while an earlier part settles', async function() {
        let button = createProcessedHTML([
            '<button hx-get="/parallel">Go</button>',
            '<div id="one"><span id="state" data-phase="old">one</span></div>',
            '<div id="two">two</div>'
        ].join(''));
        fetchMock.mockResponse('GET', '/parallel', new Response([
            '--updates\r\n',
            'Content-Type: text/html\r\n',
            'HX-Target: #one\r\n',
            'HX-Swap: innerHTML settle:100ms\r\n',
            '\r\n',
            '<span id="state" data-phase="new">First</span>',
            '\r\n--updates\r\n',
            'Content-Type: text/html\r\n',
            'HX-Target: #two\r\n',
            '\r\n',
            'Second',
            '\r\n--updates--\r\n'
        ].join(''), {
            headers: {'Content-Type': 'multipart/parallel; boundary=updates'}
        }));

        let done = forRequest(500);
        button.click();

        assert.isTrue(await waitUntil(() => htmx.find('#two').textContent === 'Second', 500));
        assertTextContentIs('#state', 'First');
        assert.equal(find('#state').getAttribute('data-phase'), 'old');
        assert.isNotNull(await done, 'parallel request did not finish');
        assert.equal(find('#state').getAttribute('data-phase'), 'new');
    });
});
