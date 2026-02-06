describe('hx-alpine-compat extension', function() {

    let extBackup;

    before(async () => {
        extBackup = backupExtensions();
        clearExtensions();
        
        // Only load Alpine if not already loaded
        if (!window.Alpine) {
            let alpine = document.createElement('script');
            alpine.defer = true;
            alpine.src = 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js';
            await new Promise(resolve => {
                alpine.onload = resolve;
                document.head.appendChild(alpine);
            });
        }
        
        let script = document.createElement('script');
        script.src = '../src/ext/hx-alpine-compat.js';
        await new Promise(resolve => {
            script.onload = resolve;
            document.head.appendChild(script);
        });
    })

    after(() => {
        restoreExtensions(extBackup);
    })

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })

    it('preserves Alpine x-show style attribute during Swap and Settle', async function () {
        mockResponse('GET', '/test', '<div id="content" x-show="show" class="inactive">Content</div>');
        const div = createProcessedHTML('<div x-data="{ show: false }"><div id="target" hx-get="/test" hx-swap="innerHTML"><div id="content" x-show="show" class="inactive">Content</div></div></div>');
        
        await htmx.timeout(50); // Let Alpine initialize and add style="display: none;"
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20); // Let Alpine reactivate after attributes are restored
        
        // Alpine should have re-applied style="display: none;" after morph
        const content = div.querySelector('#content');
        assert.equal(content.style.display, 'none');
    })

    it('preserves Alpine class binding during Swap and Settle', async function () {
        mockResponse('GET', '/test', '<div id="tab1" :class="{ \'active\': activeTab === \'tab1\' }">Tab 1</div>');
        const div = createProcessedHTML('<div x-data="{ activeTab: \'tab1\' }"><div id="target" hx-get="/test" hx-swap="innerHTML"><div id="tab1" :class="{ \'active\': activeTab === \'tab1\' }">Tab 1</div></div></div>');
        
        await htmx.timeout(50); // Let Alpine initialize and add "active" class
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20); // Let Alpine reactivate after attributes are restored
        
        // Alpine should have re-applied "active" class after morph
        const tab = div.querySelector('#tab1');
        assert.isTrue(tab.classList.contains('active'));
    })

})
