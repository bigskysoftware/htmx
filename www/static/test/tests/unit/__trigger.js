describe('__trigger() unit tests', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    it('triggers event on element', function () {
        let div = createProcessedHTML('<div></div>')
        let called = false
        div.addEventListener('custom', () => called = true)
        htmx.__trigger(div, 'custom')
        assert.isTrue(called)
    })

    it('passes detail object', function () {
        let div = createProcessedHTML('<div></div>')
        let receivedDetail = null
        div.addEventListener('custom', (e) => receivedDetail = e.detail)
        htmx.__trigger(div, 'custom', {foo: 'bar'})
        assert.deepEqual(receivedDetail, {foo: 'bar'})
    })

    it('bubbles by default', function () {
        let parent = createProcessedHTML('<div><span id="child"></span></div>')
        let child = parent.querySelector('#child')
        let calledOnParent = false
        parent.addEventListener('custom', () => calledOnParent = true)
        htmx.__trigger(child, 'custom')
        assert.isTrue(calledOnParent)
    })

    it('can disable bubbling', function () {
        let parent = createProcessedHTML('<div><span id="child"></span></div>')
        let child = parent.querySelector('#child')
        let calledOnParent = false
        parent.addEventListener('custom', () => calledOnParent = true)
        htmx.__trigger(child, 'custom', {}, false)
        assert.isFalse(calledOnParent)
    })

    it('returns true when not cancelled', function () {
        let div = createProcessedHTML('<div></div>')
        let result = htmx.__trigger(div, 'custom')
        assert.isTrue(result)
    })

    it('returns false when event prevented', function () {
        let div = createProcessedHTML('<div></div>')
        div.addEventListener('custom', (e) => e.preventDefault())
        let result = htmx.__trigger(div, 'custom')
        assert.isFalse(result)
    })

    it('works with selector string', function () {
        createProcessedHTML('<div id="target"></div>')
        let called = false
        document.getElementById('target').addEventListener('custom', () => called = true)
        htmx.__trigger('#target', 'custom')
        assert.isTrue(called)
    })

    it('handles colon in event name', function () {
        let div = createProcessedHTML('<div></div>')
        let receivedEventName = null
        div.addEventListener('htmx:custom', (e) => receivedEventName = e.type)
        htmx.__trigger(div, 'htmx:custom')
        assert.equal(receivedEventName, 'htmx:custom')
    })

    it('adjusts meta character when configured', function () {
        let div = createProcessedHTML('<div></div>')
        let oldMetaCharacter = htmx.config.metaCharacter
        htmx.config.metaCharacter = '-'
        let receivedEventName = null
        div.addEventListener('htmx-custom', (e) => receivedEventName = e.type)
        htmx.__trigger(div, 'htmx:custom')
        assert.equal(receivedEventName, 'htmx-custom')
        htmx.config.metaCharacter = oldMetaCharacter
    })

    it('handles empty detail object by default', function () {
        let div = createProcessedHTML('<div></div>')
        let receivedDetail = null
        div.addEventListener('custom', (e) => receivedDetail = e.detail)
        htmx.__trigger(div, 'custom')
        assert.deepEqual(receivedDetail, {})
    })

    it('works with document element', function () {
        let called = false
        document.addEventListener('custom:doc', () => called = true)
        htmx.__trigger(document, 'custom:doc')
        assert.isTrue(called)
        document.removeEventListener('custom:doc', () => {})
    })

    it('preserves detail properties', function () {
        let div = createProcessedHTML('<div></div>')
        let receivedDetail = null
        div.addEventListener('custom', (e) => receivedDetail = e.detail)
        let detail = {
            string: 'value',
            number: 42,
            boolean: true,
            object: {nested: 'prop'},
            array: [1, 2, 3]
        }
        htmx.__trigger(div, 'custom', detail)
        assert.deepEqual(receivedDetail, detail)
    })

    it('event is composed', function () {
        let shadowHost = createProcessedHTML('<div></div>')
        let shadowRoot = shadowHost.attachShadow({mode: 'open'})
        let shadowChild = document.createElement('div')
        shadowRoot.appendChild(shadowChild)

        let calledOnHost = false
        shadowHost.addEventListener('custom', (e) => {
            calledOnHost = true
            assert.isTrue(e.composed)
        })

        htmx.__trigger(shadowChild, 'custom')
        assert.isTrue(calledOnHost)
    })

    it('event is cancelable', function () {
        let div = createProcessedHTML('<div></div>')
        let wasCancelable = false
        div.addEventListener('custom', (e) => {
            wasCancelable = e.cancelable
            e.preventDefault()
        })
        htmx.__trigger(div, 'custom')
        assert.isTrue(wasCancelable)
    })

});