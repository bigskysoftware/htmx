describe('__tokenize unit tests', function() {

    it('tokenizes simple words', function () {
        assert.deepEqual(htmx.__tokenize('foo bar baz'), ['foo', 'bar', 'baz'])
    })

    it('tokenizes colons', function () {
        assert.deepEqual(htmx.__tokenize('foo:bar'), ['foo', ':', 'bar'])
    })

    it('tokenizes commas', function () {
        assert.deepEqual(htmx.__tokenize('foo,bar'), ['foo', ',', 'bar'])
    })

    it('tokenizes mixed delimiters', function () {
        assert.deepEqual(htmx.__tokenize('foo:bar,baz'), ['foo', ':', 'bar', ',', 'baz'])
    })

    it('handles double quotes', function () {
        assert.deepEqual(htmx.__tokenize('foo "bar baz" qux'), ['foo', '"bar baz"', 'qux'])
    })

    it('handles single quotes', function () {
        assert.deepEqual(htmx.__tokenize("foo 'bar baz' qux"), ['foo', "'bar baz'", 'qux'])
    })

    it('handles escaped quotes in double quotes', function () {
        assert.deepEqual(htmx.__tokenize('foo "bar\\"baz" qux'), ['foo', '"bar\\"baz"', 'qux'])
    })

    it('handles escaped quotes in single quotes', function () {
        assert.deepEqual(htmx.__tokenize("foo 'bar\\'baz' qux"), ['foo', "'bar\\'baz'", 'qux'])
    })

    it('preserves colons inside quotes', function () {
        assert.deepEqual(htmx.__tokenize('"foo:bar"'), ['"foo:bar"'])
    })

    it('preserves commas inside quotes', function () {
        assert.deepEqual(htmx.__tokenize('"foo,bar"'), ['"foo,bar"'])
    })

    it('handles multiple spaces', function () {
        assert.deepEqual(htmx.__tokenize('foo   bar'), ['foo', 'bar'])
    })

    it('handles leading whitespace', function () {
        assert.deepEqual(htmx.__tokenize('  foo bar'), ['foo', 'bar'])
    })

    it('handles trailing whitespace', function () {
        assert.deepEqual(htmx.__tokenize('foo bar  '), ['foo', 'bar'])
    })

    it('handles empty string', function () {
        assert.deepEqual(htmx.__tokenize(''), [])
    })

    it('handles whitespace only', function () {
        assert.deepEqual(htmx.__tokenize('   '), [])
    })

    it('handles complex trigger spec', function () {
        assert.deepEqual(
            htmx.__tokenize('click delay:100ms throttle:200ms'),
            ['click', 'delay', ':', '100ms', 'throttle', ':', '200ms']
        )
    })

    it('handles quoted values with modifiers', function () {
        assert.deepEqual(
            htmx.__tokenize('click target:"#my-id"'),
            ['click', 'target', ':', '"#my-id"']
        )
    })

    it('handles unclosed quotes', function () {
        assert.deepEqual(htmx.__tokenize('foo "bar'), ['foo', '"bar'])
    })

    it('handles escape at end of quoted string', function () {
        assert.deepEqual(htmx.__tokenize('foo "bar\\"'), ['foo', '"bar\\"'])
    })

});