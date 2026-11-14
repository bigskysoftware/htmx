/**
 * Shipping htmx 4.0.0 HCON, copied for corpus comparison only.
 * Not used by the strict parser.
 */
export const legacy = {
    parse(string) {
        if (!string) return {}
        if (string.startsWith('{')) return JSON.parse(string)
        let pattern = /(?:"([^"]+)"|'([^']+)'|([^\s,:]+))(?:\s*:\s*(?:"([^"]*)"|'([^']*)'|<((?:[^/]|\/(?!>))+)\/>|([^\s,]+)))?(?=\s|,|$)/g
        let result = {}
        for (let match of string.matchAll(pattern)) {
            let [,
                doubleQuotedKey,
                singleQuotedKey,
                bareKey,
                doubleQuotedValue,
                singleQuotedValue,
                hyperscriptValue,
                bareValue,
            ] = match
            let key = doubleQuotedKey ?? singleQuotedKey ?? bareKey
            let value = (doubleQuotedValue ?? singleQuotedValue ?? hyperscriptValue ?? bareValue ?? 'true').trim()
            try { value = JSON.parse(value) } catch {}
            let isDottedPath = bareKey?.includes('.')
            let pair = isDottedPath
                ? key.split('.').reduceRight((acc, segment) => ({ [segment]: acc }), value)
                : { [key]: value }
            legacy.merge(pair, result)
        }
        return result
    },
    split(string) {
        return string.split(/,(?![^\[]*\])(?![^(]*\))(?![^<]*\/>)(?=(?:[^"']|"[^"]*"|'[^']*')*$)/)
    },
    merge(source, target) {
        if (typeof source === 'string') source = legacy.parse(source)
        for (let [key, val] of Object.entries(source)) {
            if (['__proto__', 'constructor', 'prototype'].includes(key)) continue
            let sourceIsObject = val?.constructor === Object
            let targetIsObject = target[key]?.constructor === Object
            if (sourceIsObject && targetIsObject) legacy.merge(val, target[key])
            else target[key] = val
        }
        return target
    },
}
