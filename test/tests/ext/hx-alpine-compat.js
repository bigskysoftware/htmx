describe('hx-alpine-compat extension', function() {

    let extBackup;

    before(async () => {
        extBackup = backupExtensions();
        clearExtensions();
        
        // Only load Alpine if not already loaded
        if (!window.Alpine) {
            let alpine = document.createElement('script');
            alpine.defer = true;
            alpine.src = 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.js';
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
        const div = createProcessedHTML('<div x-data="{ show: false }"><div id="target" hx-get="/test" hx-swap="innerHTML" hx-ext="alpine-compat"><div id="content" x-show="show" class="inactive">Content</div></div></div>');
        
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
        const div = createProcessedHTML('<div x-data="{ activeTab: \'tab1\' }"><div id="target" hx-get="/test" hx-swap="innerHTML" hx-ext="alpine-compat"><div id="tab1" :class="{ \'active\': activeTab === \'tab1\' }">Tab 1</div></div></div>');
        
        await htmx.timeout(50); // Let Alpine initialize and add "active" class
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20); // Let Alpine reactivate after attributes are restored
        
        // Alpine should have re-applied "active" class after morph
        const tab = div.querySelector('#tab1');
        assert.isTrue(tab.classList.contains('active'));
    })

    it('preserves Alpine x-show with outerHTML swap', async function () {
        mockResponse('GET', '/test', '<div id="content" x-show="show">New Content</div>');
        const div = createProcessedHTML('<div x-data="{ show: false }"><div id="content" hx-get="/test" hx-swap="outerHTML" hx-ext="alpine-compat" x-show="show">Old Content</div></div>');
        
        await htmx.timeout(50);
        
        const content = div.querySelector('#content');
        content.click();
        await forRequest();
        await htmx.timeout(20);
        
        const newContent = div.querySelector('#content');
        assert.equal(newContent.style.display, 'none');
        assert.equal(newContent.textContent, 'New Content');
    })

    it('preserves Alpine state with innerMorph swap', async function () {
        mockResponse('GET', '/test', '<div id="item" x-show="visible">Morphed</div>');
        const div = createProcessedHTML('<div x-data="{ visible: false }"><div id="target" hx-get="/test" hx-swap="innerMorph" hx-ext="alpine-compat"><div id="item" x-show="visible">Original</div></div></div>');
        
        await htmx.timeout(50);
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20);
        
        const item = div.querySelector('#item');
        assert.equal(item.style.display, 'none');
        assert.equal(item.textContent, 'Morphed');
    })

    it('preserves Alpine state with outerMorph swap', async function () {
        mockResponse('GET', '/test', '<div id="target" hx-get="/test" hx-swap="outerMorph" hx-ext="alpine-compat"><div x-show="visible">Morphed</div></div>');
        const div = createProcessedHTML('<div x-data="{ visible: false }"><div id="target" hx-get="/test" hx-swap="outerMorph" hx-ext="alpine-compat"><div x-show="visible">Original</div></div></div>');
        
        await htmx.timeout(50);
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20);
        
        const newTarget = div.querySelector('#target');
        const item = newTarget.querySelector('[x-show]');
        assert.equal(item.style.display, 'none');
        assert.equal(item.textContent, 'Morphed');
    })

    it('preserves Alpine state with beforebegin swap', async function () {
        mockResponse('GET', '/test', '<div x-show="visible">Before</div>');
        const div = createProcessedHTML('<div x-data="{ visible: false }"><div id="target" hx-get="/test" hx-swap="beforebegin" hx-ext="alpine-compat">Target</div></div>');
        
        await htmx.timeout(50);
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20);
        
        const inserted = target.previousElementSibling;
        assert.equal(inserted.style.display, 'none');
        assert.equal(inserted.textContent, 'Before');
    })

    it('preserves Alpine state with afterbegin swap', async function () {
        mockResponse('GET', '/test', '<div x-show="visible">First Child</div>');
        const div = createProcessedHTML('<div x-data="{ visible: false }"><div id="target" hx-get="/test" hx-swap="afterbegin" hx-ext="alpine-compat"><span>Existing</span></div></div>');
        
        await htmx.timeout(50);
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20);
        
        const inserted = target.firstElementChild;
        assert.equal(inserted.style.display, 'none');
        assert.equal(inserted.textContent, 'First Child');
    })

    it('preserves Alpine state with beforeend swap', async function () {
        mockResponse('GET', '/test', '<div x-show="visible">Last Child</div>');
        const div = createProcessedHTML('<div x-data="{ visible: false }"><div id="target" hx-get="/test" hx-swap="beforeend" hx-ext="alpine-compat"><span>Existing</span></div></div>');
        
        await htmx.timeout(50);
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20);
        
        const inserted = target.lastElementChild;
        assert.equal(inserted.style.display, 'none');
        assert.equal(inserted.textContent, 'Last Child');
    })

    it('preserves Alpine state with afterend swap', async function () {
        mockResponse('GET', '/test', '<div x-show="visible">After</div>');
        const div = createProcessedHTML('<div x-data="{ visible: false }"><div id="target" hx-get="/test" hx-swap="afterend" hx-ext="alpine-compat">Target</div></div>');
        
        await htmx.timeout(50);
        
        const target = div.querySelector('#target');
        target.click();
        await forRequest();
        await htmx.timeout(20);
        
        const inserted = target.nextElementSibling;
        assert.equal(inserted.style.display, 'none');
        assert.equal(inserted.textContent, 'After');
    })

})
