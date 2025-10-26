describe('hx-get attribute', function() {

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })

    it('issues a GET request on click and swaps content', async function () {
        mockResponse('GET', '/test', 'Clicked!')
        let btn = initHTML('<button hx-get="/test">Click Me!</button>');
        await clickAndWait(btn)
        playground().innerText.should.equal('Clicked!')
    })

    it.skip('GET does not include surrounding data by default', async function () {
        // TODO do we want to drop this behavior except in the case of boosted links?
        mockResponse('GET', '/test', "Clicked!")
        initHTML('<form><input name="i1" value="value"/><p id="p1"><button id="b1" hx-get="/test">Click Me!</button></p></form>')
        await clickAndWait('#b1')
        lastFetch().url.should.equal("/test");
        assertTextContentIs("#p1", 'Clicked!')
    })

    it('GET on form includes its own data by default', async function () {
        mockResponse('GET', '/test', "Clicked!")
        let form = initHTML('<form hx-get="/test"><input name="i1" value="value"/><button id="b1">Click Me!</button></form>');
        await submitAndWait(form);
        playground().innerHTML.should.equal('Clicked!')
        lastFetch().url.should.equal("/test?i1=value");
    })

    it('GET on form with existing parameters works properly', async function () {
        mockResponse('GET', '/test', "Clicked!")
        let form = initHTML('<form hx-get="/test?foo=bar"><input name="i1" value="value"/><button id="b1">Click Me!</button></form>');
        await submitAndWait(form);
        playground().innerHTML.should.equal('Clicked!')
        lastFetch().url.should.equal("/test?foo=bar&i1=value");
    })

    it('GET on form with existing parameters works properly', async function () {
        mockResponse('GET', '/test', "Clicked!")
        let form = initHTML('<form hx-get="/test?foo=bar#foo"><input name="i1" value="value"/><button id="b1">Click Me!</button></form>');
        await submitAndWait(form);
        playground().innerHTML.should.equal('Clicked!')
        lastFetch().url.should.equal("/test?foo=bar&i1=value");
    })

    it('GET on form with anchor works properly and scrolls to anchor id', async function() {
        mockResponse('GET', '/test', '<div id="foo">Clicked</div>')
        let form = initHTML('<form hx-trigger="click" hx-get="/test?foo=bar#foo"><input name="i1" value="value"/><button id="b1">Click Me!</button></form>');
        await clickAndWait(form);
        playground().innerHTML.should.equal('<div id="foo">Clicked</div>')
        lastFetch().url.should.equal('/test?foo=bar&i1=value')
        // TODO: Add assertion for scroll behavior to #foo
    })

    // it('issues a GET request on click and swaps content w/ data-* prefix', function() {
    //     this.server.respondWith('GET', '/test', 'Clicked!')
    //
    //     var btn = make('<button data-hx-get="/test">Click Me!</button>')
    //     btn.click()
    //     this.server.respond()
    //     btn.innerHTML.should.equal('Clicked!')
    // })
    //
    // it('does not include a cache-busting parameter when not enabled', function() {
    //     this.server.respondWith('GET', /\/test.*/, function(xhr) {
    //         should.not.exist(getParameters(xhr)['org.htmx.cache-buster'])
    //         xhr.respond(200, {}, 'Clicked!')
    //     })
    //
    //     try {
    //         htmx.config.getCacheBusterParam = false
    //         var btn = make('<button hx-get="/test">Click Me!</button>')
    //         btn.click()
    //         this.server.respond()
    //         btn.innerHTML.should.equal('Clicked!')
    //     } finally {
    //         htmx.config.getCacheBusterParam = false
    //     }
    // })
    //
    // it('includes a cache-busting parameter when enabled w/ value "true" if no id on target', function() {
    //     this.server.respondWith('GET', /\/test.*/, function(xhr) {
    //         getParameters(xhr)['org.htmx.cache-buster'].should.equal('true')
    //         xhr.respond(200, {}, 'Clicked!')
    //     })
    //
    //     try {
    //         htmx.config.getCacheBusterParam = true
    //         var btn = make('<button hx-get="/test">Click Me!</button>')
    //         btn.click()
    //         this.server.respond()
    //         btn.innerHTML.should.equal('Clicked!')
    //     } finally {
    //         htmx.config.getCacheBusterParam = false
    //     }
    // })
    //
    // it('includes a cache-busting parameter when enabled w/ the id of the target if there is one', function() {
    //     this.server.respondWith('GET', /\/test.*/, function(xhr) {
    //         getParameters(xhr)['org.htmx.cache-buster'].should.equal('foo')
    //         xhr.respond(200, {}, 'Clicked!')
    //     })
    //
    //     try {
    //         htmx.config.getCacheBusterParam = true
    //         var btn = make('<button hx-get="/test" id="foo">Click Me!</button>')
    //         btn.click()
    //         this.server.respond()
    //         btn.innerHTML.should.equal('Clicked!')
    //     } finally {
    //         htmx.config.getCacheBusterParam = false
    //     }
    // })
})
