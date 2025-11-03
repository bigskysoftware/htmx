describe('__parseSwapSpec unit tests', function() {

    it('parses basic swap styles', function () {
        assert.equal(htmx.__parseSwapSpec('innerHTML').style, 'innerHTML')
        assert.equal(htmx.__parseSwapSpec('outerHTML').style, 'outerHTML')
        assert.equal(htmx.__parseSwapSpec('beforebegin').style, 'beforebegin')
        assert.equal(htmx.__parseSwapSpec('afterbegin').style, 'afterbegin')
        assert.equal(htmx.__parseSwapSpec('beforeend').style, 'beforeend')
        assert.equal(htmx.__parseSwapSpec('afterend').style, 'afterend')
    })

    it('normalizes legacy swap styles', function () {
        assert.equal(htmx.__parseSwapSpec('prepend').style, 'afterbegin')
        assert.equal(htmx.__parseSwapSpec('append').style, 'beforeend')
        assert.equal(htmx.__parseSwapSpec('before').style, 'beforebegin')
        assert.equal(htmx.__parseSwapSpec('after').style, 'afterend')
    })

    it('parses swap delay modifier', function () {
        let spec = htmx.__parseSwapSpec('innerHTML swap:100ms')
        assert.equal(spec.style, 'innerHTML')
        assert.equal(spec.swapDelay, 100)
    })

    it('parses transition modifier', function () {
        assert.equal(htmx.__parseSwapSpec('innerHTML transition:true').transition, true)
        assert.equal(htmx.__parseSwapSpec('innerHTML transition:false').transition, false)
    })

    it('parses ignoreTitle modifier', function () {
        assert.equal(htmx.__parseSwapSpec('innerHTML ignoreTitle:true').ignoreTitle, true)
        assert.equal(htmx.__parseSwapSpec('innerHTML ignoreTitle:false').ignoreTitle, false)
    })

    it('parses strip modifier', function () {
        assert.equal(htmx.__parseSwapSpec('innerHTML strip:true').strip, true)
        assert.equal(htmx.__parseSwapSpec('innerHTML strip:false').strip, false)
    })

    it('parses focus-scroll modifier', function () {
        assert.equal(htmx.__parseSwapSpec('innerHTML focus-scroll:true').focusScroll, true)
        assert.equal(htmx.__parseSwapSpec('innerHTML focus-scroll:false').focusScroll, false)
    })

    it('parses scroll modifier', function () {
        assert.equal(htmx.__parseSwapSpec('innerHTML scroll:top').scroll, 'top')
        assert.equal(htmx.__parseSwapSpec('innerHTML scroll:bottom').scroll, 'bottom')
    })

    it('parses show modifier', function () {
        assert.equal(htmx.__parseSwapSpec('innerHTML show:top').show, 'top')
        assert.equal(htmx.__parseSwapSpec('innerHTML show:bottom').show, 'bottom')
    })

    it('parses target modifier', function () {
        assert.equal(htmx.__parseSwapSpec('innerHTML target:#foo').target, '#foo')
    })

    it('parses target with spaces', function () {
        assert.equal(htmx.__parseSwapSpec('innerHTML target:#foo .bar').target, '#foo .bar')
    })

    it('parses multiple modifiers', function () {
        let spec = htmx.__parseSwapSpec('innerHTML swap:100ms transition:true')
        assert.equal(spec.style, 'innerHTML')
        assert.equal(spec.swapDelay, 100)
        assert.equal(spec.transition, true)
    })

    it('parses style with leading colon', function () {
        assert.equal(htmx.__parseSwapSpec(':swap:100ms').swapDelay, 100)
    })

    it('uses default swap when empty', function () {
        let spec = htmx.__parseSwapSpec('')
        assert.equal(spec.style, htmx.config.defaultSwap)
    })

    it('parses legacy style names with modifiers', function () {
        let spec = htmx.__parseSwapSpec('prepend swap:10ms')
        assert.equal(spec.style, 'afterbegin')
        assert.equal(spec.swapDelay, 10)
    })

});