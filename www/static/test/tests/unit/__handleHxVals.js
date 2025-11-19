describe('__handleHxVals unit tests', function() {

    it('handles basic key-value pairs', async function () {
        let btn = createProcessedHTML('<button hx-vals="foo:bar">Click</button>')
        let body = new FormData()
        await htmx.__handleHxVals(btn, body)
        assert.equal(body.get('foo'), 'bar')
    })

    it('handles multiple key-value pairs', async function () {
        let btn = createProcessedHTML('<button hx-vals="a:1, b:2, c:3">Click</button>')
        let body = new FormData()
        await htmx.__handleHxVals(btn, body)
        assert.equal(body.get('a'), '1')
        assert.equal(body.get('b'), '2')
        assert.equal(body.get('c'), '3')
    })

    it('handles JSON object', async function () {
        let btn = createProcessedHTML('<button hx-vals=\'{"foo":"bar","baz":"qux"}\'>Click</button>')
        let body = new FormData()
        await htmx.__handleHxVals(btn, body)
        assert.equal(body.get('foo'), 'bar')
        assert.equal(body.get('baz'), 'qux')
    })

    it('handles empty vals', async function () {
        let btn = createProcessedHTML('<button>Click</button>')
        let body = new FormData()
        await htmx.__handleHxVals(btn, body)
        assert.equal([...body.keys()].length, 0)
    })

    it('handles quoted string values', async function () {
        let btn = createProcessedHTML("<button hx-vals='name:\"John Doe\", age:30'>Click</button>")
        let body = new FormData()
        await htmx.__handleHxVals(btn, body)
        assert.equal(body.get('name'), 'John Doe')
        assert.equal(body.get('age'), '30')
    })

    it('handles js: prefix with object return', async function () {
        let btn = createProcessedHTML("<button hx-vals=\"js:{foo: 'bar', num: 42}\">Click</button>")
        let body = new FormData()
        await htmx.__handleHxVals(btn, body)
        assert.equal(body.get('foo'), 'bar')
        assert.equal(body.get('num'), '42')
    })

    it('handles js: prefix with dynamic values', async function () {
        window.testValue = 'dynamic'
        let btn = createProcessedHTML('<button hx-vals="js:{key: window.testValue}">Click</button>')
        let body = new FormData()
        await htmx.__handleHxVals(btn, body)
        assert.equal(body.get('key'), 'dynamic')
        delete window.testValue
    })

    it('handles javascript: prefix', async function () {
        let btn = createProcessedHTML("<button hx-vals=\"javascript:{foo: 'baz'}\">Click</button>")
        let body = new FormData()
        await htmx.__handleHxVals(btn, body)
        assert.equal(body.get('foo'), 'baz')
    })

    it('handles js: prefix with element access', async function () {
        // Create both elements in one call so they're both in the playground
        let container = createProcessedHTML('<div><input id="myinput" value="test"><button hx-vals="js:{val: document.getElementById(\'myinput\').value}">Click</button></div>')
        let btn = container.querySelector('button')
        let body = new FormData()
        await htmx.__handleHxVals(btn, body)
        assert.equal(body.get('val'), 'test')
    })

    it('handles boolean values in config syntax', async function () {
        let btn = createProcessedHTML('<button hx-vals="enabled:true, disabled:false">Click</button>')
        let body = new FormData()
        await htmx.__handleHxVals(btn, body)
        assert.equal(body.get('enabled'), 'true')
        assert.equal(body.get('disabled'), 'false')
    })

    it('handles numeric values in config syntax', async function () {
        let btn = createProcessedHTML('<button hx-vals="count:123, price:456">Click</button>')
        let body = new FormData()
        await htmx.__handleHxVals(btn, body)
        assert.equal(body.get('count'), '123')
        assert.equal(body.get('price'), '456')
    })

});