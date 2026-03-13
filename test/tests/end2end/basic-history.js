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