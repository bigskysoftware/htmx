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
    // Helper: read the URL-keyed cache array from sessionStorage
    // -------------------------------------------------------------------------

    function readCache() {
        try { return JSON.parse(sessionStorage.getItem('htmx-history-index')) || []; } catch { return []; }
    }

    // -------------------------------------------------------------------------
    // saveCurrentPage / basic read-back
    // -------------------------------------------------------------------------

    it('saves current page on htmx:before:history:update', async function () {
        let savedDetail = null;
        document.addEventListener('htmx:history:cache:after:save', e => { savedDetail = e.detail; }, { once: true });

        mockResponse('GET', '/page2', '<p>page 2</p>');
        let btn = createProcessedHTML('<button hx-get="/page2" hx-push-url="/page2">go</button>');
        historyElt = document.createElement('div');
        historyElt.setAttribute('hx-history-elt', '');
        historyElt.innerHTML = '<p>initial content</p>';
        playground().appendChild(historyElt);

        btn.click();
        await forRequest();

        assert.isNotNull(savedDetail);
        assert.include(savedDetail.content, 'initial content');
    });

    it('stores title and scroll in cache item', async function () {
        document.title = 'Test Page';
        let savedDetail = null;
        document.addEventListener('htmx:history:cache:after:save', e => { savedDetail = e.detail; }, { once: true });

        mockResponse('GET', '/page2', '<p>page 2</p>');
        let btn = createProcessedHTML('<button hx-get="/page2" hx-push-url="/page2">go</button>');
        historyElt = document.createElement('div');
        historyElt.setAttribute('hx-history-elt', '');
        historyElt.innerHTML = '<p>initial content</p>';
        playground().appendChild(historyElt);

        btn.click();
        await forRequest();

        assert.equal(savedDetail.title, 'Test Page');
        assert.isNumber(savedDetail.scroll);
    });

    it('deduplicates entries for the same URL', async function () {
        let saveCount = 0;
        let savedUrls = [];
        document.addEventListener('htmx:history:cache:after:save', e => {
            saveCount++;
            savedUrls.push(e.detail.url ?? location.pathname + location.search);
        });

        let savedUrl = location.pathname + location.search;

        mockResponse('GET', '/page2', '<p>page 2</p>');
        let btn = createProcessedHTML('<button hx-get="/page2" hx-push-url="/page2">go</button>');
        historyElt = document.createElement('div');
        historyElt.setAttribute('hx-history-elt', '');
        historyElt.innerHTML = '<p>content</p>';
        playground().appendChild(historyElt);
        btn.click();
        await forRequest();

        // Navigate again from the same original URL
        history.replaceState(history.state, '', savedUrl);
        mockResponse('GET', '/page3', '<p>page 3</p>');
        let btn2 = createProcessedHTML('<button hx-get="/page3" hx-push-url="/page3">go</button>');
        historyElt = document.createElement('div');
        historyElt.setAttribute('hx-history-elt', '');
        historyElt.innerHTML = '<p>content</p>';
        playground().appendChild(historyElt);
        btn2.click();
        await forRequest();

        // Two saves fired but the extension deduplicates in history.state (same entry overwritten)
        assert.equal(saveCount, 2);
    });

    it('evicts oldest entry when size is exceeded', async function () {
        htmx.config.historyCache.size = 2;
        let saveCount = 0;
        document.addEventListener('htmx:history:cache:after:save', () => saveCount++);

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

        // 3 saves fired; size=2 means tier-2 sessionStorage eviction kicks in on overflow
        assert.equal(saveCount, 3);
    });

    it('does not save when size is 0', async function () {
        htmx.config.historyCache.size = 0;

        mockResponse('GET', '/page2', '<p>page 2</p>');
        let btn = createProcessedHTML('<button hx-get="/page2" hx-push-url="/page2">go</button>');
        historyElt = document.createElement('div');
        historyElt.setAttribute('hx-history-elt', '');
        historyElt.innerHTML = '<p>content</p>';
        playground().appendChild(historyElt);
        btn.click();
        await forRequest();

        assert.equal(readCache().length, 0);
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

        assert.equal(readCache().length, 0);
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

        assert.equal(readCache().length, 0);
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

        assert.equal(readCache().length, 0);
    });

    it('before:save mutation to detail.target changes the stored content', async function () {
        let handler = e => { e.detail.target.querySelector('p').textContent = 'mutated'; };
        document.addEventListener('htmx:history:cache:before:save', handler, { once: true });

        let savedDetail = null;
        document.addEventListener('htmx:history:cache:after:save', e => { savedDetail = e.detail; }, { once: true });

        mockResponse('GET', '/page2', '<p>page 2</p>');
        let btn = createProcessedHTML('<button hx-get="/page2" hx-push-url="/page2">go</button>');
        historyElt = document.createElement('div');
        historyElt.setAttribute('hx-history-elt', '');
        historyElt.innerHTML = '<p>original</p>';
        playground().appendChild(historyElt);
        btn.click();
        await forRequest();

        assert.include(savedDetail.content, 'mutated');
    });

    it('after:save fires with content and head', async function () {
        let afterDetail = null;
        document.addEventListener('htmx:history:cache:after:save', e => { afterDetail = e.detail; }, { once: true });

        mockResponse('GET', '/page2', '<p>page 2</p>');
        let btn = createProcessedHTML('<button hx-get="/page2" hx-push-url="/page2">go</button>');
        historyElt = document.createElement('div');
        historyElt.setAttribute('hx-history-elt', '');
        historyElt.innerHTML = '<p>content</p>';
        playground().appendChild(historyElt);
        btn.click();
        await forRequest();

        assert.isNotNull(afterDetail);
        assert.isString(afterDetail.content);
        assert.isString(afterDetail.head);
    });

    // -------------------------------------------------------------------------
    // restoreFromCache — cache hit (via htmx_before_history_restore)
    // -------------------------------------------------------------------------

    it('cache:hit restores content and cancels server fetch', async function () {
        let cachedPath = location.pathname + location.search;
        createProcessedHTML(`
            <div hx-history-elt><p>cached content</p></div>
            <button hx-get="/page2" hx-push-url="/page2">go</button>
        `);
        historyElt = playground().querySelector('[hx-history-elt]');

        let savedState;
        document.addEventListener('htmx:history:cache:after:save', () => {
            savedState = { ...history.state };
        }, { once: true });

        mockResponse('GET', '/page2', '<p>page 2</p>');
        playground().querySelector('button').click();
        await forRequest();

        // Restore the state the extension saved htmxContent into, then call restoreHistory directly
        history.replaceState(savedState, '', cachedPath);
        historyElt.innerHTML = '<p>current page</p>';

        let serverFetched = false;
        mockResponse('GET', cachedPath, () => { serverFetched = true; return '<p>server</p>'; });

        await new Promise(resolve => {
            document.addEventListener('htmx:history:cache:after:restore', resolve, { once: true });
            htmx.__restoreHistory(cachedPath);
        });

        assert.isFalse(serverFetched);
        assert.include(historyElt.innerHTML, 'cached content');
    });

    it('cache:hit cancellation falls through to server fetch', async function () {
        let cachedPath = location.pathname + location.search;
        createProcessedHTML(`
            <div hx-history-elt><p>cached</p></div>
            <button hx-get="/page2" hx-push-url="/page2">go</button>
        `);
        historyElt = playground().querySelector('[hx-history-elt]');

        let savedState;
        document.addEventListener('htmx:history:cache:after:save', () => {
            savedState = { ...history.state };
        }, { once: true });

        mockResponse('GET', '/page2', '<p>page 2</p>');
        playground().querySelector('button').click();
        await forRequest();

        history.replaceState(savedState, '', cachedPath);
        document.addEventListener('htmx:history:cache:hit', e => e.preventDefault(), { once: true });
        document.addEventListener('htmx:before:swap', e => e.preventDefault(), { once: true });

        let serverFetched = false;
        mockResponse('GET', cachedPath, () => { serverFetched = true; return '<p>from server</p>'; });

        htmx.__restoreHistory(cachedPath);
        await forRequest();

        assert.isTrue(serverFetched);
    });

    it('cache:hit item mutation uses the mutated item', async function () {
        let cachedPath = location.pathname + location.search;
        createProcessedHTML(`
            <div hx-history-elt><p>original cached</p></div>
            <button hx-get="/page2" hx-push-url="/page2">go</button>
        `);
        historyElt = playground().querySelector('[hx-history-elt]');

        let savedState;
        document.addEventListener('htmx:history:cache:after:save', () => {
            savedState = { ...history.state };
        }, { once: true });

        mockResponse('GET', '/page2', '<p>page 2</p>');
        playground().querySelector('button').click();
        await forRequest();

        history.replaceState(savedState, '', cachedPath);
        historyElt.innerHTML = '<p>current page</p>';

        document.addEventListener('htmx:history:cache:hit', e => {
            e.detail.item = { ...e.detail.item, content: '<p>mutated</p>' };
        }, { once: true });

        await new Promise(resolve => {
            document.addEventListener('htmx:history:cache:after:restore', resolve, { once: true });
            htmx.__restoreHistory(cachedPath);
        });

        assert.include(historyElt.innerHTML, 'mutated');
    });

    it('restores document.title from cache item', async function () {
        let cachedPath = location.pathname + location.search;
        document.title = 'My Cached Title';
        createProcessedHTML(`
            <div hx-history-elt><p>x</p></div>
            <button hx-get="/page2" hx-push-url="/page2">go</button>
        `);
        historyElt = playground().querySelector('[hx-history-elt]');

        let savedState;
        document.addEventListener('htmx:history:cache:after:save', () => {
            savedState = { ...history.state };
        }, { once: true });

        mockResponse('GET', '/page2', '<p>page 2</p>');
        playground().querySelector('button').click();
        await forRequest();

        document.title = 'Changed Title';
        history.replaceState(savedState, '', cachedPath);

        await new Promise(resolve => {
            document.addEventListener('htmx:history:cache:after:restore', resolve, { once: true });
            htmx.__restoreHistory(cachedPath);
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
            e.detail.refreshOnMiss = false;
        }, { once: true });
        document.addEventListener('htmx:before:swap', e => e.preventDefault(), { once: true });

        mockResponse('GET', '/missing-reload', '<p>from server</p>');
        htmx.__restoreHistory('/missing-reload');
        await forRequest();

        assert.isTrue(reloadWouldHaveFired);
    });

    it('falls back to sessionStorage when history.state quota exceeded', async function () {
        let original = history.replaceState.bind(history);
        history.replaceState = function(state, title, url) {
            if (state?.htmxContent) throw new DOMException('quota', 'QuotaExceededError');
            return original(state, title, url);
        };

        try {
            let savedState;
            document.addEventListener('htmx:history:cache:after:save', () => {
                savedState = { ...history.state };
            }, { once: true });

            createProcessedHTML(`
                <div hx-history-elt><p>tier 2 content</p></div>
                <button hx-get="/page2" hx-push-url="/page2">go</button>
            `);
            historyElt = playground().querySelector('[hx-history-elt]');

            mockResponse('GET', '/page2', '<p>page 2</p>');
            playground().querySelector('button').click();
            await forRequest();

            assert.isString(savedState.htmxId);
            assert.notExists(savedState.htmxContent);
            assert.equal(readCache().length, 1);

            // Verify restore also works from sessionStorage
            let cachedPath = location.pathname + location.search;
            history.replaceState = original;
            history.replaceState(savedState, '', cachedPath);
            historyElt.innerHTML = '<p>current page</p>';

            await new Promise(resolve => {
                document.addEventListener('htmx:history:cache:after:restore', resolve, { once: true });
                htmx.__restoreHistory(cachedPath);
            });

            assert.include(historyElt.innerHTML, 'tier 2 content');
        } finally {
            history.replaceState = original;
        }
    });

    it('uses configured swapStyle for cache restore', async function () {
        htmx.config.historyCache.swapStyle = 'innerHTML';
        let cachedPath = location.pathname + location.search;
        createProcessedHTML(`
            <div hx-history-elt><p>swap style test</p></div>
            <button hx-get="/page2" hx-push-url="/page2">go</button>
        `);
        historyElt = playground().querySelector('[hx-history-elt]');

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

        assert.include(historyElt.innerHTML, 'swap style test');
    });

    // -------------------------------------------------------------------------
    // form state & scroll annotation
    // -------------------------------------------------------------------------

    async function saveAndRestore(setupFn) {
        let cachedPath = location.pathname + location.search;
        createProcessedHTML(`
            <div hx-history-elt></div>
            <button hx-get="/page2" hx-push-url="/page2">go</button>
        `);
        historyElt = playground().querySelector('[hx-history-elt]');
        setupFn(historyElt);

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
        return historyElt;
    }

    it('restores text input value', async function () {
        let elt = await saveAndRestore(root => {
            let input = document.createElement('input');
            input.type = 'text';
            root.appendChild(input);
            input.value = 'hello';
        });
        assert.equal(elt.querySelector('input').value, 'hello');
    });

    it('restores textarea value', async function () {
        let elt = await saveAndRestore(root => {
            let ta = document.createElement('textarea');
            root.appendChild(ta);
            ta.value = 'some text';
        });
        assert.equal(elt.querySelector('textarea').value, 'some text');
    });

    it('restores checked checkbox', async function () {
        let elt = await saveAndRestore(root => {
            let cb = document.createElement('input');
            cb.type = 'checkbox';
            root.appendChild(cb);
            cb.checked = true;
        });
        assert.isTrue(elt.querySelector('input').checked);
    });

    it('does not restore unchecked checkbox', async function () {
        let elt = await saveAndRestore(root => {
            let cb = document.createElement('input');
            cb.type = 'checkbox';
            root.appendChild(cb);
            cb.checked = false;
        });
        assert.isFalse(elt.querySelector('input').checked);
    });

    it('restores checked radio', async function () {
        let elt = await saveAndRestore(root => {
            ['a', 'b'].forEach(v => {
                let r = document.createElement('input');
                r.type = 'radio';
                r.name = 'r';
                r.value = v;
                root.appendChild(r);
            });
            root.querySelectorAll('input')[1].checked = true;
        });
        let radios = elt.querySelectorAll('input[type=radio]');
        assert.isFalse(radios[0].checked);
        assert.isTrue(radios[1].checked);
    });

    it('restores single select value', async function () {
        let elt = await saveAndRestore(root => {
            let sel = document.createElement('select');
            ['a', 'b', 'c'].forEach(v => {
                let o = document.createElement('option');
                o.value = v;
                sel.appendChild(o);
            });
            root.appendChild(sel);
            sel.value = 'b';
        });
        assert.equal(elt.querySelector('select').value, 'b');
    });

    it('restores multi-select values', async function () {
        let elt = await saveAndRestore(root => {
            let sel = document.createElement('select');
            sel.multiple = true;
            ['r', 'g', 'b'].forEach(v => {
                let o = document.createElement('option');
                o.value = v;
                sel.appendChild(o);
            });
            root.appendChild(sel);
            sel.options[0].selected = true;
            sel.options[2].selected = true;
        });
        let selected = Array.from(elt.querySelector('select').options)
            .filter(o => o.selected).map(o => o.value);
        assert.deepEqual(selected, ['r', 'b']);
    });

    it('does not save password input value', async function () {
        let elt = await saveAndRestore(root => {
            let input = document.createElement('input');
            input.type = 'password';
            root.appendChild(input);
            input.value = 'secret';
        });
        assert.equal(elt.querySelector('input').value, '');
    });

    it('restores element scroll position', async function () {
        let elt = await saveAndRestore(root => {
            let div = document.createElement('div');
            div.style.height = '50px';
            div.style.overflowY = 'scroll';
            div.innerHTML = '<div style="height:200px"></div>';
            root.appendChild(div);
            div.scrollTop = 80;
        });
        assert.equal(elt.querySelector('div').scrollTop, 80);
    });

    // -------------------------------------------------------------------------
    // prefix config
    // -------------------------------------------------------------------------

    it('respects htmx.config.prefix for hx-history-elt', async function () {
        htmx.config.prefix = 'data-hx-';
        try {
            let savedDetail = null;
            document.addEventListener('htmx:history:cache:after:save', e => { savedDetail = e.detail; }, { once: true });

            historyElt.remove();
            let prefixedElt = document.createElement('div');
            prefixedElt.setAttribute('data-hx-history-elt', '');
            prefixedElt.innerHTML = '<p>prefixed target</p>';
            playground().appendChild(prefixedElt);

            mockResponse('GET', '/page2', '<p>page 2</p>');
            htmx.ajax('GET', '/page2', { push: '/page2', swap: 'none' });
            await forRequest();

            assert.isNotNull(savedDetail);
            assert.include(savedDetail.content, 'prefixed target');
        } finally {
            htmx.config.prefix = '';
        }
    });

    it('respects htmx.config.prefix for hx-history="false"', async function () {
        htmx.config.prefix = 'data-hx-';
        try {
            historyElt.remove();
            let sensitiveElt = document.createElement('div');
            sensitiveElt.setAttribute('data-hx-history-elt', '');
            sensitiveElt.setAttribute('data-hx-history', 'false');
            sensitiveElt.innerHTML = '<p>sensitive</p>';
            playground().appendChild(sensitiveElt);

            mockResponse('GET', '/page2', '<p>page 2</p>');
            htmx.ajax('GET', '/page2', { push: '/page2', swap: 'none' });
            await forRequest();

            assert.equal(readCache().length, 0);
        } finally {
            htmx.config.prefix = '';
        }
    });
});
