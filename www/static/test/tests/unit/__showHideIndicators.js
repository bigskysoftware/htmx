describe('__showIndicators / __hideIndicators unit tests', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    it('shows indicator by adding request class', function () {
        let container = createProcessedHTML('<div hx-indicator=".indicator"><span class="indicator"></span></div>')
        let span = container.querySelector('span')

        htmx.__showIndicators(container)

        assert.isTrue(span.classList.contains('htmx-request'))
    })

    it('hides indicator by removing request class', function () {
        let container = createProcessedHTML('<div hx-indicator=".indicator"><span class="indicator"></span></div>')
        let span = container.querySelector('span')

        let indicators = htmx.__showIndicators(container)
        htmx.__hideIndicators(indicators)

        assert.isFalse(span.classList.contains('htmx-request'))
    })

    it('increments counter on multiple shows', function () {
        let container = createProcessedHTML('<div hx-indicator=".indicator"><span class="indicator"></span></div>')
        let span = container.querySelector('span')

        htmx.__showIndicators(container)
        htmx.__showIndicators(container)

        assert.equal(span._htmxReqCount, 2)
        assert.isTrue(span.classList.contains('htmx-request'))
    })

    it('decrements counter on hide', function () {
        let container = createProcessedHTML('<div hx-indicator=".indicator"><span class="indicator"></span></div>')
        let span = container.querySelector('span')

        let indicators1 = htmx.__showIndicators(container)
        let indicators2 = htmx.__showIndicators(container)
        htmx.__hideIndicators(indicators1)

        assert.equal(span._htmxReqCount, 1)
        assert.isTrue(span.classList.contains('htmx-request'))
    })

    it('removes class only when counter reaches zero', function () {
        let container = createProcessedHTML('<div hx-indicator=".indicator"><span class="indicator"></span></div>')
        let span = container.querySelector('span')

        let indicators1 = htmx.__showIndicators(container)
        let indicators2 = htmx.__showIndicators(container)
        htmx.__hideIndicators(indicators1)
        htmx.__hideIndicators(indicators2)

        assert.isFalse(span.classList.contains('htmx-request'))
        assert.isUndefined(span._htmxReqCount)
    })

    it('handles multiple indicators', function () {
        let container = createProcessedHTML('<div hx-indicator=".indicator"><span class="indicator"></span><div class="indicator"></div></div>')
        let span = container.querySelector('span')
        let div = container.querySelector('div')

        htmx.__showIndicators(container)

        assert.isTrue(span.classList.contains('htmx-request'))
        assert.isTrue(div.classList.contains('htmx-request'))
    })

    it('does nothing when selector is null', function () {
        let container = createProcessedHTML('<div><span class="indicator"></span></div>')
        let span = container.querySelector('span')

        htmx.__showIndicators(container)

        assert.isFalse(span.classList.contains('htmx-request'))
    })

    it('includes element itself in indicators', function () {
        let div = createProcessedHTML('<div hx-indicator=".indicator" class="indicator"></div>')

        htmx.__showIndicators(div)

        assert.isTrue(div.classList.contains('htmx-request'))
    })

    it('handles hide without prior show gracefully', function () {
        let container = createProcessedHTML('<div><span class="indicator"></span></div>')
        let span = container.querySelector('span')

        htmx.__hideIndicators([span])

        assert.isFalse(span.classList.contains('htmx-request'))
        assert.isUndefined(span._htmxReqCount)
    })

    it('works with nested indicators', function () {
        let container = createProcessedHTML('<div hx-indicator=".indicator" class="indicator"><span class="indicator"></span></div>')
        let outer = container
        let inner = container.querySelector('span')

        let indicators = htmx.__showIndicators(container)

        assert.isTrue(outer.classList.contains('htmx-request'))
        assert.isTrue(inner.classList.contains('htmx-request'))

        htmx.__hideIndicators(indicators)

        assert.isFalse(outer.classList.contains('htmx-request'))
        assert.isFalse(inner.classList.contains('htmx-request'))
    })

    it('maintains separate counts for separate indicators', function () {
        let container = createProcessedHTML('<div hx-indicator=".indicator"><span class="indicator"></span><div class="indicator"></div></div>')
        let span = container.querySelector('span')
        let div = container.querySelector('div')

        htmx.__showIndicators(container)
        container.setAttribute('hx-indicator', 'span.indicator')
        htmx.__showIndicators(container)

        assert.equal(span._htmxReqCount, 2)
        assert.equal(div._htmxReqCount, 1)
    })

    it('resolves this selector for indicators', function () {
        let container = createProcessedHTML('<div hx-indicator="this"><button hx-get="/test" hx-indicator="this"></button></div>');
        let button = container.querySelector('button');
        
        let indicators = htmx.__showIndicators(button);
        
        assert.isTrue(button.classList.contains('htmx-request'));
        assert.equal(indicators.length, 1);
        assert.equal(indicators[0], button);
    })

    it('resolves this selector with inherited indicator', function () {
        let outer = createProcessedHTML('<div hx-indicator:inherited="this"><button hx-get="/test"></button></div>');
        let button = outer.querySelector('button');
        
        let indicators = htmx.__showIndicators(button);
        
        assert.isTrue(outer.classList.contains('htmx-request'));
        assert.equal(indicators.length, 1);
        assert.equal(indicators[0], outer);
    })

    it('resolves this selector respecting indicator override', function () {
        let html = '<div hx-indicator="this"><button hx-get="/test" hx-indicator=".other" class="other"></button></div>';
        let outer = createProcessedHTML(html);
        let button = outer.querySelector('button');
        
        let indicators = htmx.__showIndicators(button);
        
        assert.isFalse(outer.classList.contains('htmx-request'));
        assert.isTrue(button.classList.contains('htmx-request'));
    })

    it('resolves this selector with append for indicators', function () {
        let html = '<div hx-indicator:inherited="this"><button hx-get="/test" hx-indicator:append="this"></button></div>';
        let outer = createProcessedHTML(html);
        let button = outer.querySelector('button');
        
        let indicators = htmx.__showIndicators(button);
        
        assert.isTrue(outer.classList.contains('htmx-request'));
        assert.isTrue(button.classList.contains('htmx-request'));
        assert.equal(indicators.length, 2);
    })

    it('resolves this selector with comma-separated indicator values', function () {
        let html = '<div class="other"><button hx-get="/test" hx-indicator="this, .other"></button></div>';
        let container = createProcessedHTML(html);
        let button = container.querySelector('button');
        
        let indicators = htmx.__showIndicators(button);
        
        assert.isTrue(button.classList.contains('htmx-request'));
        assert.isTrue(container.classList.contains('htmx-request'));
        assert.equal(indicators.length, 2);
    })

});
