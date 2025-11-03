describe('__handleTriggerHeader unit tests', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    it('triggers single event from simple string', function () {
        let eventFired = false
        let container = createProcessedHTML('<div></div>')
        container.addEventListener('myEvent', () => { eventFired = true })

        htmx.__handleTriggerHeader('myEvent', container)

        assert.isTrue(eventFired)
    })

    it('triggers multiple events from comma-separated string', function () {
        let event1Fired = false
        let event2Fired = false
        let event3Fired = false
        let container = createProcessedHTML('<div></div>')

        container.addEventListener('event1', () => { event1Fired = true })
        container.addEventListener('event2', () => { event2Fired = true })
        container.addEventListener('event3', () => { event3Fired = true })

        htmx.__handleTriggerHeader('event1, event2, event3', container)

        assert.isTrue(event1Fired)
        assert.isTrue(event2Fired)
        assert.isTrue(event3Fired)
    })

    it('trims whitespace from event names', function () {
        let eventFired = false
        let container = createProcessedHTML('<div></div>')
        container.addEventListener('myEvent', () => { eventFired = true })

        htmx.__handleTriggerHeader('  myEvent  ', container)

        assert.isTrue(eventFired)
    })

    it('triggers event with detail from JSON object', function () {
        let eventDetail = null
        let container = createProcessedHTML('<div></div>')
        container.addEventListener('myEvent', (e) => { eventDetail = e.detail })

        htmx.__handleTriggerHeader('{"myEvent": {"key": "value", "num": 42}}', container)

        assert.isNotNull(eventDetail)
        assert.equal(eventDetail.key, 'value')
        assert.equal(eventDetail.num, 42)
    })

    it('triggers event with simple value from JSON object', function () {
        let eventDetail = null
        let container = createProcessedHTML('<div></div>')
        container.addEventListener('myEvent', (e) => { eventDetail = e.detail })

        htmx.__handleTriggerHeader('{"myEvent": "simpleValue"}', container)

        assert.isNotNull(eventDetail)
        assert.equal(eventDetail.value, 'simpleValue')
    })

    it('triggers multiple events from JSON object', function () {
        let event1Detail = null
        let event2Detail = null
        let container = createProcessedHTML('<div></div>')

        container.addEventListener('event1', (e) => { event1Detail = e.detail })
        container.addEventListener('event2', (e) => { event2Detail = e.detail })

        htmx.__handleTriggerHeader('{"event1": {"data": "first"}, "event2": {"data": "second"}}', container)

        assert.equal(event1Detail.data, 'first')
        assert.equal(event2Detail.data, 'second')
    })

    it('uses custom target from JSON detail', function () {
        let eventFired = false
        let container = createProcessedHTML('<div><span id="target"></span></div>')
        let target = container.querySelector('#target')

        target.addEventListener('myEvent', () => { eventFired = true })

        htmx.__handleTriggerHeader('{"myEvent": {"target": "#target", "data": "test"}}', container)

        assert.isTrue(eventFired)
    })

    it('falls back to provided element if target not found', function () {
        let eventFired = false
        let container = createProcessedHTML('<div></div>')

        container.addEventListener('myEvent', () => { eventFired = true })

        htmx.__handleTriggerHeader('{"myEvent": {"target": "#nonexistent", "data": "test"}}', container)

        assert.isTrue(eventFired)
    })

    it('uses document.body if element is not connected', function () {
        let eventFired = false
        let disconnectedElt = document.createElement('div')

        document.addEventListener('myEvent', () => { eventFired = true })

        try {
            htmx.__handleTriggerHeader('myEvent', disconnectedElt)
            assert.isTrue(eventFired)
        } finally {
            document.removeEventListener('myEvent', () => {})
        }
    })

    it('passes through object detail as-is when it is an object', function () {
        let eventDetail = null
        let container = createProcessedHTML('<div></div>')
        container.addEventListener('myEvent', (e) => { eventDetail = e.detail })

        htmx.__handleTriggerHeader('{"myEvent": {"foo": "bar", "baz": 123}}', container)

        assert.equal(eventDetail.foo, 'bar')
        assert.equal(eventDetail.baz, 123)
        assert.isUndefined(eventDetail.value)
    })

    it('wraps non-object detail in value property', function () {
        let eventDetail = null
        let container = createProcessedHTML('<div></div>')
        container.addEventListener('myEvent', (e) => { eventDetail = e.detail })

        htmx.__handleTriggerHeader('{"myEvent": 42}', container)

        assert.equal(eventDetail.value, 42)
    })

});
