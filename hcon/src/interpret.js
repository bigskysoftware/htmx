/**
 * Attribute hosts interpret maps. They do not re-tokenize.
 */

import { HconError, parse, parseList } from './hcon.js'

export const SWAP_STYLES = new Set([
    'innerHTML', 'outerHTML', 'textContent',
    'beforebegin', 'afterbegin', 'beforeend', 'afterend',
    'before', 'after', 'prepend', 'append',
    'innerMorph', 'outerMorph', 'outerSync',
    'delete', 'none', 'upsert',
])

export function normalizeSwapStyle(style) {
    return style === 'before' ? 'beforebegin'
        : style === 'after' ? 'afterend'
        : style === 'prepend' ? 'afterbegin'
        : style === 'append' ? 'beforeend'
        : style
}

export function interpretSwap(map, defaultStyle = 'innerHTML') {
    if (map == null || typeof map !== 'object') {
        throw new HconError('interpretSwap expects a map', 0, '')
    }
    for (let k of Object.keys(map)) {
        if (k !== 'style' && SWAP_STYLES.has(normalizeSwapStyle(k)) && map[k] !== true) {
            throw new HconError(
                "colon form is not HCON: " + k + ":" + map[k] + " — write `" + k + " target:'…'`",
                0,
                '',
            )
        }
    }
    let rest = { ...map }
    let style
    if (typeof rest.style === 'string') {
        style = rest.style
        delete rest.style
    } else {
        let flags = Object.keys(rest).filter((k) => rest[k] === true && SWAP_STYLES.has(normalizeSwapStyle(k)))
        if (flags.length > 1) {
            throw new HconError('multiple swap styles: ' + flags.join(', '), 0, '')
        }
        if (flags.length === 1) {
            style = flags[0]
            delete rest[flags[0]]
        }
    }
    return { style: normalizeSwapStyle(style || defaultStyle), ...rest }
}

export function interpretOob(map, defaultTarget, defaultStyle = 'outerHTML') {
    let spec = interpretSwap(map, defaultStyle)
    let target = spec.target || defaultTarget
    delete spec.target
    if (!target) throw new HconError('oob swap has no target', 0, '')
    return { ...spec, target }
}

export function interpretTrigger(map) {
    if (typeof map.every === 'string') {
        let { every, ...rest } = map
        return { name: 'every', interval: every, ...rest }
    }
    let flags = Object.keys(map).filter((k) => map[k] === true)
    if (flags.length === 0) {
        throw new HconError('trigger map has no event name', 0, '')
    }
    let name = flags[0]
    let rest = { ...map }
    delete rest[name]
    return { name, ...rest }
}

export function parseSwap(input, defaultStyle = 'innerHTML') {
    return interpretSwap(parse(input), defaultStyle)
}

export function parseOob(input, defaultTarget) {
    return interpretOob(parse(input), defaultTarget)
}

export function parseTriggers(input) {
    return parseList(input).map(interpretTrigger)
}
