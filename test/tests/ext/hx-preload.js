describe('hx-preload attribute', function() {

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })

    it('preloads on specified event', async function () {
        mockResponse('GET', '/test', 'Preloaded')
        let btn = createProcessedHTML('<button hx-get="/test" hx-preload="mouseenter">Click</button>');
        btn.dispatchEvent(new Event('mouseenter'))
        await htmx.timeout(20)
        assert.isDefined(btn._htmx.preload)
    })

    it('does not preload POST requests', async function () {
        mockResponse('POST', '/test', 'Posted')
        let btn = createProcessedHTML('<button hx-post="/test" hx-preload="mouseenter">Click</button>');
        btn.dispatchEvent(new Event('mouseenter'))
        await htmx.timeout(20)
        assert.isUndefined(btn._htmx.preload)
    })

    it('uses default 5s timeout', async function () {
        mockResponse('GET', '/test', 'Response')
        let btn = createProcessedHTML('<button hx-get="/test" hx-preload="mouseenter">Click</button>');
        btn.dispatchEvent(new Event('mouseenter'))
        await htmx.timeout(20)
        assert.isTrue(btn._htmx.preload.expiresAt > Date.now() + 4000)
    })

    it('respects custom timeout', async function () {
        mockResponse('GET', '/test', 'Response')
        let btn = createProcessedHTML('<button hx-get="/test" hx-preload="mouseenter timeout:100ms">Click</button>');
        btn.dispatchEvent(new Event('mouseenter'))
        await htmx.timeout(20)
        assert.isTrue(btn._htmx.preload.expiresAt < Date.now() + 200)
    })

    it('skips duplicate preload events', async function () {
        mockResponse('GET', '/test', 'Response')
        let btn = createProcessedHTML('<button hx-get="/test" hx-preload="mouseenter">Click</button>');
        btn.dispatchEvent(new Event('mouseenter'))
        await htmx.timeout(10)
        let firstPreload = btn._htmx.preload
        btn.dispatchEvent(new Event('mouseenter'))
        assert.equal(btn._htmx.preload, firstPreload)
    })

    it('works with different event types', async function () {
        mockResponse('GET', '/test', 'Response')
        let btn = createProcessedHTML('<button hx-get="/test" hx-preload="focus">Click</button>');
        btn.dispatchEvent(new Event('focus'))
        await htmx.timeout(20)
        assert.isDefined(btn._htmx.preload)
    })

    it('builds URL with form params', async function () {
        mockResponse('GET', '/test?name=test', 'Response')
        let form = createProcessedHTML('<form><input name="name" value="test"><button hx-get="/test" hx-preload="mouseenter">Click</button></form>');
        let btn = form.querySelector('button')
        btn.dispatchEvent(new Event('mouseenter'))
        await htmx.timeout(20)
        assert.equal(btn._htmx.preload.action, '/test?name=test')
    })
})
