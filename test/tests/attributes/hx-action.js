describe('hx-action attribute', function() {

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })

    it('hx-action alone defaults to GET', async function() {
        mockResponse('GET', '/test', 'Clicked!')
        let btn = createProcessedHTML('<button hx-action="/test">Click Me!</button>')
        btn.click()
        await forRequest()
        fetchMock.calls[0].request.method.should.equal('GET')
        btn.innerHTML.should.equal('Clicked!')
    })

    it('hx-action with hx-method uses specified method', async function() {
        mockResponse('POST', '/test', 'Posted!')
        let btn = createProcessedHTML('<button hx-action="/test" hx-method="post">Click Me!</button>')
        btn.click()
        await forRequest()
        fetchMock.calls[0].request.method.should.equal('POST')
        btn.innerHTML.should.equal('Posted!')
    })

    it('hx-action on form picks up native method attribute', async function() {
        mockResponse('POST', '/test', 'Posted!')
        let form = createProcessedHTML('<form hx-action="/test" hx-swap="outerHTML" method="post"><button>Submit</button></form>')
        form.requestSubmit()
        await forRequest()
        fetchMock.calls[0].request.method.should.equal('POST')
        playground().innerHTML.should.equal('Posted!')
    })

    it('hx-action on form with submitter formmethod uses formmethod', async function() {
        mockResponse('POST', '/test', 'Posted!')
        let form = createProcessedHTML('<form hx-action="/test" hx-swap="outerHTML" method="get"><button id="b1" formmethod="post">Submit</button></form>')
        find('#b1').click()
        await forRequest()
        fetchMock.calls[0].request.method.should.equal('POST')
        playground().innerHTML.should.equal('Posted!')
    })

    it('hx-action with hx-method takes priority over native method attribute', async function() {
        mockResponse('PUT', '/test', 'Put!')
        let form = createProcessedHTML('<form hx-action="/test" hx-method="put" hx-swap="outerHTML" method="post"><button>Submit</button></form>')
        form.requestSubmit()
        await forRequest()
        fetchMock.calls[0].request.method.should.equal('PUT')
        playground().innerHTML.should.equal('Put!')
    })

    it('hx-action with hx-method QUERY issues a QUERY request', async function() {
        mockResponse('QUERY', '/test', 'Queried!')
        let btn = createProcessedHTML('<button hx-action="/test" hx-method="QUERY">Click Me!</button>')
        btn.click()
        await forRequest()
        fetchMock.calls[0].request.method.should.equal('QUERY')
        btn.innerHTML.should.equal('Queried!')
    })

})
