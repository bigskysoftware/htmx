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
            request: { originalAction: '/test' }
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
            request: { originalAction: '/test-path' }
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
            request: { originalAction: '/replace-path' }
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
            request: { originalAction: '/test' }
        }

        htmx.__handleHistoryUpdate(ctx)

        assert.include(window.location.href, '/custom-path')
    })

});
