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
        playground().innerHTML.should.equal('<div id="foo">Clicked</div>')
        lastFetch().url.should.equal('/test?foo=bar&i1=value')
        // TODO: Add assertion for scroll behavior to #foo
    })

})
