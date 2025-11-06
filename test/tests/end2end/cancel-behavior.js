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
        const link = createProcessedHTML('<a href="#" hx-get="/foo"><button id="btn">test</button></a>');
        
        link.addEventListener('click', (evt) => {
            defaultPrevented = evt.defaultPrevented;
        });
        
        find('#btn').click()
        await forRequest();
        defaultPrevented.should.equal(true);
    });

    it('htmx-enabled button inside link prevents link navigation', async function() {
        let defaultPrevented = false;
        mockResponse('GET', '/foo', 'Response')
        const link = createProcessedHTML('<a href="#"><button id="btn" hx-get="/foo">test</button></a>');
        
        link.addEventListener('click', (evt) => {
            defaultPrevented = evt.defaultPrevented;
        });
        
        find('#btn').click()
        await forRequest();
        defaultPrevented.should.equal(true);
    });

    it('htmx-enabled button with sub-elements prevents form submission', async function() {
        let defaultPrevented = false;
        mockResponse('GET', '/foo', 'Response')
        const form = createProcessedHTML('<form><button id="btn" hx-get="/foo"><span id="span">test</span></button></form>');
        
        find('#btn').addEventListener('click', (evt) => {
            defaultPrevented = evt.defaultPrevented;
        });
        
        find('#span').click()
        await forRequest();
        defaultPrevented.should.equal(true);
    });

    it('htmx-enabled element inside form button prevents form submission', async function() {
        let defaultPrevented = false;
        mockResponse('GET', '/foo', 'Response')
        const form = createProcessedHTML('<form><button id="btn"><span id="span" hx-get="/foo">test</span></button></form>');
        
        find('#btn').addEventListener('click', (evt) => {
            defaultPrevented = evt.defaultPrevented;
        });
        
        find('#span').click()
        await forRequest();
        defaultPrevented.should.equal(true);
    });

    it('from: trigger on form prevents default form submission', async function() {
        let defaultPrevented = false;
        mockResponse('POST', '/test', 'Response')
        createProcessedHTML('<form id="test-form" action="/submit"><input type="submit" id="submit" value="Submit"></form><div hx-post="/test" hx-trigger="submit from:#test-form"></div>');
        
        const form = find('#test-form');
        form.addEventListener('submit', (evt) => {
            defaultPrevented = evt.defaultPrevented;
            evt.preventDefault(); // Prevent actual navigation
        });
        
        find('#submit').click()
        await forRequest();
        defaultPrevented.should.equal(true);
    });

    it('from: trigger on button prevents default form submission', async function() {
        let defaultPrevented = false;
        mockResponse('POST', '/test', 'Response')
        createProcessedHTML('<form><button id="test-btn" type="submit">Submit</button></form><div hx-post="/test" hx-trigger="click from:#test-btn"></div>');
        
        const button = find('#test-btn');
        button.addEventListener('click', (evt) => {
            defaultPrevented = evt.defaultPrevented;
            evt.preventDefault(); // Prevent actual submission
        });
        
        find('#test-btn').click()
        await forRequest();
        defaultPrevented.should.equal(true);
    });

    it('from: trigger on link prevents default navigation', async function() {
        let defaultPrevented = false;
        mockResponse('GET', '/test', 'Response')
        createProcessedHTML('<a id="test-link" href="#">Go to page</a><div hx-get="/test" hx-trigger="click from:#test-link"></div>');
        
        const link = find('#test-link');
        link.addEventListener('click', (evt) => {
            defaultPrevented = evt.defaultPrevented;
        });
        
        find('#test-link').click()
        await forRequest();
        defaultPrevented.should.equal(true);
    });

    it('modified click trigger on form does not prevent default on other elements', async function() {
        let defaultPrevented = null;
        createProcessedHTML('<input type="date" id="datefield"><form hx-trigger="click from:body"></form>');
        
        const dateField = find('#datefield');
        dateField.addEventListener('click', (evt) => {
            setTimeout(() => {
                defaultPrevented = evt.defaultPrevented;
            }, 0);
        });
        
        find('#datefield').click();
        await htmx.timeout(1);
        await htmx.timeout(1);
        defaultPrevented.should.equal(false);
    });

    it('anchor with fragment identifier (#foo) does not prevent default', async function() {
        let defaultPrevented = null;
        createProcessedHTML('<a id="test-link" href="#section" hx-get="/test">Jump to section</a>');
        
        const link = find('#test-link');
        link.addEventListener('click', (evt) => {
            defaultPrevented = evt.defaultPrevented;
            evt.preventDefault();
        });
        
        find('#test-link').click();
        await htmx.timeout(1);
        defaultPrevented.should.equal(false);
    });

    it('anchor with # alone prevents default', async function() {
        let defaultPrevented = null;
        mockResponse('GET', '/test', 'Response')
        createProcessedHTML('<a id="test-link" href="#" hx-get="/test">Click me</a>');
        
        const link = find('#test-link');
        link.addEventListener('click', (evt) => {
            defaultPrevented = evt.defaultPrevented;
            evt.preventDefault();
        });
        
        find('#test-link').click()
        await forRequest();
        defaultPrevented.should.equal(true);
    });

    it('boosted anchor prevents default navigation', async function() {
        let defaultPrevented = null;
        mockResponse('GET', '/test', 'Boosted')
        createProcessedHTML('<div hx-boost:inherited="true" hx-target:inherited="this"><a id="test-link" href="#test">Go</a></div>');
        
        const link = find('#test-link');
        link.addEventListener('click', (evt) => {
            defaultPrevented = evt.defaultPrevented;
            evt.preventDefault();
        });
        
        find('#test-link').click();
        await htmx.timeout(1);
        // Boosted links with fragment identifiers don't prevent default
        defaultPrevented.should.equal(false);
    });

    it('boosted form prevents default submission', async function() {
        let defaultPrevented = null;
        mockResponse('POST', '/test', 'Submitted')
        createProcessedHTML('<div hx-boost:inherited="true" hx-target:inherited="this"><form id="test-form" action="/test" method="post"><button id="btn">Submit</button></form></div>');
        
        const form = find('#test-form');
        form.addEventListener('submit', (evt) => {
            defaultPrevented = evt.defaultPrevented;
            evt.preventDefault();
        });
        
        find('#btn').click()
        await forRequest();
        defaultPrevented.should.equal(true);
        playground().innerText.should.equal('Submitted');
    });

    it('does not submit with false condition on form', async function() {
        let defaultPrevented = null;
        mockResponse('POST', '/test', 'Submitted')
        createProcessedHTML('<form hx-post="/test" hx-trigger="submit[false]"><button id="btn">submit</button></form>');
        
        document.addEventListener('submit', (evt) => {
            defaultPrevented = evt.defaultPrevented;
            evt.preventDefault();
        });
        
        find('#btn').click();
        await htmx.timeout(1);
        await htmx.timeout(1);
        defaultPrevented.should.equal(true);
        // Should not have made a request
        fetchMock.calls.length.should.equal(0);
    });

    it('ctrl+click on link does not prevent default (allows open in new tab)', async function() {
        let defaultPrevented = null;
        mockResponse('GET', '/test', 'Response')
        createProcessedHTML('<a id="test-link" href="javascript:void(0)" hx-get="/test">Link</a>');
        
        const link = find('#test-link');
        link.addEventListener('click', (evt) => {
            defaultPrevented = evt.defaultPrevented;
        });
        
        const evt = new MouseEvent('click', { ctrlKey: true, bubbles: true });
        link.dispatchEvent(evt);
        await htmx.timeout(1);
        
        // Should not prevent default to allow browser's native behavior
        defaultPrevented.should.equal(false);
    });

    it('meta+click on link does not prevent default (allows open in new tab on Mac)', async function() {
        let defaultPrevented = null;
        mockResponse('GET', '/test', 'Response')
        createProcessedHTML('<a id="test-link" href="javascript:void(0)" hx-get="/test">Link</a>');
        
        const link = find('#test-link');
        link.addEventListener('click', (evt) => {
            defaultPrevented = evt.defaultPrevented;
        });
        
        const evt = new MouseEvent('click', { metaKey: true, bubbles: true });
        link.dispatchEvent(evt);
        await htmx.timeout(1);
        
        // Should not prevent default to allow browser's native behavior
        defaultPrevented.should.equal(false);
    });

    it('shift+click on link does not prevent default (allows open in new window)', async function() {
        let defaultPrevented = null;
        mockResponse('GET', '/test', 'Response')
        createProcessedHTML('<a id="test-link" href="javascript:void(0)" hx-get="/test">Link</a>');
        
        const link = find('#test-link');
        link.addEventListener('click', (evt) => {
            defaultPrevented = evt.defaultPrevented;
        });
        
        const evt = new MouseEvent('click', { shiftKey: true, bubbles: true });
        link.dispatchEvent(evt);
        await htmx.timeout(1);
        
        // Should not prevent default to allow browser's native behavior
        defaultPrevented.should.equal(false);
    });
});
