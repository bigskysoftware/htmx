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
        let div = createProcessedHTML('<div hx-get="/test" hx-status:404="swap:outerHTML"></div>')
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
        let div = createProcessedHTML('<div hx-get="/test" hx-status:4xx="swap:delete"></div>')
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
        let div = createProcessedHTML('<div hx-get="/test" hx-status:5xx="swap:none"></div>')
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
        let div = createProcessedHTML('<div hx-get="/test" hx-status:404="swap:outerHTML" hx-status:4xx="swap:delete"></div>')
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

    it('parses target modifier in hx-status value', function () {
        createProcessedHTML('<div id="error-target"></div>')
        let div = createProcessedHTML('<div hx-get="/test" hx-status:4xx="swap:innerHTML target:#error-target"></div>')
        let ctx = {
            sourceElement: div,
            swap: 'outerHTML',
            target: div,
            response: {
                raw: { status: 404 }
            }
        }

        htmx.__handleStatusCodes(ctx)

        // Object.assign sets both swap and target on ctx
        assert.equal(ctx.swap, 'innerHTML')
        assert.equal(ctx.target, '#error-target')
    })

    it('can set multiple ctx properties with hx-status', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-status:500="swap:none select:#error push:false"></div>')
        let ctx = {
            sourceElement: div,
            swap: 'innerHTML',
            select: null,
            push: 'true',
            response: {
                raw: { status: 500 }
            }
        }

        htmx.__handleStatusCodes(ctx)

        assert.equal(ctx.swap, 'none')
        assert.equal(ctx.select, '#error')
        assert.equal(ctx.push, false)
    })

    it('hx-status can override any ctx property', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-status:404="target:#alt swap:outerHTML transition:false"></div>')
        let ctx = {
            sourceElement: div,
            swap: 'innerHTML',
            target: '#main',
            transition: true,
            response: {
                raw: { status: 404 }
            }
        }

        htmx.__handleStatusCodes(ctx)

        assert.equal(ctx.target, '#alt')
        assert.equal(ctx.swap, 'outerHTML')
        assert.equal(ctx.transition, false)
    })

});
