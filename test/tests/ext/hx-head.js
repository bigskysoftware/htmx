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
        await waitForEvent('htmx:after:head:merge', 500)
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

    it.skip('removes head elements not in new head under merge strategy', async function() {
        let stale = document.createElement('meta');
        stale.setAttribute('name', 'hx-head-test-stale');
        stale.setAttribute('content', 'remove-me');
        addToHead(stale);

        // use outerHTML swap to trigger merge strategy
        mockResponse('GET', '/page', headResponse('', '<div>swapped</div>'));
        let div = createProcessedHTML('<div hx-get="/page" hx-swap="outerHTML">click</div>');

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

    it('fires htmx:before:head:merge and htmx:after:head:merge events', async function() {
        let beforeFired = false;
        let afterFired = false;

        let onBefore = () => { beforeFired = true; };
        let onAfter = () => { afterFired = true; };
        document.body.addEventListener('htmx:before:head:merge', onBefore);
        document.body.addEventListener('htmx:after:head:merge', onAfter);

        mockResponse('GET', '/page', headResponse('<meta name="hx-head-test-evt" content="val">', '<div>content</div>'));
        let div = createProcessedHTML('<div hx-get="/page" hx-swap="innerHTML">click</div>');

        div.click();
        await afterMerge();

        document.body.removeEventListener('htmx:before:head:merge', onBefore);
        document.body.removeEventListener('htmx:after:head:merge', onAfter);

        let added = document.head.querySelector('meta[name="hx-head-test-evt"]');
        if (added) addedHeadElts.push(added);

        assert.isTrue(beforeFired, 'htmx:before:head:merge should fire');
        assert.isTrue(afterFired, 'htmx:after:head:merge should fire');
    });

    it('htmx:before:head:merge cancellation prevents merge', async function() {
        let onBefore = (e) => { e.preventDefault(); };
        document.body.addEventListener('htmx:before:head:merge', onBefore, {once: true});

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
        document.body.addEventListener('htmx:after:head:merge', onMerge);
        document.body.addEventListener('htmx:after:swap', onSwap);

        mockResponse('GET', '/page', headResponse('<meta name="hx-head-test-timing" content="val">', '<div>swapped</div>'));
        let div = createProcessedHTML('<div hx-get="/page" hx-swap="innerHTML">click</div>');

        div.click();
        await afterMerge();

        document.body.removeEventListener('htmx:after:head:merge', onMerge);
        document.body.removeEventListener('htmx:after:swap', onSwap);

        let added = document.head.querySelector('meta[name="hx-head-test-timing"]');
        if (added) addedHeadElts.push(added);

        assert.isNotNull(headMergeTime, 'head merge should have fired');
        assert.isNotNull(swapTime, 'swap should have fired');
        assert.isAtMost(headMergeTime, swapTime, 'head merge must complete before swap');
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
