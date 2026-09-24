describe('__disableElements / __enableElements unit tests', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    function makeCtx(elt) {
        return { sourceElement: elt, indicators: [], disabledElements: [] };
    }

    it('disables element', function () {
        let container = createProcessedHTML('<div hx-disable=".disable-me"><button class="disable-me"></button></div>')
        let button = container.querySelector('button')

        htmx.__disableElements(makeCtx(container))

        assert.isTrue(button.disabled)
    })

    it('enables element', function () {
        let container = createProcessedHTML('<div hx-disable=".disable-me"><button class="disable-me"></button></div>')
        let button = container.querySelector('button')

        let ctx = makeCtx(container)
        htmx.__disableElements(ctx)
        htmx.__enableElements(ctx.disabledElements)

        assert.isFalse(button.disabled)
    })

    it('increments counter on multiple disables', function () {
        let container = createProcessedHTML('<div hx-disable=".disable-me"><button class="disable-me"></button></div>')
        let button = container.querySelector('button')

        htmx.__disableElements(makeCtx(container))
        htmx.__disableElements(makeCtx(container))

        assert.equal(htmx.__htmxState(button).dc, 2)
        assert.isTrue(button.disabled)
    })

    it('decrements counter on enable', function () {
        let container = createProcessedHTML('<div hx-disable=".disable-me"><button class="disable-me"></button></div>')
        let button = container.querySelector('button')

        let ctx1 = makeCtx(container)
        let ctx2 = makeCtx(container)
        htmx.__disableElements(ctx1)
        htmx.__disableElements(ctx2)
        htmx.__enableElements(ctx1.disabledElements)

        assert.equal(htmx.__htmxState(button).dc, 1)
        assert.isTrue(button.disabled)
    })

    it('enables only when counter reaches zero', function () {
        let container = createProcessedHTML('<div hx-disable=".disable-me"><button class="disable-me"></button></div>')
        let button = container.querySelector('button')

        let ctx1 = makeCtx(container)
        let ctx2 = makeCtx(container)
        htmx.__disableElements(ctx1)
        htmx.__disableElements(ctx2)
        htmx.__enableElements(ctx1.disabledElements)
        htmx.__enableElements(ctx2.disabledElements)

        assert.isFalse(button.disabled)
        assert.isUndefined(htmx.__htmxState(button).dc)
    })

    it('handles multiple elements', function () {
        let container = createProcessedHTML('<div hx-disable=".disable-me"><button class="disable-me"></button><input class="disable-me"></div>')
        let button = container.querySelector('button')
        let input = container.querySelector('input')

        htmx.__disableElements(makeCtx(container))

        assert.isTrue(button.disabled)
        assert.isTrue(input.disabled)
    })

    it('does nothing when selector is null', function () {
        let container = createProcessedHTML('<div><button class="disable-me"></button></div>')
        let button = container.querySelector('button')

        htmx.__disableElements(makeCtx(container))

        assert.isFalse(button.disabled)
    })

    it('includes element itself', function () {
        let button = createProcessedHTML('<button hx-disable=".disable-me" class="disable-me"></button>')

        htmx.__disableElements(makeCtx(button))

        assert.isTrue(button.disabled)
    })

    it('handles enable without prior disable gracefully', function () {
        let container = createProcessedHTML('<div><button class="disable-me"></button></div>')
        let button = container.querySelector('button')

        htmx.__enableElements([button])

        assert.isFalse(button.disabled)
        assert.isUndefined(htmx.__htmxState(button).dc)
    })

    it('works with nested elements', function () {
        let container = createProcessedHTML('<div hx-disable=".disable-me" class="disable-me"><button class="disable-me"></button></div>')
        let outer = container
        let inner = container.querySelector('button')

        let ctx = makeCtx(container)
        htmx.__disableElements(ctx)

        assert.isTrue(outer.disabled)
        assert.isTrue(inner.disabled)

        htmx.__enableElements(ctx.disabledElements)

        assert.isFalse(outer.disabled)
        assert.isFalse(inner.disabled)
    })

    it('maintains separate counts for separate elements', function () {
        let container = createProcessedHTML('<div hx-disable=".disable-me"><button class="disable-me"></button><input class="disable-me"></div>')
        let button = container.querySelector('button')
        let input = container.querySelector('input')

        htmx.__disableElements(makeCtx(button.parentElement))
        button.parentElement.setAttribute('hx-disable', 'button.disable-me')
        htmx.__disableElements(makeCtx(button.parentElement))

        assert.equal(htmx.__htmxState(button).dc, 2)
        assert.equal(htmx.__htmxState(input).dc, 1)
    })

    it('resolves this selector for disable', function () {
        let container = createProcessedHTML('<button hx-disable="this" hx-get="/test"></button>');

        let ctx = makeCtx(container)
        htmx.__disableElements(ctx);

        assert.isTrue(container.disabled);
        assert.equal(ctx.disabledElements.length, 1);
        assert.equal(ctx.disabledElements[0], container);
    })

    it('resolves this selector with inherited disable', function () {
        let container = createProcessedHTML('<button hx-disable:inherited="this"><span hx-get="/test"></span></button>');
        let span = container.querySelector('span');

        htmx.__disableElements(makeCtx(span));

        assert.isTrue(container.disabled);
    })

    it('resolves this selector respecting disable override', function () {
        let html = '<button hx-disable="this"><span hx-disable=".other"><input hx-get="/test"></span></button>';
        let outer = createProcessedHTML(html);
        let input = outer.querySelector('input');

        let ctx = makeCtx(input)
        htmx.__disableElements(ctx);

        assert.isFalse(outer.disabled);
        assert.equal(ctx.disabledElements.length, 0);
    })

    it('resolves this selector with append for disable', function () {
        let html = '<button hx-disable:inherited="this"><input hx-disable:append="this" hx-get="/test"></button>';
        let outer = createProcessedHTML(html);
        let inner = outer.querySelector('input');

        let ctx = makeCtx(inner)
        htmx.__disableElements(ctx);

        assert.equal(ctx.disabledElements.length, 2);
        assert.isTrue(inner.disabled);
        assert.isTrue(outer.disabled);
    })

    it('resolves this selector with comma-separated disable values', function () {
        let html = '<button hx-disable="this, .other" hx-get="/test"></button>';
        let button = createProcessedHTML(html);

        htmx.__disableElements(makeCtx(button));

        assert.isTrue(button.disabled);
    })

    it('disabled elements are carried through an hx-location chain', async function() {
        mockResponse('GET', '/first', '', { headers: { 'HX-Location': '{"path":"/second","target":"#dest"}' } })
        mockResponse('GET', '/second', 'Done')
        createProcessedHTML(
            '<div id="dest"></div>' +
            '<button id="btn" hx-get="/first" hx-disable="this" hx-target="#dest">Click</button>'
        )
        find('#btn').click()
        await forRequest()  // /first
        assert.isTrue(find('#btn').disabled, 'button should still be disabled during chain')
        await forRequest()  // /second
        await htmx.timeout(10)
        assert.isFalse(find('#btn').disabled, 'button should be re-enabled after chain completes')
        assert.equal(find('#dest').textContent, 'Done')
    })

});
