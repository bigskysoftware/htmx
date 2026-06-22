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

    it('event.detail keys are exposed as bare names in handler scope', function() {
        let btn = createProcessedHTML('<button hx-on:zap="window.foo = path.toUpperCase()">x</button>');
        btn.dispatchEvent(new CustomEvent('zap', { detail: { path: 'hello' } }));
        window.foo.should.equal('HELLO');
        delete window.foo;
    });

    // --- synthetic events in simple form ---

    it('hx-on:load fires immediately when element is processed', function() {
        window.foo = false;
        createProcessedHTML('<div hx-on:load="window.foo = true">x</div>');
        window.foo.should.equal(true);
        delete window.foo;
    });

    it('hx-on:load provides this as the element', function() {
        let div = createProcessedHTML('<div hx-on:load="window.foo = this">x</div>');
        window.foo.should.equal(div);
        delete window.foo;
    });

    it('hx-on:load fires on children inside a swap response', function() {
        window.parentLoaded = false;
        window.childLoaded = false;
        playground().innerHTML = '<div id="target">old</div>';
        htmx.process(playground());
        let target = playground().querySelector('#target');
        // Simulate what htmx does during a swap: insert new content and process it
        target.innerHTML = '<div hx-on:load="window.parentLoaded = true"><span hx-on:load="window.childLoaded = true">new</span></div>';
        htmx.process(target);
        window.parentLoaded.should.equal(true);
        window.childLoaded.should.equal(true);
        delete window.parentLoaded;
        delete window.childLoaded;
    });

    it('hx-on:load passes a CustomEvent as event', function() {
        createProcessedHTML('<div hx-on:load="window.foo = event.type">x</div>');
        window.foo.should.equal('load');
        delete window.foo;
    });

})

