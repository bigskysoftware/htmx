describe('__handleHxHeadersAndMaybeReturnEarly unit tests', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

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
