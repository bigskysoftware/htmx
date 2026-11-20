import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parse, parseList, stringify, HconError } from '../src/hcon.js'

test('empty', () => {
    assert.deepEqual(parse(''), {})
    assert.deepEqual(parse('   '), {})
    assert.deepEqual(parseList(''), [])
})

test('flag', () => {
    assert.deepEqual(parse('once'), { once: true })
})

test('false', () => {
    assert.deepEqual(parse('once:false'), { once: false })
})

test('number vs duration', () => {
    assert.deepEqual(parse('count:42'), { count: 42 })
    assert.deepEqual(parse('delay:100ms'), { delay: '100ms' })
    assert.deepEqual(parse('n:-3.5'), { n: -3.5 })
})

test('quoted values stay strings', () => {
    assert.deepEqual(parse('count:"42"'), { count: '42' })
    assert.deepEqual(parse('flag:"true"'), { flag: 'true' })
    assert.deepEqual(parse('x:"[1, 2, 3]"'), { x: '[1, 2, 3]' })
})

test('quoted selector', () => {
    assert.deepEqual(parse("target:'#foo .bar'"), { target: '#foo .bar' })
    assert.deepEqual(parse('target:"#foo .bar"'), { target: '#foo .bar' })
})

test('hyperscript selector', () => {
    assert.deepEqual(parse('from:<#table tbody/>'), { from: '#table tbody' })
    assert.deepEqual(parse('from:<ul > li:not(.a, .b)/>'), { from: 'ul > li:not(.a, .b)' })
})

test('dotted keys', () => {
    assert.deepEqual(parse('sse.mode:once'), { sse: { mode: 'once' } })
    assert.deepEqual(parse('"a.b":1'), { 'a.b': 1 })
})

test('JSON fallback', () => {
    assert.deepEqual(parse('{"delay":"100ms"}'), { delay: '100ms' })
})

test('unquoted space is a second pair, not leftover', () => {
    assert.deepEqual(parse('message:hello world'), { message: 'hello', world: true })
    assert.deepEqual(parse('beforeend:#table tbody'), { beforeend: '#table', tbody: true })
})

test('comma in a Map is an error', () => {
    assert.throws(() => parse('delay:100ms, throttle:200ms'), HconError)
})

test('unterminated string errors', () => {
    assert.throws(() => parse('x:"abc'), HconError)
    assert.throws(() => parse('from:<div'), HconError)
})

test('comma is list separator not map separator', () => {
    assert.deepEqual(parseList('click delay:500ms, keyup'), [
        { click: true, delay: '500ms' },
        { keyup: true },
    ])
    assert.deepEqual(parseList("click from:'.a, .b', change"), [
        { click: true, from: '.a, .b' },
        { change: true },
    ])
})

test('trailing comma in list errors', () => {
    assert.throws(() => parseList('click,'), HconError)
})

test('prototype keys ignored', () => {
    let before = ({}).polluted
    parse('__proto__.polluted:true')
    assert.equal(({}).polluted, before)
})

test('stringify round-trip for maps', () => {
    for (let s of ['once', 'delay:100ms', 'innerHTML swap:200ms', "target:'#foo .bar'"]) {
        let a = parse(s)
        assert.deepEqual(parse(stringify(a)), a)
    }
})
