/**
 * htmx 4.0
 * Generated: 2026-02-17T19:00:30Z
 *
 * Modules:
 * - parser              RelaxedJSON parser — string to object transformation.
 * - swaps               DOM swaps — resolve target, parse content, dispatch on style.
 * - extended-selectors  Extended selector syntax — closest, next, previous, this, find.
 * - inheritance         Attribute inheritance — walk up DOM via :inherited/:append.
 * - delay-events        Debounce via options.delay on api.on().
 * - throttle-events     Rate-limit via options.throttle on api.on().
 * - default-trigger     Default trigger — wire click/change/submit based on element type.
 * - ajax                HTTP transport — fetch pipeline with request/response/swap phases.
 * - default-swap        Default swap style — apply config.defaultSwap when none is specified.
 * - hx-swap             Set swap style and modifiers from hx-swap attribute.
 * - hx-target           Resolve swap target from hx-target attribute.
 * - swap-aliases        Friendly swap names — before, prepend, append, after, remove.
 * - default-headers     Default headers — merge config.defaultHeaders into every request.
 * - hx-get              Issue GET request to hx-get URL on trigger.
 * - request-timeout     Request timeout via AbortSignal (default 60s).
 */
class HtmxError extends Error {
    constructor(message, options) {
        super(message, options)
        this.type = options?.type
    }
}

