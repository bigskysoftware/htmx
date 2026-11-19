 describe('hx-history-cache + hx-alpine-compat integration', function () {

    let extBackup;
    let historyElt;

    before(async () => {
        extBackup = backupExtensions();
        clearExtensions();
        htmx.config.extensions = 'history-cache,alpine-compat';
        htmx.__approvedExt = 'history-cache,alpine-compat';

        let historyCacheScript = document.createElement('script');
        historyCacheScript.src = '../src/ext/hx-history-cache.js';
        await new Promise(resolve => {
            historyCacheScript.onload = resolve;
            document.head.appendChild(historyCacheScript);
        });

        if (!window.Alpine) {
            await new Promise(resolve => {
                let alpineScript = document.createElement('script');
                alpineScript.defer = true;
                alpineScript.src = '../test/lib/alpine.js';
                document.addEventListener('alpine:init', resolve, { once: true });
                document.head.appendChild(alpineScript);
            });
        }

        let alpineCompatScript = document.createElement('script');
        alpineCompatScript.src = '../src/ext/hx-alpine-compat.js';
        await new Promise(resolve => {
            alpineCompatScript.onload = resolve;
            document.head.appendChild(alpineCompatScript);
        });
    });

    after(() => {
        restoreExtensions(extBackup);
    });

    beforeEach(() => {
        setupTest();
        sessionStorage.clear();
        htmx.config.historyCache = { size: 10, refreshOnMiss: false, disable: false, swapStyle: 'innerHTML' };

        historyElt = document.createElement('div');
        historyElt.setAttribute('hx-history-elt', '');
        historyElt.innerHTML = '<p>initial content</p>';
        playground().appendChild(historyElt);
    });

    afterEach(() => {
        cleanupTest();
        sessionStorage.clear();
    });

    // -------------------------------------------------------------------------
    // Alpine state round-trips
    // -------------------------------------------------------------------------

    function readSnapshot() {
        let index = JSON.parse(sessionStorage.getItem('htmx-history-index') || '[]');
        let item = JSON.parse(sessionStorage.getItem('htmx-history-' + index[index.length - 1]));
        return new DOMParser().parseFromString(item.content, 'text/html');
    }

    it('keeps Alpine components outside a partial swap reactive after saving the body', async function () {
        createProcessedHTML(`
            <div id="counter" x-data="{ count: 0, destroy() { this.$el.dataset.destroyed = 'true'; } }">
                <button id="increment" @click="count++">increment</button>
                <span x-text="count"></span>
            </div>
            <button id="navigate" hx-get="/page2" hx-target="#area" hx-push-url="true">go</button>
            <div id="area">original</div>
        `);
        await Alpine.nextTick();

        let component = playground().querySelector('#counter');
        let increment = component.querySelector('button');
        increment.click();
        await Alpine.nextTick();
        assert.equal(component.querySelector('span').textContent, '1');

        mockResponse('GET', '/page2', '<p>page 2</p>');
        playground().querySelector('#navigate').click();
        await forRequest();

        increment.click();
        await Alpine.nextTick();
        assert.equal(playground().querySelector('#area').textContent, 'page 2');
        assert.equal(component.querySelector('span').textContent, '2');
        assert.isFalse(component.hasAttribute('data-destroyed'));
        assert.isFalse(component.hasAttribute('data-alpine-state'));
        assert.equal(JSON.parse(readSnapshot().querySelector('#counter').getAttribute('data-alpine-state')).count, 1);
    });

    it('lets Alpine before:save listeners prepare the DOM and state for the snapshot', async function () {
        createProcessedHTML(`
            <div hx-history-elt>
                <div id="counter" x-data="{ count: 0 }"
                     x-on:htmx:history:cache:before:save.document="count = 42; $refs.toast.remove()">
                    <span x-text="count"></span>
                    <div id="toast" x-ref="toast">temporary notification</div>
                </div>
            </div>
            <button hx-get="/page2" hx-push-url="true">go</button>
        `);
        await Alpine.nextTick();

        mockResponse('GET', '/page2', '<p>page 2</p>');
        playground().querySelector('button').click();
        await forRequest();
        await Alpine.nextTick();

        let snapshot = readSnapshot();
        let component = playground().querySelector('#counter');
        assert.equal(component.querySelector('span').textContent, '42');
        assert.isNull(snapshot.querySelector('#toast'));
        assert.equal(JSON.parse(snapshot.querySelector('#counter').getAttribute('data-alpine-state')).count, 42);
        assert.isFalse(component.hasAttribute('data-alpine-state'));
    });

    it('lets Alpine cancel a save without tearing down the live component', async function () {
        createProcessedHTML(`
            <div hx-history-elt>
                <div x-data="{ count: 0, saves: 0 }"
                     x-on:htmx:history:cache:before:save.document.prevent="saves++">
                    <button id="increment" @click="count++">increment</button>
                    <span x-text="count"></span>
                </div>
            </div>
            <button id="navigate" hx-get="/page2" hx-push-url="true">go</button>
        `);
        await Alpine.nextTick();

        mockResponse('GET', '/page2', '<p>page 2</p>');
        playground().querySelector('#navigate').click();
        await forRequest();

        let component = playground().querySelector('[x-data]');
        assert.deepEqual(JSON.parse(sessionStorage.getItem('htmx-history-index') || '[]'), []);
        assert.equal(Alpine.$data(component).saves, 1);
        assert.isFalse(component.hasAttribute('data-alpine-state'));
        component.querySelector('button').click();
        await Alpine.nextTick();
        assert.equal(component.querySelector('span').textContent, '1');
    });

    for (let swapStyle of ['outerSync', 'outerHTML']) {
        it(`restores root Alpine state without duplicating x-for or x-if content with ${swapStyle}`, async function () {
            htmx.config.historyCache.swapStyle = swapStyle;
            let cachedPath = location.pathname + location.search;
            createProcessedHTML(`
                <div id="history-root" hx-history-elt x-data="{ items: [1], open: false }">
                    <template x-for="item in items" :key="item"><span class="loop-item" x-text="item"></span></template>
                    <template x-if="open"><span class="conditional">visible</span></template>
                </div>
                <button hx-get="/page2" hx-push-url="true">go</button>
            `);
            await Alpine.nextTick();
            historyElt = playground().querySelector('[hx-history-elt]');
            Alpine.$data(historyElt).items.push(2);
            Alpine.$data(historyElt).open = true;
            await Alpine.nextTick();

            mockResponse('GET', '/page2', '<p>page 2</p>');
            playground().querySelector('button').click();
            await forRequest();

            assert.equal(historyElt.querySelectorAll('.loop-item').length, 2);
            assert.equal(historyElt.querySelectorAll('.conditional').length, 1);
            assert.isFalse(historyElt.hasAttribute('data-alpine-state'));
            let snapshot = readSnapshot();
            assert.equal(snapshot.querySelectorAll('.loop-item, .conditional').length, 0);
            assert.deepEqual(JSON.parse(snapshot.querySelector('#history-root').getAttribute('data-alpine-state')),
                { items: [1, 2], open: true });

            let index = JSON.parse(sessionStorage.getItem('htmx-history-index'));
            history.replaceState({ htmx: true, htmxId: index[index.length - 1] }, '', cachedPath);
            await new Promise(resolve => {
                document.addEventListener('htmx:history:cache:after:restore', resolve, { once: true });
                htmx.__restoreHistory(history.state, cachedPath);
            });
            await Alpine.nextTick();

            historyElt = playground().querySelector('[hx-history-elt]');
            assert.deepEqual(Array.from(historyElt.querySelectorAll('.loop-item'), el => el.textContent), ['1', '2']);
            assert.equal(historyElt.querySelectorAll('.conditional').length, 1);
            Alpine.$data(historyElt).items.push(3);
            Alpine.$data(historyElt).open = false;
            await Alpine.nextTick();
            assert.equal(historyElt.querySelectorAll('.loop-item').length, 3);
            assert.equal(historyElt.querySelectorAll('.conditional').length, 0);
        });
    }

    async function saveAndRestoreAlpine(setupFn) {
        let cachedPath = location.pathname + location.search;
        createProcessedHTML(`
            <div hx-history-elt></div>
            <button hx-get="/page2" hx-push-url="/page2">go</button>
        `);
        historyElt = playground().querySelector('[hx-history-elt]');
        setupFn(historyElt);
        htmx.process(historyElt);
        await htmx.timeout(50);

        mockResponse('GET', '/page2', '<p>page 2</p>');
        playground().querySelector('button').click();
        await forRequest();

        let index = JSON.parse(sessionStorage.getItem('htmx-history-index') || '[]');
        let htmxId = index[index.length - 1];
        history.replaceState({ htmx: true, htmxId }, '', cachedPath);
        await new Promise(resolve => {
            document.addEventListener('htmx:history:cache:after:restore', resolve, { once: true });
            htmx.__restoreHistory(history.state, cachedPath);
        });
        await htmx.timeout(50);
        return historyElt;
    }

    it('restores mutated Alpine counter after user interaction', async function () {
        let cachedPath = location.pathname + location.search;
        createProcessedHTML(`
            <div hx-history-elt></div>
            <button hx-get="/page2" hx-push-url="/page2">go</button>
        `);
        historyElt = playground().querySelector('[hx-history-elt]');
        historyElt.innerHTML = '<div x-data="{ count: 0 }"><span x-text="count"></span></div>';
        htmx.process(historyElt);
        await htmx.timeout(50);

        let component = historyElt.querySelector('[x-data]');
        Alpine.$data(component).count = 42;
        await htmx.timeout(10);

        mockResponse('GET', '/page2', '<p>page 2</p>');
        playground().querySelector('button').click();
        await forRequest();

        let index = JSON.parse(sessionStorage.getItem('htmx-history-index') || '[]');
        let htmxId = index[index.length - 1];
        history.replaceState({ htmx: true, htmxId }, '', cachedPath);
        await new Promise(resolve => {
            document.addEventListener('htmx:history:cache:after:restore', resolve, { once: true });
            htmx.__restoreHistory(history.state, cachedPath);
        });
        await htmx.timeout(50);

        assert.equal(historyElt.querySelector('span').textContent, '42');
    });

    it('restores mutated Alpine string after user interaction', async function () {
        let cachedPath = location.pathname + location.search;
        createProcessedHTML(`
            <div hx-history-elt></div>
            <button hx-get="/page2" hx-push-url="/page2">go</button>
        `);
        historyElt = playground().querySelector('[hx-history-elt]');
        historyElt.innerHTML = '<div x-data="{ name: \'initial\' }"><span x-text="name"></span></div>';
        htmx.process(historyElt);
        await htmx.timeout(50);

        Alpine.$data(historyElt.querySelector('[x-data]')).name = 'changed';
        await htmx.timeout(10);

        mockResponse('GET', '/page2', '<p>page 2</p>');
        playground().querySelector('button').click();
        await forRequest();

        let index = JSON.parse(sessionStorage.getItem('htmx-history-index') || '[]');
        let htmxId = index[index.length - 1];
        history.replaceState({ htmx: true, htmxId }, '', cachedPath);
        await new Promise(resolve => {
            document.addEventListener('htmx:history:cache:after:restore', resolve, { once: true });
            htmx.__restoreHistory(history.state, cachedPath);
        });
        await htmx.timeout(50);

        assert.equal(historyElt.querySelector('span').textContent, 'changed');
    });

    it('restores nested x-data components independently', async function () {
        let elt = await saveAndRestoreAlpine(root => {
            root.innerHTML =
                '<div x-data="{ outer: \'A\' }">' +
                '  <span id="outer-val" x-text="outer"></span>' +
                '  <div x-data="{ inner: 42 }">' +
                '    <span id="inner-val" x-text="inner"></span>' +
                '  </div>' +
                '</div>';
        });
        assert.equal(elt.querySelector('#outer-val').textContent, 'A');
        assert.equal(elt.querySelector('#inner-val').textContent, '42');
    });

    it('does not duplicate teleported content after history restore', async function () {
        let cachedPath = location.pathname + location.search;
        createProcessedHTML(`
            <div id="tp-target"></div>
            <div hx-history-elt></div>
            <button hx-get="/page2" hx-push-url="/page2">go</button>
        `);
        historyElt = playground().querySelector('[hx-history-elt]');
        historyElt.innerHTML =
            '<div x-data="{ open: true }">' +
            '  <template x-teleport="#tp-target"><div class="tp-content">teleported</div></template>' +
            '</div>';
        htmx.process(historyElt);
        await htmx.timeout(50);

        mockResponse('GET', '/page2', '<p>page 2</p>');
        playground().querySelector('button').click();
        await forRequest();

        let index = JSON.parse(sessionStorage.getItem('htmx-history-index') || '[]');
        let htmxId = index[index.length - 1];
        history.replaceState({ htmx: true, htmxId }, '', cachedPath);
        await new Promise(resolve => {
            document.addEventListener('htmx:history:cache:after:restore', resolve, { once: true });
            htmx.__restoreHistory(history.state, cachedPath);
        });
        await htmx.timeout(50);

        let teleportTarget = playground().querySelector('#tp-target');
        assert.equal(teleportTarget.querySelectorAll('.tp-content').length, 1);
    });

    it('does not throw when restoring state with getter and method properties', async function () {
        let elt = await saveAndRestoreAlpine(root => {
            root.innerHTML =
                '<div x-data="{' +
                '  selectedCategory: \'all\',' +
                '  searchTerm: \'htmx\',' +
                '  cartItems: 3,' +
                '  products: [],' +
                '  get filteredProducts() { return this.products; },' +
                '  addToCart(p) { this.cartItems++; }' +
                '}">' +
                '  <span id="cart" x-text="cartItems"></span>' +
                '  <span id="cat" x-text="selectedCategory"></span>' +
                '</div>';
        });
        // Plain data restored, no exception thrown
        assert.equal(elt.querySelector('#cart').textContent, '3');
        assert.equal(elt.querySelector('#cat').textContent, 'all');
    });

    it('removes teleported content only from the snapshot', async function () {
        createProcessedHTML(`
            <div hx-history-elt>
                <div id="tp-target3"></div>
                <div x-data>
                    <template x-teleport="#tp-target3"><div>content</div></template>
                </div>
            </div>
            <button hx-get="/page2" hx-push-url="/page2">go</button>
        `);
        historyElt = playground().querySelector('[hx-history-elt]');
        await Alpine.nextTick();

        let childCountAtSnapshot = null;
        document.addEventListener('htmx:history:cache:before:save', () => {
            childCountAtSnapshot = playground().querySelector('#tp-target3').children.length;
        }, { once: true });

        mockResponse('GET', '/page2', '<p>page 2</p>');
        playground().querySelector('button').click();
        await forRequest();

        assert.equal(childCountAtSnapshot, 1);
        assert.equal(historyElt.querySelector('#tp-target3').children.length, 1);
        assert.equal(readSnapshot().querySelector('#tp-target3').children.length, 0);
    });

});
