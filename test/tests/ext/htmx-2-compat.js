describe('htmx-2-compat extension', function() {

    let extBackup;
    let implicitInheritance;
    let noSwap;
    let cleanups = [];

    function record(eventName) {
        let ids = [];
        let listener = evt => ids.push(evt.target.id);
        document.addEventListener(eventName, listener);
        cleanups.push(() => document.removeEventListener(eventName, listener));
        return ids;
    }

    before(async () => {
        extBackup = backupExtensions();
        clearExtensions();
        implicitInheritance = htmx.config.implicitInheritance;
        noSwap = htmx.config.noSwap;
        htmx.config.noSwap = [...noSwap];

        htmx.config.extensions = 'compat';

        let script = document.createElement('script');
        script.src = '../src/ext/htmx-2-compat.js';
        await new Promise(resolve => {
            script.onload = resolve;
            document.head.appendChild(script);
        });
    });

    after(() => {
        restoreExtensions(extBackup);
        htmx.config.implicitInheritance = implicitInheritance;
        htmx.config.noSwap = noSwap;
    });

    beforeEach(function() {
        setupTest(this.currentTest);
    });

    afterEach(function() {
        cleanupTest();
        cleanups.forEach(cleanup => cleanup());
        cleanups = [];
    });

    it('fires htmx:load for swapped content without hx-* attributes', async function () {
        mockResponse('GET', '/test', '<p id="plain">New</p>');
        let btn = createProcessedHTML('<button hx-get="/test" hx-target="#out">Go</button><div id="out"></div>');
        let ids = record('htmx:load');
        btn.click();
        await forRequest();
        assert.include(ids, 'plain');
    });

    it('fires htmx:afterOnLoad after a request, not at init', async function () {
        mockResponse('GET', '/test', 'New');
        let ids = record('htmx:afterOnLoad');
        let btn = createProcessedHTML('<button id="btn" hx-get="/test" hx-swap="none">Go</button>');
        assert.deepEqual(ids, []);
        btn.click();
        await forRequest();
        assert.deepEqual(ids, ['btn']);
    });

    it('fires htmx:afterProcessNode at init', function () {
        let ids = record('htmx:afterProcessNode');
        createProcessedHTML('<button id="btn" hx-get="/test">Go</button>');
        assert.include(ids, 'btn');
    });
});
