describe('fast hx-on:xxx response retarting attribute test', function() {

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })

    it('retargets based on a full response code', async function () {
        mockResponse('GET', '/test', 'Clicked!', {status:400})
        let btn = createProcessedHTML('<button hx-status:400="innerHTML target:#d1" hx-get="/test">Click Me!</button><div id="d1"></div>');
        await directlyInvokeHandler(btn)
        htmx.find("#d1").innerText.should.equal('Clicked!')
    })

    it('retargets based on a one char partial response code', async function () {
        mockResponse('GET', '/test', 'Clicked!', {status:400})
        let btn = createProcessedHTML('<button hx-status:40x="innerHTML target:#d1" hx-get="/test">Click Me!</button><div id="d1"></div>');
        await directlyInvokeHandler(btn)
        htmx.find("#d1").innerText.should.equal('Clicked!')
    })

    it('retargets based on a two char partial response code', async function () {
        mockResponse('GET', '/test', 'Clicked!', {status:400})
        let btn = createProcessedHTML('<button hx-status:4xx="innerHTML target:#d1" hx-get="/test">Click Me!</button><div id="d1"></div>');
        await directlyInvokeHandler(btn)
        htmx.find("#d1").innerText.should.equal('Clicked!')
    })

    it('more specific wins over less partial response code', async function () {
        mockResponse('GET', '/test', 'Clicked!', {status:400})
        let btn = createProcessedHTML('<button hx-status:400="innerHTML target:#d2" hx-status:40x="innerHTML target:#d1" hx-get="/test">Click Me!</button><div id="d1"></div><div id="d2"></div>');
        await directlyInvokeHandler(btn)
        htmx.find("#d1").innerText.should.equal('')
        htmx.find("#d2").innerText.should.equal('Clicked!')
    })

    it('more specific inherited wins over less partial response code', async function () {
        mockResponse('GET', '/test', 'Clicked!', {status:400})
        let btn = createProcessedHTML('<div hx-status:400:inherited="innerHTML target:#d2"><button id="btn1" hx-status:40x="innerHTML target:#d1" hx-get="/test">Click Me!</button><div id="d1"></div><div id="d2"></div></div>div>');
        await directlyInvokeHandler(htmx.find("#btn1"))
        htmx.find("#d1").innerText.should.equal('')
        htmx.find("#d2").innerText.should.equal('Clicked!')
    })



})
