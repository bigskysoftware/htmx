describe('hx-config attribute', function() {

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })

    it('overrides action with JSON config', async function () {
        mockResponse('GET', '/override', 'Overridden!')
        let btn = initHTML('<button hx-get="/test" hx-trigger="click" hx-config=\'{"action": "/override"}\'>Click</button>');
        await clickAndWait(btn)
        playground().innerText.should.equal('Overridden!')
        assert.isTrue(lastFetch().url.startsWith('/override'))
    })

    it('overrides select attribute via config', async function () {
        mockResponse('GET', '/test', '<div><span id="target">Selected</span><span>Not selected</span></div>')
        let btn = initHTML('<button hx-get="/test" hx-config=\'{"select": "#target"}\'>Click</button>');
        await clickAndWait(btn)
        playground().innerText.should.equal('Selected')
    })

    it('overrides validate via config', async function () {
        mockResponse('POST', '/test', 'Submitted')
        let cfg = null
        document.addEventListener('htmx:config:request', function(e) {
            cfg = e.detail.cfg
        }, {once: true})

        let form = initHTML('<form hx-post="/test"><input required name="test" value="filled"><button>Submit</button></form>');
        await submitAndWait(form)
        // Verify validate can be checked in config event
        assert.isTrue(cfg.validate)
    })

    it('merges into swapCfg with + prefix', async function () {
        mockResponse('GET', '/test', 'New content')
        let cfg = null
        document.addEventListener('htmx:config:request', function(e) {
            cfg = e.detail.cfg
        }, {once: true})

        initHTML('<div id="target">Old</div><button id="btn" hx-get="/test" hx-target="#target" hx-swap="innerHTML" hx-config=\'{"+swapCfg": {"swap": "beforebegin"}}\'>Click</button>');
        await clickAndWait('#btn')
        // Swap should be overridden via config
        assert.equal(cfg.swapCfg.swap, 'beforebegin')
    })

    it('merges into options with + prefix', async function () {
        mockResponse('GET', '/test', 'Fetched')
        let cfg = null
        document.addEventListener('htmx:config:request', function(e) {
            cfg = e.detail.cfg
        }, {once: true})

        let btn = initHTML('<button hx-get="/test" hx-config=\'{"+options": {"cache": "no-cache"}}\'>Click</button>');
        await clickAndWait(btn)
        // Note: later Object.assign in handleTriggerEvent may override some options
        assert.equal(cfg.options.cache, 'no-cache')
        assert.equal(cfg.options.method, 'GET')
    })

    it('can set custom property on config', async function () {
        mockResponse('GET', '/test', 'Done')
        let customValue = null
        document.addEventListener('htmx:config:request', function(e) {
            customValue = e.detail.cfg.customProperty
        }, {once: true})

        let btn = initHTML('<button hx-get="/test" hx-config=\'{"customProperty": "myValue"}\'>Click</button>');
        await clickAndWait(btn)
        assert.equal(customValue, 'myValue')
    })

    it('can set multiple custom properties', async function () {
        mockResponse('GET', '/test', 'Done')
        let cfg = null
        document.addEventListener('htmx:config:request', function(e) {
            cfg = e.detail.cfg
        }, {once: true})

        let btn = initHTML('<button hx-get="/test" hx-config=\'{"prop1": "value1", "prop2": "value2", "prop3": 123}\'>Click</button>');
        await clickAndWait(btn)
        assert.equal(cfg.prop1, 'value1')
        assert.equal(cfg.prop2, 'value2')
        assert.equal(cfg.prop3, 123)
    })

    it('hx-config can override swap strategy', async function () {
        mockResponse('GET', '/test', '<span>Inner</span>')
        let cfg = null
        document.addEventListener('htmx:config:request', function(e) {
            cfg = e.detail.cfg
        }, {once: true})

        let btn = initHTML('<button hx-get="/test" hx-swap="innerHTML" hx-config=\'{"+swapCfg": {"swap": "outerHTML"}}\'>Click</button>');
        await clickAndWait(btn)
        assert.equal(cfg.swapCfg.swap, 'outerHTML')
    })

    it('works with empty config object', async function () {
        mockResponse('GET', '/test', 'Done')
        let btn = initHTML('<button hx-get="/test" hx-config=\'{}\'>Click</button>');
        await clickAndWait(btn)
        playground().innerText.should.equal('Done')
    })

    it('handles nested object merging with +', async function () {
        mockResponse('POST', '/test', 'Posted')
        let cfg = null
        document.addEventListener('htmx:config:request', function(e) {
            cfg = e.detail.cfg
        }, {once: true})

        let btn = initHTML('<button hx-post="/test" hx-config=\'{"+options": {"cache": "no-store"}}\'>Click</button>');
        await clickAndWait(btn)
        // Merged property should exist alongside original options
        assert.equal(cfg.options.cache, 'no-store')
        assert.equal(cfg.options.method, 'POST')
    })

    it('can override method via config', async function () {
        mockResponse('PUT', '/test', 'Put request')
        let btn = initHTML('<button hx-get="/test" hx-config=\'{"+options": {"method": "PUT"}}\'>Click</button>');
        await clickAndWait(btn)
        lastFetch().options.method.should.equal('PUT')
    })

    it('supports boolean values in config', async function () {
        mockResponse('GET', '/test', 'Done')
        let cfg = null
        document.addEventListener('htmx:config:request', function(e) {
            cfg = e.detail.cfg
        }, {once: true})

        let btn = initHTML('<button hx-get="/test" hx-config=\'{"myFlag": true, "otherFlag": false}\'>Click</button>');
        await clickAndWait(btn)
        assert.isTrue(cfg.myFlag)
        assert.isFalse(cfg.otherFlag)
    })

    it('supports numeric values in config', async function () {
        mockResponse('GET', '/test', 'Done')
        let cfg = null
        document.addEventListener('htmx:config:request', function(e) {
            cfg = e.detail.cfg
        }, {once: true})

        let btn = initHTML('<button hx-get="/test" hx-config=\'{"timeout": 5000, "retries": 3}\'>Click</button>');
        await clickAndWait(btn)
        assert.equal(cfg.timeout, 5000)
        assert.equal(cfg.retries, 3)
    })

    it('supports null values in config', async function () {
        mockResponse('GET', '/test', 'Done')
        let cfg = null
        document.addEventListener('htmx:config:request', function(e) {
            cfg = e.detail.cfg
        }, {once: true})

        let btn = initHTML('<button hx-get="/test" hx-select="#foo" hx-config=\'{"select": null}\'>Click</button>');
        await clickAndWait(btn)
        assert.isNull(cfg.select)
    })

    it('merges non-object values with + prefix', async function () {
        mockResponse('GET', '/newpath', 'Done')
        let cfg = null
        document.addEventListener('htmx:config:request', function(e) {
            cfg = e.detail.cfg
        }, {once: true})

        // When using + on a non-object, it should just set it
        let btn = initHTML('<button hx-get="/test" hx-trigger="click" hx-config=\'{"+action": "/newpath"}\'>Click</button>');
        await clickAndWait(btn)
        assert.isTrue(cfg.action.startsWith('/newpath'))
    })

    it('can combine + merging with direct overrides', async function () {
        mockResponse('GET', '/override', 'Done')
        let cfg = null
        document.addEventListener('htmx:config:request', function(e) {
            cfg = e.detail.cfg
        }, {once: true})

        let btn = initHTML('<button hx-get="/test" hx-trigger="click" hx-target="#foo" hx-config=\'{"action": "/override", "+swapCfg": {"swap": "innerHTML"}}\'>Click</button>');
        await clickAndWait(btn)
        assert.isTrue(cfg.action.startsWith('/override'))
        // Swap should be overridden
        assert.equal(cfg.swapCfg.swap, 'innerHTML')
    })


    it('handles complex nested JSON structures', async function () {
        mockResponse('GET', '/test', 'Done')
        let cfg = null
        document.addEventListener('htmx:config:request', function(e) {
            cfg = e.detail.cfg
        }, {once: true})

        let btn = initHTML('<button hx-get="/test" hx-config=\'{"custom": {"nested": {"deep": "value"}}}\'>Click</button>');
        await clickAndWait(btn)
        assert.equal(cfg.custom.nested.deep, 'value')
    })

    it('merges arrays by replacement not concatenation', async function () {
        mockResponse('GET', '/test', 'Done')
        let cfg = null
        document.addEventListener('htmx:config:request', function(e) {
            cfg = e.detail.cfg
        }, {once: true})

        // Set an array on a custom property
        let btn = initHTML('<button hx-get="/test" hx-config=\'{"myArray": [1, 2, 3]}\'>Click</button>');
        await clickAndWait(btn)
        assert.deepEqual(cfg.myArray, [1, 2, 3])
    })

    it('can override validation setting via config', async function () {
        mockResponse('POST', '/submit', 'Submitted')
        let cfg = null
        document.addEventListener('htmx:config:request', function(e) {
            cfg = e.detail.cfg
        }, {once: true})

        let form = initHTML('<form hx-post="/submit" hx-validate="true" hx-config=\'{"validate": false}\'><input required name="test" value="test"><button>Submit</button></form>');
        await submitAndWait(form)
        assert.isFalse(cfg.validate)
    })

    it('can set transition via config', async function () {
        mockResponse('GET', '/test', 'New content')
        let cfg = null
        document.addEventListener('htmx:config:request', function(e) {
            cfg = e.detail.cfg
        }, {once: true})

        let btn = initHTML('<button hx-get="/test" hx-config=\'{"+swapCfg": {"transition": true}}\'>Click</button>');
        await clickAndWait(btn)
        assert.isTrue(cfg.swapCfg.transition)
    })

    it('multiple elements with different configs work independently', async function () {
        mockResponse('GET', '/path1', 'Path 1')
        mockResponse('GET', '/path2', 'Path 2')

        initHTML('<button id="b1" hx-get="/test" hx-trigger="click" hx-swap="innerHTML" hx-config=\'{"action": "/path1"}\'>B1</button><button id="b2" hx-get="/test" hx-trigger="click" hx-swap="innerHTML" hx-config=\'{"action": "/path2"}\'>B2</button>')

        await clickAndWait('#b1')
        assert.equal(playground().querySelector('#b1').innerText, 'Path 1')

        await clickAndWait('#b2')
        assert.equal(playground().querySelector('#b2').innerText, 'Path 2')
    })

    it('config can be inherited with :inherited suffix', async function () {
        mockResponse('GET', '/inherited', 'Inherited config')
        initHTML('<div hx-config:inherited=\'{"action": "/inherited"}\'><button hx-get="/original" hx-trigger="click">Click</button></div>')
        await clickAndWait('button')
        playground().innerText.should.equal('Inherited config')
        assert.isTrue(lastFetch().url.startsWith('/inherited'))
    })

    it('child config takes precedence over inherited config', async function () {
        mockResponse('GET', '/child', 'Child wins')
        initHTML('<div hx-config:inherited=\'{"action": "/parent"}\'><button hx-get="/original" hx-trigger="click" hx-config=\'{"action": "/child"}\'>Click</button></div>')
        await clickAndWait('button')
        assert.isTrue(lastFetch().url.startsWith('/child'))
    })
})
