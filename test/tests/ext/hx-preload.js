describe('hx-preload attribute', function() {

    let extBackup;

    before(async () => {
        extBackup = backupExtensions();
        clearExtensions();
        let script = document.createElement('script');
        script.src = '../src/ext/hx-preload.js';
        await new Promise(resolve => {
            script.onload = resolve;
            document.head.appendChild(script);
        });
    })

    after(() => {
        restoreExtensions(extBackup);
    })

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })

    it('preloads on mousedown with bare attribute on hx-get element', async function () {
        mockResponse('GET', '/test', 'Preloaded')
        let btn = createProcessedHTML('<button hx-get="/test" hx-preload>Click</button>');
        btn.dispatchEvent(new Event('mousedown'))
        await htmx.timeout(20)
        assert.isDefined(btn._htmx.preload)
    })

    it('preloads on mousedown with bare attribute on boosted anchor', async function () {
        mockResponse('GET', '/test', 'Preloaded')
        let div = createProcessedHTML('<div hx-boost:inherited="true"><a id="a1" href="/test" hx-preload>Link</a></div>');
        let a = div.querySelector('#a1')
        a.dispatchEvent(new Event('mousedown'))
        await htmx.timeout(20)
        assert.isDefined(a._htmx.preload)
    })

    it('does not preload with bare attribute on non-hx-get element', async function () {
        mockResponse('POST', '/test', 'Posted')
        let btn = createProcessedHTML('<button hx-post="/test" hx-preload>Click</button>');
        btn.dispatchEvent(new Event('mousedown'))
        await htmx.timeout(20)
        assert.isUndefined(btn._htmx?.preload)
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

    it('works with multiple event types', async function () {
        mockResponse('GET', '/test', 'Response')
        let btn = createProcessedHTML('<button hx-get="/test" hx-preload="focus, foo">Click</button>');
        btn.dispatchEvent(new Event('foo'))
        await htmx.timeout(20)
        assert.isDefined(btn._htmx.preload)
    })

    it('auto-preloads boosted anchors by default', async function () {
        mockResponse('GET', '/test', 'Preloaded')
        let div = createProcessedHTML('<div hx-boost:inherited="true"><a id="a1" href="/test">Link</a></div>');
        let a = div.querySelector('#a1')
        a.dispatchEvent(new Event('mousedown'))
        await htmx.timeout(20)
        assert.isDefined(a._htmx.preload)
    })

    it('does not auto-preload boosted anchors when autoBoost is false', async function () {
        htmx.config.preload = { autoBoost: false }
        try {
            mockResponse('GET', '/test', 'Preloaded')
            let div = createProcessedHTML('<div hx-boost:inherited="true"><a id="a1" href="/test">Link</a></div>');
            let a = div.querySelector('#a1')
            a.dispatchEvent(new Event('mousedown'))
            await htmx.timeout(20)
            assert.isUndefined(a._htmx?.preload)
        } finally {
            delete htmx.config.preload
        }
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
