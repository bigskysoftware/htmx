describe('hx-on attribute', function() {

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })

    it('can handle basic events w/ no other attributes', function() {
        var btn = createProcessedHTML("<button hx-on:click='window.foo = true'>Foo</button>")
        btn.click()
        window.foo.should.equal(true)
        delete window.foo
    })

    it('can handle custom events w/ no other attributes', function() {
        var btn = createProcessedHTML("<button hx-on:foo='window.foo = true'>Foo</button>")
        htmx.trigger(btn, "foo")
        window.foo.should.equal(true)
        delete window.foo
    })

    it('event symbol works', function() {
        var btn = createProcessedHTML("<button hx-on:foo='window.foo = event'>Foo</button>")
        let evt = new CustomEvent("foo");
        btn.dispatchEvent(evt)
        window.foo.should.equal(evt)
        delete window.foo
    })

    it('this symbol works', function() {
        var btn = createProcessedHTML("<button hx-on:foo='window.foo = this'>Foo</button>")
        let evt = new CustomEvent("foo");
        btn.dispatchEvent(evt)
        window.foo.should.equal(btn)
        delete window.foo
    })

    it('htmx API works', async function () {
        var btn = createProcessedHTML(
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

    it('htmx find works relative to element', async function () {
        var btn = createProcessedHTML(
            `<button hx-on:foo="window.foo = find('next div');">
                        Foo
                       </button>
                       <div id="foo"></div>
                      `)
        let evt = new CustomEvent("foo");
        btn.dispatchEvent(evt)
        let div = find("#foo");
        assert.isNotNull(div)
        assert.equal(window.foo, div);
        delete window.foo
    })

    it('htmx find works relative to element passed in', async function () {
        var btn = createProcessedHTML(
            `<button hx-on:foo="window.foo = find('#foo', 'next div');">
                        Foo
                       </button>
                       <div id="foo"></div>
                       <div id="bar"></div>
                      `)
        let evt = new CustomEvent("foo");
        btn.dispatchEvent(evt)
        let div = find("#bar");
        assert.isNotNull(div)
        assert.equal(window.foo, div);
        delete window.foo
    })

    it('hx-on:: shorthand expands to htmx: event', function() {
        var btn = createProcessedHTML("<button hx-on::my-event='window.foo = true'>Foo</button>")
        htmx.trigger(btn, "htmx:my-event")
        window.foo.should.equal(true)
        delete window.foo
    })

    it('hx-on:: shorthand does not fire on non-htmx event', function() {
        var btn = createProcessedHTML("<button hx-on::my-event='window.foo = true'>Foo</button>")
        htmx.trigger(btn, "my-event")
        assert.equal(window.foo, undefined)
    })

})

describe('hx-on attribute modifiers', function() {

    beforeEach(() => { setupTest(this.currentTest); });
    afterEach(() => { cleanupTest(); });

    it('.prevent calls preventDefault before body', function() {
        let form = createProcessedHTML('<form hx-on:submit.prevent="window.foo = event.defaultPrevented"><button type="submit">go</button></form>');
        let evt = new SubmitEvent('submit', { cancelable: true, bubbles: true });
        form.dispatchEvent(evt);
        evt.defaultPrevented.should.equal(true);
        window.foo.should.equal(true);
        delete window.foo;
    });

    it('.stop calls stopPropagation before body', function() {
        playground().innerHTML = '<div id="outer"><button hx-on:click.stop="window.foo = \'inner\'">x</button></div>';
        htmx.process(playground());
        let outerFired = false;
        playground().querySelector('#outer').addEventListener('click', () => outerFired = true);
        playground().querySelector('button').click();
        window.foo.should.equal('inner');
        outerFired.should.equal(false);
        delete window.foo;
    });

    it('.halt is shorthand for .prevent.stop', function() {
        playground().innerHTML = '<div id="outer"><button hx-on:click.halt="window.foo = 1">x</button></div>';
        htmx.process(playground());
        let outerFired = false;
        playground().querySelector('#outer').addEventListener('click', () => outerFired = true);
        let btn = playground().querySelector('button');
        let evt = new MouseEvent('click', { cancelable: true, bubbles: true });
        btn.dispatchEvent(evt);
        evt.defaultPrevented.should.equal(true);
        outerFired.should.equal(false);
        delete window.foo;
    });

    it('.once removes the listener after first fire', function() {
        window.fooCount = 0;
        let btn = createProcessedHTML('<button hx-on:click.once="window.fooCount++">x</button>');
        btn.click();
        btn.click();
        btn.click();
        window.fooCount.should.equal(1);
        delete window.fooCount;
    });

    it('.self only fires when event.target is the element', function() {
        window.fooCount = 0;
        playground().innerHTML = '<div hx-on:click.self="window.fooCount++"><span>child</span></div>';
        htmx.process(playground());
        let div = playground().querySelector('div');
        playground().querySelector('span').click(); // bubbles to div, target=span → skip
        window.fooCount.should.equal(0);
        div.click(); // target=div → fire
        window.fooCount.should.equal(1);
        delete window.fooCount;
    });

    it('.outside fires only when click happens outside the element', function() {
        window.outsideCount = 0;
        let btn;
        playground().innerHTML = '<button hx-on:click.outside="window.outsideCount++">x</button><div id="other"></div>';
        htmx.process(playground());
        btn = playground().querySelector('button');
        btn.click(); // inside → skip
        window.outsideCount.should.equal(0);
        playground().querySelector('#other').click(); // outside → fire
        window.outsideCount.should.equal(1);
        // Manually remove the document-level listener so it doesn't leak across tests
        for (let l of btn._htmx.listeners) l.fromElt.removeEventListener(l.eventName, l.handler);
        delete window.outsideCount;
    });

    it('.cc camel-cases the event name', function() {
        window.foo = null;
        let btn = createProcessedHTML('<button hx-on:my-event.cc="window.foo = event.type">x</button>');
        btn.dispatchEvent(new CustomEvent('myEvent'));
        window.foo.should.equal('myEvent');
        delete window.foo;
    });

    it('event.detail keys are exposed as bare names in handler scope', function() {
        let btn = createProcessedHTML('<button hx-on:zap="window.foo = path.toUpperCase()">x</button>');
        btn.dispatchEvent(new CustomEvent('zap', { detail: { path: 'hello' } }));
        window.foo.should.equal('HELLO');
        delete window.foo;
    });

    it('multiple modifiers can be chained (.halt.once)', function() {
        window.fooCount = 0;
        let btn = createProcessedHTML('<button hx-on:click.halt.once="window.fooCount++">x</button>');
        let evt = new MouseEvent('click', { cancelable: true, bubbles: true });
        btn.dispatchEvent(evt);
        evt.defaultPrevented.should.equal(true);
        btn.dispatchEvent(new MouseEvent('click', { cancelable: true, bubbles: true }));
        window.fooCount.should.equal(1);
        delete window.fooCount;
    });
})