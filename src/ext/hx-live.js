// hx-live extension: reactive live expressions + q() proxy + scope helpers.
// Hooks:
//   htmx:after:process  find new [hx-live] elements and register them
//   htmx:before:swap    increment swap depth (defer recomputes)
//   htmx:swap:finally   decrement, fire one consolidated recompute
//   htmx:scope          inject q, wait, trigger, debounce into JS expression scopes
(() => {
    let api;
    let fns = new Set();
    let pending = false;
    let dbSym = Symbol();
    let observer = null;
    let recomputeBound = null;
    let swaps = 0;
    let i = 0;
    let start = 0;
    let warned = false;

    const OBSERVE_OPTIONS = { childList: true, subtree: true, attributes: true, characterData: true };

    function ensureActive() {
        if (observer) return;
        recomputeBound = () => schedule();
        document.addEventListener('input', recomputeBound, true);
        document.addEventListener('change', recomputeBound, true);
        observer = new MutationObserver(recomputeBound);
        observer.observe(document.documentElement, OBSERVE_OPTIONS);
    }

    function deactivate() {
        if (!observer) return;
        document.removeEventListener('input', recomputeBound, true);
        document.removeEventListener('change', recomputeBound, true);
        observer.disconnect();
        observer = null;
        recomputeBound = null;
    }

    function schedule() {
        if (pending) return;
        if (swaps > 0) return;
        let now = Date.now();
        if (now - start > 1000) {
            start = now;
            i = 0;
            warned = false;
        }
        if (++i > 50 && !warned) {
            console.warn('htmx: hx-live recompute exceeded 50/sec.');
            warned = true;
        }
        pending = true;
        queueMicrotask(() => {
            // Detach observer while writing so our own writes don't queue records.
            observer?.disconnect();
            fns.forEach(f => f());
            if (fns.size === 0) {
                deactivate();
            } else {
                observer.observe(document.documentElement, OBSERVE_OPTIONS);
            }
            pending = false;
        });
    }

    let BOOLEAN_ATTRS = new Set([
        'disabled','hidden','required','readonly','open','inert',
        'multiple','autofocus','novalidate','default','reversed',
        'loop','muted','controls','autoplay','playsinline',
        'formnovalidate','async','defer','ismap','typemustmatch',
        'allowfullscreen','itemscope','nomodule'
    ]);
    let PROPERTY_ATTRS = new Set(['checked','value','selected']);
    let STRINGY_BOOLEAN_ATTRS = new Set(['contenteditable','draggable','spellcheck']);

    /**
     * Get or set an attribute, class, or property-backed value on one or more elements.
     *
     * @param {Element[]} elts - Target elements.
     * @param {string} name - Class (`.foo`), `'class'`, or attribute name.
     * @param {*} [value] - Value to set. Omit for getter (reads from first element).
     * @returns {*} Getter result; setter returns nothing.
     *
     * @example
     * attr('hidden')                  // boolean: is hidden present?
     * attr('hidden', true)            // set hidden=""
     * attr('.active')                 // boolean: has class .active?
     * attr('.active', cond)           // add/remove class
     * attr('class', 'foo bar')        // multi-class string
     * attr('class', { active: cond }) // multi-class object
     * attr('aria-expanded', open)     // ARIA: always "true"/"false"
     * attr('value', 'hello')          // sync DOM property + attribute
     * attr('contenteditable', false)  // "false", not removed
     * attr('data-x', null)            // remove attribute
     */
    function applyAttr(elts, name, ...rest) {
        let isClass = name.startsWith('.');
        let isMultiClass = name === 'class';
        let isAria = name.startsWith('aria-');
        let isPropAttr = PROPERTY_ATTRS.has(name);

        if (rest.length === 0) {
            let e = elts[0];
            if (!e) return undefined;
            if (isClass) return e.classList.contains(name.slice(1));
            if (isMultiClass) return e.getAttribute('class');
            if (isAria) return e.getAttribute(name) === 'true';
            if (BOOLEAN_ATTRS.has(name)) return e.hasAttribute(name);
            if (isPropAttr) return e[name];
            return e.getAttribute(name);
        }

        let value = rest[0];
        for (let e of elts) {
            if (isClass) {
                e.classList.toggle(name.slice(1), !!value);
                if (e.classList.length === 0) e.removeAttribute('class');
            } else if (isMultiClass) {
                applyMultiClass(e, value);
            } else if (isAria) {
                // Strings and numbers pass through (e.g. aria-current="page",
                // aria-pressed="mixed", aria-valuenow="50"). Other values coerce
                // to "true"/"false". Never removed.
                let attrVal = (typeof value === 'string' || typeof value === 'number')
                    ? String(value)
                    : (value ? 'true' : 'false');
                e.setAttribute(name, attrVal);
            } else if (isPropAttr) {
                if (value === false || value == null) {
                    e[name] = (typeof e[name] === 'boolean') ? false : '';
                    e.removeAttribute(name);
                } else if (value === true) {
                    e[name] = true;
                    e.setAttribute(name, '');
                } else {
                    e[name] = value;
                    e.setAttribute(name, String(value));
                }
            } else if (BOOLEAN_ATTRS.has(name)) {
                if (value) e.setAttribute(name, '');
                else e.removeAttribute(name);
            } else if (STRINGY_BOOLEAN_ATTRS.has(name)) {
                if (value === null || value === undefined) e.removeAttribute(name);
                else if (value === true) e.setAttribute(name, 'true');
                else if (value === false) e.setAttribute(name, 'false');
                else e.setAttribute(name, String(value));
            } else {
                if (value === null || value === undefined || value === false) e.removeAttribute(name);
                else e.setAttribute(name, value === true ? '' : String(value));
            }
        }
    }

    function applyStyleBinding(elt, value) {
        let prop = api.htmxProp(elt);
        let oldManaged = prop.liveStyles || new Set();
        let newManaged = new Set();

        if (typeof value === 'string') {
            for (let decl of value.split(';')) {
                let idx = decl.indexOf(':');
                if (idx < 0) continue;
                let k = decl.slice(0, idx).trim();
                let v = decl.slice(idx + 1).trim();
                if (k) {
                    newManaged.add(k);
                    elt.style.setProperty(k, v);
                }
            }
        } else if (value && typeof value === 'object') {
            for (let [k, v] of Object.entries(value)) {
                let cssProp = camelToKebab(k);
                newManaged.add(cssProp);
                if (v == null || v === '') elt.style.removeProperty(cssProp);
                else elt.style.setProperty(cssProp, String(v));
            }
        }
        for (let k of oldManaged) if (!newManaged.has(k)) elt.style.removeProperty(k);
        if (elt.style.length === 0) elt.removeAttribute('style');
        prop.liveStyles = newManaged;
    }

    function camelToKebab(s) {
        return s.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
    }

    // `data.foo` reads/writes to closest ancestor with `data-foo`.
    // `has` trap lets `hx-on:click="with (data) { x++; y-- }"` work: data-* keys
    // bind to the proxy, all other identifiers fall through to outer scope.
    function makeDataProxy(elt) {
        return new Proxy({}, {
            get: (_, prop) => {
                if (typeof prop !== 'string') return undefined;
                let kebab = camelToKebab(prop);
                let ancestor = elt.closest('[data-' + kebab + ']');
                if (!ancestor) return undefined;
                let raw = ancestor.dataset[prop];
                try { return JSON.parse(raw); } catch { return raw; }
            },
            set: (_, prop, val) => {
                if (typeof prop !== 'string') return false;
                let kebab = camelToKebab(prop);
                let target = elt.closest('[data-' + kebab + ']') || elt;
                target.dataset[prop] = typeof val === 'string' ? val : JSON.stringify(val);
                return true;
            },
            has: (_, prop) => {
                if (typeof prop !== 'string') return false;
                let kebab = camelToKebab(prop);
                return !!elt.closest('[data-' + kebab + ']');
            }
        });
    }

    function applyMultiClass(elt, value) {
        let prop = api.htmxProp(elt);
        let oldManaged = prop.liveClasses || new Set();
        let newManaged = new Set();

        if (typeof value === 'string') {
            for (let c of value.trim().split(/\s+/).filter(Boolean)) {
                newManaged.add(c);
                elt.classList.add(c);
            }
        } else if (value && typeof value === 'object') {
            for (let [key, cond] of Object.entries(value)) {
                for (let c of key.trim().split(/\s+/).filter(Boolean)) {
                    newManaged.add(c);
                    elt.classList.toggle(c, !!cond);
                }
            }
        }
        for (let c of oldManaged) if (!newManaged.has(c)) elt.classList.remove(c);
        if (elt.classList.length === 0) elt.removeAttribute('class');
        prop.liveClasses = newManaged;
    }

    function applyTake(targets, name, scope) {
        let isClass = name.startsWith('.');
        let key = isClass ? name.slice(1) : name;
        let isAria = name.startsWith('aria-');
        // Default scope picks only matching sources, not the whole page.
        let selector = scope == null
            ? (isClass ? '.' + key : '[' + name + ']')
            : typeof scope === 'string' ? scope
            : scope.from || '*';
        let sources = document.querySelectorAll(selector);
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
     * @param {string} name - Class (`.foo`) or attribute name.
     * @param {string|string[]} [values] - Cycle list (pipe-delimited string or array). Omit for binary flip.
     * @param {Element} element - DOM element to mutate.
     *
     * @example
     * toggle('.active')                      // toggle class
     * toggle('aria-expanded')                // flip "true" ↔ "false"
     * toggle('hidden')                       // toggle attribute presence
     * toggle('data-view', 'grid|list|table') // cycle attribute through values
     * toggle('.size', 'sm|md|lg')            // cycle classes (one at a time)
     * toggle('data-open', 'on|')             // 'on' ↔ absent slot
     */
    function applyToggle(name, values, element) {
        let isClass = name.startsWith('.');
        let key = isClass ? name.slice(1) : name;
        let isAria = name.startsWith('aria-');
        let asArray = values && (typeof values === 'string'
            ? values.split('|').map(v => v.trim())
            : values);

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
                if (p === 'toggle') return (name, values) => { elts.forEach(e => applyToggle(name, values, e)); return proxy; };
                if (p === 'attr') return (name, ...rest) => {
                    if (rest.length === 0) return applyAttr(elts, name);
                    applyAttr(elts, name, ...rest);
                    return proxy;
                };
                if (p === 'data') return elts[0] ? makeDataProxy(elts[0]) : undefined;
                if (arrayMethods.has(p)) return elts[p].bind(elts);
                let v = elts[0]?.[p];
                if (typeof v === 'function') return (...a) => elts.map(e => e[p](...a))[0];
                if (v && typeof v === 'object') return qProxy(elts.map(e => e[p]));
                return v;
            },
            set: (_, p, v) => {
                elts.forEach(e => e[p] = v);
                schedule();
                return true;
            }
        });
        return proxy;
    }

    function processLive(root) {
        let extName = htmx.config.prefix + 'live';
        let elts = [...(root.querySelectorAll?.('*') ?? [])];
        if (root.nodeType === 1) elts.unshift(root);
        for (let elt of elts) {
            if (elt.closest('[hx-ignore]')) continue;
            let prop = api.htmxProp(elt);

            // Extended form: bare hx-live="code".
            if (!prop.liveRegistered && (elt.hasAttribute('hx-live') || elt.hasAttribute(extName))) {
                let attrName = elt.hasAttribute('hx-live') ? 'hx-live' : extName;
                prop.liveRegistered = true;
                ensureActive();
                let code = elt.getAttribute(attrName);
                let debounce = getDebounce(elt);
                let run = async () => {
                    if (!elt.isConnected) {
                        fns.delete(run);
                        return;
                    }
                    try {
                        await api.executeJavaScript(elt, { debounce }, code, false);
                    } catch (e) {
                        if (e !== dbSym) console.error('htmx: hx-live expression threw', e, { elt });
                    }
                };
                fns.add(run);
                run();
            }

            // Simple form: each hx-live:<attr> or :<attr> attribute.
            for (let a of elt.attributes) {
                let attrName;
                if (a.name.startsWith('hx-live:') && a.name.length > 8) attrName = a.name.slice(8);
                else if (a.name.length > 1 && a.name[0] === ':') attrName = a.name.slice(1);
                else continue;
                prop.liveAttrs = prop.liveAttrs || new Set();
                if (prop.liveAttrs.has(attrName)) continue;
                prop.liveAttrs.add(attrName);
                registerSimpleLive(elt, attrName, a.value);
            }
        }
    }

    function registerSimpleLive(elt, attrName, code) {
        ensureActive();
        let debounce = getDebounce(elt);
        let isAsync = /\bawait\b/.test(code);
        let run = isAsync ? async () => {
            if (!elt.isConnected) {
                fns.delete(run);
                return;
            }
            try {
                let value = await api.executeJavaScript(elt, { debounce }, code, true);
                writeAttrBinding(elt, attrName, value);
                observer?.takeRecords();
            } catch (e) {
                if (e !== dbSym) console.error('htmx: hx-live expression threw', e, { elt, attr: attrName });
            }
        } : () => {
            if (!elt.isConnected) {
                fns.delete(run);
                return;
            }
            try {
                let value = api.executeJavaScript(elt, { debounce }, code, true, false);
                writeAttrBinding(elt, attrName, value);
            } catch (e) {
                if (e !== dbSym) console.error('htmx: hx-live expression threw', e, { elt, attr: attrName });
            }
        };
        fns.add(run);
        run();
    }

    function writeAttrBinding(elt, attrName, value) {
        if (attrName === 'text') { elt.textContent = value == null ? '' : String(value); return; }
        if (attrName === 'html') { elt.innerHTML = value == null ? '' : String(value); return; }
        if (attrName === 'style') { applyStyleBinding(elt, value); return; }
        // Everything else (class, .class, aria-*, boolean, property-sync, regular) → applyAttr.
        applyAttr([elt], attrName, value);
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
        toggle: (target, name, values) => [...asTargets(target)].forEach(e => applyToggle(name, values, e)),
        attr: (target, name, ...rest) => applyAttr([...asTargets(target)], name, ...rest),
        forEvent: (...args) => forEvent(null, ...args),
        nextFrame: () => new Promise(r => requestAnimationFrame(r))
    };

    htmx.registerExtension('hx-live', {
        init: (internalAPI) => {
            api = internalAPI;
        },
        htmx_after_process: (elt) => {
            processLive(elt);
        },
        htmx_before_swap: () => {
            swaps++;
        },
        htmx_swap_finally: () => {
            if (--swaps === 0 && fns.size > 0) schedule();
        },
        htmx_scope: (elt, detail) => {
            Object.assign(detail.scope, {
                q: makeQ(elt),
                forEvent: (...args) => forEvent(elt, ...args),
                nextFrame: () => new Promise(r => requestAnimationFrame(r)),
                trigger: (type, detail, bubbles) => htmx.trigger(elt, type, detail, bubbles),
                debounce: getDebounce(elt),
                take: (name, scope) => applyTake([elt], name, scope),
                toggle: (name, values) => applyToggle(name, values, elt),
                attr: (name, ...rest) => applyAttr([elt], name, ...rest),
                insert: (pos, html) => elt.insertAdjacentHTML(positions[pos], html),
                matches: (sel) => elt.matches(sel),
                style: elt.style,
                classList: elt.classList,
                data: makeDataProxy(elt)
            });
        }
    });
})();
