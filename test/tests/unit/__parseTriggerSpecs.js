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
        assert.equal(specs[0].name, 'click[event.detail > 5]')
    })

    it('preserves whitespace in string literals in filters', function () {
        let specs = htmx.__parseTriggerSpecs('click[event.detail === "hello world"]')
        assert.equal(specs.length, 1)
        assert.equal(specs[0].name, 'click[event.detail === "hello world"]')
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

    it('preserves commas inside filter', function () {
        let specs = htmx.__parseTriggerSpecs('click[myFunc(a,b)], keyup')
        assert.equal(specs.length, 2)
        assert.equal(specs[0].name, 'click[myFunc(a,b)]')
        assert.equal(specs[1].name, 'keyup')
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

    // ── quoted value commas (HCON value form, now reachable through hx-trigger) ──

    it('parses double-quoted value with comma', function () {
        let specs = htmx.__parseTriggerSpecs('pointerenter from:".grid, .brick"')
        assert.equal(specs.length, 1)
        assert.equal(specs[0].name, 'pointerenter')
        assert.equal(specs[0].from, '.grid, .brick')
    })

    it('parses single-quoted value with comma', function () {
        let specs = htmx.__parseTriggerSpecs("pointerenter from:'.grid, .brick'")
        assert.equal(specs.length, 1)
        assert.equal(specs[0].from, '.grid, .brick')
    })

    it('parses quoted value with trailing modifier', function () {
        let specs = htmx.__parseTriggerSpecs('pointerenter from:".a, .b" throttle:50ms')
        assert.equal(specs.length, 1)
        assert.equal(specs[0].from, '.a, .b')
        assert.equal(specs[0].throttle, '50ms')
    })

    it('parses quoted value among multiple specs', function () {
        let specs = htmx.__parseTriggerSpecs('click from:".a, .b", intersect')
        assert.equal(specs.length, 2)
        assert.equal(specs[0].name, 'click')
        assert.equal(specs[0].from, '.a, .b')
        assert.equal(specs[1].name, 'intersect')
    })

    it('parses quoted value combined with filter', function () {
        let specs = htmx.__parseTriggerSpecs('click[event.x > 0] from:".a, .b"')
        assert.equal(specs.length, 1)
        assert.equal(specs[0].name, 'click[event.x > 0]')
        assert.equal(specs[0].from, '.a, .b')
    })

    it('parses mixed double and single quoted specs', function () {
        let specs = htmx.__parseTriggerSpecs('click from:".a, .b", change from:\'.c, .d\'')
        assert.equal(specs.length, 2)
        assert.equal(specs[0].from, '.a, .b')
        assert.equal(specs[1].from, '.c, .d')
    })

    // ── quoted keys (JS-style; quoted means literal, no dot-nesting) ──

    it('parses double-quoted key', function () {
        let specs = htmx.__parseTriggerSpecs('click "from":body')
        assert.equal(specs[0].from, 'body')
    })

    it('parses single-quoted key', function () {
        let specs = htmx.__parseTriggerSpecs("click 'from':body")
        assert.equal(specs[0].from, 'body')
    })

    it('parses quoted key with space', function () {
        let specs = htmx.__parseTriggerSpecs('click "full name":alice')
        assert.equal(specs[0]['full name'], 'alice')
    })

    it('parses quoted dotted key literally', function () {
        let specs = htmx.__parseTriggerSpecs('click "user.id":42')
        assert.equal(specs[0]['user.id'], 42)
        assert.isUndefined(specs[0].user)
    })

    it('parses single-quoted dotted key literally', function () {
        let specs = htmx.__parseTriggerSpecs("click 'user.id':42")
        assert.equal(specs[0]['user.id'], 42)
        assert.isUndefined(specs[0].user)
    })

    it('parses bare dotted key as nested', function () {
        let specs = htmx.__parseTriggerSpecs('click user.id:42')
        assert.deepEqual(specs[0].user, {id: 42})
    })

    // ── filter regression checks (must not weaken existing protection) ─

    it('preserves commas inside parens in filter', function () {
        let specs = htmx.__parseTriggerSpecs('click[fn(a, b)], intersect')
        assert.equal(specs.length, 2)
        assert.equal(specs[0].name, 'click[fn(a, b)]')
        assert.equal(specs[1].name, 'intersect')
    })

    it('preserves commas inside braces in filter', function () {
        let specs = htmx.__parseTriggerSpecs('click[{a:1, b:2}]')
        assert.equal(specs.length, 1)
        assert.equal(specs[0].name, 'click[{a:1, b:2}]')
    })

    it('preserves commas inside regex in filter', function () {
        let specs = htmx.__parseTriggerSpecs('click[/a,b/.test(c)]')
        assert.equal(specs.length, 1)
        assert.equal(specs[0].name, 'click[/a,b/.test(c)]')
    })

    // ── malformed input ───────────────────────────────────────────────

    it('skips leading commas', function () {
        let specs = htmx.__parseTriggerSpecs(',click')
        assert.equal(specs.length, 1)
        assert.equal(specs[0].name, 'click')
    })

    it('skips trailing commas', function () {
        let specs = htmx.__parseTriggerSpecs('click,')
        assert.equal(specs.length, 1)
        assert.equal(specs[0].name, 'click')
    })

    it('skips multiple consecutive commas', function () {
        let specs = htmx.__parseTriggerSpecs('click,,,intersect')
        assert.equal(specs.length, 2)
        assert.equal(specs[0].name, 'click')
        assert.equal(specs[1].name, 'intersect')
    })

    // hyperscript value protection in trigger specs

    it('preserves > inside hyperscript value (CSS child combinator)', function () {
        let specs = htmx.__parseTriggerSpecs('click from:<ul > li/>')
        assert.equal(specs.length, 1)
        assert.equal(specs[0].name, 'click')
        assert.equal(specs[0].from, 'ul > li')
    })

    it('preserves comma inside hyperscript value', function () {
        let specs = htmx.__parseTriggerSpecs('click from:<:not(.a, .b)/>')
        assert.equal(specs.length, 1)
        assert.equal(specs[0].name, 'click')
        assert.equal(specs[0].from, ':not(.a, .b)')
    })

    it('preserves both > and comma in hyperscript value', function () {
        let specs = htmx.__parseTriggerSpecs('click from:<ul > li:not(.a, .b)/>, change')
        assert.equal(specs.length, 2)
        assert.equal(specs[0].name, 'click')
        assert.equal(specs[0].from, 'ul > li:not(.a, .b)')
        assert.equal(specs[1].name, 'change')
    })

    it('parses two specs each with hyperscript value', function () {
        let specs = htmx.__parseTriggerSpecs('click from:<ul > li/>, change from:<.a, .b/>')
        assert.equal(specs.length, 2)
        assert.equal(specs[0].from, 'ul > li')
        assert.equal(specs[1].from, '.a, .b')
    })

});