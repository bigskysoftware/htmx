describe('hx-history-cache extension', function () {

    let extBackup;
    let historyElt;

    before(async () => {
        extBackup = backupExtensions();
        clearExtensions();
        htmx.config.extensions = 'history-cache';
        htmx.__approvedExt = 'history-cache';

        let script = document.createElement('script');
        script.src = '../src/ext/hx-history-cache.js';
        await new Promise(resolve => {
            script.onload = resolve;
            document.head.appendChild(script);
        });
    });

    after(() => {
        restoreExtensions(extBackup);
    });

    beforeEach(() => {
        setupTest();
        sessionStorage.clear();
        htmx.config.historyCache = { size: 10, refreshOnMiss: false, disable: false, swapStyle: 'innerHTML' };

        // Add a history target element to the playground so we never touch document.body
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
    // saveToCache / basic read-back
    // -------------------------------------------------------------------------

    it('saves current page to sessionStorage on htmx:before:history:update', async function () {
        mockResponse('GET', '/page2', '<p>page 2</p>');
        let btn = createProcessedHTML('<button hx-get="/page2" hx-push-url="/page2">go</button>');
        // re-append historyElt since createProcessedHTML replaced playground innerHTML
        historyElt = document.createElement('div');
        historyElt.setAttribute('hx-history-elt', '');
        historyElt.innerHTML = '<p>initial content</p>';
        playground().appendChild(historyElt);

        btn.click();
        await forRequest();

        let cache = JSON.parse(sessionStorage.getItem('htmx-history-cache'));
        assert.isArray(cache);
        assert.equal(cache.length, 1);
        assert.include(cache[0].content, 'initial content');
    });


    it('stores title and scroll in cache item', async function () {
        document.title = 'Test Page';
        mockResponse('GET', '/page2', '<p>page 2</p>');
        let btn = createProcessedHTML('<button hx-get="/page2" hx-push-url="/page2">go</button>');
        historyElt = document.createElement('div');
        historyElt.setAttribute('hx-history-elt', '');
        historyElt.innerHTML = '<p>initial content</p>';
        playground().appendChild(historyElt);

        btn.click();
        await forRequest();

        let cache = JSON.parse(sessionStorage.getItem('htmx-history-cache'));
        assert.equal(cache[0].title, 'Test Page');
        assert.isNumber(cache[0].scroll);
    });

    it('deduplicates entries for the same URL', async function () {
        mockResponse('GET', '/page2', '<p>page 2</p>');
        mockResponse('GET', '/page3', '<p>page 3</p>');

        // navigate to page2 twice (once directly, once via replace)
        let btn = createProcessedHTML('<button hx-get="/page2" hx-push-url="/page2">go</button>');
        historyElt = document.createElement('div');
        historyElt.setAttribute('hx-history-elt', '');
        historyElt.innerHTML = '<p>content</p>';
        playground().appendChild(historyElt);
        btn.click();
        await forRequest();

        // simulate being on /page2 and navigating to /page3 — saves /page2 again
        mockResponse('GET', '/page3', '<p>page 3</p>');
        let btn2 = createProcessedHTML('<button hx-get="/page3" hx-push-url="/page3">go</button>');
        btn2.click();
        await forRequest();

        let cache = JSON.parse(sessionStorage.getItem('htmx-history-cache'));
        let page2Entries = cache.filter(e => e.url === '/page2');
        assert.equal(page2Entries.length, 1);
    });

    it('evicts oldest entry when size is exceeded', async function () {
        htmx.config.historyCache.size = 2;

        for (let i = 1; i <= 3; i++) {
            mockResponse('GET', `/p${i + 1}`, `<p>page ${i + 1}</p>`);
            let btn = createProcessedHTML(`<button hx-get="/p${i + 1}" hx-push-url="/p${i + 1}">go</button>`);
            historyElt = document.createElement('div');
            historyElt.setAttribute('hx-history-elt', '');
            historyElt.innerHTML = `<p>page ${i}</p>`;
            playground().appendChild(historyElt);
            btn.click();
            await forRequest();
        }

        let cache = JSON.parse(sessionStorage.getItem('htmx-history-cache'));
        assert.equal(cache.length, 2);
        assert.isNull(cache.find(e => e.url === '/p1') ?? null);
    });

    it('clears cache when size is 0', async function () {
        // seed something first
        sessionStorage.setItem('htmx-history-cache', JSON.stringify([{ url: '/old', content: 'x', title: '', scroll: 0 }]));
        htmx.config.historyCache.size = 0;

        mockResponse('GET', '/page2', '<p>page 2</p>');
        let btn = createProcessedHTML('<button hx-get="/page2" hx-push-url="/page2">go</button>');
        historyElt = document.createElement('div');
        historyElt.setAttribute('hx-history-elt', '');
        historyElt.innerHTML = '<p>content</p>';
        playground().appendChild(historyElt);
        btn.click();
        await forRequest();

        assert.isNull(sessionStorage.getItem('htmx-history-cache'));
    });

    it('does not cache when hx-history="false" is present', async function () {
        mockResponse('GET', '/page2', '<p>page 2</p>');
        let btn = createProcessedHTML('<button hx-get="/page2" hx-push-url="/page2">go</button>');
        historyElt = document.createElement('div');
        historyElt.setAttribute('hx-history-elt', '');
        historyElt.setAttribute('hx-history', 'false');
        historyElt.innerHTML = '<p>sensitive</p>';
        playground().appendChild(historyElt);
        btn.click();
        await forRequest();

        let raw = sessionStorage.getItem('htmx-history-cache');
        let cache = raw ? JSON.parse(raw) : [];
        assert.equal(cache.length, 0);
    });

    it('does nothing when disable is true', async function () {
        htmx.config.historyCache.disable = true;

        mockResponse('GET', '/page2', '<p>page 2</p>');
        let btn = createProcessedHTML('<button hx-get="/page2" hx-push-url="/page2">go</button>');
        historyElt = document.createElement('div');
        historyElt.setAttribute('hx-history-elt', '');
        historyElt.innerHTML = '<p>content</p>';
        playground().appendChild(historyElt);
        btn.click();
        await forRequest();

        assert.isNull(sessionStorage.getItem('htmx-history-cache'));
    });

    // -------------------------------------------------------------------------
    // htmx:history:cache:before:save event
    // -------------------------------------------------------------------------

    it('before:save cancellation skips the save', async function () {
        let handler = e => e.preventDefault();
        document.addEventListener('htmx:history:cache:before:save', handler, { once: true });

        mockResponse('GET', '/page2', '<p>page 2</p>');
        let btn = createProcessedHTML('<button hx-get="/page2" hx-push-url="/page2">go</button>');
        historyElt = document.createElement('div');
        historyElt.setAttribute('hx-history-elt', '');
        historyElt.innerHTML = '<p>content</p>';
        playground().appendChild(historyElt);
        btn.click();
        await forRequest();

        let raw = sessionStorage.getItem('htmx-history-cache');
        let cache = raw ? JSON.parse(raw) : [];
        assert.equal(cache.length, 0);
    });

    it('before:save mutation to detail.path changes the stored URL', async function () {
        let handler = e => { e.detail.path = '/mutated'; };
        document.addEventListener('htmx:history:cache:before:save', handler, { once: true });

        mockResponse('GET', '/page2', '<p>page 2</p>');
        let btn = createProcessedHTML('<button hx-get="/page2" hx-push-url="/page2">go</button>');
        historyElt = document.createElement('div');
        historyElt.setAttribute('hx-history-elt', '');
        historyElt.innerHTML = '<p>content</p>';
        playground().appendChild(historyElt);
        btn.click();
        await forRequest();

        let cache = JSON.parse(sessionStorage.getItem('htmx-history-cache'));
        assert.equal(cache[0].url, '/mutated');
    });

    it('after:save fires with the saved item', async function () {
        let afterDetail = null;
        let handler = e => { afterDetail = e.detail; };
        document.addEventListener('htmx:history:cache:after:save', handler, { once: true });

        mockResponse('GET', '/page2', '<p>page 2</p>');
        let btn = createProcessedHTML('<button hx-get="/page2" hx-push-url="/page2">go</button>');
        historyElt = document.createElement('div');
        historyElt.setAttribute('hx-history-elt', '');
        historyElt.innerHTML = '<p>content</p>';
        playground().appendChild(historyElt);
        btn.click();
        await forRequest();

        assert.isNotNull(afterDetail);
        assert.isObject(afterDetail.item);
        assert.isArray(afterDetail.cache);
    });

    // -------------------------------------------------------------------------
    // restoreFromCache — cache hit
    // -------------------------------------------------------------------------

    it('cache:hit restores content and cancels server fetch', async function () {
        sessionStorage.setItem('htmx-history-cache', JSON.stringify([
            { url: '/cached', content: '<p>cached content</p>', head: '', title: 'Cached', scroll: 0 }
        ]));

        let serverFetched = false;
        mockResponse('GET', '/cached', () => { serverFetched = true; return '<p>server</p>'; });

        let restored = await new Promise(resolve => {
            document.addEventListener('htmx:history:cache:restored', e => resolve(e.detail), { once: true });
            htmx.__restoreHistory('/cached');
        });

        assert.isFalse(serverFetched);
        assert.equal(restored.path, '/cached');
        assert.include(historyElt.innerHTML, 'cached content');
    });

    it('cache:hit cancellation falls through to server fetch', async function () {
        sessionStorage.setItem('htmx-history-cache', JSON.stringify([
            { url: '/cached-fallthrough', content: '<p>cached</p>', head: '', title: 'C', scroll: 0 }
        ]));

        document.addEventListener('htmx:history:cache:hit', e => e.preventDefault(), { once: true });
        document.addEventListener('htmx:before:swap', e => e.preventDefault(), { once: true });

        let serverFetched = false;
        mockResponse('GET', '/cached-fallthrough', () => { serverFetched = true; return '<p>from server</p>'; });
        htmx.__restoreHistory('/cached-fallthrough');
        await forRequest();

        assert.isTrue(serverFetched);
    });

    it('cache:hit item mutation uses the mutated item', async function () {
        sessionStorage.setItem('htmx-history-cache', JSON.stringify([
            { url: '/cached-mutation', content: '<p>original cached</p>', head: '', title: 'C', scroll: 0 }
        ]));

        document.addEventListener('htmx:history:cache:hit', e => {
            e.detail.item = { ...e.detail.item, content: '<p>mutated</p>', title: 'Mutated' };
        }, { once: true });

        await new Promise(resolve => {
            document.addEventListener('htmx:history:cache:restored', resolve, { once: true });
            htmx.__restoreHistory('/cached-mutation');
        });

        assert.include(historyElt.innerHTML, 'mutated');
    });

    it('restores document.title from cache', async function () {
        sessionStorage.setItem('htmx-history-cache', JSON.stringify([
            { url: '/cached-title', content: '<p>x</p>', head: '', title: 'My Cached Title', scroll: 0 }
        ]));

        await new Promise(resolve => {
            document.addEventListener('htmx:history:cache:restored', resolve, { once: true });
            htmx.__restoreHistory('/cached-title');
        });

        assert.equal(document.title, 'My Cached Title');
    });

    // -------------------------------------------------------------------------
    // restoreFromCache — cache miss
    // -------------------------------------------------------------------------

    it('cache:miss fires when entry not found', async function () {
        let missDetail = null;
        document.addEventListener('htmx:history:cache:miss', e => { missDetail = e.detail; }, { once: true });
        document.addEventListener('htmx:before:swap', e => e.preventDefault(), { once: true });

        mockResponse('GET', '/missing', '<p>from server</p>');
        htmx.__restoreHistory('/missing');
        await forRequest();

        assert.isNotNull(missDetail);
        assert.equal(missDetail.path, '/missing');
    });

    it('cache:miss refreshOnMiss config causes reload on miss', async function () {
        htmx.config.historyCache.refreshOnMiss = true;

        let reloadWouldHaveFired = false;
        document.addEventListener('htmx:history:cache:miss', e => {
            reloadWouldHaveFired = e.detail.refreshOnMiss;
            e.detail.refreshOnMiss = false; // prevent actual reload
        }, { once: true });
        document.addEventListener('htmx:before:swap', e => e.preventDefault(), { once: true });

        mockResponse('GET', '/missing-reload', '<p>from server</p>');
        htmx.__restoreHistory('/missing-reload');
        await forRequest();

        assert.isTrue(reloadWouldHaveFired);
    });

    // -------------------------------------------------------------------------
    // swapStyle config
    // -------------------------------------------------------------------------

    it('uses configured swapStyle for cache restore', async function () {
        htmx.config.historyCache.swapStyle = 'innerHTML';
        sessionStorage.setItem('htmx-history-cache', JSON.stringify([
            { url: '/sw', content: '<p>swap style test</p>', head: '', title: '', scroll: 0 }
        ]));

        await new Promise(resolve => {
            document.addEventListener('htmx:history:cache:restored', resolve, { once: true });
            htmx.__restoreHistory('/sw');
        });

        assert.include(historyElt.innerHTML, 'swap style test');
    });

    // -------------------------------------------------------------------------
    // prefix config
    // -------------------------------------------------------------------------

    it('respects htmx.config.prefix for hx-history-elt', async function () {
        htmx.config.prefix = 'data-hx-';
        try {
            mockResponse('GET', '/page2', '<p>page 2</p>');
            let prefixedElt = document.createElement('div');
            prefixedElt.setAttribute('data-hx-history-elt', '');
            prefixedElt.innerHTML = '<p>prefixed target</p>';
            playground().appendChild(prefixedElt);
            // drive the navigation directly — avoids #actionSelector cache issue with prefix
            htmx.ajax('GET', '/page2', { push: '/page2', swap: 'none' });
            await forRequest();

            let raw = sessionStorage.getItem('htmx-history-cache');
            let cache = raw ? JSON.parse(raw) : [];
            assert.isAbove(cache.length, 0, 'expected cache to have an entry');
            assert.include(cache[0].content, 'prefixed target');
        } finally {
            htmx.config.prefix = '';
        }
    });

    it('respects htmx.config.prefix for hx-history="false"', async function () {
        htmx.config.prefix = 'data-hx-';
        try {
            let sensitiveElt = document.createElement('div');
            sensitiveElt.setAttribute('data-hx-history-elt', '');
            sensitiveElt.setAttribute('data-hx-history', 'false');
            sensitiveElt.innerHTML = '<p>sensitive</p>';
            playground().appendChild(sensitiveElt);

            mockResponse('GET', '/page2', '<p>page 2</p>');
            htmx.ajax('GET', '/page2', { push: '/page2', swap: 'none' });
            await forRequest();

            let raw = sessionStorage.getItem('htmx-history-cache');
            let cache = raw ? JSON.parse(raw) : [];
            assert.equal(cache.length, 0);
        } finally {
            htmx.config.prefix = '';
        }
    });
});
