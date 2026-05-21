describe('hx-push-url and hx-replace-url attributes', function() {
    
    beforeEach(() => {
        setupTest(this.currentTest)
        // Clear any existing history state
        if (history.state && history.state.htmx) {
            history.replaceState(null, '', location.pathname);
        }
    })
    
    afterEach(() => {
        cleanupTest()
    })
    
    it('should push URL to history with hx-push-url="true"', async function() {
        mockResponse('GET', '/test', 'Test Response');
        
        let historyEventFired = false;
        let eventPath = null;
        
        // Listen for the history event
        const handler = (event) => {
            historyEventFired = true;
            eventPath = event.detail.path;
        };
        
        document.addEventListener('htmx:after:history:push', handler);
        
        try {
            let btn = createProcessedHTML('<button hx-get="/test" hx-push-url="true">Click me</button>');
            btn.click()
        await forRequest();
            
            playground().textContent.should.equal('Test Response');
            historyEventFired.should.equal(true);
            eventPath.should.equal('/test');
        } finally {
            document.removeEventListener('htmx:after:history:push', handler);
        }
    });
    
    it('should replace URL in history with hx-replace-url="true"', async function() {
        mockResponse('GET', '/test', 'Test Response');
        
        let historyEventFired = false;
        let eventPath = null;
        
        // Listen for the history event
        const handler = (event) => {
            historyEventFired = true;
            eventPath = event.detail.path;
        };
        
        document.addEventListener('htmx:after:history:replace', handler);
        
        try {
            let btn = createProcessedHTML('<button hx-get="/test" hx-replace-url="true">Click me</button>');
            btn.click()
        await forRequest();
            
            playground().textContent.should.equal('Test Response');
            historyEventFired.should.equal(true);
            eventPath.should.equal('/test');
        } finally {
            document.removeEventListener('htmx:after:history:replace', handler);
        }
    });
    
    it('should handle custom URL with hx-push-url="/custom"', async function() {
        mockResponse('GET', '/test', 'Test Response');
        
        let historyEventFired = false;
        let eventPath = null;
        
        // Listen for the history event
        const handler = (event) => {
            historyEventFired = true;
            eventPath = event.detail.path;
        };
        
        document.addEventListener('htmx:after:history:push', handler);
        
        try {
            let btn = createProcessedHTML('<button hx-get="/test" hx-push-url="/custom">Click me</button>');
            btn.click()
        await forRequest();
            
            playground().textContent.should.equal('Test Response');
            historyEventFired.should.equal(true);
            eventPath.should.equal('/custom');
        } finally {
            document.removeEventListener('htmx:after:history:push', handler);
        }
    });
    
    it('should not push to history when hx-push-url="false"', async function() {
        mockResponse('GET', '/test', 'Test Response');
        
        let historyEventFired = false;
        
        // Listen for the history event (should not fire)
        const handler = (event) => {
            historyEventFired = true;
        };
        
        document.addEventListener('htmx:after:history:push', handler);
        
        try {
            let btn = createProcessedHTML('<button hx-get="/test" hx-push-url="false">Click me</button>');
            btn.click()
        await forRequest();
            
            playground().textContent.should.equal('Test Response');
            historyEventFired.should.equal(false);
        } finally {
            document.removeEventListener('htmx:after:history:push', handler);
        }
    });
    
    it('should fire htmx:before:history:update event', async function() {
        mockResponse('GET', '/test', 'Test Response');
        
        let beforeEventFired = false;
        let eventDetails = null;
        
        // Listen for the before history update event
        const handler = (event) => {
            beforeEventFired = true;
            eventDetails = event.detail;
        };
        
        document.addEventListener('htmx:before:history:update', handler);
        
        try {
            let btn = createProcessedHTML('<button hx-get="/test" hx-push-url="true">Click me</button>');
            btn.click()
        await forRequest();
            
            playground().textContent.should.equal('Test Response');
            beforeEventFired.should.equal(true);
            eventDetails.history.type.should.equal('push');
            eventDetails.history.path.should.equal('/test');
        } finally {
            document.removeEventListener('htmx:before:history:update', handler);
        }
    });
    
    // this test replaces body innerHTML, so we skip it to avoid breaking other tests, but it can be run manually to verify the behavior
    it.skip('should use innerHTML swap when restoring history even if default swap is none', async function() {
        let originalSwap = htmx.config.defaultSwap;
        htmx.config.defaultSwap = 'none';
        
        try {
            mockResponse('GET', '/restore-test', '<div id="restored">Restored Content</div>');
            
            htmx.__restoreHistory('/restore-test');
            await forRequest();
            
            document.body.innerHTML.should.include('Restored Content');
        } finally {
            htmx.config.defaultSwap = originalSwap;
        }
    });
});


