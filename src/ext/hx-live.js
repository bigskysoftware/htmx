// hx-live extension: reactive live expressions + q() proxy + scope helpers.
// Hooks into core via:
//   htmx:after:process — find new [hx-live] elements and register them
//   htmx:before:swap   — increment swap depth (defer recomputes)
//   htmx:swap:finally  — decrement; fire one consolidated recompute
//   htmx:scope         — inject q, wait, trigger, debounce into JS expression scopes
(() => {
    let api;
    let fns = new Set();
    let pending = false;
    let dbSym = Symbol();
    let mo = null;
    let recomputeBound = null;
    let swaps = 0;
    let i = 0;
    let start = 0;

    function ensureActive() {
        if (mo) return;
        recomputeBound = () => schedule();
        document.addEventListener('input', recomputeBound, true);
        document.addEventListener('change', recomputeBound, true);
        mo = new MutationObserver(recomputeBound);
        mo.observe(document.documentElement, {
            childList: true, subtree: true, attributes: true, characterData: true
        });
    }

    function deactivate() {
        if (!mo) return;
        document.removeEventListener('input', recomputeBound, true);
        document.removeEventListener('change', recomputeBound, true);
        mo.disconnect();
        mo = null;
        recomputeBound = null;
    }

    function schedule() {
        if (pending) return;
        if (swaps > 0) return;
        let now = Date.now();
        if (now - start > 1000) {
            start = now;
            i = 0;
        }
        if (++i > 50) {
            console.warn('htmx: hx-live recompute exceeded 50/sec, deactivating. Likely a self-mutating expression.');
            deactivate();
            fns.clear();
            return;
        }
        pending = true;
        queueMicrotask(() => {
            fns.forEach(f => f());
            if (fns.size === 0) deactivate();
            setTimeout(() => { pending = false; });
        });
    }

    // Add cls to every element in `targets`; remove from `source` (or, if undefined, from
     // `targets[0].parentElement.children`). source accepts an Element (expanded to itself
     // + descendants matching .cls), a selector string, or any iterable of elements.
    function applyTake(targets, cls, source) {
        if (source === undefined) source = targets[0]?.parentElement;
        let sources;
        if (source && source.nodeType && source.querySelectorAll) {
            sources = [source, ...source.querySelectorAll('.' + cls)];
        } else if (typeof source === 'string') {
            sources = document.querySelectorAll(source);
        } else if (source) {
            sources = source;
        } else {
            sources = [];
        }
        for (let s of sources) {
            s.classList?.remove(cls);
            if (s.classList?.length === 0) s.removeAttribute('class');
        }
        for (let t of targets) t.classList?.add(cls);
    }

    // forEvent: race events/timeouts. See hx-live docs.
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

    // toggle('.foo')              — class toggle
    // toggle('@disabled')         — attribute presence toggle
    // toggle('@x=v')              — attribute presence-with-value (add v ↔ remove)
    // toggle('@x=a|b|c')          — strict cycle through values (always present)
    // toggle('@x=on|')            — cycle 'on' ↔ absent (trailing empty = absent slot)
    // toggle('*display=none')     — style presence-with-value (set ↔ clear)
    // toggle('*display=a|b')      — style cycle through values
    let toggleRe = /^([.@*])([^=]+)(?:=(.*))?$/;
    function applyToggle(spec, e) {
        let m = spec.trim().match(toggleRe);
        if (!m) return;
        let [, kind, name, vals] = m;
        name = name.trim();
        let values = vals === undefined ? null : vals.split('|').map(v => v.trim());
        if (kind === '.') {
            e.classList.toggle(name);
        } else if (kind === '@') {
            if (!values) {
                e.toggleAttribute(name);
            } else if (values.length === 1) {
                if (e.hasAttribute(name)) e.removeAttribute(name);
                else e.setAttribute(name, values[0]);
            } else {
                let cur = e.getAttribute(name);
                let idx = values.indexOf(cur === null ? '' : cur);
                let next = values[(idx + 1) % values.length];
                if (next === '') e.removeAttribute(name);
                else e.setAttribute(name, next);
            }
        } else { // '*'
            if (!values) return;
            if (values.length === 1) {
                if (e.style[name]) e.style[name] = '';
                else e.style[name] = values[0];
            } else {
                let idx = values.indexOf(e.style[name] || '');
                e.style[name] = values[(idx + 1) % values.length];
            }
        }
    }

    function makeDebounce() {
        // Channels keyed by fn.toString() for the closure form; null for the promise form.
        // Promise-form cancellation works by rejecting the awaiting async — no callsite key needed.
        // Closure form needs a key because closures lack an enclosing async context to abort.
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
            let dirMatch = sel.match(/^(next|prev|closest|first|last)\s+(.+)$/);
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

    function qProxy(elts) {
        let positions = { before: 'beforebegin', after: 'afterend', start: 'afterbegin', end: 'beforeend' };
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
                if (p === 'take') return (cls, from) => { applyTake(elts, cls, from); return proxy; };
                if (p === 'toggle') return (...specs) => { elts.forEach(e => specs.forEach(s => applyToggle(s, e))); return proxy; };
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
        let attrSel = '[hx-live]' + (htmx.config.prefix ? ',[' + htmx.config.prefix + 'live]' : '');
        let elts = [...(root.querySelectorAll?.(attrSel) ?? [])];
        if (root.matches?.(attrSel)) elts.unshift(root);
        for (let elt of elts) {
            if (elt.closest('[hx-ignore]')) continue;
            let prop = api.htmxProp(elt);
            if (prop.liveRegistered) continue;
            let attrName = elt.hasAttribute('hx-live') ? 'hx-live' : (htmx.config.prefix + 'live');
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
    }

    let asTargets = t => t == null ? []
        : typeof t === 'string' ? document.querySelectorAll(t)
        : t.nodeType ? [t]
        : t;

    htmx.live = {
        q: s => makeQ(document.documentElement)(s),
        debounce: makeDebounce(),
        refresh: () => schedule(),
        take: (target, cls, source) => applyTake([...asTargets(target)], cls, source),
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
                take: (cls, source) => applyTake([elt], cls, source),
                toggle: (...specs) => specs.forEach(s => applyToggle(s, elt))
            });
        }
    });
})();
