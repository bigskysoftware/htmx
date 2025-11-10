describe('__shouldBoost() unit tests', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    // Anchor tag tests
    describe('Anchor tags', function() {

        it('should boost same-origin link with no target', function() {
            const link = createDisconnectedHTML('<a href="/test">Link</a>');
            const result = htmx.__shouldBoost(link);
            assert.isTrue(result);
        });

        it('should boost same-origin link with target="_self"', function() {
            const link = createDisconnectedHTML('<a href="/test" target="_self">Link</a>');
            const result = htmx.__shouldBoost(link);
            assert.isTrue(result);
        });

        it('should boost relative URLs', function() {
            const link = createDisconnectedHTML('<a href="test.html">Link</a>');
            const result = htmx.__shouldBoost(link);
            assert.isTrue(result);
        });

        it('should boost absolute same-origin URLs', function() {
            const origin = window.location.origin;
            const link = createDisconnectedHTML(`<a href="${origin}/test">Link</a>`);
            const result = htmx.__shouldBoost(link);
            assert.isTrue(result);
        });

        it('should not boost hash-only links', function() {
            const link = createDisconnectedHTML('<a href="#section">Link</a>');
            const result = htmx.__shouldBoost(link);
            assert.isFalse(result);
        });

        it('should not boost links with target="_blank"', function() {
            const link = createDisconnectedHTML('<a href="/test" target="_blank">Link</a>');
            const result = htmx.__shouldBoost(link);
            assert.isUndefined(result);
        });

        it('should not boost links with target="_parent"', function() {
            const link = createDisconnectedHTML('<a href="/test" target="_parent">Link</a>');
            const result = htmx.__shouldBoost(link);
            assert.isUndefined(result);
        });

        it('should not boost links with target="_top"', function() {
            const link = createDisconnectedHTML('<a href="/test" target="_top">Link</a>');
            const result = htmx.__shouldBoost(link);
            assert.isUndefined(result);
        });

        it('should not boost links with named target', function() {
            const link = createDisconnectedHTML('<a href="/test" target="myframe">Link</a>');
            const result = htmx.__shouldBoost(link);
            assert.isUndefined(result);
        });

        it('should not boost cross-origin links', function() {
            const link = createDisconnectedHTML('<a href="https://example.com/test">Link</a>');
            const result = htmx.__shouldBoost(link);
            assert.isFalse(result);
        });

        it('should not boost protocol-relative cross-origin links', function() {
            const link = createDisconnectedHTML('<a href="//example.com/test">Link</a>');
            const result = htmx.__shouldBoost(link);
            assert.isFalse(result);
        });

        it('should boost links with hash after path', function() {
            const link = createDisconnectedHTML('<a href="/test#section">Link</a>');
            const result = htmx.__shouldBoost(link);
            assert.isTrue(result);
        });

        it('should not boost javascript: URLs', function() {
            const link = createDisconnectedHTML('<a href="javascript:void(0)">Link</a>');
            // javascript: URLs will likely fail the same-origin check
            const result = htmx.__shouldBoost(link);
            assert.isFalse(result);
        });
    });

    // Form tag tests
    describe('Form tags', function() {

        it('should boost same-origin form with no action', function() {
            const form = createDisconnectedHTML('<form></form>');
            const result = htmx.__shouldBoost(form);
            assert.isTrue(result);
        });

        it('should boost same-origin form with relative action', function() {
            const form = createDisconnectedHTML('<form action="/submit"></form>');
            const result = htmx.__shouldBoost(form);
            assert.isTrue(result);
        });

        it('should boost form with absolute same-origin action', function() {
            const origin = window.location.origin;
            const form = createDisconnectedHTML(`<form action="${origin}/submit"></form>`);
            const result = htmx.__shouldBoost(form);
            assert.isTrue(result);
        });

        it('should boost form with method="post"', function() {
            const form = createDisconnectedHTML('<form method="post" action="/submit"></form>');
            const result = htmx.__shouldBoost(form);
            assert.isTrue(result);
        });

        it('should boost form with method="get"', function() {
            const form = createDisconnectedHTML('<form method="get" action="/search"></form>');
            const result = htmx.__shouldBoost(form);
            assert.isTrue(result);
        });

        it('should not boost form with method="dialog"', function() {
            const form = createDisconnectedHTML('<form method="dialog"></form>');
            const result = htmx.__shouldBoost(form);
            assert.isFalse(result);
        });

        it('should not boost form with cross-origin action', function() {
            const form = createDisconnectedHTML('<form action="https://example.com/submit"></form>');
            const result = htmx.__shouldBoost(form);
            assert.isFalse(result);
        });

        it('should not boost form with protocol-relative cross-origin action', function() {
            const form = createDisconnectedHTML('<form action="//example.com/submit"></form>');
            const result = htmx.__shouldBoost(form);
            assert.isFalse(result);
        });
    });

    // Other element tests
    describe('Other elements', function() {

        it('should return undefined for non-anchor, non-form elements', function() {
            const div = createDisconnectedHTML('<div></div>');
            const result = htmx.__shouldBoost(div);
            assert.isUndefined(result);
        });

        it('should return undefined for button elements', function() {
            const button = createDisconnectedHTML('<button></button>');
            const result = htmx.__shouldBoost(button);
            assert.isUndefined(result);
        });

        it('should return undefined for input elements', function() {
            const input = createDisconnectedHTML('<input type="submit">');
            const result = htmx.__shouldBoost(input);
            assert.isUndefined(result);
        });
    });
});
