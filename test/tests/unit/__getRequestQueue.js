describe('__getRequestQueue / RequestQueue unit tests', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    it('allows first request when queue is empty', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))
        let queue = htmx.__getRequestQueue(div)

        let result = queue.issue(ctx, 'queue first')

        assert.isTrue(result)
    })

    it('queues request with "queue all" strategy', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)

        // Issue first request
        let ctx1 = htmx.__createRequestContext(div, new Event('click'))
        queue.issue(ctx1, 'queue all')

        // Queue second request
        let ctx2 = htmx.__createRequestContext(div, new Event('click'))
        let result = queue.issue(ctx2, 'queue all')

        assert.isFalse(result)
        assert.equal(ctx2.status, 'queued')
    })

    it('drops request with "drop" strategy', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)

        // Issue first request
        let ctx1 = htmx.__createRequestContext(div, new Event('click'))
        queue.issue(ctx1, 'drop')

        // Drop second request
        let ctx2 = htmx.__createRequestContext(div, new Event('click'))
        let result = queue.issue(ctx2, 'drop')

        assert.isFalse(result)
        assert.equal(ctx2.status, 'dropped')
    })

    it('queues only last with "queue last" strategy', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)

        // Issue first request
        let ctx1 = htmx.__createRequestContext(div, new Event('click'))
        queue.issue(ctx1, 'queue last')

        // Queue second request
        let ctx2 = htmx.__createRequestContext(div, new Event('click'))
        queue.issue(ctx2, 'queue last')

        // Queue third request (should drop ctx2)
        let ctx3 = htmx.__createRequestContext(div, new Event('click'))
        let result = queue.issue(ctx3, 'queue last')

        assert.isFalse(result)
        assert.equal(ctx2.status, 'dropped')
        assert.equal(ctx3.status, 'queued')
    })

    it('replaces current request with "replace" strategy', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)

        // Issue first request
        let ctx1 = htmx.__createRequestContext(div, new Event('click'))
        ctx1.request = {abort: () => { ctx1.aborted = true }}
        queue.issue(ctx1, 'replace')

        // Replace with second request
        let ctx2 = htmx.__createRequestContext(div, new Event('click'))
        let result = queue.issue(ctx2, 'replace')

        assert.isTrue(result)
        assert.isTrue(ctx1.aborted)
    })

    it('defaults to "queue first" when strategy not specified', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)

        // Issue first request
        let ctx1 = htmx.__createRequestContext(div, new Event('click'))
        queue.issue(ctx1, 'queue first')

        // Queue second request
        let ctx2 = htmx.__createRequestContext(div, new Event('click'))
        queue.issue(ctx2, 'queue first')

        // Third request should be dropped (not queued)
        let ctx3 = htmx.__createRequestContext(div, new Event('click'))
        let result = queue.issue(ctx3, 'queue first')

        assert.isFalse(result)
        assert.equal(ctx2.status, 'queued')
        assert.equal(ctx3.status, 'dropped')
    })

    it('hasMore returns truthy when queue has requests', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)

        let ctx1 = htmx.__createRequestContext(div, new Event('click'))
        queue.issue(ctx1, 'queue all')

        let ctx2 = htmx.__createRequestContext(div, new Event('click'))
        queue.issue(ctx2, 'queue all')

        assert.isOk(queue.more())
    })

    it('hasMore returns falsey when queue is empty', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)

        assert.isNotOk(queue.more())
    })

    it('finish returns next queued request', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)

        let ctx1 = htmx.__createRequestContext(div, new Event('click'))
        queue.issue(ctx1, 'queue all')

        let ctx2 = htmx.__createRequestContext(div, new Event('click'))
        queue.issue(ctx2, 'queue all')

        queue.finish()
        let next = queue.next()

        assert.equal(next, ctx2)
    })

    it('nextRequest clears current request', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)

        let ctx1 = htmx.__createRequestContext(div, new Event('click'))
        queue.issue(ctx1, 'queue all')

        let ctx2 = htmx.__createRequestContext(div, new Event('click'))
        queue.issue(ctx2, 'queue all')

        queue.finish()
        queue.next()

        // Should now allow a new request
        let ctx3 = htmx.__createRequestContext(div, new Event('click'))
        let result = queue.issue(ctx3, 'queue first')

        assert.isTrue(result)
    })

    it('abortCurrentRequest calls abort on current request', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)

        let ctx = htmx.__createRequestContext(div, new Event('click'))
        ctx.abort = () => { ctx.aborted = true }
        queue.issue(ctx, 'queue first')

        queue.abort()

        assert.isTrue(ctx.aborted)
    })

    it('returns same queue for same element', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')

        let queue1 = htmx.__getRequestQueue(div)
        let queue2 = htmx.__getRequestQueue(div)

        assert.equal(queue1, queue2)
    })

    it('returns different queue for different elements', function () {
        let div1 = createProcessedHTML('<div hx-get="/test1"></div>')
        let div2 = createProcessedHTML('<div hx-get="/test2"></div>')

        let queue1 = htmx.__getRequestQueue(div1)
        let queue2 = htmx.__getRequestQueue(div2)

        assert.notEqual(queue1, queue2)
    })

    it('uses selector from hx-sync for queue', function () {
        let container = createProcessedHTML('<div id="container"><div id="btn1" hx-get="/test1" hx-sync="#container:drop"></div><div id="btn2" hx-get="/test2" hx-sync="#container:drop"></div></div>')
        let btn1 = container.querySelector('#btn1')
        let btn2 = container.querySelector('#btn2')

        let queue1 = htmx.__getRequestQueue(btn1)
        let queue2 = htmx.__getRequestQueue(btn2)

        assert.equal(queue1, queue2)
    })

    it('abort strategy: allows first abort request when queue is empty', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)

        let ctx = htmx.__createRequestContext(div, new Event('click'))
        ctx.request = {abort: () => { ctx.aborted = true }}
        let result = queue.issue(ctx, 'abort')

        assert.isTrue(result)
        assert.equal(ctx.queueStrategy, 'abort')
    })

    it('abort strategy: any request can abort an abortable request', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)

        // Issue abort request
        let ctx1 = htmx.__createRequestContext(div, new Event('click'))
        ctx1.request = {abort: () => { ctx1.aborted = true }}
        queue.issue(ctx1, 'abort')

        // Issue drop request - should abort the abort request
        let ctx2 = htmx.__createRequestContext(div, new Event('click'))
        ctx2.request = {abort: () => { ctx2.aborted = true }}
        let result = queue.issue(ctx2, 'drop')

        assert.isTrue(result)
        assert.isTrue(ctx1.aborted)
    })

    it('abort strategy: another abort request drops when abort request is in flight', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)

        // Issue abort request
        let ctx1 = htmx.__createRequestContext(div, new Event('click'))
        ctx1.aborted = false
        ctx1.request = {abort: () => { ctx1.aborted = true }}
        queue.issue(ctx1, 'abort')

        // Issue another abort request - should be dropped
        let ctx2 = htmx.__createRequestContext(div, new Event('click'))
        ctx2.aborted = false
        ctx2.request = {abort: () => { ctx2.aborted = true }}
        let result = queue.issue(ctx2, 'abort')

        assert.isFalse(result)
        assert.equal(ctx2.status, 'dropped')
        assert.isFalse(ctx1.aborted)
    })

    it('abort strategy: abort request drops itself if non-abortable request is in flight', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)

        // Issue drop request (not abortable)
        let ctx1 = htmx.__createRequestContext(div, new Event('click'))
        ctx1.aborted = false
        ctx1.request = {abort: () => { ctx1.aborted = true }}
        queue.issue(ctx1, 'drop')

        // Issue abort request - should be dropped
        let ctx2 = htmx.__createRequestContext(div, new Event('click'))
        ctx2.aborted = false
        ctx2.request = {abort: () => { ctx2.aborted = true }}
        let result = queue.issue(ctx2, 'abort')

        assert.isFalse(result)
        assert.equal(ctx2.status, 'dropped')
        assert.isFalse(ctx1.aborted)
    })

    it('abort strategy: replace request can abort an abortable request', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)

        // Issue abort request
        let ctx1 = htmx.__createRequestContext(div, new Event('click'))
        ctx1.request = {abort: () => { ctx1.aborted = true }}
        queue.issue(ctx1, 'abort')

        // Issue replace request - should abort the abort request
        let ctx2 = htmx.__createRequestContext(div, new Event('click'))
        ctx2.request = {abort: () => { ctx2.aborted = true }}
        let result = queue.issue(ctx2, 'replace')

        assert.isTrue(result)
        assert.isTrue(ctx1.aborted)
    })

    it('abort strategy: queue-all request can abort an abortable request', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)

        // Issue abort request
        let ctx1 = htmx.__createRequestContext(div, new Event('click'))
        ctx1.request = {abort: () => { ctx1.aborted = true }}
        queue.issue(ctx1, 'abort')

        // Issue queue-all request - should abort the abort request
        let ctx2 = htmx.__createRequestContext(div, new Event('click'))
        ctx2.request = {abort: () => { ctx2.aborted = true }}
        let result = queue.issue(ctx2, 'queue all')

        assert.isTrue(result)
        assert.isTrue(ctx1.aborted)
    })

    it('abort strategy: abort request drops itself when replace request is in flight', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)

        // Issue replace request
        let ctx1 = htmx.__createRequestContext(div, new Event('click'))
        ctx1.aborted = false
        ctx1.request = {abort: () => { ctx1.aborted = true }}
        queue.issue(ctx1, 'replace')

        // Issue abort request - should be dropped
        let ctx2 = htmx.__createRequestContext(div, new Event('click'))
        ctx2.aborted = false
        ctx2.request = {abort: () => { ctx2.aborted = true }}
        let result = queue.issue(ctx2, 'abort')

        assert.isFalse(result)
        assert.equal(ctx2.status, 'dropped')
        assert.isFalse(ctx1.aborted)
    })

    it('abort strategy: abort request drops itself when queue-first request is in flight', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)

        // Issue queue-first request
        let ctx1 = htmx.__createRequestContext(div, new Event('click'))
        ctx1.aborted = false
        ctx1.request = {abort: () => { ctx1.aborted = true }}
        queue.issue(ctx1, 'queue first')

        // Issue abort request - should be dropped
        let ctx2 = htmx.__createRequestContext(div, new Event('click'))
        ctx2.aborted = false
        ctx2.request = {abort: () => { ctx2.aborted = true }}
        let result = queue.issue(ctx2, 'abort')

        assert.isFalse(result)
        assert.equal(ctx2.status, 'dropped')
        assert.isFalse(ctx1.aborted)
    })

    it('abort strategy: clears queue when aborting current request', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)

        // Issue non-abortable request
        let ctx1 = htmx.__createRequestContext(div, new Event('click'))
        ctx1.aborted = false
        ctx1.request = {abort: () => { ctx1.aborted = true }}
        queue.issue(ctx1, 'drop')

        // Queue some requests
        let ctx2 = htmx.__createRequestContext(div, new Event('click'))
        queue.issue(ctx2, 'queue all')

        let ctx3 = htmx.__createRequestContext(div, new Event('click'))
        queue.issue(ctx3, 'queue all')

        // Issue replace request - should clear queue
        let ctx4 = htmx.__createRequestContext(div, new Event('click'))
        ctx4.aborted = false
        ctx4.request = {abort: () => { ctx4.aborted = true }}
        let result = queue.issue(ctx4, 'replace')

        assert.isTrue(result)
        assert.isTrue(ctx1.aborted)
        assert.equal(ctx2.status, 'dropped')
        assert.equal(ctx3.status, 'dropped')
        assert.isNotOk(queue.more())
    })

});
