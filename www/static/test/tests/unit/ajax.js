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

    it('ajax rejects when source invalid and no target set', async function() {
        mockResponse('GET', '/test', 'foo!');
        createProcessedHTML('<div id="d1"></div>');
        try {
            await htmx.ajax('GET', '/test', {
                source: '#d2'
            });
            assert.fail('Should have rejected');
        } catch (e) {
            assert.include(e.message, 'Target not found');
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

    it('ajax works with no context (defaults to body)', async function() {
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

    it('ajax with event context', async function() {
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
        
        div.addEventListener('htmx:before:request', () => {
            beforeRequestFired = true;
        });
        
        div.addEventListener('htmx:after:request', () => {
            afterRequestFired = true;
        });
        
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
});
