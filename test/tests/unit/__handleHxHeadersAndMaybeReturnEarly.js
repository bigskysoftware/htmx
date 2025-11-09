describe('__handleHxHeadersAndMaybeReturnEarly unit tests', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    it('handles hx-trigger header', function () {
        let triggerFired = false
        let listener = () => { triggerFired = true }

        let container = createProcessedHTML('<div></div>')
        container.addEventListener('myEvent', listener)

        let ctx = {
            hx: {
                trigger: 'myEvent'
            },
            sourceElement: container
        }

        let result = htmx.__handleHeadersAndMaybeReturnEarly(ctx)

        assert.isNotOk(result)
        assert.isTrue(triggerFired)
    })

    it('returns false when no headers to handle', function () {
        let ctx = {
            hx: {},
            sourceElement: createProcessedHTML('<div></div>')
        }

        let result = htmx.__handleHeadersAndMaybeReturnEarly(ctx)

        assert.isNotOk(result)
    })

    it('returns false when only hx-trigger is present', function () {
        let container = createProcessedHTML('<div></div>')

        let ctx = {
            hx: {
                trigger: 'someEvent'
            },
            sourceElement: container
        }

        let result = htmx.__handleHeadersAndMaybeReturnEarly(ctx)

        assert.isNotOk(result)
    })

});
