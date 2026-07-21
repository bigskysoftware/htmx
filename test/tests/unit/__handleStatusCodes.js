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
            swap: { style: 'innerHTML' },
            response: {
                raw: { status: 204 }
            }
        }

        htmx.__handleStatusCodes(ctx)

        assert.equal(ctx.swap.style, 'none')
    })

    it('sets swap to none for 304 status', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = {
            sourceElement: div,
            swap: { style: 'innerHTML' },
            response: {
                raw: { status: 304 }
            }
        }

        htmx.__handleStatusCodes(ctx)

        assert.equal(ctx.swap.style, 'none')
    })

    it('does not change swap for 200 status', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = {
            sourceElement: div,
            swap: { style: 'innerHTML' },
            response: {
                raw: { status: 200 }
            }
        }

        htmx.__handleStatusCodes(ctx)

        assert.equal(ctx.swap.style, 'innerHTML')
    })

    it('applies hx-status:404 override', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-status:404="swap:outerHTML"></div>')
        let ctx = {
            sourceElement: div,
            swap: { style: 'innerHTML' },
            response: {
                raw: { status: 404 }
            }
        }

        htmx.__handleStatusCodes(ctx)

        assert.equal(ctx.swap.style, 'outerHTML')
    })

    it('applies hx-status:4xx pattern match', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-status:4xx="swap:delete"></div>')
        let ctx = {
            sourceElement: div,
            swap: { style: 'innerHTML' },
            response: {
                raw: { status: 403 }
            }
        }

        htmx.__handleStatusCodes(ctx)

        assert.equal(ctx.swap.style, 'delete')
    })

    it('applies hx-status:5xx pattern match', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-status:5xx="swap:none"></div>')
        let ctx = {
            sourceElement: div,
            swap: { style: 'innerHTML' },
            response: {
                raw: { status: 500 }
            }
        }

        htmx.__handleStatusCodes(ctx)

        assert.equal(ctx.swap.style, 'none')
    })

    it('prefers exact match over pattern match', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-status:404="swap:outerHTML" hx-status:4xx="swap:delete"></div>')
        let ctx = {
            sourceElement: div,
            swap: { style: 'innerHTML' },
            response: {
                raw: { status: 404 }
            }
        }

        htmx.__handleStatusCodes(ctx)

        assert.equal(ctx.swap.style, 'outerHTML')
    })

    it('parses target modifier in hx-status value', function () {
        createProcessedHTML('<div id="error-target"></div>')
        let div = createProcessedHTML('<div hx-get="/test" hx-status:4xx="swap:innerHTML target:#error-target"></div>')
        let ctx = {
            sourceElement: div,
            swap: {
                style: 'outerHTML',
                target: div
            },
            response: {
                raw: { status: 404 }
            }
        }

        htmx.__handleStatusCodes(ctx)

        assert.equal(ctx.swap.style, 'innerHTML')
        assert.equal(ctx.swap.target, '#error-target')
    })

    it('can set multiple ctx properties with hx-status', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-status:500="swap:none select:#error push:false"></div>')
        let ctx = {
            sourceElement: div,
            swap: {
                style: 'innerHTML',
                select: null
            },
            actions: { pushUrl: 'true' },
            response: {
                raw: { status: 500 }
            }
        }

        htmx.__handleStatusCodes(ctx)

        assert.equal(ctx.swap.style, 'none')
        assert.equal(ctx.swap.select, '#error')
        assert.equal(ctx.actions.pushUrl, false)
    })

    it('hx-status can override canonical swap properties', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-status:404="target:#alt swap:outerHTML transition:false"></div>')
        let ctx = {
            sourceElement: div,
            swap: {
                style: 'innerHTML',
                target: '#main',
                transition: true
            },
            response: {
                raw: { status: 404 }
            }
        }

        htmx.__handleStatusCodes(ctx)

        assert.equal(ctx.swap.target, '#alt')
        assert.equal(ctx.swap.style, 'outerHTML')
        assert.equal(ctx.swap.transition, false)
    })

});
