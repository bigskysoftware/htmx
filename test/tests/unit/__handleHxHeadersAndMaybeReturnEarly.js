describe('__handleHxHeadersAndMaybeReturnEarly unit tests', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
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

});
