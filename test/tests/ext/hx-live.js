describe('hx-live extension', function () {

    let extBackup;

    before(async () => {
        extBackup = backupExtensions();
        clearExtensions();
        htmx.config.extensions = 'hx-live';
        htmx.__approvedExt = 'hx-live';

        let script = document.createElement('script');
        script.src = '../src/ext/hx-live.js';
        await new Promise(resolve => {
            script.onload = resolve;
            document.head.appendChild(script);
        });
    });

    after(() => {
        restoreExtensions(extBackup);
    });

    beforeEach(() => { setupTest(this.currentTest); });
    afterEach(() => { cleanupTest(); });

    // -------------------------------------------------------------------------
    // hx-live attribute behavior
    // -------------------------------------------------------------------------

    it('runs initially when registered', function() {
        let elt = createProcessedHTML('<output hx-live="this.dataset.v = \'init\'"></output>');
        elt.dataset.v.should.equal('init');
    });

    it('recomputes on input event', async function() {
        playground().innerHTML = `
            <input id="src" value="hello">
            <output hx-live="this.dataset.v = q('#src').value"></output>
        `;
        htmx.process(playground());
        let out = playground().querySelector('output');
        out.dataset.v.should.equal('hello');

        let src = playground().querySelector('#src');
        src.value = 'world';
        src.dispatchEvent(new Event('input', { bubbles: true }));
        await htmx.timeout(5);
        out.dataset.v.should.equal('world');
    });

    it('recomputes on change event', async function() {
        playground().innerHTML = `
            <select id="sel"><option>a</option><option>b</option></select>
            <output hx-live="this.dataset.v = q('#sel').value"></output>
        `;
        htmx.process(playground());
        let sel = playground().querySelector('#sel');
        let out = playground().querySelector('output');

        sel.value = 'b';
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        await htmx.timeout(5);
        out.dataset.v.should.equal('b');
    });

    it('recomputes on DOM mutation (attribute change)', async function() {
        playground().innerHTML = `
            <div id="src" data-x="1"></div>
            <output hx-live="this.dataset.v = q('#src').dataset.x"></output>
        `;
        htmx.process(playground());
        let src = playground().querySelector('#src');
        let out = playground().querySelector('output');
        out.dataset.v.should.equal('1');

        src.setAttribute('data-x', '2');
        await htmx.timeout(5);
        out.dataset.v.should.equal('2');
    });

    it('removes itself from liveFns when disconnected', async function() {
        let elt = createProcessedHTML('<output hx-live="window.__liveCallCount = (window.__liveCallCount || 0) + 1"></output>');
        let initial = window.__liveCallCount;
        elt.remove();
        document.body.setAttribute('data-test-trigger', '1');
        await htmx.timeout(5);
        document.body.removeAttribute('data-test-trigger');
        await htmx.timeout(5);
        assert.isAtMost(window.__liveCallCount, initial + 1);
        delete window.__liveCallCount;
    });

    it('hx-ignore skips hx-live', function() {
        playground().innerHTML = '<div hx-ignore><output hx-live="this.dataset.v = \'should-not-run\'"></output></div>';
        htmx.process(playground());
        let out = playground().querySelector('output');
        assert.isUndefined(out.dataset.v);
    });

    it('coalesces multiple sync mutations into one recompute', async function() {
        window.__liveCount = 0;
        let elt = createProcessedHTML('<output hx-live="window.__liveCount++"></output>');
        let initial = window.__liveCount;
        document.body.setAttribute('data-a', '1');
        document.body.setAttribute('data-b', '1');
        document.body.setAttribute('data-c', '1');
        await htmx.timeout(5);
        document.body.removeAttribute('data-a');
        document.body.removeAttribute('data-b');
        document.body.removeAttribute('data-c');
        await htmx.timeout(5);
        let added = window.__liveCount - initial;
        assert.isAtMost(added, 2, 'expected at most 2 coalesced recomputes');
        delete window.__liveCount;
    });

    it('does not re-recompute when a binding writes its own attribute', async function() {
        // A :hidden binding writing the hidden attribute would, if MutationObserver
        // were active during the write, queue a record and trigger another recompute.
        // Verify the change-event causes exactly one recompute, not two.
        window.__selfWriteCount = 0;
        playground().innerHTML = `
            <input id="src" type="checkbox">
            <div :hidden="(window.__selfWriteCount++, q('#src').checked)">x</div>
        `;
        htmx.process(playground());
        await htmx.timeout(10);
        let initial = window.__selfWriteCount;
        let inp = playground().querySelector('#src');
        inp.checked = true;
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        await htmx.timeout(20);
        let added = window.__selfWriteCount - initial;
        assert.equal(added, 1, 'expected 1 recompute, got ' + added);
        delete window.__selfWriteCount;
    });

    it('multiple hx-live elements all run', async function() {
        playground().innerHTML = `
            <output id="a" hx-live="this.dataset.v = '1'"></output>
            <output id="b" hx-live="this.dataset.v = '2'"></output>
            <output id="c" hx-live="this.dataset.v = '3'"></output>
        `;
        htmx.process(playground());
        playground().querySelector('#a').dataset.v.should.equal('1');
        playground().querySelector('#b').dataset.v.should.equal('2');
        playground().querySelector('#c').dataset.v.should.equal('3');
    });

    it('timeout(ms) is available in scope', async function() {
        let elt = createProcessedHTML('<output hx-live="(async () => { await timeout(1); this.dataset.v = \'done\'; })()"></output>');
        await htmx.timeout(20);
        elt.dataset.v.should.equal('done');
    });

    it('hx-live body supports top-level await directly', async function() {
        let elt = createProcessedHTML(
            `<output hx-live="!this.dataset.s && (this.dataset.s='1', this.dataset.v = 'pending', await timeout(5), this.dataset.v = 'done')"></output>`
        );
        elt.dataset.v.should.equal('pending');
        await htmx.timeout(30);
        elt.dataset.v.should.equal('done');
    });

    it('forEvent(event, ms) resolves on event before timeout', async function() {
        let elt = createProcessedHTML('<output hx-live="(async () => { await forEvent(\'go\', 1000); this.dataset.v = \'fired\'; })()"></output>');
        await htmx.timeout(5);
        elt.dispatchEvent(new CustomEvent('go'));
        await htmx.timeout(5);
        elt.dataset.v.should.equal('fired');
    });

    it('forEvent(event, ms) resolves on timeout when event never fires', async function() {
        let elt = createProcessedHTML('<output hx-live="(async () => { await forEvent(\'never\', 10); this.dataset.v = \'timed-out\'; })()"></output>');
        await htmx.timeout(40);
        elt.dataset.v.should.equal('timed-out');
    });

    it('forEvent resolves a timeout with the original arg (discriminator)', async function() {
        window.__waitResultLive = null;
        let elt = createProcessedHTML(
            `<output hx-live="!this.dataset.s && (this.dataset.s='1', (async()=>{ window.__waitResultLive = await forEvent('never', 5) })())"></output>`
        );
        await htmx.timeout(30);
        window.__waitResultLive.should.equal(5);
        delete window.__waitResultLive;
    });

    it('forEvent races multiple events and timeouts', async function() {
        let elt = createProcessedHTML('<output hx-live="(async () => { await forEvent(\'a\', \'b\', 1000); this.dataset.v = \'fired\'; })()"></output>');
        await htmx.timeout(5);
        elt.dispatchEvent(new CustomEvent('b'));
        await htmx.timeout(5);
        elt.dataset.v.should.equal('fired');
    });

    it('nextFrame() resolves on the next animation frame', async function() {
        window.__liveFrameDone = false;
        playground().innerHTML = `
            <output hx-live="(async () => { await nextFrame(); window.__liveFrameDone = true; })()"></output>
        `;
        htmx.process(playground());
        // Synchronously after process, nextFrame() hasn't resolved yet.
        window.__liveFrameDone.should.equal(false);
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        window.__liveFrameDone.should.equal(true);
        delete window.__liveFrameDone;
    });

    it('forEvent cleans up listeners after timeout wins', async function() {
        let count = 0;
        let elt = createProcessedHTML(
            `<output hx-live="!this.dataset.started && (this.dataset.started='1', (async()=>{ await forEvent('cleanup-evt-live', 5); this.dataset.done='1' })())"></output>`
        );
        elt.addEventListener('cleanup-evt-live', () => count++);
        await htmx.timeout(30);
        elt.dataset.done.should.equal('1');
        // forEvent timed out; its internal listener should be removed.
        elt.dispatchEvent(new CustomEvent('cleanup-evt-live'));
        count.should.equal(1);
    });

    it('trigger() fires a CustomEvent from the element', async function() {
        let fired = null;
        playground().innerHTML = '<output hx-live="trigger(\'live-fire\', { x: 1 })"></output>';
        playground().querySelector('output').addEventListener('live-fire', e => fired = e);
        htmx.process(playground());
        await htmx.timeout(1);
        assert.isNotNull(fired);
        fired.detail.x.should.equal(1);
    });

    it('debounce(ms) supersedes prior calls', async function() {
        window.__debounceCountLive = 0;
        playground().innerHTML = `
            <input id="in" value="1">
            <output hx-live="(async () => { await debounce(20); window.__debounceCountLive++; q('#in').value; })()"></output>
        `;
        htmx.process(playground());
        let inp = playground().querySelector('#in');
        for (let i = 0; i < 5; i++) {
            inp.value = String(i);
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            await htmx.timeout(2);
        }
        await htmx.timeout(60);
        assert.isAtMost(window.__debounceCountLive, 2, 'debounce should have superseded most calls');
        delete window.__debounceCountLive;
    });

    it('debounce(ms, fn) runs the closure after the delay', async function() {
        window.__debounceFnCountLive = 0;
        playground().innerHTML = `
            <input id="in" value="1">
            <output hx-live="debounce(20, () => { window.__debounceFnCountLive++; }); q('#in').value;"></output>
        `;
        htmx.process(playground());
        let inp = playground().querySelector('#in');
        for (let i = 0; i < 5; i++) {
            inp.value = String(i);
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            await htmx.timeout(2);
        }
        await htmx.timeout(60);
        assert.isAtMost(window.__debounceFnCountLive, 2, 'debounce(fn) should have superseded most calls');
        assert.isAtLeast(window.__debounceFnCountLive, 1, 'debounce(fn) should have run at least once');
        delete window.__debounceFnCountLive;
    });

    it('debounce(ms, fn) supersedes across separate hx-on events on the same element', async function() {
        window.__hxOnDebounceCountLive = 0;
        playground().innerHTML = `
            <button hx-on:click="debounce(30, () => { window.__hxOnDebounceCountLive++; })">go</button>
        `;
        htmx.process(playground());
        let btn = playground().querySelector('button');
        for (let i = 0; i < 5; i++) {
            btn.click();
            await htmx.timeout(5);
        }
        await htmx.timeout(60);
        window.__hxOnDebounceCountLive.should.equal(1);
        delete window.__hxOnDebounceCountLive;
    });

    it('debounce(ms, fn) keeps distinct closures on independent channels', async function() {
        window.__chALive = 0;
        window.__chBLive = 0;
        playground().innerHTML = `
            <button id="a" hx-on:click="debounce(30, () => { window.__chALive++; })">A</button>
            <button id="b" hx-on:click="debounce(30, () => { window.__chBLive++; })">B</button>
        `;
        htmx.process(playground());
        // Different elements ⇒ different htmxProp ⇒ different debounce instances. Both should fire.
        playground().querySelector('#a').click();
        playground().querySelector('#b').click();
        await htmx.timeout(60);
        window.__chALive.should.equal(1);
        window.__chBLive.should.equal(1);
        delete window.__chALive;
        delete window.__chBLive;
    });

    it('debounce(ms, fn) does not return a promise', function() {
        // Use the htmx.live.q-adjacent debounce factory by running a live expression and capturing the return.
        window.__debounceReturnLive = 'sentinel';
        playground().innerHTML = `
            <output hx-live="window.__debounceReturnLive = debounce(5, () => {});"></output>
        `;
        htmx.process(playground());
        assert.isUndefined(window.__debounceReturnLive);
        delete window.__debounceReturnLive;
    });

    it('processes hx-live added dynamically via htmx.process', function() {
        playground().innerHTML = '';
        let div = document.createElement('div');
        div.innerHTML = '<output hx-live="this.dataset.v = \'dynamic\'"></output>';
        playground().appendChild(div);
        htmx.process(playground());
        div.querySelector('output').dataset.v.should.equal('dynamic');
    });

    it('coalesces recomputes during a swap', async function() {
        window.__swapCountLive = 0;
        playground().innerHTML = `
            <div id="content"><span data-id="1"></span></div>
            <output hx-live="window.__swapCountLive++"></output>
        `;
        htmx.process(playground());
        await htmx.timeout(30);
        let beforeSwap = window.__swapCountLive;

        mockResponse('GET', '/swap-coalesce-live', '<div id="content"><span data-id="2"></span></div>');
        await htmx.ajax('GET', '/swap-coalesce-live', { target: '#content', swap: 'outerHTML' });
        await htmx.timeout(50);

        let added = window.__swapCountLive - beforeSwap;
        // During-swap mutations are coalesced (swaps>0 guard). Pre/post-swap mutations
        // (e.g. htmx-request indicator class) legitimately trigger a recompute each.
        assert.isAtMost(added, 3, 'expected at most a few recomputes, got ' + added);
        delete window.__swapCountLive;
    });

    it.skip('iteration cap warns on runaway', async function() {
        let warned = false;
        let originalWarn = console.warn;
        console.warn = (...args) => {
            if (typeof args[0] === 'string' && args[0].includes('hx-live recompute exceeded')) warned = true;
            originalWarn.apply(console, args);
        };
        try {
            window.__runawayCountLive = 0;
            playground().innerHTML = '<output hx-live="window.__runawayCountLive++"></output>';
            htmx.process(playground());

            for (let i = 0; i < 100; i++) {
                document.body.setAttribute('data-runaway-test-live', String(i));
                await htmx.timeout(5);
            }

            warned.should.equal(true);
            document.body.removeAttribute('data-runaway-test-live');
            delete window.__runawayCountLive;
        } finally {
            console.warn = originalWarn;
        }
    });

    // -------------------------------------------------------------------------
    // q() proxy
    // -------------------------------------------------------------------------

    it('q(string) selects elements', function() {
        playground().innerHTML = '<div class="x">a</div><div class="x">b</div>';
        let proxy = htmx.live.q('.x');
        proxy.count.should.equal(2);
    });

    it('q returns 0-count proxy when no match', function() {
        let proxy = htmx.live.q('.does-not-exist-anywhere');
        proxy.count.should.equal(0);
    });

    it('q(element) wraps a single element', function() {
        playground().innerHTML = '<div id="x"></div>';
        let elt = playground().querySelector('#x');
        let proxy = htmx.live.q(elt);
        proxy.count.should.equal(1);
    });

    it('q(iterable) wraps multiple elements', function() {
        playground().innerHTML = '<div class="x"></div><div class="x"></div>';
        let nodes = playground().querySelectorAll('.x');
        let proxy = htmx.live.q(nodes);
        proxy.count.should.equal(2);
    });

    it('arr() returns a real array', function() {
        playground().innerHTML = '<div class="x"></div><div class="x"></div>';
        let arr = htmx.live.q('.x').arr();
        assert.isArray(arr);
        arr.length.should.equal(2);
    });

    it('iterable via for..of', function() {
        playground().innerHTML = '<div class="x" data-i="0"></div><div class="x" data-i="1"></div>';
        let collected = [];
        for (let e of htmx.live.q('.x')) collected.push(e.dataset.i);
        collected.should.deep.equal(['0', '1']);
    });

    it('property read returns first element value', function() {
        playground().innerHTML = '<input class="x" value="first"><input class="x" value="second">';
        htmx.live.q('.x').value.should.equal('first');
    });

    it('property set propagates to all elements', function() {
        playground().innerHTML = '<input class="x" value="a"><input class="x" value="b">';
        htmx.live.q('.x').value = 'changed';
        let inputs = playground().querySelectorAll('.x');
        inputs[0].value.should.equal('changed');
        inputs[1].value.should.equal('changed');
    });

    it('chained property access returns proxy of subproperties', function() {
        playground().innerHTML = '<div class="x" data-foo="a"></div><div class="x" data-foo="b"></div>';
        let proxy = htmx.live.q('.x').dataset;
        proxy.foo.should.equal('a');
    });

    it('method invocation calls each element, returns first result', function() {
        playground().innerHTML = '<div class="x"><span>first</span></div><div class="x"><span>second</span></div>';
        let result = htmx.live.q('.x').querySelector('span');
        result.textContent.should.equal('first');
    });

    it('q().trigger() fires CustomEvent on each element', function() {
        playground().innerHTML = '<div class="x"></div><div class="x"></div>';
        let fires = 0;
        for (let e of playground().querySelectorAll('.x')) {
            e.addEventListener('zap', () => fires++);
        }
        htmx.live.q('.x').trigger('zap');
        fires.should.equal(2);
    });

    it('q().insert() inserts HTML at the given position', function() {
        playground().innerHTML = '<div class="x"><p>orig</p></div>';
        htmx.live.q('.x').insert('end', '<span class="added">new</span>');
        playground().querySelectorAll('.added').length.should.equal(1);
    });

    it('insert() scope helper inserts HTML relative to this', function() {
        playground().innerHTML = `
            <button hx-on:click="insert('after', '<span class=&quot;added&quot;>+</span>')">Add</button>
        `;
        htmx.process(playground());
        let btn = playground().querySelector('button');
        btn.click();
        playground().querySelectorAll('.added').length.should.equal(1);
        btn.nextElementSibling.classList.contains('added').should.equal(true);
    });

    it('q().take() moves a class from other elements to selected ones', function() {
        playground().innerHTML = `
            <button class="tab selected">a</button>
            <button class="tab">b</button>
            <button class="tab">c</button>
        `;
        let target = playground().querySelectorAll('.tab')[2];
        htmx.live.q(target).take('.selected', '.tab');

        let tabs = playground().querySelectorAll('.tab');
        tabs[0].classList.contains('selected').should.equal(false);
        tabs[1].classList.contains('selected').should.equal(false);
        tabs[2].classList.contains('selected').should.equal(true);
    });

    it('htmx.live.q(target).take() moves a class between elements (selectors)', function() {
        playground().innerHTML = `
            <button class="tab selected">a</button>
            <button class="tab">b</button>
            <button class="tab" id="t3">c</button>
        `;
        htmx.live.q('#t3').take('.selected', '.tab');

        let tabs = playground().querySelectorAll('.tab');
        tabs[0].classList.contains('selected').should.equal(false);
        tabs[1].classList.contains('selected').should.equal(false);
        tabs[2].classList.contains('selected').should.equal(true);
    });

    it('take() is available at top-level in hx-on expressions', function() {
        playground().innerHTML = `
            <div class="tabs">
                <button class="tab selected">a</button>
                <button class="tab">b</button>
                <button class="tab" hx-on:click="take('.selected', '.tab')">c</button>
            </div>
        `;
        htmx.process(playground());

        let tabs = playground().querySelectorAll('.tab');
        tabs[2].click();
        tabs[0].classList.contains('selected').should.equal(false);
        tabs[1].classList.contains('selected').should.equal(false);
        tabs[2].classList.contains('selected').should.equal(true);
    });

    it('take() with no scope defaults to parent (sibling scope)', function() {
        playground().innerHTML = `
            <nav>
                <button class="active">a</button>
                <button id="t">b</button>
                <button class="active">c</button>
            </nav>
            <div class="active">unrelated</div>
        `;
        htmx.live.q('#t').take('.active');
        // Siblings lose .active
        let nav = playground().querySelector('nav');
        nav.querySelectorAll('.active').length.should.equal(1);
        playground().querySelector('#t').classList.contains('active').should.equal(true);
        // Unrelated element outside parent is untouched
        playground().querySelector('div').classList.contains('active').should.equal(true);
    });

    it('take() with element scope searches within that container', function() {
        playground().innerHTML = `
            <nav id="nav1">
                <button class="active">a</button>
                <button id="t">b</button>
            </nav>
            <nav id="nav2">
                <button class="active">x</button>
                <button>y</button>
            </nav>
        `;
        let nav1 = playground().querySelector('#nav1');
        htmx.live.q('#t').take('.active', nav1);
        playground().querySelector('#t').classList.contains('active').should.equal(true);
        playground().querySelector('#nav1 button').classList.contains('active').should.equal(false);
        // nav2 is untouched
        playground().querySelector('#nav2 .active').should.not.be.null;
    });

    it('take() in hx-on with this as scope (tabs pattern)', function() {
        playground().innerHTML = `
            <nav hx-on:click="
                let btn = event.target.closest('button');
                if (!btn) return;
                q(btn).take('.active', this);
            ">
                <button class="active">Home</button>
                <button>About</button>
                <button id="click-me">Contact</button>
            </nav>
            <div class="active">unrelated</div>
        `;
        htmx.process(playground());
        playground().querySelector('#click-me').click();
        let buttons = playground().querySelectorAll('nav button');
        buttons[0].classList.contains('active').should.equal(false);
        buttons[1].classList.contains('active').should.equal(false);
        buttons[2].classList.contains('active').should.equal(true);
        // Unrelated element outside nav is untouched
        playground().querySelector('div').classList.contains('active').should.equal(true);
    });

    it('take() canonical sibling form in hx-on', function() {
        playground().innerHTML = `
            <nav>
                <button class="active" hx-on:click="take('.active')">A</button>
                <button hx-on:click="take('.active')">B</button>
                <button hx-on:click="take('.active')" id="click-me">C</button>
            </nav>
            <button class="active">unrelated</button>
        `;
        htmx.process(playground());
        playground().querySelector('#click-me').click();
        let navBtns = playground().querySelectorAll('nav button');
        navBtns[0].classList.contains('active').should.equal(false);
        navBtns[1].classList.contains('active').should.equal(false);
        navBtns[2].classList.contains('active').should.equal(true);
        // Unrelated button outside nav is untouched
        playground().querySelector('nav + button').classList.contains('active').should.equal(true);
    });

    it('take() with ARIA and no scope defaults to parent', function() {
        playground().innerHTML = `
            <div role="tablist">
                <button role="tab" aria-selected="true">a</button>
                <button role="tab" aria-selected="false" id="t">b</button>
            </div>
            <button aria-selected="true">unrelated</button>
        `;
        htmx.live.q('#t').take('aria-selected');
        let tabs = playground().querySelectorAll('[role=tab]');
        tabs[0].getAttribute('aria-selected').should.equal('false');
        tabs[1].getAttribute('aria-selected').should.equal('true');
        // Unrelated element outside parent is untouched
        playground().querySelector('div + button').getAttribute('aria-selected').should.equal('true');
    });

    it('take() accepts options object { from: selector }', function() {
        playground().innerHTML = `
            <button class="tab selected">a</button>
            <button class="tab">b</button>
            <button class="tab" id="t3">c</button>
            <button class="other selected">outside</button>
        `;
        htmx.live.q('#t3').take('.selected', { from: '.tab' });
        let tabs = playground().querySelectorAll('.tab');
        tabs[0].classList.contains('selected').should.equal(false);
        tabs[2].classList.contains('selected').should.equal(true);
        // .other is NOT a .tab, so its .selected stays
        playground().querySelector('.other').classList.contains('selected').should.equal(true);
    });

    it('take() with ARIA attribute writes true on me, false on others', function() {
        playground().innerHTML = `
            <button role="tab" aria-selected="true">a</button>
            <button role="tab" aria-selected="false">b</button>
            <button role="tab" id="t3" aria-selected="false">c</button>
        `;
        htmx.live.q('#t3').take('aria-selected', '[role=tab]');
        let tabs = playground().querySelectorAll('[role=tab]');
        tabs[0].getAttribute('aria-selected').should.equal('false');
        tabs[1].getAttribute('aria-selected').should.equal('false');
        tabs[2].getAttribute('aria-selected').should.equal('true');
    });

    it('toggle() is available at top-level in hx-on expressions and applies to current element', function() {
        playground().innerHTML = `
            <button aria-pressed="false" hx-on:click="toggle('.active'); toggle('aria-pressed')">x</button>
        `;
        htmx.process(playground());
        let btn = playground().querySelector('button');
        btn.click();
        btn.classList.contains('active').should.equal(true);
        btn.getAttribute('aria-pressed').should.equal('true');
        btn.click();
        btn.classList.contains('active').should.equal(false);
        btn.getAttribute('aria-pressed').should.equal('false');
    });

    it('toggle() in hx-live applies to the current element on each recompute', async function() {
        // Use a one-shot recompute to flip a class once and confirm targeting.
        let elt = createProcessedHTML(
            `<output hx-live="!this.dataset.s && (this.dataset.s='1', toggle('.flipped'))"></output>`
        );
        await htmx.timeout(5);
        elt.classList.contains('flipped').should.equal(true);
    });

    it('directional: closest', function() {
        playground().innerHTML = '<section><div id="inner"></div></section>';
        let inner = playground().querySelector('#inner');
        let proxy = htmx.live.q(inner);
        proxy.count.should.equal(1);
    });

    it('directional: first picks the first match', function() {
        playground().innerHTML = '<i class="z">a</i><i class="z">b</i><i class="z">c</i>';
        let proxy = htmx.live.q('first .z');
        proxy.count.should.equal(1);
        proxy.textContent.should.equal('a');
    });

    it('directional: last picks the last match', function() {
        playground().innerHTML = '<i class="z">a</i><i class="z">b</i><i class="z">c</i>';
        let proxy = htmx.live.q('last .z');
        proxy.count.should.equal(1);
        proxy.textContent.should.equal('c');
    });

    it('"sel in #scope" scopes to a different root', function() {
        playground().innerHTML = '<div class="z">outside</div><section id="scope"><div class="z">inside</div></section>';
        let proxy = htmx.live.q('.z in #scope');
        proxy.count.should.equal(1);
        proxy.textContent.should.equal('inside');
    });

    it('"sel in #unknown" returns empty proxy when scope is missing', function() {
        let proxy = htmx.live.q('.z in #does-not-exist');
        proxy.count.should.equal(0);
    });

    it('"sel in .multi" unions matches across all root elements in document order', function() {
        playground().innerHTML =
            '<section class="bar"><span class="foo">a</span></section>' +
            '<section><span class="foo">skip</span></section>' +
            '<section class="bar"><span class="foo">b</span><span class="foo">c</span></section>';
        let proxy = htmx.live.q('.foo in .bar');
        proxy.count.should.equal(3);
        proxy.arr().map(e => e.textContent).should.deep.equal(['a', 'b', 'c']);
    });

    it('"sel in me" scopes to the current hx-live element (alias of "this")', async function() {
        playground().innerHTML = `
            <div hx-live="this.dataset.v = q('span in me').count">
                <span>a</span>
                <span>b</span>
            </div>
            <span>outside</span>
        `;
        htmx.process(playground());
        await htmx.timeout(5);
        playground().querySelector('div').dataset.v.should.equal('2');
    });

    it('"sel in me" and "sel in this" return the same elements', async function() {
        playground().innerHTML = `
            <div id="me-vs-this" hx-live="
                this.dataset.me = q('span in me').count;
                this.dataset.this = q('span in this').count;
            ">
                <span>a</span>
                <span>b</span>
                <span>c</span>
            </div>
        `;
        htmx.process(playground());
        await htmx.timeout(5);
        let div = playground().querySelector('#me-vs-this');
        div.dataset.me.should.equal('3');
        div.dataset.this.should.equal('3');
    });

    it('"first sel in .multi" picks the first match across all roots', function() {
        playground().innerHTML =
            '<section class="bar"><span class="foo">a</span></section>' +
            '<section class="bar"><span class="foo">b</span></section>';
        htmx.live.q('first .foo in .bar').textContent.should.equal('a');
        htmx.live.q('last .foo in .bar').textContent.should.equal('b');
    });

    it('toggle(".foo") toggles a class', function() {
        playground().innerHTML = '<div class="x"></div><div class="x active"></div>';
        let p = htmx.live.q('.x');
        p.toggle('.active');
        playground().querySelectorAll('.x.active').length.should.equal(1);
        playground().querySelectorAll('.x:not(.active)').length.should.equal(1);
    });

    it('toggle("attr") toggles boolean attribute presence', function() {
        playground().innerHTML = '<input class="x"><input class="x" disabled>';
        htmx.live.q('.x').toggle('disabled');
        let inputs = playground().querySelectorAll('.x');
        inputs[0].hasAttribute('disabled').should.equal(true);
        inputs[1].hasAttribute('disabled').should.equal(false);
    });

    it('toggle("aria-*") flips between "true" and "false"', function() {
        playground().innerHTML = '<button id="a"></button><button id="b" aria-pressed="true"></button>';
        let p = htmx.live.q('button');
        p.toggle('aria-pressed');
        // a had no aria-pressed (effectively absent → not "true") → becomes "true"
        playground().querySelector('#a').getAttribute('aria-pressed').should.equal('true');
        // b had "true" → becomes "false"
        playground().querySelector('#b').getAttribute('aria-pressed').should.equal('false');
        // toggle again
        p.toggle('aria-pressed');
        playground().querySelector('#a').getAttribute('aria-pressed').should.equal('false');
        playground().querySelector('#b').getAttribute('aria-pressed').should.equal('true');
    });

    it('toggle(name, "a|b|c") cycles attribute through values', function() {
        playground().innerHTML = '<div></div>';
        let div = playground().querySelector('div');
        let p = htmx.live.q('div');
        p.toggle('data-mode', 'light|dark|auto');
        div.getAttribute('data-mode').should.equal('light');
        p.toggle('data-mode', 'light|dark|auto');
        div.getAttribute('data-mode').should.equal('dark');
        p.toggle('data-mode', 'light|dark|auto');
        div.getAttribute('data-mode').should.equal('auto');
        p.toggle('data-mode', 'light|dark|auto');
        div.getAttribute('data-mode').should.equal('light');
    });

    it('toggle(name, [array]) cycles attribute through values (array form)', function() {
        playground().innerHTML = '<div></div>';
        let div = playground().querySelector('div');
        let p = htmx.live.q('div');
        p.toggle('data-mode', ['light', 'dark', 'auto']);
        div.getAttribute('data-mode').should.equal('light');
        p.toggle('data-mode', ['light', 'dark', 'auto']);
        div.getAttribute('data-mode').should.equal('dark');
    });

    it('toggle(name, "v|") cycles attribute between value and absent', function() {
        playground().innerHTML = '<div></div>';
        let div = playground().querySelector('div');
        let p = htmx.live.q('div');
        p.toggle('data-state', 'on|');
        div.getAttribute('data-state').should.equal('on');
        p.toggle('data-state', 'on|');
        div.hasAttribute('data-state').should.equal(false);
        p.toggle('data-state', 'on|');
        div.getAttribute('data-state').should.equal('on');
    });

    it('toggle cycle snaps to first value when current is out-of-list', function() {
        playground().innerHTML = '<div data-mode="weird"></div>';
        let div = playground().querySelector('div');
        htmx.live.q('div').toggle('data-mode', 'light|dark|auto');
        div.getAttribute('data-mode').should.equal('light');
    });

    it('toggle(".class", "a|b|c") cycles through classes (only one at a time)', function() {
        playground().innerHTML = '<div></div>';
        let div = playground().querySelector('div');
        let p = htmx.live.q('div');
        p.toggle('.size', 'sm|md|lg');
        div.classList.contains('sm').should.equal(true);
        p.toggle('.size', 'sm|md|lg');
        div.classList.contains('md').should.equal(true);
        div.classList.contains('sm').should.equal(false);
        p.toggle('.size', 'sm|md|lg');
        div.classList.contains('lg').should.equal(true);
        div.classList.contains('md').should.equal(false);
    });

    it('toggle is chainable', function() {
        playground().innerHTML = '<button></button>';
        let r = htmx.live.q('button').toggle('.active').toggle('aria-pressed').trigger('changed');
        r.count.should.equal(1);
        let btn = playground().querySelector('button');
        btn.classList.contains('active').should.equal(true);
        btn.getAttribute('aria-pressed').should.equal('true');
    });

    it('proxy.trigger/insert/take return the proxy for chaining', function() {
        playground().innerHTML = '<div class="src">a</div><div class="dst"></div><div class="dst"></div>';
        let dst = htmx.live.q('.dst');
        let r = dst.take('.active', '.src').trigger('refresh').insert('end', '<span>x</span>');
        r.count.should.equal(2);
        playground().querySelectorAll('.dst.active').length.should.equal(2);
        playground().querySelectorAll('.src.active').length.should.equal(0);
        playground().querySelectorAll('.dst > span').length.should.equal(2);
    });

    it('proxy exposes array methods (map, filter, reduce, forEach)', function() {
        playground().innerHTML = '<div class="x">a</div><div class="x">b</div><div class="x">c</div>';
        let proxy = htmx.live.q('.x');
        proxy.map(e => e.textContent).should.deep.equal(['a', 'b', 'c']);
        proxy.filter(e => e.textContent !== 'b').length.should.equal(2);
        proxy.reduce((acc, e) => acc + e.textContent, '').should.equal('abc');
        let collected = [];
        proxy.forEach(e => collected.push(e.textContent));
        collected.should.deep.equal(['a', 'b', 'c']);
        proxy.some(e => e.textContent === 'b').should.equal(true);
        proxy.every(e => e.textContent.length === 1).should.equal(true);
        proxy.find(e => e.textContent === 'b').textContent.should.equal('b');
        proxy.at(-1).textContent.should.equal('c');
    });

    it('q is exposed on the htmx public API', function() {
        assert.isFunction(htmx.live.q);
    });

    it('htmx.live namespace exposes q, debounce, and refresh', function() {
        assert.isObject(htmx.live);
        assert.isFunction(htmx.live.q);
        assert.isFunction(htmx.live.debounce);
        assert.isFunction(htmx.live.refresh);
        assert.isFunction(htmx.live.toggle);
    });

    it('classList scope helper accesses this.classList', function() {
        playground().innerHTML = `
            <button hx-on:click="classList.add('done'); classList.remove('pending')">Go</button>
        `;
        htmx.process(playground());
        let btn = playground().querySelector('button');
        btn.classList.add('pending');
        btn.click();
        btn.classList.contains('done').should.equal(true);
        btn.classList.contains('pending').should.equal(false);
    });

    it('htmx.live.toggle(target, name) toggles across matches', function() {
        playground().innerHTML = `
            <div class="tab"></div>
            <div class="tab active"></div>
        `;
        htmx.live.toggle('.tab', '.active');
        let tabs = playground().querySelectorAll('.tab');
        tabs[0].classList.contains('active').should.equal(true);
        tabs[1].classList.contains('active').should.equal(false);
    });

    it('htmx.live.refresh() recomputes live expressions even when no DOM event triggered', async function() {
        // Using a non-reactive external value: the expression reads window.__refreshSrcLive.
        // Mutating that value will not trigger any DOM input/change/mutation listener,
        // so without an explicit refresh() the expression won't recompute.
        window.__refreshSrcLive = 'first';
        let elt = createProcessedHTML(
            '<output hx-live="this.dataset.v = window.__refreshSrcLive"></output>'
        );
        elt.dataset.v.should.equal('first');

        window.__refreshSrcLive = 'second';
        // No DOM mutation happened; the expression should still hold the old value.
        elt.dataset.v.should.equal('first');

        htmx.live.refresh();
        await htmx.timeout(5);
        elt.dataset.v.should.equal('second');
        delete window.__refreshSrcLive;
    });

    it('q in hx-live scope resolves directionals relative to the element', async function() {
        playground().innerHTML = `
            <div id="anchor">
                <input value="seed">
            </div>
            <output hx-live="this.dataset.v = q('first input in #anchor').value"></output>
        `;
        htmx.process(playground());
        await htmx.timeout(5);
        playground().querySelector('output').dataset.v.should.equal('seed');
    });

    // -------------------------------------------------------------------------
    // scope injection in hx-on (via htmx:scope hook)
    // -------------------------------------------------------------------------

    it('chained q: climb-and-collect via closest', function() {
        playground().innerHTML = `
            <div class="field"><input class="x invalid"></div>
            <div class="field"><input class="x"></div>
            <div class="field"><input class="x invalid"></div>
        `;
        let proxy = htmx.live.q('.invalid').q('closest .field');
        proxy.count.should.equal(2);
    });

    it('chained q: first per group', function() {
        playground().innerHTML = `
            <section><span class="i">a</span><span class="i">b</span></section>
            <section><span class="i">c</span><span class="i">d</span></section>
        `;
        let proxy = htmx.live.q('section').q('first .i');
        proxy.count.should.equal(2);
        proxy.arr().map(e => e.textContent).should.deep.equal(['a', 'c']);
    });

    it('chained q: plain selector scopes to descendants of each parent', function() {
        playground().innerHTML = `
            <article><p class="t">a</p></article>
            <article><p class="t">b</p></article>
            <p class="t">outside</p>
        `;
        let proxy = htmx.live.q('article').q('.t');
        proxy.count.should.equal(2);
    });

    it('chained q: dedups overlapping results', function() {
        playground().innerHTML = `
            <div class="parent"><div class="parent"><span class="x"></span></div></div>
        `;
        let proxy = htmx.live.q('.parent').q('.x');
        proxy.count.should.equal(1);
    });

    it('q is available in hx-on scope and bound to element', function() {
        playground().innerHTML = '<button hx-on:click="window.fooLive = q(\'next #target\').textContent">x</button><div id="target">tgt</div>';
        htmx.process(playground());
        playground().querySelector('button').click();
        window.fooLive.should.equal('tgt');
        delete window.fooLive;
    });

    // -------------------------------------------------------------------------
    // attr() scope helper
    // -------------------------------------------------------------------------

    it('attr() getter: boolean attr returns boolean', function() {
        playground().innerHTML = '<input id="a" disabled><input id="b">';
        htmx.live.attr('#a', 'disabled').should.equal(true);
        htmx.live.attr('#b', 'disabled').should.equal(false);
    });

    it('attr() getter: ARIA returns boolean from "true"/"false"', function() {
        playground().innerHTML = '<div id="a" aria-expanded="true"></div><div id="b" aria-expanded="false"></div>';
        htmx.live.attr('#a', 'aria-expanded').should.equal(true);
        htmx.live.attr('#b', 'aria-expanded').should.equal(false);
    });

    it('attr() getter: .class returns boolean (has class)', function() {
        playground().innerHTML = '<div id="a" class="foo"></div><div id="b"></div>';
        htmx.live.attr('#a', '.foo').should.equal(true);
        htmx.live.attr('#b', '.foo').should.equal(false);
    });

    it('attr() getter: class returns full class string', function() {
        playground().innerHTML = '<div id="a" class="foo bar baz"></div>';
        htmx.live.attr('#a', 'class').should.equal('foo bar baz');
    });

    it('attr() getter: regular attr returns string or null', function() {
        playground().innerHTML = '<div id="a" data-x="hello"></div><div id="b"></div>';
        htmx.live.attr('#a', 'data-x').should.equal('hello');
        assert.isNull(htmx.live.attr('#b', 'data-x'));
    });

    it('attr() getter: checked returns property value', function() {
        playground().innerHTML = '<input id="a" type="checkbox" checked><input id="b" type="checkbox">';
        htmx.live.attr('#a', 'checked').should.equal(true);
        htmx.live.attr('#b', 'checked').should.equal(false);
    });

    it('attr() getter: value returns property value', function() {
        playground().innerHTML = '<input id="a" value="hello">';
        let inp = playground().querySelector('#a');
        // After user interaction the property and attribute can diverge
        inp.value = 'world';
        htmx.live.attr('#a', 'value').should.equal('world');
    });

    it('attr() setter: boolean attr truthy sets, falsy removes', function() {
        playground().innerHTML = '<input id="a">';
        htmx.live.attr('#a', 'disabled', true);
        playground().querySelector('#a').hasAttribute('disabled').should.equal(true);
        htmx.live.attr('#a', 'disabled', false);
        playground().querySelector('#a').hasAttribute('disabled').should.equal(false);
    });

    it('attr() setter: ARIA writes "true"/"false", never removes', function() {
        playground().innerHTML = '<div id="a"></div>';
        let div = playground().querySelector('#a');
        htmx.live.attr('#a', 'aria-expanded', true);
        div.getAttribute('aria-expanded').should.equal('true');
        htmx.live.attr('#a', 'aria-expanded', false);
        div.getAttribute('aria-expanded').should.equal('false');
        // null/undefined also writes "false". ARIA is never removed.
        htmx.live.attr('#a', 'aria-expanded', null);
        div.getAttribute('aria-expanded').should.equal('false');
    });

    it('attr() setter: aria-* strings and numbers pass through', function() {
        playground().innerHTML = '<div id="a"></div><div id="b"></div><div id="c"></div>';
        // String values (tristate, tokens) pass through unchanged.
        htmx.live.attr('#a', 'aria-pressed', 'mixed');
        playground().querySelector('#a').getAttribute('aria-pressed').should.equal('mixed');
        htmx.live.attr('#b', 'aria-current', 'page');
        playground().querySelector('#b').getAttribute('aria-current').should.equal('page');
        // Numbers stringify (e.g. aria-valuenow).
        htmx.live.attr('#c', 'aria-valuenow', 50);
        playground().querySelector('#c').getAttribute('aria-valuenow').should.equal('50');
    });

    it('attr() setter: .class true/false add/remove', function() {
        playground().innerHTML = '<div id="a"></div>';
        let div = playground().querySelector('#a');
        htmx.live.attr('#a', '.active', true);
        div.classList.contains('active').should.equal(true);
        htmx.live.attr('#a', '.active', false);
        div.classList.contains('active').should.equal(false);
    });

    it('attr() setter: class (string) sets managed class list', function() {
        playground().innerHTML = '<div id="a" class="external"></div>';
        let div = playground().querySelector('#a');
        htmx.live.attr('#a', 'class', 'foo bar');
        div.classList.contains('external').should.equal(true);
        div.classList.contains('foo').should.equal(true);
        div.classList.contains('bar').should.equal(true);

        // Re-apply with different set. Previous managed dropped, external untouched.
        htmx.live.attr('#a', 'class', 'baz');
        div.classList.contains('external').should.equal(true);
        div.classList.contains('foo').should.equal(false);
        div.classList.contains('bar').should.equal(false);
        div.classList.contains('baz').should.equal(true);
    });

    it('attr() setter: class (object) toggles each independently', function() {
        playground().innerHTML = '<div id="a" class="external"></div>';
        let div = playground().querySelector('#a');
        htmx.live.attr('#a', 'class', { foo: true, bar: false });
        div.classList.contains('foo').should.equal(true);
        div.classList.contains('bar').should.equal(false);
        div.classList.contains('external').should.equal(true);

        // Flip foo, set bar
        htmx.live.attr('#a', 'class', { foo: false, bar: true });
        div.classList.contains('foo').should.equal(false);
        div.classList.contains('bar').should.equal(true);
    });

    it('attr() setter: class (object) supports space-separated keys', function() {
        playground().innerHTML = '<div id="a"></div>';
        let div = playground().querySelector('#a');
        htmx.live.attr('#a', 'class', { 'foo bar': true, baz: false });
        div.classList.contains('foo').should.equal(true);
        div.classList.contains('bar').should.equal(true);
        div.classList.contains('baz').should.equal(false);
    });

    it('attr() setter: checked syncs property and attribute', function() {
        playground().innerHTML = '<input id="a" type="checkbox">';
        let inp = playground().querySelector('#a');
        htmx.live.attr('#a', 'checked', true);
        inp.checked.should.equal(true);
        inp.hasAttribute('checked').should.equal(true);
        htmx.live.attr('#a', 'checked', false);
        inp.checked.should.equal(false);
        inp.hasAttribute('checked').should.equal(false);
    });

    it('attr() setter: value syncs property and attribute', function() {
        playground().innerHTML = '<input id="a" type="text">';
        let inp = playground().querySelector('#a');
        htmx.live.attr('#a', 'value', 'hello');
        inp.value.should.equal('hello');
        inp.getAttribute('value').should.equal('hello');
        htmx.live.attr('#a', 'value', null);
        inp.value.should.equal('');
        inp.hasAttribute('value').should.equal(false);
    });

    it('attr() setter: regular attr null removes', function() {
        playground().innerHTML = '<div id="a" data-x="hello"></div>';
        htmx.live.attr('#a', 'data-x', null);
        playground().querySelector('#a').hasAttribute('data-x').should.equal(false);
    });

    it('attr() setter: regular attr stringifies non-string values', function() {
        playground().innerHTML = '<div id="a"></div>';
        htmx.live.attr('#a', 'data-x', 42);
        playground().querySelector('#a').getAttribute('data-x').should.equal('42');
    });

    it('attr() setter: contenteditable false writes "false" string, not removes', function() {
        playground().innerHTML = '<div id="a"></div>';
        htmx.live.attr('#a', 'contenteditable', false);
        playground().querySelector('#a').getAttribute('contenteditable').should.equal('false');
    });

    it('attr() setter: draggable false writes "false" string', function() {
        playground().innerHTML = '<div id="a"></div>';
        htmx.live.attr('#a', 'draggable', false);
        playground().querySelector('#a').getAttribute('draggable').should.equal('false');
    });

    it('attr() setter: spellcheck false writes "false" string', function() {
        playground().innerHTML = '<div id="a"></div>';
        htmx.live.attr('#a', 'spellcheck', false);
        playground().querySelector('#a').getAttribute('spellcheck').should.equal('false');
    });

    it('attr() setter: contenteditable null removes attribute', function() {
        playground().innerHTML = '<div id="a" contenteditable="true"></div>';
        htmx.live.attr('#a', 'contenteditable', null);
        playground().querySelector('#a').hasAttribute('contenteditable').should.equal(false);
    });

    it('q().attr() applies setter to all matched elements', function() {
        playground().innerHTML = '<input class="x"><input class="x"><input class="x">';
        htmx.live.q('.x').attr('disabled', true);
        let inputs = playground().querySelectorAll('.x');
        for (let inp of inputs) inp.hasAttribute('disabled').should.equal(true);
    });

    it('q().attr() getter returns from first matched element', function() {
        playground().innerHTML = '<div class="x" data-i="a"></div><div class="x" data-i="b"></div>';
        htmx.live.q('.x').attr('data-i').should.equal('a');
    });

    it('q().attr() returns proxy for chaining', function() {
        playground().innerHTML = '<button class="x"></button>';
        let r = htmx.live.q('.x').attr('role', 'button').attr('.active', true);
        r.count.should.equal(1);
        let btn = playground().querySelector('.x');
        btn.getAttribute('role').should.equal('button');
        btn.classList.contains('active').should.equal(true);
    });

    it('attr() is available in hx-on scope bound to element', function() {
        playground().innerHTML = '<button hx-on:click="attr(\'data-clicked\', \'yes\')">x</button>';
        htmx.process(playground());
        let btn = playground().querySelector('button');
        btn.click();
        btn.getAttribute('data-clicked').should.equal('yes');
    });

    it('attr() in hx-live expression operates on current element', async function() {
        let elt = createProcessedHTML(
            `<output hx-live="!this.dataset.s && (this.dataset.s='1', attr('.flipped', true))"></output>`
        );
        await htmx.timeout(5);
        elt.classList.contains('flipped').should.equal(true);
    });

    // -------------------------------------------------------------------------
    // matches() scope helper
    // -------------------------------------------------------------------------

    it('matches() is available in hx-on scope bound to element', function() {
        playground().innerHTML = '<input id="i" type="text" required hx-on:click="window.__matchesLive = matches(\':required\')">';
        htmx.process(playground());
        playground().querySelector('#i').click();
        window.__matchesLive.should.equal(true);
        delete window.__matchesLive;
    });

    it('matches() in hx-live expression operates on current element', async function() {
        playground().innerHTML = `
            <input id="src">
            <div hx-live="this.dataset.has = matches(':has(input)')">
                <input>
            </div>
        `;
        htmx.process(playground());
        await htmx.timeout(5);
        let div = playground().querySelector('[hx-live]');
        div.dataset.has.should.equal('true');
    });

    it('htmx.live.attr is exposed on public API', function() {
        assert.isFunction(htmx.live.attr);
    });

    // -------------------------------------------------------------------------
    // cascading data proxy
    // -------------------------------------------------------------------------

    it('data.foo reads this.dataset.foo when present locally', async function() {
        playground().innerHTML = `
            <div id="me" data-foo="local"
                 hx-on:click="this.dataset.v = data.foo">x</div>
        `;
        htmx.process(playground());
        let elt = playground().querySelector('#me');
        elt.click();
        elt.dataset.v.should.equal('local');
    });

    it('data.foo cascades up to closest ancestor', async function() {
        playground().innerHTML = `
            <section data-currency="USD">
                <article>
                    <span id="me" hx-on:click="this.dataset.v = data.currency">x</span>
                </article>
            </section>
        `;
        htmx.process(playground());
        let elt = playground().querySelector('#me');
        elt.click();
        elt.dataset.v.should.equal('USD');
    });

    it('data.foo returns undefined when no ancestor has it', async function() {
        playground().innerHTML = `
            <div id="me" hx-on:click="this.dataset.v = (data.nonexistent === undefined ? 'undef' : 'set')">x</div>
        `;
        htmx.process(playground());
        let elt = playground().querySelector('#me');
        elt.click();
        elt.dataset.v.should.equal('undef');
    });

    it('data.foo nested: innermost wins (shadowing)', async function() {
        playground().innerHTML = `
            <section data-mode="outer">
                <article data-mode="inner">
                    <span id="me" hx-on:click="this.dataset.v = data.mode">x</span>
                </article>
            </section>
        `;
        htmx.process(playground());
        let elt = playground().querySelector('#me');
        elt.click();
        elt.dataset.v.should.equal('inner');
    });

    it('data.foo = "x" writes to closest ancestor with data-foo', async function() {
        playground().innerHTML = `
            <section data-counter="0">
                <article>
                    <button id="me" hx-on:click="data.counter = +data.counter + 1">+</button>
                </article>
            </section>
        `;
        htmx.process(playground());
        let btn = playground().querySelector('#me');
        let section = playground().querySelector('section');
        btn.click();
        section.dataset.counter.should.equal('1');
        btn.click();
        section.dataset.counter.should.equal('2');
    });

    it('data.foo = "x" writes to this when no ancestor has data-foo', async function() {
        playground().innerHTML = `
            <button id="me" hx-on:click="data.fresh = 'created'">x</button>
        `;
        htmx.process(playground());
        let btn = playground().querySelector('#me');
        btn.click();
        btn.dataset.fresh.should.equal('created');
    });

    it('data.foo++ works (auto-coerces to number)', async function() {
        playground().innerHTML = `
            <section data-counter="5">
                <button id="me" hx-on:click="data.counter++">+</button>
            </section>
        `;
        htmx.process(playground());
        let btn = playground().querySelector('#me');
        let section = playground().querySelector('section');
        btn.click();
        section.dataset.counter.should.equal('6');
    });

    it('data proxy: boolean round-trips through JSON', async function() {
        playground().innerHTML = `
            <section data-active="false">
                <button id="me" hx-on:click="data.active = !data.active">toggle</button>
            </section>
        `;
        htmx.process(playground());
        let btn = playground().querySelector('#me');
        let section = playground().querySelector('section');
        btn.click();
        section.dataset.active.should.equal('true');
        btn.click();
        section.dataset.active.should.equal('false');
    });

    it('data proxy: number round-trips through JSON', async function() {
        playground().innerHTML = `
            <section data-count="0">
                <button id="me" hx-on:click="data.count = data.count + 1">+</button>
            </section>
        `;
        htmx.process(playground());
        let btn = playground().querySelector('#me');
        let section = playground().querySelector('section');
        (typeof section.dataset.count).should.equal('string');
        btn.click();
        section.dataset.count.should.equal('1');
        btn.click();
        section.dataset.count.should.equal('2');
    });

    it('data proxy: object round-trips through JSON', async function() {
        playground().innerHTML = `
            <section data-user='{"name":"alice","age":30}'>
                <button id="me" hx-on:click="data.user = {...data.user, age: data.user.age + 1}">bday</button>
                <span id="out" hx-on:click="this.dataset.v = data.user.name + ':' + data.user.age">read</span>
            </section>
        `;
        htmx.process(playground());
        let btn = playground().querySelector('#me');
        let out = playground().querySelector('#out');
        let section = playground().querySelector('section');
        out.click();
        out.dataset.v.should.equal('alice:30');
        btn.click();
        JSON.parse(section.dataset.user).age.should.equal(31);
        out.click();
        out.dataset.v.should.equal('alice:31');
    });

    it('data proxy: array round-trips through JSON', async function() {
        playground().innerHTML = `
            <section data-items='[]'>
                <button id="add" hx-on:click="data.items = [...data.items, data.items.length]">add</button>
                <span id="out" hx-on:click="this.dataset.v = data.items.length">count</span>
            </section>
        `;
        htmx.process(playground());
        let add = playground().querySelector('#add');
        let out = playground().querySelector('#out');
        let section = playground().querySelector('section');
        out.click();
        out.dataset.v.should.equal('0');
        add.click();
        add.click();
        add.click();
        JSON.parse(section.dataset.items).should.deep.equal([0, 1, 2]);
        out.click();
        out.dataset.v.should.equal('3');
    });

    it('data proxy: plain string stays as string', async function() {
        playground().innerHTML = `
            <div data-label="hello">
                <span id="me" hx-on:click="this.dataset.v = typeof data.label + ':' + data.label">x</span>
            </div>
        `;
        htmx.process(playground());
        let elt = playground().querySelector('#me');
        elt.click();
        elt.dataset.v.should.equal('string:hello');
    });

    it('data proxy: null round-trips through JSON', async function() {
        playground().innerHTML = `
            <section data-val="null">
                <span id="me" hx-on:click="this.dataset.v = (data.val === null ? 'is-null' : 'not-null')">x</span>
            </section>
        `;
        htmx.process(playground());
        let elt = playground().querySelector('#me');
        elt.click();
        elt.dataset.v.should.equal('is-null');
    });

    it('with (data) { foo++ } increments cascading value', async function() {
        playground().innerHTML = `
            <section data-counter="10">
                <button id="me" hx-on:click="with (data) { counter++ }">+</button>
            </section>
        `;
        htmx.process(playground());
        let btn = playground().querySelector('#me');
        let section = playground().querySelector('section');
        btn.click();
        section.dataset.counter.should.equal('11');
    });

    it('with (data) destructuring works for read', async function() {
        playground().innerHTML = `
            <section data-x="5" data-y="3">
                <button id="me" hx-on:click="
                    with (data) {
                        this.dataset.sum = +x + +y;
                    }
                ">x</button>
            </section>
        `;
        htmx.process(playground());
        let btn = playground().querySelector('#me');
        btn.click();
        btn.dataset.sum.should.equal('8');
    });

    it('data.kebabKey camelCase translation works', async function() {
        playground().innerHTML = `
            <div data-my-value="hello">
                <span id="me" hx-on:click="this.dataset.v = data.myValue">x</span>
            </div>
        `;
        htmx.process(playground());
        let elt = playground().querySelector('#me');
        elt.click();
        elt.dataset.v.should.equal('hello');
    });

    it('data proxy supports object spread with cascading values', async function() {
        playground().innerHTML = `
            <section data-x="1" data-y="2" data-user='{"name":"alice"}'>
                <article data-y="3">
                    <button id="me" hx-on:click="window.__spreadDataLive = { ...data }">x</button>
                </article>
            </section>
        `;
        htmx.process(playground());
        playground().querySelector('#me').click();
        window.__spreadDataLive.x.should.equal(1);
        window.__spreadDataLive.y.should.equal(3);
        window.__spreadDataLive.user.should.deep.equal({ name: 'alice' });
        window.__spreadDataLive.should.not.have.property('htmxPowered');
    });

    it('data proxy supports Object.keys/Object.values/Object.entries', async function() {
        playground().innerHTML = `
            <section data-x="1" data-y="2">
                <article data-y="3" data-z="4">
                    <button id="me" hx-on:click="
                        window.__keysDataLive = Object.keys(data);
                        window.__valuesDataLive = Object.values(data);
                        window.__entriesDataLive = Object.entries(data);
                    ">x</button>
                </article>
            </section>
        `;
        htmx.process(playground());
        playground().querySelector('#me').click();
        window.__keysDataLive.slice(0, 3).should.deep.equal(['y', 'z', 'x']);
        window.__valuesDataLive.slice(0, 3).should.deep.equal([3, 4, 1]);
        window.__entriesDataLive.slice(0, 3).should.deep.equal([['y', 3], ['z', 4], ['x', 1]]);
        window.__keysDataLive.should.not.include('htmxPowered');
    });

    it('data proxy supports object rest destructuring', async function() {
        playground().innerHTML = `
            <section data-x="1" data-y="2" data-z="3">
                <button id="me" hx-on:click="
                    let { x, ...rest } = data;
                    window.__restDataLive = rest;
                ">x</button>
            </section>
        `;
        htmx.process(playground());
        playground().querySelector('#me').click();
        window.__restDataLive.y.should.equal(2);
        window.__restDataLive.z.should.equal(3);
        window.__restDataLive.should.not.have.property('x');
        window.__restDataLive.should.not.have.property('htmxPowered');
    });

    it('data is reactive in :attr expressions (re-runs on ancestor data change)', async function() {
        playground().innerHTML = `
            <section data-mode="light">
                <div :class="{ darkmode: data.mode === 'dark' }"></div>
            </section>
        `;
        htmx.process(playground());
        let div = playground().querySelector('div');
        div.classList.contains('darkmode').should.equal(false);

        playground().querySelector('section').dataset.mode = 'dark';
        await new Promise(r => setTimeout(r, 20));
        div.classList.contains('darkmode').should.equal(true);
    });

    it('style scope helper accesses this.style', async function() {
        playground().innerHTML = `
            <div id="me" hx-on:click="style.color = 'red'">x</div>
        `;
        htmx.process(playground());
        let elt = playground().querySelector('#me');
        elt.click();
        elt.style.color.should.equal('red');
    });

    // -------------------------------------------------------------------------
    // Simple form: :attr / hx-live:attr
    // -------------------------------------------------------------------------

    it(':hidden truthy sets attribute, falsy removes', async function() {
        playground().innerHTML = `
            <input id="src" type="checkbox">
            <div :hidden="q('#src').checked">content</div>
        `;
        htmx.process(playground());
        let div = playground().querySelector('div');
        div.hasAttribute('hidden').should.equal(false);

        let inp = playground().querySelector('#src');
        inp.checked = true;
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        await htmx.timeout(5);
        div.hasAttribute('hidden').should.equal(true);

        inp.checked = false;
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        await htmx.timeout(5);
        div.hasAttribute('hidden').should.equal(false);
    });

    it(':disabled toggles boolean attribute', async function() {
        playground().innerHTML = `
            <input id="src" type="checkbox">
            <button :disabled="q('#src').checked">submit</button>
        `;
        htmx.process(playground());
        let btn = playground().querySelector('button');
        btn.hasAttribute('disabled').should.equal(false);

        let inp = playground().querySelector('#src');
        inp.checked = true;
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        await htmx.timeout(5);
        btn.hasAttribute('disabled').should.equal(true);
    });

    it(':aria-expanded writes "true"/"false", never removes', async function() {
        playground().innerHTML = `
            <input id="src" type="checkbox">
            <button :aria-expanded="q('#src').checked">x</button>
        `;
        htmx.process(playground());
        let btn = playground().querySelector('button');
        btn.getAttribute('aria-expanded').should.equal('false');

        let inp = playground().querySelector('#src');
        inp.checked = true;
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        await htmx.timeout(5);
        btn.getAttribute('aria-expanded').should.equal('true');

        inp.checked = false;
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        await htmx.timeout(5);
        btn.getAttribute('aria-expanded').should.equal('false');
    });

    it(':src sets string attribute, null removes', async function() {
        playground().innerHTML = `
            <input id="src" value="alice">
            <img :src="'/avatar/' + q('#src').value">
        `;
        htmx.process(playground());
        let img = playground().querySelector('img');
        img.getAttribute('src').should.equal('/avatar/alice');

        let inp = playground().querySelector('#src');
        inp.value = 'bob';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        await htmx.timeout(5);
        img.getAttribute('src').should.equal('/avatar/bob');
    });

    it('simple form supports top-level await', async function() {
        playground().innerHTML = `<output :text="await Promise.resolve('hello-async')"></output>`;
        htmx.process(playground());
        await htmx.timeout(20);
        playground().querySelector('output').textContent.should.equal('hello-async');
    });

    it(':text writes textContent', async function() {
        playground().innerHTML = `
            <input id="src" value="hello">
            <output :text="q('#src').value"></output>
        `;
        htmx.process(playground());
        let out = playground().querySelector('output');
        out.textContent.should.equal('hello');

        let inp = playground().querySelector('#src');
        inp.value = 'world';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        await htmx.timeout(5);
        out.textContent.should.equal('world');
    });

    it(':html writes innerHTML', async function() {
        playground().innerHTML = `
            <input id="src" value="bold">
            <div :html="'<b>' + q('#src').value + '</b>'"></div>
        `;
        htmx.process(playground());
        let div = playground().querySelector('div');
        div.innerHTML.should.equal('<b>bold</b>');
        div.querySelector('b').textContent.should.equal('bold');
    });

    it(':class string form tracks managed classes, leaves others untouched', async function() {
        playground().innerHTML = `
            <input id="src" value="">
            <div class="external transition" :class="q('#src').value ? 'visible' : 'hidden faded'"></div>
        `;
        htmx.process(playground());
        let div = playground().querySelector('div');
        div.classList.contains('external').should.equal(true);
        div.classList.contains('transition').should.equal(true);
        div.classList.contains('hidden').should.equal(true);
        div.classList.contains('faded').should.equal(true);

        let inp = playground().querySelector('#src');
        inp.value = 'yes';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 20));
        div.classList.contains('external').should.equal(true);
        div.classList.contains('transition').should.equal(true);
        div.classList.contains('hidden').should.equal(false);
        div.classList.contains('faded').should.equal(false);
        div.classList.contains('visible').should.equal(true);
    });

    it(':class object form toggles each independently', async function() {
        playground().innerHTML = `
            <input id="size" value="lg">
            <div class="card" :class="{ large: q('#size').value === 'lg', small: q('#size').value === 'sm' }"></div>
        `;
        htmx.process(playground());
        let div = playground().querySelector('div');
        div.classList.contains('large').should.equal(true);
        div.classList.contains('small').should.equal(false);
        div.classList.contains('card').should.equal(true);

        let inp = playground().querySelector('#size');
        inp.value = 'sm';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        await htmx.timeout(5);
        div.classList.contains('large').should.equal(false);
        div.classList.contains('small').should.equal(true);
        div.classList.contains('card').should.equal(true);
    });

    it(':.foo shorthand toggles a single class on truthiness', async function() {
        playground().innerHTML = `
            <input id="src" type="checkbox">
            <div class="card" :.active="q('#src').checked"></div>
        `;
        htmx.process(playground());
        let div = playground().querySelector('div');
        div.classList.contains('active').should.equal(false);
        div.classList.contains('card').should.equal(true);

        let inp = playground().querySelector('#src');
        inp.checked = true;
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        await htmx.timeout(5);
        div.classList.contains('active').should.equal(true);
        div.classList.contains('card').should.equal(true);

        inp.checked = false;
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        await htmx.timeout(5);
        div.classList.contains('active').should.equal(false);
        div.classList.contains('card').should.equal(true);
    });

    it(':style object form sets only managed properties', async function() {
        playground().innerHTML = `
            <input id="pct" value="50">
            <div style="color: red" :style="{ width: q('#pct').value + '%' }"></div>
        `;
        htmx.process(playground());
        let div = playground().querySelector('div');
        div.style.width.should.equal('50%');
        // Pre-existing inline style preserved
        div.style.color.should.equal('red');
    });

    it(':style string form parses declarations', async function() {
        playground().innerHTML = `
            <input id="pct" value="0.7">
            <progress :style="'--pct: ' + q('#pct').value"></progress>
        `;
        htmx.process(playground());
        let pr = playground().querySelector('progress');
        pr.style.getPropertyValue('--pct').should.equal('0.7');
    });

    it(':style re-renders drop managed properties no longer in expression', async function() {
        playground().innerHTML = `
            <input id="src" value="a">
            <div :style="q('#src').value === 'a' ? { width: '50%' } : { height: '20px' }"></div>
        `;
        htmx.process(playground());
        let div = playground().querySelector('div');
        div.style.width.should.equal('50%');
        div.style.height.should.equal('');

        let inp = playground().querySelector('#src');
        inp.value = 'b';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        await htmx.timeout(5);
        div.style.width.should.equal('');
        div.style.height.should.equal('20px');
    });

    it(':style overlap: binding overwrites matching static property', async function() {
        playground().innerHTML = `
            <input id="color" value="blue">
            <div style="color: red" :style="{ color: q('#color').value }"></div>
        `;
        htmx.process(playground());
        let div = playground().querySelector('div');
        div.style.color.should.equal('blue');
    });

    it(':.foo overlap: binding manages a class also set statically', async function() {
        playground().innerHTML = `
            <input id="src" type="checkbox">
            <div class="active" :.active="q('#src').checked"></div>
        `;
        htmx.process(playground());
        let div = playground().querySelector('div');
        let inp = playground().querySelector('#src');
        // unchecked: binding removes the class even though it was in static class=""
        div.classList.contains('active').should.equal(false);

        inp.checked = true;
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        await htmx.timeout(5);
        div.classList.contains('active').should.equal(true);
    });

    it(':checked syncs property and attribute', async function() {
        playground().innerHTML = `
            <input id="src" type="checkbox">
            <input id="mirror" type="checkbox" :checked="q('#src').checked">
        `;
        htmx.process(playground());
        let src = playground().querySelector('#src');
        let mirror = playground().querySelector('#mirror');
        mirror.checked.should.equal(false);
        mirror.hasAttribute('checked').should.equal(false);

        src.checked = true;
        src.dispatchEvent(new Event('change', { bubbles: true }));
        await htmx.timeout(5);
        mirror.checked.should.equal(true);
        mirror.hasAttribute('checked').should.equal(true);
    });

    it(':value syncs property and attribute', async function() {
        playground().innerHTML = `
            <input id="src" value="hello">
            <input id="mirror" :value="q('#src').value.toUpperCase()">
        `;
        htmx.process(playground());
        let src = playground().querySelector('#src');
        let mirror = playground().querySelector('#mirror');
        mirror.value.should.equal('HELLO');
        mirror.getAttribute('value').should.equal('HELLO');

        src.value = 'world';
        src.dispatchEvent(new Event('input', { bubbles: true }));
        await htmx.timeout(5);
        mirror.value.should.equal('WORLD');
        mirror.getAttribute('value').should.equal('WORLD');
    });

    it('hx-live:disabled (canonical form) works same as :disabled', async function() {
        playground().innerHTML = `
            <input id="src" type="checkbox">
            <button hx-live:disabled="q('#src').checked">submit</button>
        `;
        htmx.process(playground());
        let btn = playground().querySelector('button');
        btn.hasAttribute('disabled').should.equal(false);

        let inp = playground().querySelector('#src');
        inp.checked = true;
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        await htmx.timeout(5);
        btn.hasAttribute('disabled').should.equal(true);
    });

    it('multiple :attrs on one element each reactive independently', async function() {
        playground().innerHTML = `
            <input id="src" type="number" value="0">
            <div :text="q('#src').value"
                 :data-v="q('#src').valueAsNumber * 2"
                 :class="{ big: q('#src').valueAsNumber > 5 }"></div>
        `;
        htmx.process(playground());
        let div = playground().querySelector('div');
        div.textContent.should.equal('0');
        div.dataset.v.should.equal('0');
        div.classList.contains('big').should.equal(false);

        let inp = playground().querySelector('#src');
        inp.value = '10';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 20));
        div.textContent.should.equal('10');
        div.dataset.v.should.equal('20');
        div.classList.contains('big').should.equal(true);
    });

    it('simple form: hx-ignore skips :attr discovery', function() {
        playground().innerHTML = '<div hx-ignore><span :text="\'should-not-run\'"></span></div>';
        htmx.process(playground());
        let span = playground().querySelector('span');
        span.textContent.should.equal('');
    });

    it('simple form: matches() works in :attr expressions', async function() {
        playground().innerHTML = `
            <fieldset :disabled="matches(':has(input:invalid)')">
                <input required>
                <button>submit</button>
            </fieldset>
        `;
        htmx.process(playground());
        let fs = playground().querySelector('fieldset');
        // input is required and empty → :invalid → fieldset has descendant input:invalid → disabled
        fs.hasAttribute('disabled').should.equal(true);

        let inp = playground().querySelector('input');
        inp.value = 'something';
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 20));
        fs.hasAttribute('disabled').should.equal(false);
    });

    it('simple form: registration is idempotent across re-process', function() {
        window.__liveCallCountSimple = 0;
        playground().innerHTML = '<output :text="(window.__liveCallCountSimple = (window.__liveCallCountSimple||0) + 1, \'ok\')"></output>';
        htmx.process(playground());
        let countAfterFirst = window.__liveCallCountSimple;
        // Process again, should not register a second time.
        htmx.process(playground());
        window.__liveCallCountSimple.should.equal(countAfterFirst);
        delete window.__liveCallCountSimple;
    });

    // -------------------------------------------------------------------------
    // morph integration: cleanup + re-registration on attribute change
    // -------------------------------------------------------------------------

    describe('morph integration', function() {

        it('hx-live body: morph changing expression adopts new code, does not duplicate', async function() {
            window.__morphLiveCount = 0;
            playground().innerHTML = '<div id="wrap"><output id="o" hx-live="window.__morphLiveCount++"></output></div>';
            htmx.process(playground());
            await htmx.timeout(5);
            let before = window.__morphLiveCount;

            // outerMorph the element with a changed hx-live expression — morph will
            // detect the attribute change, cleanup the old registration, and re-process.
            await htmx.swap({
                target: '#wrap',
                text: '<div id="wrap"><output id="o" hx-live="window.__morphLiveCount += 10"></output></div>',
                swap: 'outerMorph',
                sourceElement: playground()
            });
            await htmx.timeout(5);

            // Should have incremented by 10 (new code), not 1 (old code).
            let delta = window.__morphLiveCount - before;
            assert.isAtLeast(delta, 10, 'new expression should run');
            assert.equal(delta % 10, 0, 'old expression should not still be running');
            delete window.__morphLiveCount;
        });

        it('hx-live body: morph removing hx-live stops the fn from running', async function() {
            window.__morphRemovedCount = 0;
            playground().innerHTML = '<div id="wrap"><output id="o" hx-live="window.__morphRemovedCount++"></output></div>';
            htmx.process(playground());
            await htmx.timeout(5);

            // outerMorph to a version with hx-live removed — morph cleans up the old fn.
            await htmx.swap({
                target: '#wrap',
                text: '<div id="wrap"><output id="o"></output></div>',
                swap: 'outerMorph',
                sourceElement: playground()
            });

            let countAfterMorph = window.__morphRemovedCount;
            // Trigger a recompute cycle — the old fn should no longer be in fns.
            document.body.setAttribute('data-morph-test-trigger', '1');
            await htmx.timeout(5);
            document.body.removeAttribute('data-morph-test-trigger');
            await htmx.timeout(5);

            window.__morphRemovedCount.should.equal(countAfterMorph);
            delete window.__morphRemovedCount;
        });

        it(':attr binding: morph changing expression adopts new code, does not duplicate', async function() {
            playground().innerHTML = '<div id="wrap"><output id="o" :text="\'original\'"></output></div>';
            htmx.process(playground());
            await htmx.timeout(5);
            playground().querySelector('#o').textContent.should.equal('original');

            await htmx.swap({
                target: '#wrap',
                text: '<div id="wrap"><output id="o" :text="\'updated\'"></output></div>',
                swap: 'outerMorph',
                sourceElement: playground()
            });
            await htmx.timeout(5);

            playground().querySelector('#o').textContent.should.equal('updated');
        });

        it(':attr binding: morph adding a new binding registers it', async function() {
            playground().innerHTML = '<div id="wrap"><output id="o" :text="\'hello\'"></output></div>';
            htmx.process(playground());
            await htmx.timeout(5);

            await htmx.swap({
                target: '#wrap',
                text: '<div id="wrap"><output id="o" :text="\'hello\'" :data-extra="\'added\'"></output></div>',
                swap: 'outerMorph',
                sourceElement: playground()
            });
            await htmx.timeout(5);

            playground().querySelector('#o').dataset.extra.should.equal('added');
        });

        it(':attr binding: morph removing a binding stops it running', async function() {
            window.__morphAttrCount = 0;
            playground().innerHTML = '<div id="wrap"><output id="o" :data-v="(window.__morphAttrCount++, \'x\')"></output></div>';
            htmx.process(playground());
            await htmx.timeout(5);

            await htmx.swap({
                target: '#wrap',
                text: '<div id="wrap"><output id="o"></output></div>',
                swap: 'outerMorph',
                sourceElement: playground()
            });

            let countAfterMorph = window.__morphAttrCount;
            document.body.setAttribute('data-morph-attr-trigger', '1');
            await htmx.timeout(5);
            document.body.removeAttribute('data-morph-attr-trigger');
            await htmx.timeout(5);

            window.__morphAttrCount.should.equal(countAfterMorph);
            delete window.__morphAttrCount;
        });

        it('morph cycle does not accumulate duplicate fns across multiple morphs', async function() {
            window.__morphMultiCount = 0;
            playground().innerHTML = '<div id="wrap"><output id="o" :data-v="(window.__morphMultiCount++, \'x\')"></output></div>';
            htmx.process(playground());
            await htmx.timeout(5);

            // 3 morph cycles with identical content — each should cleanup and re-register once.
            for (let i = 0; i < 3; i++) {
                await htmx.swap({
                    target: '#wrap',
                    text: '<div id="wrap"><output id="o" :data-v="(window.__morphMultiCount++, \'x\')"></output></div>',
                    swap: 'outerMorph',
                    sourceElement: playground()
                });
                await htmx.timeout(5);
            }

            let baseline = window.__morphMultiCount;
            document.body.setAttribute('data-morph-multi-trigger', '1');
            await htmx.timeout(5);
            document.body.removeAttribute('data-morph-multi-trigger');
            await htmx.timeout(5);

            // Should only fire once per binding, not once per morph cycle.
            let delta = window.__morphMultiCount - baseline;
            assert.isAtMost(delta, 2, 'should not accumulate duplicate fns across morph cycles');
            delete window.__morphMultiCount;
        });

    });

});
