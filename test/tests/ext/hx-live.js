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
        let proxy = htmx.q('.x');
        proxy.count.should.equal(2);
    });

    it('q returns 0-count proxy when no match', function() {
        let proxy = htmx.q('.does-not-exist-anywhere');
        proxy.count.should.equal(0);
    });

    it('q(element) wraps a single element', function() {
        playground().innerHTML = '<div id="x"></div>';
        let elt = playground().querySelector('#x');
        let proxy = htmx.q(elt);
        proxy.count.should.equal(1);
    });

    it('q(iterable) wraps multiple elements', function() {
        playground().innerHTML = '<div class="x"></div><div class="x"></div>';
        let nodes = playground().querySelectorAll('.x');
        let proxy = htmx.q(nodes);
        proxy.count.should.equal(2);
    });

    it('arr() returns a real array', function() {
        playground().innerHTML = '<div class="x"></div><div class="x"></div>';
        let arr = htmx.q('.x').arr();
        assert.isArray(arr);
        arr.length.should.equal(2);
    });

    it('iterable via for..of', function() {
        playground().innerHTML = '<div class="x" data-i="0"></div><div class="x" data-i="1"></div>';
        let collected = [];
        for (let e of htmx.q('.x')) collected.push(e.dataset.i);
        collected.should.deep.equal(['0', '1']);
    });

    it('property read returns first element value', function() {
        playground().innerHTML = '<input class="x" value="first"><input class="x" value="second">';
        htmx.q('.x').value.should.equal('first');
    });

    it('property set propagates to all elements', function() {
        playground().innerHTML = '<input class="x" value="a"><input class="x" value="b">';
        htmx.q('.x').value = 'changed';
        let inputs = playground().querySelectorAll('.x');
        inputs[0].value.should.equal('changed');
        inputs[1].value.should.equal('changed');
    });

    it('chained property access returns proxy of subproperties', function() {
        playground().innerHTML = '<div class="x" data-foo="a"></div><div class="x" data-foo="b"></div>';
        let proxy = htmx.q('.x').dataset;
        proxy.foo.should.equal('a');
    });

    it('method invocation calls each element, returns first result', function() {
        playground().innerHTML = '<div class="x"><span>first</span></div><div class="x"><span>second</span></div>';
        let result = htmx.q('.x').querySelector('span');
        result.textContent.should.equal('first');
    });

    it('q().trigger() fires CustomEvent on each element', function() {
        playground().innerHTML = '<div class="x"></div><div class="x"></div>';
        let fires = 0;
        for (let e of playground().querySelectorAll('.x')) {
            e.addEventListener('zap', () => fires++);
        }
        htmx.q('.x').trigger('zap');
        fires.should.equal(2);
    });

    it('q().insert() inserts HTML at the given position', function() {
        playground().innerHTML = '<div class="x"><p>orig</p></div>';
        htmx.q('.x').insert('end', '<span class="added">new</span>');
        playground().querySelectorAll('.added').length.should.equal(1);
    });

    it('q().take() moves a class from other elements to selected ones', function() {
        playground().innerHTML = `
            <button class="tab selected">a</button>
            <button class="tab">b</button>
            <button class="tab">c</button>
        `;
        let target = playground().querySelectorAll('.tab')[2];
        htmx.q(target).take('selected', '.tab');

        let tabs = playground().querySelectorAll('.tab');
        tabs[0].classList.contains('selected').should.equal(false);
        tabs[1].classList.contains('selected').should.equal(false);
        tabs[2].classList.contains('selected').should.equal(true);
    });

    it('htmx.take() moves a class between elements (selectors)', function() {
        playground().innerHTML = `
            <button class="tab selected">a</button>
            <button class="tab">b</button>
            <button class="tab" id="t3">c</button>
        `;
        htmx.take('selected', '#t3', '.tab');

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
        let proxy = htmx.q(inner);
        proxy.count.should.equal(1);
    });

    it('directional: first picks the first match', function() {
        playground().innerHTML = '<i class="z">a</i><i class="z">b</i><i class="z">c</i>';
        let proxy = htmx.q('first .z');
        proxy.count.should.equal(1);
        proxy.textContent.should.equal('a');
    });

    it('directional: last picks the last match', function() {
        playground().innerHTML = '<i class="z">a</i><i class="z">b</i><i class="z">c</i>';
        let proxy = htmx.q('last .z');
        proxy.count.should.equal(1);
        proxy.textContent.should.equal('c');
    });

    it('"sel in #scope" scopes to a different root', function() {
        playground().innerHTML = '<div class="z">outside</div><section id="scope"><div class="z">inside</div></section>';
        let proxy = htmx.q('.z in #scope');
        proxy.count.should.equal(1);
        proxy.textContent.should.equal('inside');
    });

    it('"sel in #unknown" returns empty proxy when scope is missing', function() {
        let proxy = htmx.q('.z in #does-not-exist');
        proxy.count.should.equal(0);
    });

    it('q is exposed on the htmx public API', function() {
        assert.isFunction(htmx.q);
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
        let proxy = htmx.q('.invalid').q('closest .field');
        proxy.count.should.equal(2);
    });

    it('chained q: first per group', function() {
        playground().innerHTML = `
            <section><span class="i">a</span><span class="i">b</span></section>
            <section><span class="i">c</span><span class="i">d</span></section>
        `;
        let proxy = htmx.q('section').q('first .i');
        proxy.count.should.equal(2);
        proxy.arr().map(e => e.textContent).should.deep.equal(['a', 'c']);
    });

    it('chained q: plain selector scopes to descendants of each parent', function() {
        playground().innerHTML = `
            <article><p class="t">a</p></article>
            <article><p class="t">b</p></article>
            <p class="t">outside</p>
        `;
        let proxy = htmx.q('article').q('.t');
        proxy.count.should.equal(2);
    });

    it('chained q: dedups overlapping results', function() {
        playground().innerHTML = `
            <div class="parent"><div class="parent"><span class="x"></span></div></div>
        `;
        let proxy = htmx.q('.parent').q('.x');
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
