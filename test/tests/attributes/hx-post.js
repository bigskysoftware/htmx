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

})