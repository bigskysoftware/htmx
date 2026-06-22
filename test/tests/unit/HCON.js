const HCON = htmx.__HCON;

describe('HCON unit tests', function() {

    it('parses simple key-value pair', function () {
        let parsed = HCON.parse('delay:100ms')
        assert.equal(parsed.delay, '100ms')
    })

    it('parses boolean true', function () {
        let parsed = HCON.parse('once')
        assert.equal(parsed.once, true)
    })

    it('parses boolean false', function () {
        let parsed = HCON.parse('once:false')
        assert.equal(parsed.once, false)
    })

    it('parses integer value', function () {
        let parsed = HCON.parse('count:42')
        assert.equal(parsed.count, 42)
    })

    it('parses multiple key-value pairs', function () {
        let parsed = HCON.parse('delay:100ms throttle:200ms')
        assert.equal(parsed.delay, '100ms')
        assert.equal(parsed.throttle, '200ms')
    })

    it('parses comma-separated pairs', function () {
        let parsed = HCON.parse('delay:100ms, throttle:200ms')
        assert.equal(parsed.delay, '100ms')
        assert.equal(parsed.throttle, '200ms')
    })

    it('parses double-quoted string', function () {
        let parsed = HCON.parse('target:"#foo .bar"')
        assert.equal(parsed.target, '#foo .bar')
    })

    it('parses single-quoted string', function () {
        let parsed = HCON.parse("target:'#foo .bar'")
        assert.equal(parsed.target, '#foo .bar')
    })

    it('parses nested object with dot notation', function () {
        let parsed = HCON.parse('sse.mode:once')
        assert.equal(parsed.sse.mode, 'once')
    })

    it('parses multiple nested properties', function () {
        let parsed = HCON.parse('sse.mode:once sse.maxRetries:5')
        assert.equal(parsed.sse.mode, 'once')
        assert.equal(parsed.sse.maxRetries, 5)
    })

    it('parses JSON object', function () {
        let parsed = HCON.parse('{"delay":"100ms","throttle":"200ms"}')
        assert.equal(parsed.delay, '100ms')
        assert.equal(parsed.throttle, '200ms')
    })

    it('parses JSON with nested object', function () {
        let parsed = HCON.parse('{"sse":{"mode":"once","maxRetries":5}}')
        assert.equal(parsed.sse.mode, 'once')
        assert.equal(parsed.sse.maxRetries, 5)
    })

    it('parses JSON with boolean', function () {
        let parsed = HCON.parse('{"once":true,"changed":false}')
        assert.equal(parsed.once, true)
        assert.equal(parsed.changed, false)
    })

    it('handles empty string', function () {
        let parsed = HCON.parse('')
        assert.deepEqual(parsed, {})
    })

    it('handles whitespace', function () {
        let parsed = HCON.parse('  delay:100ms  ')
        assert.equal(parsed.delay, '100ms')
    })

    it('blocks __proto__ pollution via dotted keys', function () {
        let before = ({}).polluted;
        HCON.parse('__proto__.polluted: true');
        assert.equal(({}).polluted, before);
    })

    it('blocks constructor pollution via dotted keys', function () {
        let before = ({}).hacked;
        HCON.parse('constructor.prototype.hacked: true');
        assert.equal(({}).hacked, before);
    })

    it('parses unparseable value as string', function () {
        let parsed = HCON.parse('foo:bar')
        assert.equal(parsed.foo, 'bar')
    })

    it('parses quoted dotted key literally', function () {
        let parsed = HCON.parse('"a.b":1')
        assert.equal(parsed['a.b'], 1)
        assert.isUndefined(parsed.a)
    })

    it('parses single-quoted dotted key literally', function () {
        let parsed = HCON.parse("'a.b':1")
        assert.equal(parsed['a.b'], 1)
        assert.isUndefined(parsed.a)
    })

    it('parses quoted value with comma', function () {
        let parsed = HCON.parse('x:"hello, world"')
        assert.equal(parsed.x, 'hello, world')
    })

    it('parses JSON array inside quoted value', function () {
        let parsed = HCON.parse('x:"[1, 2, 3]"')
        assert.deepEqual(parsed.x, [1, 2, 3])
    })

    // hyperscript value form (CSS selectors of every shape)

    it('parses hyperscript value: simple selector', function () {
        let parsed = HCON.parse('from:<.foo/>')
        assert.equal(parsed.from, '.foo')
    })

    it('parses hyperscript value: descendant selector', function () {
        let parsed = HCON.parse('from:<div p/>')
        assert.equal(parsed.from, 'div p')
    })

    it('parses hyperscript value: child combinator (>)', function () {
        let parsed = HCON.parse('from:<ul > li/>')
        assert.equal(parsed.from, 'ul > li')
    })

    it('parses hyperscript value: adjacent sibling (+)', function () {
        let parsed = HCON.parse('from:<h1 + p/>')
        assert.equal(parsed.from, 'h1 + p')
    })

    it('parses hyperscript value: general sibling (~)', function () {
        let parsed = HCON.parse('from:<h1 ~ p/>')
        assert.equal(parsed.from, 'h1 ~ p')
    })

    it('parses hyperscript value: class chain', function () {
        let parsed = HCON.parse('from:<.a.b.c/>')
        assert.equal(parsed.from, '.a.b.c')
    })

    it('parses hyperscript value: id + class', function () {
        let parsed = HCON.parse('from:<#id.class/>')
        assert.equal(parsed.from, '#id.class')
    })

    it('parses hyperscript value: attribute selector', function () {
        let parsed = HCON.parse('from:<[data-x="y"]/>')
        assert.equal(parsed.from, '[data-x="y"]')
    })

    it('parses hyperscript value: attribute selector with comma', function () {
        let parsed = HCON.parse('from:<[data-list="a, b"]/>')
        assert.equal(parsed.from, '[data-list="a, b"]')
    })

    it('parses hyperscript value: :not() with comma', function () {
        let parsed = HCON.parse('from:<:not(.a, .b)/>')
        assert.equal(parsed.from, ':not(.a, .b)')
    })

    it('parses hyperscript value: :has() with child combinator', function () {
        let parsed = HCON.parse('from:<div:has(> .child)/>')
        assert.equal(parsed.from, 'div:has(> .child)')
    })

    it('parses hyperscript value: :nth-child', function () {
        let parsed = HCON.parse('from:<li:nth-child(2n+1)/>')
        assert.equal(parsed.from, 'li:nth-child(2n+1)')
    })

    it('parses hyperscript value: selector group (comma-separated)', function () {
        let parsed = HCON.parse('from:<.a, .b, .c/>')
        assert.equal(parsed.from, '.a, .b, .c')
    })

    it('parses hyperscript value: complex multi-combinator selector', function () {
        let parsed = HCON.parse('from:<.list > li:not(.disabled, .hidden) + .item/>')
        assert.equal(parsed.from, '.list > li:not(.disabled, .hidden) + .item')
    })

    it('parses hyperscript value followed by another modifier', function () {
        let parsed = HCON.parse('from:<ul > li/> throttle:50ms')
        assert.equal(parsed.from, 'ul > li')
        assert.equal(parsed.throttle, '50ms')
    })

});