describe('outerSync swap into document.body', function() {
    let savedAttrs;
    let savedChildren;

    beforeEach(() => {
        setupTest(this.currentTest);
        savedAttrs = [...document.body.attributes].map(a => ({ name: a.name, value: a.value }));
        savedChildren = [...document.body.childNodes];
    });

    afterEach(() => {
        for (let a of [...document.body.attributes]) document.body.removeAttribute(a.name);
        for (let a of savedAttrs) document.body.setAttribute(a.name, a.value);
        document.body.replaceChildren(...savedChildren);
        cleanupTest();
    });

    it('syncs body attributes from response and replaces children', async function() {
        document.body.setAttribute('data-original', 'yes');
        await htmx.swap({
            target: document.body,
            swap: 'outerSync',
            text: '<html><body class="injected" data-test-x="1"><div id="bodyswap-marker"></div></body></html>',
            sourceElement: document.body
        });
        document.body.classList.contains('injected').should.equal(true);
        document.body.getAttribute('data-test-x').should.equal('1');
        (document.body.getAttribute('data-original') === null).should.equal(true);
        document.getElementById('bodyswap-marker').should.not.equal(null);
    });

    it('outerHTML on body auto-upgrades to outerSync and syncs attributes', async function() {
        document.body.setAttribute('data-original', 'yes');
        await htmx.swap({
            target: document.body,
            swap: 'outerHTML',
            text: '<html><body class="injected" data-test-x="1"><div id="bodyswap-marker"></div></body></html>',
            sourceElement: document.body
        });
        document.body.classList.contains('injected').should.equal(true);
        document.body.getAttribute('data-test-x').should.equal('1');
        (document.body.getAttribute('data-original') === null).should.equal(true);
        document.getElementById('bodyswap-marker').should.not.equal(null);
    });
});

describe('full-page response strip auto-upgrade', function() {

    beforeEach(() => { setupTest(this.currentTest); });
    afterEach(() => { cleanupTest(); });

    it('innerHTML on full-page response strips body wrapper', async function() {
        playground().innerHTML = '<div id="target">old</div>';
        await htmx.swap({
            target: '#target',
            swap: 'innerHTML',
            text: '<html><body><span id="new-child">new</span></body></html>',
            sourceElement: playground()
        });
        let target = playground().querySelector('#target');
        target.should.not.equal(null);
        (target.querySelector('body') === null).should.equal(true);
        target.querySelector('#new-child').should.not.equal(null);
        target.querySelector('#new-child').textContent.should.equal('new');
    });

    it('innerMorph on full-page response strips body wrapper', async function() {
        playground().innerHTML = '<div id="target"><span id="orig">old</span></div>';
        await htmx.swap({
            target: '#target',
            swap: 'innerMorph',
            text: '<html><body><span id="new-child">new</span></body></html>',
            sourceElement: playground()
        });
        let target = playground().querySelector('#target');
        target.should.not.equal(null);
        (target.querySelector('body') === null).should.equal(true);
        target.querySelector('#new-child').should.not.equal(null);
    });

    it('beforeend on full-page response strips body wrapper', async function() {
        playground().innerHTML = '<div id="target"><span id="orig">old</span></div>';
        await htmx.swap({
            target: '#target',
            swap: 'beforeend',
            text: '<html><body><span id="appended">added</span></body></html>',
            sourceElement: playground()
        });
        let target = playground().querySelector('#target');
        (target.querySelector('body') === null).should.equal(true);
        target.querySelector('#orig').should.not.equal(null);
        target.querySelector('#appended').should.not.equal(null);
    });

    it('partial response is unaffected by strip auto-upgrade', async function() {
        playground().innerHTML = '<div id="target">old</div>';
        await htmx.swap({
            target: '#target',
            swap: 'innerHTML',
            text: '<span id="partial-child">partial</span>',
            sourceElement: playground()
        });
        let target = playground().querySelector('#target');
        target.querySelector('#partial-child').should.not.equal(null);
        target.querySelector('#partial-child').textContent.should.equal('partial');
    });
});

