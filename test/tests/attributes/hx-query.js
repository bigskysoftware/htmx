describe('hx-query attribute', function() {

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })

    it('issues a QUERY request on click and swaps content', async function () {
        mockResponse('QUERY', '/test', 'Queried!')
        let btn = createProcessedHTML('<button hx-query="/test">Click Me!</button>');
        btn.click()
        await forRequest()
        btn.innerHTML.should.equal('Queried!')
    })

    it('issues a QUERY request with proper headers', async function() {
        mockResponse('QUERY', '/test', 'Queried!')
        let btn = createProcessedHTML('<button hx-query="/test">Click Me!</button>')
        btn.click()
        await forRequest()
        fetchMock.calls[0].request.method.should.equal('QUERY');
        btn.innerHTML.should.equal('Queried!')
    })

    it('QUERY on form includes its own data in request body', async function () {
        mockResponse('QUERY', '/test', "Queried!")
        let form = createProcessedHTML('<form hx-query="/test" hx-swap="outerHTML"><input name="i1" value="value"/><button id="b1">Click Me!</button></form>');
        form.requestSubmit()
        await forRequest();
        playground().innerHTML.should.equal('Queried!')
        lastFetch().url.should.equal("/test");
    })

    it('QUERY sends parameters in body not URL (unlike GET)', async function () {
        mockResponse('QUERY', '/test', 'Success')
        let form = createProcessedHTML('<form hx-query="/test" hx-swap="outerHTML"><input name="i1" value="value"/><button>Submit</button></form>');
        form.requestSubmit()
        await forRequest();
        lastFetch().url.should.equal("/test");
        // URL should not have query params - they go in body
        lastFetch().url.should.not.include("?");
    })

})
