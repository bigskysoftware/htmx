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
        assert.equal(spec.swap, '100ms')
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
        assert.equal(htmx.__parseSwapSpec('innerHTML focus-scroll:true')['focus-scroll'], true)
        assert.equal(htmx.__parseSwapSpec('innerHTML focus-scroll:false')['focus-scroll'], false)
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
        assert.equal(htmx.__parseSwapSpec('innerHTML target:"#foo .bar"').target, '#foo .bar')
    })

    it('parses scroll with scrollTarget', function () {
        let spec = htmx.__parseSwapSpec('innerHTML scroll:top scrollTarget:#container')
        assert.equal(spec.scroll, 'top')
        assert.equal(spec.scrollTarget, '#container')
    })

    it('parses show with showTarget', function () {
        let spec = htmx.__parseSwapSpec('innerHTML show:bottom showTarget:.content')
        assert.equal(spec.show, 'bottom')
        assert.equal(spec.showTarget, '.content')
    })

    it('parses multiple modifiers', function () {
        let spec = htmx.__parseSwapSpec('innerHTML swap:100ms transition:true')
        assert.equal(spec.style, 'innerHTML')
        assert.equal(spec.swap, '100ms')
        assert.equal(spec.transition, true)
    })

    it('uses default swap when empty', function () {
        let spec = htmx.__parseSwapSpec('')
        assert.equal(spec.style, htmx.config.defaultSwap)
    })

    it('parses legacy style names with modifiers', function () {
        let spec = htmx.__parseSwapSpec('prepend swap:10ms')
        assert.equal(spec.style, 'afterbegin')
        assert.equal(spec.swap, '10ms')
    })

});