import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseSwap, parseOob, parseTriggers } from '../src/interpret.js'
import { parse } from '../src/hcon.js'
import { HconError } from '../src/hcon.js'

test('docs: hx-swap innerHTML swap:200ms settle:100ms scroll:top', () => {
    let spec = parseSwap('innerHTML swap:200ms settle:100ms scroll:top')
    assert.equal(spec.style, 'innerHTML')
    assert.equal(spec.swap, '200ms')
    assert.equal(spec.settle, '100ms')
    assert.equal(spec.scroll, 'top')
})

test('docs: hx-config timeout:30000', () => {
    assert.deepEqual(parse('timeout:30000'), { timeout: 30000 })
})

test('docs: meta htmx-config', () => {
    assert.deepEqual(parse('defaultSwap:outerHTML transitions:true'), {
        defaultSwap: 'outerHTML',
        transitions: true,
    })
})

test('docs: HX-Location path:"/new-page" push:"true"', () => {
    assert.deepEqual(parse('path:"/new-page" push:"true"'), {
        path: '/new-page',
        push: 'true',
    })
})

test('docs: hx-vals token:"abc" retry:3', () => {
    assert.deepEqual(parse('token:"abc" retry:3'), { token: 'abc', retry: 3 })
})

test('issue 4029: documented colon form is a Map, interpret rejects it', () => {
    assert.deepEqual(parse('beforeend:#table tbody'), { beforeend: '#table', tbody: true })
    assert.throws(() => parseOob('beforeend:#table tbody'), HconError)
    let spec = parseOob("beforeend target:'#table tbody'")
    assert.equal(spec.style, 'beforeend')
    assert.equal(spec.target, '#table tbody')
})

test('issue 2846: global selector is a quoted value', () => {
    let spec = parseOob("innerHTML target:'global #outside'", '#x')
    assert.equal(spec.target, 'global #outside')
})

test('hx-trigger from quoted descendant', () => {
    let [spec] = parseTriggers("keyup from:'closest form'")
    assert.equal(spec.name, 'keyup')
    assert.equal(spec.from, 'closest form')
})
