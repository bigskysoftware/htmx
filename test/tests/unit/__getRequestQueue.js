describe('__getRequestQueue / RequestQueue unit tests', function() {

    const noop = () => {}

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    it('allows first request when queue is empty', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)

        assert.equal(queue.issue('queue first', noop, noop), 'run')
    })

    it('queues request with "queue all" strategy', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)

        queue.issue('queue all', noop, noop)
        let result = queue.issue('queue all', noop, noop)

        assert.equal(result, 'queued')
    })

    it('drops request with "drop" strategy', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)

        queue.issue('drop', noop, noop)
        let result = queue.issue('drop', noop, noop)

        assert.equal(result, 'dropped')
    })

    it('queues only last with "queue last" strategy', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)
        let started = []

        queue.issue('queue last', noop, () => started.push(1))
        queue.issue('queue last', noop, () => started.push(2))
        let result = queue.issue('queue last', noop, () => started.push(3))

        assert.equal(result, 'queued')

        queue.finish()
        queue.startNext()
        queue.startNext()

        assert.deepEqual(started, [3])
    })

    it('replaces current request with "replace" strategy', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)
        let aborted = false

        queue.issue('replace', () => { aborted = true }, noop)
        let result = queue.issue('replace', noop, noop)

        assert.equal(result, 'run')
        assert.isTrue(aborted)
    })

    it('defaults to "queue first" when strategy not specified', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)
        let started = []

        queue.issue('queue first', noop, () => started.push(1))
        let second = queue.issue('queue first', noop, () => started.push(2))
        let third = queue.issue('queue first', noop, () => started.push(3))

        assert.equal(second, 'queued')
        assert.equal(third, 'dropped')

        queue.finish()
        queue.startNext()
        queue.startNext()

        assert.deepEqual(started, [2])
    })

    it('startNext runs the next queued start callback once', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)
        let started = []

        queue.issue('queue all', noop, () => started.push(1))
        queue.issue('queue all', noop, () => started.push(2))
        queue.issue('queue all', noop, () => started.push(3))

        queue.finish()
        queue.startNext()

        assert.deepEqual(started, [2])
    })

    it('startNext does nothing when the queue is empty', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)

        queue.startNext()
    })

    it('finish clears the current request', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)

        queue.issue('queue first', noop, noop)
        queue.finish()

        assert.equal(queue.issue('queue first', noop, noop), 'run')
    })

    it('abort calls abort on the current request', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)
        let aborted = false

        queue.issue('queue first', () => { aborted = true }, noop)
        queue.abort()

        assert.isTrue(aborted)
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

    it('hx-sync="drop" without selector uses drop strategy', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-sync="drop"></div>')
        let queue = htmx.__getRequestQueue(div)

        queue.issue(htmx.__determineSyncStrategy(div), noop, noop)
        let result = queue.issue(htmx.__determineSyncStrategy(div), noop, noop)

        assert.equal(result, 'dropped')
    })

    it('hx-sync="abort" without selector uses abort strategy', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-sync="abort"></div>')
        let queue = htmx.__getRequestQueue(div)
        let aborted = false

        queue.issue(htmx.__determineSyncStrategy(div), () => { aborted = true }, noop)
        let result = queue.issue(htmx.__determineSyncStrategy(div), noop, noop)

        assert.equal(result, 'dropped')
        assert.isFalse(aborted)
    })

    it('hx-sync="selector:drop" uses drop strategy', function () {
        let container = createProcessedHTML('<div id="c"><div id="btn" hx-get="/test" hx-sync="#c:drop"></div></div>')
        let btn = container.querySelector('#btn')
        assert.equal(htmx.__determineSyncStrategy(btn), 'drop')
    })

    it('uses selector from hx-sync for queue', function () {
        let container = createProcessedHTML('<div id="container"><div id="btn1" hx-get="/test1" hx-sync="#container:drop"></div><div id="btn2" hx-get="/test2" hx-sync="#container:drop"></div></div>')
        let btn1 = container.querySelector('#btn1')
        let btn2 = container.querySelector('#btn2')

        let queue1 = htmx.__getRequestQueue(btn1)
        let queue2 = htmx.__getRequestQueue(btn2)

        assert.equal(queue1, queue2)
    })

    it('inherited hx-sync="this:replace" resolves queue to declaring parent', function () {
        let parent = createProcessedHTML('<div id="parent" hx-sync:inherited="this:replace"><div id="a" hx-get="/a"></div><div id="b" hx-get="/b"></div></div>')
        let a = parent.querySelector('#a')
        let b = parent.querySelector('#b')

        let queueA = htmx.__getRequestQueue(a)
        let queueB = htmx.__getRequestQueue(b)

        // Both children should share the parent's queue
        assert.equal(queueA, queueB)
        assert.equal(htmx.__htmxState(parent).rq, queueA)
        assert.equal(htmx.__determineSyncStrategy(a), 'replace')
    })

    it('abort strategy: allows first abort request when queue is empty', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)

        assert.equal(queue.issue('abort', noop, noop), 'run')
    })

    it('abort strategy: any request can abort an abortable request', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)
        let aborted = false

        queue.issue('abort', () => { aborted = true }, noop)
        let result = queue.issue('drop', noop, noop)

        assert.equal(result, 'run')
        assert.isTrue(aborted)
    })

    it('abort strategy: another abort request drops when abort request is in flight', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)
        let aborted = false

        queue.issue('abort', () => { aborted = true }, noop)
        let result = queue.issue('abort', noop, noop)

        assert.equal(result, 'dropped')
        assert.isFalse(aborted)
    })

    it('abort strategy: abort request drops itself if non-abortable request is in flight', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)
        let aborted = false

        queue.issue('drop', () => { aborted = true }, noop)
        let result = queue.issue('abort', noop, noop)

        assert.equal(result, 'dropped')
        assert.isFalse(aborted)
    })

    it('abort strategy: replace request can abort an abortable request', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)
        let aborted = false

        queue.issue('abort', () => { aborted = true }, noop)
        let result = queue.issue('replace', noop, noop)

        assert.equal(result, 'run')
        assert.isTrue(aborted)
    })

    it('abort strategy: queue-all request can abort an abortable request', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)
        let aborted = false

        queue.issue('abort', () => { aborted = true }, noop)
        let result = queue.issue('queue all', noop, noop)

        assert.equal(result, 'run')
        assert.isTrue(aborted)
    })

    it('abort strategy: abort request drops itself when replace request is in flight', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)
        let aborted = false

        queue.issue('replace', () => { aborted = true }, noop)
        let result = queue.issue('abort', noop, noop)

        assert.equal(result, 'dropped')
        assert.isFalse(aborted)
    })

    it('abort strategy: abort request drops itself when queue-first request is in flight', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)
        let aborted = false

        queue.issue('queue first', () => { aborted = true }, noop)
        let result = queue.issue('abort', noop, noop)

        assert.equal(result, 'dropped')
        assert.isFalse(aborted)
    })

    // hx-sync value parsing tests

    it('hx-sync="this" defaults to queue first strategy', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-sync="this"></div>')
        assert.equal(htmx.__determineSyncStrategy(div), 'queue first')
    })

    it('hx-sync="this" uses same element for queue', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-sync="this"></div>')
        let queue = htmx.__getRequestQueue(div)
        assert.isOk(queue)
    })

    it('hx-sync="this:drop" uses drop strategy', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-sync="this:drop"></div>')
        assert.equal(htmx.__determineSyncStrategy(div), 'drop')
    })

    it('hx-sync="this:replace" uses replace strategy', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-sync="this:replace"></div>')
        assert.equal(htmx.__determineSyncStrategy(div), 'replace')
    })

    it('hx-sync="this:queue last" uses queue last strategy', function () {
        let div = createProcessedHTML('<div hx-get="/test" hx-sync="this:queue last"></div>')
        assert.equal(htmx.__determineSyncStrategy(div), 'queue last')
    })

    it('hx-sync="closest form" uses closest form for queue with default strategy', function () {
        let form = createProcessedHTML('<form><div id="btn" hx-get="/test" hx-sync="closest form"></div></form>')
        let btn = form.querySelector('#btn')
        assert.equal(htmx.__determineSyncStrategy(btn), 'queue first')
        // queue should be on the form, not the button
        let queue = htmx.__getRequestQueue(btn)
        assert.equal(htmx.__htmxState(form).rq, queue)
    })

    it('hx-sync="closest form:replace" uses closest form with replace strategy', function () {
        let form = createProcessedHTML('<form><div id="btn" hx-get="/test" hx-sync="closest form:replace"></div></form>')
        let btn = form.querySelector('#btn')
        assert.equal(htmx.__determineSyncStrategy(btn), 'replace')
        let queue = htmx.__getRequestQueue(btn)
        assert.equal(htmx.__htmxState(form).rq, queue)
    })

    it('hx-sync with "this" shares queue between sibling elements synced to parent', function () {
        let container = createProcessedHTML('<div id="c"><div id="a" hx-get="/a" hx-sync="#c:drop"></div><div id="b" hx-get="/b" hx-sync="#c:drop"></div></div>')
        let a = container.querySelector('#a')
        let b = container.querySelector('#b')
        assert.equal(htmx.__getRequestQueue(a), htmx.__getRequestQueue(b))
    })

    it('replace strategy clears queued requests when aborting current', function () {
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        let queue = htmx.__getRequestQueue(div)
        let aborted = false
        let started = []

        queue.issue('drop', () => { aborted = true }, noop)
        queue.issue('queue all', noop, () => started.push(2))
        queue.issue('queue all', noop, () => started.push(3))

        let result = queue.issue('replace', noop, noop)

        assert.equal(result, 'run')
        assert.isTrue(aborted)

        queue.finish()
        queue.startNext()

        assert.deepEqual(started, [])
    })

});
