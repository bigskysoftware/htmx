describe('New swap terminology', function() {

    it('prepend normalizes to afterbegin', function () {
        assert.equal(htmx.__parseSwapSpec('prepend').style, 'afterbegin')
    })

    it('append normalizes to beforeend', function () {
        assert.equal(htmx.__parseSwapSpec('append').style, 'beforeend')
    })

    it('before normalizes to beforebegin', function () {
        assert.equal(htmx.__parseSwapSpec('before').style, 'beforebegin')
    })

    it('after normalizes to afterend', function () {
        assert.equal(htmx.__parseSwapSpec('after').style, 'afterend')
    })

    it('new terminology works with modifiers', function () {
        assert.equal(htmx.__parseSwapSpec('prepend swap:10').style, 'afterbegin')
        assert.equal(htmx.__parseSwapSpec('prepend swap:10').swapDelay, 10)

        assert.equal(htmx.__parseSwapSpec('append settle:20').style, 'beforeend')
        assert.equal(htmx.__parseSwapSpec('append settle:20').settleDelay, 20)
    })

})
