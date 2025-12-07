describe('hx-vals attribute', function() {

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })

    it('basic hx-vals works with HCON', async function() {
        mockResponse('POST', '/vars', 'Clicked!')
        let div = createProcessedHTML("<div hx-post='/vars' hx-vals='i1:\"test\"'></div>")
        div.click()
        await forRequest()
        fetchMock.calls[0].request.body.get("i1").should.equal('test');
        div.innerHTML.should.equal('Clicked!')
    })

    it('basic hx-vals works without braces', async function() {
        mockResponse('POST', '/vars', 'Clicked!')
        let div = createProcessedHTML("<div hx-post='/vars' hx-vals='\"i1\":\"test\"'></div>")
        div.click()
        await forRequest()
        fetchMock.calls[0].request.body.get("i1").should.equal('test');
        div.innerHTML.should.equal('Clicked!')
    })

    it('basic hx-vals works with braces', async function() {
        mockResponse('POST', '/vars', 'Clicked!')
        let div = createProcessedHTML('<div hx-post="/vars" hx-vals=\'{"i1":"test"}\'></div>')
        div.click()
        await forRequest()
        fetchMock.calls[0].request.body.get("i1").should.equal('test');
        div.innerHTML.should.equal('Clicked!')
    })

    it('multiple hx-vals works', async function() {
        mockResponse('POST', '/vars', 'Clicked!')
        let div = createProcessedHTML('<div hx-post="/vars" hx-vals=\'{"v1":"test", "v2":42}\'></div>')
        div.click()
        await forRequest()
        fetchMock.calls[0].request.body.get("v1").should.equal('test');
        fetchMock.calls[0].request.body.get("v2").should.equal('42');
        div.innerHTML.should.equal('Clicked!')
    })

    it('Dynamic hx-vals using spread operator works', async function() {
        mockResponse('POST', '/vars', 'Clicked!')
        window.foo = function() {
            return { v1: 'test', v2: 42 }
        }
        let div = createProcessedHTML("<div hx-post='/vars' hx-vals='js:{...foo()}'></div>")
        div.click()
        await forRequest()
        fetchMock.calls[0].request.body.get("v1").should.equal('test');
        fetchMock.calls[0].request.body.get("v2").should.equal('42');
        div.innerHTML.should.equal('Clicked!')
        delete window.foo
    })

    it('hx-vals can be inherited from parents', async function() {
        mockResponse('POST', '/vars', 'Clicked!')
        createProcessedHTML("<div hx-vals:inherited='\"i1\":\"test\"'><div id='d1' hx-post='/vars'></div></div>")
        let div = find('#d1')
        div.click()
        await forRequest()
        fetchMock.calls[0].request.body.get("i1").should.equal('test');
        div.innerHTML.should.equal('Clicked!')
    })

    it('child hx-vals can override parent', async function() {
        mockResponse('POST', '/vars', 'Clicked!')
        createProcessedHTML("<div hx-vals:inherited='\"i1\":\"test\"'><div id='d1' hx-post='/vars' hx-vals='\"i1\":\"override\"'></div></div>")
        let div = find('#d1')
        div.click()
        await forRequest()
        fetchMock.calls[0].request.body.get("i1").should.equal('override');
        div.innerHTML.should.equal('Clicked!')
    })

    it('hx-vals overrides input values', async function() {
        mockResponse('POST', '/vals', 'Submitted')
        let form = createProcessedHTML('<form hx-post="/vals" hx-vals=\'{"i1":"test"}\'>' +
            '<input name="i1" value="original"/>' +
            '<button>Submit</button>' +
            '</form>')
        form.querySelector('button').click()
        await forRequest()
        fetchMock.calls[0].request.body.get("i1").should.equal('test');
        form.innerHTML.should.equal('Submitted')
    })

    it('computed values using event in js: prefix', async function() {
        mockResponse('POST', '/vars', 'Clicked!')
        let div = createProcessedHTML('<div id="myDiv" hx-post="/vars" hx-vals=\'js:{i1: event.target.id}\'></div>')
        div.click()
        await forRequest()
        fetchMock.calls[0].request.body.get("i1").should.equal('myDiv');
        div.innerHTML.should.equal('Clicked!')
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
