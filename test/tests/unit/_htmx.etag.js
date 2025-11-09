describe('ETag Tests', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    it('stores ETag from response header on element', async function() {
        mockResponse('GET', '/test', 'Response 1', {
            headers: { 'Etag': '"abc123"' }
        });

        const button = createProcessedHTML('<button hx-get="/test">Load</button>');
        button.click();
        await forRequest();

        assert.equal(button._htmx.etag, '"abc123"');
    });

    it('sends If-None-Match header on subsequent request with stored ETag', async function() {
        mockResponse('GET', '/test', 'Response 1', {
            headers: { 'Etag': '"abc123"' }
        });

        const button = createProcessedHTML('<button hx-get="/test">Load</button>');

        // First request
        button.click();
        await forRequest();

        // Mock second request
        mockResponse('GET', '/test', 'Response 2', {
            headers: { 'Etag': '"def456"' }
        });

        // Second request
        button.click();
        await forRequest();

        // Check that the second request included If-None-Match header
        const calls = fetchMock.getCalls();
        const secondCall = calls[1];
        assert.equal(secondCall.request.headers['If-none-match'], '"abc123"');
    });

    it('updates stored ETag when new ETag received', async function() {

        mockResponse('GET', '/test1', 'Response 1', {
            headers: { 'Etag': '"abc123"' }
        });
        mockResponse('GET', '/test2', 'Response 2', {
            headers: { 'Etag': '"def456"' }
        });

        const div = createProcessedHTML('<div hx-get="/test1">Load</div>');

        // First request
        div.click();
        await forRequest();
        assert.equal(div._htmx.etag, '"abc123"');


        // Second request
        div.setAttribute("hx-get", "/test2")
        div.click();
        await forRequest();

        // ETag should be updated
        assert.equal(div._htmx.etag, '"def456"');
    });


});
