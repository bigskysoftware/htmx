describe('timeout() unit tests', function() {

    it('returns promise that resolves after milliseconds', async function () {
        let start = Date.now()
        await htmx.timeout(50)
        let elapsed = Date.now() - start
        assert.isAtLeast(elapsed, 45)
    })

    it('accepts string time format', async function () {
        let start = Date.now()
        await htmx.timeout('50ms')
        let elapsed = Date.now() - start
        assert.isAtLeast(elapsed, 45)
    })

    it('accepts seconds format', async function () {
        let start = Date.now()
        await htmx.timeout('0.05s')
        let elapsed = Date.now() - start
        assert.isAtLeast(elapsed, 45)
    })

    it('returns undefined for zero time', function () {
        let result = htmx.timeout(0)
        assert.isUndefined(result)
    })

    it('returns undefined for negative time', function () {
        let result = htmx.timeout(-1)
        assert.isUndefined(result)
    })

});