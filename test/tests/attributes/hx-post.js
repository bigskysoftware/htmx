describe('hx-post attribute', function() {

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })

    it('issues a POST request with proper headers', async function() {
        mockResponse('POST', '/test', 'Posted!')
        let btn = createProcessedHTML('<button hx-post="/test">Click Me!</button>')
        btn.click()
        await forRequest()
        fetchMock.calls[0].request.method.should.equal('POST');
        should.equal(fetchMock.calls[0].request.headers['X-HTTP-Method-Override'], undefined);
        btn.innerHTML.should.equal('Posted!')
    })

    it('issues a POST request with empty string action (current URL)', async function() {
        mockResponse('POST', /^$/, 'Posted!')
        let btn = createProcessedHTML('<button hx-post="">Click Me!</button>')
        btn.click()
        await forRequest()
        fetchMock.calls[0].request.method.should.equal('POST');
        fetchMock.calls[0].url.should.equal('');
        btn.innerHTML.should.equal('Posted!')
    })

    it('POST on form with several controls named "form" sends the form values', async function() {
        mockResponse('POST', '/test', 'Posted!')
        let form = createProcessedHTML('<form hx-post="/test"><input name="form" value="a"/><input name="form" value="b"/><input name="i1" value="v1"/></form>')
        form.requestSubmit()
        await forRequest()
        fetchMock.calls[0].request.body.getAll("form").should.deep.equal(['a', 'b'])
        fetchMock.calls[0].request.body.get("i1").should.equal('v1')
    })

    it('POST on form with a single control named "form" sends the form values', async function() {
        mockResponse('POST', '/test', 'Posted!')
        let form = createProcessedHTML('<form hx-post="/test"><input name="form" value="a"/><input name="i1" value="v1"/></form>')
        form.requestSubmit()
        await forRequest()
        fetchMock.calls[0].request.body.get("form").should.equal('a')
        fetchMock.calls[0].request.body.get("i1").should.equal('v1')
    })

})
