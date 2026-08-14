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

    let BOOLEAN_ATTRS = new Set('disabled hidden required readonly open inert multiple autofocus novalidate default reversed loop muted controls autoplay playsinline formnovalidate async defer ismap typemustmatch allowfullscreen itemscope nomodule checked selected'.split(' '));
    let PROPERTY_BINDING_ATTRS = new Set(['checked','value','selected']);
    let STRING_BOOLEAN_ATTRS = new Set(['contenteditable','draggable','spellcheck','writingsuggestions']);
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
        if (BOOLEAN_ATTRS.has(name)) return element.hasAttribute(name);
        let value = element.getAttribute(name);
        if (STRING_BOOLEAN_ATTRS.has(name)) try { return JSON.parse(value.toLowerCase()); } catch {}
        if (NUMERIC_ATTRS.has(name) && value?.trim() && isFinite(value)) return +value;
        return value;
    }

    function writeAttr(element, name, value) {
        name = normalizeAttrName(element, name);
        if (typeof value === 'function') {
            value = value(readAttr(element, name));
            if (typeof value?.then === 'function') throw new TypeError('assigned function must return a value, not a promise');
        }
        if (name.startsWith('aria-')) {
            writeAria(element, name.slice(5), value);
        } else if (name.startsWith('data-')) {
            writeData(element, name, value);
        } else if (PROPERTY_BINDING_ATTRS.has(name)) {
            applyPropertyBinding(element, name, value);
        } else if (BOOLEAN_ATTRS.has(name)) {
            element.toggleAttribute(name, !!value);
        } else if (value === null || value === undefined) {
            element.removeAttribute(name);
        } else {
            element.setAttribute(name, String(value));
        }
    }

    function eachTarget(elts, findOwner, fallback, fn) {
        let targets = new Set();
        for (let elt of elts) {
            let target = findOwner(elt) || (fallback ? elt : null);
            if (target) targets.add(target);
        }
        for (let target of targets) fn(target);
    }

    function makeAttrProxy(elts, cascades, scope) {
        let findOwner = (elt, name) => cascades
            ? elt.closest('[' + CSS.escape(normalizeAttrName(elt, name)) + ']')
            : elt;
        return new Proxy({}, {
            get: (_, name) => {
                if (name === 'class') return scope.class;
                if (typeof name !== 'string') return undefined;
                let owner = elts[0] && findOwner(elts[0], name);
                return owner ? readAttr(owner, name) : undefined;
            },
            set: (_, name, value) => {
                if (typeof name !== 'string') return false;
                eachTarget(elts, elt => findOwner(elt, name), true, elt => {
                    writeAttr(elt, name, value);
                });
                return true;
            },
            deleteProperty: (_, name) => {
                if (typeof name !== 'string') return false;
                eachTarget(elts, elt => findOwner(elt, name), false, elt => writeAttr(elt, name, null));
                return true;
            }
        });
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
    let CLASS_TOKEN = /(['"`\/])(?:\\.|(?!\1)[^\\\n])*\1|(?<![.\w$])class(?=\s*[.[])/g;

    function rewriteClass(src) {
        return src.replace(CLASS_TOKEN, token => {
            if (token === 'class') return 'attr.class';
            if (token[0] === '`') return token.replace(
                /\$\{((?:[^{}]|\{[^{}]*\})*)\}/g,
                (_, code) => '${' + rewriteClass(code) + '}'
            );
            return token;
        });
    }

    let stringAria = new Set('activedescendant details errormessage keyshortcuts label placeholder roledescription valuetext'.split(' '));
    let listAria = new Set('controls describedby dropeffect flowto labelledby owns relevant'.split(' '));
    function readClass(element, name) {
        return element.classList.contains(name);
    }

    function writeClass(elt, name, value) {
        if (typeof value === 'function') {
            value = value(readClass(elt, name));
            if (typeof value?.then === 'function') throw new TypeError('assigned function must return a value, not a promise');
        }
        elt.classList.toggle(name, !!value);
        if (!elt.classList.length) elt.removeAttribute('class');
    }

    let CLASS_WRITE_METHODS = new Set('add remove toggle replace'.split(' '));

    function makeClassProxy(elts) {
        let first = elts[0];
        let write = (name, value) => { for (let e of elts) writeClass(e, name, value); };
        return new Proxy({}, {
            get: (_, name) => {
                if (!first) return name === Symbol.iterator ? () => [][Symbol.iterator]() : undefined;
                if (name === 'assign') {
                    return value => {
                        if (!value || typeof value !== 'object' || Array.isArray(value)) {
                            console.warn(`htmx: class.assign expects an object, got ${Array.isArray(value) ? 'array' : typeof value}.`, { elts });
                            return;
                        }
                        for (let e of elts) writeClasses(e, value);
                    };
                }
                if (name in first.classList) {
                    let member = first.classList[name];
                    if (typeof member !== 'function') return member;
                    if (typeof name !== 'string' || elts.length === 1 || !CLASS_WRITE_METHODS.has(name)) {
                        return member.bind(first.classList);
                    }
                    return (...args) => {
                        let result;
                        for (let i = 0; i < elts.length; i++) {
                            let next = elts[i].classList[name](...args);
                            if (i === 0) result = next;
                        }
                        return result;
                    };
                }
                if (typeof name !== 'string') return undefined;
                return readClass(first, name);
            },
            set: (_, name, value) => {
                if (typeof name !== 'string') return false;
                if (name === 'value') {
                    for (let elt of elts) elt.classList.value = value;
                    return true;
                }
                for (let elt of elts) writeClass(elt, name, value);
                return true;
            },
            deleteProperty: (_, name) => {
                if (typeof name !== 'string') return false;
                write(name, false);
                return true;
            },
            has: (_, name) => typeof name === 'string' && !!first && readClass(first, name),
            ownKeys: () => first ? [...first.classList] : [],
            getOwnPropertyDescriptor: (_, name) => first && readClass(first, name)
                ? { enumerable: true, configurable: true }
                : undefined
        });
    }

    function makeClosestClassProxy(elts) {
        let owner = (elt, name) => elt.closest('.' + CSS.escape(name));
        return new Proxy({}, {
            get: (_, name) => typeof name === 'string' && !!elts[0] ? !!owner(elts[0], name) : undefined,
            set: (_, name, value) => {
                if (typeof name !== 'string') return false;
                eachTarget(elts, elt => owner(elt, name), true, elt => {
                    writeClass(elt, name, value);
                });
                return true;
            },
            deleteProperty: (_, name) => {
                if (typeof name !== 'string') return false;
                eachTarget(elts, elt => owner(elt, name), false, elt => writeClass(elt, name, false));
                return true;
            }
        });
    }

    function makeStateScope(elts, cascades) {
        let data, aria, classes, attr;
        let scope = {
            get data() { return data ||= makeDataProxy(elts, cascades); },
            get aria() { return aria ||= makeAriaProxy(elts, cascades); },
            get class() { return classes ||= cascades ? makeClosestClassProxy(elts) : makeClassProxy(elts); },
            get attr() { return attr ||= makeAttrProxy(elts, cascades, scope); }
        };
        return scope;
    }

    function writeAria(elt, key, value) {
        let name = 'aria-' + key;
        if (value == null) elt.removeAttribute(name);
        else elt.setAttribute(name, listAria.has(key) && Array.isArray(value) ? value.join(' ') : String(value));
    }

    function readAria(elt, key) {
        let value = elt?.getAttribute('aria-' + key);
        if (value == null || stringAria.has(key)) return value;
        if (listAria.has(key)) return value.trim() ? value.trim().split(/\s+/) : [];
        return parseJSON(value);
    }

    function makeAriaProxy(elts, cascades = true) {
        let findOwner = (elt, name) => cascades
            ? elt.closest('[' + name + ']')
            : elt.hasAttribute(name) ? elt : null;
        return new Proxy({}, {
            get: (_, prop) => {
                if (typeof prop !== 'string') return undefined;
                let key = prop.toLowerCase();
                let name = 'aria-' + key;
                let owner = elts[0] && findOwner(elts[0], name);
                return readAria(owner, key);
            },
            set: (_, prop, value) => {
                if (typeof prop !== 'string') return false;
                let key = prop.toLowerCase();
                let name = 'aria-' + key;
                eachTarget(elts, elt => findOwner(elt, name), true, elt => {
                    writeAttr(elt, name, value);
                });
                return true;
            },
            deleteProperty: (_, prop) => {
                if (typeof prop !== 'string') return false;
                let key = prop.toLowerCase();
                let name = 'aria-' + key;
                eachTarget(elts, elt => findOwner(elt, name), false, elt => elt.removeAttribute(name));
                return true;
            }
        });
    }

    function writeData(elt, name, value) {
        if (value === undefined) elt.removeAttribute(name);
        else elt.setAttribute(name, typeof value === 'object' || parseJSON(value) !== value ? JSON.stringify(value) : value);
    }

    // `data.foo` reads/writes to closest ancestor with `data-foo`.
    // `has` trap lets `hx-on:click="with (data) { x++; y-- }"` work: data-* keys
    // bind to the proxy, all other identifiers fall through to outer scope.
    function makeDataProxy(elts, cascades = true) {
        let findOwner = (elt, kebab) => cascades
            ? elt.closest('[data-' + kebab + ']')
            : elt.hasAttribute('data-' + kebab) ? elt : null;
        return new Proxy({}, {
            get: (_, prop) => {
                if (typeof prop !== 'string') return undefined;
                let kebab = camelToKebab(prop);
                let name = 'data-' + kebab;
                let ancestor = elts[0] && findOwner(elts[0], kebab);
                if (!ancestor) return undefined;
                return readData(ancestor, name);
            },
            set: (_, prop, val) => {
                if (typeof prop !== 'string') return false;
                let kebab = camelToKebab(prop);
                let name = 'data-' + kebab;
                eachTarget(elts, elt => findOwner(elt, kebab), true, elt => {
                    writeAttr(elt, name, val);
                });
                return true;
            },
            deleteProperty: (_, prop) => {
                if (typeof prop !== 'string') return false;
                let kebab = camelToKebab(prop);
                let name = 'data-' + kebab;
                eachTarget(elts, elt => findOwner(elt, kebab), false, elt => elt.removeAttribute(name));
                return true;
            },
            has: (_, prop) => {
                if (typeof prop !== 'string') return false;
                let kebab = camelToKebab(prop);
                return !!elts[0] && !!findOwner(elts[0], kebab);
            },
            ownKeys: () => {
                let result = [];
                let seen = new Set();
                for (let node = elts[0]; node; node = cascades ? node.parentElement : null) {
                    for (let key of Object.keys(node.dataset)) {
                        if (key !== 'htmxPowered' && !seen.has(key)) {
                            seen.add(key);
                            result.push(key);
                        }
                    }
                }
                return result;
            },
            getOwnPropertyDescriptor: (_, prop) => {
                if (typeof prop !== 'string' || prop === 'htmxPowered') return;
                let kebab = camelToKebab(prop);
                if (elts[0] && findOwner(elts[0], kebab)) return { enumerable: true, configurable: true };
            }
        });
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

    function writeClasses(elt, value) {
        let written = [];
        if (typeof value === 'string') {
            for (let c of value.trim().split(/\s+/).filter(Boolean)) {
                written.push(c);
                writeClass(elt, c, true);
            }
        } else if (value && typeof value === 'object') {
            for (let [key, cond] of Object.entries(value)) {
                for (let c of key.trim().split(/\s+/).filter(Boolean)) {
                    written.push(c);
                    writeClass(elt, c, !!cond);
                }
            }
        }
        return written;
    }

    function applyMultiClass(elt, value) {
        let prop = api.htmxProp(elt);
        let oldManaged = prop.liveClasses || new Set();
        let newManaged = new Set(writeClasses(elt, value));
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
            : document.querySelectorAll(typeof scope === 'string' ? scope : scope?.from || auto);
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
        for (let a of args) if (a?.nodeType) target = a;
        return new Promise(resolve => {
            let cleanups = [], done = false;
            let fire = v => { if (done) return; done = true; for (let c of cleanups) c(); resolve(v); };
            for (let a of args) {
                if (a == null || a?.nodeType) continue;
                let ms = typeof a === 'number' ? a
                    : (typeof a === 'string' ? htmx.parseInterval(a) : undefined);
                if (ms !== undefined && ms > 0) {
                    let id = setTimeout(() => fire(a), ms);
                    cleanups.push(() => clearTimeout(id));
                } else if (typeof a === 'string') {
                    let h = evt => fire(evt);
                    target.addEventListener(a, h, { once: true });
                    cleanups.push(() => target.removeEventListener(a, h));
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
        let asArray = list && (typeof list === 'string'
            ? list.split('|').map(v => v.trim())
            : list);

        if (!asArray) {
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
            let cur = asArray.findIndex(v => v && element.classList.contains(v));
            if (cur >= 0) element.classList.remove(asArray[cur]);
            let next = asArray[(cur + 1) % asArray.length];
            if (next) element.classList.add(next);
        } else {
            let curVal = element.getAttribute(name) ?? '';
            let cur = asArray.indexOf(curVal);
            let next = asArray[(cur + 1) % asArray.length];
            if (next === '') element.removeAttribute(name);
            else element.setAttribute(name, next);
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

    let arrayMethods = new Set(['map', 'filter', 'reduce', 'reduceRight', 'forEach', 'some', 'every',
        'find', 'findIndex', 'findLast', 'findLastIndex', 'flatMap', 'flat',
        'slice', 'indexOf', 'lastIndexOf', 'includes', 'join', 'at']);

    let positions = { before: 'beforebegin', after: 'afterend', start: 'afterbegin', end: 'beforeend' };

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
                if (p === 'insert') return (pos, s) => { elts.forEach(e => e.insertAdjacentHTML(positions[pos], s)); return proxy; };
                if (p === 'take') return (name, scope) => { applyTake(elts, name, scope); return proxy; };
                if (p === 'toggle') return (name, ...values) => { elts.forEach(e => applyToggle(e, name, ...values)); return proxy; };
                if (p === 'attr') return (local ||= makeStateScope(elts, false)).attr;
                if (p === 'data') return elts[0] ? (local ||= makeStateScope(elts, false)).data : undefined;
                if (p === 'class') return (local ||= makeStateScope(elts, false)).class;
                if (p === 'closest') return elts[0] ? closest ||= makeStateScope(elts, true) : undefined;
                if (arrayMethods.has(p)) return elts[p].bind(elts);
                if (p === 'aria') return elts[0] ? (local ||= makeStateScope(elts, false)).aria : undefined;
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
                        if (typeof next?.then === 'function') throw new TypeError('assigned function must return a value, not a promise');
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

    let liveQuery, bindPrefixes, bodyAttrs;

    function buildLiveQuery() {
        let mc = htmx.config.metaCharacter || ':';
        let p = htmx.config.prefix;
        bindPrefixes = ['hx-live' + mc];
        if (p) bindPrefixes.push(p + 'live' + mc);
        let extra = htmx.config.live?.bindPrefix;
        if (extra === undefined) {
            if (window.Alpine) {
                extra = '';
                console.warn('hx-live: Alpine.js detected; ":" short-form bindings disabled. Set htmx.config.live.bindPrefix to configure.');
            } else {
                extra = ':';
            }
        }
        if (extra) bindPrefixes.push(extra);
        bodyAttrs = ['hx-live'];
        if (p) bodyAttrs.push(p + 'live');
        let bind = bindPrefixes.map(bp => `starts-with(name(), "${bp}")`).join(' or ');
        let body = bodyAttrs.map(n => `@${n}`).join(' or ');
        liveQuery = new XPathEvaluator().createExpression(`.//*[@*[${bind}] or ${body}]`);
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
        delete prop.liveRegistered;
        delete prop.liveAttrs;
    }

    function processElement(elt) {
        if (elt.closest('[hx-ignore]')) return;
        let prop = api.htmxProp(elt);
        if (!prop.liveRegistered) {
            let bodyAttr = bodyAttrs.find(n => elt.hasAttribute(n));
            if (bodyAttr) {
                prop.liveRegistered = true;
                ensureActive();
                let code = elt.getAttribute(bodyAttr)
                let debounce = getDebounce(elt);
                let exec;
                let run = async () => {
                    if (!elt.isConnected) {
                        fns.delete(run);
                        return;
                    }
                    try {
                        exec ||= api.executeJavaScript(elt, { debounce }, code, false, true, true);
                        await exec();
                    } catch (e) {
                        if (e !== dbSym) console.error('htmx: hx-live expression threw', e, { elt });
                    }
                };
                fns.add(run);
                prop.liveRuns = prop.liveRuns || new Set();
                prop.liveRuns.add(run);
                run();
            }
        }
        prop.liveAttrs ||= new Set();
        for (let a of elt.attributes) {
            let name = extractBindingName(a.name);
            if (!name || prop.liveAttrs.has(name)) continue;
            prop.liveAttrs.add(name);
            registerSimpleLive(elt, name, a.value);
        }
    }

    function processLive(root) {
        if (!liveQuery) buildLiveQuery();
        if (root.nodeType === 1) processElement(root);
        let iter = liveQuery.evaluate(root), node, nodes = [];
        while (node = iter.iterateNext()) nodes.push(node);
        for (node of nodes) processElement(node);
    }

    function registerSimpleLive(elt, attrName, code) {
        ensureActive();
        let debounce = getDebounce(elt);
        let isAsync = /\bawait\b/.test(code);
        let exec;
        let run = async () => {
            if (!elt.isConnected) {
                fns.delete(run);
                return;
            }
            try {
                exec ||= api.executeJavaScript(elt, { debounce }, code, true, isAsync, true);
                let value = isAsync ? await exec() : exec();
                writeAttrBinding(elt, attrName, value);
                if (isAsync) observer?.takeRecords();
            } catch (e) {
                if (e !== dbSym) console.error('htmx: hx-live expression threw', e, { elt, attr: attrName });
            }
        };
        fns.add(run);
        let prop = api.htmxProp(elt);
        prop.liveRuns = prop.liveRuns || new Set();
        prop.liveRuns.add(run);
        run();
    }

    function writeAttrBinding(elt, attrName, value) {
        if (typeof value === 'function') throw new TypeError('binding expression must return a value, not a function');
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

    let asTargets = t => t == null ? []
        : typeof t === 'string' ? document.querySelectorAll(t)
        : t.nodeType ? [t]
        : t;

    htmx.live = {
        q: s => makeQ(document.documentElement)(s),
        debounce: makeDebounce(),
        refresh: () => schedule(),
        take: (target, name, scope) => applyTake([...asTargets(target)], name, scope),
        toggle: (target, name, ...values) => [...asTargets(target)].forEach(e => applyToggle(e, name, ...values)),
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
            let local = makeStateScope([elt], false);
            let closest = makeStateScope([elt], true);
            Object.assign(detail.scope, {
                q: makeQ(elt),
                forEvent: (...args) => forEvent(elt, ...args),
                nextFrame: () => new Promise(r => requestAnimationFrame(r)),
                trigger: (type, detail, bubbles) => htmx.trigger(elt, type, detail, bubbles),
                debounce: getDebounce(elt),
                take: (name, scope) => applyTake([elt], name, scope),
                toggle: (name, ...values) => applyToggle(elt, name, ...values),
                attr: local.attr,
                insert: (pos, html) => elt.insertAdjacentHTML(positions[pos], html),
                matches: (sel) => elt.matches(sel),
                style: elt.style,
                data: closest.data,
                aria: local.aria,
                closest
            });
            detail.code = rewriteClass(detail.code);
            if (htmx.config.live?.useDollar) detail.scope.$ = detail.scope.q;
        }
    });
})();
