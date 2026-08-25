describe('__issueRequest unit tests', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    it('triggers htmx:before:request event', async function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="none"></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))

        let mockFetch = async () => ({
            status: 200,
            headers: new Headers(),
            text: async () => ''
        })
        ctx.fetch = mockFetch

        let beforeRequestFired = false
        div.addEventListener('htmx:before:request', () => beforeRequestFired = true)

        await htmx.__issueRequest(ctx)
        assert.isTrue(beforeRequestFired)
    })

    it('triggers htmx:after:request event', async function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="none"></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))

        let mockFetch = async () => ({
            status: 200,
            headers: new Headers(),
            text: async () => ''
        })
        ctx.fetch = mockFetch

        let afterRequestFired = false
        div.addEventListener('htmx:after:request', () => afterRequestFired = true)

        await htmx.__issueRequest(ctx)
        assert.isTrue(afterRequestFired)
    })

    it('calls custom fetch implementation', async function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="none"></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))

        let fetchCalled = false
        let fetchAction = null
        ctx.fetch = async (action, request) => {
            fetchCalled = true
            fetchAction = action
            return {
                status: 200,
                headers: new Headers(),
                text: async () => ''
            }
        }

        await htmx.__issueRequest(ctx)
        assert.isTrue(fetchCalled)
        assert.equal(fetchAction, '/test')
    })

    it('does not execute when queue blocks request', async function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="none" hx-sync="drop"></div>')

        // Issue first request
        let ctx1 = htmx.__createRequestContext(div, new Event('click'))
        ctx1.fetch = async () => new Promise(() => {}) // never resolves
        htmx.__issueRequest(ctx1) // don't await

        // Try to issue second request
        let ctx2 = htmx.__createRequestContext(div, new Event('click'))
        let fetchCalled = false
        ctx2.fetch = async () => {
            fetchCalled = true
            return { status: 200, headers: new Headers(), text: async () => '' }
        }

        await htmx.__issueRequest(ctx2)
        assert.isFalse(fetchCalled)
    })

    it('replace aborts the active request and runs the replacement', async function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="none" hx-sync="replace"></div>')
        let ctx1 = htmx.__createRequestContext(div, new Event('click'))
        ctx1.fetch = (url, options) => new Promise((resolve, reject) => {
            options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
        })
        let ctx2 = htmx.__createRequestContext(div, new Event('click'))
        let replacementRan = false
        ctx2.fetch = async () => {
            replacementRan = true
            return {status: 200, headers: new Headers(), text: async () => ''}
        }

        let request1 = htmx.__issueRequest(ctx1)
        let request2 = htmx.__issueRequest(ctx2)
        await Promise.all([request1, request2])

        assert.isTrue(ctx1.request.signal.aborted)
        assert.isTrue(replacementRan)
    })

    it('a later request aborts an active abort request', async function () {
        let parent = createProcessedHTML('<div id="sync"><div id="first" hx-get="/first" hx-swap="none" hx-sync="#sync:abort"></div><div id="second" hx-get="/second" hx-swap="none" hx-sync="#sync:drop"></div></div>')
        let ctx1 = htmx.__createRequestContext(parent.querySelector('#first'), new Event('click'))
        ctx1.fetch = (url, options) => new Promise((resolve, reject) => {
            options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
        })
        let ctx2 = htmx.__createRequestContext(parent.querySelector('#second'), new Event('click'))
        let secondRan = false
        ctx2.fetch = async () => {
            secondRan = true
            return {status: 200, headers: new Headers(), text: async () => ''}
        }

        let request1 = htmx.__issueRequest(ctx1)
        let request2 = htmx.__issueRequest(ctx2)
        await Promise.all([request1, request2])

        assert.isTrue(ctx1.request.signal.aborted)
        assert.isTrue(secondRan)
    })

    it('returns early if htmx:before:request is cancelled', async function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="none"></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))

        div.addEventListener('htmx:before:request', (e) => e.preventDefault())

        let fetchCalled = false
        ctx.fetch = async () => {
            fetchCalled = true
            return { status: 200, headers: new Headers(), text: async () => '' }
        }

        await htmx.__issueRequest(ctx)
        assert.isFalse(fetchCalled)
    })

    it('returns early if confirm returns false', async function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="none" hx-confirm="Are you sure?"></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))

        let originalConfirm = window.confirm
        window.confirm = () => false

        let fetchCalled = false
        ctx.fetch = async () => {
            fetchCalled = true
            return { status: 200, headers: new Headers(), text: async () => '' }
        }

        await htmx.__issueRequest(ctx)
        assert.isFalse(fetchCalled)

        window.confirm = originalConfirm
    })

    it('cancels request when dropRequest called after htmx:confirm preventDefault', async function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="none" hx-confirm="Are you sure?"></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))

        div.addEventListener('htmx:confirm', (e) => {
            e.preventDefault()
            e.detail.dropRequest()
        })

        let fetchCalled = false
        ctx.fetch = async () => {
            fetchCalled = true
            return { status: 200, headers: new Headers(), text: async () => '' }
        }

        await htmx.__issueRequest(ctx)
        assert.isFalse(fetchCalled)
    })

    it('creates response object with correct structure', async function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="none"></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))

        let mockHeaders = new Headers()
        ctx.fetch = async () => ({
            status: 201,
            headers: mockHeaders,
            text: async () => 'response text'
        })

        await htmx.__issueRequest(ctx)

        assert.equal(ctx.response.status, 201)
        assert.equal(ctx.response.headers, mockHeaders)
        assert.isDefined(ctx.response.raw)
    })

    it('catches errors and triggers htmx:error event', async function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="none"></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))

        let errorFired = false
        let capturedError = null
        div.addEventListener('htmx:error', (e) => {
            errorFired = true
            capturedError = e.detail.error
        })

        let testError = new Error('fetch failed')
        ctx.fetch = async () => { throw testError }

        await htmx.__issueRequest(ctx)

        assert.isTrue(errorFired)
        assert.equal(capturedError, testError)
    })

    it('fires HX-Trigger event after swap completes', async function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="none"></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))

        let triggerFired = false
        div.addEventListener('myEvent', () => triggerFired = true)

        ctx.fetch = async () => ({
            status: 200,
            headers: new Headers({ 'HX-Trigger': 'myEvent' }),
            text: async () => ''
        })

        await htmx.__issueRequest(ctx)
        assert.isTrue(triggerFired)
    })

    it('fires HX-Trigger on replacement element after outerHTML swap', async function () {
        let div = createProcessedHTML('<div id="source" hx-get="/test" hx-swap="outerHTML"></div>')
        let source = find('#source')
        let ctx = htmx.__createRequestContext(source, new Event('click'))

        let triggerTarget = null
        document.addEventListener('myEvent', (e) => triggerTarget = e.target)

        ctx.fetch = async () => ({
            status: 200,
            headers: new Headers({ 'HX-Trigger': 'myEvent' }),
            text: async () => '<span id="replacement">New</span>'
        })

        await htmx.__issueRequest(ctx)

        let replacement = find('#replacement')
        assert.isNotNull(replacement)
        assert.isFalse(source.isConnected)
        assert.equal(triggerTarget, replacement)
    })

    it('always triggers htmx:finally:request', async function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="none"></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))

        let finallyFired = false
        div.addEventListener('htmx:finally:request', () => finallyFired = true)

        ctx.fetch = async () => { throw new Error('fail') }

        await htmx.__issueRequest(ctx)
        assert.isTrue(finallyFired)
    })

    it('waits for all htmx:before:response work before finalizing', async function () {
        let div = createProcessedHTML('<button hx-get="/test" hx-disable="this" hx-swap="none">Go</button>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))
        let rejectFirst
        let resolveSecond
        let first = new Promise((resolve, reject) => rejectFirst = reject)
        let second = new Promise(resolve => resolveSecond = resolve)
        let finallyFired = false

        ctx.fetch = async () => ({status: 200, headers: new Headers(), text: async () => ''})
        div.addEventListener('htmx:before:response', event => {
            event.detail.waitUntil(first)
            event.detail.waitUntil(second)
            event.preventDefault()
        })
        div.addEventListener('htmx:finally:request', () => finallyFired = true)

        let request = htmx.__issueRequest(ctx)
        await htmx.timeout(1)
        assert.isTrue(div.disabled)
        assert.isFalse(finallyFired)

        rejectFirst(new Error('extension failed'))
        await htmx.timeout(1)
        assert.isTrue(div.disabled)
        assert.isFalse(finallyFired)

        resolveSecond()
        await request
        assert.isFalse(div.disabled)
        assert.isTrue(finallyFired)
    })

    it('updates ctx.status through request lifecycle', async function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="none"></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))

        let statuses = []
        div.addEventListener('htmx:before:request', () => statuses.push(ctx.status))

        ctx.fetch = async () => {
            statuses.push(ctx.status)
            return { status: 200, headers: new Headers(), text: async () => '' }
        }

        await htmx.__issueRequest(ctx)
        statuses.push(ctx.status)

        assert.include(statuses, 'issuing')
        assert.include(statuses, 'swapped')
    })

    it('processes next queued request after completion', async function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="none" hx-sync="queue all"></div>')

        let request1Complete = false
        let request2Started = false

        // First request
        let ctx1 = htmx.__createRequestContext(div, new Event('click'))
        ctx1.fetch = async () => {
            await new Promise(r => setTimeout(r, 10))
            request1Complete = true
            return { status: 200, headers: new Headers(), text: async () => '' }
        }

        // Second request (should be queued)
        let ctx2 = htmx.__createRequestContext(div, new Event('click'))
        ctx2.fetch = async () => {
            request2Started = true
            return { status: 200, headers: new Headers(), text: async () => '' }
        }

        let p1 = htmx.__issueRequest(ctx1)
        await new Promise(r => setTimeout(r, 5)) // let first request start
        let p2 = htmx.__issueRequest(ctx2)

        await Promise.all([p1, p2])

        assert.isTrue(request1Complete)
        assert.isTrue(request2Started)
    })

    it('aborts request after timeout fires', async function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="none" hx-config="timeout:50"></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))

        ctx.fetch = (url, opts) => new Promise((_, reject) => {
            opts.signal.addEventListener('abort', () => {
                reject(new DOMException('The operation was aborted', 'AbortError'))
            })
        })

        let errorFired = false
        div.addEventListener('htmx:error', () => errorFired = true)

        await htmx.__issueRequest(ctx)
        assert.isTrue(errorFired)
        assert.isTrue(ctx.request.signal.aborted)
    })

    it('htmx:abort event aborts in-flight request', async function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="none"></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))

        ctx.fetch = (url, opts) => new Promise((_, reject) => {
            setTimeout(() => htmx.trigger(div, 'htmx:abort'), 10)
            opts.signal.addEventListener('abort', () => {
                reject(new DOMException('The operation was aborted', 'AbortError'))
            })
        })

        let errorFired = false
        div.addEventListener('htmx:error', () => errorFired = true)

        await htmx.__issueRequest(ctx)
        assert.isTrue(errorFired)
        assert.isTrue(ctx.request.signal.aborted)
    })

    it('does not crash when scroll target selector matches nothing', async function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="innerHTML scroll:top scrollTarget:#nonexistent"></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))

        ctx.fetch = async () => ({
            status: 200,
            headers: new Headers(),
            text: async () => '<div>Response</div>'
        })

        let errorFired = false
        div.addEventListener('htmx:error', () => errorFired = true)

        await htmx.__issueRequest(ctx)
        assert.isFalse(errorFired)
    })

    it('does not crash when show target selector matches nothing', async function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="innerHTML show:top showTarget:#nonexistent"></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))

        ctx.fetch = async () => ({
            status: 200,
            headers: new Headers(),
            text: async () => '<div>Response</div>'
        })

        let errorFired = false
        div.addEventListener('htmx:error', () => errorFired = true)

        await htmx.__issueRequest(ctx)
        assert.isFalse(errorFired)
    })

    it('does not crash when show target is a text node after outerHTML swap', async function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="outerHTML show:top"></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))

        ctx.fetch = async () => ({
            status: 200,
            headers: new Headers(),
            text: async () => 'Response'
        })

        let errorFired = false
        let onError = () => errorFired = true
        document.addEventListener('htmx:error', onError)

        try {
            await htmx.__issueRequest(ctx)
            assert.isFalse(errorFired)
        } finally {
            document.removeEventListener('htmx:error', onError)
        }
    })

    it('throws clean error for unknown swap style with no extensions', async function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="foobar"></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))

        ctx.fetch = async () => ({
            status: 200,
            headers: new Headers(),
            text: async () => '<div>Response</div>'
        })

        let capturedError = null
        div.addEventListener('htmx:error', (e) => capturedError = e.detail.error)

        await htmx.__issueRequest(ctx)
        assert.isNotNull(capturedError)
        assert.include(capturedError.message, 'Unknown swap style')
    })

});
