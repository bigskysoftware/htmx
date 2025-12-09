describe('hx-delete attribute', function() {

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })

    it('issues a DELETE request', async function() {
        mockResponse('DELETE', '/test', 'Deleted!')
        let btn = createProcessedHTML('<button hx-delete="/test">Click Me!</button>')
        btn.click()
        await forRequest()
        fetchMock.calls[0].request.method.should.equal('DELETE');
        btn.innerHTML.should.equal('Deleted!')
    })

})