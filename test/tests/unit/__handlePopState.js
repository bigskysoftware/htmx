describe('__handlePopState unit tests', function() {

    let originalUrl
    let originalState
    let originalRestore
    let restores

    beforeEach(function() {
        setupTest();
        originalUrl = window.location.href
        originalState = history.state
        originalRestore = htmx.__restoreHistory
        restores = []
        htmx.__restoreHistory = (state) => { restores.push(state) }
    });

    afterEach(function() {
        htmx.__restoreHistory = originalRestore
        cleanupTest();
        history.replaceState(originalState, '', originalUrl)
    });

    it('does not restore when only the #fragment changed', function () {
        htmx.__replaceUrlInHistory('/popstate-page')
        // an in-page link adds an entry that differs only in its #fragment
        history.pushState(null, '', '/popstate-page#end')
        // pressing Back returns to the page's own entry: same path and query
        history.replaceState({htmx: true}, '', '/popstate-page')
        htmx.__handlePopState({state: {htmx: true}})
        assert.equal(restores.length, 0)
    })

    it('does not restore when moving forward to a #fragment of the same page', function () {
        htmx.__replaceUrlInHistory('/popstate-page?q=1')
        history.pushState(null, '', '/popstate-page?q=1#end')
        htmx.__handlePopState({state: null})
        assert.equal(restores.length, 0)
    })

    it('restores when the path changed', function () {
        htmx.__replaceUrlInHistory('/popstate-page')
        htmx.__pushUrlIntoHistory('/popstate-other')
        // pressing Back returns to /popstate-page
        history.replaceState({htmx: true}, '', '/popstate-page')
        htmx.__handlePopState({state: {htmx: true}})
        assert.deepEqual(restores, [{htmx: true}])
    })

    it('restores when only the query changed', function () {
        htmx.__replaceUrlInHistory('/popstate-page?q=1')
        htmx.__pushUrlIntoHistory('/popstate-page?q=2')
        history.replaceState({htmx: true}, '', '/popstate-page?q=1')
        htmx.__handlePopState({state: {htmx: true}})
        assert.equal(restores.length, 1)
    })

    it('restores when going back and then forward across a pushed URL', function () {
        htmx.__replaceUrlInHistory('/popstate-page')
        htmx.__pushUrlIntoHistory('/popstate-other')
        history.replaceState({htmx: true}, '', '/popstate-page')
        htmx.__handlePopState({state: {htmx: true}})
        history.replaceState({htmx: true}, '', '/popstate-other')
        htmx.__handlePopState({state: {htmx: true}})
        assert.equal(restores.length, 2)
    })

});