describe('outerSync processes inserted nodes correctly', function() {

    beforeEach(() => { setupTest(this.currentTest); });
    afterEach(() => { cleanupTest(); });

    it('processes hx-trigger="load" elements after outerSync swap (issue #3807)', async function() {
        // Simulate the history restore scenario: outerSync into a target with a full-page response
        // containing an element with hx-trigger="load". The load trigger must fire on the
        // live DOM node, not on the detached <body> fragment.
        mockResponse('GET', '/load-target', 'loaded by hx-trigger="load"');

        let target = createProcessedHTML('<div id="sync-target"><p>old content</p></div>');

        await htmx.swap({
            target: '#sync-target',
            swap: 'outerSync',
            text: '<html><body><div id="sync-target"><span id="load-elt" hx-get="/load-target" hx-trigger="load" hx-swap="innerHTML">loading...</span></div></body></html>',
            sourceElement: target
        });

        // The load trigger should have fired and issued a request
        await forRequest();

        let elt = document.getElementById('load-elt');
        elt.should.not.equal(null);
        elt.textContent.should.equal('loaded by hx-trigger="load"');
    });

    it('initializes htmx attributes on nodes inserted via outerSync', async function() {
        let target = createProcessedHTML('<div id="sync-target"><p>old</p></div>');

        await htmx.swap({
            target: '#sync-target',
            swap: 'outerSync',
            text: '<html><body><div id="sync-target"><button id="btn" hx-get="/test" hx-swap="innerHTML">click</button></div></body></html>',
            sourceElement: target
        });

        let btn = document.getElementById('btn');
        btn.should.not.equal(null);
        assert.isNotNull(btn._htmx, 'button should be initialized by htmx');
    });
});

describe('hx-history-elt scopes history restore', function() {

    beforeEach(() => { setupTest(this.currentTest); });
    afterEach(() => { cleanupTest(); });

    it('restoring history with hx-history-elt swaps only that element and leaves siblings intact', async function() {
        playground().innerHTML = `
            <div id="sentinel">untouched</div>
            <main hx-history-elt><p id="orig">old</p></main>
            <div id="sentinel-after">also untouched</div>
        `;
        htmx.process(playground());

        let response = `<html><head><title>x</title></head><body>
            <header>HEADER LEAK</header>
            <main hx-history-elt><p id="new">new</p></main>
            <footer>FOOTER LEAK</footer>
        </body></html>`;
        mockResponse('GET', '/restore-test', response);

        htmx.__restoreHistory('/restore-test');
        await forRequest();

        document.getElementById('sentinel').should.not.equal(null);
        document.getElementById('sentinel').textContent.should.equal('untouched');
        document.getElementById('sentinel-after').should.not.equal(null);
        document.getElementById('sentinel-after').textContent.should.equal('also untouched');

        let elt = playground().querySelector('[hx-history-elt]');
        elt.should.not.equal(null);
        elt.querySelector('#new').should.not.equal(null);
        (elt.querySelector('#orig') === null).should.equal(true);

        document.body.textContent.should.not.include('HEADER LEAK');
        document.body.textContent.should.not.include('FOOTER LEAK');
    });
});
