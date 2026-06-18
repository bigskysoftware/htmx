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

    it('hx-trigger="load" does not re-fire on re-process', function () {
        mockResponse('GET', '/loadtest', '<span/>')
        let div = createProcessedHTML('<div hx-get="/loadtest" hx-trigger="load">x</div>')
        let count = 0
        div.addEventListener('htmx:before:request', () => count++)
        div.setAttribute('hx-trigger', 'load delay:0')
        htmx.process(div)
        assert.equal(count, 0, 'load should not re-fire on re-process')
    })

    it('process(elt, true) picks up a changed hx-trigger value', async function () {
        mockResponse('GET', '/test', '<span/>')
        let btn = createProcessedHTML('<button hx-get="/test" hx-trigger="click">x</button>')
        let fired = 0
        btn.addEventListener('htmx:before:request', () => fired++)

        btn.click()
        await waitForEvent('htmx:after:request', 100)
        assert.equal(fired, 1, 'baseline click fires')

        btn.setAttribute('hx-trigger', 'keyup')
        htmx.process(btn, true)

        btn.click()
        await new Promise(r => setTimeout(r, 20))
        assert.equal(fired, 1, 'click no longer fires after trigger change')

        btn.dispatchEvent(new KeyboardEvent('keyup'))
        await waitForEvent('htmx:after:request', 100)
        assert.equal(fired, 2, 'keyup fires after force reprocess')
    })

    it('process(parent, true) reprocesses descendants with mutated hx-on', function () {
        window._n = 0
        let div = createProcessedHTML('<div><button id="b" hx-on:click="window._n++">b</button></div>')
        let btn = div.querySelector('#b')
        btn.click(); assert.equal(window._n, 1)
        btn.setAttribute('hx-on:click', 'window._n += 10')
        htmx.process(div, true)
        btn.click()
        assert.equal(window._n, 11, 'descendant rebound from current attribute')
        delete window._n
    })

    it('process(elt, true) unwires a removed hx-on attribute', function () {
        window._n = 0
        let btn = createProcessedHTML('<button hx-on:click="window._n++">b</button>')
        btn.click(); assert.equal(window._n, 1)
        btn.removeAttribute('hx-on:click')
        htmx.process(btn, true)
        btn.click()
        assert.equal(window._n, 1, 'removed handler is gone')
        delete window._n
    })

    it('process(elt, true) mid-request keeps the indicator wired to the running request', async function () {
        mockResponse('GET', '/slow', '<span/>')
        let btn = createProcessedHTML('<button hx-get="/slow">x</button>')
        btn.click()
        assert.isTrue(btn.classList.contains('htmx-request'), 'indicator on during request')
        htmx.process(btn, true) // force mid-flight must not orphan the indicator
        await forRequest()
        assert.isFalse(btn.classList.contains('htmx-request'), 'indicator cleared when request completes')
    })

    it('cleanup fires before:cleanup and after:cleanup exactly once per element', async function () {
        let div = createProcessedHTML('<div id="target"><div id="parent" hx-get="/a"><button id="child" hx-get="/b">x</button></div></div>')
        let events = []
        div.addEventListener('htmx:before:cleanup', (e) => events.push('before:' + e.target.id))
        div.addEventListener('htmx:after:cleanup', (e) => events.push('after:' + e.target.id))
        await htmx.swap({target: '#target', text: '<p>replaced</p>', swap: 'innerHTML', sourceElement: div})
        assert.deepEqual(events, ['before:parent', 'after:parent', 'before:child', 'after:child'])
    })

    it('cleanup fires exactly once per element in nested tree (no double-fire)', async function () {
        let html = '<div id="target"><div id="gp" hx-get="/a"><div id="p" hx-get="/b"><button id="c" hx-get="/c">x</button></div></div></div>'
        let div = createProcessedHTML(html)
        let counts = {}
        div.addEventListener('htmx:before:cleanup', (e) => {
            counts[e.target.id] = (counts[e.target.id] || 0) + 1
        })
        await htmx.swap({target: '#target', text: '<p>replaced</p>', swap: 'innerHTML', sourceElement: div})
        assert.equal(counts['gp'], 1, 'grandparent cleaned once')
        assert.equal(counts['p'], 1, 'parent cleaned once')
        assert.equal(counts['c'], 1, 'child cleaned once')
    })

});