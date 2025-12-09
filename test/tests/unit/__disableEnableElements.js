describe('__disableElements / __enableElements unit tests', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    it('disables element', function () {
        let container = createProcessedHTML('<div hx-disable=".disable-me"><button class="disable-me"></button></div>')
        let button = container.querySelector('button')

        htmx.__disableElements(container)

        assert.isTrue(button.disabled)
    })

    it('enables element', function () {
        let container = createProcessedHTML('<div hx-disable=".disable-me"><button class="disable-me"></button></div>')
        let button = container.querySelector('button')

        let elements = htmx.__disableElements(container)
        htmx.__enableElements(elements)

        assert.isFalse(button.disabled)
    })

    it('increments counter on multiple disables', function () {
        let container = createProcessedHTML('<div hx-disable=".disable-me"><button class="disable-me"></button></div>')
        let button = container.querySelector('button')

        htmx.__disableElements(container)
        htmx.__disableElements(container)

        assert.equal(button._htmxDisableCount, 2)
        assert.isTrue(button.disabled)
    })

    it('decrements counter on enable', function () {
        let container = createProcessedHTML('<div hx-disable=".disable-me"><button class="disable-me"></button></div>')
        let button = container.querySelector('button')

        let elements1 = htmx.__disableElements(container)
        let elements2 = htmx.__disableElements(container)
        htmx.__enableElements(elements1)

        assert.equal(button._htmxDisableCount, 1)
        assert.isTrue(button.disabled)
    })

    it('enables only when counter reaches zero', function () {
        let container = createProcessedHTML('<div hx-disable=".disable-me"><button class="disable-me"></button></div>')
        let button = container.querySelector('button')

        let elements1 = htmx.__disableElements(container)
        let elements2 = htmx.__disableElements(container)
        htmx.__enableElements(elements1)
        htmx.__enableElements(elements2)

        assert.isFalse(button.disabled)
        assert.isUndefined(button._htmxDisableCount)
    })

    it('handles multiple elements', function () {
        let container = createProcessedHTML('<div hx-disable=".disable-me"><button class="disable-me"></button><input class="disable-me"></div>')
        let button = container.querySelector('button')
        let input = container.querySelector('input')

        htmx.__disableElements(container)

        assert.isTrue(button.disabled)
        assert.isTrue(input.disabled)
    })

    it('does nothing when selector is null', function () {
        let container = createProcessedHTML('<div><button class="disable-me"></button></div>')
        let button = container.querySelector('button')

        htmx.__disableElements(container)

        assert.isFalse(button.disabled)
    })

    it('includes element itself', function () {
        let button = createProcessedHTML('<button hx-disable=".disable-me" class="disable-me"></button>')

        htmx.__disableElements(button)

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
        let container = createProcessedHTML('<div hx-disable=".disable-me" class="disable-me"><button class="disable-me"></button></div>')
        let outer = container
        let inner = container.querySelector('button')

        let elements = htmx.__disableElements(container)

        assert.isTrue(outer.disabled)
        assert.isTrue(inner.disabled)

        htmx.__enableElements(elements)

        assert.isFalse(outer.disabled)
        assert.isFalse(inner.disabled)
    })

    it('maintains separate counts for separate elements', function () {
        let container = createProcessedHTML('<div hx-disable=".disable-me"><button class="disable-me"></button><input class="disable-me"></div>')
        let button = container.querySelector('button')
        let input = container.querySelector('input')

        htmx.__disableElements(button.parentElement)
        button.parentElement.setAttribute('hx-disable', 'button.disable-me')
        htmx.__disableElements(button.parentElement)

        assert.equal(button._htmxDisableCount, 2)
        assert.equal(input._htmxDisableCount, 1)
    })

    it('resolves this selector for disable', function () {
        let container = createProcessedHTML('<button hx-disable="this" hx-get="/test"></button>');
        
        let elements = htmx.__disableElements(container);
        
        assert.isTrue(container.disabled);
        assert.equal(elements.length, 1);
        assert.equal(elements[0], container);
    })

    it('resolves this selector with inherited disable', function () {
        let container = createProcessedHTML('<button hx-disable:inherited="this"><span hx-get="/test"></span></button>');
        let span = container.querySelector('span');
        
        let elements = htmx.__disableElements(span);
        
        assert.isTrue(container.disabled);
    })

    it('resolves this selector respecting disable override', function () {
        let html = '<button hx-disable="this"><span hx-disable=".other"><input hx-get="/test"></span></button>';
        let outer = createProcessedHTML(html);
        let input = outer.querySelector('input');
        
        let elements = htmx.__disableElements(input);
        
        assert.isFalse(outer.disabled);
        assert.equal(elements.length, 0);
    })

    it('resolves this selector with append for disable', function () {
        let html = '<button hx-disable:inherited="this"><input hx-disable:append="this" hx-get="/test"></button>';
        let outer = createProcessedHTML(html);
        let inner = outer.querySelector('input');
        
        let elements = htmx.__disableElements(inner);
        
        assert.equal(elements.length, 2);
        assert.isTrue(inner.disabled);
        assert.isTrue(outer.disabled);
    })

    it('resolves this selector with comma-separated disable values', function () {
        let html = '<button hx-disable="this, .other" hx-get="/test"></button>';
        let button = createProcessedHTML(html);
        
        let elements = htmx.__disableElements(button);
        
        assert.isTrue(button.disabled);
    })

});
