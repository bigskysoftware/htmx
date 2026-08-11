describe('hx-live extension', function () {

    let extBackup;
    let liveConfigBackup;

    async function flushMicrotasks() {
        await Promise.resolve();
        await Promise.resolve();
    }

    before(async () => {
        extBackup = backupExtensions();
        liveConfigBackup = htmx.config.live;
        htmx.config.live = { ...liveConfigBackup, inputDebounce: 0 };
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
        if (liveConfigBackup === undefined) delete htmx.config.live;
        else htmx.config.live = liveConfigBackup;
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

    it('continues after an invalid expression', function() {
        let error = console.error;
        console.error = () => {};
        try {
            playground().innerHTML = '<output :text="("></output><output id="valid" :text="\'ok\'"></output>';
            assert.doesNotThrow(() => htmx.process(playground()));
            playground().querySelector('#valid').textContent.should.equal('ok');
        } finally {
            console.error = error;
        }
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

    it('parses the configured input debounce', async function() {
        htmx.live.refresh();
        await flushMicrotasks();
        let setTimeout = window.setTimeout;
        let delay;
        htmx.config.live.inputDebounce = '20ms';
        window.setTimeout = (_fn, value) => {
            delay = value;
            return 0;
        };
        try {
            let input = createProcessedHTML('<input><output hx-live=""></output>');
            input.dispatchEvent(new Event('input', { bubbles: true }));
            delay.should.equal(20);
        } finally {
            htmx.config.live.inputDebounce = 0;
            window.setTimeout = setTimeout;
        }
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
            <output hx-live="await debounce(20); window.__debounceCountLive++; q('#in').value;"></output>
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

    it('warns once when live expressions take more than 16ms', async function() {
        htmx.live.refresh();
        await Promise.resolve();

        let originalNow = Object.getOwnPropertyDescriptor(performance, 'now');
        let originalWarn = console.warn;
        let now = 0;
        let elapsed = 0;
        let calls = 0;
        let warnings = [];
        Object.defineProperty(performance, 'now', {
            configurable: true,
            value: () => calls++ % 2 === 0 ? now : now += elapsed
        });
        console.warn = message => warnings.push(message);

        try {
            createProcessedHTML('<output hx-live=""></output>');

            elapsed = 16;
            htmx.live.refresh();
            await Promise.resolve();
            warnings.should.deep.equal([]);

            elapsed = 16.1;
            htmx.live.refresh();
            await Promise.resolve();
            warnings.should.deep.equal(['htmx: hx-live expressions took 16.1ms.']);

            elapsed = 50;
            htmx.live.refresh();
            await Promise.resolve();
            warnings.length.should.equal(1);
        } finally {
            if (originalNow) Object.defineProperty(performance, 'now', originalNow);
            else delete performance.now;
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

    it('htmx.live.$ aliases htmx.live.q', function() {
        htmx.live.$.should.equal(htmx.live.q);
        playground().innerHTML = '<div class="x"></div><div class="x"></div>';
        htmx.live.$('.x').count.should.equal(2);
    });

    it('leaves global $ available in expressions by default', function() {
        let oldLive = htmx.config.live;
        let oldDollar = window.$;
        htmx.config.live = { ...oldLive };
        delete htmx.config.live.useDollar;
        window.$ = value => 'global:' + value;
        try {
            playground().innerHTML = '<output :text="$(\'value\')"></output>';
            htmx.process(playground());
            playground().querySelector('output').textContent.should.equal('global:value');
        } finally {
            htmx.config.live = oldLive;
            if (oldDollar === undefined) delete window.$;
            else window.$ = oldDollar;
        }
    });

    it('useDollar shadows global $ in hx-live, bindings, and hx-on', function() {
        let oldLive = htmx.config.live;
        let oldDollar = window.$;
        let globalCalls = 0;
        let globalDollar = () => globalCalls++;
        htmx.config.live = { ...oldLive, useDollar: true };
        window.$ = globalDollar;
        try {
            playground().innerHTML = `
                <div class="x"></div>
                <output id="body" hx-live="this.dataset.count = $('.x').count"></output>
                <output id="binding" :text="$('.x').count"></output>
                <button hx-on:click="$('.x').attr['data-hit'] = 'yes'">change</button>
            `;
            htmx.process(playground());

            playground().querySelector('#body').dataset.count.should.equal('1');
            playground().querySelector('#binding').textContent.should.equal('1');
            playground().querySelector('button').click();
            playground().querySelector('.x').dataset.hit.should.equal('yes');
            globalCalls.should.equal(0);
            window.$.should.equal(globalDollar);
        } finally {
            htmx.config.live = oldLive;
            if (oldDollar === undefined) delete window.$;
            else window.$ = oldDollar;
        }
    });

    it('useDollar works in js attributes and hx-trigger filters', async function() {
        let oldLive = htmx.config.live;
        htmx.config.live = { ...oldLive, useDollar: true };
        try {
            mockResponse('POST', '/dollar-scope', 'OK');
            playground().innerHTML = `
                <div class="allowed"></div>
                <button hx-post="/dollar-scope"
                        hx-trigger="click[$('.allowed').count === 1]"
                        hx-vals="js:{ count: $('.allowed').count }">send</button>
            `;
            htmx.process(playground());
            playground().querySelector('button').click();
            await forRequest();

            fetchMock.calls[0].request.body.get('count').should.equal('1');
        } finally {
            htmx.config.live = oldLive;
        }
    });

    it('q returns 0-count proxy when no match', function() {
        let proxy = htmx.live.q('.does-not-exist-anywhere');
        proxy.count.should.equal(0);
        assert.isUndefined(proxy.aria);
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

    it('toggle(name, "a", "b", "c") cycles attribute through values (variadic form)', function() {
        playground().innerHTML = '<div></div>';
        let div = playground().querySelector('div');
        let p = htmx.live.q('div');
        p.toggle('data-mode', 'light', 'dark', 'auto');
        div.getAttribute('data-mode').should.equal('light');
        p.toggle('data-mode', 'light', 'dark', 'auto');
        div.getAttribute('data-mode').should.equal('dark');
        p.toggle('data-mode', 'light', 'dark', 'auto');
        div.getAttribute('data-mode').should.equal('auto');
        p.toggle('data-mode', 'light', 'dark', 'auto');
        div.getAttribute('data-mode').should.equal('light');
    });

    it('toggle(name, "v", "") cycles between value and absent (variadic form)', function() {
        playground().innerHTML = '<div></div>';
        let div = playground().querySelector('div');
        let p = htmx.live.q('div');
        p.toggle('data-state', 'on', '');
        div.getAttribute('data-state').should.equal('on');
        p.toggle('data-state', 'on', '');
        div.hasAttribute('data-state').should.equal(false);
    });

    it('htmx.live.toggle(target, name, "a", "b") cycles across matches', function() {
        playground().innerHTML = '<div class="t"></div><div class="t"></div>';
        htmx.live.toggle('.t', 'data-view', 'grid', 'list');
        [...playground().querySelectorAll('.t')].map(e => e.getAttribute('data-view'))
            .should.deep.equal(['grid', 'grid']);
        htmx.live.toggle('.t', 'data-view', 'grid', 'list');
        [...playground().querySelectorAll('.t')].map(e => e.getAttribute('data-view'))
            .should.deep.equal(['list', 'list']);
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

    it('class reads, writes, and deletes class state', function() {
        let button = createProcessedHTML(`
            <button class="pending remove-me" hx-on:click="
                window.__classState = [q(this).class.pending, q(this).class.done];
                q(this).class.assign({ pending: false, done: true });
                q(this).class['is-active'] = true;
                delete q(this).class['remove-me']
            ">Go</button>
        `);
        button.click();
        window.__classState.should.deep.equal([true, false]);
        button.classList.contains('pending').should.equal(false);
        button.classList.contains('done').should.equal(true);
        button.classList.contains('is-active').should.equal(true);
        button.classList.contains('remove-me').should.equal(false);
        delete window.__classState;
    });

    it("toggle('.name') toggles membership", function() {
        let button = createProcessedHTML(`
            <button hx-on:click="toggle('.active')">Go</button>
        `);
        button.click();
        button.classList.contains('active').should.equal(true);
        button.click();
        button.classList.contains('active').should.equal(false);
    });

    it("take('.name') moves membership between siblings", function() {
        playground().innerHTML = `
            <div>
                <button class="active">One</button>
                <button hx-on:click="take('.active')">Two</button>
            </div>
        `;
        htmx.process(playground());
        let buttons = playground().querySelectorAll('button');
        buttons[1].click();
        buttons[0].classList.contains('active').should.equal(false);
        buttons[1].classList.contains('active').should.equal(true);
    });

    it('q().class accesses only the first matched element', function() {
        playground().innerHTML = '<button id="one"></button><button id="two"></button>';
        let classes = htmx.live.q('#one').class;
        classes.active = true;
        classes.active.should.equal(true);
        playground().querySelector('#one').classList.contains('active').should.equal(true);
        playground().querySelector('#two').classList.contains('active').should.equal(false);
    });

    it('class supports keys and object spread', function() {
        playground().innerHTML = '<button id="one" class="active pending"></button>';
        let classes = htmx.live.q('#one').class;
        Object.keys(classes).should.deep.equal(['active', 'pending']);
        ({ ...classes }).should.deep.equal({ active: true, pending: true });
    });

    it('class methods delegate to classList: add, remove, toggle, replace, contains', function() {
        let button = createProcessedHTML(`
            <button class="base" hx-on:click="
                window.__r = [];
                window.__r.push(q(this).class.contains('base'));
                window.__r.push(q(this).class.contains('missing'));
                q(this).class.add('a', 'b');
                window.__r.push(q(this).class.contains('a'));
                q(this).class.remove('a', 'b');
                window.__r.push(q(this).class.contains('a'));
                q(this).class.toggle('t');
                window.__r.push(q(this).class.contains('t'));
                q(this).class.toggle('t', false);
                window.__r.push(q(this).class.contains('t'));
                q(this).class.toggle('t');
                q(this).class.replace('t', 'u');
                window.__r.push(q(this).class.contains('t'));
                window.__r.push(q(this).class.contains('u'));
            ">Go</button>
        `);
        button.click();
        window.__r.should.deep.equal([true, false, true, false, true, false, false, true]);
        delete window.__r;
    });

    it('class.assign adds truthy, removes falsy, leaves unmentioned', function() {
        let button = createProcessedHTML(`
            <button class="keep" hx-on:click="q(this).class.assign({ active: true, loading: false, keep: true })">Go</button>
        `);
        button.click();
        button.classList.contains('active').should.equal(true);
        button.classList.contains('loading').should.equal(false);
        button.classList.contains('keep').should.equal(true);
    });

    it('class.assign warns and no-ops on non-object arguments', function() {
        let warnings = [];
        let realWarn = console.warn;
        console.warn = (...args) => warnings.push(args[0]);
        try {
            let button = createProcessedHTML(`
                <button class="keep" hx-on:click="q(this).class.assign('active'); q(this).class.assign(null)">Go</button>
            `);
            button.click();
            button.classList.contains('active').should.equal(false);
            button.classList.contains('keep').should.equal(true);
        } finally {
            console.warn = realWarn;
        }
        warnings.length.should.equal(2);
        warnings[0].should.contain('class.assign expects an object');
    });

    it('removing the last class removes the class attribute', function() {
        let button = createProcessedHTML(`
            <button class="only" hx-on:click="q(this).class.assign({ only: false })">Go</button>
        `);
        button.click();
        button.classList.length.should.equal(0);
        button.hasAttribute('class').should.equal(false);
    });

    it('reserved method names: writes make classes, reads return methods, in sees classes', function() {
        let button = createProcessedHTML(`
            <button id="res" hx-on:click="
                q(this).class.toggle = true;
                window.__kind = typeof q(this).class.toggle;
                delete q(this).class.toggle
            ">Go</button>
        `);
        button.click();
        button.classList.contains('toggle').should.equal(false); // delete removed it
        window.__kind.should.equal('function');                  // read is the method
        delete window.__kind;

        let classes = htmx.live.q('#res').class;
        ('toggle' in classes).should.equal(false);   // has-trap reads classes only
        classes.toggle = true;                       // key write adds the class
        button.classList.contains('toggle').should.equal(true);
        ('toggle' in classes).should.equal(true);    // in sees it once it is a class
        (typeof classes.toggle).should.equal('function'); // read still returns the method
    });

    it('q().class writes hit all matches, reads use the first', function() {
        playground().innerHTML = '<div id="pl"><div class="x"></div><div class="x"></div></div>';
        let classes = htmx.live.q('.x in #pl').class;
        classes.add('a');
        let divs = playground().querySelectorAll('#pl .x');
        divs[0].classList.contains('a').should.equal(true);
        divs[1].classList.contains('a').should.equal(true);

        classes.assign({ a: false, b: true });
        divs[0].classList.contains('a').should.equal(false);
        divs[0].classList.contains('b').should.equal(true);
        divs[1].classList.contains('a').should.equal(false);
        divs[1].classList.contains('b').should.equal(true);

        classes.contains('a').should.equal(false);   // reads first match
        classes.contains('b').should.equal(true);
    });

    it('class proxy: symbols are undefined, spread skips method names', function() {
        playground().innerHTML = '<button id="sp" class="active pending"></button>';
        let classes = htmx.live.q('#sp').class;
        assert.isUndefined(classes[Symbol.iterator]);
        assert.isUndefined(classes[Symbol.toPrimitive]);
        Object.keys(classes).should.deep.equal(['active', 'pending']);
        ({ ...classes }).should.deep.equal({ active: true, pending: true });
    });

    it('hx-on:click class.add and class.assign work end-to-end', function() {
        let button = createProcessedHTML(`
            <button class="keep" hx-on:click="
                q(this).class.add('spin');
                q(this).class.assign({ active: true, loading: false })
            ">Go</button>
        `);
        button.click();
        button.classList.contains('keep').should.equal(true);
        button.classList.contains('spin').should.equal(true);
        button.classList.contains('active').should.equal(true);
        button.classList.contains('loading').should.equal(false);
    });

    it('class bindings react to class state', async function() {
        let elt = createProcessedHTML(`
            <div class="selected" :class="{ visible: q(this).class.selected }"></div>
        `);
        elt.classList.contains('visible').should.equal(true);
        elt.classList.remove('selected');
        await htmx.timeout(5);
        elt.classList.contains('visible').should.equal(false);
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

    it('attr() getter: ARIA returns raw strings or null', function() {
        playground().innerHTML = `
            <div id="a" aria-expanded="true"></div>
            <div id="b" aria-expanded="false"></div>
            <div id="c" aria-current="page"></div>
            <div id="d" aria-valuenow="50"></div>
            <div id="e" aria-controls="menu help"></div>
            <div id="f"></div>
        `;
        htmx.live.attr('#a', 'aria-expanded').should.equal('true');
        htmx.live.attr('#b', 'aria-expanded').should.equal('false');
        htmx.live.attr('#c', 'aria-current').should.equal('page');
        htmx.live.attr('#d', 'aria-valuenow').should.equal('50');
        htmx.live.attr('#e', 'aria-controls').should.equal('menu help');
        assert.isNull(htmx.live.attr('#f', 'aria-label'));
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

    it('attr() getter: checked returns live state', function() {
        playground().innerHTML = '<input id="a" type="checkbox">';
        let inp = playground().querySelector('#a');
        inp.checked = true;
        htmx.live.attr('#a', 'checked').should.equal(true);
    });

    it('attr() getter: value returns live state', function() {
        playground().innerHTML = '<input id="a" value="hello">';
        let inp = playground().querySelector('#a');
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

    it('attr() setter: ARIA stringifies values and null removes', function() {
        playground().innerHTML = '<div id="a"></div>';
        let div = playground().querySelector('#a');
        htmx.live.attr('#a', 'aria-expanded', true);
        div.getAttribute('aria-expanded').should.equal('true');
        htmx.live.attr('#a', 'aria-expanded', false);
        div.getAttribute('aria-expanded').should.equal('false');
        htmx.live.attr('#a', 'aria-expanded', null);
        div.hasAttribute('aria-expanded').should.equal(false);
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

    it('attr() treats class as a raw attribute', function() {
        playground().innerHTML = '<div id="a" class="external"></div>';
        let div = playground().querySelector('#a');
        htmx.live.attr('#a', 'class', 'foo bar');
        div.getAttribute('class').should.equal('foo bar');
    });

    it('attr() setter: checked changes attribute and live state together', function() {
        playground().innerHTML = '<input id="a" type="checkbox">';
        let inp = playground().querySelector('#a');
        inp.checked = false;
        htmx.live.attr('#a', 'checked', true);
        inp.hasAttribute('checked').should.equal(true);
        inp.checked.should.equal(true);
    });

    it('attr() setter: value changes the attribute and live state together', function() {
        playground().innerHTML = '<input id="a" type="text" value="initial">';
        let inp = playground().querySelector('#a');
        inp.value = 'live';
        htmx.live.attr('#a', 'value', 'set');
        inp.getAttribute('value').should.equal('set');
        inp.value.should.equal('set');
        htmx.live.attr('#a', 'value', null);
        inp.hasAttribute('value').should.equal(false);
        inp.value.should.equal('');
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

    it('q().attr applies setter to all matched elements', function() {
        playground().innerHTML = '<input class="x"><input class="x"><input class="x">';
        htmx.live.q('.x').attr.disabled = true;
        let inputs = playground().querySelectorAll('.x');
        for (let inp of inputs) inp.hasAttribute('disabled').should.equal(true);
    });

    it('q().attr getter returns from first matched element', function() {
        playground().innerHTML = '<div class="x" data-i="a"></div><div class="x" data-i="b"></div>';
        htmx.live.q('.x').attr['data-i'].should.equal('a');
    });

    it('q().attr removes an attribute with delete', function() {
        playground().innerHTML = '<button class="x" role="button"></button>';
        delete htmx.live.q('.x').attr.role;
        playground().querySelector('.x').hasAttribute('role').should.equal(false);
    });

    it('q().attr uses lowercase HTML attribute names', function() {
        playground().innerHTML = '<input id="input" readonly tabindex="2" maxlength="10">';
        let attr = htmx.live.q('#input').attr;

        attr.readonly.should.equal(true);
        attr.tabindex.should.equal(2);
        attr.maxlength.should.equal(10);

        attr.readonly = false;
        attr.tabindex = 3;
        attr.maxlength = 20;

        let input = playground().querySelector('#input');
        input.hasAttribute('readonly').should.equal(false);
        attr.tabindex.should.equal(3);
        attr.maxlength.should.equal(20);
    });

    it('q().attr accepts mixed-case HTML attribute names', function() {
        playground().innerHTML = '<input id="input" readonly tabindex="2" maxlength="10">';
        let attr = htmx.live.q('#input').attr;

        attr.readOnly.should.equal(true);
        attr.TABINDEX.should.equal(2);
        attr.MaxLength.should.equal(10);

        attr.READONLY = false;
        attr.TabIndex = 3;
        attr.MAXLENGTH = 20;

        let input = playground().querySelector('#input');
        input.hasAttribute('readonly').should.equal(false);
        input.getAttribute('tabindex').should.equal('3');
        input.getAttribute('maxlength').should.equal('20');
    });

    it('q() keeps native DOM property spelling separate from attr names', function() {
        playground().innerHTML = '<input id="input" readonly tabindex="2" maxlength="10">';
        let input = htmx.live.q('#input');

        input.readOnly.should.equal(true);
        input.tabIndex.should.equal(2);
        input.maxLength.should.equal(10);
        input.attr.readonly.should.equal(true);
        input.attr.tabindex.should.equal(2);
        input.attr.maxlength.should.equal(10);
    });

    it('q().closest.attr normalizes HTML names before resolving owners', function() {
        playground().innerHTML = '<fieldset readonly tabindex="2"><input id="input"></fieldset>';
        let attr = htmx.live.q('#input').closest.attr;

        attr.readonly.should.equal(true);
        attr.TABINDEX.should.equal(2);
        attr.READONLY = false;
        attr.tabIndex = 3;

        let fieldset = playground().querySelector('fieldset');
        fieldset.hasAttribute('readonly').should.equal(false);
        fieldset.getAttribute('tabindex').should.equal('3');
    });

    it('q().attr preserves distinct SVG attribute casing', function() {
        let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 10 10');
        playground().appendChild(svg);
        let attr = htmx.live.q(svg).attr;

        attr.viewBox.should.equal('0 0 10 10');
        assert.isNull(attr.viewbox);

        attr.viewbox = '0 0 20 20';

        svg.getAttribute('viewBox').should.equal('0 0 10 10');
        svg.getAttribute('viewbox').should.equal('0 0 20 20');
    });

    it('q().attr.data and q().data share the local data view', function() {
        playground().innerHTML = `
            <div class="x" data-count="1"></div>
            <div class="x" data-count="2"></div>
        `;
        let proxy = htmx.live.q('.x');
        assert.strictEqual(proxy.attr.data, proxy.data);
        proxy.attr.data.count.should.equal(1);
        proxy.data.count.should.equal(1);

        proxy.attr.data.count = 3;
        [...playground().querySelectorAll('.x')].map(e => e.dataset.count)
            .should.deep.equal(['3', '3']);

        proxy.data.count = 4;
        [...playground().querySelectorAll('.x')].map(e => e.dataset.count)
            .should.deep.equal(['4', '4']);
    });

    it('q().class and q().attr.class share the local class view', function() {
        playground().innerHTML = '<div class="x"></div><div class="x"></div>';
        let proxy = htmx.live.q('.x');
        assert.strictEqual(proxy.attr.class, proxy.class);
        proxy.attr.class.active = true;
        [...playground().querySelectorAll('.x')].every(e => e.classList.contains('active'))
            .should.equal(true);
        proxy.class.active = false;
        [...playground().querySelectorAll('.x')].some(e => e.classList.contains('active'))
            .should.equal(false);
    });

    it('q().aria and q().attr.aria share the local ARIA view', function() {
        playground().innerHTML = '<div class="x"></div><div class="x"></div>';
        let proxy = htmx.live.q('.x');
        assert.strictEqual(proxy.attr.aria, proxy.aria);
        proxy.attr.aria.busy = true;
        [...playground().querySelectorAll('.x')].map(e => e.getAttribute('aria-busy'))
            .should.deep.equal(['true', 'true']);
        proxy.aria.busy = false;
        [...playground().querySelectorAll('.x')].map(e => e.getAttribute('aria-busy'))
            .should.deep.equal(['false', 'false']);
    });

    it('q().data is local while bare data resolves the nearest owner', function() {
        playground().innerHTML = `
            <section data-state="owner">
                <button id="button"
                        hx-on:click="window.__dataScopes = [data.state, q(this).data.state]; data.state = 'changed'">
                    Go
                </button>
            </section>
        `;
        htmx.process(playground());
        let button = playground().querySelector('#button');
        button.click();
        window.__dataScopes.should.deep.equal(['owner', undefined]);
        button.hasAttribute('data-state').should.equal(false);
        playground().querySelector('section').dataset.state.should.equal('changed');
        delete window.__dataScopes;
    });

    it('q().closest resolves one data owner per selected element and deduplicates writes', function() {
        playground().innerHTML = `
            <section id="a" data-state="a">
                <button class="hx-live-owner-item"></button>
                <button class="hx-live-owner-item"></button>
            </section>
            <section id="b" data-state="b">
                <button class="hx-live-owner-item"></button>
            </section>
        `;
        let a = playground().querySelector('#a');
        let b = playground().querySelector('#b');
        let writes = new Map([[a, 0], [b, 0]]);
        let setAttribute = Element.prototype.setAttribute;
        Element.prototype.setAttribute = function(name, value) {
            if (name === 'data-state' && writes.has(this)) writes.set(this, writes.get(this) + 1);
            return setAttribute.call(this, name, value);
        };
        try {
            htmx.live.q(playground().querySelectorAll('.hx-live-owner-item')).closest.data.state = 'open';
        } finally {
            Element.prototype.setAttribute = setAttribute;
        }
        a.dataset.state.should.equal('open');
        b.dataset.state.should.equal('open');
        writes.get(a).should.equal(1);
        writes.get(b).should.equal(1);
    });

    it('q().closest resolves each selected element for attributes, ARIA, and classes', function() {
        playground().innerHTML = `
            <section class="active" disabled aria-busy="false">
                <button class="hx-live-owner-item"></button>
                <button class="hx-live-owner-item"></button>
            </section>
            <section class="active" disabled aria-busy="false">
                <button class="hx-live-owner-item"></button>
            </section>
        `;
        let proxy = htmx.live.q(playground().querySelectorAll('.hx-live-owner-item'));
        proxy.closest.attr.disabled = false;
        proxy.closest.aria.busy = true;
        proxy.closest.class.active = false;

        [...playground().querySelectorAll('section')].every(e => !e.hasAttribute('disabled'))
            .should.equal(true);
        [...playground().querySelectorAll('section')].map(e => e.getAttribute('aria-busy'))
            .should.deep.equal(['true', 'true']);
        [...playground().querySelectorAll('section')].every(e => !e.classList.contains('active'))
            .should.equal(true);
    });

    it('q().closest defers owner lookup until a state key is accessed', function() {
        playground().innerHTML = '<section data-state="owner"><button class="hx-live-owner-item"></button></section>';
        let proxy = htmx.live.q(playground().querySelectorAll('.hx-live-owner-item'));
        let calls = 0;
        let closest = Element.prototype.closest;
        Element.prototype.closest = function(...args) {
            calls++;
            return closest.apply(this, args);
        };
        try {
            let scope = proxy.closest;
            let data = scope.data;
            calls.should.equal(0);
            data.state.should.equal('owner');
            calls.should.equal(1);
        } finally {
            Element.prototype.closest = closest;
        }
    });

    it('q().closest reads the first selected owner for each state namespace', function() {
        playground().innerHTML = `
            <section data-state="first" aria-busy="false" role="tab" class="active">
                <button class="hx-live-owner-read-item"></button>
            </section>
            <section data-state="second" aria-busy="true" role="option">
                <button class="hx-live-owner-read-item"></button>
            </section>
        `;
        let proxy = htmx.live.q(playground().querySelectorAll('.hx-live-owner-read-item'));
        let scope = proxy.closest;
        assert.strictEqual(scope, proxy.closest);
        assert.strictEqual(scope.attr.data, scope.data);
        assert.strictEqual(scope.attr.aria, scope.aria);
        assert.strictEqual(scope.attr.class, scope.class);
        assert.strictEqual(scope.data.state, 'first');
        assert.strictEqual(scope.aria.busy, false);
        assert.strictEqual(scope.attr.role, 'tab');
        assert.strictEqual(scope.class.active, true);
    });

    it('q().closest reads undefined when no data owner exists', function() {
        playground().innerHTML = '<button class="hx-live-owner-item"></button>';
        playground().removeAttribute('data-state');
        assert.isUndefined(htmx.live.q(playground().querySelectorAll('.hx-live-owner-item')).closest.data.state);
    });

    it('q().closest writes data locally for every match when no owner exists', function() {
        playground().innerHTML = '<button class="hx-live-owner-item"></button><button class="hx-live-owner-item"></button>';
        playground().removeAttribute('data-state');
        htmx.live.q(playground().querySelectorAll('.hx-live-owner-item')).closest.data.state = 'created';
        [...playground().querySelectorAll('.hx-live-owner-item')].map(e => e.dataset.state)
            .should.deep.equal(['created', 'created']);
    });

    it('q().closest writes attr and class locally for every match when no owner exists', function() {
        playground().innerHTML = '<button class="hx-live-owner-item"></button><button class="hx-live-owner-item"></button>';
        let proxy = htmx.live.q(playground().querySelectorAll('.hx-live-owner-item'));
        proxy.closest.attr.role = 'button';
        proxy.closest.class.active = true;

        [...playground().querySelectorAll('.hx-live-owner-item')].every(e => e.getAttribute('role') === 'button')
            .should.equal(true);
        [...playground().querySelectorAll('.hx-live-owner-item')].every(e => e.classList.contains('active'))
            .should.equal(true);
    });

    it('q().closest deletes nothing when no owner exists', function() {
        playground().innerHTML = '<button class="hx-live-owner-item"></button><button class="hx-live-owner-item"></button>';
        playground().removeAttribute('data-state');
        let proxy = htmx.live.q(playground().querySelectorAll('.hx-live-owner-item'));
        delete proxy.closest.data.state;
        delete proxy.closest.aria.busy;
        delete proxy.closest.attr.role;
        delete proxy.closest.class.active;

        [...playground().querySelectorAll('.hx-live-owner-item')].every(e =>
            !e.hasAttribute('data-state') &&
            !e.hasAttribute('aria-busy') &&
            !e.hasAttribute('role') &&
            !e.classList.contains('active'))
            .should.equal(true);
    });

    it('attr is available in hx-on scope bound to element', function() {
        playground().innerHTML = '<button hx-on:click="attr[\'data-clicked\'] = \'yes\'">x</button>';
        htmx.process(playground());
        let btn = playground().querySelector('button');
        btn.click();
        btn.getAttribute('data-clicked').should.equal('yes');
    });

    it('attr in hx-live expression operates on current element', async function() {
        let elt = createProcessedHTML(
            `<output hx-live="!this.dataset.s && (this.dataset.s='1', attr['data-flipped'] = true)"></output>`
        );
        await htmx.timeout(5);
        elt.hasAttribute('data-flipped').should.equal(true);
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
    // cascading ARIA proxy
    // -------------------------------------------------------------------------

    it('aria.foo reacts to the closest ARIA state', async function() {
        playground().innerHTML = `
            <section aria-busy="true">
                <form aria-busy="false">
                    <button :disabled="closest.aria.busy" hx-on:click="closest.aria.busy = !closest.aria.busy">Save</button>
                </form>
            </section>
        `;
        htmx.process(playground());
        let button = playground().querySelector('button');
        button.disabled.should.equal(false);
        button.click();
        await htmx.timeout(5);
        button.disabled.should.equal(true);
        playground().querySelector('form').getAttribute('aria-busy').should.equal('true');
        playground().querySelector('section').getAttribute('aria-busy').should.equal('true');
    });

    it("toggle('aria-name', values) cycles explicit values", function() {
        playground().innerHTML = `
            <div aria-sort="ascending">
                <button hx-on:click="q('closest [aria-sort]').toggle('aria-sort', 'ascending|descending|other')">Sort</button>
            </div>
        `;
        htmx.process(playground());
        let owner = playground().querySelector('div');
        let button = playground().querySelector('button');
        button.click();
        owner.getAttribute('aria-sort').should.equal('descending');
        button.click();
        owner.getAttribute('aria-sort').should.equal('other');
    });

    it("take('aria-name') claims sibling state", function() {
        playground().innerHTML = `
            <div role="tablist">
                <button role="tab" aria-selected="true">One</button>
                <button role="tab" aria-selected="false"
                        hx-on:click="take('aria-selected')">Two</button>
            </div>
        `;
        htmx.process(playground());
        let tabs = playground().querySelectorAll('[role=tab]');
        tabs[1].click();
        tabs[0].getAttribute('aria-selected').should.equal('false');
        tabs[1].getAttribute('aria-selected').should.equal('true');
    });

    it('q().aria uses only its first match', function() {
        playground().innerHTML = `
            <section aria-busy="false">
                <form id="form" aria-checked="false"></form>
            </section>
        `;
        let aria = htmx.live.q('#form').aria;
        aria.checked.should.equal(false);
        assert.isUndefined(aria.busy);
        assert.isUndefined(aria.controls);
        assert.isTrue(delete aria.label);

        let ownerAria = htmx.live.q('#form').q('closest [aria-busy]').aria;
        ownerAria.busy.should.equal(false);
        ownerAria.busy = true;
        aria.checked = true;
        aria.busy = false;

        playground().querySelector('form').getAttribute('aria-checked').should.equal('true');
        playground().querySelector('form').getAttribute('aria-busy').should.equal('false');
        playground().querySelector('section').getAttribute('aria-busy').should.equal('true');

        aria.checked = null;
        delete ownerAria.busy;
        playground().querySelector('form').hasAttribute('aria-checked').should.equal(false);
        playground().querySelector('section').hasAttribute('aria-busy').should.equal(false);
    });

    it('returns every boolean-like ARIA attribute as a boolean', function() {
        playground().innerHTML = '<div id="booleans"></div>';
        let values = {
            atomic: true,
            busy: false,
            checked: true,
            current: false,
            disabled: true,
            expanded: false,
            grabbed: true,
            hasPopup: false,
            hidden: true,
            invalid: false,
            modal: true,
            multiline: false,
            multiselectable: true,
            pressed: false,
            readonly: true,
            required: false,
            selected: true
        };
        let state = playground().querySelector('#booleans');
        for (let [name, value] of Object.entries(values)) {
            state.setAttribute('aria-' + name.toLowerCase(), String(value));
        }
        let aria = htmx.live.q(state).aria;
        for (let [name, value] of Object.entries(values)) {
            aria[name].should.equal(value);
        }
    });

    it('returns every numeric ARIA attribute as a number', function() {
        playground().innerHTML = '<div id="state"></div>';
        let values = {
            colCount: 3,
            colIndex: 2,
            colSpan: 1,
            level: 4,
            posInSet: 5,
            rowCount: 6,
            rowIndex: 7,
            rowSpan: 2,
            setSize: 8,
            valueMax: 100,
            valueMin: 0,
            valueNow: 51.5
        };
        let state = playground().querySelector('#state');
        for (let [name, value] of Object.entries(values)) {
            let attributeValue = name === 'valueNow' ? ' 51.5 ' : String(value);
            state.setAttribute('aria-' + name.toLowerCase(), attributeValue);
        }
        let aria = htmx.live.q(state).aria;
        for (let [name, value] of Object.entries(values)) {
            aria[name].should.equal(value);
        }
    });

    it('preserves missing and invalid numeric ARIA values', function() {
        playground().innerHTML = `
            <div id="invalid-numbers" aria-colspan="1.5" aria-level="many"
                 aria-valuemax="" aria-valuemin="Infinity" aria-valuenow="unknown">
            </div>
        `;
        let aria = htmx.live.q('#invalid-numbers').aria;
        aria.colSpan.should.equal('1.5');
        aria.level.should.equal('many');
        aria.valueMax.should.equal('');
        aria.valueMin.should.equal('Infinity');
        aria.valueNow.should.equal('unknown');
        assert.isUndefined(aria.rowCount);
    });

    it('does not coerce string ARIA attributes that look typed', function() {
        playground().innerHTML = `
            <div id="strings"
                 aria-description="true" aria-label="false" aria-valuetext="51"
                 aria-activedescendant="item" aria-details="details" aria-errormessage="error">
            </div>
        `;
        let aria = htmx.live.q('#strings').aria;
        aria.description.should.equal('true');
        aria.label.should.equal('false');
        aria.valueText.should.equal('51');
        aria.activeDescendant.should.equal('item');
        aria.details.should.equal('details');
        aria.errorMessage.should.equal('error');
    });

    it('preserves non-boolean ARIA tokens', function() {
        playground().innerHTML = '<div id="tokens" aria-checked="mixed" aria-current="page" aria-invalid="spelling"></div>';
        let aria = htmx.live.q('#tokens').aria;
        aria.checked.should.equal('mixed');
        aria.current.should.equal('page');
        aria.invalid.should.equal('spelling');
    });

    it('returns ARIA list attributes as arrays and joins array writes', function() {
        playground().innerHTML = '<div id="lists"></div>';
        let values = {
            controls: ['menu', 'help'],
            describedBy: ['hint', 'error'],
            dropEffect: ['copy', 'move'],
            flowTo: ['next', 'later'],
            labelledBy: ['title', 'subtitle'],
            owns: ['item-1', 'item-2'],
            relevant: ['additions', 'text']
        };
        let state = playground().querySelector('#lists');
        for (let [name, value] of Object.entries(values)) {
            state.setAttribute('aria-' + name.toLowerCase(), value.join(' '));
        }
        state.setAttribute('aria-controls', '  menu   help  ');
        let aria = htmx.live.q(state).aria;
        for (let [name, value] of Object.entries(values)) {
            aria[name].should.deep.equal(value);
        }

        aria.controls = ['dialog', 'help'];
        aria.relevant = [];
        aria.owns = 'item-3 item-4';
        state.getAttribute('aria-controls').should.equal('dialog help');
        state.getAttribute('aria-relevant').should.equal('');
        state.getAttribute('aria-owns').should.equal('item-3 item-4');
        aria.relevant.should.deep.equal([]);
        aria.owns.should.deep.equal(['item-3', 'item-4']);
    });

    it('writes missing ARIA attributes on this and deletes the closest match', function() {
        playground().innerHTML = `
            <div aria-valuenow="50" aria-current="page">
                <button hx-on:click="
                    closest.aria.valueNow = 51;
                    closest.aria.label = 'Save';
                    delete closest.aria.current
                ">change</button>
            </div>
        `;
        htmx.process(playground());
        let button = playground().querySelector('button');
        button.click();
        playground().querySelector('div').getAttribute('aria-valuenow').should.equal('51');
        playground().querySelector('div').hasAttribute('aria-current').should.equal(false);
        button.getAttribute('aria-label').should.equal('Save');
    });

    it('q(this).aria only accesses the current element', function() {
        playground().innerHTML = `
            <section aria-busy="true">
                <button type="button" hx-on:click="
                    window.__localState = [q(this).aria.busy, closest.aria.busy];
                    q(this).aria.busy = false;
                    window.__localAfter = q(this).aria.busy
                ">change</button>
            </section>
        `;
        htmx.process(playground());
        let button = playground().querySelector('button');
        button.click();
        window.__localState.should.deep.equal([undefined, true]);
        window.__localAfter.should.equal(false);
        button.getAttribute('aria-busy').should.equal('false');
        playground().querySelector('section').getAttribute('aria-busy').should.equal('true');
        delete window.__localState;
        delete window.__localAfter;
    });

    it('q(this).aria preserves application element properties after await', async function() {
        playground().innerHTML = `
            <section id="owner">
                <button type="button" hx-on:click="
                    window.__sameThis = this === event.currentTarget;
                    window.__closestId = this.closest('section').id;
                    await timeout(5);
                    q(this).aria.busy = true
                ">change</button>
            </section>
        `;
        htmx.process(playground());
        let button = playground().querySelector('button');
        let applicationState = { owner: 'app' };
        button.aria = applicationState;
        button.click();
        await htmx.timeout(10);
        window.__sameThis.should.equal(true);
        window.__closestId.should.equal('owner');
        button.aria.should.equal(applicationState);
        button.getAttribute('aria-busy').should.equal('true');
        delete window.__sameThis;
        delete window.__closestId;
    });

    // -------------------------------------------------------------------------
    // cascading data proxy
    // -------------------------------------------------------------------------

    it("toggle('data-name', values) cycles explicit values", function() {
        playground().innerHTML = `
            <div data-view="grid">
                <button hx-on:click="q('closest [data-view]').toggle('data-view', 'grid|list')">View</button>
            </div>
        `;
        htmx.process(playground());
        let owner = playground().querySelector('div');
        let button = playground().querySelector('button');
        button.click();
        owner.dataset.view.should.equal('list');
        button.click();
        owner.dataset.view.should.equal('grid');
    });

    it("toggle('data-name', \"a\", \"b\") cycles values passed as separate arguments", function() {
        playground().innerHTML = `
            <div data-view="grid">
                <button hx-on:click="q('closest [data-view]').toggle('data-view', 'grid', 'list')">View</button>
            </div>
        `;
        htmx.process(playground());
        let owner = playground().querySelector('div');
        let button = playground().querySelector('button');
        button.click();
        owner.dataset.view.should.equal('list');
        button.click();
        owner.dataset.view.should.equal('grid');
    });

    it("toggle('data-name') toggles attribute presence", function() {
        let button = createProcessedHTML(`
            <button data-active="" hx-on:click="toggle('data-active')"></button>
        `);
        button.click();
        button.hasAttribute('data-active').should.equal(false);
        button.click();
        button.dataset.active.should.equal('');
    });

    it('q(this).data.active = !q(this).data.active flips a typed boolean', function() {
        let button = createProcessedHTML(`
            <button data-active="false" hx-on:click="q(this).data.active = !q(this).data.active"></button>
        `);
        button.click();
        button.dataset.active.should.equal('true');
        button.click();
        button.dataset.active.should.equal('false');
    });

    it('data.active = undefined removes the attribute', function() {
        let button = createProcessedHTML(`
            <button data-active="true" hx-on:click="closest.data.active = undefined"></button>
        `);
        button.click();
        button.hasAttribute('data-active').should.equal(false);
    });

    it("take('data-name') moves sibling state", function() {
        playground().innerHTML = `
            <div>
                <button data-active="true">One</button>
                <button data-active="false" hx-on:click="take('data-active')">Two</button>
            </div>
        `;
        htmx.process(playground());
        let buttons = playground().querySelectorAll('button');
        buttons[1].click();
        buttons[0].hasAttribute('data-active').should.equal(false);
        buttons[1].hasAttribute('data-active').should.equal(true);
    });

    it('reads valid JSON values and preserves other data attribute text', function() {
        playground().innerHTML = '<div id="state"></div>';
        let state = playground().querySelector('#state');
        let data = htmx.live.q(state).data;
        let values = [
            { label: 'empty string', attribute: '', value: '' },
            { label: 'true', attribute: 'true', value: true },
            { label: 'false', attribute: 'false', value: false },
            { label: 'null', attribute: 'null', value: null },
            { label: 'integer', attribute: '42', value: 42 },
            { label: 'float', attribute: '3.14', value: 3.14 },
            { label: 'negative', attribute: '-0.5', value: -0.5 },
            { label: 'exponent', attribute: '1e3', value: 1000 },
            { label: 'whitespace', attribute: ' 42 ', value: 42 },
            { label: 'object', attribute: '{"count":1}', value: { count: 1 } },
            { label: 'array', attribute: '["one"]', value: ['one'] },
            { label: 'JSON string', attribute: '"hello"', value: 'hello' },
            { label: 'plain string', attribute: 'hello', value: 'hello' },
            { label: 'leading zero', attribute: '01', value: '01' },
            { label: 'leading decimal point', attribute: '.5', value: '.5' },
            { label: 'NaN text', attribute: 'NaN', value: 'NaN' },
            { label: 'Infinity text', attribute: 'Infinity', value: 'Infinity' }
        ];

        assert.isUndefined(data.value);
        for (let { label, attribute, value } of values) {
            state.setAttribute('data-value', attribute);
            state.dataset.value.should.equal(attribute, label + ' raw value');
            assert.deepEqual(data.value, value, label + ' normalized value');
        }
    });

    it('serializes assigned values before reading them back', function() {
        playground().innerHTML = '<div id="state"></div>';
        let state = playground().querySelector('#state');
        let data = htmx.live.q(state).data;
        let values = [
            { label: 'empty string', input: '', attribute: '', value: '' },
            { label: 'plain string', input: 'hello', attribute: 'hello', value: 'hello' },
            { label: 'true string', input: 'true', attribute: 'true', value: true },
            { label: 'true', input: true, attribute: 'true', value: true },
            { label: 'false string', input: 'false', attribute: 'false', value: false },
            { label: 'false', input: false, attribute: 'false', value: false },
            { label: 'number string', input: '42', attribute: '42', value: 42 },
            { label: 'number', input: 42, attribute: '42', value: 42 },
            { label: 'float', input: 3.14, attribute: '3.14', value: 3.14 },
            { label: 'negative', input: -0.5, attribute: '-0.5', value: -0.5 },
            { label: 'null string', input: 'null', attribute: 'null', value: null },
            { label: 'null', input: null, attribute: 'null', value: null },
            { label: 'object string', input: '{"count":1}', attribute: '{"count":1}', value: { count: 1 } },
            { label: 'object', input: { count: 1 }, attribute: '{"count":1}', value: { count: 1 } },
            { label: 'array string', input: '["one"]', attribute: '["one"]', value: ['one'] },
            { label: 'array', input: ['one'], attribute: '["one"]', value: ['one'] },
            { label: 'JSON string', input: '"hello"', attribute: '"hello"', value: 'hello' }
        ];

        for (let { label, input, attribute, value } of values) {
            data.value = input;
            state.dataset.value.should.equal(attribute, label + ' stored value');
            assert.deepEqual(data.value, value, label + ' normalized value');
        }
    });

    it('q().data only accesses the selected element', function() {
        playground().innerHTML = `
            <section data-count="1">
                <form id="form" data-ready="false"></form>
            </section>
        `;
        let data = htmx.live.q('#form').data;
        data.ready.should.equal(false);
        assert.isUndefined(data.count);
        ({ ...data }).should.deep.equal({ ready: false });

        let ownerData = htmx.live.q('#form').q('closest [data-count]').data;
        ownerData.count.should.equal(1);
        ownerData.count = 2;
        data.ready = true;
        data.count = 3;

        playground().querySelector('form').dataset.ready.should.equal('true');
        playground().querySelector('form').dataset.count.should.equal('3');
        playground().querySelector('section').dataset.count.should.equal('2');

        delete data.ready;
        delete ownerData.count;
        playground().querySelector('form').hasAttribute('data-ready').should.equal(false);
        playground().querySelector('section').hasAttribute('data-count').should.equal(false);
    });

    it('q(this).data only accesses the current element after await', async function() {
        playground().innerHTML = `
            <section data-count="1">
                <button hx-on:click="
                    window.__dataState = [q(this).data.count, closest.data.count];
                    await timeout(5);
                    q(this).data.count = 2
                ">change</button>
            </section>
        `;
        htmx.process(playground());
        let button = playground().querySelector('button');
        button.click();
        await htmx.timeout(10);
        window.__dataState.should.deep.equal([undefined, 1]);
        button.dataset.count.should.equal('2');
        playground().querySelector('section').dataset.count.should.equal('1');
        delete window.__dataState;
    });

    it('q(this).data preserves native element data properties', function() {
        playground().innerHTML = `
            <object data="/chart.svg" hx-on:click="q(this).data.ready = true"></object>
        `;
        htmx.process(playground());
        let object = playground().querySelector('object');
        object.click();
        object.getAttribute('data').should.equal('/chart.svg');
        object.dataset.ready.should.equal('true');
    });

    it('delete data.foo removes the closest matching attribute', function() {
        playground().innerHTML = `
            <section data-state="active">
                <button hx-on:click="delete closest.data.state">clear</button>
            </section>
        `;
        htmx.process(playground());
        playground().querySelector('button').click();
        playground().querySelector('section').hasAttribute('data-state').should.equal(false);
    });

    it('data.foo reads this.dataset.foo when present locally', async function() {
        playground().innerHTML = `
            <div id="me" data-foo="local"
                 hx-on:click="this.dataset.v = closest.data.foo">x</div>
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
                    <span id="me" hx-on:click="this.dataset.v = closest.data.currency">x</span>
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
            <div id="me" hx-on:click="this.dataset.v = (closest.data.nonexistent === undefined ? 'undef' : 'set')">x</div>
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
                    <span id="me" hx-on:click="this.dataset.v = closest.data.mode">x</span>
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
                    <button id="me" hx-on:click="closest.data.counter = +closest.data.counter + 1">+</button>
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

    it('functional data assignment updates a selected owner', function() {
        playground().innerHTML = `
            <section data-cart='[{"id":"1"}]'>
                <div>
                    <button value="2" hx-on:click="
                        q('closest [data-cart]').data.cart = cart =>
                            [...cart, { id: this.value }]
                    ">Add</button>
                </div>
            </section>
        `;
        htmx.process(playground());
        playground().querySelector('button').click();
        JSON.parse(playground().querySelector('section').dataset.cart).should.deep.equal([
            { id: '1' },
            { id: '2' }
        ]);
    });

    it('functional data assignment can initialize a missing value', function() {
        playground().innerHTML = '<button id="item"></button>';
        let button = playground().querySelector('button');
        htmx.live.q(button).data.items = items => [...(items || []), 'one'];
        button.dataset.items.should.equal('["one"]');
    });

    it('functional data assignment runs once and leaves the value when it throws', function() {
        playground().innerHTML = '<div id="state" data-count="1"></div>';
        let data = htmx.live.q('#state').data;
        let calls = 0;
        data.count = count => { calls++; return count + 1; };
        calls.should.equal(1);
        data.count.should.equal(2);

        let fail = () => { throw new Error('no update'); };
        assert.throws(() => { data.count = fail; }, 'no update');
        data.count.should.equal(2);

        assert.throws(() => { data.count = async count => count + 1; }, 'assigned function must return a value, not a promise');
        data.count.should.equal(2);
    });

    it('functional property assignment via q() updates a DOM property', function() {
        playground().innerHTML = '<div id="panel" hidden></div>';
        let q = htmx.live.q('#panel');
        q.hidden = hidden => !hidden;
        playground().querySelector('#panel').hidden.should.equal(false);
    });

    it('functional property assignment passes the current typed value', function() {
        playground().innerHTML = '<input id="name" value="hello">';
        let q = htmx.live.q('#name');
        let seen;
        q.value = v => { seen = v; return v + ' world'; };
        seen.should.equal('hello');
        playground().querySelector('#name').value.should.equal('hello world');
    });

    it('q() property setter stores an on* handler as a literal function', function() {
        playground().innerHTML = '<button id="btn"></button>';
        let handler = () => 42;
        htmx.live.q('#btn').onclick = handler;
        playground().querySelector('#btn').onclick.should.equal(handler);
    });

    it('functional attr assignment via applyAttr updates an attribute', function() {
        playground().innerHTML = '<div id="box" hidden></div>';
        htmx.live.attr('#box', 'hidden', hidden => !hidden);
        playground().querySelector('#box').hasAttribute('hidden').should.equal(false);
    });

    it('functional attr assignment reads the current typed value', function() {
        playground().innerHTML = '<div id="box" hidden></div>';
        let seen;
        htmx.live.attr('#box', 'hidden', h => { seen = h; return h; });
        seen.should.equal(true);
    });

    it('functional class assignment toggles correctly', function() {
        playground().innerHTML = '<div id="box" class="on"></div>';
        htmx.live.q('#box').class.on = on => !on;
        playground().querySelector('#box').classList.contains('on').should.equal(false);
    });

    it('data.foo = "x" writes to this when no ancestor has data-foo', async function() {
        playground().innerHTML = `
            <button id="me" hx-on:click="closest.data.fresh = 'created'">x</button>
        `;
        htmx.process(playground());
        let btn = playground().querySelector('#me');
        btn.click();
        btn.dataset.fresh.should.equal('created');
    });

    it('data.foo++ works (auto-coerces to number)', async function() {
        playground().innerHTML = `
            <section data-counter="5">
                <button id="me" hx-on:click="closest.data.counter++">+</button>
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
                <button id="me" hx-on:click="closest.data.active = !closest.data.active">toggle</button>
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
                <button id="me" hx-on:click="closest.data.count = closest.data.count + 1">+</button>
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
                <button id="me" hx-on:click="closest.data.user = {...closest.data.user, age: closest.data.user.age + 1}">bday</button>
                <span id="out" hx-on:click="this.dataset.v = closest.data.user.name + ':' + closest.data.user.age">read</span>
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
                <button id="add" hx-on:click="closest.data.items = [...closest.data.items, closest.data.items.length]">add</button>
                <span id="out" hx-on:click="this.dataset.v = closest.data.items.length">count</span>
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
                <span id="me" hx-on:click="this.dataset.v = typeof closest.data.label + ':' + closest.data.label">x</span>
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
                <span id="me" hx-on:click="this.dataset.v = (closest.data.val === null ? 'is-null' : 'not-null')">x</span>
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
                <button id="me" hx-on:click="with (closest.data) { counter++ }">+</button>
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
                    with (closest.data) {
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
                <span id="me" hx-on:click="this.dataset.v = closest.data.myValue">x</span>
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
                    <button id="me" hx-on:click="window.__spreadDataLive = { ...closest.data }">x</button>
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

    it('spreads cascading data values into hx-vals', async function() {
        mockResponse('POST', '/cursor', 'OK');
        playground().innerHTML = `
            <section data-x="1" data-y="2">
                <button data-y="3"
                        hx-post="/cursor"
                        hx-vals="js:{ ...closest.data }">
                    Send cursor
                </button>
            </section>
        `;
        htmx.process(playground());

        playground().querySelector('button').click();
        await forRequest();

        fetchMock.calls[0].request.body.get('x').should.equal('1');
        fetchMock.calls[0].request.body.get('y').should.equal('3');
    });

    it('data proxy supports Object.keys/Object.values/Object.entries', async function() {
        playground().innerHTML = `
            <section data-x="1" data-y="2">
                <article data-y="3" data-z="4">
                    <button id="me" hx-on:click="
                        window.__keysDataLive = Object.keys(closest.data);
                        window.__valuesDataLive = Object.values(closest.data);
                        window.__entriesDataLive = Object.entries(closest.data);
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
                    let { x, ...rest } = closest.data;
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
                <div :class="{ darkmode: closest.data.mode === 'dark' }"></div>
            </section>
        `;
        htmx.process(playground());
        let div = playground().querySelector('div');
        div.classList.contains('darkmode').should.equal(false);

        playground().querySelector('section').dataset.mode = 'dark';
        await new Promise(r => setTimeout(r, 20));
        div.classList.contains('darkmode').should.equal(true);
    });

    it('updates and clears flash state from a targeted server event', async function() {
        let originalSetTimeout = window.setTimeout;
        window.setTimeout = (fn, delay, ...args) => originalSetTimeout(fn, delay === 3000 ? 20 : delay, ...args);

        try {
            playground().innerHTML = `
                <button id="source"></button>
                <div id="flash"
                     data-message=""
                     data-level=""
                     hx-on="flash -> closest.data.message = message; closest.data.level = level;
                                     await timeout(3000);
                                     closest.data.message = ''"
                     :text="closest.data.message"
                     :.success="closest.data.level === 'success'"
                     :.error="closest.data.level === 'error'"></div>
            `;
            htmx.process(playground());
            let source = playground().querySelector('#source');
            let flash = playground().querySelector('#flash');

            htmx.__handleTriggerHeader('{"flash":{"target":"#flash", "level":"success", "message":"Saved"}}', source);
            flash.dataset.message.should.equal('Saved');
            flash.dataset.level.should.equal('success');

            await htmx.timeout(5);
            flash.textContent.should.equal('Saved');
            flash.classList.contains('success').should.equal(true);
            flash.classList.contains('error').should.equal(false);

            await htmx.timeout(30);
            flash.dataset.message.should.equal('');
            flash.textContent.should.equal('');
        } finally {
            window.setTimeout = originalSetTimeout;
        }
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

    it(':aria-expanded writes boolean strings', async function() {
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

    it(':style replaces an old shorthand with a new longhand', async function() {
        playground().innerHTML = `
            <div data-all="true" :style="closest.data.all
                ? 'border: 1px solid red'
                : 'border-left-color: green'"></div>
        `;
        htmx.process(playground());
        let div = playground().querySelector('div');
        div.dataset.all = 'false';
        await htmx.timeout(5);
        div.style.borderTop.should.equal('');
        div.style.borderLeftColor.should.equal('green');
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

    it('keeps checked and selected false after form reset when the result is zero', function() {
        playground().innerHTML = `
            <form>
                <input type="checkbox" :checked="0">
                <select multiple><option :selected="0">One</option></select>
            </form>
        `;
        htmx.process(playground());
        playground().querySelector('form').reset();
        playground().querySelector('input').checked.should.equal(false);
        playground().querySelector('option').selected.should.equal(false);
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

    // -------------------------------------------------------------------------
    // q() property setter. Never assert against a function value directly: the
    // test runner cannot serialize a function in a failure message and the
    // session hangs. Compare identity as a boolean instead.
    // -------------------------------------------------------------------------

    describe('q() property setter', function() {

        it('q() setter stores a function on a property that already holds one', function() {
            playground().innerHTML = '<div id="grid"></div>';
            let grid = playground().querySelector('#grid');
            grid.rowRenderer = () => 'old';
            let next = () => 'new';
            htmx.live.q('#grid').rowRenderer = next;
            (grid.rowRenderer === next).should.equal(true, 'stored the function, not its return value');
        });

        it('q() setter stores a function on an unset custom property', function() {
            playground().innerHTML = '<div id="grid"></div>';
            let grid = playground().querySelector('#grid');
            let fn = () => 'cell';
            htmx.live.q('#grid').renderCell = fn;
            (grid.renderCell === fn).should.equal(true, 'stored the function, not its return value');
        });

        it('writing .value leaves defaultValue intact for dirty tracking', function() {
            playground().innerHTML = '<input id="i" value="original">';
            let input = playground().querySelector('#i');
            htmx.live.q('#i').value = 'edited';
            input.value.should.equal('edited');
            input.defaultValue.should.equal('original');
        });

        it('morph preserves a JS-written value when the server attribute is unchanged', async function() {
            playground().innerHTML = '<div id="wrap"><input id="i" value="a"></div>';
            htmx.process(playground());
            htmx.live.q('#i').value = 'typed by user';
            await htmx.swap({
                target: '#wrap',
                text: '<div id="wrap"><input id="i" value="a"></div>',
                swap: 'outerMorph',
                sourceElement: playground()
            });
            await htmx.timeout(5);
            playground().querySelector('#i').value.should.equal('typed by user');
        });

    });

});