var htmx = (function () {
    'use strict'

    /** @typedef {{cleanup: function[]}} ElementState */
    /** @typedef {{name: string, requires?: string[], config?: Object<string, any>, on?: Object<string, function>, define?: Object<string, function>, wrap?: Object<string, function>}} Extension */
    /**
     * @typedef {Object} KernelConfig
     * @property {string} attributePrefix Attribute prefix used during discovery.
     * @property {string[]} attributeFilter Attributes observed for re-init.
     * Extension-defined config keys may be added during install/boot.
     */

    // ── Kernel Internals ────────────────────────────────────────────────────
    /** @type {boolean} True after boot runs. */
    let booted = false

    /** @type {WeakMap<Element, ElementState>} Per-element lifecycle state. */
    const elements = new WeakMap()

    /** @type {Object<string, string[]>} api fn -> wrapper extension names. */
    const wraps = {}

    // ── State ────────────────────────────────────────────────────────────────
    /** @type {Object<string, any>} Shared extension namespace. */
    const state = {}

    /** @returns {ElementState|undefined} Kernel state for a managed element. */
    state.elements = function (element) {
        return elements.get(element)
    }

    /** @type {Object<string, string[]>} Read-only wrapped api introspection. */
    state.wraps = wraps
    /** @type {Object<string, string>} Read-only api ownership: api fn -> defining extension. */
    state.defines = {}

    // ── Config ───────────────────────────────────────────────────────────────
    // Kernel owns attributePrefix and attributeFilter. Extensions declare
    // defaults via config: {} (merge: scalars ??=, arrays concat, objects per-key ??=).
    /** @type {KernelConfig} Kernel config surface. */
    const config = {
        /** @type {string} Attribute prefix for element discovery during init walks. */
        attributePrefix: 'hx-',
        /** @type {string[]} Attributes the MutationObserver watches for re-init. Empty = childList only. */
        attributeFilter: ['hx-swap' /* [hx-swap] */, 'hx-target' /* [hx-target] */, 'hx-get' /* [hx-get] */],
    
        // [inheritance]
        inheritance: {
            /** @type {'explicit'|'implicit'} Require `:inherited` suffix, or also match bare attributes. */
            mode: 'explicit',
            /** @type {string} Suffix marking an attribute as inheritable (e.g. `hx-get:inherited`). */
            inheritSuffix: 'inherited',
            /** @type {string} Suffix marking an attribute as appendable (e.g. `hx-swap:append`). */
            appendSuffix: 'append',
        },

        // [default-swap]
        defaultSwap: 'innerHTML',

        // [default-headers]
        defaultHeaders: {'HX-Request': 'true'},

        // [request-timeout]
        requestTimeout: 60000,
    }

    // ── Extensions ───────────────────────────────────────────────────────────

    /** @type {Extension[]} Installed extensions in order. */
    const extensions = []

    /**
     * Install an extension. Extensions run in installation order.
     *
     * @param {string} name - Unique extension name.
     * @param {{requires?: string[], config?: Object<string, any>, on?: Object<string, function>, define?: Object<string, function>, wrap?: Object<string, function>}} extension
     */
    function install(name, extension) {
        if (extensions.some(installed => installed.name === name)) {
            throw new HtmxError(`Extension "${name}" is already installed`, {type: 'EXTENSION_ALREADY_INSTALLED'})
        }
        for (const dependency of extension.requires || []) {
            if (!extensions.some(installed => installed.name === dependency)) {
                throw new HtmxError(`Extension "${name}" requires "${dependency}" to be installed first`, {type: 'EXTENSION_DEPENDENCY_MISSING'})
            }
        }

        // Apply declarative config (merge: scalars ??=, arrays concat, objects per-key ??=).
        if (extension.config) {
            for (const [key, value] of Object.entries(extension.config)) {
                if (!(key in config) || config[key] == null) {
                    config[key] = value
                } else if (Array.isArray(config[key]) && Array.isArray(value)) {
                    config[key].push(...value)
                } else if (typeof config[key] === 'object' && config[key] !== null
                           && typeof value === 'object' && value !== null
                           && !Array.isArray(config[key]) && !Array.isArray(value)) {
                    for (const [k, v] of Object.entries(value)) {
                        config[key][k] ??= v
                    }
                }
            }
        }

        // Apply declarative api definitions first so later wraps can target them.
        // Contract: define values are factories called once at install:
        //   define.foo(api) -> function foo(...)
        if (extension.define) {
            for (const [fnName, factory] of Object.entries(extension.define)) {
                if (typeof factory !== 'function') {
                    throw new HtmxError(`Cannot define "${fnName}" — value must be a factory function`, {type: 'DEFINE_VALUE_INVALID'})
                }
                if (api[fnName]) {
                    throw new HtmxError(`Cannot define "${fnName}" — already defined by "${state.defines[fnName] || 'kernel'}"`, {type: 'DEFINE_TARGET_EXISTS'})
                }
                const fn = factory(api)
                if (typeof fn !== 'function') {
                    throw new HtmxError(`Cannot define "${fnName}" — factory must return a function`, {type: 'DEFINE_FACTORY_INVALID'})
                }
                api[fnName] = fn
                state.defines[fnName] = name
            }
        }

        extensions.push({name, ...extension})
        // Apply declarative wraps and track them
        if (extension.wrap) {
            for (const [fnName, wrapper] of Object.entries(extension.wrap)) {
                if (!api[fnName]) throw new HtmxError(`Cannot wrap "${fnName}" — not found on api`, {type: 'WRAP_TARGET_MISSING'})
                const original = api[fnName]
                api[fnName] = (...args) => wrapper(original, ...args)
                wraps[fnName] ??= []
                wraps[fnName].push(name)
            }
        }
        // Late-installed extensions still get a boot event
        if (booted && extension.on?.['htmx:boot']) {
            extension.on['htmx:boot']({}, api)
        }
    }

    // ── Events ───────────────────────────────────────────────────────────────

    /**
     * Emit an event: extensions see it first, then it dispatches as a DOM CustomEvent.
     * Any extension returning false (or preventDefault) cancels the event.
     *
     * @param {Element} element
     * @param {string} eventName
     * @param {Object} [detail={}]
     *
     * @returns {boolean} false if canceled
     */
    function emit(element, eventName, detail = {}) {
        // Extensions get first crack — can inspect/modify detail or cancel
        for (const extension of extensions) {
            try {
                if (extension.on?.[eventName]?.(detail, api) === false) return false
            } catch (error) {
                console.error(`[htmx] Extension "${extension.name}" threw in ${eventName}:`, error)
            }
        }

        // Fall back to body for disconnected elements (e.g., during cleanup)
        const dispatchTarget = element?.isConnected ? element : document.body

        return dispatchTarget.dispatchEvent(
            new CustomEvent(eventName, {
                detail,
                bubbles: true,
                cancelable: true,
                composed: true,
            }))
    }

    // ── Utilities ────────────────────────────────────────────────────────────

    /** @param {boolean} result - Return value of api.emit(). */
    const canceled = (result) => result === false

    /**
     * Listen for a DOM event. Auto-registers a cleanup callback if the element
     * has state, so listeners are removed when the element is cleaned up.
     *
     * @param {EventTarget} element
     * @param {string} eventName
     * @param {EventListener} handler
     * @param {AddEventListenerOptions} [options]
     *
     * @returns {function} unsubscribe callback
     */
    function on(element, eventName, handler, options) {

        if (!eventName) throw new HtmxError('Cannot add listener without an event name', {type: 'EVENT_NAME_MISSING'})

        // ── [delay-events] ────────────────────────────────────────────────────
        if (options?.delay !== undefined) {
            const ms = options.delay
            let timeout
            const orig = handler
            handler = (event) => {
                clearTimeout(timeout)
                timeout = setTimeout(() => orig(event), ms)
            }
        }
        // ── [/delay-events] ───────────────────────────────────────────────────

        // ── [throttle-events] ─────────────────────────────────────────────────
        if (options?.throttle !== undefined) {
            const ms = options.throttle
            let last = 0
            const orig = handler
            handler = (event) => {
                const now = Date.now()
                if (now - last >= ms) {
                    last = now
                    orig(event)
                }
            }
        }
        // ── [/throttle-events] ────────────────────────────────────────────────

        element.addEventListener(eventName, handler, options)

        const off = () => element.removeEventListener(eventName, handler, options)

        // Auto-cleanup: if this element is managed, unsubscribe on removal
        if (elements.has(element)) elements.get(element).cleanup.push(off)

        return off
    }

    /**
     * Resolve an element reference. Always searches from document.
     *
     * Supports CSS selectors and direct Element references.
     * Pass {multiple: true} to get an array of matches.
     *
     * @param {string|Element|null} selector - What to resolve.
     * @param {{multiple?: boolean}} [options] - Kernel reads `multiple` only.
     *
     * @returns {Element|Element[]|null} Resolved element(s), or null/[] if not found.
     */
    function find(selector, options) {

        // ── [extended-selectors] ──────────────────────────────────────────────
        extended_selectors: {
            const el = options?.from
            const multiple = options?.multiple
            const match = (result) => multiple ? (result ? [result] : []) : result ?? null

            if (typeof selector !== 'string') break extended_selectors

            // Named targets
            if (selector === 'this') return match(el)
            if (selector === 'body') return match(document.body)
            if (selector === 'document') return multiple ? [document] : document
            if (selector === 'window') return multiple ? [window] : window

            if (!el) break extended_selectors

            // Immediate relatives (require context element)
            if (selector === 'next') return match(el.nextElementSibling)
            if (selector === 'previous') return match(el.previousElementSibling)
            if (selector === 'host') return match(el.getRootNode()?.host)

            // Traversal
            if (selector.startsWith('closest ')) return match(el.closest(selector.slice(8)))
            if (selector.startsWith('next ')) {
                for (const candidate of (el.getRootNode() || document).querySelectorAll(selector.slice(5))) {
                    if (candidate.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING) return match(candidate)
                }
                return match(null)
            }
            if (selector.startsWith('previous ')) {
                const all = (el.getRootNode() || document).querySelectorAll(selector.slice(9))
                for (let i = all.length - 1; i >= 0; i--) {
                    if (all[i].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) return match(all[i])
                }
                return match(null)
            }

            // Scoped search: search within the context element
            if (selector.startsWith('find ')) {
                const sel = selector.slice(5)
                return multiple
                    ? [...el.querySelectorAll(sel)]
                    : el.querySelector(sel)
            }

            break extended_selectors
        }
        // ── [/extended-selectors] ─────────────────────────────────────────────

        const multiple = options?.multiple
        if (selector instanceof Element) return multiple ? [selector] : selector
        if (!selector) return multiple ? [] : null
        return multiple
            ? [...document.querySelectorAll(selector)]
            : document.querySelector(selector)
    }

    /**
     * Read a raw attribute from an element.
     *
     * @param {Element} element - Element to read from.
     * @param {string} name - Attribute name.
     * @param {Object} [options] - Unused by kernel.
     */
    function attr(element, name, options) {

        // ── [inheritance] ─────────────────────────────────────────────────────
        inheritance: {
            if (options?.inherit === false) break inheritance

            const {mode, inheritSuffix, appendSuffix} = htmx.config.inheritance
            const inherited = `${name}:${inheritSuffix}`
            const append = `${name}:${appendSuffix}`
            const inheritedAppend = `${name}:${inheritSuffix}:${appendSuffix}`

            // Direct attribute on element
            if (element.hasAttribute(name)) break inheritance
            if (element.hasAttribute(inherited)) break inheritance

            // Build ancestor selector
            const parts = [`[${CSS.escape(inherited)}]`, `[${CSS.escape(inheritedAppend)}]`]
            if (mode === 'implicit') parts.unshift(`[${CSS.escape(name)}]`)
            const selector = parts.join(',')

            // Collect :append chain + base, walking up
            const chain = []

            const selfAppend = original(element, append, options)
                ?? original(element, inheritedAppend, options)
            if (selfAppend !== null) chain.push(selfAppend)

            let ancestor = element.parentElement?.closest(selector)
            while (ancestor) {
                const base = original(ancestor, inherited, options)
                    ?? (mode === 'implicit' ? original(ancestor, name, options) : null)
                if (base !== null) {
                    chain.push(base)
                    break
                }

                const ancestorAppend = original(ancestor, inheritedAppend, options)
                if (ancestorAppend !== null) {
                    chain.push(ancestorAppend)
                    ancestor = ancestor.parentElement?.closest(selector)
                    continue
                }

                break
            }

            if (!chain.length) return null
            return chain.reverse().join(',')
        }
        // ── [/inheritance] ────────────────────────────────────────────────────

        return element.getAttribute(name)
    }

    // ── Init & Cleanup ───────────────────────────────────────────────────────

    /**
     * Initialize a subtree — discover hx-* elements and init each one.
     *
     * Default execute walks the subtree with a TreeWalker, calling initElement
     * on any element with an hx-* attribute. Extensions can replace
     * detail.walk.execute during htmx:before:walk:init for custom discovery.
     *
     * @param {Element} [root=document.body] - Subtree root to initialize.
     */
    function init(root = document.body) {
        const detail = {element: root, walk: {execute: null}}

        // Default execute: walk the subtree, initElement anything with hx-*
        detail.walk.execute = () => {
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
            let node = root
            while (node) {
                const attrs = node.attributes
                for (let i = 0; i < attrs.length; i++) {
                    if (attrs[i].name.startsWith(config.attributePrefix)) {
                        api.initElement(node)
                        break
                    }
                }
                node = walker.nextNode()
            }
        }

        if (canceled(api.emit(root, 'htmx:before:walk:init', detail))) return
        detail.walk.execute()
        api.emit(root, 'htmx:after:walk:init', {element: root})
    }

    /**
     * Initialize a single element: set up state, let extensions configure
     * behavior, then commit.
     *
     * Sequence: before:init → init.execute() → after:init
     *
     * detail.init.execute — what runs at init time.
     *   Default: commit element state. Extensions wrap this during before:init
     *   to add trigger wiring, listener setup, or any other init-time behavior.
     *
     * @param {Element} element
     */
    function initElement(element) {
        if (elements.has(element)) return // already initialized

        const detail = {element, init: {execute: null}}

        detail.init.execute = () => {
            elements.set(element, {cleanup: []})
        }


        // ── [default-trigger] ─────────────────────────────────────────────────
        default_trigger: {
            // Don't override if another extension already set up trigger
            if (detail.trigger) break default_trigger

            // Default trigger based on element type
            const el = detail.element
            let eventName
            if (el.matches('form')) eventName = 'submit'
            else if (el.matches('input:not([type=button]), select, textarea')) eventName = 'change'
            else eventName = 'click'

            detail.trigger = {
                eventName,
                execute: (event) => {
                    event?.preventDefault()
                    if (api.emit(el, 'htmx:before:trigger', {element: el, event}) === false) return
                    api.emit(el, 'htmx:after:trigger', {element: el, event})
                },
            }

            // Wrap init.execute to wire trigger listener
            const originalInit = detail.init.execute
            detail.init.execute = () => {
                originalInit()
                if (detail.trigger.eventName) {
                    api.on(el, detail.trigger.eventName, detail.trigger.execute)
                }
            }
        }
        // ── [/default-trigger] ────────────────────────────────────────────────

        if (canceled(api.emit(element, 'htmx:before:init', detail))) return
        detail.init.execute()
        api.emit(element, 'htmx:after:init', detail)
    }

    /**
     * Clean up a subtree — tear down root and all stateful descendants.
     *
     * Default execute walks the subtree, calling cleanupElement on any
     * element with state. Extensions can replace detail.walk.execute
     * during htmx:before:walk:cleanup for custom discovery (e.g., shadow DOM).
     *
     * @param {Element} root - Subtree root to clean up.
     */
    function cleanup(root) {
        const detail = {element: root, walk: {execute: null}}

        // Default execute: cleanupElement on root + all stateful descendants
        detail.walk.execute = () => {
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
            let node = root
            while (node) {
                if (elements.has(node)) api.cleanupElement(node)
                node = walker.nextNode()
            }
        }

        if (canceled(api.emit(root, 'htmx:before:walk:cleanup', detail))) return
        detail.walk.execute()
        api.emit(root, 'htmx:after:walk:cleanup', {element: root})
    }

    /**
     * Tear down listeners and delete state for a single element.
     *
     * Follows the standard before:* → execute() → after:* pattern.
     * Extensions can replace detail.cleanup.execute during before:cleanup
     * (e.g., to add exit animations before teardown).
     *
     * @param {Element} element - The element to clean up.
     */
    function cleanupElement(element) {
        if (!elements.has(element)) return

        const detail = {element, cleanup: {execute: null}}

        detail.cleanup.execute = () => {
            for (const teardown of elements.get(element).cleanup) teardown()
            elements.delete(element)
        }

        if (canceled(api.emit(element, 'htmx:before:cleanup', detail))) return
        detail.cleanup.execute()
        api.emit(element, 'htmx:after:cleanup', detail)
    }

    // ── API ──────────────────────────────────────────────────────────────────
    // Extensions receive api as the last argument in both event handlers and wraps.
    // Internal code calls through api so extension wraps take effect.


    // ── [parser] ──────────────────────────────────────────────────────────
    /**
     * Parse relaxed key/value text into an object.
     *
     * Supports bare values, `key:value` pairs, boolean flags, duration
     * coercion (`150`, `150ms`, `2s`, `1m`), and dot-key expansion.
     *
     * @param {string|null|undefined} text
     * @param {{as?: string}} [options]
     *
     * @returns {Object<string, any>|null}
     *
     * @example
     * api.parse('click')
     * // => { value: 'click' }
     *
     * @example
     * api.parse('delay:500ms once')
     * // => { delay: 500, once: true }
     *
     * @example
     * api.parse('click', { as: 'trigger' })
     * // => { trigger: 'click' }
     *
     * @example
     * api.parse('headers.X-CSRF:abc123')
     * // => { headers: { 'X-CSRF': 'abc123' } }
     */
    function parse(text, options) {
        /** Tokenizer for relaxed `key:value` and flag-like option strings. */
        const tokenPattern = /(?:"([^"]*)"|'([^']*)'|([^\s,:]+))(?:\s*:\s*(?:"([^"]*)"|'([^']*)'|([^\s,]*)))?/g

        /** Coerce parsed token text into booleans/durations when applicable. */
        function coerce(text) {
            if (text === 'true') return true
            if (text === 'false') return false
            const duration = text.match(/^(\d+)(ms|s|m)?$/)
            if (duration) {
                const [, n, unit] = duration
                return unit === 's' ? n * 1000 : unit === 'm' ? n * 60000 : +n
            }
            return text
        }

        if (!text) return null

        const matches = [...text.trim().matchAll(tokenPattern)]
        if (!matches.length) return null

        const result = {}

        for (let i = 0; i < matches.length; i++) {
            const m = matches[i]
            const key = m[1] ?? m[2] ?? m[3]
            const val = m[4] ?? m[5] ?? m[6]
            const hasVal = val !== undefined

            if (i === 0 && !hasVal) {
                result.value = key
            } else if (hasVal) {
                result[key] = coerce(val)
            } else {
                result[key] = true
            }
        }

        if (options?.as && result.value !== undefined) {
            result[options.as] = result.value
            delete result.value
        }

        // Expand dot-notation keys into nested objects
        const expanded = {}
        for (const [k, v] of Object.entries(result)) {
            if (k.includes('.')) {
                const keys = k.split('.')
                keys.slice(0, -1).reduce((o, key) => o[key] ??= {}, expanded)[keys.at(-1)] = v
            } else {
                expanded[k] = v
            }
        }
        return expanded
    }
    // ── [/parser] ─────────────────────────────────────────────────────────

    // ── [swaps] ───────────────────────────────────────────────────────────
    /**
     * Execute a DOM swap.
     *
     * Signature:
     *   api.swap(swap, options)
     *
     * `swap` fields:
     * - `content`: string HTML or DocumentFragment
     * - `style`: swap style string (built-ins plus extension-defined styles)
     * - `target`: selector string or resolved Element
     *
     * `options` fields:
     * - `element`: event emission/default-target element
     * - `context`: extra context merged into swap event detail
     *
     * Emits `htmx:before:swap` / `htmx:after:swap` with:
     *   { element, swap, ...context }
     *
     * @param {{content?: string|DocumentFragment, style?: string, target?: string|Element}} [swap]
     * @param {{element?: Element|null, context?: Object<string, any>}} [options]
     */
    function swap(swap, options) {

        // ── [ajax] ────────────────────────────────────────────────────────────
        const context = {...options.context}
        if (options.request !== undefined) context.request = options.request
        if (options.response !== undefined) context.response = options.response
        if (options.error !== undefined) context.error = options.error
        // ── [/ajax] ───────────────────────────────────────────────────────────

        const detail = {
            element: options?.element || null,
            swap: swap || {},
            ...(options?.context || {}),
        }
        const emitOn = detail.element || document.body

        detail.swap.execute = () => {
            // Resolve target: string selector → element
            if (typeof detail.swap.target === 'string') {
                detail.swap.target = api.find(detail.swap.target)
            }
            detail.swap.target ??= detail.element

            if (!detail.swap.target) {
                throw new HtmxError('Swap target not found', {type: 'SWAP_TARGET_MISSING'})
            }

            // Parse content: string → DocumentFragment
            if (typeof detail.swap.content === 'string') {
                const template = document.createElement('template')
                template.innerHTML = detail.swap.content
                detail.swap.content = template.content
            }

            // Dispatch on swap style
            const target = detail.swap.target
            const content = detail.swap.content
            switch (detail.swap.style) {
                case 'innerHTML':
                    target.innerHTML = '';
                    target.append(content);
                    break
                case 'outerHTML':
                    target.replaceWith(content);
                    break
                case 'beforebegin':
                    target.before(content);
                    break
                case 'afterbegin':
                    target.prepend(content);
                    break
                case 'beforeend':
                    target.append(content);
                    break
                case 'afterend':
                    target.after(content);
                    break
                case 'delete':
                    target.remove();
                    break
                case 'none':
                    break
                default:
                    throw new HtmxError(`Unknown swap style "${detail.swap.style}"`, {type: 'SWAP_STYLE_UNKNOWN'})
            }
        }


        // ── [default-swap] ────────────────────────────────────────────────────
        default_swap: {
            detail.swap.style ??= api.config.defaultSwap
        }
        // ── [/default-swap] ───────────────────────────────────────────────────

        // ── [hx-swap] ─────────────────────────────────────────────────────────
        hx_swap: {
            const swapAttr = api.parse(api.attr(detail.element, 'hx-swap'), {as: 'style'})
            if (swapAttr) Object.assign(detail.swap, swapAttr)
        }
        // ── [/hx-swap] ────────────────────────────────────────────────────────

        // ── [hx-target] ───────────────────────────────────────────────────────
        hx_target: {
            const target = api.attr(detail.element, 'hx-target')
            if (target) {
                detail.swap.target = api.find(target, {from: detail.element})
            }
        }
        // ── [/hx-target] ──────────────────────────────────────────────────────

        // ── [swap-aliases] ────────────────────────────────────────────────────
        swap_aliases: {
            const aliases = {
                before: 'beforebegin',
                prepend: 'afterbegin',
                append: 'beforeend',
                after: 'afterend',
                remove: 'delete',
            }
            if (detail.swap.style in aliases) detail.swap.style = aliases[detail.swap.style]
        }
        // ── [/swap-aliases] ───────────────────────────────────────────────────

        if (api.emit(emitOn, 'htmx:before:swap', detail) === false) return
        detail.swap.execute()
        api.emit(emitOn, 'htmx:after:swap', detail)
    }
    // ── [/swaps] ──────────────────────────────────────────────────────────

    // ── [ajax] ────────────────────────────────────────────────────────────
    /**
     * Execute an HTTP request through the htmx request pipeline.
     *
     * Pipeline:
     * - `htmx:before:request` -> `request.execute()` -> `htmx:after:request`
     * - `htmx:before:response` -> `response.execute()` -> `htmx:after:response`
     * - `api.swap(...)` when response text is available (which emits `htmx:before:swap` / `htmx:after:swap`)
     * - `htmx:done`, `htmx:error`, `htmx:finally`
     *
     * Detail shape shared across request/response events:
     * - `detail.element`
     * - `detail.request` (url/method/headers/body plus `execute()`)
     * - `detail.response` (status/ok/url/headers/text plus `execute()`)
     * - `detail.swap` (swap options passed to `api.swap`)
     * - `detail.error` (set on failures)
     *
     * @param {{element?: Element, request: Object, swap?: Object}} [options]
     *
     * @returns {Promise<void>}
     */
    async function ajax(options) {
        if (!options.request?.url) throw new HtmxError('Cannot issue request without a URL', {type: 'REQUEST_URL_MISSING'})
        const element = options.element || document.body

        const detail = {
            element,
            request: {...options.request, execute: null},
            swap: options.swap || null,
            response: null,
            error: null,
        }

        try {
            // ── Request phase ────────────────────────────────────
            detail.request.execute = async () => {
                const {url, execute, ...fetchOptions} = detail.request
                return await fetch(url, fetchOptions)
            }


            // ── [default-headers] ─────────────────────────────────────────────────
            default_headers: {
                detail.request.headers = {...api.config.defaultHeaders, ...detail.request.headers}
                detail.request.headers['HX-Current-URL'] ??= location.href
            }
            // ── [/default-headers] ────────────────────────────────────────────────

            // ── [request-timeout] ─────────────────────────────────────────────────
            request_timeout: {
                const timeout = api.config.requestTimeout
                if (timeout) {
                    const timeoutSignal = AbortSignal.timeout(timeout)
                    detail.request.signal = detail.request.signal
                        ? AbortSignal.any([detail.request.signal, timeoutSignal])
                        : timeoutSignal
                }
            }
            // ── [/request-timeout] ────────────────────────────────────────────────

            if (api.emit(element, 'htmx:before:request', detail) === false) return

            const response = await detail.request.execute()

            detail.response = {
                raw: response,
                status: response.status,
                ok: response.ok,
                url: response.url,
                headers: Object.fromEntries(response.headers),
                execute: null,
            }

            api.emit(element, 'htmx:after:request', detail)

            // ── Response phase ───────────────────────────────────
            detail.response.execute = async () => {
                detail.response.text = await detail.response.raw.text()
            }

            if (api.emit(element, 'htmx:before:response', detail) === false) return

            await detail.response.execute()

            // ── Swap phase ───────────────────────────────────────
            if (detail.response.text != null) {
                detail.swap ??= {}
                detail.swap.content = detail.response.text
                api.swap(detail.swap, {
                    element: detail.element,
                    request: detail.request,
                    response: detail.response,
                })
            }

            api.emit(element, 'htmx:done', detail)

        } catch (error) {
            detail.error = error
            console.error(error)
            api.emit(element, 'htmx:error', detail)
        } finally {
            api.emit(element, 'htmx:finally', detail)
        }
    }
    // ── [/ajax] ───────────────────────────────────────────────────────────
    const api = {
        config,
        install,
        init,
        initElement,
        cleanup,
        cleanupElement,
        emit,
        on,
        attr,
        find,
        state,
        parse,
        swap,
        ajax,
    }

    // ── Extensions: Start ────────────────────────────────────────────────────


    // ── Boot ─────────────────────────────────────────────────────────────────

    /**
     * Emit htmx:boot, init the document body, and observe DOM mutations
     * (added nodes → init, removed nodes → cleanup).
     */
    function boot() {
        booted = true
        api.emit(document.body, 'htmx:boot')
        api.init(document.body)

        new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes') {
                    api.initElement(mutation.target)
                } else {
                    for (const node of mutation.addedNodes) {
                        if (node instanceof Element) api.init(node)
                    }
                    for (const node of mutation.removedNodes) {
                        if (node instanceof Element) api.cleanup(node)
                    }
                }
            }
        }).observe(document.body, {
            childList: true,
            subtree: true,
            attributes: config.attributeFilter?.length > 0,
            attributeFilter: config.attributeFilter?.length > 0 ? config.attributeFilter : undefined,
        })
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot)
    } else {
        queueMicrotask(boot)
    }

    // ── Public API ───────────────────────────────────────────────────────────
    // Getters delegate to api so extension wraps take effect.

    return {
        version: '4.0.0',
        config,
        install,
        state,
        get init() {
            return api.init
        },
        get emit() {
            return api.emit
        },
        get on() {
            return api.on
        },
        get attr() {
            return api.attr
        },
        get find() {
            return api.find
        },
    }
})()
