describe('hx-browser-indicator extension', function() {

    let extBackup;
    let originalUrl;
    let originalState;

    before(async function() {
        if (typeof navigation === 'undefined') this.skip();
        extBackup = backupExtensions();
        clearExtensions();
        htmx.__approvedExt = '';
        htmx.config.extensions = 'browser-indicator';

        let script = document.createElement('script');
        script.src = '../src/ext/hx-browser-indicator.js';
        await new Promise(resolve => {
            script.onload = resolve;
            document.head.appendChild(script);
        });
    });

    after(function() {
        restoreExtensions(extBackup);
    });

    beforeEach(function() {
        setupTest(this.currentTest);
        originalUrl = window.location.href;
        originalState = history.state;
        // Fresh entry: the lazy stamp only runs when history.state has no htmx marker.
        history.replaceState(null, '', location.pathname + location.search);
    });

    afterEach(async function() {
        if (navigation.transition) {
            let finished = navigation.transition.finished.catch(() => {});
            window.stop();
            await finished;
        }
        cleanupTest();
        history.replaceState(originalState, '', originalUrl);
    });

    function trackAbort(urlPart) {
        let aborted = false;
        let onBefore = (event) => {
            let action = event.detail?.ctx?.request?.action || '';
            if (!action.includes(urlPart)) return;
            event.detail.ctx.request.signal.addEventListener('abort', () => { aborted = true; });
        };
        document.addEventListener('htmx:before:request', onBefore);
        return {
            get aborted() { return aborted; },
            stop() { document.removeEventListener('htmx:before:request', onBefore); }
        };
    }

    async function waitForIndicator() {
        let start = Date.now();
        while (!navigation.transition) {
            if (Date.now() - start > 500) throw new Error('browser indicator navigation did not start');
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    it('does not abort an in-flight indicator request when another request swaps', async function() {
        let slow = mockSequentialResponses('GET', '/indicator-slow', '<span id="slow-out">slow</span>');
        mockResponse('GET', '/indicator-fast', '<span id="fast-out">fast</span>');
        let slowReq = trackAbort('/indicator-slow');

        try {
            createProcessedHTML(
                '<button id="slow" hx-get="/indicator-slow" hx-target="#a" hx-browser-indicator="true">slow</button>' +
                '<button id="fast" hx-get="/indicator-fast" hx-target="#b">fast</button>' +
                '<div id="a">a</div><div id="b">b</div>'
            );

            find('#slow').click();
            await waitForIndicator();

            find('#fast').click();
            await forRequest();

            assert.isFalse(slowReq.aborted, 'slow request was aborted by the fast swap');
            assert.equal(find('#b').textContent, 'fast');
            assert.equal(find('#a').textContent, 'a');

            await slow.next();
            await forRequest();

            assert.isFalse(slowReq.aborted, 'slow request was aborted before it could swap');
            assert.equal(find('#a').textContent, 'slow');
            assert.isTrue(history.state?.htmx === true, 'entry is stamped after the indicator navigation settles');
        } finally {
            slowReq.stop();
            if (slow.pendingCount > 0) await slow.next();
        }
    });

    it('stamps the outgoing entry when a push happens during an indicator request', async function() {
        let slow = mockSequentialResponses('GET', '/indicator-slow-push', '<span id="slow-out">slow</span>');
        mockResponse('GET', '/indicator-fast-push', '<span id="fast-out">fast</span>');
        let slowReq = trackAbort('/indicator-slow-push');
        let outgoing = null;
        let origPush = history.pushState;
        history.pushState = function(state, title, url) {
            outgoing = history.state;
            return origPush.apply(this, arguments);
        };

        try {
            createProcessedHTML(
                '<button id="slow" hx-get="/indicator-slow-push" hx-target="#a" hx-browser-indicator="true">slow</button>' +
                '<button id="fast" hx-get="/indicator-fast-push" hx-target="#b" hx-push-url="/indicator-pushed">fast</button>' +
                '<div id="a">a</div><div id="b">b</div>'
            );

            find('#slow').click();
            await waitForIndicator();

            find('#fast').click();
            await forRequest();

            assert.isFalse(slowReq.aborted, 'slow request was aborted by the history update');
            assert.equal(find('#b').textContent, 'fast');
            assert.isTrue(outgoing?.htmx === true, 'outgoing entry was not stamped before push');
            assert.include(location.pathname, '/indicator-pushed');

            await slow.next();
            await forRequest();
            assert.isFalse(slowReq.aborted, 'slow request was aborted before it could swap');
            assert.equal(find('#a').textContent, 'slow');
        } finally {
            history.pushState = origPush;
            slowReq.stop();
            if (slow.pendingCount > 0) await slow.next();
        }
    });

});
