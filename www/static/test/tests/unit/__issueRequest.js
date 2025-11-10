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

    it('always triggers htmx:finally:request', async function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="none"></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))

        let finallyFired = false
        div.addEventListener('htmx:finally:request', () => finallyFired = true)

        ctx.fetch = async () => { throw new Error('fail') }

        await htmx.__issueRequest(ctx)
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

});
