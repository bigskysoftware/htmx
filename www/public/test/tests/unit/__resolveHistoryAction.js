describe('__resolveHistoryAction unit tests', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    it('returns null when no push or replace', function() {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = { sourceElement: div }
        assert.isNull(htmx.__resolveHistoryAction(ctx))
    })

    it('returns push with path from hx-push-url attribute', function() {
        let div = createProcessedHTML('<div hx-get="/test" hx-push-url="/pushed"></div>')
        let ctx = { sourceElement: div, push: '/pushed' }
        let action = htmx.__resolveHistoryAction(ctx)
        assert.equal(action.type, 'push')
        assert.equal(action.path, '/pushed')
    })

    it('returns replace with path from hx-replace-url attribute', function() {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = { sourceElement: div, replace: '/replaced' }
        let action = htmx.__resolveHistoryAction(ctx)
        assert.equal(action.type, 'replace')
        assert.equal(action.path, '/replaced')
    })

    it('server HX-Push-Url header overrides attribute', function() {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = { sourceElement: div, push: '/from-attr', hx: { pushurl: '/from-header' } }
        let action = htmx.__resolveHistoryAction(ctx)
        assert.equal(action.type, 'push')
        assert.equal(action.path, '/from-header')
    })

    it('server HX-Replace-Url header overrides attribute', function() {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = { sourceElement: div, replace: '/from-attr', hx: { replaceurl: '/from-header' } }
        let action = htmx.__resolveHistoryAction(ctx)
        assert.equal(action.type, 'replace')
        assert.equal(action.path, '/from-header')
    })

    it('push "false" returns null', function() {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = { sourceElement: div, push: 'false' }
        assert.isNull(htmx.__resolveHistoryAction(ctx))
    })

    it('replace "false" returns null', function() {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = { sourceElement: div, replace: 'false' }
        assert.isNull(htmx.__resolveHistoryAction(ctx))
    })

    it('HX-Push-Url: false does not block HX-Replace-Url', function() {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = { sourceElement: div, hx: { pushurl: 'false', replaceurl: '/new-path' } }
        let action = htmx.__resolveHistoryAction(ctx)
        assert.equal(action.type, 'replace')
        assert.equal(action.path, '/new-path')
    })

    it('HX-Replace-Url: false does not block HX-Push-Url', function() {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = { sourceElement: div, hx: { pushurl: '/new-path', replaceurl: 'false' } }
        let action = htmx.__resolveHistoryAction(ctx)
        assert.equal(action.type, 'push')
        assert.equal(action.path, '/new-path')
    })

    it('push "true" resolves path from response URL', function() {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = {
            sourceElement: div,
            push: 'true',
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
            push: 'true',
            response: { raw: {} },
            request: { action: '/fallback' }
        }
        let action = htmx.__resolveHistoryAction(ctx)
        assert.equal(action.type, 'push')
        assert.equal(action.path, '/fallback')
    })

    it('push takes precedence over replace', function() {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = { sourceElement: div, push: '/push-path', replace: '/replace-path' }
        let action = htmx.__resolveHistoryAction(ctx)
        assert.equal(action.type, 'push')
        assert.equal(action.path, '/push-path')
    })

})
