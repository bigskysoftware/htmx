describe('__resolveStatusCode unit tests', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    it('sets swap to none for 204 status', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let result = htmx.__resolveStatusCode(
            {status: 204, headers: new Headers()},
            div
        )

        assert.equal(result.swap.style, 'none')
    })

    it('sets swap to none for 304 status', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let result = htmx.__resolveStatusCode(
            {status: 304, headers: new Headers()},
            div
        )

        assert.equal(result.swap.style, 'none')
    })

    it('returns no overrides for 200 status', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let result = htmx.__resolveStatusCode(
            {status: 200, headers: new Headers()},
            div
        )

        assert.deepEqual(result, {swap: {}, actions: {}})
    })

    it('applies hx-status:404 override', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-status:404="swap:outerHTML"></div>')
        let result = htmx.__resolveStatusCode(
            {status: 404, headers: new Headers()},
            div
        )

        assert.equal(result.swap.style, 'outerHTML')
    })

    it('applies hx-status:4xx pattern match', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-status:4xx="swap:delete"></div>')
        let result = htmx.__resolveStatusCode(
            {status: 403, headers: new Headers()},
            div
        )

        assert.equal(result.swap.style, 'delete')
    })

    it('applies hx-status:5xx pattern match', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-status:5xx="swap:none"></div>')
        let result = htmx.__resolveStatusCode(
            {status: 500, headers: new Headers()},
            div
        )

        assert.equal(result.swap.style, 'none')
    })

    it('prefers exact match over pattern match', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-status:404="swap:outerHTML" hx-status:4xx="swap:delete"></div>')
        let result = htmx.__resolveStatusCode(
            {status: 404, headers: new Headers()},
            div
        )

        assert.equal(result.swap.style, 'outerHTML')
    })

    it('parses target modifier in hx-status value', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-status:4xx="swap:innerHTML target:#error-target"></div>')
        let result = htmx.__resolveStatusCode(
            {status: 404, headers: new Headers()},
            div
        )

        assert.equal(result.swap.style, 'innerHTML')
        assert.equal(result.swap.target, '#error-target')
    })

    it('returns swap and history overrides', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-status:500="swap:none select:#error push:false"></div>')
        let result = htmx.__resolveStatusCode(
            {status: 500, headers: new Headers()},
            div
        )

        assert.equal(result.swap.style, 'none')
        assert.equal(result.swap.select, '#error')
        assert.equal(result.actions.pushUrl, false)
    })

    it('overrides canonical swap properties', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-status:404="target:#alt swap:outerHTML transition:false"></div>')
        let result = htmx.__resolveStatusCode(
            {status: 404, headers: new Headers()},
            div
        )

        assert.equal(result.swap.target, '#alt')
        assert.equal(result.swap.style, 'outerHTML')
        assert.equal(result.swap.transition, false)
    })

    it('does not override response history headers', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-status:500="push:/status"></div>')
        let result = htmx.__resolveStatusCode(
            {status: 500, headers: new Headers({'HX-Push-Url': '/header'})},
            div
        )

        assert.deepEqual(result.actions, {})
    })

});
