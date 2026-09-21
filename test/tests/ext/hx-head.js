describe('hx-head extension', function() {

    let extBackup;
    let addedHeadElts = [];

    function addToHead(elt) {
        document.head.appendChild(elt);
        addedHeadElts.push(elt);
    }

    before(async () => {
        extBackup = backupExtensions();
        clearExtensions();

        htmx.config.extensions = 'hx-head';

        let script = document.createElement('script');
        script.src = '../src/ext/hx-head.js';
        await new Promise(resolve => {
            script.onload = resolve;
            document.head.appendChild(script);
        });
    });

    after(() => {
        restoreExtensions(extBackup);
    });

    afterEach(function() {
        for (const elt of addedHeadElts) {
            if (elt.parentNode === document.head) document.head.removeChild(elt);
        }
        addedHeadElts = [];
        cleanupTest();
    });

    function headResponse(headHtml, bodyHtml) {
        return `<html><head>${headHtml}</head><body>${bodyHtml}</body></html>`;
    }

    // Wait for head merge to complete
    async function afterMerge() {
        await waitForEvent('htmx:head:after:merge', 500)
            .catch(() => {}); // no head = no event, that's fine
        await forRequest();
    }

    it('merges new meta tags into head', async function() {
        mockResponse('GET', '/page', headResponse('<meta name="hx-head-test-desc" content="new page">', '<div>content</div>'));
        let div = createProcessedHTML('<div hx-get="/page" hx-swap="innerHTML">click</div>');

       div.click();
        await afterMerge();

        let meta = document.head.querySelector('meta[name="hx-head-test-desc"]');
        assert.isNotNull(meta, 'meta tag should be added to head');
        assert.equal(meta.content, 'new page');
        if (meta) addedHeadElts.push(meta);
    });

    it('preserves existing head elements present in new head', async function() {
        let existing = document.createElement('meta');
        existing.setAttribute('name', 'hx-head-test-preserve');
        existing.setAttribute('content', 'keep');
        addToHead(existing);

        mockResponse('GET', '/page', headResponse('<meta name="hx-head-test-preserve" content="keep">', '<div>content</div>'));
        let div = createProcessedHTML('<div hx-get="/page" hx-swap="innerHTML">click</div>');

        div.click();
        await afterMerge();

        let metas = document.head.querySelectorAll('meta[name="hx-head-test-preserve"]');
        assert.equal(metas.length, 1, 'should not duplicate preserved elements');
    });

    it('removes head elements not in new head under merge strategy', async function() {
        let stale = document.createElement('meta');
        stale.setAttribute('name', 'hx-head-test-stale');
        stale.setAttribute('content', 'remove-me');
        addToHead(stale);

        mockResponse('GET', '/page', `<html><head hx-head="merge"></head><body><div>swapped</div></body></html>`);
        let div = createProcessedHTML('<div hx-get="/page" hx-swap="innerHTML">click</div>');

        div.click();
        await afterMerge();

        assert.isNull(document.head.querySelector('meta[name="hx-head-test-stale"]'), 'stale element should be removed under merge');
    });

    it('does not remove head elements under append strategy', async function() {
        let existing = document.createElement('meta');
        existing.setAttribute('name', 'hx-head-test-keep');
        existing.setAttribute('content', 'yes');
        addToHead(existing);

        mockResponse('GET', '/page', headResponse('<meta name="hx-head-test-new" content="added">', '<div>content</div>'));
        let div = createProcessedHTML('<div hx-get="/page" hx-swap="innerHTML">click</div>');

        div.click();
        await afterMerge();

        let added = document.head.querySelector('meta[name="hx-head-test-new"]');
        if (added) addedHeadElts.push(added);

        assert.isNotNull(document.head.querySelector('meta[name="hx-head-test-keep"]'), 'existing element should be kept under append');
        assert.isNotNull(added, 'new element should be added');
    });

    it('fires htmx:head:before:merge and htmx:head:after:merge events', async function() {
        let beforeFired = false;
        let afterFired = false;

        let onBefore = () => { beforeFired = true; };
        let onAfter = () => { afterFired = true; };
        document.body.addEventListener('htmx:head:before:merge', onBefore);
        document.body.addEventListener('htmx:head:after:merge', onAfter);

        mockResponse('GET', '/page', headResponse('<meta name="hx-head-test-evt" content="val">', '<div>content</div>'));
        let div = createProcessedHTML('<div hx-get="/page" hx-swap="innerHTML">click</div>');

        div.click();
        await afterMerge();

        document.body.removeEventListener('htmx:head:before:merge', onBefore);
        document.body.removeEventListener('htmx:head:after:merge', onAfter);

        let added = document.head.querySelector('meta[name="hx-head-test-evt"]');
        if (added) addedHeadElts.push(added);

        assert.isTrue(beforeFired, 'htmx:head:before:merge should fire');
        assert.isTrue(afterFired, 'htmx:head:after:merge should fire');
    });

    it('htmx:head:before:merge cancellation prevents merge', async function() {
        let onBefore = (e) => { e.preventDefault(); };
        document.body.addEventListener('htmx:head:before:merge', onBefore, {once: true});

        mockResponse('GET', '/page', headResponse('<meta name="hx-head-test-cancel" content="val">', '<div>content</div>'));
        let div = createProcessedHTML('<div hx-get="/page" hx-swap="innerHTML">click</div>');

        div.click();
        await afterMerge();

        assert.isNull(document.head.querySelector('meta[name="hx-head-test-cancel"]'), 'merge should be cancelled');
    });

    it('re-eval elements are removed and re-appended', async function() {
        let executionCount = 0;
        window.testReEval = () => { executionCount++; };
        
        let existing = document.createElement('script');
        existing.setAttribute('hx-head', 're-eval');
        existing.textContent = 'window.testReEval();';
        addToHead(existing);
        
        // Script should have executed once when added
        assert.equal(executionCount, 1, 'script should execute when first added');

        mockResponse('GET', '/page', headResponse('<script hx-head="re-eval">window.testReEval();</script>', '<div>content</div>'));
        let div = createProcessedHTML('<div hx-get="/page" hx-swap="innerHTML">click</div>');

        div.click();
        await afterMerge();

        let scripts = document.head.querySelectorAll('script');
        let reEvalScripts = Array.from(scripts).filter(s => s.textContent.includes('testReEval'));
        assert.equal(reEvalScripts.length, 1, 'should have exactly one re-eval script');
        assert.equal(executionCount, 2, 'script should have been re-executed');
        
        // track for cleanup
        addedHeadElts.push(reEvalScripts[0]);
        delete window.testReEval;
    });

    it('swap happens after head merge completes', async function() {
        let headMergeTime = null;
        let swapTime = null;

        let onMerge = () => { headMergeTime = Date.now(); };
        let onSwap = () => { swapTime = Date.now(); };
        document.body.addEventListener('htmx:head:after:merge', onMerge);
        document.body.addEventListener('htmx:after:swap', onSwap);

        mockResponse('GET', '/page', headResponse('<meta name="hx-head-test-timing" content="val">', '<div>swapped</div>'));
        let div = createProcessedHTML('<div hx-get="/page" hx-swap="innerHTML">click</div>');

        div.click();
        await afterMerge();

        document.body.removeEventListener('htmx:head:after:merge', onMerge);
        document.body.removeEventListener('htmx:after:swap', onSwap);

        let added = document.head.querySelector('meta[name="hx-head-test-timing"]');
        if (added) addedHeadElts.push(added);

        assert.isNotNull(headMergeTime, 'head merge should have fired');
        assert.isNotNull(swapTime, 'swap should have fired');
        assert.isAtMost(headMergeTime, swapTime, 'head merge must complete before swap');
    });

    it('replaces title in append mode when new title differs', async function() {
        let title = document.createElement('title');
        title.textContent = 'Page 1';
        addToHead(title);

        mockResponse('GET', '/page', headResponse('<title>Page 2</title>', '<div>content</div>'));
        let div = createProcessedHTML('<div hx-get="/page" hx-swap="innerHTML">click</div>');

        div.click();
        await afterMerge();

        let titles = document.head.querySelectorAll('title');
        assert.equal(titles.length, 1, 'should have exactly one title element');
        assert.equal(titles[0].textContent, 'Page 2', 'title should be updated to new page title');
    });

    it('does not duplicate title when navigating back and forth', async function() {
        let title = document.createElement('title');
        title.textContent = 'Page 1';
        addToHead(title);

        mockResponse('GET', '/page2', headResponse('<title>Page 2</title>', '<div>page 2</div>'));
        let div = createProcessedHTML('<div hx-get="/page2" hx-swap="innerHTML">click</div>');
        div.click();
        await afterMerge();

        mockResponse('GET', '/page1', headResponse('<title>Page 1</title>', '<div>page 1</div>'));
        let div2 = createProcessedHTML('<div hx-get="/page1" hx-swap="innerHTML">click</div>');
        div2.click();
        await afterMerge();

        let titles = document.head.querySelectorAll('title');
        assert.equal(titles.length, 1, 'should still have exactly one title after navigating back');
        assert.equal(titles[0].textContent, 'Page 1', 'title should reflect current page');
    });

    it('preserves title in append mode when new head has no title', async function() {
        let title = document.createElement('title');
        title.textContent = 'My Page';
        addToHead(title);

        let titleCountBefore = document.head.querySelectorAll('title').length;

        mockResponse('GET', '/page', headResponse('<meta name="hx-head-test-notitle" content="yes">', '<div>content</div>'));
        let div = createProcessedHTML('<div hx-get="/page" hx-swap="innerHTML">click</div>');

        div.click();
        await afterMerge();

        let added = document.head.querySelector('meta[name="hx-head-test-notitle"]');
        if (added) addedHeadElts.push(added);

        let titles = document.head.querySelectorAll('title');
        assert.equal(titles.length, titleCountBefore, 'title count should not change in append mode when new head has no title');
        assert.equal(title.textContent, 'My Page', 'original title should be preserved');
    });

    it('removes title in merge mode when incoming head has no title', async function() {
        let title = document.createElement('title');
        title.textContent = 'My Page';
        addToHead(title);

        let titleCountBefore = document.head.querySelectorAll('title').length;

        // hx-head="merge" on the head tag forces merge strategy
        mockResponse('GET', '/page', `<html><head hx-head="merge"><meta name="hx-head-test-merge-notitle" content="yes"></head><body><div>content</div></body></html>`);
        let div = createProcessedHTML('<div hx-get="/page" hx-swap="innerHTML">click</div>');

        div.click();
        await afterMerge();

        let added = document.head.querySelector('meta[name="hx-head-test-merge-notitle"]');
        if (added) addedHeadElts.push(added);

        let titles = document.head.querySelectorAll('title');
        assert.isBelow(titles.length, titleCountBefore, 'title should be removed in merge mode when new head has no title');
    });

    it('fires htmx:head:before:remove exactly once per removed element', async function() {
        let meta = document.createElement('meta');
        meta.setAttribute('name', 'hx-head-test-4088');
        meta.setAttribute('content', 'remove-me');
        addToHead(meta);

        let removeCount = 0;
        let onRemove = (e) => { if (e.detail.headElement === meta) removeCount++; };
        document.body.addEventListener('htmx:head:before:remove', onRemove);

        mockResponse('GET', '/page', `<html><head hx-head="merge"></head><body><div>page</div></body></html>`);
        let div = createProcessedHTML('<div hx-get="/page" hx-swap="innerHTML">click</div>');
        div.click();
        await afterMerge();

        document.body.removeEventListener('htmx:head:before:remove', onRemove);

        assert.equal(removeCount, 1, 'htmx:head:before:remove should fire exactly once per element');
    });

    it('fires htmx:head:before:remove exactly once for hx-preserve elements being removed', async function() {
        let meta = document.createElement('meta');
        meta.setAttribute('name', 'hx-head-test-4088-preserve');
        meta.setAttribute('content', 'remove-me');
        addToHead(meta);

        let removeCount = 0;
        let onRemove = (e) => { if (e.detail.headElement === meta) removeCount++; };
        document.body.addEventListener('htmx:head:before:remove', onRemove);

        // response has no matching meta, merge mode removes it
        mockResponse('GET', '/page', `<html><head hx-head="merge"></head><body><div>page</div></body></html>`);
        let div = createProcessedHTML('<div hx-get="/page" hx-swap="innerHTML">click</div>');
        div.click();
        await afterMerge();

        document.body.removeEventListener('htmx:head:before:remove', onRemove);

        assert.equal(removeCount, 1, 'htmx:head:before:remove should fire exactly once even with hx-preserve elements present');
    });

    it('cancelling htmx:head:before:remove prevents removal and excludes element from after:merge removed array', async function() {
        let meta = document.createElement('meta');
        meta.setAttribute('name', 'hx-head-test-4088-cancel');
        meta.setAttribute('content', 'keep-me');
        addToHead(meta);

        let removedInEvent = null;
        let onRemove = (e) => { e.preventDefault(); };
        let onAfter = (e) => { removedInEvent = e.detail.removed; };
        document.body.addEventListener('htmx:head:before:remove', onRemove);
        document.body.addEventListener('htmx:head:after:merge', onAfter, {once: true});

        mockResponse('GET', '/page', `<html><head hx-head="merge"></head><body><div>page</div></body></html>`);
        let div = createProcessedHTML('<div hx-get="/page" hx-swap="innerHTML">click</div>');
        div.click();
        await afterMerge();

        document.body.removeEventListener('htmx:head:before:remove', onRemove);

        assert.isNotNull(document.head.querySelector('meta[name="hx-head-test-4088-cancel"]'), 'element should remain when removal is cancelled');
        assert.isFalse(removedInEvent.includes(meta), 'cancelled element should not appear in after:merge removed array');
    });

    it('does not duplicate title when navigating back and forth in append mode', async function() {
        let title = document.createElement('title');
        title.textContent = 'Page 1';
        addToHead(title);

        mockResponse('GET', '/page2', headResponse('<title>Page 2</title>', '<div>page 2</div>'));
        let div = createProcessedHTML('<div hx-get="/page2" hx-swap="innerHTML">click</div>');
        div.click();
        await afterMerge();

        mockResponse('GET', '/page1', headResponse('<title>Page 1</title>', '<div>page 1</div>'));
        let div2 = createProcessedHTML('<div hx-get="/page1" hx-swap="innerHTML">click</div>');
        div2.click();
        await afterMerge();

        let titles = document.head.querySelectorAll('title');
        assert.equal(titles.length, 1, 'should have exactly one title after round-trip navigation in append mode');
    });

    it('removes existing title in append mode when response has a title', async function() {
        let title = document.createElement('title');
        title.textContent = 'Old Title';
        addToHead(title);

        mockResponse('GET', '/page', headResponse('<title>New Title</title>', '<div>content</div>'));
        let div = createProcessedHTML('<div hx-get="/page" hx-swap="innerHTML">click</div>');
        div.click();
        await afterMerge();

        let titles = document.head.querySelectorAll('title');
        assert.equal(titles.length, 1, 'should have exactly one title');
        assert.equal(document.title, 'New Title', 'title should be updated');
    });

    it('preserves existing title in append mode when response has no title and clearTitle is not set', async function() {
        let title = document.createElement('title');
        title.textContent = 'Keep Me';
        addToHead(title);

        mockResponse('GET', '/page', headResponse('<meta name="hx-head-test-4070-notitle" content="yes">', '<div>content</div>'));
        let div = createProcessedHTML('<div hx-get="/page" hx-swap="innerHTML">click</div>');
        div.click();
        await afterMerge();

        let added = document.head.querySelector('meta[name="hx-head-test-4070-notitle"]');
        if (added) addedHeadElts.push(added);

        assert.equal(document.head.querySelectorAll('title').length, 1, 'title should be preserved');
        assert.equal(document.title, 'Keep Me', 'title text should be unchanged');
    });

    it('does not add title element to head when ignoreTitle:true is set', async function() {
        let titleCountBefore = document.head.querySelectorAll('title').length;

        mockResponse('GET', '/page', headResponse('<title>New Title</title><meta name="hx-head-test-ignoretitle" content="yes">', '<div>content</div>'));
        let div = createProcessedHTML('<div hx-get="/page" hx-swap="innerHTML ignoreTitle:true">click</div>');
        div.click();
        await afterMerge();

        let added = document.head.querySelector('meta[name="hx-head-test-ignoretitle"]');
        if (added) addedHeadElts.push(added);

        assert.equal(document.head.querySelectorAll('title').length, titleCountBefore, 'hx-head should not add a title element when ignoreTitle is set');
    });

    it('removes title in append mode when response has no title and clearTitle is set', async function() {
        let title = document.createElement('title');
        title.textContent = 'Remove Me';
        addToHead(title);

        let origClearTitle = htmx.config.head?.clearTitle;
        htmx.config.head = htmx.config.head || {};
        htmx.config.head.clearTitle = true;

        mockResponse('GET', '/page', headResponse('<meta name="hx-head-test-4070-cleartitle" content="yes">', '<div>content</div>'));
        let div = createProcessedHTML('<div hx-get="/page" hx-swap="innerHTML">click</div>');
        div.click();
        await afterMerge();

        htmx.config.head.clearTitle = origClearTitle;

        let added = document.head.querySelector('meta[name="hx-head-test-4070-cleartitle"]');
        if (added) addedHeadElts.push(added);

        assert.equal(document.head.querySelectorAll('title').length, 0, 'title should be removed when clearTitle is set and response has no title');
    });

    it('adds stylesheets to head', async function() {
        mockResponse('GET', '/page', headResponse('<link rel="stylesheet" href="/test-styles.css">', '<div>swapped content</div>'));
        
        let div = createProcessedHTML('<div hx-get="/page" hx-swap="innerHTML">click</div>');

        div.click();
        await afterMerge();

        let addedLink = document.head.querySelector('link[href="/test-styles.css"]');
        assert.isNotNull(addedLink, 'stylesheet should be added to head');
        assert.equal(addedLink.rel, 'stylesheet', 'link should have rel="stylesheet"');
        
        if (addedLink) addedHeadElts.push(addedLink);
    });
});

