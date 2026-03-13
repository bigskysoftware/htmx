describe('ETag Tests', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    it('does not send If-None-Match (browser handles that)', async function() {
        mockResponse('GET', '/test', 'Response 1', {
            headers: { 'Etag': '"abc123"' }
        });

        const button = createProcessedHTML('<button hx-get="/test" hx-config=\'etag:true\'>Load</button>');
        button.click();
        await forRequest();

        mockResponse('GET', '/test', 'Response 2', {
            headers: { 'Etag': '"abc123"' }
        });

        button.click();
        await forRequest();

        const calls = fetchMock.getCalls();
        assert.isUndefined(calls[0].request.headers['If-None-Match']);
        assert.isUndefined(calls[1].request.headers['If-None-Match']);
    });

    it('skips swap when ETag matches', async function() {
        mockResponse('GET', '/test', '<span>Content v1</span>', { headers: { 'Etag': '"abc123"' } });
        const div = createProcessedHTML('<div hx-get="/test" hx-config=\'etag:true\'>Load</div>');
        div.click();
        await forRequest();
        assert.include(div.innerHTML, 'Content v1');

        mockResponse('GET', '/test', '<span>Content v2</span>', { headers: { 'Etag': '"abc123"' } });
        div.click();
        await forRequest();
        
        // Should still have v1 because ETag matched and swap was skipped
        assert.include(div.innerHTML, 'Content v1');
        assert.notInclude(div.innerHTML, 'Content v2');
    });

    it('swaps when ETag changes', async function() {
        mockResponse('GET', '/test', '<span>Content v1</span>', { headers: { 'Etag': '"abc123"' } });
        const div = createProcessedHTML('<div hx-get="/test" hx-config=\'etag:true\'>Load</div>');
        div.click();
        await forRequest();
        assert.include(div.innerHTML, 'Content v1');

        mockResponse('GET', '/test', '<span>Content v2</span>', { headers: { 'Etag': '"def456"' } });
        div.click();
        await forRequest();
        
        // Should have v2 because ETag changed
        assert.include(div.innerHTML, 'Content v2');
        assert.notInclude(div.innerHTML, 'Content v1');
    });

    it('updates stored ETag when new ETag received', async function() {
        mockResponse('GET', '/test', '<span>v1</span>', { headers: { 'Etag': '"etag1"' } });
        const div = createProcessedHTML('<div hx-get="/test" hx-config=\'etag:true\'>Load</div>');
        div.click();
        await forRequest();

        mockResponse('GET', '/test', '<span>v2</span>', { headers: { 'Etag': '"etag2"' } });
        div.click();
        await forRequest();

        // Third request with etag2 should skip swap
        mockResponse('GET', '/test', '<span>v3</span>', { headers: { 'Etag': '"etag2"' } });
        div.click();
        await forRequest();

        assert.include(div.innerHTML, 'v2');
        assert.notInclude(div.innerHTML, 'v3');
    });

    it('does not track ETags without hx-config="etag:true"', async function() {
        mockResponse('GET', '/test', '<span>Content v1</span>', { headers: { 'Etag': '"abc123"' } });
        const div = createProcessedHTML('<div hx-get="/test">Load</div>');
        div.click();
        await forRequest();

        mockResponse('GET', '/test', '<span>Content v2</span>', { headers: { 'Etag': '"abc123"' } });
        div.click();
        await forRequest();
        
        // Should swap even though ETag is same (tracking disabled)
        assert.include(div.innerHTML, 'Content v2');
    });

    it('fires htmx:etag:match event when ETag matches', async function() {
        mockResponse('GET', '/test', '<span>Content</span>', { headers: { 'Etag': '"abc123"' } });
        const div = createProcessedHTML('<div hx-get="/test" hx-config=\'etag:true\'>Load</div>');

        let eventFired = false;
        div.addEventListener('htmx:etag:match', () => { eventFired = true; });

        div.click();
        await forRequest();

        div.click();
        await forRequest();

        assert.isTrue(eventFired);
    });

    it('allows preventDefault on htmx:etag:match to force swap', async function() {
        mockResponse('GET', '/test', '<span>Content v1</span>', { headers: { 'Etag': '"abc123"' } });
        const div = createProcessedHTML('<div hx-get="/test" hx-config=\'etag:true\'>Load</div>');

        div.addEventListener('htmx:etag:match', (e) => { e.preventDefault(); });

        div.click();
        await forRequest();

        mockResponse('GET', '/test', '<span>Content v2</span>', { headers: { 'Etag': '"abc123"' } });
        div.click();
        await forRequest();
        
        // Should swap even though ETag matched (event prevented)
        assert.include(div.innerHTML, 'Content v2');
    });

    it('supports initial ETag via hx-config', async function() {
        mockResponse('GET', '/test', '<span>Content</span>', { headers: { 'Etag': 'initial-etag' } });
        const div = createProcessedHTML('<div hx-get="/test" hx-config=\'etag:"initial-etag"\'>Load</div>');

        div.click();
        await forRequest();

        // Should still have original content because ETag matched
        assert.equal(div.innerHTML, 'Load');
    });

    it('swaps when no ETag header in response', async function() {
        mockResponse('GET', '/test', '<span>Content v1</span>', { headers: { 'Etag': '"abc123"' } });
        const div = createProcessedHTML('<div hx-get="/test" hx-config=\'etag:true\'>Load</div>');
        div.click();
        await forRequest();

        mockResponse('GET', '/test', '<span>Content v2</span>', {});
        div.click();
        await forRequest();
        
        // Should swap because no ETag to compare
        assert.include(div.innerHTML, 'Content v2');
    });

    it('stores ETag on source element', async function() {
        mockResponse('GET', '/test', '<span>Content</span>', { headers: { 'Etag': '"abc123"' } });
        const div = createProcessedHTML('<div hx-get="/test" hx-config=\'etag:true\'>Load</div>');
        div.click();
        await forRequest();

        assert.equal(div._htmx.etag, '"abc123"');
    });

});
