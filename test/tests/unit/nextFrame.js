describe('nextFrame() unit tests', function() {

    it('resolves on the next animation frame', async function () {
        let resolved = false
        let promise = htmx.nextFrame().then(() => { resolved = true })
        // Synchronously, the promise has not resolved yet.
        assert.equal(resolved, false)
        await promise
        assert.equal(resolved, true)
    })

    it('subsequent frames advance independently', async function () {
        let counts = []
        for (let i = 0; i < 3; i++) {
            await htmx.nextFrame()
            counts.push(i)
        }
        assert.deepEqual(counts, [0, 1, 2])
    })

})
