describe('__determineMethodAndAction unit tests', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    it('boosted form with lowercase method="get" returns uppercase GET', function() {
        let form = createProcessedHTML('<form hx-boost="true" action="/test" method="get"></form>')
        let result = htmx.__determineMethodAndAction(form, new Event('submit'))
        assert.equal(result.method, 'GET')
    })

    it('boosted form with lowercase method="post" returns uppercase POST', function() {
        let form = createProcessedHTML('<form hx-boost="true" action="/test" method="post"></form>')
        let result = htmx.__determineMethodAndAction(form, new Event('submit'))
        assert.equal(result.method, 'POST')
    })

    it('boosted form with no method defaults to GET', function() {
        let form = createProcessedHTML('<form hx-boost="true" action="/test"></form>')
        let result = htmx.__determineMethodAndAction(form, new Event('submit'))
        assert.equal(result.method, 'GET')
    })

    it('boosted anchor returns GET', function() {
        let a = createProcessedHTML('<a hx-boost="true" href="/test">Link</a>')
        let result = htmx.__determineMethodAndAction(a, new Event('click'))
        assert.equal(result.method, 'GET')
        assert.equal(result.action, '/test')
    })

    it('non-boosted element with hx-get returns GET', function() {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let result = htmx.__determineMethodAndAction(div, new Event('click'))
        assert.equal(result.method, 'GET')
        assert.equal(result.action, '/test')
    })

    it('non-boosted element with hx-post returns POST', function() {
        let div = createProcessedHTML('<div hx-post="/test"></div>')
        let result = htmx.__determineMethodAndAction(div, new Event('click'))
        assert.equal(result.method, 'POST')
        assert.equal(result.action, '/test')
    })

})
