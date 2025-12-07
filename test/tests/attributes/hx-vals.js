describe('hx-vals attribute', function() {

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })

    it('hx-vals:append merges JSON objects correctly', async function() {
        mockResponse('POST', '/test', 'Success')
        const div = createProcessedHTML(
            '<div hx-vals:inherited=\'{"a":1}\'>' +
            '  <button hx-post="/test" hx-vals:append=\'{"b":"hi"}\'>Click</button>' +
            '</div>'
        );
        const button = div.querySelector('button');
        button.click();
        await forRequest()
        fetchMock.calls[0].request.body.get('a').should.equal('1');
        fetchMock.calls[0].request.body.get('b').should.equal('hi');
    });

})
