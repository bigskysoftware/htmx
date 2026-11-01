describe('__showIndicators / __hideIndicators unit tests', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    function makeCtx(elt) {
        return { sourceElement: elt, indicators: [], disabledElements: [] };
    }

    it('shows indicator by adding request class', function () {
        let container = createProcessedHTML('<div hx-indicator=".indicator"><span class="indicator"></span></div>')
        let span = container.querySelector('span')

        htmx.__showIndicators(makeCtx(container))

        assert.isTrue(span.classList.contains('htmx-request'))
    })

    it('hides indicator by removing request class', function () {
        let container = createProcessedHTML('<div hx-indicator=".indicator"><span class="indicator"></span></div>')
        let span = container.querySelector('span')

        let ctx = makeCtx(container)
        htmx.__showIndicators(ctx)
        htmx.__hideIndicators(ctx.indicators)

        assert.isFalse(span.classList.contains('htmx-request'))
    })

    it('increments counter on multiple shows', function () {
        let container = createProcessedHTML('<div hx-indicator=".indicator"><span class="indicator"></span></div>')
        let span = container.querySelector('span')

        htmx.__showIndicators(makeCtx(container))
        htmx.__showIndicators(makeCtx(container))

        assert.equal(htmx.__htmxState(span).rc, 2)
        assert.isTrue(span.classList.contains('htmx-request'))
    })

    it('decrements counter on hide', function () {
        let container = createProcessedHTML('<div hx-indicator=".indicator"><span class="indicator"></span></div>')
        let span = container.querySelector('span')

        let ctx1 = makeCtx(container)
        let ctx2 = makeCtx(container)
        htmx.__showIndicators(ctx1)
        htmx.__showIndicators(ctx2)
        htmx.__hideIndicators(ctx1.indicators)

        assert.equal(htmx.__htmxState(span).rc, 1)
        assert.isTrue(span.classList.contains('htmx-request'))
    })

    it('removes class only when counter reaches zero', function () {
        let container = createProcessedHTML('<div hx-indicator=".indicator"><span class="indicator"></span></div>')
        let span = container.querySelector('span')

        let ctx1 = makeCtx(container)
        let ctx2 = makeCtx(container)
        htmx.__showIndicators(ctx1)
        htmx.__showIndicators(ctx2)
        htmx.__hideIndicators(ctx1.indicators)
        htmx.__hideIndicators(ctx2.indicators)

        assert.isFalse(span.classList.contains('htmx-request'))
        assert.isUndefined(htmx.__htmxState(span).rc)
    })

    it('handles multiple indicators', function () {
        let container = createProcessedHTML('<div hx-indicator=".indicator"><span class="indicator"></span><div class="indicator"></div></div>')
        let span = container.querySelector('span')
        let div = container.querySelector('div')

        htmx.__showIndicators(makeCtx(container))

        assert.isTrue(span.classList.contains('htmx-request'))
        assert.isTrue(div.classList.contains('htmx-request'))
    })

    it('does nothing when selector is null', function () {
        let container = createProcessedHTML('<div><span class="indicator"></span></div>')
        let span = container.querySelector('span')

        htmx.__showIndicators(makeCtx(container))

        assert.isFalse(span.classList.contains('htmx-request'))
    })

    it('returns empty array and adds no class when elt is document.body', function () {
        let span = createProcessedHTML('<span class="htmx-indicator"></span>')
        document.body.appendChild(span)

        let ctx = makeCtx(document.body)
        htmx.__showIndicators(ctx)

        assert.deepEqual(ctx.indicators, [])
        assert.isFalse(document.body.classList.contains('htmx-request'))
        assert.isFalse(span.classList.contains('htmx-request'))

        span.remove()
    })

    it('includes element itself in indicators', function () {
        let div = createProcessedHTML('<div hx-indicator=".indicator" class="indicator"></div>')

        htmx.__showIndicators(makeCtx(div))

        assert.isTrue(div.classList.contains('htmx-request'))
    })

    it('handles hide without prior show gracefully', function () {
        let container = createProcessedHTML('<div><span class="indicator"></span></div>')
        let span = container.querySelector('span')

        htmx.__hideIndicators([span])

        assert.isFalse(span.classList.contains('htmx-request'))
        assert.isUndefined(htmx.__htmxState(span).rc)
    })

    it('works with nested indicators', function () {
        let container = createProcessedHTML('<div hx-indicator=".indicator" class="indicator"><span class="indicator"></span></div>')
        let outer = container
        let inner = container.querySelector('span')

        let ctx = makeCtx(container)
        htmx.__showIndicators(ctx)

        assert.isTrue(outer.classList.contains('htmx-request'))
        assert.isTrue(inner.classList.contains('htmx-request'))

        htmx.__hideIndicators(ctx.indicators)

        assert.isFalse(outer.classList.contains('htmx-request'))
        assert.isFalse(inner.classList.contains('htmx-request'))
    })

    it('maintains separate counts for separate indicators', function () {
        let container = createProcessedHTML('<div hx-indicator=".indicator"><span class="indicator"></span><div class="indicator"></div></div>')
        let span = container.querySelector('span')
        let div = container.querySelector('div')

        htmx.__showIndicators(makeCtx(container))
        container.setAttribute('hx-indicator', 'span.indicator')
        htmx.__showIndicators(makeCtx(container))

        assert.equal(htmx.__htmxState(span).rc, 2)
        assert.equal(htmx.__htmxState(div).rc, 1)
    })

    it('resolves this selector for indicators', function () {
        let container = createProcessedHTML('<div hx-indicator="this"><button hx-get="/test" hx-indicator="this"></button></div>');
        let button = container.querySelector('button');

        let ctx = makeCtx(button)
        htmx.__showIndicators(ctx);

        assert.isTrue(button.classList.contains('htmx-request'));
        assert.equal(ctx.indicators.length, 1);
        assert.equal(ctx.indicators[0], button);
    })

    it('resolves this selector with inherited indicator', function () {
        let outer = createProcessedHTML('<div hx-indicator:inherited="this"><button hx-get="/test"></button></div>');
        let button = outer.querySelector('button');

        let ctx = makeCtx(button)
        htmx.__showIndicators(ctx);

        assert.isTrue(outer.classList.contains('htmx-request'));
        assert.equal(ctx.indicators.length, 1);
        assert.equal(ctx.indicators[0], outer);
    })

    it('resolves this selector respecting indicator override', function () {
        let html = '<div hx-indicator="this"><button hx-get="/test" hx-indicator=".other" class="other"></button></div>';
        let outer = createProcessedHTML(html);
        let button = outer.querySelector('button');

        let ctx = makeCtx(button)
        htmx.__showIndicators(ctx);

        assert.isFalse(outer.classList.contains('htmx-request'));
        assert.isTrue(button.classList.contains('htmx-request'));
    })

    it('resolves this selector with append for indicators', function () {
        let html = '<div hx-indicator:inherited="this"><button hx-get="/test" hx-indicator:append="this"></button></div>';
        let outer = createProcessedHTML(html);
        let button = outer.querySelector('button');

        let ctx = makeCtx(button)
        htmx.__showIndicators(ctx);

        assert.isTrue(outer.classList.contains('htmx-request'));
        assert.isTrue(button.classList.contains('htmx-request'));
        assert.equal(ctx.indicators.length, 2);
    })

    it('resolves this selector with comma-separated indicator values', function () {
        let html = '<div class="other"><button hx-get="/test" hx-indicator="this, .other"></button></div>';
        let container = createProcessedHTML(html);
        let button = container.querySelector('button');

        let ctx = makeCtx(button)
        htmx.__showIndicators(ctx);

        assert.isTrue(button.classList.contains('htmx-request'));
        assert.isTrue(container.classList.contains('htmx-request'));
        assert.equal(ctx.indicators.length, 2);
    })

    it('indicators are carried through an hx-location chain', async function() {
        mockResponse('GET', '/first', '', { headers: { 'HX-Location': '{"path":"/second","target":"#dest"}' } })
        mockResponse('GET', '/second', 'Done')
        createProcessedHTML(
            '<div id="indicator" class="htmx-indicator">Loading...</div>' +
            '<div id="dest"></div>' +
            '<button id="btn" hx-get="/first" hx-indicator="#indicator" hx-target="#dest">Click</button>'
        )
        find('#btn').click()
        await forRequest()  // /first
        assert.isTrue(find('#indicator').classList.contains('htmx-request'), 'indicator should still be active during chain')
        await forRequest()  // /second
        await htmx.timeout(10)
        assert.isFalse(find('#indicator').classList.contains('htmx-request'), 'indicator should be hidden after chain completes')
        assert.equal(find('#dest').textContent, 'Done')
    })

    it('keeps indicators visible when HX-Redirect is received', async function() {
        let originalLocation = htmx._loc;
        let redirectUrl = null;
        htmx._loc = {
            get href() { return window.location.href; },
            set href(val) { redirectUrl = val; }
        };
        try {
            mockResponse('GET', '/test', '', { headers: { 'HX-Redirect': '/other-page' } });
            createProcessedHTML(
                '<div id="indicator" class="htmx-indicator">Loading...</div>' +
                '<button id="btn" hx-get="/test" hx-indicator="#indicator">Click</button>'
            );
            find('#btn').click();
            await forRequest();
            await htmx.timeout(10);
            assert.equal(redirectUrl, '/other-page');
            assert.isTrue(find('#indicator').classList.contains('htmx-request'));
        } finally {
            htmx._loc = originalLocation;
        }
    })

});
