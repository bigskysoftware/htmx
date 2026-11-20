describe('hx-targets extension', function() {

    let extBackup;
    let configExtensions;

    before(async () => {
        extBackup = backupExtensions();
        configExtensions = htmx.config.extensions;
        clearExtensions();

        htmx.config.extensions = 'hx-targets';
        htmx.__approvedExt = 'hx-targets';

        let script = document.createElement('script');
        script.src = '../src/ext/hx-targets.js';
        await new Promise(resolve => {
            script.onload = resolve;
            document.head.appendChild(script);
        });

        if (!htmx.__registeredExt.has('hx-targets')) {
            throw new Error('hx-targets extension failed to register - check approval');
        }
    });

    after(() => {
        restoreExtensions(extBackup);
        htmx.config.extensions = configExtensions;
    });

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    it('swaps into every element matching a CSS selector outside the source element', async function() {
        mockResponse('GET', '/test', 'Updated')
        createProcessedHTML('<button id="btn" hx-get="/test" hx-targets=".card">Click</button><div class="card">A</div><div class="card">B</div>');
        find('#btn').click()
        await forRequest()
        let cards = playground().querySelectorAll('.card')
        assert.equal(cards.length, 2)
        assert.equal(cards[0].textContent, 'Updated')
        assert.equal(cards[1].textContent, 'Updated')
        assert.equal(find('#btn').textContent, 'Click')
    })

    it('supports extended selectors', async function() {
        mockResponse('GET', '/test', 'Updated')
        createProcessedHTML('<div class="card"><button id="btn" hx-get="/test" hx-targets="closest .card">Click</button></div><div class="card">B</div>');
        find('#btn').click()
        await forRequest()
        let cards = playground().querySelectorAll('.card')
        assert.equal(cards[0].textContent, 'Updated')
        assert.equal(cards[1].textContent, 'B')
    })
});
