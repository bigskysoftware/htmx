describe('trigger() unit tests', function() {

    it('triggers event on element', function () {
        let div = createProcessedHTML('<div></div>')
        let called = false
        div.addEventListener('custom', () => called = true)
        htmx.trigger(div, 'custom')
        assert.isTrue(called)
    })

    it('passes detail object', function () {
        let div = createProcessedHTML('<div></div>')
        let receivedDetail = null
        div.addEventListener('custom', (e) => receivedDetail = e.detail)
        htmx.trigger(div, 'custom', {foo: 'bar'})
        assert.deepEqual(receivedDetail, {foo: 'bar'})
    })

    it('bubbles by default', function () {
        let parent = createProcessedHTML('<div><span id="child"></span></div>')
        let child = parent.querySelector('#child')
        let calledOnParent = false
        parent.addEventListener('custom', () => calledOnParent = true)
        htmx.trigger(child, 'custom')
        assert.isTrue(calledOnParent)
    })

    it('can disable bubbling', function () {
        let parent = createProcessedHTML('<div><span id="child"></span></div>')
        let child = parent.querySelector('#child')
        let calledOnParent = false
        parent.addEventListener('custom', () => calledOnParent = true)
        htmx.trigger(child, 'custom', {}, false)
        assert.isFalse(calledOnParent)
    })

    it('returns true when not cancelled', function () {
        let div = createProcessedHTML('<div></div>')
        let result = htmx.trigger(div, 'custom')
        assert.isTrue(result)
    })

    it('returns false when event prevented', function () {
        let div = createProcessedHTML('<div></div>')
        div.addEventListener('custom', (e) => e.preventDefault())
        let result = htmx.trigger(div, 'custom')
        assert.isFalse(result)
    })

    it('works with selector string', function () {
        createProcessedHTML('<div id="target"></div>')
        let called = false
        document.getElementById('target').addEventListener('custom', () => called = true)
        htmx.trigger('#target', 'custom')
        assert.isTrue(called)
    })

    it('triggers on document when element not connected', function () {
        let div = document.createElement('div')
        let calledOnDocument = false
        document.addEventListener('custom:orphan', () => calledOnDocument = true)
        htmx.trigger(div, 'custom:orphan')
        assert.isTrue(calledOnDocument)
    })

});