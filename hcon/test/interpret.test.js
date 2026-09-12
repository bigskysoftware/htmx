import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseSwap, parseOob, parseTriggers } from '../src/interpret.js'
import { parse } from '../src/hcon.js'

test('hx-swap: style flag then modifiers', () => {
    assert.deepEqual(parseSwap('innerHTML swap:200ms'), {
        style: 'innerHTML',
        swap: '200ms',
    })
})

test('hx-swap: alias append → beforeend', () => {
    assert.equal(parseSwap('append').style, 'beforeend')
})

test('hx-swap: JSON style key', () => {
    assert.deepEqual(parseSwap('{"style":"outerHTML","swap":"200ms"}'), {
        style: 'outerHTML',
        swap: '200ms',
    })
})

test('hx-swap: quoted target', () => {
    let spec = parseSwap("innerHTML target:'#table tbody'")
    assert.equal(spec.style, 'innerHTML')
    assert.equal(spec.target, '#table tbody')
})

test('hx-swap-oob: HCON target, not colon form', () => {
    let spec = parseOob("beforeend target:'#table tbody'")
    assert.equal(spec.style, 'beforeend')
    assert.equal(spec.target, '#table tbody')
})

test('hx-swap-oob: innerHTML:#legacy is NOT colon form', () => {
    let map = parse('innerHTML:#legacy')
    assert.deepEqual(map, { innerHTML: '#legacy' })
    let spec = parseOob('innerHTML target:#legacy', '#id')
    assert.equal(spec.style, 'innerHTML')
    assert.equal(spec.target, '#legacy')
})

test('hx-swap-oob: default target when no target key', () => {
    let spec = parseOob('true', '#alerts')
    assert.equal(spec.style, 'outerHTML')
    assert.equal(spec.target, '#alerts')
})

test('hx-trigger list', () => {
    let specs = parseTriggers('click delay:500ms, keyup once')
    assert.equal(specs.length, 2)
    assert.equal(specs[0].name, 'click')
    assert.equal(specs[0].delay, '500ms')
    assert.equal(specs[1].name, 'keyup')
    assert.equal(specs[1].once, true)
})

test('hx-trigger every:2s', () => {
    let [spec] = parseTriggers('every:2s')
    assert.equal(spec.name, 'every')
    assert.equal(spec.interval, '2s')
})

test('multiple swap style flags error', () => {
    assert.throws(() => parseSwap('innerHTML outerHTML'))
})
