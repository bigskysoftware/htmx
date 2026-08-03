describe('__handleHxHeadersAndMaybeReturnEarly unit tests', function() {

    let originalLocation;

    beforeEach(function() {
        setupTest();
        // Save original location reference
        originalLocation = htmx.__location;
    });

    afterEach(function() {
        // Restore original location
        htmx.__location = originalLocation;
        cleanupTest();
    });

    it('returns false when no headers to handle', function () {
        let ctx = {
            hx: {},
            sourceElement: createProcessedHTML('<div></div>')
        }

        let result = htmx.__handleHeadersAndMaybeReturnEarly(ctx)

        assert.isNotOk(result)
    })

    it('returns false when only hx-trigger is present', function () {
        let container = createProcessedHTML('<div></div>')

        let ctx = {
            hx: {
                trigger: 'someEvent'
            },
            sourceElement: container
        }

        let result = htmx.__handleHeadersAndMaybeReturnEarly(ctx)

        assert.isNotOk(result)
    })

    it('keeps commas in plain HX-Location paths', function() {
        let originalAjax = htmx.ajax
        let request
        htmx.ajax = (...args) => request = args

        try {
            let result = htmx.__handleHeadersAndMaybeReturnEarly({hx: {location: '/files/a,b'}})

            assert.isTrue(result)
            assert.deepEqual(request, ['GET', '/files/a,b', {push: 'true'}])
        } finally {
            htmx.ajax = originalAjax
        }
    })

    it('parses an HCON HX-Location value', function() {
        let originalAjax = htmx.ajax
        let request
        htmx.ajax = (...args) => request = args

        try {
            let result = htmx.__handleHeadersAndMaybeReturnEarly({hx: {location: 'path:/search'}})

            assert.isTrue(result)
            assert.deepEqual(request, ['GET', '/search', {push: 'true'}])
        } finally {
            htmx.ajax = originalAjax
        }
    })

    it('honors HX-Location replace without pushing', async function() {
        mockResponse('GET', '/test', 'ignored', {
            headers: {
                'HX-Location': '{"path":"/location-replaced","target":"#destination","replace":"/location-replaced"}'
            }
        })
        mockResponse('GET', '/location-replaced', 'Located')
        let source = createProcessedHTML('<div><div id="destination"></div><button id="source" hx-get="/test">Go</button></div>')
            .querySelector('#source')
        let requestFinished = new Promise(resolve => {
            find('#destination').addEventListener('htmx:finally:request', resolve, {once: true})
        })
        let originalPushState = history.pushState
        let originalReplaceState = history.replaceState
        let pushes = 0
        let replaces = 0

        history.pushState = function(...args) {
            pushes++
            return originalPushState.apply(history, args)
        }
        history.replaceState = function(...args) {
            replaces++
            return originalReplaceState.apply(history, args)
        }

        try {
            source.click()
            await requestFinished

            assert.equal(find('#destination').textContent, 'Located')
            assert.equal(pushes, 0)
            assert.equal(replaces, 1)
        } finally {
            history.pushState = originalPushState
            history.replaceState = originalReplaceState
        }
    })

    // HX-Refresh header tests
    it('calls location.reload() on HX-Refresh: true', function () {
        let reloadCalled = false;
        htmx.__location = { reload: function() { reloadCalled = true; } };

        let ctx = {
            hx: { refresh: 'true' },
            sourceElement: createProcessedHTML('<div></div>')
        };

        let result = htmx.__handleHeadersAndMaybeReturnEarly(ctx);

        assert.isTrue(result);
        assert.isTrue(reloadCalled);
    })

    it('does not reload on HX-Refresh: false', function () {
        let reloadCalled = false;
        htmx.__location = { reload: function() { reloadCalled = true; } };

        let ctx = {
            hx: { refresh: 'false' },
            sourceElement: createProcessedHTML('<div></div>')
        };

        let result = htmx.__handleHeadersAndMaybeReturnEarly(ctx);

        assert.isNotOk(result);
        assert.isFalse(reloadCalled);
    })

    // HX-Redirect header tests
    it('sets location.href on HX-Redirect', function () {
        let redirectUrl = null;
        htmx.__location = { 
            get href() { return window.location.href; },
            set href(val) { redirectUrl = val; }
        };

        let ctx = {
            hx: { redirect: 'https://example.com/new-page' },
            sourceElement: createProcessedHTML('<div></div>')
        };

        let result = htmx.__handleHeadersAndMaybeReturnEarly(ctx);

        assert.isTrue(result);
        assert.equal(redirectUrl, 'https://example.com/new-page');
    })

    // HX-Location header tests
    it('calls ajax on HX-Location with simple path', function () {
        let ajaxCalled = false;
        let ajaxArgs = null;
        const originalAjax = htmx.ajax;
        htmx.ajax = function(method, path, opts) {
            ajaxCalled = true;
            ajaxArgs = { method, path, opts };
        };

        try {
            let ctx = {
                hx: { location: '/new-path' },
                sourceElement: createProcessedHTML('<div></div>')
            };

            let result = htmx.__handleHeadersAndMaybeReturnEarly(ctx);

            assert.isTrue(result);
            assert.isTrue(ajaxCalled);
            assert.equal(ajaxArgs.method, 'GET');
            assert.equal(ajaxArgs.path, '/new-path');
            assert.equal(ajaxArgs.opts.push, 'true');
        } finally {
            htmx.ajax = originalAjax;
        }
    })

    it('calls ajax on HX-Location with JSON config', function () {
        let ajaxCalled = false;
        let ajaxArgs = null;
        const originalAjax = htmx.ajax;
        htmx.ajax = function(method, path, opts) {
            ajaxCalled = true;
            ajaxArgs = { method, path, opts };
        };

        try {
            let ctx = {
                hx: { location: '{"path":"/test", "target":"#result"}' },
                sourceElement: createProcessedHTML('<div></div>')
            };

            let result = htmx.__handleHeadersAndMaybeReturnEarly(ctx);

            assert.isTrue(result);
            assert.isTrue(ajaxCalled);
            assert.equal(ajaxArgs.method, 'GET');
            assert.equal(ajaxArgs.path, '/test');
            assert.equal(ajaxArgs.opts.target, '#result');
            assert.equal(ajaxArgs.opts.push, 'true');
        } finally {
            htmx.ajax = originalAjax;
        }
    })

    it('calls ajax on HX-Location with HCON config', function () {
        let ajaxCalled = false;
        let ajaxArgs = null;
        const originalAjax = htmx.ajax;
        htmx.ajax = function(method, path, opts) {
            ajaxCalled = true;
            ajaxArgs = { method, path, opts };
        };

        try {
            let ctx = {
                hx: { location: 'path:/test target:#result' },
                sourceElement: createProcessedHTML('<div></div>')
            };

            let result = htmx.__handleHeadersAndMaybeReturnEarly(ctx);

            assert.isTrue(result);
            assert.isTrue(ajaxCalled);
            assert.equal(ajaxArgs.method, 'GET');
            assert.equal(ajaxArgs.path, '/test');
            assert.equal(ajaxArgs.opts.target, '#result');
        } finally {
            htmx.ajax = originalAjax;
        }
    })

    it('respects push:false in HX-Location', function () {
        let ajaxArgs = null;
        const originalAjax = htmx.ajax;
        htmx.ajax = function(method, path, opts) {
            ajaxArgs = { method, path, opts };
        };

        try {
            let ctx = {
                hx: { location: '{"path":"/test", "push":"false"}' },
                sourceElement: createProcessedHTML('<div></div>')
            };

            htmx.__handleHeadersAndMaybeReturnEarly(ctx);

            assert.equal(ajaxArgs.opts.push, 'false');
        } finally {
            htmx.ajax = originalAjax;
        }
    })

});
