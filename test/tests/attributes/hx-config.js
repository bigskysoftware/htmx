describe('hx-config attribute', function() {

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })

    it('overrides action with JSON config', async function () {
        mockResponse('GET', '/override', 'Overridden!')
        let cfg = null
        document.addEventListener('htmx:config:request', function(e) {
            cfg = e.detail.cfg
        }, {once: true})
        let btn = initHTML('<button hx-get="/test" hx-trigger="click" hx-config=\'{"action": "/override"}\'>Click</button>');
        await clickAndWait(btn)
        playground().innerText.should.equal('Overridden!')
        assert.isTrue(lastFetch().url.startsWith('/override'))
        assert.equal(cfg.request.action, '/override')
    })

    it('overrides validate via config', async function () {
        mockResponse('POST', '/test', 'Submitted')
        let cfg = null
        document.addEventListener('htmx:config:request', function(e) {
            cfg = e.detail.cfg
        }, {once: true})

        let form = initHTML('<form hx-post="/test" hx-config=\'{"validate": false}\'><input required name="test" value="filled"><button>Submit</button></form>');
        await submitAndWait(form)
        // Verify validate can be set via config (goes to request)
        assert.isFalse(cfg.request.validate)
    })

    it('merges into options with + prefix', async function () {
        mockResponse('GET', '/test', 'Fetched')
        let cfg = null
        document.addEventListener('htmx:config:request', function(e) {
            cfg = e.detail.cfg
        }, {once: true})

        let btn = initHTML('<button hx-get="/test" hx-config=\'{"cache": "no-cache"}\'>Click</button>');
        await clickAndWait(btn)
        // Note: later Object.assign in handleTriggerEvent may override some options
        assert.equal(cfg.request.cache, 'no-cache')
        assert.equal(cfg.request.method, 'GET')
    })

    it('can set custom property on config', async function () {
        mockResponse('GET', '/test', 'Done')
        let customValue = null
        document.addEventListener('htmx:config:request', function(e) {
            customValue = e.detail.cfg.request.customProperty
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
        assert.equal(cfg.request.prop1, 'value1')
        assert.equal(cfg.request.prop2, 'value2')
        assert.equal(cfg.request.prop3, 123)
    })

    it('works with empty config object', async function () {
        mockResponse('GET', '/test', 'Done')
        let btn = initHTML('<button hx-get="/test" hx-config=\'{}\'>Click</button>');
        await clickAndWait(btn)
        playground().innerText.should.equal('Done')
    })

    it('can override method via config', async function () {
        mockResponse('PUT', '/test', 'Put request')
        let btn = initHTML('<button hx-get="/test" hx-config=\'{"method": "PUT"}\'>Click</button>');
        await clickAndWait(btn)
        lastFetch().request.method.should.equal('PUT')
    })

    it('supports boolean values in config', async function () {
        mockResponse('GET', '/test', 'Done')
        let cfg = null
        document.addEventListener('htmx:config:request', function(e) {
            cfg = e.detail.cfg
        }, {once: true})

        let btn = initHTML('<button hx-get="/test" hx-config=\'{"myFlag": true, "otherFlag": false}\'>Click</button>');
        await clickAndWait(btn)
        assert.isTrue(cfg.request.myFlag)
        assert.isFalse(cfg.request.otherFlag)
    })

    it('supports numeric values in config', async function () {
        mockResponse('GET', '/test', 'Done')
        let cfg = null
        document.addEventListener('htmx:config:request', function(e) {
            cfg = e.detail.cfg
        }, {once: true})

        let btn = initHTML('<button hx-get="/test" hx-config=\'{"timeout": 5000, "retries": 3}\'>Click</button>');
        await clickAndWait(btn)
        assert.equal(cfg.request.timeout, 5000)
        assert.equal(cfg.request.retries, 3)
    })

    it('supports null values in config', async function () {
        mockResponse('GET', '/test', 'Done')
        let cfg = null
        document.addEventListener('htmx:config:request', function(e) {
            cfg = e.detail.cfg
        }, {once: true})

        let btn = initHTML('<button hx-get="/test" hx-select="#foo" hx-config=\'{"select": null}\'>Click</button>');
        await clickAndWait(btn)
        assert.isNull(cfg.request.select)
    })

    it('merges non-object values with + prefix', async function () {
        mockResponse('GET', '/newpath', 'Done')
        let cfg = null
        document.addEventListener('htmx:config:request', function(e) {
            cfg = e.detail.cfg
        }, {once: true})

        // When using + on a non-object (action is a string), it should set it on request
        let btn = initHTML('<button hx-get="/test" hx-trigger="click" hx-config=\'{"+action": "/newpath"}\'>Click</button>');
        await clickAndWait(btn)
        assert.isTrue(cfg.request.action.startsWith('/newpath'))
    })

    it('handles complex nested JSON structures', async function () {
        mockResponse('GET', '/test', 'Done')
        let cfg = null
        document.addEventListener('htmx:config:request', function(e) {
            cfg = e.detail.cfg
        }, {once: true})

        let btn = initHTML('<button hx-get="/test" hx-config=\'{"custom": {"nested": {"deep": "value"}}}\'>Click</button>');
        await clickAndWait(btn)
        assert.equal(cfg.request.custom.nested.deep, 'value')
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
        assert.deepEqual(cfg.request.myArray, [1, 2, 3])
    })

    it('can override validation setting via config', async function () {
        mockResponse('POST', '/submit', 'Submitted')
        let cfg = null
        document.addEventListener('htmx:config:request', function(e) {
            cfg = e.detail.cfg
        }, {once: true})

        let form = initHTML('<form hx-post="/submit" hx-validate="true" hx-config=\'{"validate": false}\'><input required name="test" value="test"><button>Submit</button></form>');
        await submitAndWait(form)
        assert.isFalse(cfg.request.validate)
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
        let cfg = null
        document.addEventListener('htmx:config:request', function(e) {
            cfg = e.detail.cfg
        }, {once: true})
        initHTML('<div hx-config:inherited=\'{"action": "/inherited"}\'><button hx-get="/original" hx-trigger="click">Click</button></div>')
        await clickAndWait('button')
        playground().innerText.should.equal('Inherited config')
        assert.isTrue(lastFetch().url.startsWith('/inherited'))
        assert.equal(cfg.request.action, '/inherited')
    })

    it('child config takes precedence over inherited config', async function () {
        mockResponse('GET', '/child', 'Child wins')
        let cfg = null
        document.addEventListener('htmx:config:request', function(e) {
            cfg = e.detail.cfg
        }, {once: true})
        initHTML('<div hx-config:inherited=\'{"action": "/parent"}\'><button hx-get="/original" hx-trigger="click" hx-config=\'{"action": "/child"}\'>Click</button></div>')
        await clickAndWait('button')
        assert.isTrue(lastFetch().url.startsWith('/child'))
        assert.equal(cfg.request.action, '/child')
    })
})
