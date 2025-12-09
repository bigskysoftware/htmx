describe('hx-put attribute', function() {

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })

    it('issues a PUT request', async function() {
        mockResponse('PUT', '/test', 'Put!')
        let btn = createProcessedHTML('<button hx-put="/test">Click Me!</button>')
        btn.click()
        await forRequest()
        fetchMock.calls[0].request.method.should.equal('PUT');
        btn.innerHTML.should.equal('Put!')
    })

})