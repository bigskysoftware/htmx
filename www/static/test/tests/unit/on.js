describe('on() unit tests', function() {

    it('registers event listener on document by default', function () {
        let called = false
        htmx.on('custom:test', () => called = true)
        document.dispatchEvent(new Event('custom:test'))
        assert.isTrue(called)
    })

    it('registers event listener on specific element', function () {
        let div = createProcessedHTML('<div></div>')
        let called = false
        htmx.on(div, 'custom', () => called = true)
        div.dispatchEvent(new Event('custom'))
        assert.isTrue(called)
    })

    it('returns the callback', function () {
        let callback = () => {}
        let returned = htmx.on('custom', callback)
        assert.equal(returned, callback)
    })

    it('receives event object', function () {
        let receivedEvent = null
        htmx.on('custom:test2', (evt) => receivedEvent = evt)
        document.dispatchEvent(new Event('custom:test2'))
        assert.isNotNull(receivedEvent)
        assert.equal(receivedEvent.type, 'custom:test2')
    })

    it('works with selector string for element', function () {
        createProcessedHTML('<div id="target"></div>')
        let called = false
        htmx.on('#target', 'custom', () => called = true)
        document.getElementById('target').dispatchEvent(new Event('custom'))
        assert.isTrue(called)
    })

});