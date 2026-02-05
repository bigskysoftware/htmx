describe('hx-disable attribute', function() {

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })

    it('single element can be disabled w/ hx-disable', async function() {
        mockResponse('GET', '/test', 'Clicked!')
        let btn = createProcessedHTML('<button hx-get="/test" hx-disable="this">Click Me!</button>')
        btn.hasAttribute('disabled').should.equal(false)
        btn.click()
        btn.hasAttribute('disabled').should.equal(true)
        await forRequest()
        btn.hasAttribute('disabled').should.equal(false)
    })

    it('single element can be disabled w/ closest syntax', async function() {
        mockResponse('GET', '/test', 'Clicked!')
        let fieldset = createProcessedHTML('<fieldset><button id="b1" hx-get="/test" hx-disable="closest fieldset">Click Me!</button></fieldset>')
        let btn = find('#b1')
        fieldset.hasAttribute('disabled').should.equal(false)
        btn.click()
        fieldset.hasAttribute('disabled').should.equal(true)
        await forRequest()
        fieldset.hasAttribute('disabled').should.equal(false)
    })

    // settle changes made it so that await forRequest() isn't always
    // waiting for a single response (because it's so fast now lol)
    it.skip('multiple requests with same disabled elt are handled properly', async function() {
        mockResponse('GET', '/test', 'Clicked!')
        createProcessedHTML('<button id="b1" hx-get="/test" hx-disable="#b3">Click Me!</button>' +
            '<button id="b2" hx-get="/test" hx-disable="#b3">Click Me!</button>' +
            '<button id="b3">Demo</button>')

        let b1 = find('#b1')
        let b2 = find('#b2')
        let b3 = find('#b3')

        b3.hasAttribute('disabled').should.equal(false)

        b1.click()
        b3.hasAttribute('disabled').should.equal(true)

        b2.click()
        b3.hasAttribute('disabled').should.equal(true)

        // Wait for first request to complete
        await forRequest()

        b3.hasAttribute('disabled').should.equal(true)

        // Wait for second request to complete
        await forRequest()

        b3.hasAttribute('disabled').should.equal(false)
    })

    it('multiple elts can be disabled', async function() {
        mockResponse('GET', '/test', 'Clicked!')
        createProcessedHTML('<button id="b1" hx-get="/test" hx-disable="#b2, #b3">Click Me!</button>' +
            '<button id="b2">Click Me!</button>' +
            '<button id="b3">Demo</button>')

        let b1 = find('#b1')
        let b2 = find('#b2')
        let b3 = find('#b3')

        b2.hasAttribute('disabled').should.equal(false)
        b3.hasAttribute('disabled').should.equal(false)

        b1.click()
        b2.hasAttribute('disabled').should.equal(true)
        b3.hasAttribute('disabled').should.equal(true)

        await forRequest()

        b2.hasAttribute('disabled').should.equal(false)
        b3.hasAttribute('disabled').should.equal(false)
    })

    it('load trigger does not prevent disabled element working', async function() {
        mockResponse('GET', '/test', 'Loaded!')
        createProcessedHTML('<div id="d1" hx-get="/test" hx-disable="#b1" hx-trigger="load">Load Me!</div><button id="b1">Demo</button>')

        let div = find('#d1')
        let btn = find('#b1')

        div.innerHTML.should.equal('Load Me!')
        btn.hasAttribute('disabled').should.equal(true)

        await forRequest()

        div.innerHTML.should.equal('Loaded!')
        btn.hasAttribute('disabled').should.equal(false)
    })

    it('hx-disable supports multiple extended selectors', async function() {
        mockResponse('GET', '/test', 'Clicked!')
        let form = createProcessedHTML('<form hx-get="/test" hx-disable="find input[type=\'text\'], find button" hx-swap="none"><input id="i1" type="text" placeholder="Type here..."><button id="b2" type="submit">Send</button></form>')

        let i1 = find('#i1')
        let b2 = find('#b2')

        i1.hasAttribute('disabled').should.equal(false)
        b2.hasAttribute('disabled').should.equal(false)

        b2.click()
        i1.hasAttribute('disabled').should.equal(true)
        b2.hasAttribute('disabled').should.equal(true)

        await forRequest()

        i1.hasAttribute('disabled').should.equal(false)
        b2.hasAttribute('disabled').should.equal(false)
    })

    it('closest/find/next/previous handle nothing to find without exception', async function() {
        mockResponse('GET', '/test', 'Clicked!')
        createProcessedHTML('<button id="btn1" hx-get="/test" hx-disable="closest input">Click Me!</button>' +
            '<button id="btn2" hx-get="/test" hx-disable="find input">Click Me!</button>' +
            '<button id="btn3" hx-get="/test" hx-disable="next input">Click Me!</button>' +
            '<button id="btn4" hx-get="/test" hx-disable="previous input">Click Me!</button>')

        let btn1 = find('#btn1')
        let btn2 = find('#btn2')
        let btn3 = find('#btn3')
        let btn4 = find('#btn4')

        btn1.click()
        btn1.hasAttribute('disabled').should.equal(false)
        await forRequest()

        btn2.click()
        btn2.hasAttribute('disabled').should.equal(false)
        await forRequest()

        btn3.click()
        btn3.hasAttribute('disabled').should.equal(false)
        await forRequest()

        btn4.click()
        btn4.hasAttribute('disabled').should.equal(false)
        await forRequest()
    })

})
