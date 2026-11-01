describe('ajax() unit Tests', function() {
    
    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    it('ajax works with element target', async function() {
        mockResponse('GET', '/test', 'foo!');
        const div = createProcessedHTML('<div></div>');
        await htmx.ajax('GET', '/test', {target: div, swap: 'innerHTML'});
        assert.equal(div.innerHTML, 'foo!');
    });

    it('ajax works with selector target', async function() {
        mockResponse('GET', '/test', 'foo!');
        const div = createProcessedHTML('<div id="d1"></div>');
        await htmx.ajax('GET', '/test', {target: '#d1', swap: 'innerHTML'});
        assert.equal(div.innerHTML, 'foo!');
    });

    it('ajax rejects when target selector invalid', async function() {
        mockResponse('GET', '/test', 'foo!');
        createProcessedHTML('<div id="d1"></div>');
        try {
            await htmx.ajax('GET', '/test', '#d2');
            assert.fail('Should have rejected');
        } catch (e) {
            assert.include(e.message, 'Target not found');
        }
    });

    it('ajax rejects when target invalid even if source set', async function() {
        mockResponse('GET', '/test', 'foo!');
        const div = createProcessedHTML('<div id="d1"></div>');
        try {
            await htmx.ajax('GET', '/test', {
                source: div,
                target: '#d2'
            });
            assert.fail('Should have rejected');
        } catch (e) {
            assert.include(e.message, 'Target not found');
        }
    });

    it('ajax rejects when source selector invalid', async function() {
        mockResponse('GET', '/test', 'foo!');
        createProcessedHTML('<div id="d1"></div>');
        try {
            await htmx.ajax('GET', '/test', {
                source: '#d2'
            });
            assert.fail('Should have rejected');
        } catch (e) {
            assert.include(e.message, 'Source not found');
        }
    });

    it('ajax targets source if target not set', async function() {
        mockResponse('GET', '/test', 'foo!');
        const div = createProcessedHTML('<div id="d1"></div>');
        await htmx.ajax('GET', '/test', {
            source: div,
            swap: 'innerHTML'
        });
        assert.equal(div.innerHTML, 'foo!');
    });

    it('ajax works with swap option', async function() {
        mockResponse('GET', '/test', '<p class="test">foo!</p>');
        const container = createProcessedHTML('<div><div id="target"></div></div>');
        await htmx.ajax('GET', '/test', {
            target: '#target',
            swap: 'outerHTML'
        });
        assert.equal(container.innerHTML, '<p class="test">foo!</p>');
    });

    it('ajax works with select option', async function() {
        mockResponse('GET', '/test', '<div id="d1">foo</div><div id="d2">bar</div>');
        const div = createProcessedHTML('<div id="target"></div>');
        await htmx.ajax('GET', '/test', {
            target: '#target',
            swap: 'innerHTML',
            select: '#d2'
        });
        assert.include(div.innerHTML, 'bar');
        assert.notInclude(div.innerHTML, 'foo');
    });

    it('ajax returns a promise', async function() {
        mockResponse('GET', '/test', 'foo!');
        const div = createProcessedHTML('<div id="d1"></div>');
        const promise = htmx.ajax('GET', '/test', {target: '#d1', swap: 'innerHTML'});
        assert.instanceOf(promise, Promise);
        await promise;
        assert.equal(div.innerHTML, 'foo!');
    });

    it('ajax can pass values', async function() {
        mockResponse('POST', '/test', 'Clicked!');
        const div = createProcessedHTML('<div id="d1"></div>');
        await htmx.ajax('POST', '/test', {
            target: '#d1',
            swap: 'innerHTML',
            values: { i1: 'test' }
        });
        assert.equal(div.innerHTML, 'Clicked!');
        const lastCall = lastFetch();
        const params = new URLSearchParams(lastCall.request.body);
        assert.equal(params.get('i1'), 'test');
    });

    it('ajax can pass custom headers', async function() {
        mockResponse('POST', '/test', 'Clicked!');
        const div = createProcessedHTML('<div id="d1"></div>');
        await htmx.ajax('POST', '/test', {
            target: '#d1',
            swap: 'innerHTML',
            headers: {
                'X-Custom': 'test-value'
            },
            values: { i1: 'test' }
        });
        assert.equal(div.innerHTML, 'Clicked!');
        const lastCall = lastFetch();
        assert.equal(lastCall.request.headers['X-Custom'], 'test-value');
    });

    it('ajax collects form data from source element', async function() {
        mockResponse('POST', '/test', 'Submitted!');
        createProcessedHTML('<form id="myForm"><input name="field1" value="value1"/></form><div id="result"></div>');
        const form = find('#myForm');
        const div = find('#result');
        await htmx.ajax('POST', '/test', {
            source: form,
            target: '#result',
            swap: 'innerHTML'
        });
        assert.equal(div.innerHTML, 'Submitted!');
        const lastCall = lastFetch();
        const params = new URLSearchParams(lastCall.request.body);
        assert.equal(params.get('field1'), 'value1');
    });

    it('ajax values override form data', async function() {
        mockResponse('POST', '/test', 'Submitted!');
        createProcessedHTML('<form id="myForm"><input name="field1" value="original"/></form><div id="result"></div>');
        const form = find('#myForm');
        const div = find('#result');
        await htmx.ajax('POST', '/test', {
            source: form,
            target: '#result',
            swap: 'innerHTML',
            values: { field1: 'override' }
        });
        assert.equal(div.innerHTML, 'Submitted!');
        const lastCall = lastFetch();
        const params = new URLSearchParams(lastCall.request.body);
        assert.equal(params.get('field1'), 'override');
    });

    it('ajax works with GET and query parameters', async function() {
        mockResponse('GET', /\/test\?.*/, 'Got it!');
        const div = createProcessedHTML('<div id="d1"></div>');
        await htmx.ajax('GET', '/test', {
            target: '#d1',
            swap: 'innerHTML',
            values: { param1: 'value1', param2: 'value2' }
        });
        assert.equal(div.innerHTML, 'Got it!');
        const lastCall = lastFetch();
        assert.include(lastCall.url, 'param1=value1');
        assert.include(lastCall.url, 'param2=value2');
    });

    it('ajax works with optimistic UI', async function() {
        mockResponse('POST', '/test', 'final!');
        createProcessedHTML('<div id="loading">Loading...</div><div id="target">initial</div>');
        const div = find('#target');
        
        // Just verify optimistic option doesn't break the request
        await htmx.ajax('POST', '/test', {
            target: '#target',
            swap: 'innerHTML',
            optimistic: '#loading'
        });
        
        assert.equal(div.innerHTML, 'final!');
    });

    it('ajax respects transition option', async function() {
        mockResponse('GET', '/test', 'content!');
        const div = createProcessedHTML('<div id="d1"></div>');
        await htmx.ajax('GET', '/test', {
            target: '#d1',
            swap: 'innerHTML',
            transition: false
        });
        assert.equal(div.innerHTML, 'content!');
    });

    it('ajax works with no options (defaults to body)', async function() {
        this.skip() // We can't test this as it will replace the body and nuke the test UI lol
        return;
        mockResponse('GET', '/test', '<div id="ajax-result">body content</div>');
        await htmx.ajax('GET', '/test', {swap: 'beforeend'});
        // Verify content was added to body
        const result = document.getElementById('ajax-result');
        assert.isNotNull(result);
        assert.equal(result.textContent, 'body content');
        // Clean up
        result.remove();
    });

    it('ajax case insensitive verb', async function() {
        mockResponse('POST', '/test', 'posted!');
        const div = createProcessedHTML('<div id="d1"></div>');
        await htmx.ajax('post', '/test', {
            target: '#d1',
            swap: 'innerHTML',
            values: {test: 'value'}
        });
        assert.equal(div.innerHTML, 'posted!');
    });

    it('ajax uppercase verb', async function() {
        mockResponse('DELETE', '/test', 'deleted!');
        const div = createProcessedHTML('<div id="d1"></div>');
        await htmx.ajax('DELETE', '/test', {target: '#d1', swap: 'innerHTML'});
        assert.equal(div.innerHTML, 'deleted!');
    });

    it('ajax with event option', async function() {
        mockResponse('POST', '/test', 'clicked!');
        createProcessedHTML('<button id="btn">Click</button><div id="result"></div>');
        const div = find('#result');
        const clickEvent = new MouseEvent('click', { bubbles: true });
        
        await htmx.ajax('POST', '/test', {
            target: '#result',
            swap: 'innerHTML',
            event: clickEvent
        });
        assert.equal(div.innerHTML, 'clicked!');
    });

    it('ajax triggers htmx events', async function() {
        mockResponse('GET', '/test', 'content!');
        const div = createProcessedHTML('<div id="d1"></div>');
        
        let beforeRequestFired = false;
        let afterRequestFired = false;
        
        document.addEventListener('htmx:before:request', () => { beforeRequestFired = true; }, {once: true});
        document.addEventListener('htmx:after:request', () => { afterRequestFired = true; }, {once: true});
        
        await htmx.ajax('GET', '/test', {target: div, swap: 'innerHTML'});
        
        assert.isTrue(beforeRequestFired);
        assert.isTrue(afterRequestFired);
    });

    it('ajax with multiple values', async function() {
        mockResponse('POST', '/test', 'OK');
        const div = createProcessedHTML('<div id="d1"></div>');
        await htmx.ajax('POST', '/test', {
            target: '#d1',
            swap: 'innerHTML',
            values: {
                field1: 'value1',
                field2: 'value2',
                field3: 'value3'
            }
        });
        const lastCall = lastFetch();
        const params = new URLSearchParams(lastCall.request.body);
        assert.equal(params.get('field1'), 'value1');
        assert.equal(params.get('field2'), 'value2');
        assert.equal(params.get('field3'), 'value3');
    });

    it('ajax with swap innerHTML', async function() {
        mockResponse('GET', '/test', '<span>inner</span>');
        const div = createProcessedHTML('<div id="target"><p>old</p></div>');
        await htmx.ajax('GET', '/test', {
            target: '#target',
            swap: 'innerHTML'
        });
        assert.equal(div.innerHTML, '<span>inner</span>');
    });

    it('ajax with swap beforeend', async function() {
        mockResponse('GET', '/test', '<span>new</span>');
        const div = createProcessedHTML('<div id="target"><p>old</p></div>');
        await htmx.ajax('GET', '/test', {
            target: '#target',
            swap: 'beforeend'
        });
        assert.include(div.innerHTML, '<p>old</p>');
        assert.include(div.innerHTML, '<span>new</span>');
    });

    it('ajax request can be aborted via htmx:abort event', async function() {
        const seq = mockSequentialResponses('GET', '/test', 'should not appear');
        const div = createProcessedHTML('<div id="source"></div>');
        
        let errorFired = false;
        div.addEventListener('htmx:error', () => {
            errorFired = true;
        });
        
        const promise = htmx.ajax('GET', '/test', {
            source: '#source',
            target: '#source',
            swap: 'innerHTML'
        });
        
        // Wait for request to be issued, then abort before releasing response
        await htmx.timeout(1);
        htmx.trigger('#source', 'htmx:abort');
        
        // Release the response (should be ignored since aborted)
        seq.next();
        await promise;
        
        // Content should not have been swapped
        assert.equal(div.innerHTML, '');
        assert.isFalse(errorFired);
    });

    it('does not push history when target is removed before response', async function() {
        const seq = mockSequentialResponses('GET', '/nav', '<p>page</p>');
        const originalUrl = window.location.href;
        createProcessedHTML('<div id="target" hx-get="/nav" hx-push-url="true">click</div>');
        const target = find('#target');
        target.click();
        await htmx.timeout(1);
        target.remove();
        await seq.next();
        await htmx.timeout(10);
        assert.equal(window.location.href, originalUrl);
    });

    it('does not swap oob content when target is removed before response', async function() {
        const seq = mockSequentialResponses('GET', '/test',
            "<div>main</div><div id='oob' hx-swap-oob='true'>oob-updated</div>");
        createProcessedHTML("<div id='target'>original</div><div id='oob'>oob-original</div>");
        const target = find('#target');
        const promise = htmx.ajax('GET', '/test', { target, swap: 'innerHTML' });
        await htmx.timeout(1);
        target.remove();
        await seq.next();
        await promise;
        assert.equal(find('#oob').innerText, 'oob-original');
    });

    it('fires htmx:finally:request even when target is removed', async function() {
        const seq = mockSequentialResponses('GET', '/test', 'content');
        const target = createProcessedHTML('<div id="target"></div>');
        let finallyCalled = false;
        document.addEventListener('htmx:finally:request', () => { finallyCalled = true; }, { once: true });
        const promise = htmx.ajax('GET', '/test', { target, swap: 'innerHTML' });
        await htmx.timeout(1);
        target.remove();
        await seq.next();
        await promise;
        assert.isTrue(finallyCalled);
    });

    it('concurrent requests: only the one whose target is still connected swaps', async function() {
        const seq1 = mockSequentialResponses('GET', '/a', '<p>from-a</p>');
        const seq2 = mockSequentialResponses('GET', '/b', '<p>from-b</p>');
        createProcessedHTML('<div id="t1">orig1</div><div id="t2">orig2</div>');
        const t1 = find('#t1');
        const t2 = find('#t2');
        const p1 = htmx.ajax('GET', '/a', { target: t1, swap: 'innerHTML' });
        const p2 = htmx.ajax('GET', '/b', { target: t2, swap: 'innerHTML' });
        await htmx.timeout(1);
        t1.remove();
        await seq1.next();
        await seq2.next();
        await Promise.all([p1, p2]);
        assert.equal(t1.innerHTML, 'orig1');
        assert.include(t2.innerHTML, 'from-b');
    });

    it('ignores a response when its target is removed while the request is in flight', async function() {
        const seq = mockSequentialResponses('GET', '/test', '<title>Old page</title><p>old</p>');
        const target = createProcessedHTML('<div id="target"></div>');
        document.title = 'Current page';

        const promise = htmx.ajax('GET', '/test', {
            target,
            swap: 'innerHTML'
        });

        await htmx.timeout(1);
        target.remove();
        await seq.next();
        await promise;

        assert.equal(document.title, 'Current page');
        assert.equal(target.innerHTML, '');
    });

    it('sets full URL for cross-origin GET requests with query params', async function() {
        let capturedAction;
        document.addEventListener('htmx:before:request', function handler(evt) {
            capturedAction = evt.detail.ctx.request.action;
            evt.preventDefault();
            document.removeEventListener('htmx:before:request', handler);
        });
        createProcessedHTML('<button id="btn" hx-get="https://other-domain.com/api" hx-vals=\'{"foo":"bar"}\'>Click</button>');
        find('#btn').click();
        await htmx.timeout(50);
        assert.isTrue(capturedAction.startsWith('https://other-domain.com/api'));
        assert.include(capturedAction, 'foo=bar');
    });

    it('ajax does not collect inputs from target element', async function() {
        mockResponse('POST', '/test', 'ok');
        createProcessedHTML('<div id="target"><input name="secret" value="should-not-send"/></div>');
        await htmx.ajax('POST', '/test', {
            target: '#target',
            swap: 'innerHTML'
        });
        const params = new URLSearchParams(lastFetch().request.body);
        assert.isNull(params.get('secret'));
    });

    it('ajax explicit target overrides hx-target on source element', async function() {
        mockResponse('GET', '/test', 'targeted!');
        createProcessedHTML('<div id="source" hx-target="#other"></div><div id="other"></div><div id="explicit"></div>');
        const explicit = find('#explicit');
        const other = find('#other');
        await htmx.ajax('GET', '/test', {
            source: '#source',
            target: '#explicit',
            swap: 'innerHTML'
        });
        assert.equal(explicit.innerHTML, 'targeted!');
        assert.equal(other.innerHTML, '');
    });

    it('triggers htmx:error when __createRequestContext throws', async function() {
        let errorTriggered = false;
        let caughtError = null;
        let btn = createProcessedHTML('<button hx-get="/test">Click</button>');
        btn.addEventListener('htmx:error', (e) => {
            errorTriggered = true;
            caughtError = e.detail.error;
        }, { once: true });
        let original = htmx.__createRequestContext;
        htmx.__createRequestContext = function() { throw new Error('context creation failed'); };
        try {
            btn.click();
            await htmx.timeout(50);
            assert.isTrue(errorTriggered, 'htmx:error should have been triggered');
            assert.equal(caughtError.message, 'context creation failed');
        } finally {
            htmx.__createRequestContext = original;
        }
    });
});
