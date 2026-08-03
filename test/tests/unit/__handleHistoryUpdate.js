describe('__handleHistoryUpdate unit tests', function() {

    let originalUrl
    let originalState

    beforeEach(function() {
        setupTest();
        // Save current URL and state
        originalUrl = window.location.href
        originalState = history.state
    });

    afterEach(function() {
        cleanupTest();
        // Restore original URL and state
        history.replaceState(originalState, '', originalUrl)
    });

    it('does nothing when push and replace are false', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = {
            sourceElement: div,
            push: 'false',
            replace: 'false',
            response: { headers: new Headers() },
            request: { action: '/test' }
        }

        htmx.__handleHistoryUpdate(ctx)

        assert.equal(window.location.href, originalUrl)
    })

    it('pushes URL when push is set to true', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = {
            sourceElement: div,
            push: 'true',
            response: { headers: new Headers() },
            request: { action: '/test-path' }
        }

        htmx.__handleHistoryUpdate(ctx)

        assert.include(window.location.href, '/test-path')
    })

    it('replaces URL when replace is set to true', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = {
            sourceElement: div,
            replace: 'true',
            response: { headers: new Headers() },
            request: { action: '/replace-path' }
        }

        htmx.__handleHistoryUpdate(ctx)

        assert.include(window.location.href, '/replace-path')
    })

    it('pushes specific URL when push is set to path', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = {
            sourceElement: div,
            push: '/custom-path',
            response: { headers: new Headers() },
            request: { action: '/test' }
        }

        htmx.__handleHistoryUpdate(ctx)

        assert.include(window.location.href, '/custom-path')
    })

    it('pushes redirected URL when push is true and response has raw url', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = {
            sourceElement: div,
            push: 'true',
            response: { 
                headers: new Headers(),
                raw: { url: 'http://localhost/redirected-path?foo=bar' }
            },
            request: { action: '/test' }
        }

        htmx.__handleHistoryUpdate(ctx)

        assert.include(window.location.href, '/redirected-path?foo=bar')
    })

    it('restores history via popstate event when Navigation API unavailable', async function() {
        let savedNavigation = window.navigation;
        delete window.navigation;
        htmx.__initHistoryHandling();
        try {
            playground().innerHTML = '<main hx-history-elt><p>current</p></main>';
            htmx.process(playground());
            history.replaceState({ htmx: true }, '', '/popstate-test-a');
            htmx.__pushUrlIntoHistory('/popstate-test-b');
            playground().innerHTML = '<main hx-history-elt><p>page B</p></main>';
            mockResponse('GET', '/popstate-test-a', '<html><body><main hx-history-elt><p>restored via popstate</p></main></body></html>');
            history.back();
            await forRequest();
            playground().textContent.should.include('restored via popstate');
        } finally {
            if (savedNavigation) window.navigation = savedNavigation;
        }
    })

    it('returns early when config.history is false', function() {
        let savedHistory = htmx.config.history;
        htmx.config.history = false;
        try {
            htmx.__initHistoryHandling();
            assert.equal(htmx.config.history, false);
        } finally {
            htmx.config.history = savedHistory;
        }
    })

    it('reloads page on history restore when config.history is "reload"', async function() {
        let originalLocation = htmx.__location;
        let originalHistoryConfig = htmx.config.history;
        let reloadCalled = false;
        htmx.__location = { 
            reload: function() { reloadCalled = true; },
            pathname: '/test', search: '', href: 'http://localhost/test'
        };
        htmx.config.history = 'reload';
        try {
            history.replaceState({ htmx: true }, '', '/test');
            htmx.__restoreHistory({ htmx: true });
            await htmx.timeout(10);
            assert.isTrue(reloadCalled);
        } finally {
            htmx.__location = originalLocation;
            htmx.config.history = originalHistoryConfig;
        }
    })

});
