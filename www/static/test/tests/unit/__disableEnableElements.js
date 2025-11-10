describe('__disableElements / __enableElements unit tests', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    it('disables element', function () {
        let container = createProcessedHTML('<div><button class="disable-me"></button></div>')
        let button = container.querySelector('button')

        htmx.__disableElements(container, '.disable-me')

        assert.isTrue(button.disabled)
    })

    it('enables element', function () {
        let container = createProcessedHTML('<div><button class="disable-me"></button></div>')
        let button = container.querySelector('button')

        let elements = htmx.__disableElements(container, '.disable-me')
        htmx.__enableElements(elements)

        assert.isFalse(button.disabled)
    })

    it('increments counter on multiple disables', function () {
        let container = createProcessedHTML('<div><button class="disable-me"></button></div>')
        let button = container.querySelector('button')

        htmx.__disableElements(container, '.disable-me')
        htmx.__disableElements(container, '.disable-me')

        assert.equal(button._htmxDisableCount, 2)
        assert.isTrue(button.disabled)
    })

    it('decrements counter on enable', function () {
        let container = createProcessedHTML('<div><button class="disable-me"></button></div>')
        let button = container.querySelector('button')

        let elements1 = htmx.__disableElements(container, '.disable-me')
        let elements2 = htmx.__disableElements(container, '.disable-me')
        htmx.__enableElements(elements1)

        assert.equal(button._htmxDisableCount, 1)
        assert.isTrue(button.disabled)
    })

    it('enables only when counter reaches zero', function () {
        let container = createProcessedHTML('<div><button class="disable-me"></button></div>')
        let button = container.querySelector('button')

        let elements1 = htmx.__disableElements(container, '.disable-me')
        let elements2 = htmx.__disableElements(container, '.disable-me')
        htmx.__enableElements(elements1)
        htmx.__enableElements(elements2)

        assert.isFalse(button.disabled)
        assert.isUndefined(button._htmxDisableCount)
    })

    it('handles multiple elements', function () {
        let container = createProcessedHTML('<div><button class="disable-me"></button><input class="disable-me"></div>')
        let button = container.querySelector('button')
        let input = container.querySelector('input')

        htmx.__disableElements(container, '.disable-me')

        assert.isTrue(button.disabled)
        assert.isTrue(input.disabled)
    })

    it('does nothing when selector is null', function () {
        let container = createProcessedHTML('<div><button class="disable-me"></button></div>')
        let button = container.querySelector('button')

        htmx.__disableElements(container, null)

        assert.isFalse(button.disabled)
    })

    it('includes element itself', function () {
        let button = createProcessedHTML('<button class="disable-me"></button>')

        htmx.__disableElements(button, '.disable-me')

        assert.isTrue(button.disabled)
    })

    it('handles enable without prior disable gracefully', function () {
        let container = createProcessedHTML('<div><button class="disable-me"></button></div>')
        let button = container.querySelector('button')

        htmx.__enableElements([button])

        assert.isFalse(button.disabled)
        assert.isUndefined(button._htmxDisableCount)
    })

    it('works with nested elements', function () {
        let container = createProcessedHTML('<div class="disable-me"><button class="disable-me"></button></div>')
        let outer = container
        let inner = container.querySelector('button')

        let elements = htmx.__disableElements(container, '.disable-me')

        assert.isTrue(outer.disabled)
        assert.isTrue(inner.disabled)

        htmx.__enableElements(elements)

        assert.isFalse(outer.disabled)
        assert.isFalse(inner.disabled)
    })

    it('maintains separate counts for separate elements', function () {
        let container = createProcessedHTML('<div><button class="disable-me"></button><input class="disable-me"></div>')
        let button = container.querySelector('button')
        let input = container.querySelector('input')

        htmx.__disableElements(container, 'button.disable-me')
        htmx.__disableElements(container, '.disable-me')

        assert.equal(button._htmxDisableCount, 2)
        assert.equal(input._htmxDisableCount, 1)
    })

});
