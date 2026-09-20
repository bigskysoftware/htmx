/**
 * Strict HCON: recursive-descent map language.
 * No regex. Spec: ../GRAMMAR.md
 */

export class HconError extends Error {
    constructor(message, index, input) {
        super(message)
        this.name = 'HconError'
        this.index = index
        this.input = input
    }
}

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

function isWs(c) {
    return c === ' ' || c === '\t' || c === '\n' || c === '\r'
}

function isIdentChar(c) {
    return c != null && c !== ':' && c !== ',' && !isWs(c)
}

function isDigit(c) {
    return c >= '0' && c <= '9'
}

class Parser {
    constructor(input) {
        this.s = input == null ? '' : String(input)
        this.i = 0
    }

    peek() {
        return this.s[this.i]
    }

    eof() {
        return this.i >= this.s.length
    }

    eat() {
        return this.s[this.i++]
    }

    fail(message) {
        throw new HconError(message + ' at ' + this.i, this.i, this.s)
    }

    skipWs() {
        while (isWs(this.peek())) this.i++
    }

    parseInput() {
        this.skipWs()
        if (this.eof()) return {}
        if (this.peek() === '{') return this.parseJson()
        let map = this.parseMap()
        this.skipWs()
        if (!this.eof()) this.fail('leftover input ' + JSON.stringify(this.s.slice(this.i)))
        return map
    }

    parseList() {
        this.skipWs()
        if (this.eof()) return []
        if (this.peek() === '{') return [this.parseJson()]
        let maps = [this.parseMap()]
        this.skipWs()
        while (this.peek() === ',') {
            this.eat()
            this.skipWs()
            if (this.eof()) this.fail('trailing comma in list')
            maps.push(this.parseMap())
            this.skipWs()
        }
        if (!this.eof()) this.fail('leftover input ' + JSON.stringify(this.s.slice(this.i)))
        return maps
    }

    parseJson() {
        try {
            return JSON.parse(this.s)
        } catch (e) {
            throw new HconError('invalid JSON: ' + e.message, this.i, this.s)
        }
    }

    parseMap() {
        let map = {}
        let pair = this.parsePair()
        this.assign(map, pair)
        for (;;) {
            let start = this.i
            this.skipWs()
            if (this.eof() || this.peek() === ',') {
                this.i = start
                break
            }
            if (!isIdentChar(this.peek()) && this.peek() !== '"' && this.peek() !== "'") {
                this.i = start
                break
            }
            pair = this.parsePair()
            this.assign(map, pair)
        }
        return map
    }

    parsePair() {
        let keyInfo = this.parseKey()
        this.skipWs()
        let value = true
        if (this.peek() === ':') {
            this.eat()
            this.skipWs()
            value = this.parseValue()
        }
        return { keyInfo, value }
    }

    parseKey() {
        if (this.peek() === '"' || this.peek() === "'") {
            return { key: this.parseQuoted(), dotted: false }
        }
        let ident = this.parseIdent()
        if (ident.includes('.')) {
            return { key: ident, dotted: true }
        }
        return { key: ident, dotted: false }
    }

    parseValue() {
        let c = this.peek()
        if (c === '"' || c === "'") return this.parseQuoted()
        if (c === '<') return this.parseHyperscript()
        if (c === '-' || isDigit(c)) {
            let num = this.tryNumber()
            if (num !== null) return num
        }
        let ident = this.parseIdent()
        if (ident === 'true') return true
        if (ident === 'false') return false
        return ident
    }

    parseQuoted() {
        let q = this.eat()
        let out = ''
        while (!this.eof()) {
            let c = this.eat()
            if (c === q) return out
            if (c === '\\') {
                if (this.eof()) this.fail('unterminated escape')
                let n = this.eat()
                if (n === q || n === '\\') out += n
                else out += n
            } else {
                out += c
            }
        }
        this.fail('unterminated ' + q + ' string')
    }

    parseHyperscript() {
        this.eat()
        let out = ''
        while (!this.eof()) {
            if (this.peek() === '/' && this.s[this.i + 1] === '>') {
                this.i += 2
                return out
            }
            out += this.eat()
        }
        this.fail('unterminated <.../> string')
    }

