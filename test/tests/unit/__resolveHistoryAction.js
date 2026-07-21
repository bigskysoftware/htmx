describe('__resolveHistoryAction unit tests', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    it('returns null when no push or replace', function() {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = { sourceElement: div, actions: {} }
        assert.isNull(htmx.__resolveHistoryAction(ctx))
    })

    it('returns push with path from hx-push-url attribute', function() {
        let div = createProcessedHTML('<div hx-get="/test" hx-push-url="/pushed"></div>')
        let ctx = { sourceElement: div, actions: { pushUrl: '/pushed' } }
        let action = htmx.__resolveHistoryAction(ctx)
        assert.equal(action.type, 'push')
        assert.equal(action.path, '/pushed')
    })

    it('returns replace with path from hx-replace-url attribute', function() {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = { sourceElement: div, actions: { replaceUrl: '/replaced' } }
        let action = htmx.__resolveHistoryAction(ctx)
        assert.equal(action.type, 'replace')
        assert.equal(action.path, '/replaced')
    })

    it('push "false" returns null', function() {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = { sourceElement: div, actions: { pushUrl: 'false' } }
        assert.isNull(htmx.__resolveHistoryAction(ctx))
    })

    it('replace "false" returns null', function() {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = { sourceElement: div, actions: { replaceUrl: 'false' } }
        assert.isNull(htmx.__resolveHistoryAction(ctx))
    })

    it('pushUrl "false" does not block replaceUrl', function() {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = { sourceElement: div, actions: { pushUrl: 'false', replaceUrl: '/new-path' } }
        let action = htmx.__resolveHistoryAction(ctx)
        assert.equal(action.type, 'replace')
        assert.equal(action.path, '/new-path')
    })

    it('replaceUrl "false" does not block pushUrl', function() {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = { sourceElement: div, actions: { pushUrl: '/new-path', replaceUrl: 'false' } }
        let action = htmx.__resolveHistoryAction(ctx)
        assert.equal(action.type, 'push')
        assert.equal(action.path, '/new-path')
    })

    it('push "true" resolves path from response URL', function() {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = {
            sourceElement: div,
            actions: { pushUrl: 'true' },
            response: { raw: { url: 'http://localhost/resolved' } },
            request: { action: '/fallback' }
        }
        let action = htmx.__resolveHistoryAction(ctx)
        assert.equal(action.type, 'push')
        assert.equal(action.path, '/resolved')
    })

    it('push "true" falls back to request action', function() {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = {
            sourceElement: div,
            actions: { pushUrl: 'true' },
            response: { raw: {} },
            request: { action: '/fallback' }
        }
        let action = htmx.__resolveHistoryAction(ctx)
        assert.equal(action.type, 'push')
        assert.equal(action.path, '/fallback')
    })

    it('push takes precedence over replace', function() {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = { sourceElement: div, actions: { pushUrl: '/push-path', replaceUrl: '/replace-path' } }
        let action = htmx.__resolveHistoryAction(ctx)
        assert.equal(action.type, 'push')
        assert.equal(action.path, '/push-path')
    })

})