describe('hx-head + hx-history-cache integration', function () {

    let extBackup;

    before(async () => {
        extBackup = backupExtensions();
        clearExtensions();
        htmx.config.extensions = 'history-cache,hx-head';
        htmx.__approvedExt = 'history-cache,hx-head';

        for (const src of ['../src/ext/hx-history-cache.js', '../src/ext/hx-head.js']) {
            let script = document.createElement('script');
            script.src = src;
            await new Promise(resolve => {
                script.onload = resolve;
                document.head.appendChild(script);
            });
        }
    });

    after(() => {
        restoreExtensions(extBackup);
    });

    beforeEach(() => {
        setupTest();
        sessionStorage.clear();
        htmx.config.historyCache = {size: 10, refreshOnMiss: false, disable: false, swapStyle: 'outerSync'};
    });

    afterEach(() => {
        document.getElementById('cached-deferred-script')?.remove();
        delete window.cachedInputValueSeenByDeferred;
        cleanupTest();
        sessionStorage.clear();
    });

    it('runs deferred scripts after cached form state is restored', async function () {
        let cachedPath = location.pathname + location.search;
        createProcessedHTML(`
            <div hx-history-elt><input id="cached-input"></div>
            <button hx-get="/page2" hx-push-url="/page2">go</button>
        `);
        let historyElt = playground().querySelector('[hx-history-elt]');
        historyElt.querySelector('input').value = 'restored value';

        mockResponse('GET', '/page2', '<p>page 2</p>');
        playground().querySelector('button').click();
        await forRequest();

        let index = JSON.parse(sessionStorage.getItem('htmx-history-index') || '[]');
        let htmxId = index[index.length - 1];
        history.replaceState({htmx: true, htmxId}, '', cachedPath);
        historyElt.innerHTML = '<p>current page</p>';

        document.addEventListener('htmx:history:cache:hit', event => {
            let script = `<script id="cached-deferred-script" defer>
                window.cachedInputValueSeenByDeferred = document.getElementById('cached-input').value;
            <\/script>`;
            event.detail.item.head = event.detail.item.head.replace('</head>', script + '</head>');
        }, {once: true});

        await new Promise(resolve => {
            document.addEventListener('htmx:history:cache:after:restore', resolve, {once: true});
            htmx.__restoreHistory(null, cachedPath);
        });

        assert.equal(
            window.cachedInputValueSeenByDeferred,
            'restored value',
            'deferred cached head script must see restored input value'
        );
    });
});