describe('HCON.split unit tests', function() {

    // trivial

    it('splits empty string into one empty part', function () {
        assert.deepEqual(HCON.split(''), [''])
    })

    it('returns a single value untouched', function () {
        assert.deepEqual(HCON.split('foo'), ['foo'])
    })

    it('splits two values', function () {
        assert.deepEqual(HCON.split('foo,bar'), ['foo', 'bar'])
    })

    it('splits three values', function () {
        assert.deepEqual(HCON.split('a,b,c'), ['a', 'b', 'c'])
    })

    it('preserves whitespace around commas', function () {
        assert.deepEqual(HCON.split('foo , bar'), ['foo ', ' bar'])
    })

    // edges with empties

    it('produces empty part for trailing comma', function () {
        assert.deepEqual(HCON.split('foo,'), ['foo', ''])
    })

    it('produces empty part for leading comma', function () {
        assert.deepEqual(HCON.split(',foo'), ['', 'foo'])
    })

    it('produces empty parts for consecutive commas', function () {
        assert.deepEqual(HCON.split('a,,b'), ['a', '', 'b'])
    })

    it('produces only empties for only-commas input', function () {
        assert.deepEqual(HCON.split(',,'), ['', '', ''])
    })

    // bracket protection

    it('does not split commas inside []', function () {
        assert.deepEqual(HCON.split('click[fn(a,b)],keyup'), ['click[fn(a,b)]', 'keyup'])
    })

    it('does not split commas inside attribute selector value', function () {
        assert.deepEqual(HCON.split('[data-x="a,b"],.c'), ['[data-x="a,b"]', '.c'])
    })

    // paren protection

    it('does not split commas inside ()', function () {
        assert.deepEqual(HCON.split('.x:not(.a, .b),.c'), ['.x:not(.a, .b)', '.c'])
    })

    it('does not split commas inside nested pseudo-classes', function () {
        assert.deepEqual(HCON.split(':has(.a, .b),.c'), [':has(.a, .b)', '.c'])
    })

    // hyperscript protection

    it('does not split commas inside <.../>', function () {
        assert.deepEqual(HCON.split('<doX(a, b)/>,change'), ['<doX(a, b)/>', 'change'])
    })

    it('does not split commas inside <.../> with > combinator', function () {
        assert.deepEqual(HCON.split('<ul > li:not(.a, .b)/>,next'), ['<ul > li:not(.a, .b)/>', 'next'])
    })

    // quote protection

    it('does not split commas inside double-quoted values', function () {
        assert.deepEqual(HCON.split('from:".a, .b",intersect'), ['from:".a, .b"', 'intersect'])
    })

    it('does not split commas inside single-quoted values', function () {
        assert.deepEqual(HCON.split("from:'.a, .b',intersect"), ["from:'.a, .b'", 'intersect'])
    })

    // combined protections

    it('protects nested protections (bracket containing paren)', function () {
        assert.deepEqual(HCON.split('[fn(a, b)],x'), ['[fn(a, b)]', 'x'])
    })

    it('handles all four protections in one input', function () {
        let input = '[a,b],(c,d),<e,f/>,"g,h",i'
        assert.deepEqual(HCON.split(input), ['[a,b]', '(c,d)', '<e,f/>', '"g,h"', 'i'])
    })

    // realistic inputs

    it('splits realistic trigger spec', function () {
        let result = HCON.split('click from:".a, .b", change from:<ul > li/>')
        assert.equal(result.length, 2)
        assert.equal(result[0], 'click from:".a, .b"')
        assert.equal(result[1], ' change from:<ul > li/>')
    })

    it('splits realistic selector list', function () {
        let result = HCON.split('closest .parent, find :not(.a, .b), .other')
        assert.equal(result.length, 3)
        assert.equal(result[0], 'closest .parent')
        assert.equal(result[1], ' find :not(.a, .b)')
        assert.equal(result[2], ' .other')
    })

    // unbalanced (best-effort recovery)

    it('still splits after unbalanced bracket (best-effort)', function () {
        let result = HCON.split('foo[bar,baz')
        assert.equal(result.length, 2)
    })

});

