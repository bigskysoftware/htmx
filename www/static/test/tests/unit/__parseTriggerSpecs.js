describe('__parseTriggerSpecs unit tests', function() {

    it('parses single event', function () {
        let specs = htmx.__parseTriggerSpecs('click')
        assert.equal(specs.length, 1)
        assert.equal(specs[0].name, 'click')
    })

    it('parses multiple events with comma', function () {
        let specs = htmx.__parseTriggerSpecs('click, change')
        assert.equal(specs.length, 2)
        assert.equal(specs[0].name, 'click')
        assert.equal(specs[1].name, 'change')
    })

    it('parses event with modifier value', function () {
        let specs = htmx.__parseTriggerSpecs('click delay:100ms')
        assert.equal(specs.length, 1)
        assert.equal(specs[0].name, 'click')
        assert.equal(specs[0].delay, '100ms')
    })

    it('parses event with boolean modifier', function () {
        let specs = htmx.__parseTriggerSpecs('click once')
        assert.equal(specs.length, 1)
        assert.equal(specs[0].name, 'click')
        assert.equal(specs[0].once, true)
    })

    it('parses event with multiple modifiers', function () {
        let specs = htmx.__parseTriggerSpecs('click delay:100ms throttle:200ms once')
        assert.equal(specs.length, 1)
        assert.equal(specs[0].name, 'click')
        assert.equal(specs[0].delay, '100ms')
        assert.equal(specs[0].throttle, '200ms')
        assert.equal(specs[0].once, true)
    })

    it('parses event with from modifier', function () {
        let specs = htmx.__parseTriggerSpecs('click from:#other')
        assert.equal(specs.length, 1)
        assert.equal(specs[0].name, 'click')
        assert.equal(specs[0].from, '#other')
    })

    it('parses event with target modifier', function () {
        let specs = htmx.__parseTriggerSpecs('click target:.item')
        assert.equal(specs.length, 1)
        assert.equal(specs[0].name, 'click')
        assert.equal(specs[0].target, '.item')
    })

    it('parses event with consume modifier', function () {
        let specs = htmx.__parseTriggerSpecs('click consume')
        assert.equal(specs.length, 1)
        assert.equal(specs[0].name, 'click')
        assert.equal(specs[0].consume, true)
    })

    it('parses event with changed modifier', function () {
        let specs = htmx.__parseTriggerSpecs('change changed')
        assert.equal(specs.length, 1)
        assert.equal(specs[0].name, 'change')
        assert.equal(specs[0].changed, true)
    })

    it('parses event with filter', function () {
        let specs = htmx.__parseTriggerSpecs('click[ctrlKey]')
        assert.equal(specs.length, 1)
        assert.equal(specs[0].name, 'click[ctrlKey]')
    })

    it('parses event with filter containing spaces', function () {
        let specs = htmx.__parseTriggerSpecs('click[event.detail > 5]')
        assert.equal(specs.length, 1)
        assert.equal(specs[0].name, 'click[event.detail>5]')
    })

    it('preserves whitespace in string literals in filters', function () {
        let specs = htmx.__parseTriggerSpecs('click[event.detail === "hello world"]')
        assert.equal(specs.length, 1)
        assert.equal(specs[0].name, 'click[event.detail==="hello world"]')
    })

    it('parses multiple events with different modifiers', function () {
        let specs = htmx.__parseTriggerSpecs('click once, change delay:100ms')
        assert.equal(specs.length, 2)
        assert.equal(specs[0].name, 'click')
        assert.equal(specs[0].once, true)
        assert.equal(specs[1].name, 'change')
        assert.equal(specs[1].delay, '100ms')
    })

    it('parses every trigger', function () {
        let specs = htmx.__parseTriggerSpecs('every 1s')
        assert.equal(specs.length, 1)
        assert.equal(specs[0].name, 'every')
        assert.equal(specs[0]['1s'], true)
    })

    it('handles empty string', function () {
        let specs = htmx.__parseTriggerSpecs('')
        assert.equal(specs.length, 0)
    })

    it('handles whitespace only', function () {
        let specs = htmx.__parseTriggerSpecs('   ')
        assert.equal(specs.length, 0)
    })

    it('throws on unterminated filter', function () {
        assert.throws(() => {
            htmx.__parseTriggerSpecs('click[ctrlKey')
        })
    })

    it('parses complex trigger spec', function () {
        let specs = htmx.__parseTriggerSpecs('click[ctrlKey] delay:100ms throttle:200ms from:body target:.item once')
        assert.equal(specs.length, 1)
        assert.equal(specs[0].name, 'click[ctrlKey]')
        assert.equal(specs[0].delay, '100ms')
        assert.equal(specs[0].throttle, '200ms')
        assert.equal(specs[0].from, 'body')
        assert.equal(specs[0].target, '.item')
        assert.equal(specs[0].once, true)
    })

});