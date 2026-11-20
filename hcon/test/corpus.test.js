import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, parseList, HconError } from '../src/hcon.js'
import { parseOob } from '../src/interpret.js'
import { legacy } from '../src/legacy.js'

const corpus = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'corpus.json'), 'utf8'))

test('corpus: both parsers agree', () => {
    for (let [input, expected] of corpus.both) {
        assert.deepEqual(parse(input), expected, 'strict ' + JSON.stringify(input))
        assert.deepEqual(legacy.parse(input), expected, 'legacy ' + JSON.stringify(input))
    }
})

test('corpus: legacy_only — 4.0.0 accepts, strict differs or errors', () => {
    for (let row of corpus.legacy_only) {
        assert.deepEqual(legacy.parse(row.input), row.legacy, row.why)
        let strict
        try {
            strict = parse(row.input)
        } catch (e) {
            assert.ok(e instanceof HconError, row.input)
            continue
        }
        assert.notDeepEqual(strict, row.legacy, 'strict should not match legacy for ' + row.input)
    }
})

test('corpus: strict_error', () => {
    for (let [input] of corpus.strict_error) {
        assert.throws(() => parse(input), HconError, input)
    }
})

test('corpus: interpret_error', () => {
    for (let [input] of corpus.interpret_error) {
        assert.throws(() => parseOob(input, '#x'), HconError, input)
    }
})

test('corpus: list_both', () => {
    for (let [input, expected] of corpus.list_both) {
        assert.deepEqual(parseList(input), expected, input)
    }
})
