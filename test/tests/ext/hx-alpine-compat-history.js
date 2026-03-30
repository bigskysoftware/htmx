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

        let savedState;
        document.addEventListener('htmx:history:cache:after:save', () => {
            savedState = { ...history.state };
        }, { once: true });

        mockResponse('GET', '/page2', '<p>page 2</p>');
        playground().querySelector('button').click();
        await forRequest();

        history.replaceState(savedState, '', cachedPath);
        await new Promise(resolve => {
            document.addEventListener('htmx:history:cache:after:restore', resolve, { once: true });
            htmx.__restoreHistory(cachedPath);
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

        // Simulate user incrementing the counter
        let component = historyElt.querySelector('[x-data]');
        Alpine.$data(component).count = 42;
        await htmx.timeout(10);

        let savedState;
        document.addEventListener('htmx:history:cache:after:save', () => {
            savedState = { ...history.state };
        }, { once: true });

        mockResponse('GET', '/page2', '<p>page 2</p>');
        playground().querySelector('button').click();
        await forRequest();

        history.replaceState(savedState, '', cachedPath);
        await new Promise(resolve => {
            document.addEventListener('htmx:history:cache:after:restore', resolve, { once: true });
            htmx.__restoreHistory(cachedPath);
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

        let savedState;
        document.addEventListener('htmx:history:cache:after:save', () => {
            savedState = { ...history.state };
        }, { once: true });

        mockResponse('GET', '/page2', '<p>page 2</p>');
        playground().querySelector('button').click();
        await forRequest();

        history.replaceState(savedState, '', cachedPath);
        await new Promise(resolve => {
            document.addEventListener('htmx:history:cache:after:restore', resolve, { once: true });
            htmx.__restoreHistory(cachedPath);
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

        let savedState;
        document.addEventListener('htmx:history:cache:after:save', () => {
            savedState = { ...history.state };
        }, { once: true });

        mockResponse('GET', '/page2', '<p>page 2</p>');
        playground().querySelector('button').click();
        await forRequest();

        history.replaceState(savedState, '', cachedPath);
        await new Promise(resolve => {
            document.addEventListener('htmx:history:cache:after:restore', resolve, { once: true });
            htmx.__restoreHistory(cachedPath);
        });
        await htmx.timeout(50);

        let teleportTarget = playground().querySelector('#tp-target');
        assert.equal(teleportTarget.querySelectorAll('.tp-content').length, 1);
    });

    it('teleport target is empty after destroyTree runs before snapshot', async function () {
        let cachedPath = location.pathname + location.search;
        createProcessedHTML(`
            <div id="tp-target3"></div>
            <div hx-history-elt></div>
            <button hx-get="/page2" hx-push-url="/page2">go</button>
        `);
        historyElt = playground().querySelector('[hx-history-elt]');
        historyElt.innerHTML =
            '<div x-data>' +
            '  <template x-teleport="#tp-target3"><div>content</div></template>' +
            '</div>';
        htmx.process(historyElt);
        await htmx.timeout(50);

        let childCountAtSnapshot = null;
        document.addEventListener('htmx:history:cache:before:save', () => {
            childCountAtSnapshot = playground().querySelector('#tp-target3').children.length;
        }, { once: true });

        let savedState;
        document.addEventListener('htmx:history:cache:after:save', () => {
            savedState = { ...history.state };
        }, { once: true });

        mockResponse('GET', '/page2', '<p>page 2</p>');
        playground().querySelector('button').click();
        await forRequest();

        assert.equal(childCountAtSnapshot, 0);
    });

});
