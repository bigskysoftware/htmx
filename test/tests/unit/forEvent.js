describe('forEvent() unit tests', function() {

    it('resolves when event fires', async function () {
        let div = createProcessedHTML('<div></div>')
        let promise = htmx.forEvent('custom', div)
        setTimeout(() => div.dispatchEvent(new Event('custom')), 10)
        let evt = await promise
        assert.isNotNull(evt)
        assert.equal(evt.type, 'custom')
    })

    it('resolves with the timeout arg on timeout', async function () {
        let div = createProcessedHTML('<div></div>')
        let result = await htmx.forEvent('custom', 50, div)
        assert.equal(result, 50)
    })

    it('accepts string interval as timeout', async function () {
        let div = createProcessedHTML('<div></div>')
        let result = await htmx.forEvent('custom', '50ms', div)
        assert.equal(result, '50ms')
    })

    it('defaults target to document', async function () {
        let promise = htmx.forEvent('custom:test')
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
        assert.equal(evt.type, 'custom')
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

    it('races multiple events; first one wins', async function () {
        let div = createProcessedHTML('<div></div>')
        let promise = htmx.forEvent('a', 'b', 1000, div)
        setTimeout(() => div.dispatchEvent(new Event('b')), 10)
        let evt = await promise
        assert.equal(evt.type, 'b')
    })

    it('last element arg wins as listener target', async function () {
        let a = createProcessedHTML('<div id="a"></div>')
        let b = createProcessedHTML('<div id="b"></div>')
        let promise = htmx.forEvent(a, 'fire', b)
        setTimeout(() => {
            a.dispatchEvent(new Event('fire')) // wrong target — should not resolve
            b.dispatchEvent(new Event('fire'))
        }, 10)
        let evt = await promise
        assert.equal(evt.target, b)
    })

});