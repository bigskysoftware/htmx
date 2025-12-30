describe('hx-get attribute', function() {

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })

    it('issues a GET request on click and swaps content', async function () {
        mockResponse('GET', '/test', 'Clicked!')
        let btn = createProcessedHTML('<button hx-get="/test">Click Me!</button>');
        btn.click()
        await forRequest()
        playground().innerText.should.equal('Clicked!')
    })

    it.skip('GET does not include surrounding data by default', async function () {
        // TODO do we want to drop this behavior except in the case of boosted links?
        mockResponse('GET', '/test', "Clicked!")
        createProcessedHTML('<form><input name="i1" value="value"/><p id="p1"><button id="b1" hx-get="/test">Click Me!</button></p></form>')
        find('#b1').click()
        await forRequest()
        lastFetch().url.should.equal("/test");
        assertTextContentIs("#p1", 'Clicked!')
    })

    it('GET on form includes its own data by default', async function () {
        mockResponse('GET', '/test', "Clicked!")
        let form = createProcessedHTML('<form hx-get="/test" hx-swap="outerHTML"><input name="i1" value="value"/><button id="b1">Click Me!</button></form>');
        form.requestSubmit()
        await forRequest();
        playground().innerHTML.should.equal('Clicked!')
        lastFetch().url.should.equal("/test?i1=value");
    })

    it('GET on form with existing parameters works properly', async function () {
        mockResponse('GET', '/test', "Clicked!")
        let form = createProcessedHTML('<form hx-get="/test?foo=bar" hx-swap="outerHTML"><input name="i1" value="value"/><button id="b1">Click Me!</button></form>');
        form.requestSubmit()
        await forRequest();
        playground().innerHTML.should.equal('Clicked!')
        console.log("*********", lastFetch().url, "/test?foo=bar&i1=value")
        lastFetch().url.should.equal("/test?foo=bar&i1=value");
    })

    it('GET on form with existing parameters works properly', async function () {
        mockResponse('GET', '/test', "Clicked!")
        let form = createProcessedHTML('<form hx-get="/test?foo=bar#foo" hx-swap="outerHTML"><input name="i1" value="value"/><button id="b1">Click Me!</button></form>');
        form.requestSubmit()
        await forRequest();
        playground().innerHTML.should.equal('Clicked!')
        lastFetch().url.should.equal("/test?foo=bar&i1=value");
    })

    it('GET on form with anchor works properly and scrolls to anchor id', async function() {
        mockResponse('GET', '/test', '<div id="foo">Clicked</div>')
        let form = createProcessedHTML('<form hx-trigger="click" hx-get="/test?foo=bar#foo" hx-swap="outerHTML"><input name="i1" value="value"/><button id="b1">Click Me!</button></form>');
        form.click()
        await forRequest();
        playground().innerHTML.should.equal('<div id="foo" class="">Clicked</div>')
        lastFetch().url.should.equal('/test?foo=bar&i1=value')
        // TODO: Add assertion for scroll behavior to #foo
    })

    it('GET merges URL params with form data - form data overwrites URL params', async function () {
        mockResponse('GET', '/test', 'Success')
        let form = createProcessedHTML('<form hx-get="/test?foo=url&bar=keep" hx-swap="outerHTML"><input name="foo" value="form"/><button>Submit</button></form>');
        form.requestSubmit()
        await forRequest();
        lastFetch().url.should.equal('/test?bar=keep&foo=form');
    })

    it('GET preserves URL params not in form data', async function () {
        mockResponse('GET', '/test', 'Success')
        let form = createProcessedHTML('<form hx-get="/test?a=1&b=2&c=3" hx-swap="outerHTML"><input name="b" value="new"/><button>Submit</button></form>');
        form.requestSubmit()
        await forRequest();
        lastFetch().url.should.equal('/test?a=1&c=3&b=new');
    })

    it('GET handles array parameters correctly when merging', async function () {
        mockResponse('GET', '/test', 'Success')
        let form = createProcessedHTML('<form hx-get="/test?tags=url1&tags=url2" hx-swap="outerHTML"><input name="tags" value="form1"/><input name="tags" value="form2"/><button>Submit</button></form>');
        form.requestSubmit()
        await forRequest();
        lastFetch().url.should.equal('/test?tags=form1&tags=form2');
    })

    it('GET with no URL params just adds form data', async function () {
        mockResponse('GET', '/test', 'Success')
        let form = createProcessedHTML('<form hx-get="/test" hx-swap="outerHTML"><input name="foo" value="bar"/><button>Submit</button></form>');
        form.requestSubmit()
        await forRequest();
        lastFetch().url.should.equal('/test?foo=bar');
    })

    it('GET with URL params but no form data keeps URL params', async function () {
        mockResponse('GET', '/test', 'Success')
        let form = createProcessedHTML('<form hx-get="/test?foo=bar&baz=qux" hx-swap="outerHTML"><button>Submit</button></form>');
        form.requestSubmit()
        await forRequest();
        lastFetch().url.should.equal('/test?foo=bar&baz=qux');
    })

    it('GET merges params with anchor - form data overwrites, anchor stripped from request', async function () {
        mockResponse('GET', '/test', 'Success')
        let form = createProcessedHTML('<form hx-get="/test?foo=url&keep=yes#section" hx-swap="outerHTML"><input name="foo" value="form"/><button>Submit</button></form>');
        form.requestSubmit()
        await forRequest();
        lastFetch().url.should.equal('/test?keep=yes&foo=form');
    })

})
