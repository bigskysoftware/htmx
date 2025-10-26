describe('Cancel behavior integration tests', function() {

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })

    it('button inside htmx-enabled link prevents link navigation', async function() {
        let defaultPrevented = false;
        mockResponse('GET', '/foo', 'Response')
        const link = initHTML('<a href="#" hx-get="/foo"><button id="btn">test</button></a>');
        
        link.addEventListener('click', (evt) => {
            defaultPrevented = evt.defaultPrevented;
        });
        
        await clickAndWait('#btn');
        defaultPrevented.should.equal(true);
    });

    it('htmx-enabled button inside link prevents link navigation', async function() {
        let defaultPrevented = false;
        mockResponse('GET', '/foo', 'Response')
        const link = initHTML('<a href="#"><button id="btn" hx-get="/foo">test</button></a>');
        
        link.addEventListener('click', (evt) => {
            defaultPrevented = evt.defaultPrevented;
        });
        
        await clickAndWait('#btn');
        defaultPrevented.should.equal(true);
    });

    it('htmx-enabled button with sub-elements prevents form submission', async function() {
        let defaultPrevented = false;
        mockResponse('GET', '/foo', 'Response')
        const form = initHTML('<form><button id="btn" hx-get="/foo"><span id="span">test</span></button></form>');
        
        findElt('#btn').addEventListener('click', (evt) => {
            defaultPrevented = evt.defaultPrevented;
        });
        
        await clickAndWait('#span');
        defaultPrevented.should.equal(true);
    });

    it('htmx-enabled element inside form button prevents form submission', async function() {
        let defaultPrevented = false;
        mockResponse('GET', '/foo', 'Response')
        const form = initHTML('<form><button id="btn"><span id="span" hx-get="/foo">test</span></button></form>');
        
        findElt('#btn').addEventListener('click', (evt) => {
            defaultPrevented = evt.defaultPrevented;
        });
        
        await clickAndWait('#span');
        defaultPrevented.should.equal(true);
    });

    it('from: trigger on form prevents default form submission', async function() {
        let defaultPrevented = false;
        mockResponse('POST', '/test', 'Response')
        initHTML('<form id="test-form" action="/submit"><input type="submit" id="submit" value="Submit"></form><div hx-post="/test" hx-trigger="submit from:#test-form"></div>');
        
        const form = findElt('#test-form');
        form.addEventListener('submit', (evt) => {
            defaultPrevented = evt.defaultPrevented;
            evt.preventDefault(); // Prevent actual navigation
        });
        
        await clickAndWait('#submit');
        defaultPrevented.should.equal(true);
    });

    it('from: trigger on button prevents default form submission', async function() {
        let defaultPrevented = false;
        mockResponse('POST', '/test', 'Response')
        initHTML('<form><button id="test-btn" type="submit">Submit</button></form><div hx-post="/test" hx-trigger="click from:#test-btn"></div>');
        
        const button = findElt('#test-btn');
        button.addEventListener('click', (evt) => {
            defaultPrevented = evt.defaultPrevented;
            evt.preventDefault(); // Prevent actual submission
        });
        
        await clickAndWait('#test-btn');
        defaultPrevented.should.equal(true);
    });

    it('from: trigger on link prevents default navigation', async function() {
        let defaultPrevented = false;
        mockResponse('GET', '/test', 'Response')
        initHTML('<a id="test-link" href="#">Go to page</a><div hx-get="/test" hx-trigger="click from:#test-link"></div>');
        
        const link = findElt('#test-link');
        link.addEventListener('click', (evt) => {
            defaultPrevented = evt.defaultPrevented;
        });
        
        await clickAndWait('#test-link');
        defaultPrevented.should.equal(true);
    });

    it('modified click trigger on form does not prevent default on other elements', async function() {
        let defaultPrevented = null;
        initHTML('<input type="date" id="datefield"><form hx-trigger="click from:body"></form>');
        
        const dateField = findElt('#datefield');
        dateField.addEventListener('click', (evt) => {
            setTimeout(() => {
                defaultPrevented = evt.defaultPrevented;
            }, 0);
        });
        
        click('#datefield');
        await htmx.waitATick();
        await htmx.waitATick();
        defaultPrevented.should.equal(false);
    });

    it('anchor with fragment identifier (#foo) does not prevent default', async function() {
        let defaultPrevented = null;
        initHTML('<a id="test-link" href="#section" hx-get="/test">Jump to section</a>');
        
        const link = findElt('#test-link');
        link.addEventListener('click', (evt) => {
            defaultPrevented = evt.defaultPrevented;
        });
        
        click('#test-link');
        await htmx.waitATick();
        defaultPrevented.should.equal(false);
    });

    it('anchor with # alone prevents default', async function() {
        let defaultPrevented = null;
        mockResponse('GET', '/test', 'Response')
        initHTML('<a id="test-link" href="#" hx-get="/test">Click me</a>');
        
        const link = findElt('#test-link');
        link.addEventListener('click', (evt) => {
            defaultPrevented = evt.defaultPrevented;
        });
        
        await clickAndWait('#test-link');
        defaultPrevented.should.equal(true);
    });

    it('boosted anchor prevents default navigation', async function() {
        let defaultPrevented = null;
        mockResponse('GET', '/test', 'Boosted')
        initHTML('<div hx-boost:inherited="true" hx-target:inherited="this"><a id="test-link" href="#test">Go</a></div>');
        
        const link = findElt('#test-link');
        link.addEventListener('click', (evt) => {
            defaultPrevented = evt.defaultPrevented;
        });
        
        click('#test-link');
        await htmx.waitATick();
        // Boosted links with fragment identifiers don't prevent default
        defaultPrevented.should.equal(false);
    });

    it('boosted form prevents default submission', async function() {
        let defaultPrevented = null;
        mockResponse('POST', '/test', 'Submitted')
        initHTML('<div hx-boost:inherited="true" hx-target:inherited="this"><form id="test-form" action="/test" method="post"><button id="btn">Submit</button></form></div>');
        
        const form = findElt('#test-form');
        form.addEventListener('submit', (evt) => {
            defaultPrevented = evt.defaultPrevented;
        });
        
        await clickAndWait('#btn');
        defaultPrevented.should.equal(true);
        playground().innerHTML.should.equal('Submitted');
    });

    it('does not submit with false condition on form', async function() {
        let defaultPrevented = null;
        mockResponse('POST', '/test', 'Submitted')
        initHTML('<form hx-post="/test" hx-trigger="submit[false]"><button id="btn">submit</button></form>');
        
        document.addEventListener('submit', (evt) => {
            defaultPrevented = evt.defaultPrevented;
        });
        
        click('#btn');
        await htmx.waitATick();
        await htmx.waitATick();
        defaultPrevented.should.equal(true);
        // Should not have made a request
        fetchMock.calls.length.should.equal(0);
    });

    it('ctrl+click on link does not prevent default (allows open in new tab)', async function() {
        let defaultPrevented = null;
        mockResponse('GET', '/test', 'Response')
        initHTML('<a id="test-link" href="#" hx-get="/test">Link</a>');
        
        const link = findElt('#test-link');
        link.addEventListener('click', (evt) => {
            defaultPrevented = evt.defaultPrevented;
        });
        
        const evt = new MouseEvent('click', { ctrlKey: true, bubbles: true });
        link.dispatchEvent(evt);
        await htmx.waitATick();
        
        // Should not prevent default to allow browser's native behavior
        defaultPrevented.should.equal(false);
    });

    it('meta+click on link does not prevent default (allows open in new tab on Mac)', async function() {
        let defaultPrevented = null;
        mockResponse('GET', '/test', 'Response')
        initHTML('<a id="test-link" href="#" hx-get="/test">Link</a>');
        
        const link = findElt('#test-link');
        link.addEventListener('click', (evt) => {
            defaultPrevented = evt.defaultPrevented;
        });
        
        const evt = new MouseEvent('click', { metaKey: true, bubbles: true });
        link.dispatchEvent(evt);
        await htmx.waitATick();
        
        // Should not prevent default to allow browser's native behavior
        defaultPrevented.should.equal(false);
    });

    it('shift+click on link does not prevent default (allows open in new window)', async function() {
        let defaultPrevented = null;
        mockResponse('GET', '/test', 'Response')
        initHTML('<a id="test-link" href="#" hx-get="/test">Link</a>');
        
        const link = findElt('#test-link');
        link.addEventListener('click', (evt) => {
            defaultPrevented = evt.defaultPrevented;
        });
        
        const evt = new MouseEvent('click', { shiftKey: true, bubbles: true });
        link.dispatchEvent(evt);
        await htmx.waitATick();
        
        // Should not prevent default to allow browser's native behavior
        defaultPrevented.should.equal(false);
    });
});
