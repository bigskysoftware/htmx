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

    it('wait(ms) is available in scope', async function() {
        let elt = createProcessedHTML('<output hx-live="(async () => { await wait(1); this.dataset.v = \'done\'; })()"></output>');
        await htmx.timeout(20);
        elt.dataset.v.should.equal('done');
    });

    it('hx-live body supports top-level await directly', async function() {
        let elt = createProcessedHTML(
            `<output hx-live="!this.dataset.s && (this.dataset.s='1', this.dataset.v = 'pending', await wait(5), this.dataset.v = 'done')"></output>`
        );
        elt.dataset.v.should.equal('pending');
        await htmx.timeout(30);
        elt.dataset.v.should.equal('done');
    });

    it('wait(ms, event) resolves on event before timeout', async function() {
        let elt = createProcessedHTML('<output hx-live="(async () => { await wait(1000, \'go\'); this.dataset.v = \'fired\'; })()"></output>');
        await htmx.timeout(5);
        elt.dispatchEvent(new CustomEvent('go'));
        await htmx.timeout(5);
        elt.dataset.v.should.equal('fired');
    });

    it('wait(ms, event) resolves on timeout when event never fires', async function() {
        let elt = createProcessedHTML('<output hx-live="(async () => { await wait(10, \'never\'); this.dataset.v = \'timed-out\'; })()"></output>');
        await htmx.timeout(40);
        elt.dataset.v.should.equal('timed-out');
    });

    it('wait resolves a timeout with the ms value (discriminator)', async function() {
        window.__waitResult = null;
        let elt = createProcessedHTML(
            `<output hx-live="!this.dataset.s && (this.dataset.s='1', (async()=>{ window.__waitResult = await wait(5, 'never') })())"></output>`
        );
        await htmx.timeout(30);
        window.__waitResult.should.equal(5);
        delete window.__waitResult;
    });

    it('wait races multiple events and timeouts', async function() {
        let elt = createProcessedHTML('<output hx-live="(async () => { await wait(\'a\', \'b\', 1000); this.dataset.v = \'fired\'; })()"></output>');
        await htmx.timeout(5);
        elt.dispatchEvent(new CustomEvent('b'));
        await htmx.timeout(5);
        elt.dataset.v.should.equal('fired');
    });

    it('wait("frame") resolves on the next animation frame', async function() {
        window.__frameDone = false;
        playground().innerHTML = `
            <output hx-live="(async () => { await wait('frame'); window.__frameDone = true; })()"></output>
        `;
        htmx.process(playground());
        // Synchronously after process, wait('frame') hasn't resolved yet.
        window.__frameDone.should.equal(false);
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        window.__frameDone.should.equal(true);
        delete window.__frameDone;
    });

    it('wait("frame", ms) races animation frame against timeout', async function() {
        // 'frame' should win since rAF fires well before 1000ms.
        let elt = createProcessedHTML('<output hx-live="(async () => { this.dataset.v = await wait(\'frame\', 1000); })()"></output>');
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        elt.dataset.v.should.equal('frame');
    });

    it('wait cleans up listeners after timeout wins', async function() {
        let count = 0;
        let elt = createProcessedHTML(
            `<output hx-live="!this.dataset.started && (this.dataset.started='1', (async()=>{ await wait(5, 'cleanup-evt'); this.dataset.done='1' })())"></output>`
        );
        elt.addEventListener('cleanup-evt', () => count++);
        await htmx.timeout(30);
        elt.dataset.done.should.equal('1');
        // wait timed out; its internal listener should be removed.
        elt.dispatchEvent(new CustomEvent('cleanup-evt'));
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
        window.__debounceCount = 0;
        playground().innerHTML = `
            <input id="in" value="1">
            <output hx-live="(async () => { await debounce(20); window.__debounceCount++; q('#in').value; })()"></output>
        `;
        htmx.process(playground());
        let inp = playground().querySelector('#in');
        for (let i = 0; i < 5; i++) {
            inp.value = String(i);
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            await htmx.timeout(2);
        }
        await htmx.timeout(60);
        assert.isAtMost(window.__debounceCount, 2, 'debounce should have superseded most calls');
        delete window.__debounceCount;
    });

    it('debounce(ms, fn) runs the closure after the delay', async function() {
        window.__debounceFnCount = 0;
        playground().innerHTML = `
            <input id="in" value="1">
            <output hx-live="debounce(20, () => { window.__debounceFnCount++; }); q('#in').value;"></output>
        `;
        htmx.process(playground());
        let inp = playground().querySelector('#in');
        for (let i = 0; i < 5; i++) {
            inp.value = String(i);
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            await htmx.timeout(2);
        }
        await htmx.timeout(60);
        assert.isAtMost(window.__debounceFnCount, 2, 'debounce(fn) should have superseded most calls');
        assert.isAtLeast(window.__debounceFnCount, 1, 'debounce(fn) should have run at least once');
        delete window.__debounceFnCount;
    });

    it('debounce(ms, fn) supersedes across separate hx-on events on the same element', async function() {
        window.__hxOnDebounceCount = 0;
        playground().innerHTML = `
            <button hx-on:click="debounce(30, () => { window.__hxOnDebounceCount++; })">go</button>
        `;
        htmx.process(playground());
        let btn = playground().querySelector('button');
        for (let i = 0; i < 5; i++) {
            btn.click();
            await htmx.timeout(5);
        }
        await htmx.timeout(60);
        window.__hxOnDebounceCount.should.equal(1);
        delete window.__hxOnDebounceCount;
    });

    it('debounce(ms, fn) keeps distinct closures on independent channels', async function() {
        window.__chA = 0;
        window.__chB = 0;
        playground().innerHTML = `
            <button id="a" hx-on:click="debounce(30, () => { window.__chA++; })">A</button>
            <button id="b" hx-on:click="debounce(30, () => { window.__chB++; })">B</button>
        `;
        htmx.process(playground());
        // Different elements ⇒ different htmxProp ⇒ different debounce instances. Both should fire.
        playground().querySelector('#a').click();
        playground().querySelector('#b').click();
        await htmx.timeout(60);
        window.__chA.should.equal(1);
        window.__chB.should.equal(1);
        delete window.__chA;
        delete window.__chB;
    });

    it('debounce(ms, fn) does not return a promise', function() {
        // Use the htmx.live.q-adjacent debounce factory by running a live expression and capturing the return.
        window.__debounceReturn = 'sentinel';
        playground().innerHTML = `
            <output hx-live="window.__debounceReturn = debounce(5, () => {});"></output>
        `;
        htmx.process(playground());
        assert.isUndefined(window.__debounceReturn);
        delete window.__debounceReturn;
    });

    it('processes hx-live added dynamically via htmx.process', function() {
        playground().innerHTML = '';
        let div = document.createElement('div');
        div.innerHTML = '<output hx-live="this.dataset.v = \'dynamic\'"></output>';
        playground().appendChild(div);
        htmx.process(playground());
        div.querySelector('output').dataset.v.should.equal('dynamic');
    });

    it('coalesces recomputes during a swap into a single recompute', async function() {
        window.__swapCount = 0;
        playground().innerHTML = `
            <div id="content"><span data-id="1"></span></div>
            <output hx-live="window.__swapCount++"></output>
        `;
        htmx.process(playground());
        await htmx.timeout(30);
        let beforeSwap = window.__swapCount;

        mockResponse('GET', '/swap-coalesce', '<div id="content"><span data-id="2"></span></div>');
        await htmx.ajax('GET', '/swap-coalesce', { target: '#content', swap: 'outerHTML' });
        await htmx.timeout(50);

        let added = window.__swapCount - beforeSwap;
        assert.equal(added, 1, 'expected 1 recompute, got ' + added);
        delete window.__swapCount;
    });

    it('iteration cap deactivates a runaway live expression', async function() {
        let warned = false;
        let originalWarn = console.warn;
        console.warn = (...args) => {
            if (typeof args[0] === 'string' && args[0].includes('hx-live recompute exceeded')) warned = true;
            originalWarn.apply(console, args);
        };
        try {
            window.__runawayCount = 0;
            playground().innerHTML = '<output hx-live="window.__runawayCount++"></output>';
            htmx.process(playground());

            for (let i = 0; i < 100; i++) {
                document.body.setAttribute('data-runaway-test', String(i));
                await htmx.timeout(5);
            }

            warned.should.equal(true);
            document.body.removeAttribute('data-runaway-test');
            delete window.__runawayCount;
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

    it('q().take() moves a class from other elements to selected ones', function() {
        playground().innerHTML = `
            <button class="tab selected">a</button>
            <button class="tab">b</button>
            <button class="tab">c</button>
        `;
        let target = playground().querySelectorAll('.tab')[2];
        htmx.live.q(target).take('selected', '.tab');

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
        htmx.live.q('#t3').take('selected', '.tab');

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
                <button class="tab" hx-on:click="take('selected', '.tab')">c</button>
            </div>
        `;
        htmx.process(playground());

        let tabs = playground().querySelectorAll('.tab');
        tabs[2].click();
        tabs[0].classList.contains('selected').should.equal(false);
        tabs[1].classList.contains('selected').should.equal(false);
        tabs[2].classList.contains('selected').should.equal(true);
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

    it('toggle("@name") toggles attribute presence', function() {
        playground().innerHTML = '<input class="x"><input class="x" disabled>';
        htmx.live.q('.x').toggle('@disabled');
        let inputs = playground().querySelectorAll('.x');
        inputs[0].hasAttribute('disabled').should.equal(true);
        inputs[1].hasAttribute('disabled').should.equal(false);
    });

    it('toggle("@name=v") presence-toggles attribute with value', function() {
        playground().innerHTML = '<button id="a"></button><button id="b" aria-pressed="false"></button>';
        let p = htmx.live.q('button');
        p.toggle('@aria-pressed=true');
        playground().querySelector('#a').getAttribute('aria-pressed').should.equal('true');
        playground().querySelector('#b').hasAttribute('aria-pressed').should.equal(false);
    });

    it('toggle("@name=a|b") cycles attribute through values strictly', function() {
        playground().innerHTML = '<button></button>';
        let btn = playground().querySelector('button');
        let p = htmx.live.q('button');
        p.toggle('@aria-pressed=true|false');
        btn.getAttribute('aria-pressed').should.equal('true');
        p.toggle('@aria-pressed=true|false');
        btn.getAttribute('aria-pressed').should.equal('false');
        p.toggle('@aria-pressed=true|false');
        btn.getAttribute('aria-pressed').should.equal('true');
    });

    it('toggle("@name=v|") cycles attribute between value and absent', function() {
        playground().innerHTML = '<div></div>';
        let div = playground().querySelector('div');
        let p = htmx.live.q('div');
        p.toggle('@data-state=on|');
        div.getAttribute('data-state').should.equal('on');
        p.toggle('@data-state=on|');
        div.hasAttribute('data-state').should.equal(false);
        p.toggle('@data-state=on|');
        div.getAttribute('data-state').should.equal('on');
    });

    it('toggle cycle snaps to first value when current is out-of-list', function() {
        playground().innerHTML = '<div data-mode="weird"></div>';
        let div = playground().querySelector('div');
        htmx.live.q('div').toggle('@data-mode=light|dark|auto');
        div.getAttribute('data-mode').should.equal('light');
    });

    it('toggle("*prop=v") presence-toggles a style', function() {
        playground().innerHTML = '<div id="a"></div><div id="b" style="display: none"></div>';
        let p = htmx.live.q('div');
        p.toggle('*display=none');
        playground().querySelector('#a').style.display.should.equal('none');
        playground().querySelector('#b').style.display.should.equal('');
    });

    it('toggle("*prop=a|b") cycles a style through values', function() {
        playground().innerHTML = '<div></div>';
        let div = playground().querySelector('div');
        let p = htmx.live.q('div');
        p.toggle('*display=block|none|flex');
        div.style.display.should.equal('block');
        p.toggle('*display=block|none|flex');
        div.style.display.should.equal('none');
        p.toggle('*display=block|none|flex');
        div.style.display.should.equal('flex');
        p.toggle('*display=block|none|flex');
        div.style.display.should.equal('block');
    });

    it('toggle accepts multiple specs and is chainable', function() {
        playground().innerHTML = '<button></button>';
        let btn = playground().querySelector('button');
        let r = htmx.live.q('button').toggle('.active', '@aria-pressed=true', '*display=block').trigger('changed');
        r.count.should.equal(1);
        btn.classList.contains('active').should.equal(true);
        btn.getAttribute('aria-pressed').should.equal('true');
        btn.style.display.should.equal('block');
    });

    it('proxy.trigger/insert/take return the proxy for chaining', function() {
        playground().innerHTML = '<div class="src">a</div><div class="dst"></div><div class="dst"></div>';
        let dst = htmx.live.q('.dst');
        let r = dst.take('active', '.src').trigger('refresh').insert('end', '<span>x</span>');
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

    it('htmx.live namespace exposes q, wait, and debounce', function() {
        assert.isObject(htmx.live);
        assert.isFunction(htmx.live.q);
        assert.isFunction(htmx.live.wait);
        assert.isFunction(htmx.live.debounce);
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
        playground().innerHTML = '<button hx-on:click="window.foo = q(\'next #target\').textContent">x</button><div id="target">tgt</div>';
        htmx.process(playground());
        playground().querySelector('button').click();
        window.foo.should.equal('tgt');
        delete window.foo;
    });
});