describe('hx-on="eventSpec -> code" syntax', function() {

    beforeEach(() => { setupTest(this.currentTest); });
    afterEach(() => { cleanupTest(); });

    // --- basic ---

    it('basic: fires handler on event', function() {
        let btn = createProcessedHTML('<button hx-on="click -> window.foo = true">x</button>');
        btn.click();
        window.foo.should.equal(true);
        delete window.foo;
    });

    it('this refers to the element', function() {
        let btn = createProcessedHTML('<button hx-on="click -> window.foo = this">x</button>');
        btn.click();
        window.foo.should.equal(btn);
        delete window.foo;
    });

    it('event is available in handler', function() {
        let btn = createProcessedHTML('<button hx-on="click -> window.foo = event.type">x</button>');
        btn.click();
        window.foo.should.equal('click');
        delete window.foo;
    });

    it('event.detail keys are exposed as bare names', function() {
        let btn = createProcessedHTML('<button hx-on="zap -> window.foo = path">x</button>');
        btn.dispatchEvent(new CustomEvent('zap', { detail: { path: 'hello' } }));
        window.foo.should.equal('hello');
        delete window.foo;
    });

    // --- once ---

    it('once: removes listener after first fire', function() {
        window.fooCount = 0;
        let btn = createProcessedHTML('<button hx-on="click once -> window.fooCount++">x</button>');
        btn.click();
        btn.click();
        btn.click();
        window.fooCount.should.equal(1);
        delete window.fooCount;
    });

    // --- prevent ---

    it('prevent: calls preventDefault before handler', function() {
        let form = createProcessedHTML('<form hx-on="submit prevent -> window.foo = event.defaultPrevented"><button type="submit">go</button></form>');
        let evt = new SubmitEvent('submit', { cancelable: true, bubbles: true });
        form.dispatchEvent(evt);
        evt.defaultPrevented.should.equal(true);
        window.foo.should.equal(true);
        delete window.foo;
    });

    // --- stop ---

    it('stop: calls stopPropagation before handler', function() {
        playground().innerHTML = '<div id="outer"><button hx-on="click stop -> window.foo = \'inner\'">x</button></div>';
        htmx.process(playground());
        let outerFired = false;
        playground().querySelector('#outer').addEventListener('click', () => outerFired = true);
        playground().querySelector('button').click();
        window.foo.should.equal('inner');
        outerFired.should.equal(false);
        delete window.foo;
    });

    // --- halt (shorthand for prevent + stop) ---

    it('halt: preventDefault and stopPropagation', function() {
        playground().innerHTML = '<div id="outer"><button hx-on="click halt -> window.foo = 1">x</button></div>';
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

    // --- prevent + stop ---

    it('prevent stop: equivalent to halt', function() {
        playground().innerHTML = '<div id="outer"><button hx-on="click prevent stop -> window.foo = 1">x</button></div>';
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

    // --- delay ---

    it('delay: debounces handler', async function() {
        window.fooCount = 0;
        playground().innerHTML = '<button hx-on="click delay:30ms -> window.fooCount++">x</button>';
        htmx.process(playground());
        let btn = playground().querySelector('button');
        btn.click();
        btn.click();
        btn.click();
        window.fooCount.should.equal(0);
        await htmx.timeout(60);
        window.fooCount.should.equal(1);
        delete window.fooCount;
    });

    // --- throttle ---

    it('throttle: throttles handler with trailing edge', async function() {
        window.fooCount = 0;
        playground().innerHTML = '<button hx-on="click throttle:30ms -> window.fooCount++">x</button>';
        htmx.process(playground());
        let btn = playground().querySelector('button');
        btn.click(); // fires immediately (first)
        btn.click(); // queued
        btn.click(); // replaces queued
        window.fooCount.should.equal(1);
        await htmx.timeout(60);
        window.fooCount.should.equal(2); // trailing edge fires
        delete window.fooCount;
    });

    // --- changed ---

    it('changed: only fires when value changes', function() {
        window.fooCount = 0;
        playground().innerHTML = '<input value="a" hx-on="input changed -> window.fooCount++">';
        htmx.process(playground());
        let inp = playground().querySelector('input');
        // First fire: value is "a", no previous — should fire
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        window.fooCount.should.equal(1);
        // Second fire: value still "a" — should NOT fire
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        window.fooCount.should.equal(1);
        // Change value and fire — should fire
        inp.value = 'b';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        window.fooCount.should.equal(2);
        delete window.fooCount;
    });

    // --- from ---

    it('from:document: listens on document', function() {
        window.foo = false;
        let btn = createProcessedHTML('<button hx-on="custom-evt from:document -> window.foo = true">x</button>');
        document.dispatchEvent(new CustomEvent('custom-evt'));
        window.foo.should.equal(true);
        // Clean up document-level listener
        for (let l of (btn._htmx?.listeners || [])) l.fromElt.removeEventListener(l.eventName, l.handler);
        delete window.foo;
    });

    // --- from:self ---

    it('from:self: only fires when event.target is the element', function() {
        window.fooCount = 0;
        playground().innerHTML = '<div hx-on="click from:self -> window.fooCount++"><span>child</span></div>';
        htmx.process(playground());
        let div = playground().querySelector('div');
        playground().querySelector('span').click(); // bubbles, target=span → skip
        window.fooCount.should.equal(0);
        div.click(); // target=div → fire
        window.fooCount.should.equal(1);
        delete window.fooCount;
    });

    // --- from:outside ---

    it('from:outside: fires only when event is outside the element', function() {
        window.outsideCount = 0;
        playground().innerHTML = '<button hx-on="click from:outside -> window.outsideCount++">x</button><div id="other"></div>';
        htmx.process(playground());
        let btn = playground().querySelector('button');
        btn.click(); // inside → skip
        window.outsideCount.should.equal(0);
        playground().querySelector('#other').click(); // outside → fire
        window.outsideCount.should.equal(1);
        // Clean up document-level listener
        for (let l of (btn._htmx?.listeners || [])) l.fromElt.removeEventListener(l.eventName, l.handler);
        delete window.outsideCount;
    });

    // --- capture ---

    it('capture: fires during capture phase', function() {
        let order = [];
        playground().innerHTML = '<div id="outer"><button hx-on="click capture -> window.captureOrder.push(\'capture\')">x</button></div>';
        window.captureOrder = order;
        htmx.process(playground());
        // Add a bubbling listener on the same button for comparison
        playground().querySelector('button').addEventListener('click', () => order.push('bubble'));
        playground().querySelector('button').click();
        // Capture fires before bubble
        order[0].should.equal('capture');
        order[1].should.equal('bubble');
        delete window.captureOrder;
    });

    // --- passive ---

    it('passive: addEventListener is called with passive option', function() {
        // passive handlers cannot call preventDefault without a browser warning,
        // so we just verify the handler fires (option is passed internally)
        window.foo = false;
        let btn = createProcessedHTML('<button hx-on="click passive -> window.foo = true">x</button>');
        btn.click();
        window.foo.should.equal(true);
        delete window.foo;
    });

    // --- filter ---

    it('[filter]: only fires when filter expression is truthy', function() {
        window.fooCount = 0;
        let btn = createProcessedHTML('<button hx-on="keydown[key==\'Enter\'] -> window.fooCount++">x</button>');
        btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        window.fooCount.should.equal(0);
        btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        window.fooCount.should.equal(1);
        delete window.fooCount;
    });

    // --- combined ---

    it('changed + delay: debounced changed-only handler', async function() {
        window.fooCount = 0;
        playground().innerHTML = '<input value="a" hx-on="input changed delay:30ms -> window.fooCount++">';
        htmx.process(playground());
        let inp = playground().querySelector('input');
        // Rapid changes — should debounce
        inp.value = 'b';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.value = 'c';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.value = 'd';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        window.fooCount.should.equal(0);
        await htmx.timeout(60);
        window.fooCount.should.equal(1);
        delete window.fooCount;
    });

    it('once + from:self: only counts toward once when self matches', function() {
        window.fooCount = 0;
        playground().innerHTML = '<div hx-on="click once from:self -> window.fooCount++"><span>child</span></div>';
        htmx.process(playground());
        let div = playground().querySelector('div');
        let span = playground().querySelector('span');
        span.click(); // bubbles, target=span → skipped
        span.click(); // same
        window.fooCount.should.equal(0);
        div.click(); // target=div → fires; this is the once
        window.fooCount.should.equal(1);
        div.click(); // listener now removed
        window.fooCount.should.equal(1);
        delete window.fooCount;
    });

    it('once + from:outside: only counts toward once when outside matches', function() {
        window.outsideCount = 0;
        playground().innerHTML = '<button hx-on="click once from:outside -> window.outsideCount++">x</button><div id="other"></div>';
        htmx.process(playground());
        let btn = playground().querySelector('button');
        let other = playground().querySelector('#other');
        btn.click(); // inside → skipped
        btn.click(); // same
        window.outsideCount.should.equal(0);
        other.click(); // outside → fires; consumes once
        window.outsideCount.should.equal(1);
        other.click(); // listener now removed
        window.outsideCount.should.equal(1);
        for (let l of (btn._htmx?.listeners || [])) l.fromElt.removeEventListener(l.eventName, l.handler);
        delete window.outsideCount;
    });

    // --- multiple events ---

    it('multiple events: separated by semicolons', function() {
        window.focusFired = false;
        window.blurFired = false;
        playground().innerHTML = '<input hx-on="focus -> window.focusFired = true; blur -> window.blurFired = true">';
        htmx.process(playground());
        let inp = playground().querySelector('input');
        inp.dispatchEvent(new Event('focus'));
        window.focusFired.should.equal(true);
        inp.dispatchEvent(new Event('blur'));
        window.blurFired.should.equal(true);
        delete window.focusFired;
        delete window.blurFired;
    });

    // --- multi-statement JS ---

    it('multi-statement JS works with braces', function() {
        window.foo = 0;
        let btn = createProcessedHTML('<button hx-on="click -> { window.foo++; window.foo++ }">x</button>');
        btn.click();
        window.foo.should.equal(2);
        delete window.foo;
    });

    it('semicolons inside nested braces are preserved', function() {
        window.foo = 0;
        let btn = createProcessedHTML('<button hx-on="click -> { if (true) { window.foo++; window.foo++ } }">x</button>');
        btn.click();
        window.foo.should.equal(2);
        delete window.foo;
    });

    it('semicolons inside parens are preserved', function() {
        window.foo = 0;
        let btn = createProcessedHTML('<button hx-on="click -> (window.foo++, window.foo++)">x</button>');
        btn.click();
        window.foo.should.equal(2);
        delete window.foo;
    });

    // --- comma: multiple events, same code ---

    it('comma: multiple events fire the same handler', function() {
        window.fooCount = 0;
        let btn = createProcessedHTML('<button hx-on="click, customevt -> window.fooCount++">x</button>');
        btn.click();
        btn.dispatchEvent(new CustomEvent('customevt'));
        window.fooCount.should.equal(2);
        delete window.fooCount;
    });

    // --- arrow functions in JS code ---

    it('arrow functions in JS code do not break parsing', function() {
        let btn = createProcessedHTML('<button hx-on="click -> window.foo = [1,2,3].filter(x => x > 1)">x</button>');
        btn.click();
        window.foo.should.deep.equal([2, 3]);
        delete window.foo;
    });

    // --- multiple events + multi-statement combined ---

    it('multi-statement and multi-event combined', function() {
        window.clickCount = 0;
        window.blurFired = false;
        playground().innerHTML = '<button hx-on="click -> { window.clickCount++; window.clickCount++ }; blur -> window.blurFired = true">x</button>';
        htmx.process(playground());
        let btn = playground().querySelector('button');
        btn.click();
        window.clickCount.should.equal(2);
        btn.dispatchEvent(new Event('blur'));
        window.blurFired.should.equal(true);
        delete window.clickCount;
        delete window.blurFired;
    });

    // --- from with CSS selector ---

    it('from:.selector: listens on matching elements', function() {
        window.foo = false;
        playground().innerHTML = '<div id="source"></div><button hx-on="customevt from:#source -> window.foo = true">x</button>';
        htmx.process(playground());
        playground().querySelector('#source').dispatchEvent(new CustomEvent('customevt'));
        window.foo.should.equal(true);
        delete window.foo;
    });

    // --- hx-on: and hx-on= coexist ---

    it('hx-on: and hx-on= coexist on the same element', function() {
        window.colonFired = false;
        window.arrowFired = false;
        let btn = createProcessedHTML('<button hx-on:click="window.colonFired = true" hx-on="customevt -> window.arrowFired = true">x</button>');
        btn.click();
        window.colonFired.should.equal(true);
        btn.dispatchEvent(new CustomEvent('customevt'));
        window.arrowFired.should.equal(true);
        delete window.colonFired;
        delete window.arrowFired;
    });

    // --- synthetic events ---

    it('load: fires immediately when element is processed', function() {
        window.foo = false;
        createProcessedHTML('<div hx-on="load -> window.foo = true">x</div>');
        window.foo.should.equal(true);
        delete window.foo;
    });

    it('load: works with modifiers', function() {
        window.foo = false;
        createProcessedHTML('<div hx-on="load once -> window.foo = true">x</div>');
        window.foo.should.equal(true);
        delete window.foo;
    });

    it('load: provides this and event', function() {
        let div = createProcessedHTML('<div hx-on="load -> { window.fooThis = this; window.fooType = event.type }">x</div>');
        window.fooThis.should.equal(div);
        window.fooType.should.equal('load');
        delete window.fooThis;
        delete window.fooType;
    });

    it('every: fires repeatedly on interval', async function() {
        window.fooCount = 0;
        playground().innerHTML = '<div hx-on="every 50ms -> window.fooCount++">x</div>';
        htmx.process(playground());
        window.fooCount.should.equal(0);
        await htmx.timeout(130);
        window.fooCount.should.be.at.least(2);
        // Clean up: remove element so interval stops (checks elt.isConnected)
        playground().innerHTML = '';
        delete window.fooCount;
    });

    // --- doc examples: synthetic events ---

    it('load: focuses first input when element is processed', function() {
        let div = createProcessedHTML('<div hx-on:load="this.querySelector(\'input\')?.focus()"><input id="myinput"></div>');
        document.activeElement.id.should.equal('myinput');
    });

    it('revealed: adds class when element intersects', function() {
        let originalIO = window.IntersectionObserver;
        let observerCallback;
        window.IntersectionObserver = function(cb, opts) {
            observerCallback = cb;
            return { observe: function() {}, disconnect: function() {} };
        };
        let div = createProcessedHTML('<div hx-on="revealed -> this.classList.add(\'visible\')">x</div>');
        div.classList.contains('visible').should.equal(false);
        observerCallback([{ isIntersecting: true }]);
        div.classList.contains('visible').should.equal(true);
        window.IntersectionObserver = originalIO;
    });

    it('intersect once: adds class when element becomes visible', function() {
        let originalIO = window.IntersectionObserver;
        let observerCallback, disconnected = false;
        window.IntersectionObserver = function(cb, opts) {
            observerCallback = cb;
            return { observe: function() {}, disconnect: function() { disconnected = true; } };
        };
        let div = createProcessedHTML('<div hx-on="intersect once -> this.classList.add(\'in-view\')">x</div>');
        div.classList.contains('in-view').should.equal(false);
        observerCallback([{ isIntersecting: true }]);
        div.classList.contains('in-view').should.equal(true);
        window.IntersectionObserver = originalIO;
    });

    it('every: updates text content on interval', async function() {
        let div = createProcessedHTML('<div hx-on="every 50ms -> this.textContent = \'updated\'">original</div>');
        div.textContent.should.equal('original');
        await htmx.timeout(80);
        div.textContent.should.equal('updated');
        playground().innerHTML = '';
    });

    // --- backward compat ---

    it('hx-on:click still works (backward compat)', function() {
        let btn = createProcessedHTML('<button hx-on:click="window.foo = true">x</button>');
        btn.click();
        window.foo.should.equal(true);
        delete window.foo;
    });

    it('calling process() multiple times does not duplicate hx-on listeners', function() {
        window.fooCount = 0;
        let btn = createProcessedHTML('<button hx-on:click="window.fooCount++">x</button>');
        htmx.process(btn);
        htmx.process(btn);
        htmx.process(btn);
        btn.click();
        window.fooCount.should.equal(1);
        delete window.fooCount;
    });

    it('calling process() multiple times does not duplicate hx-on= listeners', function() {
        window.fooCount = 0;
        let btn = createProcessedHTML('<button hx-on="click -> window.fooCount++">x</button>');
        htmx.process(btn);
        htmx.process(btn);
        htmx.process(btn);
        btn.click();
        window.fooCount.should.equal(1);
        delete window.fooCount;
    });
})
