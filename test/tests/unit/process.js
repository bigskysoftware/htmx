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

});