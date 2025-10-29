describe('hx-on attribute', function() {

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })

    it('can handle basic events w/ no other attributes', function() {
        var btn = initHTML("<button hx-on:click='window.foo = true'>Foo</button>")
        btn.click()
        window.foo.should.equal(true)
        delete window.foo
    })

    it('can handle custom events w/ no other attributes', function() {
        var btn = initHTML("<button hx-on:foo='window.foo = true'>Foo</button>")
        htmx.trigger(btn, "foo")
        window.foo.should.equal(true)
        delete window.foo
    })

    it('event symbol works', function() {
        var btn = initHTML("<button hx-on:foo='window.foo = event'>Foo</button>")
        let evt = new CustomEvent("foo");
        btn.dispatchEvent(evt)
        window.foo.should.equal(evt)
        delete window.foo
    })

    it('this symbol works', function() {
        var btn = initHTML("<button hx-on:foo='window.foo = this'>Foo</button>")
        let evt = new CustomEvent("foo");
        btn.dispatchEvent(evt)
        window.foo.should.equal(btn)
        delete window.foo
    })

    it('htmx API works', async function () {
        var btn = initHTML(
            `<button hx-on:foo='await timeout(1); window.foo = 10'>
                        Foo
                       </button>`)
        let evt = new CustomEvent("foo");
        btn.dispatchEvent(evt)
        assert.equal(window.foo, undefined);
        await htmx.timeout(10);
        assert.equal(window.foo, 10);
        delete window.foo
    })

})