describe('HCON.merge unit tests', function() {

    // trivial

    it('returns target unchanged when source is empty object', function () {
        let target = { a: 1 }
        let result = HCON.merge({}, target)
        assert.deepEqual(result, { a: 1 })
        assert.strictEqual(result, target)
    })

    it('copies source key into empty target', function () {
        let result = HCON.merge({ a: 1 }, {})
        assert.deepEqual(result, { a: 1 })
    })

    it('mutates target in place and returns it', function () {
        let target = {}
        let result = HCON.merge({ a: 1 }, target)
        assert.strictEqual(result, target)
        assert.equal(target.a, 1)
    })

    // shallow merge

    it('merges non-overlapping keys', function () {
        let result = HCON.merge({ b: 2 }, { a: 1 })
        assert.deepEqual(result, { a: 1, b: 2 })
    })

    it('overwrites scalar values', function () {
        let result = HCON.merge({ a: 2 }, { a: 1 })
        assert.equal(result.a, 2)
    })

    // deep merge

    it('deep-merges 2-level nested objects preserving siblings', function () {
        let result = HCON.merge({ sse: { mode: 'once' } }, { sse: { maxRetries: 5 } })
        assert.deepEqual(result, { sse: { mode: 'once', maxRetries: 5 } })
    })

    it('deep-merges 3-level nested objects preserving siblings (the bug fix)', function () {
        let result = HCON.merge(
            { sse: { connection: { retries: 3 } } },
            { sse: { connection: { timeout: 5000 } } }
        )
        assert.deepEqual(result, { sse: { connection: { timeout: 5000, retries: 3 } } })
    })

    it('deep-merges 4-level nested objects', function () {
        let result = HCON.merge(
            { a: { b: { c: { d: 1 } } } },
            { a: { b: { c: { e: 2 } } } }
        )
        assert.deepEqual(result, { a: { b: { c: { d: 1, e: 2 } } } })
    })

    // type clashes

    it('overwrites object target with scalar source', function () {
        let result = HCON.merge({ a: 'x' }, { a: { b: 1 } })
        assert.equal(result.a, 'x')
    })

    it('overwrites scalar target with object source', function () {
        let result = HCON.merge({ a: { b: 1 } }, { a: 'x' })
        assert.deepEqual(result.a, { b: 1 })
    })

    it('does not deep-merge arrays (replaces them)', function () {
        let result = HCON.merge({ list: [3, 4] }, { list: [1, 2] })
        assert.deepEqual(result.list, [3, 4])
    })

    // string source (auto-parse)

    it('parses an HCON string source', function () {
        let result = HCON.merge('a:1 b:2', {})
        assert.deepEqual(result, { a: 1, b: 2 })
    })

    it('parses a JSON-format string source', function () {
        let result = HCON.merge('{"a":1,"b":2}', {})
        assert.deepEqual(result, { a: 1, b: 2 })
    })

    it('parses dotted HCON keys into nested merge', function () {
        let result = HCON.merge('sse.mode:once', { sse: { existing: true } })
        assert.deepEqual(result.sse, { existing: true, mode: 'once' })
    })

    // pollution guard

    it('skips __proto__ key from source', function () {
        let target = {}
        HCON.merge({ __proto__: { polluted: true } }, target)
        assert.isUndefined(({}).polluted)
    })

    it('skips constructor key from source', function () {
        let target = {}
        HCON.merge({ constructor: { hacked: true } }, target)
        assert.isUndefined(({}).hacked)
    })

    it('skips prototype key from source', function () {
        let target = {}
        HCON.merge({ prototype: { hacked: true } }, target)
        assert.equal(target.prototype, undefined)
    })

});

