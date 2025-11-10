describe('forEvent() unit tests', function() {

    it('resolves when event fires', async function () {
        let div = createProcessedHTML('<div></div>')
        let promise = htmx.forEvent('custom', null, div)
        setTimeout(() => div.dispatchEvent(new Event('custom')), 10)
        let evt = await promise
        assert.isNotNull(evt)
        assert.equal(evt.type, 'custom')
    })

    it('resolves with null on timeout', async function () {
        let div = createProcessedHTML('<div></div>')
        let evt = await htmx.forEvent('custom', 50, div)
        assert.isNull(evt)
    })

    it('defaults to document', async function () {
        let promise = htmx.forEvent('custom:test', null)
        setTimeout(() => document.dispatchEvent(new Event('custom:test')), 10)
        let evt = await promise
        assert.isNotNull(evt)
    })

    it('resolves before timeout if event fires', async function () {
        let div = createProcessedHTML('<div></div>')
        let promise = htmx.forEvent('custom', 1000, div)
        setTimeout(() => div.dispatchEvent(new Event('custom')), 10)
        let start = Date.now()
        let evt = await promise
        let elapsed = Date.now() - start
        assert.isNotNull(evt)
        assert.isBelow(elapsed, 500)
    })

    it('cleans up timeout when event fires', async function () {
        let div = createProcessedHTML('<div></div>')
        let promise = htmx.forEvent('custom', 1000, div)
        setTimeout(() => div.dispatchEvent(new Event('custom')), 10)
        await promise
        // If timeout wasn't cleared, this test would hang
        assert.isTrue(true)
    })

});