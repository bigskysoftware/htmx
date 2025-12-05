describe('hx-indicator attribute', function() {

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })

    it('adds htmx-request class to element with no explicit indicator', async function() {
        mockResponse('GET', '/test', 'Clicked!')
        let btn = createProcessedHTML('<button hx-get="/test">Click Me!</button>')
        btn.click()
        btn.classList.contains('htmx-request').should.equal(true)
        await forRequest()
        btn.classList.contains('htmx-request').should.equal(false)
    })

    it('adds htmx-request class to explicit indicators', async function() {
        mockResponse('GET', '/test', 'Clicked!')
        createProcessedHTML('<button id="btn" hx-get="/test" hx-indicator="#a1, #a2">Click Me!</button><a id="a1"></a><a id="a2"></a>')
        let btn = find('#btn')
        let a1 = find('#a1')
        let a2 = find('#a2')
        btn.click()
        btn.classList.contains('htmx-request').should.equal(false)
        a1.classList.contains('htmx-request').should.equal(true)
        a2.classList.contains('htmx-request').should.equal(true)
        await forRequest()
        btn.classList.contains('htmx-request').should.equal(false)
        a1.classList.contains('htmx-request').should.equal(false)
        a2.classList.contains('htmx-request').should.equal(false)
    })

    it('supports closest syntax in hx-indicator', async function() {
        mockResponse('GET', '/test', 'Clicked!')
        let div = createProcessedHTML('<div id="d1"><button id="b1" hx-get="/test" hx-indicator="closest div">Click Me!</button></div>')
        let btn = find('#b1')
        btn.click()
        btn.classList.contains('htmx-request').should.equal(false)
        div.classList.contains('htmx-request').should.equal(true)
        await forRequest()
        btn.classList.contains('htmx-request').should.equal(false)
        div.classList.contains('htmx-request').should.equal(false)
    })

    it('supports this syntax in hx-indicator', async function() {
        mockResponse('GET', '/test', 'Clicked!')
        let div = createProcessedHTML('<div id="d1" hx-indicator:inherited="this"><button id="b1" hx-get="/test">Click Me!</button></div>')
        let btn = find('#b1')
        btn.click()
        btn.classList.contains('htmx-request').should.equal(false)
        div.classList.contains('htmx-request').should.equal(true)
        await forRequest()
        btn.classList.contains('htmx-request').should.equal(false)
        div.classList.contains('htmx-request').should.equal(false)
    })

    it('supports append to expand parent hx-indicator', async function() {
        mockResponse('GET', '/test', 'Clicked!')
        createProcessedHTML('<div hx-indicator:inherited="#a1"><button id="btn" hx-get="/test" hx-indicator:append="#a2">Click Me!</button></div><a id="a1"></a><a id="a2"></a>')
        let btn = find('#btn')
        let a1 = find('#a1')
        let a2 = find('#a2')
        btn.click()
        btn.classList.contains('htmx-request').should.equal(false)
        a1.classList.contains('htmx-request').should.equal(true)
        a2.classList.contains('htmx-request').should.equal(true)
        await forRequest()
        btn.classList.contains('htmx-request').should.equal(false)
        a1.classList.contains('htmx-request').should.equal(false)
        a2.classList.contains('htmx-request').should.equal(false)
    })

})