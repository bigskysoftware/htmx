describe('hx-headers attribute', function() {

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })

    it('basic hx-headers works', async function() {
        mockResponse('POST', '/vars', 'Clicked!')
        let div = createProcessedHTML("<div hx-post='/vars' hx-headers='\"i1\":\"test\"'></div>")
        div.click()
        await forRequest()
        fetchMock.calls[0].request.headers.i1.should.equal('test');
        div.innerHTML.should.equal('Clicked!')
    })

    it('basic hx-headers works with braces', async function() {
        mockResponse('POST', '/vars', 'Clicked!')
        let div = createProcessedHTML('<div hx-post="/vars" hx-headers=\'{"i1":"test"}\'></div>')
        div.click()
        await forRequest()
        fetchMock.calls[0].request.headers.i1.should.equal('test');
        div.innerHTML.should.equal('Clicked!')
    })

    it('multiple hx-headers works', async function() {
        mockResponse('POST', '/vars', 'Clicked!')
        let div = createProcessedHTML('<div hx-post="/vars" hx-headers=\'{"v1":"test", "v2":"42"}\'></div>')
        div.click()
        await forRequest()
        fetchMock.calls[0].request.headers.v1.should.equal('test');
        fetchMock.calls[0].request.headers.v2.should.equal('42');
        div.innerHTML.should.equal('Clicked!')
    })

    it('hx-headers can be inherited from parents', async function() {
        mockResponse('POST', '/vars', 'Clicked!')
        createProcessedHTML("<div hx-headers:inherited='\"i1\":\"test\"'><div id='d1' hx-post='/vars'></div></div>")
        let div = find('#d1')
        div.click()
        await forRequest()
        fetchMock.calls[0].request.headers.i1.should.equal('test');
        div.innerHTML.should.equal('Clicked!')
    })

    it('child hx-headers can override parent', async function() {
        mockResponse('POST', '/vars', 'Clicked!')
        createProcessedHTML("<div hx-headers:inherited='\"i1\":\"test\"'><div id='d1' hx-headers='\"i1\":\"best\"' hx-post='/vars'></div></div>")
        let div = find('#d1')
        div.click()
        await forRequest()
        fetchMock.calls[0].request.headers.i1.should.equal('best');
        div.innerHTML.should.equal('Clicked!')
    })

    it('basic hx-headers javascript: works', async function() {
        mockResponse('POST', '/vars', 'Clicked!')
        let div = createProcessedHTML('<div hx-post="/vars" hx-headers="javascript:i1:\'test\'"></div>')
        div.click()
        await forRequest()
        fetchMock.calls[0].request.headers.i1.should.equal('test');
        div.innerHTML.should.equal('Clicked!')
    })

    it('hx-headers works with braces and javascript:', async function() {
        mockResponse('POST', '/vars', 'Clicked!')
        let div = createProcessedHTML('<div hx-post="/vars" hx-headers="javascript:{i1:\'test\'}"></div>')
        div.click()
        await forRequest()
        fetchMock.calls[0].request.headers.i1.should.equal('test');
        div.innerHTML.should.equal('Clicked!')
    })

    it('multiple hx-headers works with javascript', async function() {
        mockResponse('POST', '/vars', 'Clicked!')
        let div = createProcessedHTML('<div hx-post="/vars" hx-headers="javascript:v1:\'test\', v2:42"></div>')
        div.click()
        await forRequest()
        fetchMock.calls[0].request.headers.v1.should.equal('test');
        fetchMock.calls[0].request.headers.v2.should.equal('42');
        div.innerHTML.should.equal('Clicked!')
    })

    it('hx-headers can be inherited from parents with javascript', async function() {
        mockResponse('POST', '/vars', 'Clicked!')
        createProcessedHTML('<div hx-headers:inherited="javascript:i1:\'test\'"><div id="d1" hx-post="/vars"></div></div>')
        let div = find('#d1')
        div.click()
        await forRequest()
        fetchMock.calls[0].request.headers.i1.should.equal('test');
        div.innerHTML.should.equal('Clicked!')
    })

    it('child hx-headers can override parent with javascript', async function() {
        mockResponse('POST', '/vars', 'Clicked!')
        createProcessedHTML('<div hx-headers:inherited="javascript:i1:\'test\'"><div id="d1" hx-headers="javascript:i1:\'best\'" hx-post="/vars"></div></div>')
        let div = find('#d1')
        div.click()
        await forRequest()
        fetchMock.calls[0].request.headers.i1.should.equal('best');
        div.innerHTML.should.equal('Clicked!')
    })

})
