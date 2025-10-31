describe('fast hx-on:xxx response retarting attribute test', function() {

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })

    it('retargets based on a full response code', async function () {
        debug(this)
        mockResponse('GET', '/test', 'Clicked!', {status:400})
        let btn = createProcessedHTML('<button hx-status:400="innerHTML target:#d1" hx-get="/test">Click Me!</button><div id="d1"></div>');
        await directlyInvokeHandler(btn)
        playground().innerText.should.equal('Click Me! Clicked!')
    })


})
