describe('parseInterval unit tests', function() {

    it('parses milliseconds', function () {
        assert.equal(htmx.parseInterval('100ms'), 100)
        assert.equal(htmx.parseInterval('1ms'), 1)
        assert.equal(htmx.parseInterval('5000ms'), 5000)
    })

    it('parses seconds', function () {
        assert.equal(htmx.parseInterval('1s'), 1000)
        assert.equal(htmx.parseInterval('2s'), 2000)
        assert.equal(htmx.parseInterval('10s'), 10000)
    })

    it('parses minutes', function () {
        assert.equal(htmx.parseInterval('1m'), 60000)
        assert.equal(htmx.parseInterval('2m'), 120000)
        assert.equal(htmx.parseInterval('5m'), 300000)
    })

    it('parses decimal values', function () {
        assert.equal(htmx.parseInterval('1.5s'), 1500)
        assert.equal(htmx.parseInterval('0.5s'), 500)
        assert.equal(htmx.parseInterval('2.5m'), 150000)
    })

    it('defaults to milliseconds when no unit specified', function () {
        assert.equal(htmx.parseInterval('100'), 100)
        assert.equal(htmx.parseInterval('1000'), 1000)
        assert.equal(htmx.parseInterval('5'), 5)
    })

    it('handles decimal without unit', function () {
        assert.equal(htmx.parseInterval('1.5'), 1.5)
        assert.equal(htmx.parseInterval('100.25'), 100.25)
    })

    it('returns undefined for invalid input', function () {
        assert.equal(htmx.parseInterval('abc'), undefined)
        assert.equal(htmx.parseInterval('invalid'), undefined)
        assert.equal(htmx.parseInterval(''), undefined)
    })

    it('returns undefined for null', function () {
        assert.equal(htmx.parseInterval(null), undefined)
    })

    it('returns undefined for undefined', function () {
        assert.equal(htmx.parseInterval(undefined), undefined)
    })

    it('returns undefined for invalid unit', function () {
        assert.equal(htmx.parseInterval('100h'), undefined)
        assert.equal(htmx.parseInterval('50d'), undefined)
    })

    it('returns undefined for negative values', function () {
        assert.equal(htmx.parseInterval('-100ms'), undefined)
        assert.equal(htmx.parseInterval('-1s'), undefined)
    })

    it('handles zero', function () {
        assert.equal(htmx.parseInterval('0'), 0)
        assert.equal(htmx.parseInterval('0ms'), 0)
        assert.equal(htmx.parseInterval('0s'), 0)
    })

    it('handles very large numbers', function () {
        assert.equal(htmx.parseInterval('999999ms'), 999999)
        assert.equal(htmx.parseInterval('1000s'), 1000000)
    })

    it('returns undefined for strings with spaces', function () {
        assert.equal(htmx.parseInterval('100 ms'), undefined)
        assert.equal(htmx.parseInterval(' 100ms'), undefined)
        assert.equal(htmx.parseInterval('100ms '), undefined)
    })

});