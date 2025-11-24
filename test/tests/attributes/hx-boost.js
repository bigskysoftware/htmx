describe('hx-boost attribute', async function() {

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest()
    })

    it('handles basic anchor properly', async function () {
        mockResponse('GET', '/test', 'Boosted')
        createProcessedHTML('<div hx-target:inherited="this" hx-swap:inherited="outerHTML" hx-boost:inherited="true"><a id="a1" href="/test">Foo</a></div>')
        find('#a1').click()
        await forRequest()
        playground().innerHTML.should.equal('Boosted')
    })

    it('handles basic form post properly', async function () {
        mockResponse('POST', '/test', 'Boosted')
        createProcessedHTML('<div hx-target:inherited="this" hx-swap:inherited="outerHTML" hx-boost:inherited="true"><form id="f1" action="/test" method="post"><button id="b1">Submit</button></form></div>')
        find('#b1').click()
        await forRequest()
        playground().innerHTML.should.equal('Boosted')
    })

    it('handles basic form post with button formaction properly', async function () {
        mockResponse('POST', '/test', 'Boosted')
        createProcessedHTML('<div hx-target:inherited="this" hx-swap:inherited="outerHTML" hx-boost:inherited="true"><form id="f1" action="/bad" method="post"><button id="b1" formaction="/test">Submit</button></form></div>')
        find('#b1').click()
        await forRequest()
        playground().innerHTML.should.equal('Boosted')
    })

    it('handles basic form post with button formmethod properly', async function() {
        mockResponse('POST', '/test', 'Boosted')
        createProcessedHTML('<div hx-target:inherited="this" hx-swap:inherited="outerHTML" hx-boost:inherited="true"><form id="f1" action="/test" method="get"><button id="b1" formmethod="post">Submit</button></form></div>')
        find('#b1').click()
        await forRequest()
        playground().innerHTML.should.equal('Boosted')
    })

    it('handles basic form post with button formmethod & formaction properly', async function() {
        mockResponse('POST', '/test', 'Boosted')
        createProcessedHTML('<div hx-target:inherited="this" hx-swap:inherited="outerHTML" hx-boost:inherited="true"><form id="f1" action="/bad" method="get"><button id="b1" formmethod="post" formaction="/test">Submit</button></form></div>')
        find('#b1').click()
        await forRequest()
        playground().innerHTML.should.equal('Boosted')
    })

    it('handles basic form post properly w/ explicit action', async function() {
        mockResponse('POST', '/test', 'Boosted')
        createProcessedHTML('<div hx-target:inherited="this" hx-swap:inherited="outerHTML"><form id="f1" action="/test" method="post"  hx-boost="true"></form></div>')
        find('#f1').requestSubmit()
        await forRequest()
        playground().innerHTML.should.equal('Boosted')
    })

    it('handles basic form get properly', async function() {
        debug(this)
        mockResponse('GET', '/test', 'Boosted')
        createProcessedHTML('<div hx-target:inherited="this" hx-swap:inherited="outerHTML" hx-boost:inherited="true"><form id="f1" action="/test" method="get"><button id="b1">Submit</button></form></div>')
        find('#b1').click()
        await forRequest()
        playground().innerHTML.should.equal('Boosted')
    })

    it('handles basic form with no explicit method property', async function() {
        mockResponse('GET', '/test', 'Boosted')
        createProcessedHTML('<div hx-target:inherited="this" hx-swap:inherited="outerHTML" hx-boost:inherited="true"><form id="f1" action="/test"><button id="b1">Submit</button></form></div>')
        find("#f1").getAttribute("data-htmx-powered").should.equal('true')
        find('#b1').click()
        await forRequest()
        playground().innerHTML.should.equal('Boosted')
    })

    it('does not boost forms with method="dialog"', async function() {
        mockResponse('GET', '/test', 'Boosted')
        createProcessedHTML('<div hx-boost:inherited="true"><form id="f1" action="/test" method="dialog"><button id="b1">close</button></form></div>')
        find('#b1').click()
        fetchMock.calls.length.should.equal(0)
    })

    it('does not boost forms with buttons with formmethod="dialog"', async function() {
        mockResponse('GET', '/test', 'Boosted')
        createProcessedHTML('<div hx-boost:inherited="true"><form id="f1" action="/test" method="get"><button formmethod="dialog" id="b1">close</button></form></div>')
        find('#b1').click()
        fetchMock.calls.length.should.equal(0)
    })

    it('hx-boost with advanced syntax applies swap config', async function() {
        mockResponse('GET', '/test', 'Clicked')
        createProcessedHTML('<a hx-boost="swap:outerHTML" hx-target="this" id="a1" href="/test">Click Me</a>')
        find('#a1').click()
        await forRequest()
        should.equal(document.querySelector('#a1'), null)
    })

    it('hx-boost with advanced syntax applies target config', async function() {
        mockResponse('GET', '/test', 'New Content')
        createProcessedHTML('<div id="target">Old</div><a hx-boost="target:#target" id="a1" href="/test">Click</a>')
        find('#a1').click()
        await forRequest()
        find('#target').innerHTML.should.equal('New Content')
    })

    it('hx-boost with advanced syntax applies select config', async function() {
        mockResponse('GET', '/test', '<div><span id="keep">Keep</span><span>Ignore</span></div>')
        createProcessedHTML('<div id="result"></div><a hx-boost="select:#keep" hx-target="#result" id="a1" href="/test">Click</a>')
        find('#a1').click()
        await forRequest()
        find('#result').innerHTML.should.contain('Keep')
        find('#result').innerHTML.should.not.contain('Ignore')
    })

    it('hx-boost with multiple advanced configs', async function() {
        mockResponse('GET', '/test', '<div id="main"><span id="result">Success</span></div>')
        createProcessedHTML('<div id="main">Old</div><a hx-boost="swap:outerHTML target:#main select:#result" id="a1" href="/test">Click</a>')
        find('#a1').click()
        await forRequest()
        should.equal(document.querySelector('#main'), null)
        find('#result').innerHTML.should.equal('Success')
    })

    it('explicit attributes override boost config', async function() {
        mockResponse('GET', '/test', 'Clicked')
        createProcessedHTML('<a hx-boost="swap:outerHTML" hx-swap="innerHTML" hx-target="this" id="a1" href="/test">Click</a>')
        find('#a1').click()
        await forRequest()
        should.not.equal(document.querySelector('#a1'), null)
        find('#a1').innerHTML.should.equal('Clicked')
    })

    it('hx-boost true still works as before', async function() {
        mockResponse('GET', '/test', 'Clicked')
        createProcessedHTML('<div id="result"></div><a hx-boost="true" hx-target="#result" id="a1" href="/test">Click Me</a>')
        find('#a1').click()
        await forRequest()
        find('#result').innerHTML.should.equal('Clicked')
    })

    // // it('overriding default swap style does not effect boosting', async function() {
    // //     htmx.config.defaultSwapStyle = 'afterend'
    // //     try {
    // //         mockResponse('GET', '/test', 'Boosted')
    // //         var a = make('<a hx-target:inherited="this" hx-boost="true" id="a1" href="/test">Foo</a>')
    // //         a.click()
    // //         this.server.respond()
    // //         a.innerHTML.should.equal('Boosted')
    // //     } finally {
    // //         htmx.config.defaultSwapStyle = 'innerHTML'
    // //     }
    // // })
    //
    // it('anchors w/ explicit targets are not boosted', async function() {
    //     mockResponse('GET', '/test', 'Boosted')
    //     initHTML('<a hx-target="this" hx-boost="true" id="a1" href="/test" target="_blank">Foo</a>')
    //     find('#a1').click()
    //     fetchMock.calls.length.should.equal(0)
    // })

    // it('includes an HX-Boosted Header', async function() {
    //     mockResponse('GET', '/test', "Boosted!")
    //     createProcessedHTML('<a hx-boost="true" hx-target="this" hx-swap="outerHTML" href="/test">Click Me!</a>')
    //     find("a").click()
        await forRequest()
    //     fetchMock.getLastCall().request.headers["HX-Boosted"].should.equal("true")
    //     fetchMock.getLastCall().request.headers["HX-Request"].should.equal("true")
    //     playground().innerHTML.should.equal('Boosted!')
    // })

    // it('form get w/ search params in action property excludes search params', async function() {
    //     mockResponse('GET', /\/test.*/, async function(xhr) {
    //         should.equal(undefined, getParameters(xhr).foo)
    //         xhr.respond(200, {}, 'Boosted!')
    //     })
    //
    //     initHTML('<div hx-target:inherited="this" hx-boost="true"><form id="f1" action="/test?foo=bar" method="get"><button id="b1">Submit</button></form></div>')
    //      find('#b1').click()
        await forRequest()
    //     playground().innerHTML.should.equal('Boosted!')
    // })
    //
    // it('form post w/ query params in action property uses full url', async function() {
    //     mockResponse('POST', /\/test.*/, async function(xhr) {
    //         should.equal(undefined, getParameters(xhr).foo)
    //         xhr.respond(200, {}, 'Boosted!')
    //     })
    //     initHTML('<div hx-target:inherited="this" hx-boost="true"><form id="f1" action="/test?foo=bar" method="post"><button id="b1">Submit</button></form></div>')
    //      find('#b1').click()
        await forRequest()
    //     playground().innerHTML.should.equal('Boosted!')
    // })
    //
    // it('form get with an unset action properly submits', async function() {
    //     mockResponse('GET', /\/*/, async function(xhr) {
    //         xhr.respond(200, {}, 'Boosted!')
    //     })
    //
    //     initHTML('<div hx-target:inherited="this" hx-boost="true"><form id="f1" method="get"><button id="b1">Submit</button></form></div>')
    //      find('#b1').click()
        await forRequest()
    //     playground().innerHTML.should.equal('Boosted!')
    // })
    //
    // it('form get with no action properly clears existing parameters on submit', async function() {
    //     /// add a foo=bar to the current url
    //     var path = location.href
    //     if (!path.includes('foo=bar')) {
    //         if (!path.includes('?')) {
    //             path += '?foo=bar'
    //         } else {
    //             path += '&foo=bar'
    //         }
    //     }
    //     history.replaceState({ htmx: true }, '', path)
    //
    //     mockResponse('GET', /\/*/, async function(xhr) {
    //         // foo should not be present because the form is a get with no action
    //         should.equal(undefined, getParameters(xhr).foo)
    //         xhr.respond(200, {}, 'Boosted!')
    //     })
    //
    //     initHTML('<div hx-target:inherited="this" hx-boost="true"><form id="f1" method="get"><button id="b1">Submit</button></form></div>')
    //      find('#b1').click()
        await forRequest()
    //     playground().innerHTML.should.equal('Boosted!')
    // })
    //
    // it('form get with an empty action properly clears existing parameters on submit', async function() {
    //     /// add a foo=bar to the current url
    //     var path = location.href
    //     if (!path.includes('foo=bar')) {
    //         if (!path.includes('?')) {
    //             path += '?foo=bar'
    //         } else {
    //             path += '&foo=bar'
    //         }
    //     }
    //     history.replaceState({ htmx: true }, '', path)
    //
    //     mockResponse('GET', /\/*/, async function(xhr) {
    //         // foo should not be present because the form is a get with no action
    //         should.equal(undefined, getParameters(xhr).foo)
    //         xhr.respond(200, {}, 'Boosted!')
    //     })
    //
    //     initHTML('<div hx-target:inherited="this" hx-boost="true"><form id="f1" action="" method="get"><button id="b1">Submit</button></form></div>')
    //      find('#b1').click()
        await forRequest()
    //     playground().innerHTML.should.equal('Boosted!')
    // })
    //
    // if (/headlesschrome/i.test(navigator.userAgent)) {
    //     it('ctrlKey mouse click does not boost', async function() {
    //         // Test only works well in playwright with chome for code coverage as otherwise it opens a new tab breaking things
    //         mockResponse('GET', '/test', 'Boosted')
    //         initHTML('<div hx-target:inherited="this" hx-boost="true"><a id="a1" href="/test">Foo</a></div>')
    //         var a = byId('a1')
    //         var evt = new MouseEvent('click', { ctrlKey: true })
    //         a.dispatchEvent(evt)
    //         this.server.respond()
    //         playground().innerHTML.should.not.equal('Boosted')
    //     })
    // }

})
