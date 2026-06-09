describe('process() unit tests', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    it('initializes element with hx-get', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        htmx.process(div)
        assert.isTrue(div.hasAttribute('data-htmx-powered'))
    })

    it('initializes descendant elements', function () {
        let container = createProcessedHTML('<div><button hx-get="/test"></button></div>')
        htmx.process(container)
        let button = container.querySelector('button')
        assert.isTrue(button.hasAttribute('data-htmx-powered'))
    })

    it('initializes boosted elements', function () {
        let a = createProcessedHTML('<a href="/test" hx-boost="true">Link</a>')
        htmx.process(a)
        assert.isTrue(a.hasAttribute('data-htmx-powered'))
    })

    it('processes hx-on attributes', function () {
        let div = createProcessedHTML('<div hx-on:custom="this.setAttribute(\'fired\', \'true\')"></div>')
        htmx.process(div)
        div.dispatchEvent(new Event('custom'))
        assert.equal(div.getAttribute('fired'), 'true')
    })

    it('ignores elements with hx-ignore', function () {
        let container = createProcessedHTML('<div hx-ignore><button hx-get="/test"></button></div>')
        htmx.process(container)
        let button = container.querySelector('button')
        assert.isFalse(button.hasAttribute('data-htmx-powered'))
    })

    it('ignores descendants of hx-ignore', function () {
        let container = createProcessedHTML('<div><div hx-ignore><button hx-get="/test"></button></div></div>')
        htmx.process(container)
        let button = container.querySelector('button')
        assert.isFalse(button.hasAttribute('data-htmx-powered'))
    })

    it('processes element itself if it matches', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        htmx.process(div)
        assert.isTrue(div.hasAttribute('data-htmx-powered'))
    })

    it('triggers htmx:before:process event', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let fired = false
        div.addEventListener('htmx:before:process', () => fired = true)
        htmx.process(div)
        assert.isTrue(fired)
    })

    it('triggers htmx:after:process event', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let fired = false
        div.addEventListener('htmx:after:process', () => fired = true)
        htmx.process(div)
        assert.isTrue(fired)
    })

    it('ignores hx-on: attributes under hx-ignore', function () {
        let container = createProcessedHTML('<div><div hx-ignore><button hx-on:click="this.setAttribute(\'fired\', \'true\')">Click</button></div></div>')
        htmx.process(container)
        let button = container.querySelector('button')
        button.click()
        assert.isNull(button.getAttribute('fired'))
    })

    it('hx-on:htmx:after:init fires during process', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-on:htmx:after:init="this.setAttribute(\'inited\', \'true\')"></div>')
        htmx.process(div)
        assert.equal(div.getAttribute('inited'), 'true')
    })

    it('processes elements inside a ShadowRoot', function () {
        let host = createProcessedHTML('<div></div>')
        let shadow = host.attachShadow({mode: 'open'})
        shadow.innerHTML = '<button hx-get="/test"></button><div id="target"></div>'
        htmx.process(shadow)
        let button = shadow.querySelector('button')
        assert.isTrue(button.hasAttribute('data-htmx-powered'))
    })

    it('skips processing if htmx:before:process is cancelled', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        div.removeAttribute('data-htmx-powered')
        delete(div._htmx)
        div.addEventListener('htmx:before:process', (e) => e.preventDefault())
        htmx.process(div)
        assert.isFalse(div.hasAttribute('data-htmx-powered'))
    })

    it('picks up hx-on:click value changes on re-process', function () {
        let btn = createProcessedHTML('<button hx-on:click="this.setAttribute(\'fired\', \'v1\')">b</button>')
        btn.click()
        assert.equal(btn.getAttribute('fired'), 'v1')

        btn.setAttribute('hx-on:click', 'this.setAttribute(\'fired\', \'v2\')')
        htmx.process(btn)
        btn.click()
        assert.equal(btn.getAttribute('fired'), 'v2', 'new handler should run after re-process')
    })

    it('picks up shorthand hx-on value changes on re-process', function () {
        let btn = createProcessedHTML('<button hx-on="click -> this.setAttribute(\'fired\', \'v1\')">b</button>')
        btn.click()
        assert.equal(btn.getAttribute('fired'), 'v1')

        btn.setAttribute('hx-on', 'click -> this.setAttribute(\'fired\', \'v2\')')
        htmx.process(btn)
        btn.click()
        assert.equal(btn.getAttribute('fired'), 'v2', 'new shorthand should run after re-process')
    })

    it('wires a newly added hx-on attribute on re-process', function () {
        let btn = createProcessedHTML('<button>b</button>')
        btn.setAttribute('hx-on:click', 'this.setAttribute(\'fired\', \'true\')')
        htmx.process(btn)
        btn.click()
        assert.equal(btn.getAttribute('fired'), 'true')
    })

    it('unwires a removed hx-on attribute on re-process', function () {
        let btn = createProcessedHTML('<button hx-on:click="this.setAttribute(\'fired\', \'true\')">b</button>')
        btn.click()
        assert.equal(btn.getAttribute('fired'), 'true')

        btn.removeAttribute('fired')
        btn.removeAttribute('hx-on:click')
        htmx.process(btn)
        btn.click()
        assert.isNull(btn.getAttribute('fired'))
    })

    it('preserves hx-trigger when re-processing hx-on', async function () {
        mockResponse('GET', '/test', '<span/>')
        let btn = createProcessedHTML('<button hx-get="/test" hx-trigger="click" hx-on:click="this.setAttribute(\'side\', \'1\')">b</button>')
        let fetches = 0
        btn.addEventListener('htmx:before:request', () => fetches++)

        btn.click()
        await waitForEvent('htmx:after:request', 100)
        assert.equal(fetches, 1)
        assert.equal(btn.getAttribute('side'), '1')

        htmx.process(btn)
        btn.removeAttribute('side')
        btn.click()
        await waitForEvent('htmx:after:request', 100)
        assert.equal(fetches, 2, 'hx-trigger should not duplicate')
        assert.equal(btn.getAttribute('side'), '1', 'hx-on should fire exactly once')
    })

    it('picks up hx-trigger value change on re-process', async function () {
        mockResponse('GET', '/test', '<span/>')
        let btn = createProcessedHTML('<button hx-get="/test" hx-trigger="click">x</button>')
        let fired = 0
        btn.addEventListener('htmx:before:request', () => fired++)

        btn.click()
        await waitForEvent('htmx:after:request', 100)
        assert.equal(fired, 1, 'baseline click should fire')

        btn.setAttribute('hx-trigger', 'keyup')
        htmx.process(btn)

        btn.click()
        await new Promise(r => setTimeout(r, 20))
        assert.equal(fired, 1, 'click should no longer fire')
        btn.dispatchEvent(new KeyboardEvent('keyup'))
        await waitForEvent('htmx:after:request', 100)
        assert.equal(fired, 2, 'keyup should fire')
    })

    it('hx-trigger="load" does not re-fire on re-process', function () {
        mockResponse('GET', '/loadtest', '<span/>')
        let div = createProcessedHTML('<div hx-get="/loadtest" hx-trigger="load">x</div>')
        let count = 0
        div.addEventListener('htmx:before:request', () => count++)
        div.setAttribute('hx-trigger', 'load delay:0')
        htmx.process(div)
        assert.equal(count, 0, 'load should not re-fire on re-process')
    })

    it('hx-on:load and hx-trigger="load" both fire on first init', async function () {
        mockResponse('GET', '/dual', '<span/>')
        let requestCount = 0
        let onReq = () => requestCount++
        document.addEventListener('htmx:before:request', onReq)
        try {
            let div = createProcessedHTML('<div hx-get="/dual" hx-trigger="load" hx-on:load="this.setAttribute(\'setup\', \'true\')">x</div>')
            await waitForEvent('htmx:after:request', 100)
            assert.equal(div.getAttribute('setup'), 'true', 'hx-on:load should fire')
            assert.equal(requestCount, 1, 'hx-trigger="load" should fire')
        } finally {
            document.removeEventListener('htmx:before:request', onReq)
        }
    })

});