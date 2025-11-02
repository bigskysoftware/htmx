describe('__queryEltAndDescendants unit tests', function() {

    it('returns descendants matching selector', function () {
        let div = createProcessedHTML('<div><span class="foo"></span><span class="bar"></span></div>')
        let results = htmx.__queryEltAndDescendants(div, '.foo')
        assert.equal(results.length, 1)
        assert.equal(results[0].className, 'foo')
    })

    it('includes element itself when it matches', function () {
        let div = createProcessedHTML('<div class="foo"><span class="foo"></span></div>')
        let results = htmx.__queryEltAndDescendants(div, '.foo')
        assert.equal(results.length, 2)
        assert.equal(results[0], div)
        assert.equal(results[1], div.querySelector('span'))
    })

    it('excludes element itself when it does not match', function () {
        let div = createProcessedHTML('<div class="bar"><span class="foo"></span></div>')
        let results = htmx.__queryEltAndDescendants(div, '.foo')
        assert.equal(results.length, 1)
        assert.equal(results[0], div.querySelector('span'))
    })

    it('returns empty array when no matches', function () {
        let div = createProcessedHTML('<div class="bar"><span class="baz"></span></div>')
        let results = htmx.__queryEltAndDescendants(div, '.foo')
        assert.equal(results.length, 0)
    })

    it('handles multiple matching descendants', function () {
        let div = createProcessedHTML('<div><span class="foo"></span><span class="foo"></span><span class="foo"></span></div>')
        let results = htmx.__queryEltAndDescendants(div, '.foo')
        assert.equal(results.length, 3)
    })

    it('places element first when it matches', function () {
        let div = createProcessedHTML('<div class="foo"><span class="foo"></span><p class="foo"></p></div>')
        let results = htmx.__queryEltAndDescendants(div, '.foo')
        assert.equal(results.length, 3)
        assert.equal(results[0], div)
    })

    it('works with tag selectors', function () {
        let div = createProcessedHTML('<div><span></span><span></span></div>')
        let results = htmx.__queryEltAndDescendants(div, 'span')
        assert.equal(results.length, 2)
    })

    it('works with attribute selectors', function () {
        let div = createProcessedHTML('<div data-test="1"><span data-test="2"></span></div>')
        let results = htmx.__queryEltAndDescendants(div, '[data-test]')
        assert.equal(results.length, 2)
        assert.equal(results[0], div)
    })

});