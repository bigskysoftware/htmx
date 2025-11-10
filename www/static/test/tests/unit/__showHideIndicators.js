describe('__showIndicators / __hideIndicators unit tests', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    it('shows indicator by adding request class', function () {
        let container = createProcessedHTML('<div><span class="indicator"></span></div>')
        let span = container.querySelector('span')

        htmx.__showIndicators(container, '.indicator')

        assert.isTrue(span.classList.contains('htmx-request'))
    })

    it('hides indicator by removing request class', function () {
        let container = createProcessedHTML('<div><span class="indicator"></span></div>')
        let span = container.querySelector('span')

        let indicators = htmx.__showIndicators(container, '.indicator')
        htmx.__hideIndicators(indicators)

        assert.isFalse(span.classList.contains('htmx-request'))
    })

    it('increments counter on multiple shows', function () {
        let container = createProcessedHTML('<div><span class="indicator"></span></div>')
        let span = container.querySelector('span')

        htmx.__showIndicators(container, '.indicator')
        htmx.__showIndicators(container, '.indicator')

        assert.equal(span._htmxReqCount, 2)
        assert.isTrue(span.classList.contains('htmx-request'))
    })

    it('decrements counter on hide', function () {
        let container = createProcessedHTML('<div><span class="indicator"></span></div>')
        let span = container.querySelector('span')

        let indicators1 = htmx.__showIndicators(container, '.indicator')
        let indicators2 = htmx.__showIndicators(container, '.indicator')
        htmx.__hideIndicators(indicators1)

        assert.equal(span._htmxReqCount, 1)
        assert.isTrue(span.classList.contains('htmx-request'))
    })

    it('removes class only when counter reaches zero', function () {
        let container = createProcessedHTML('<div><span class="indicator"></span></div>')
        let span = container.querySelector('span')

        let indicators1 = htmx.__showIndicators(container, '.indicator')
        let indicators2 = htmx.__showIndicators(container, '.indicator')
        htmx.__hideIndicators(indicators1)
        htmx.__hideIndicators(indicators2)

        assert.isFalse(span.classList.contains('htmx-request'))
        assert.isUndefined(span._htmxReqCount)
    })

    it('handles multiple indicators', function () {
        let container = createProcessedHTML('<div><span class="indicator"></span><div class="indicator"></div></div>')
        let span = container.querySelector('span')
        let div = container.querySelector('div')

        htmx.__showIndicators(container, '.indicator')

        assert.isTrue(span.classList.contains('htmx-request'))
        assert.isTrue(div.classList.contains('htmx-request'))
    })

    it('does nothing when selector is null', function () {
        let container = createProcessedHTML('<div><span class="indicator"></span></div>')
        let span = container.querySelector('span')

        htmx.__showIndicators(container, null)

        assert.isFalse(span.classList.contains('htmx-request'))
    })

    it('includes element itself in indicators', function () {
        let div = createProcessedHTML('<div class="indicator"></div>')

        htmx.__showIndicators(div, '.indicator')

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
        let container = createProcessedHTML('<div class="indicator"><span class="indicator"></span></div>')
        let outer = container
        let inner = container.querySelector('span')

        let indicators = htmx.__showIndicators(container, '.indicator')

        assert.isTrue(outer.classList.contains('htmx-request'))
        assert.isTrue(inner.classList.contains('htmx-request'))

        htmx.__hideIndicators(indicators)

        assert.isFalse(outer.classList.contains('htmx-request'))
        assert.isFalse(inner.classList.contains('htmx-request'))
    })

    it('maintains separate counts for separate indicators', function () {
        let container = createProcessedHTML('<div><span class="indicator"></span><div class="indicator"></div></div>')
        let span = container.querySelector('span')
        let div = container.querySelector('div')

        htmx.__showIndicators(container, 'span.indicator')
        htmx.__showIndicators(container, '.indicator')

        assert.equal(span._htmxReqCount, 2)
        assert.equal(div._htmxReqCount, 1)
    })

});