    parseIdent() {
        if (!isIdentChar(this.peek())) this.fail('expected ident')
        let start = this.i
        while (isIdentChar(this.peek())) this.eat()
        return this.s.slice(start, this.i)
    }

    tryNumber() {
        let start = this.i
        if (this.peek() === '-') this.eat()
        if (!isDigit(this.peek())) {
            this.i = start
            return null
        }
        while (isDigit(this.peek())) this.eat()
        if (this.peek() === '.') {
            let dot = this.i
            this.eat()
            if (!isDigit(this.peek())) {
                this.i = start
                return null
            }
            while (isDigit(this.peek())) this.eat()
            void dot
        }
        if (this.peek() === 'e' || this.peek() === 'E') {
            let e = this.i
            this.eat()
            if (this.peek() === '+' || this.peek() === '-') this.eat()
            if (!isDigit(this.peek())) {
                this.i = start
                return null
            }
            while (isDigit(this.peek())) this.eat()
            void e
        }
        if (isIdentChar(this.peek())) {
            this.i = start
            return null
        }
        return Number(this.s.slice(start, this.i))
    }

    assign(map, { keyInfo, value }) {
        if (keyInfo.dotted) {
            let segs = keyInfo.key.split('.')
            if (segs.some((s) => FORBIDDEN_KEYS.has(s))) return
            let cur = map
            for (let i = 0; i < segs.length - 1; i++) {
                let seg = segs[i]
                if (cur[seg] == null || typeof cur[seg] !== 'object') cur[seg] = {}
                cur = cur[seg]
            }
            let last = segs[segs.length - 1]
            if (!FORBIDDEN_KEYS.has(last)) cur[last] = value
            return
        }
        if (FORBIDDEN_KEYS.has(keyInfo.key)) return
        map[keyInfo.key] = value
    }
}

export function parse(input) {
    return new Parser(input).parseInput()
}

export function parseList(input) {
    return new Parser(input).parseList()
}

export function stringify(map) {
    if (map == null || typeof map !== 'object' || Array.isArray(map)) {
        return JSON.stringify(map)
    }
    let parts = []
    stringifyInto(map, '', parts)
    return parts.join(' ')
}

function stringifyInto(obj, prefix, parts) {
    for (let [k, v] of Object.entries(obj)) {
        if (FORBIDDEN_KEYS.has(k)) continue
        let path = prefix ? prefix + '.' + k : k
        if (v && typeof v === 'object' && !Array.isArray(v)) {
            stringifyInto(v, path, parts)
        } else {
            parts.push(formatPair(path, v))
        }
    }
}

function formatPair(key, value) {
    let k = needsQuote(key) ? '"' + escapeStr(key) + '"' : key
    if (value === true) return k
    if (value === false) return k + ':false'
    if (typeof value === 'number') return k + ':' + String(value)
    if (typeof value === 'string') {
        if (value === 'true' || value === 'false' || looksLikeNumber(value) || needsQuote(value)) {
            return k + ':"' + escapeStr(value) + '"'
        }
        return k + ':' + value
    }
    return k + ':' + JSON.stringify(value)
}

function needsQuote(s) {
    if (s.length === 0) return true
    for (let i = 0; i < s.length; i++) {
        let c = s[i]
        if (isWs(c) || c === ':' || c === ',' || c === '"' || c === "'") return true
    }
    return false
}

function looksLikeNumber(s) {
    if (s.length === 0) return false
    let i = 0
    if (s[i] === '-') i++
    if (i >= s.length || !isDigit(s[i])) return false
    while (i < s.length && isDigit(s[i])) i++
    if (s[i] === '.') {
        i++
        if (!isDigit(s[i])) return false
        while (i < s.length && isDigit(s[i])) i++
    }
    return i === s.length
}

function escapeStr(s) {
    let out = ''
    for (let i = 0; i < s.length; i++) {
        let c = s[i]
        if (c === '"' || c === '\\') out += '\\' + c
        else out += c
    }
    return out
}
