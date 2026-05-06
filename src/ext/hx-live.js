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

    function toElts(x) {
        if (!x) return [];
        if (typeof x === 'string') return [...document.querySelectorAll(x)];
        if (x.nodeType) return [x];
        return [...x];
    }

    function take(cls, target, source) {
        for (let e of toElts(source)) e.classList.remove(cls);
        for (let e of toElts(target)) e.classList.add(cls);
    }

    function makeDebounce() {
        let last = 0, reject;
        return ms => new Promise((res, rej) => {
            reject?.(dbSym);
            reject = rej;
            let id = ++last;
            setTimeout(() => id === last && (reject = null, res()), ms);
        });
    }

    function makeWait(ctx) {
        return (...args) => new Promise(r => {
            if (!args.length) return r();
            let done, cleanups = [];
            let resolve = v => {
                if (done) return;
                done = true;
                for (let c of cleanups) c();
                r(v);
            };
            for (let a of args) {
                if (typeof a === 'number') {
                    let id = setTimeout(() => resolve(a), a);
                    cleanups.push(() => clearTimeout(id));
                } else {
                    let h = e => resolve(e);
                    ctx.addEventListener(a, h, { once: true });
                    cleanups.push(() => ctx.removeEventListener(a, h));
                }
            }
        });
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
                roots = inMatch[2] === 'this' ? [ctx] : [...document.querySelectorAll(inMatch[2])];
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

    function qProxy(elts) {
        let positions = { before: 'beforebegin', after: 'afterend', start: 'afterbegin', end: 'beforeend' };
        return new Proxy({}, {
            get: (_, p) => {
                if (p === 'count') return elts.length;
                if (p === 'arr') return () => elts.slice();
                if (p === Symbol.iterator) return () => elts.values();
                if (p === 'q') return s => {
                    let out = new Set();
                    for (let e of elts) for (let r of makeQ(e, e)(s).arr()) out.add(r);
                    return qProxy([...out]);
                };
                if (p === 'trigger') return (t, d, b) => elts.forEach(e => htmx.trigger(e, t, d, b));
                if (p === 'insert') return (pos, s) =>
                    elts.forEach(e => e.insertAdjacentHTML(positions[pos], s));
                if (p === 'take') return (cls, from) => take(cls, elts, from);
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
            let debounce = makeDebounce();
            let run = async () => {
                if (!elt.isConnected) {
                    fns.delete(run);
                    return;
                }
                try {
                    await api.executeJavaScript(elt, { debounce }, code, false);
                } catch (e) {
                    if (e !== dbSym) console.error(e);
                }
            };
            fns.add(run);
            run();
        }
    }

    htmx.q = s => makeQ(document.documentElement)(s);
    htmx.take = take;

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
                wait: makeWait(elt),
                trigger: (type, detail, bubbles) => htmx.trigger(elt, type, detail, bubbles),
                debounce: makeDebounce(),
                take: (cls, source) => take(cls, elt, source)
            });
        }
    });
})();
