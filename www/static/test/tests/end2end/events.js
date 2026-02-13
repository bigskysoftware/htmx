describe('htmx events', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    it('htmx:before:request fires on sourceElement', async function () {
        mockResponse('GET', '/test', 'Response')
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="none"></div>')
        let firedOnSource = false
        div.addEventListener('htmx:before:request', () => firedOnSource = true)
        div.click();
        await forRequest()
        assert.isTrue(firedOnSource)
    })

    it('htmx:after:request fires on sourceElement', async function () {
        mockResponse('GET', '/test', 'Response')
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="none"></div>')
        let firedOnSource = false
        div.addEventListener('htmx:after:request', () => firedOnSource = true)
        div.click()
        await forRequest()
        assert.isTrue(firedOnSource)
    })

    it('htmx:before:swap fires on sourceElement', async function () {
        mockResponse('GET', '/test', 'Response')
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let firedOnSource = false
        div.addEventListener('htmx:before:swap', () => firedOnSource = true)
        div.click()
        await forRequest()
        assert.isTrue(firedOnSource)
    })

    it('htmx:after:swap fires on sourceElement', async function () {
        mockResponse('GET', '/test', 'Response')
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let firedOnSource = false
        div.addEventListener('htmx:after:swap', () => firedOnSource = true)
        div.click()
        await forRequest()
        assert.isTrue(firedOnSource)
    })

    it('htmx:after:swap does not fire on element removed from DOM by swap', async function () {
        mockResponse('GET', '/test', 'Response')
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="outerHTML"></div>')
        let firedOnSource = false
        div.addEventListener('htmx:after:swap', () => firedOnSource = true)
        div.click()
        await forRequest()
        assert.isFalse(firedOnSource)
    })

    it('htmx:after:swap triggers on document when element is removed from DOM by swap', async function () {
        mockResponse('GET', '/test', 'Response')
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="outerHTML"></div>')
        let firedOnDocument = false
        document.addEventListener('htmx:after:swap', (e) => {
            if (e.target === document) {
                firedOnDocument = true
            }
        }, {once: true})
        div.click()
        await forRequest()
        assert.isTrue(firedOnDocument)
    })


    it('events bubble from sourceElement to document', async function () {
        mockResponse('GET', '/test', 'Response')
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="none"></div>')
        let bubbledToDocument = false
        document.addEventListener('htmx:before:request', (e) => {
            if (e.target === div) {
                bubbledToDocument = true
            }
        }, {once: true})
        div.click()
        await forRequest()
        assert.isTrue(bubbledToDocument)
    })

    // TODO - verify shape of details in these events
})
