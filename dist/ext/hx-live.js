// hx-live extension: reactive live expressions + q() proxy + scope helpers.
// Hooks:
//   htmx:after:process  find new [hx-live] elements and register them
//   htmx:before:swap    increment swap depth (defer recomputes)
//   htmx:finally:swap   decrement, fire one consolidated recompute
//   htmx:scope          inject q, wait, trigger, debounce into JS expression scopes
(() => {
    let api;
    let fns = new Set();
    let pending = false;
    let dbSym = Symbol();
    let observer = null;
    let recomputeBound = null;
    let inputBound = null;
    let swaps = 0;
    let warned = false;

    const OBSERVE_OPTIONS = { childList: true, subtree: true, attributes: true, characterData: true };

    let inputDebounceId = null;

    function ensureActive() {
        if (observer) return;
        recomputeBound = () => schedule();
        let inputDelay = htmx.parseInterval(htmx.config.live?.inputDebounce ?? 100) ?? 100;
        inputBound = () => {
            clearTimeout(inputDebounceId);
            inputDebounceId = setTimeout(schedule, inputDelay);
        };
        document.addEventListener('input', inputBound, true);
        document.addEventListener('change', recomputeBound, true);
        observer = new MutationObserver(recomputeBound);
        observer.observe(document.documentElement, OBSERVE_OPTIONS);
    }

    function deactivate() {
        if (!observer) return;
        clearTimeout(inputDebounceId);
        inputDebounceId = null;
        document.removeEventListener('input', inputBound, true);
        inputBound = null;
        document.removeEventListener('change', recomputeBound, true);
        observer.disconnect();
        observer = null;
        recomputeBound = null;
        warned = false;
    }

    function schedule() {
        if (pending) return;
        if (swaps > 0) return;
        pending = true;
        queueMicrotask(() => {
            // Detach observer while writing so our own writes don't queue records.
            observer?.disconnect();
            let startedAt = performance.now();
            fns.forEach(f => f());
            let elapsed = performance.now() - startedAt;
            if (!warned && elapsed > 16) {
                console.warn(`htmx: hx-live expressions took ${elapsed.toFixed(1)}ms.`);
                warned = true;
            }
            if (fns.size === 0) {
                deactivate();
            } else {
                observer.observe(document.documentElement, OBSERVE_OPTIONS);
            }
            pending = false;
        });
    }

    let BOOLEAN_ATTRS = new Set('disabled required readonly open inert multiple autofocus novalidate default reversed loop muted controls autoplay playsinline formnovalidate async defer ismap typemustmatch allowfullscreen itemscope nomodule alpha headingreset'.split(' '));
    let PROPERTY_BINDING_ATTRS = new Set('checked value selected hidden'.split(' '));
    let STRING_BOOLEAN_ATTRS = new Set('contenteditable draggable spellcheck writingsuggestions'.split(' '));
    let NUMERIC_ATTRS = new Set('tabindex colspan rowspan maxlength minlength size span start rows cols width height min max step low high optimum'.split(' '));

    function normalizeAttrName(elt, name) {
        return elt instanceof HTMLElement ? name.toLowerCase() : name;
    }

    function readAttr(element, name) {
        name = normalizeAttrName(element, name);
        if (name.startsWith('aria-')) return readAria(element, name.slice(5));
        if (name.startsWith('data-')) return readData(element, name);
        if (name === 'value' && (element.type === 'number' || element.type === 'range')) {
            return element.value === '' ? null : element.valueAsNumber;
        }
        if (PROPERTY_BINDING_ATTRS.has(name)) return element[name];
        if (BOOLEAN_ATTRS.has(name) || name.startsWith('shadowroot') && name !== 'shadowrootmode' && name !== 'shadowrootslotassignment') return element.hasAttribute(name);
        let value = element.getAttribute(name);
        if (value != null && STRING_BOOLEAN_ATTRS.has(name)) try { return JSON.parse(value.toLowerCase()); } catch {}
        if (NUMERIC_ATTRS.has(name) && value?.trim() && isFinite(value)) return +value;
        return value;
    }

    function writeAttr(element, name, value) {
        name = normalizeAttrName(element, name);
        if (typeof value === 'function') {
            value = value(readAttr(element, name));
            if (typeof value?.then === 'function') throw new TypeError('hx-live: assignment returned a promise');
        }
        if (name.startsWith('aria-')) {
            writeAria(element, name.slice(5), value);
        } else if (name.startsWith('data-')) {
            writeData(element, name, value);
        } else if (PROPERTY_BINDING_ATTRS.has(name)) {
            applyPropertyBinding(element, name, value);
        } else if (BOOLEAN_ATTRS.has(name) || name.startsWith('shadowroot') && name !== 'shadowrootmode' && name !== 'shadowrootslotassignment') {
            element.toggleAttribute(name, !!value);
        } else if (value == null) {
            element.removeAttribute(name);
        } else {
            element.setAttribute(name, String(value));
        }
    }

    function writeTargets(elts, target) {
        return target ? new Set(elts.map(target)) : elts;
    }

    function attrName(state, prop) {
        let prefix = state.prefix;
        return prefix + (prefix === 'data-' ? camelToKebab(prop) : prefix ? prop.toLowerCase() : prop);
    }

    function targetFor(state, elt, name) {
        if (!state.cascades) return state.prefix ? elt.hasAttribute(name) && elt : elt;
        while (elt && !elt.hasAttribute(name)) elt = elt.parentElement;
        return elt;
    }

    function writeProxy(state, prop, value, remove) {
        if (typeof prop !== 'string') return false;
        let name = attrName(state, prop);
        writeTargets(state.elts, state.cascades && (elt => targetFor(state, elt, name) || !remove && elt))
            .forEach(elt => elt && writeAttr(elt, name, value));
        return true;
    }

    let attrHandler = {
        get: (state, prop) => {
            if (!state.prefix && prop === 'class') return state.scope.class;
            if (typeof prop !== 'string') return undefined;
            let name = attrName(state, prop);
            let target = state.elts[0] && targetFor(state, state.elts[0], name);
            return target ? readAttr(target, name) : undefined;
        },
        set: (state, prop, value) => writeProxy(state, prop, value),
        deleteProperty: (state, prop) => writeProxy(state, prop, undefined, true),
        has: (state, prop) => state.prefix === 'data-' && typeof prop === 'string' &&
            !!state.elts[0] && !!targetFor(state, state.elts[0], attrName(state, prop)),
        ownKeys: state => {
            if (state.prefix !== 'data-') return [];
            let result = [], seen = new Set();
            for (let node = state.elts[0]; node; node = state.cascades ? node.parentElement : null) {
                for (let key of Object.keys(node.dataset)) if (key !== 'htmxPowered' && !seen.has(key)) {
                    seen.add(key);
                    result.push(key);
                }
            }
            return result;
        },
        getOwnPropertyDescriptor: (state, prop) => {
            if (state.prefix !== 'data-' || typeof prop !== 'string' || prop === 'htmxPowered') return;
            if (state.elts[0] && targetFor(state, state.elts[0], attrName(state, prop))) {
                return { enumerable: true, configurable: true };
            }
        }
    };

    function makeAttrProxy(elts, cascades, scope, prefix = '') {
        return new Proxy({ elts, cascades, scope, prefix }, attrHandler);
    }

    function applyStyleBinding(elt, value) {
        let prop = api.htmxProp(elt);
        let oldManaged = prop.liveStyles || new Set();
        let styles = [];

        if (typeof value === 'string') {
            for (let decl of value.split(';')) {
                let idx = decl.indexOf(':');
                if (idx < 0) continue;
                let k = decl.slice(0, idx).trim();
                let v = decl.slice(idx + 1).trim();
                if (k) styles.push([k, v]);
            }
        } else if (value && typeof value === 'object') {
            for (let [k, v] of Object.entries(value)) {
                styles.push([camelToKebab(k), v == null || v === '' ? null : String(v)]);
            }
        }

        let newManaged = new Set(styles.map(([k]) => k));
        for (let k of oldManaged) if (!newManaged.has(k)) elt.style.removeProperty(k);
        for (let [k, v] of styles) {
            if (v == null) elt.style.removeProperty(k);
            else elt.style.setProperty(k, v);
        }
        if (elt.style.length === 0) elt.removeAttribute('style');
        prop.liveStyles = newManaged;
    }

    function camelToKebab(s) {
        return s.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
    }

    function parseJSON(value) {
        try { return JSON.parse(value); } catch { return value; }
    }

    function readData(elt, name) {
        let raw = elt.getAttribute(name);
        return raw === null ? undefined : parseJSON(raw);
    }

    // Protect quoted text and regex literals, then recurse into template expressions.
    let CLASS_TOKEN = /(['"`\/])(?:\\.|(?!\1).)*\1|(?<![.\w$#])class(?=\s*[.?[])/gs;

    function rewriteClass(src) {
        return src.replace(CLASS_TOKEN, (token, quote) => {
            if (!quote) return 'attr.class';
            if (quote === '`') return token.replace(
                /\$\{((?:[^{}]|\{[^{}]*\})*)\}/g,
                (_, code) => '${' + rewriteClass(code) + '}'
            );
            return token;
        });
    }

    let stringAria = new Set('activedescendant details errormessage keyshortcuts label placeholder roledescription valuetext'.split(' '));
    let listAria = new Set('controls describedby dropeffect flowto labelledby owns relevant'.split(' '));
    function readClass(elt, name) {
        return !!elt?.classList.contains(name);
    }

    function writeClass(elt, name, value) {
        if (typeof value === 'function') {
            value = value(readClass(elt, name));
            if (typeof value?.then === 'function') throw new TypeError('hx-live: assignment returned a promise');
        }
        elt.classList.toggle(name, !!value);
        if (!elt.classList.length) elt.removeAttribute('class');
    }

    function makeClassProxy(elts, cascades = false) {
        let first = elts[0];
        let classTarget = (elt, name) => cascades ? elt.closest('.' + CSS.escape(name)) : elt;
        let read = name => readClass(first && classTarget(first, name), name);
        let write = (name, value) => writeTargets(elts, elt => classTarget(elt, name) || elt)
            .forEach(elt => writeClass(elt, name, value));
        let methods = {
            assign(value) {
                if (!value || typeof value !== 'object' || Array.isArray(value)) {
                    console.warn('hx-live: class.assign expects an object.', { elts });
                    return;
                }
                writeClasses(write, value);
            },
            add: (...classes) => classes.forEach(name => write(name, true)),
            remove: (...classes) => classes.forEach(name => write(name, false)),
            contains: read,
            toggle(name, force) {
                let result = force ?? !read(name);
                write(name, current => force ?? !current);
                return result;
            },
            replace(oldClass, newClass) {
                if (cascades) {
                    if (!read(oldClass)) return false;
                    write(oldClass, false);
                    write(newClass, true);
                    return true;
                }
                let result;
                for (let i = 0; i < elts.length; i++) {
                    let next = elts[i].classList.replace(oldClass, newClass);
                    if (i === 0) result = next;
                }
                return result;
            }
        };
        return new Proxy({}, {
            get: (_, name) => {
                if (typeof name === 'string' && methods[name]) return methods[name];
                let list = !cascades && first?.classList;
                if (list && name in list) {
                    let member = list[name];
                    return typeof member === 'function' ? member.bind(list) : member;
                }
                if (!first) return name === Symbol.iterator ? () => [][Symbol.iterator]() : undefined;
                return typeof name === 'string' ? read(name) : undefined;
            },
            set: (_, name, value) => {
                if (typeof name !== 'string') return false;
                if (!cascades && name === 'value') for (let elt of elts) elt.classList.value = value;
                else write(name, value);
                return true;
            },
            deleteProperty: (_, name) => {
                if (typeof name !== 'string') return false;
                write(name, false);
                return true;
            },
            has: (_, name) => typeof name === 'string' && read(name),
            ownKeys: () => !cascades && first ? [...first.classList] : [],
            getOwnPropertyDescriptor: (_, name) => !cascades && read(name)
                ? { enumerable: true, configurable: true }
                : undefined
        });
    }

    function makeStateScope(elts, cascades) {
        let data, aria, classes, attr;
        let scope = {
            get data() { return data ||= makeAttrProxy(elts, cascades, null, 'data-'); },
            get aria() { return aria ||= makeAttrProxy(elts, cascades, null, 'aria-'); },
            get class() { return classes ||= makeClassProxy(elts, cascades); },
            get attr() { return attr ||= makeAttrProxy(elts, cascades, scope); }
        };
        return scope;
    }

    // `closest` reads as a cascading state bag and calls as a selector:
    //   closest.data.count      nearest owner of data-count
    //   closest('.card').data   query proxy for the nearest matching ancestor
    function makeClosest(elts) {
        let scope;
        return new Proxy(function () {}, {
            apply: (_, __, [selector]) => {
                let out = new Set();
                for (let elt of elts) {
                    let match = elt.closest?.(selector);
                    if (match) out.add(match);
                }
                return qProxy([...out]);
            },
            get: (_, p) => (scope ||= makeStateScope(elts, true))[p]
        });
    }

    function makeExpressionScope(elt) {
        let local = makeStateScope([elt], false);
        let closest = makeClosest([elt]);
        return {
            q: makeQ(elt),
            forEvent: (...args) => forEvent(elt, ...args),
            nextFrame: () => new Promise(r => requestAnimationFrame(r)),
            trigger: (type, detail, bubbles) => htmx.trigger(elt, type, detail, bubbles),
            debounce: getDebounce(elt),
            take: (name, scope) => applyTake([elt], name, scope),
            toggle: (name, ...values) => applyToggle(elt, name, ...values),
            attr: local.attr,
            insert: (pos, html) => insertContent(elt, pos, html),
            matches: sel => elt.matches(sel),
            style: elt.style,
            data: closest.data,
            aria: local.aria,
            local,
            closest
        };
    }

    function writeAria(elt, key, value) {
        let name = 'aria-' + key;
        if (value == null) elt.removeAttribute(name);
        else elt.setAttribute(name, listAria.has(key) && Array.isArray(value) ? value.join(' ') : String(value));
    }

    function readAria(elt, key) {
        let value = elt?.getAttribute('aria-' + key);
        if (value == null) return undefined;
        if (stringAria.has(key)) return value;
        if (listAria.has(key)) return value.trim() ? value.trim().split(/\s+/) : [];
        return parseJSON(value);
    }

    function writeData(elt, name, value) {
        if (value === undefined) elt.removeAttribute(name);
        else elt.setAttribute(name, typeof value === 'object' || parseJSON(value) !== value ? JSON.stringify(value) : value);
    }

    function applyPropertyBinding(elt, name, value) {
        if (name === 'checked' || name === 'selected') {
            let present = !!value;
            elt[name] = present;
            elt.toggleAttribute(name, present);
        } else if (value === false || value == null) {
            elt[name] = typeof elt[name] === 'boolean' ? false : '';
            elt.removeAttribute(name);
        } else if (value === true) {
            elt[name] = true;
            elt.setAttribute(name, '');
        } else {
            elt[name] = value;
            elt.setAttribute(name, String(value));
        }
    }

    function applyClassBinding(elt, name, value) {
        if (name === 'class') {
            applyMultiClass(elt, value);
        } else {
            writeClass(elt, name.slice(1), value);
        }
    }

    function writeClasses(write, value) {
        let written = [];
        if (typeof value === 'string') value = { [value]: true };
        if (value && typeof value === 'object') for (let [classes, enabled] of Object.entries(value)) {
            for (let name of classes.trim().split(/\s+/).filter(Boolean)) {
                written.push(name);
                write(name, !!enabled);
            }
        }
        return written;
    }

    function applyMultiClass(elt, value) {
        let prop = api.htmxProp(elt);
        let oldManaged = prop.liveClasses || new Set();
        let newManaged = new Set(writeClasses((name, value) => writeClass(elt, name, value), value));
        for (let c of oldManaged) if (!newManaged.has(c)) writeClass(elt, c, false);
        prop.liveClasses = newManaged;
    }

    function applyTake(targets, name, scope) {
        let isClass = name.startsWith('.');
        let key = isClass ? name.slice(1) : name;
        let isAria = name.startsWith('aria-');
        let auto = isClass ? '.' + key : '[' + name + ']';
        let root = scope == null ? targets[0]?.parentElement
            : scope.nodeType ? scope : null;
        let sources = root
            ? [root, ...root.querySelectorAll(auto)]
            : targets.length ? document.querySelectorAll(typeof scope === 'string' ? scope : scope?.from || auto) : [];
        let targetSet = new Set(targets);
        for (let s of sources) {
            if (targetSet.has(s)) continue;
            if (isClass) {
                s.classList?.remove(key);
                if (s.classList?.length === 0) s.removeAttribute('class');
            } else if (isAria) {
                s.setAttribute(name, 'false');
            } else {
                s.removeAttribute(name);
            }
        }
        for (let t of targets) {
            if (isClass) t.classList?.add(key);
            else if (isAria) t.setAttribute(name, 'true');
            else t.setAttribute(name, '');
        }
    }

    function forEvent(elt, ...args) {
        let target = elt || document;
        for (let a of args) if (a?.addEventListener) target = a;
        return new Promise(resolve => {
            let cleanups = [], done = false;
            let fire = v => { if (done) return; done = true; for (let c of cleanups) c(); resolve(v); };
            for (let a of args) {
                if (a == null || a?.addEventListener) continue;
                let ms = typeof a === 'number' ? a
                    : (typeof a === 'string' ? htmx.parseInterval(a) : undefined);
                if (ms > 0) {
                    let id = setTimeout(() => fire(a), ms);
                    cleanups.push(() => clearTimeout(id));
                } else if (typeof a === 'string') {
                    target.addEventListener(a, fire, { once: true });
                    cleanups.push(() => target.removeEventListener(a, fire));
                }
            }
        });
    }

    /**
     * Toggle or cycle a class, ARIA attribute, or attribute on an element.
     *
     * @param {Element} element - DOM element to mutate.
     * @param {string} name - Class (`.foo`) or attribute name.
     * @param {...(string|string[])} values - Cycle list, as separate arguments, a pipe-delimited string, or an array. Omit for binary flip.
     *
     * @example
     * toggle('.active')                      // toggle class
     * toggle('aria-expanded')                // flip "true" <-> "false"
     * toggle('hidden')                       // toggle attribute presence
     * toggle('data-view', 'grid', 'list')    // cycle attribute through values
     * toggle('data-view', 'grid|list|table') // same, pipe-delimited
     * toggle('.size', 'sm|md|lg')            // cycle classes (one at a time)
     * toggle('data-open', 'on|')             // 'on' <-> absent slot
     */
    function applyToggle(element, name, ...values) {
        let isClass = name.startsWith('.');
        let key = isClass ? name.slice(1) : name;
        let isAria = name.startsWith('aria-');
        let list = values.length > 1 ? values : values[0];
        if (typeof list === 'string') list = list.split('|').map(value => value.trim());

        if (!list) {
            if (isClass) element.classList.toggle(key);
            else if (isAria) {
                let cur = element.getAttribute(name);
                element.setAttribute(name, cur === 'true' ? 'false' : 'true');
            } else {
                element.toggleAttribute(name);
            }
            return;
        }
        if (isClass) {
            let cur = list.findIndex(v => v && element.classList.contains(v));
            if (cur >= 0) element.classList.remove(list[cur]);
            let next = list[(cur + 1) % list.length];
            if (next) element.classList.add(next);
        } else {
            let cur = list.indexOf(readAttr(element, name) ?? '');
            let next = list[(cur + 1) % list.length];
            writeAttr(element, name, next === '' ? undefined : next);
        }
    }

    function makeDebounce() {
        // Closure form keyed by fn.toString() (no async context to abort); promise form keyed null.
        let channels = new Map();
        let chan = key => channels.get(key) || (channels.set(key, { last: 0, reject: null }), channels.get(key));
        return (ms, fn) => {
            let ch = chan(fn ? fn.toString() : null);
            ch.reject?.(dbSym);
            ch.reject = null;
            let id = ++ch.last;
            if (fn) {
                setTimeout(() => id === ch.last && fn(), ms);
                return;
            }
            return new Promise((res, rej) => {
                ch.reject = rej;
                setTimeout(() => {
                    if (id !== ch.last) return;
                    ch.reject = null;
                    res();
                }, ms);
            });
        };
    }

    function getDebounce(elt) {
        let prop = api.htmxProp(elt);
        return prop.debounce || (prop.debounce = makeDebounce());
    }

    function makeQ(ctx, defaultRoot = document) {
        return selectorOrElt => {
            if (typeof selectorOrElt !== 'string') {
                return qProxy(
                    selectorOrElt?.nodeType ? [selectorOrElt] : [...(selectorOrElt || [])]
                );
            }
            let sel = selectorOrElt;
            let inMatch = sel.match(/^(.+)\s+in\s+(.+)$/);
            let roots = [defaultRoot];
            if (inMatch) {
                sel = inMatch[1];
                if (inMatch[2] === 'this' || inMatch[2] === 'me') {
                    roots = [ctx];
                } else {
                    roots = [...document.querySelectorAll(inMatch[2])];
                }
            }
            if (!roots.length) return qProxy([]);
            let qsa = s => {
                if (roots.length === 1) return [...roots[0].querySelectorAll(s)];
                let out = [], seen = new Set();
                for (let r of roots) for (let e of r.querySelectorAll(s)) {
                    if (!seen.has(e)) { seen.add(e); out.push(e); }
                }
                return out.sort((a, b) => a.compareDocumentPosition(b) & 4 ? -1 : 1);
            };
            let dirMatch = sel.match(/^(next|previous|closest|first|last)\s+(.+)$/);
            let elts;
            if (dirMatch) {
                let [, dir, s] = dirMatch;
                let cdp = e => ctx.compareDocumentPosition(e);
                if (dir === 'closest') {
                    let c = ctx.closest?.(s);
                    elts = c ? [c] : [];
                } else {
                    let all = qsa(s);
                    if (dir === 'first') elts = all.slice(0, 1);
                    else if (dir === 'last') elts = all.slice(-1);
                    else if (dir === 'next') {
                        let n = all.find(e => cdp(e) & 4);
                        elts = n ? [n] : [];
                    } else {
                        let p = all.reverse().find(e => cdp(e) & 2);
                        elts = p ? [p] : [];
                    }
                }
            } else {
                elts = qsa(sel);
            }
            return qProxy(elts);
        };
    }

    let arrayMethods = 'map filter reduce reduceRight forEach some every find findIndex findLast findLastIndex flatMap flat slice indexOf lastIndexOf includes join at'.split(' ');

    let positions = { before: 'beforebegin', after: 'afterend', start: 'afterbegin', end: 'beforeend' };

    function insertContent(elt, pos, html) {
        let parent = elt.parentElement;
        if (pos === 'into') elt.innerHTML = html;
        else if (pos === 'replace') elt.outerHTML = html;
        else elt.insertAdjacentHTML(positions[pos], html);
        htmx.process(parent);
    }

    // Shared rather than a fresh closure per access, so an empty selection has a
    // stable identity and allocates nothing.
    let noop = () => undefined;

    // Find a DOM member's descriptor without invoking it. Reading the value off a
    // prototype would call accessors with the wrong `this` and throw.
    function domDescriptor(name) {
        for (let proto = HTMLElement.prototype; proto; proto = Object.getPrototypeOf(proto)) {
            let d = Object.getOwnPropertyDescriptor(proto, name);
            if (d) return d;
        }
    }

    function qProxy(elts) {
        let local, closest;
        let proxy = new Proxy({}, {
            get: (_, p) => {
                if (p === 'count') return elts.length;
                if (p === 'arr') return () => elts.slice();
                if (p === Symbol.iterator) return () => elts.values();
                if (p === 'q') return s => {
                    let out = new Set();
                    for (let e of elts) for (let r of makeQ(e, e)(s).arr()) out.add(r);
                    return qProxy([...out]);
                };
                if (p === 'trigger') return (t, d, b) => { elts.forEach(e => htmx.trigger(e, t, d, b)); return proxy; };
                if (p === 'insert') return (pos, s) => { elts.forEach(e => insertContent(e, pos, s)); return proxy; };
                if (p === 'take') return (name, scope) => { applyTake(elts, name, scope); return proxy; };
                if (p === 'toggle') return (name, ...values) => { elts.forEach(e => applyToggle(e, name, ...values)); return proxy; };
                if (p === 'attr' || p === 'class' || p === 'aria') {
                    return (local ||= makeStateScope(elts, false))[p];
                }
                if (p === 'data') return (closest ||= makeClosest(elts)).data;
                if (p === 'local') return local ||= makeStateScope(elts, false);
                if (p === 'closest') return closest ||= makeClosest(elts);
                if (arrayMethods.includes(p)) return elts[p].bind(elts);
                // if no elts, look up name in DOM api and determine if it's a function
                if (!elts.length) return typeof domDescriptor(p)?.value === 'function' ? noop : undefined;
                let v = elts[0]?.[p];
                if (typeof v === 'function') return (...a) => elts.map(e => e[p](...a))[0];
                if (v && typeof v === 'object') return qProxy(elts.map(e => e[p]));
                return v;
            },
            set: (_, prop, value) => {
                elts.forEach(elt => {
                    let current = elt[prop];
                    if (current == null || typeof current === 'function') elt[prop] = value;
                    else if (typeof value === 'function') {
                        let next = value(current);
                        if (typeof next?.then === 'function') throw new TypeError('hx-live: assignment returned a promise');
                        elt[prop] = next;
                    } else {
                        elt[prop] = value;
                    }
                });
                schedule();
                return true;
            }
        });
        return proxy;
    }

    let liveQuery, bindPrefixes, hxLiveNames;

    function buildLiveQuery() {
        let mc = htmx.config.metaCharacter || ':';
        let p = htmx.config.prefix;
        bindPrefixes = ['hx-live' + mc];
        if (p) bindPrefixes.push(p + 'live' + mc);
        let extra = htmx.config.live?.bindPrefix;
        if (extra === undefined) {
            if (window.Alpine) {
                extra = '';
                console.warn('hx-live: Alpine detected; set config.live.bindPrefix.');
            } else {
                extra = ':';
            }
        }
        if (extra) bindPrefixes.push(extra);
        hxLiveNames = ['hx-live'];
        if (p) hxLiveNames.push(p + 'live');
        let bind = bindPrefixes.map(bp => `starts-with(name(), "${bp}")`).join(' or ');
        let effect = hxLiveNames.map(n => `@${n}`).join(' or ');
        liveQuery = new XPathEvaluator().createExpression(`.//*[@*[${bind}] or ${effect}]`);
    }

    function extractBindingName(attrName) {
        for (let p of bindPrefixes) {
            if (attrName.startsWith(p) && attrName.length > p.length) return attrName.slice(p.length);
        }
    }

    function cleanupLive(elt) {
        let prop = elt._htmx;
        if (!prop?.liveRuns) return;
        for (let run of prop.liveRuns) fns.delete(run);
        delete prop.liveRuns;
        delete prop.effectRegistered;
        delete prop.bindings;
    }

    function processElement(elt) {
        if (elt.closest('[hx-ignore]')) return;
        let prop = api.htmxProp(elt);
        if (!prop.effectRegistered) {
            let hxLiveName = hxLiveNames.find(n => elt.hasAttribute(n));
            if (hxLiveName) {
                prop.effectRegistered = true;
                registerLive(elt, elt.getAttribute(hxLiveName));
            }
        }
        prop.bindings ||= new Set();
        for (let a of elt.attributes) {
            let name = extractBindingName(a.name);
            if (!name || prop.bindings.has(name)) continue;
            prop.bindings.add(name);
            registerLive(elt, a.value, name);
        }
    }

    function processLive(root) {
        if (!liveQuery) buildLiveQuery();
        if (root.nodeType === 1) processElement(root);
        let iter = liveQuery.evaluate(root), node, nodes = [];
        while (node = iter.iterateNext()) nodes.push(node);
        for (node of nodes) processElement(node);
    }

    function registerLive(elt, code, attrName) {
        ensureActive();
        let binding = attrName !== undefined;
        let debounce = getDebounce(elt);
        let hasAwait = /\bawait\b/.test(code);
        let overlapping = !binding && hasAwait;
        let isAsync = !binding || hasAwait;
        let exec;
        let running = false;
        let run = async () => {
            if (!elt.isConnected) {
                fns.delete(run);
                return;
            }
            if (overlapping && running) return;
            running = overlapping;
            try {
                exec ||= api.executeJavaScript(elt, { debounce }, code, binding, isAsync, true);
                let value = isAsync ? await exec() : exec();
                if (binding) {
                    writeAttrBinding(elt, attrName, value);
                    if (isAsync) observer?.takeRecords();
                }
            } catch (e) {
                if (e !== dbSym) console.error('hx-live expression failed', e, binding ? { elt, attr: attrName } : { elt });
            } finally {
                if (overlapping) queueMicrotask(() => running = false);
            }
        };
        fns.add(run);
        let prop = api.htmxProp(elt);
        prop.liveRuns = prop.liveRuns || new Set();
        prop.liveRuns.add(run);
        run();
    }

    function writeAttrBinding(elt, attrName, value) {
        if (typeof value === 'function') throw new TypeError('hx-live: binding returned a function');
        if (attrName === 'text') {
            let s = value == null ? '' : String(value);
            if (elt.textContent !== s) elt.textContent = s;
            return;
        }
        if (attrName === 'html') {
            let s = value == null ? '' : String(value);
            if (elt.innerHTML !== s) elt.innerHTML = s;
            return;
        }
        if (attrName === 'style') { applyStyleBinding(elt, value); return; }
        if (attrName === 'class' || attrName.startsWith('.')) {
            applyClassBinding(elt, attrName, value);
            return;
        }
        if (readAttr(elt, attrName) === value) return;
        writeAttr(elt, attrName, value);
    }

    htmx.live = {
        q: s => makeQ(document.documentElement)(s),
        debounce: makeDebounce(),
        refresh: () => schedule(),
        take: (target, name, scope) => applyTake(htmx.live.q(target).arr(), name, scope),
        toggle: (target, name, ...values) => htmx.live.q(target).forEach(e => applyToggle(e, name, ...values)),
        forEvent: (...args) => forEvent(null, ...args),
        nextFrame: () => new Promise(r => requestAnimationFrame(r))
    };
    htmx.live.$ = htmx.live.q;

    htmx.registerExtension('hx-live', {
        init: (internalAPI) => {
            api = internalAPI;
        },
        htmx_before_cleanup: (elt) => {
            cleanupLive(elt);
        },
        htmx_before_morph_attr: (elt, detail) => {
            if (!liveQuery) buildLiveQuery();
            if (bindPrefixes.some(p => detail.attrName.startsWith(p))) cleanupLive(elt);
        },
        htmx_after_process: (elt) => {
            processLive(elt);
        },
        htmx_before_swap: () => {
            swaps++;
        },
        htmx_finally_swap: () => {
            if (--swaps === 0 && fns.size > 0) schedule();
        },
        htmx_scope: (elt, detail) => {
            let prop = api.htmxProp(elt);
            Object.assign(detail.scope, prop.liveScope ||= makeExpressionScope(elt));
            detail.code = rewriteClass(detail.code);
            if (htmx.config.live?.useDollar) detail.scope.$ = detail.scope.q;
        }
    });
})();
