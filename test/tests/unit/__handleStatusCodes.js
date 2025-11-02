describe('__handleStatusCodes unit tests', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    it('sets swap to none for 204 status', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = {
            sourceElement: div,
            swap: 'innerHTML',
            response: {
                raw: { status: 204 }
            }
        }

        htmx.__handleStatusCodes(ctx)

        assert.equal(ctx.swap, 'none')
    })

    it('does not change swap for 200 status', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = {
            sourceElement: div,
            swap: 'innerHTML',
            response: {
                raw: { status: 200 }
            }
        }

        htmx.__handleStatusCodes(ctx)

        assert.equal(ctx.swap, 'innerHTML')
    })

    it('applies hx-status:404 override', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-status:404="outerHTML"></div>')
        let ctx = {
            sourceElement: div,
            swap: 'innerHTML',
            response: {
                raw: { status: 404 }
            }
        }

        htmx.__handleStatusCodes(ctx)

        assert.equal(ctx.swap, 'outerHTML')
    })

    it('applies hx-status:4xx pattern match', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-status:4xx="delete"></div>')
        let ctx = {
            sourceElement: div,
            swap: 'innerHTML',
            response: {
                raw: { status: 403 }
            }
        }

        htmx.__handleStatusCodes(ctx)

        assert.equal(ctx.swap, 'delete')
    })

    it('applies hx-status:5xx pattern match', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-status:5xx="none"></div>')
        let ctx = {
            sourceElement: div,
            swap: 'innerHTML',
            response: {
                raw: { status: 500 }
            }
        }

        htmx.__handleStatusCodes(ctx)

        assert.equal(ctx.swap, 'none')
    })

    it('prefers exact match over pattern match', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-status:404="outerHTML" hx-status:4xx="delete"></div>')
        let ctx = {
            sourceElement: div,
            swap: 'innerHTML',
            response: {
                raw: { status: 404 }
            }
        }

        htmx.__handleStatusCodes(ctx)

        assert.equal(ctx.swap, 'outerHTML')
    })

});
