describe('hx-trigger every polling lifetime', function() {

    beforeEach(() => {
        setupTest()
    })

    afterEach(() => {
        cleanupTest()
    })

    it('HTTP 286 does not stop every polling', async function () {
        mockResponse('GET', '/poll-286', 'tick', {status: 286})
        createProcessedHTML('<div id="p286" hx-get="/poll-286" hx-trigger="every 40ms" hx-swap="innerHTML">0</div>')
        await htmx.timeout(130)
        fetchMock.calls.length.should.be.above(1)
    })

    it('innerHTML swap leaves the poller in the DOM so every continues', async function () {
        mockResponse('GET', '/poll-inner', 'tick')
        createProcessedHTML('<div id="pinner" hx-get="/poll-inner" hx-trigger="every 40ms" hx-swap="innerHTML">0</div>')
        await htmx.timeout(130)
        fetchMock.calls.length.should.be.above(1)
        find('#pinner').getAttribute('hx-trigger').should.equal('every 40ms')
    })

    it('outerHTML response without every stops polling', async function () {
        mockResponse('GET', '/poll-outer', '<div id="pouter">done</div>')
        createProcessedHTML('<div id="pouter" hx-get="/poll-outer" hx-trigger="every 40ms" hx-swap="outerHTML">go</div>')
        await forRequest(200)
        let afterFirst = fetchMock.calls.length
        afterFirst.should.equal(1)
        await htmx.timeout(120)
        fetchMock.calls.length.should.equal(afterFirst)
        find('#pouter').textContent.should.equal('done')
        should.equal(find('#pouter').getAttribute('hx-trigger'), null)
    })

    it('HX-Reswap outerHTML of a triggerless copy stops an innerHTML poller', async function () {
        mockResponse('GET', '/poll-reswap', '<div id="preswap">complete</div>', {headers: {'HX-Reswap': 'outerHTML'}})
        createProcessedHTML('<div id="preswap" hx-get="/poll-reswap" hx-trigger="every 40ms">go</div>')
        await forRequest(200)
        let afterFirst = fetchMock.calls.length
        afterFirst.should.equal(1)
        await htmx.timeout(120)
        fetchMock.calls.length.should.equal(afterFirst)
        find('#preswap').textContent.should.equal('complete')
        should.equal(find('#preswap').getAttribute('hx-trigger'), null)
    })
})
