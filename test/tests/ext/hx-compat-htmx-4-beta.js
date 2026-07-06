describe('hx-compat-htmx-4-beta extension', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    it('is registered by default during beta', function() {
        assert.isTrue(htmx.__registeredExt.has('hx-compat-htmx-4-beta'));
    });

    it('does not warn when code uses the Headers API', async function() {
        let originalWarn = console.warn;
        let warnings = [];
        console.warn = msg => warnings.push(msg);

        let handler = htmx.on('htmx:config:request', event => {
            event.detail.ctx.request.headers.set('X-Native', 'value');
        });

        try {
            mockResponse('GET', '/test', 'OK');
            let btn = createProcessedHTML('<button hx-get="/test"></button>');
            btn.click();
            await forRequest();

            assert.equal(lastFetch().request.headers.get('X-Native'), 'value');
            assert.equal(warnings.length, 0);
        } finally {
            document.removeEventListener('htmx:config:request', handler);
            console.warn = originalWarn;
        }
    });

    it('supports object-style request header access in extension hooks and warns once', async function() {
        let backup = backupExtensions();
        let originalWarn = console.warn;
        let warnings = [];
        console.warn = msg => warnings.push(msg);

        try {
            htmx.registerExtension('headers-compat-test', {
                htmx_config_request: (elt, {ctx}) => {
                    delete ctx.request.headers['X-Missing'];
                    assert.equal(warnings.length, 1);
                    ctx.request.headers['X-Test'] = 'value';
                    assert.equal(ctx.request.headers['X-Test'], 'value');
                    delete ctx.request.headers['X-Test'];
                    ctx.request.headers['X-Test'] = 'final';
                }
            });

            mockResponse('GET', '/test', 'OK');
            let btn = createProcessedHTML('<button hx-get="/test"></button>');
            btn.click();
            await forRequest();

            assert.equal(lastFetch().request.headers.get('X-Test'), 'final');
            assert.equal(warnings.length, 1);
            assert.include(warnings[0], '[htmx] Deprecated:');
            assert.include(warnings[0], 'Headers');
            assert.include(warnings[0].toLowerCase(), 'deprecated');
            assert.include(warnings[0], 'ctx.request.headers[name]');
            assert.include(warnings[0], '.set(name, value)');
        } finally {
            console.warn = originalWarn;
            restoreExtensions(backup);
        }
    });

    it('supports object-style request header access in htmx.on listeners', async function() {
        let handler = htmx.on('htmx:before:request', event => {
            event.detail.ctx.request.headers['X-Htmx-On'] = 'value';
        });

        try {
            mockResponse('GET', '/test', 'OK');
            let btn = createProcessedHTML('<button hx-get="/test"></button>');
            btn.click();
            await forRequest();

            assert.equal(lastFetch().request.headers.get('X-Htmx-On'), 'value');
        } finally {
            document.removeEventListener('htmx:before:request', handler);
        }
    });

    it('supports object-style request header access in addEventListener listeners', async function() {
        let handler = event => {
            event.detail.ctx.request.headers['X-Listener'] = 'value';
        };
        document.addEventListener('htmx:config:request', handler);

        try {
            mockResponse('GET', '/test', 'OK');
            let btn = createProcessedHTML('<button hx-get="/test"></button>');
            btn.click();
            await forRequest();

            assert.equal(lastFetch().request.headers.get('X-Listener'), 'value');
        } finally {
            document.removeEventListener('htmx:config:request', handler);
        }
    });

    it('supports object-style request header access in hx-on handlers', async function() {
        mockResponse('GET', '/test', 'OK');
        let btn = createProcessedHTML(`<button hx-get="/test" hx-on::config:request="ctx.request.headers['X-Hx-On'] = 'value'"></button>`);
        btn.click();
        await forRequest();

        assert.equal(lastFetch().request.headers.get('X-Hx-On'), 'value');
    });


});
