// hx-live extension: reactive live expressions + q() proxy + scope helpers.
// Hooks:
//   htmx:after:process  find new [hx-live] elements and register them
//   htmx:before:swap    increment swap depth (defer recompute passes)
//   htmx:finally:swap   decrement, fire one consolidated recompute pass
//   htmx:scope          inject q, wait, trigger, debounce into JS expression scopes
(() => {
    let api;
    let liveExpressions = new Set();
    let pending = false;
    let dbSym = Symbol();
    let observer = null;
    let inputListener = null;
    let swaps = 0;
    let recomputeWarned = false;

    const OBSERVE_OPTIONS = { childList: true, subtree: true, attributes: true, characterData: true };
    const RECOMPUTE_WARN_MS = 16;

    let inputDebounceId = null;

    function ensureActive() {
        if (observer) return;
        recomputeWarned = false;
        let inputDebounceMs = htmx.parseInterval(htmx.config.live?.inputDebounce) ?? 100;
        inputListener = () => {
            clearTimeout(inputDebounceId);
            inputDebounceId = setTimeout(schedule, inputDebounceMs);
        };
        document.addEventListener('input', inputListener, true);
        document.addEventListener('change', schedule, true);
        observer = new MutationObserver(schedule);
        observer.observe(document.documentElement, OBSERVE_OPTIONS);
    }

    function runRecomputePass() {
        let expressionCount = liveExpressions.size;
        if (expressionCount === 0) return;
        let startedAt = performance.now();
        liveExpressions.forEach(run => run());
        let elapsed = performance.now() - startedAt;
        if (recomputeWarned || elapsed <= RECOMPUTE_WARN_MS) return;
        console.warn(`htmx: hx-live overloaded: ${elapsed.toFixed(1)}ms pass; ${expressionCount} expr/pass`);
        recomputeWarned = true;
    }

    function deactivate() {
        if (!observer) return;
        clearTimeout(inputDebounceId);
        inputDebounceId = null;
        document.removeEventListener('input', inputListener, true);
        inputListener = null;
        document.removeEventListener('change', schedule, true);
        observer.disconnect();
        observer = null;
    }

    function schedule() {
        if (pending || swaps > 0) return;
        pending = true;
        queueMicrotask(() => {
            // Detach observer while writing so our own writes don't queue records.
            observer?.disconnect();
            runRecomputePass();
            if (liveExpressions.size === 0) {
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
    let BOOLEAN_PROPERTY_ATTRS = new Set(['checked','selected']);
    let STRING_PROPERTY_ATTRS = new Set(['value']);
    let STRINGY_BOOLEAN_ATTRS = new Set(['contenteditable','draggable','spellcheck']);

    function getAttr(elts, name) {
        let elt = elts[0];
        if (!elt) return undefined;
        if (name.startsWith('.')) return elt.classList.contains(name.slice(1));
        if (name === 'class') return elt.getAttribute('class');
        if (name.startsWith('aria-')) return elt.getAttribute(name) === 'true';
        if (BOOLEAN_ATTRS.has(name)) return elt.hasAttribute(name);
        if (BOOLEAN_PROPERTY_ATTRS.has(name) || STRING_PROPERTY_ATTRS.has(name)) return elt[name];
        return elt.getAttribute(name);
    }

    function setDomAttr(elt, name, value) {
        if (value == null) {
            if (elt.hasAttribute(name)) elt.removeAttribute(name);
        } else if (elt.getAttribute(name) !== value) {
            elt.setAttribute(name, value);
        }
    }

    function setAttr(elts, name, value) {
        if (name.startsWith('.')) {
            let className = name.slice(1);
            let present = !!value;
            for (let elt of elts) {
                if (elt.classList.contains(className) !== present) elt.classList.toggle(className, present);
                if (elt.classList.length === 0 && elt.hasAttribute('class')) elt.removeAttribute('class');
            }
            return;
        }
        if (name === 'class') {
            for (let elt of elts) setClasses(elt, value);
            return;
        }
        if (BOOLEAN_PROPERTY_ATTRS.has(name)) {
            let present = !!value;
            let attrValue = present ? '' : null;
            for (let elt of elts) {
                if (elt[name] === present && elt.getAttribute(name) === attrValue) continue;
                elt[name] = present;
                setDomAttr(elt, name, attrValue);
            }
            return;
        }
        if (STRING_PROPERTY_ATTRS.has(name)) {
            let propValue = value == null ? '' : String(value);
            let attrValue = value == null ? null : propValue;
            for (let elt of elts) {
                if (elt[name] === propValue && elt.getAttribute(name) === attrValue) continue;
                elt[name] = propValue;
                setDomAttr(elt, name, attrValue);
            }
            return;
        }
        let attrValue;
        if (name.startsWith('aria-')) {
            // Strings and numbers pass through. Other values become "true" or "false".
            attrValue = (typeof value === 'string' || typeof value === 'number')
                ? String(value)
                : String(!!value);
        } else if (BOOLEAN_ATTRS.has(name)) {
            attrValue = value ? '' : null;
        } else if (STRINGY_BOOLEAN_ATTRS.has(name)) {
            attrValue = value == null ? null : String(value);
        } else {
            attrValue = value == null || value === false ? null : (value === true ? '' : String(value));
        }
        for (let elt of elts) setDomAttr(elt, name, attrValue);
    }

    function parseStyles(value) {
        let styles = [];
        if (typeof value === 'string') {
            for (let declaration of value.split(';')) {
                let colon = declaration.indexOf(':');
                if (colon < 0) continue;
                let name = declaration.slice(0, colon).trim();
                if (name) styles.push([name, declaration.slice(colon + 1).trim()]);
            }
        } else if (value && typeof value === 'object') {
            for (let [name, styleValue] of Object.entries(value)) {
                styles.push([camelToKebab(name), styleValue == null || styleValue === '' ? null : String(styleValue)]);
            }
        }
        return styles;
    }

    function setStyleValue(style, name, value) {
        let before = style.cssText;
        if (value == null) style.removeProperty(name);
        else style.setProperty(name, value);
        return style.cssText !== before;
    }

    function setStyles(elt, value) {
        let prop = api.htmxProp(elt);
        let oldStyles = prop.liveStyles || new Set();
        let styles = parseStyles(value);
        let styleNames = new Set(styles.map(([name]) => name));
        let parsed = elt.ownerDocument.createElement('div').style;
        let writes = [];
        parsed.cssText = elt.style.cssText;

        for (let name of oldStyles) {
            if (!styleNames.has(name) && setStyleValue(parsed, name, null)) writes.push([name, null]);
        }
        for (let [name, styleValue] of styles) {
            if (setStyleValue(parsed, name, styleValue)) writes.push([name, styleValue]);
        }
        if (elt.style.cssText !== parsed.cssText) {
            for (let [name, styleValue] of writes) setStyleValue(elt.style, name, styleValue);
        }
        if (elt.style.length === 0 && elt.hasAttribute('style')) elt.removeAttribute('style');
        prop.liveStyles = styleNames;
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
            },
            ownKeys: () => {
                let result = [];
                let seen = new Set();
                for (let node = elt; node; node = node.parentElement) {
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
                if (elt.closest('[data-' + kebab + ']')) return { enumerable: true, configurable: true };
            }
        });
    }

    function parseClasses(value) {
        let classes = new Map();
        if (typeof value === 'string') {
            for (let name of value.trim().split(/\s+/).filter(Boolean)) classes.set(name, true);
        } else if (value && typeof value === 'object') {
            for (let [names, present] of Object.entries(value)) {
                for (let name of names.trim().split(/\s+/).filter(Boolean)) classes.set(name, !!present);
            }
        }
        return classes;
    }

    function setClasses(elt, value) {
        let prop = api.htmxProp(elt);
        let oldClasses = prop.liveClasses || new Set();
        let classes = parseClasses(value);

        for (let [name, present] of classes) {
            if (elt.classList.contains(name) !== present) elt.classList.toggle(name, present);
        }
        for (let name of oldClasses) {
            if (!classes.has(name) && elt.classList.contains(name)) elt.classList.remove(name);
        }
        if (elt.classList.length === 0 && elt.hasAttribute('class')) elt.removeAttribute('class');
        prop.liveClasses = new Set(classes.keys());
    }

    function take(elts, name, scope) {
        let selector = name.startsWith('.') ? name : '[' + name + ']';
        let root = scope == null ? elts[0]?.parentElement
            : scope.nodeType ? scope : null;
        let sources = root
            ? [root, ...root.querySelectorAll(selector)]
            : document.querySelectorAll(typeof scope === 'string' ? scope : scope?.from || selector);
        let targets = new Set(elts);
        let others = [...sources].filter(elt => !targets.has(elt));
        if (name.startsWith('.') || name.startsWith('aria-')) {
            setAttr(others, name, false);
            setAttr(elts, name, true);
        } else {
            for (let elt of others) setDomAttr(elt, name, null);
            for (let elt of elts) setDomAttr(elt, name, '');
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
     * @param {Element} elt - DOM element to mutate.
     * @param {string} name - Class (`.foo`) or attribute name.
     * @param {string|string[]} [values] - Cycle list (pipe-delimited string or array). Omit for binary flip.
     *
     * @example
     * toggle('.active')                      // toggle class
     * toggle('aria-expanded')                // flip "true" ↔ "false"
     * toggle('hidden')                       // toggle attribute presence
     * toggle('data-view', 'grid|list|table') // cycle attribute through values
     * toggle('.size', 'sm|md|lg')            // cycle classes (one at a time)
     * toggle('data-open', 'on|')             // 'on' ↔ absent slot
     */
    function toggle(elt, name, values) {
        let isClass = name.startsWith('.');
        let key = isClass ? name.slice(1) : name;
        let isAria = name.startsWith('aria-');
        let asArray = values && (typeof values === 'string'
            ? values.split('|').map(v => v.trim())
            : values);

        if (!asArray) {
            if (isClass) elt.classList.toggle(key);
            else if (isAria) {
                let cur = elt.getAttribute(name);
                elt.setAttribute(name, cur === 'true' ? 'false' : 'true');
            } else {
                elt.toggleAttribute(name);
            }
            return;
        }
        if (isClass) {
            let cur = asArray.findIndex(v => v && elt.classList.contains(v));
            if (cur >= 0) elt.classList.remove(asArray[cur]);
            let next = asArray[(cur + 1) % asArray.length];
            if (next) elt.classList.add(next);
        } else {
            let curVal = elt.getAttribute(name) ?? '';
            let cur = asArray.indexOf(curVal);
            let next = asArray[(cur + 1) % asArray.length];
            if (next === '') elt.removeAttribute(name);
            else elt.setAttribute(name, next);
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
                if (p === 'take') return (name, scope) => { take(elts, name, scope); return proxy; };
                if (p === 'toggle') return (name, values) => { elts.forEach(elt => toggle(elt, name, values)); return proxy; };
                if (p === 'attr') return (name, ...rest) => {
                    if (rest.length === 0) return getAttr(elts, name);
                    setAttr(elts, name, rest[0]);
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
                console.warn('hx-live: Alpine.js detected — ":" short-form bindings disabled. Set htmx.config.live.bindPrefix to configure.');
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
        for (let run of prop.liveRuns) liveExpressions.delete(run);
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
                let run = async () => {
                    if (!elt.isConnected) {
                        liveExpressions.delete(run);
                        return;
                    }
                    try {
                        await api.executeJavaScript(elt, { debounce }, code, false);
                    } catch (e) {
                        if (e !== dbSym) console.error('htmx: hx-live expression threw', e, { elt });
                    }
                };
                liveExpressions.add(run);
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

    function registerSimpleLive(elt, bindingName, code) {
        ensureActive();
        let debounce = getDebounce(elt);
        let isAsync = /\bawait\b/.test(code);
        let run = isAsync ? async () => {
            if (!elt.isConnected) {
                liveExpressions.delete(run);
                return;
            }
            try {
                let exprResult = await api.executeJavaScript(elt, { debounce }, code, true);
                renderBinding(elt, bindingName, exprResult);
                observer?.takeRecords();
            } catch (e) {
                if (e !== dbSym) console.error('htmx: hx-live expression threw', e, { elt, attr: bindingName });
            }
        } : () => {
            if (!elt.isConnected) {
                liveExpressions.delete(run);
                return;
            }
            try {
                let exprResult = api.executeJavaScript(elt, { debounce }, code, true, false);
                renderBinding(elt, bindingName, exprResult);
            } catch (e) {
                if (e !== dbSym) console.error('htmx: hx-live expression threw', e, { elt, attr: bindingName });
            }
        };
        liveExpressions.add(run);
        let prop = api.htmxProp(elt);
        prop.liveRuns = prop.liveRuns || new Set();
        prop.liveRuns.add(run);
        run();
    }

    /** Render one evaluated `:<name>` binding to its DOM target. */
    function renderBinding(elt, name, exprResult) {
        if (name === 'text') {
            let text = exprResult == null ? '' : String(exprResult);
            if (elt.textContent !== text) elt.textContent = text;
            return;
        }
        if (name === 'html') {
            let html = exprResult == null ? '' : String(exprResult);
            if (elt.innerHTML !== html) elt.innerHTML = html;
            return;
        }
        if (name === 'style') { setStyles(elt, exprResult); return; }
        setAttr([elt], name, exprResult);
    }

    let asTargets = t => t == null ? []
        : typeof t === 'string' ? document.querySelectorAll(t)
        : t.nodeType ? [t]
        : t;

    htmx.live = {
        q: s => makeQ(document.documentElement)(s),
        debounce: makeDebounce(),
        refresh: () => schedule(),
        take: (target, name, scope) => take([...asTargets(target)], name, scope),
        toggle: (target, name, values) => [...asTargets(target)].forEach(elt => toggle(elt, name, values)),
        attr: (target, name, ...rest) => rest.length === 0
            ? getAttr([...asTargets(target)], name)
            : setAttr([...asTargets(target)], name, rest[0]),
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
            if (--swaps === 0 && liveExpressions.size > 0) schedule();
        },
        htmx_scope: (elt, detail) => {
            Object.assign(detail.scope, {
                q: makeQ(elt),
                forEvent: (...args) => forEvent(elt, ...args),
                nextFrame: () => new Promise(r => requestAnimationFrame(r)),
                trigger: (type, detail, bubbles) => htmx.trigger(elt, type, detail, bubbles),
                debounce: getDebounce(elt),
                take: (name, scope) => take([elt], name, scope),
                toggle: (name, values) => toggle(elt, name, values),
                attr: (name, ...rest) => rest.length === 0
                    ? getAttr([elt], name)
                    : setAttr([elt], name, rest[0]),
                insert: (pos, html) => elt.insertAdjacentHTML(positions[pos], html),
                matches: (sel) => elt.matches(sel),
                style: elt.style,
                classList: elt.classList,
                data: makeDataProxy(elt)
            });
            if (htmx.config.live?.useDollar) detail.scope.$ = detail.scope.q;
        }
    });
})();
