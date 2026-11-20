import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const FILES = ['src/hcon.js', 'src/interpret.js']

const FORBIDDEN = [
    'new RegExp',
    '.matchAll(',
    '.match(',
    '.split(/',
    '.search(',
    '.replace(/',
    '.test(',
]

test('parser surface has no regex', () => {
    let hits = []
    for (let rel of FILES) {
        let text = readFileSync(join(root, rel), 'utf8')
        let lines = text.split('\n')
        lines.forEach((line, i) => {
            if (line.trimStart().startsWith('*') || line.trimStart().startsWith('//')) return
            for (let needle of FORBIDDEN) {
                if (line.includes(needle)) hits.push(rel + ':' + (i + 1) + ' ' + needle)
            }
        })
    }
    assert.deepEqual(hits, [])
})
