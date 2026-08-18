describe('__executeJavaScript', function() {

    it('returns the evaluated value by default', function() {
        let elt = document.createElement('div');
        htmx.__executeJavaScript(elt, { value: 41 }, 'value + 1', true, false).should.equal(42);
    });

    it('returns a reusable function when compile is true', function() {
        let elt = document.createElement('div');
        let run = htmx.__executeJavaScript(elt, { value: 41 }, 'value + 1', true, false, true);
        assert.isFunction(run);
        run().should.equal(42);
        run().should.equal(42);
    });

    it('applies nonce to inline scripts when config.inlineScriptNonce is set', async function () {
        mockResponse('GET', '/test', '<div id="result"><script id="test-script">window.nonceTestRan = true;</script></div>');
        htmx.config.inlineScriptNonce = 'test-nonce-123';
        try {
            createProcessedHTML('<button id="btn" hx-get="/test" hx-target="#target">Click</button><div id="target"></div>');
            find('#btn').click();
            await forRequest();
            await htmx.timeout(10);
            let script = find('#test-script');
            assert.equal(script.nonce, 'test-nonce-123');
        } finally {
            htmx.config.inlineScriptNonce = null;
        }
    });

});
