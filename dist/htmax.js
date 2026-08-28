var htmx = (() => {

    /**
     * HCON, htmx's mini config language. Mirrors the JSON API.
     *
     * Used by hx-trigger, hx-swap, hx-vals, and other htmx config attributes.
     *
     * @see https://four.htmx.org/docs#hcon
     */
    const HCON = {
        /**
         * Parses an HCON string into an object.
         *
         * @example
         * HCON.parse('foo:1 bar:true');     // {foo: 1, bar: true}
         * HCON.parse('sse.mode:once');      // {sse: {mode: 'once'}}
         * HCON.parse('{"foo": 1}');         // {foo: 1}
         */
        parse(string) {
            if (!string) return {};
            if (string.startsWith('{')) return JSON.parse(string);
            let pattern = /(?:"([^"]+)"|'([^']+)'|([^\s,:]+))(?:\s*:\s*(?:"([^"]*)"|'([^']*)'|<((?:[^/]|\/(?!>))+)\/>|([^\s,]+)))?(?=\s|,|$)/g;
            let result = {};
            for (let match of string.matchAll(pattern)) {
                let [,
                    doubleQuotedKey,    // "key"
                    singleQuotedKey,    // 'key'
                    bareKey,            //  key
                    doubleQuotedValue,  // "value"
                    singleQuotedValue,  // 'value'
                    hyperscriptValue,   // <value/>
                    bareValue,          //  value
                ] = match;

                // pick this match's key and value forms
                let key = doubleQuotedKey ?? singleQuotedKey ?? bareKey;
                let value = (doubleQuotedValue ?? singleQuotedValue ?? hyperscriptValue ?? bareValue ?? 'true').trim();

                // JSON-parse if possible (e.g. "5" -> 5; "abc" stays string)
                try { value = JSON.parse(value); } catch {}

                // bare a.b -> {a:{b:...}}; quoted "a.b" -> {"a.b":...}
                let isDottedPath = bareKey?.includes('.');
                let pair = isDottedPath
                    ? key.split('.').reduceRight((acc, segment) => ({[segment]: acc}), value)
                    : {[key]: value};
                HCON.merge(pair, result);
            }
            return result;
        },

        /**
         * Splits an HCON-aware string at top-level commas.
         * Commas inside [], (), <.../>, "...", '...' are preserved.
         *
         * @example
         * HCON.split('a:1, b:2');                // ['a:1', ' b:2']
         * HCON.split('from:".a, .b", click');    // ['from:".a, .b"', ' click']
         */
        split(string) {
            return string.split(/,(?![^\[]*\])(?![^(]*\))(?![^<]*\/>)(?=(?:[^"']|"[^"]*"|'[^']*')*$)/);
        },

        /**
         * Deep-merges a source (HCON string or object) into a target.
         *
         * @example
         * HCON.merge({a: {b: 1}}, {a: {c: 2}});   // {a: {b: 1, c: 2}}
         * HCON.merge('a.b:1', {a: {c: 2}});       // {a: {b: 1, c: 2}}
         */
        merge(source, target) {
            if (typeof source === 'string') source = HCON.parse(source);

            for (let [key, val] of Object.entries(source)) {
                if (['__proto__', 'constructor', 'prototype'].includes(key)) continue;

                let sourceIsObject = val?.constructor === Object;
                let targetIsObject = target[key]?.constructor === Object;

                if (sourceIsObject && targetIsObject) {
                    HCON.merge(val, target[key]);
                } else {
                    target[key] = val;
                }
            }
            return target;
        },
    };

    class RequestQueue {
        #current = null
        #queue = []

        /** Returns "run", "queued", or "dropped" */
        admit(strategy, runRequest, abortRequest) {
            if (!this.#current) {
                this.#current = {strategy, abort: abortRequest}
                return "run"
            }
            if (strategy === "replace" || (strategy !== "abort" && this.#current.strategy === "abort")) {
                this.#queue = []
                this.#current.abort?.()
                this.#current = {strategy, abort: abortRequest}
                return "run"
            }
            if (strategy === "queue all") {
                this.#queue.push(runRequest)
            } else if (strategy === "queue last") {
                this.#queue = [runRequest]
            } else if (strategy !== "abort" && strategy !== "drop" && this.#queue.length === 0) {
                // default queue first
                this.#queue.push(runRequest)
            } else {
                return "dropped"
            }
            return "queued"
        }

        continue() {
            this.#current = null    // free current slot
            this.#queue.shift()?.() // run next request
        }

        abort() {
            this.#current?.abort?.()
        }
    }

    class Htmx {

        #HCON = HCON
        #extMethods = new Map();
        #approvedExt = '';
        #registeredExt = new Set();
        _loc = window.location;  // mockable for testing
        #internalAPI;
        #Function = Function;
        #AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        #ttPolicy = { createHTML: s => s, createScript: s => s };
        #actionSelector
        #boostSelector = "a,form";
        #verbs = ["get", "post", "put", "patch", "delete", "query"];
        #hxOnQuery
        #transitionQueue
        #historyAbort
        #historyInitialized
        #processingTransition

        constructor() {
            this.#initHtmxConfig();
            this.#initRequestIndicatorCss();
            this.#actionSelector = this.#prefixSelector('[hx-action],[hx-get],[hx-post],[hx-put],[hx-patch],[hx-delete],[hx-query]');
            this.#hxOnQuery = new XPathEvaluator().createExpression(`.//*[@*[${this.#prefixes("hx-on").map(p => `starts-with(name(), "${p}")`).join(' or ')}]]`);
            this.#internalAPI = {
                HCON,
                attributeValue: this.#attributeValue.bind(this),
                parseTriggerSpecs: this.#parseTriggerSpecs.bind(this),
                determineMethodAndAction: this.#determineMethodAndAction.bind(this),
                createRequestContext: this.#createRequestContext.bind(this),
                collectFormData: this.#collectFormData.bind(this),
                getAttributeObject: this.#getAttributeObject.bind(this),
                insertContent: this.#insertContent.bind(this),
                morph: this.#morph.bind(this),
                isSoftMatch: this.#isSoftMatch.bind(this),
                initSecurity: (ttPolicy, syncFn, asyncFn) => {
                    if (ttPolicy) this.#ttPolicy = ttPolicy;
                    if (syncFn) this.#Function = syncFn;
                    if (asyncFn) this.#AsyncFunction = asyncFn;
                },
                onTrigger: this.#onTrigger.bind(this),
                htmxProp: this.#htmxProp.bind(this),
                triggerHtmxEvent: this.#trigger.bind(this),
                executeJavaScript: this.#executeJavaScript.bind(this)
            };
            let init = () => this.initialize();
            if (document.readyState === 'loading') {
                document.addEventListener("DOMContentLoaded", init)
            } else {
                setTimeout(init)
            }
        }

        #initHtmxConfig() {
            this.version = '4.0.0'
            this.config = {
                logAll: false,
                prefix: "data-hx-",
                transitions: false,
                history: true,
                mode: 'same-origin',
                defaultSwap: "innerHTML",
                defaultFocusScroll: false,
                indicatorClass: "htmx-indicator",
                requestClass: "htmx-request",
                includeIndicatorCSS: true,
                defaultTimeout: 60000, /* 60 second default timeout */
                extensions: '',
                morphIgnore: ["data-htmx-powered"],
                morphSkip: '[hx-morph-skip]',
                morphSkipChildren: '[hx-morph-skip-children]',
                morphScanLimit: 10,
                noSwap: [204, 304],
                implicitInheritance: false,
                defaultSettleDelay: 1,
                allowEmptySwapAfterOOB: false
            }
            let metaConfig = document.querySelector('meta[name="htmx-config"]');
            if (metaConfig) {
                HCON.merge(metaConfig.content, this.config);
            }
            this.#approvedExt = this.config.extensions;
        }

        #initRequestIndicatorCss() {
            if (this.config.includeIndicatorCSS !== false) {
                let indicator = this.config.indicatorClass;
                let request = this.config.requestClass;
                let sheet = new CSSStyleSheet();
                sheet.replaceSync(
                    `.${indicator}{opacity:0;visibility: hidden} ` +
                    `.${request} .${indicator}, .${request}.${indicator}{opacity:1;visibility: visible;transition: opacity 200ms ease-in}`
                );
                document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
            }
        }

        registerExtension(name, extension) {
            if (this.#approvedExt && !this.#approvedExt.split(/,\s*/).includes(name)) return false;
            if (this.#registeredExt.has(name)) return false;
            this.#registeredExt.add(name);
            if (extension.init) extension.init(this.#internalAPI);
            Object.entries(extension).forEach(([key, value]) => {
                if(!this.#extMethods.get(key)?.push(value)) this.#extMethods.set(key, [value]);
            });
        }

        #ignore(elt) {
            let p = this.config.prefix;
            return !elt.closest || elt.closest('[hx-ignore]') != null || (p && elt.closest(`[${p}ignore]`) != null);
        }

        #attr(elt, name) {
            let p = this.config.prefix;
            return elt.getAttribute(name) ?? (p ? elt.getAttribute(name.replace('hx-', p)) : null);
        }

        #attrName(elt, name) {
            let p = this.config.prefix && name.replace('hx-', this.config.prefix);
            return elt.hasAttribute(name) ? name : (p && elt.hasAttribute(p) ? p : null);
        }

        #prefixSelector(s) {
            return this.#prefixes(s).join(',');
        }

        #prefixes(s) {
            let result = [s];
            if (this.config.prefix) result.push(s.replaceAll('hx-', this.config.prefix));
            return result;
        }

        #queryEltAndDescendants(elt, selector) {
            let results = [...(elt.querySelectorAll?.(selector) ?? [])];
            if (elt.matches?.(selector)) {
                results.unshift(elt);
            }
            return results;
        }

        #normalizeSwapStyle(style) {
            return style === 'before' ? 'beforebegin' :
                   style === 'after' ? 'afterend' :
                   style === 'prepend' ? 'afterbegin' :
                   style === 'append' ? 'beforeend' : style;
        }

        #findThisElements(elt, attrName) {
            let result = [];
            this.#attributeValue(elt, attrName, undefined, (val, elt) => {
                if (val?.split(/\s*[,:]\s*/).includes('this')) result.push(elt);
            });
            return result;
        }

        #attributeValue(elt, name, defaultVal, eltCollector) {
            name = this.#maybeAdjustMetaCharacter(name);
            let inherited = this.#maybeAdjustMetaCharacter(":inherited");
            let append = this.#maybeAdjustMetaCharacter(":append");

            let val = this.#attr(elt, name) ?? this.#attr(elt, name + inherited);
            if (val != null) return eltCollector ? eltCollector(val, elt) : val;

            let n1 = CSS.escape(this.config.implicitInheritance ? name : name + inherited);
            let n2 = CSS.escape(name + inherited + append);
            let inheritSelector = this.#prefixSelector(`[${n1}],[${n2}]`);
            let appendName = this.#attrName(elt, name + append) ?? this.#attrName(elt, name + inherited + append);
            if (appendName) {
                let appendValue = elt.getAttribute(appendName);
                let parent = elt.parentNode?.closest?.(inheritSelector);
                if (eltCollector) eltCollector(appendValue, elt);
                if (parent) {
                    let parentVal = this.#attributeValue(parent, name, undefined, eltCollector);
                    return parentVal ? (parentVal + "," + appendValue).replace(/[{}]/g, '') : appendValue;
                }
                return appendValue;
            }

            let parent = elt.parentNode?.closest?.(inheritSelector);
            if (parent) {
                val = this.#attributeValue(parent, name, undefined, eltCollector);
                if (!eltCollector && val && this.config.implicitInheritance) {
                    this.#triggerExtensions(elt, "htmx:after:implicitInheritance", {elt, name, parent})
                }
                return val;
            }
            return defaultVal;
        }

        #parseTriggerSpecs(spec) {
            return HCON.split(spec).flatMap(s => {
                let [,name,rest] = s.match(/^\s*(\S+\[[^\]]*\]|\S+)\s*(.*?)\s*$/) ?? [];
                if (!name) return [];  // skip empty/whitespace-only tokens
                if (/\[[^\]]*$/.test(name)) throw "unterminated:" + name;  // e.g. click[ctrlKey
                return [{name, ...HCON.parse(rest)}];  // spread modifiers (delay, throttle, etc.) onto result
            });
        }

        #determineMethodAndAction(elt, evt) {
            let method = this.#attributeValue(elt, "hx-method");
            let action = this.#attributeValue(elt, "hx-action");
            if (!action) {
                for (let verb of this.#verbs) {
                    let verbAction = this.#attributeValue(elt, "hx-" + verb);
                    if (verbAction != null) {
                        action = verbAction;
                        method = verb;
                        break;
                    }
                }
            }
            if (this.#isBoosted(elt)) {
                action ||= evt.submitter?.getAttribute?.("formAction") || elt.getAttribute(elt.matches("a") ? "href" : "action");
            }
            method ||= evt.submitter?.getAttribute?.("formmethod") || elt.getAttribute("method") || "GET";
            return {action, method: method.toUpperCase()};
        }

        #htmxProp(elt) {
            if (!elt._htmx) {
                elt._htmx = { listeners: [], triggerSpecs: [] };
                elt.setAttribute('data-htmx-powered', 'true');
            }
            return elt._htmx;
        }

        #htmxState(elt) {
            return elt._htmx_state ||= {};
        }

        #initializeElement(elt) {
            if (this.#shouldInitialize(elt) && this.#trigger(elt, "htmx:before:init", {}, true)) {
                let htmxProp = this.#htmxProp(elt);
                htmxProp.initialized = true;
                htmxProp.eventHandler = this.#createHtmxEventHandler(elt);
                this.#initializeTriggers(elt);
                this.#trigger(elt, "htmx:after:init", {}, true)
            }
        }

        #createHtmxEventHandler(elt) {
            return async (evt) => {
                try {
                    let ctx = this.#createRequestContext(elt, evt);
                    await this.#handleTriggerEvent(ctx);
                } catch (e) {
                    this.#trigger(elt, 'htmx:error', { error: e });
                }
            };
        }

        #createRequestContext(sourceElement, sourceEvent) {
            let {action, method} = this.#determineMethodAndAction(sourceElement, sourceEvent);
            let [fullAction, anchor] = (action || '').split('#');
            let ac = new AbortController();
            let ctx = {
                sourceElement,
                sourceEvent,
                status: "created",
                select: this.#attributeValue(sourceElement, "hx-select"),
                selectOOB: this.#attributeValue(sourceElement, "hx-select-oob"),
                target: this.#attributeValue(sourceElement, "hx-target"),
                swap: this.#attributeValue(sourceElement, "hx-swap") ?? this.config.defaultSwap,
                push: this.#attributeValue(sourceElement, "hx-push-url"),
                replace: this.#attributeValue(sourceElement, "hx-replace-url"),
                transition: this.config.transitions,
                confirm: this.#attributeValue(sourceElement, "hx-confirm"),
                request: {
                    validate: "true" === this.#attributeValue(sourceElement, "hx-validate", sourceElement.matches('form') && !sourceElement.noValidate && !sourceEvent.submitter?.formNoValidate ? "true" : "false"),
                    action: fullAction,
                    anchor,
                    method,
                    headers: this.#createCoreHeaders(sourceElement),
                    abort: ac.abort.bind(ac),
                    credentials: "same-origin",
                    signal: ac.signal,
                    mode: this.config.mode
                }
            };
            // Apply boost config overrides
            if (sourceElement._htmx?.boosted) {
                HCON.merge(sourceElement._htmx.boosted, ctx);
            }
            ctx.target = this.#resolveTarget(sourceElement, ctx.target);
            if (ctx.target) {
                ctx.request.headers["HX-Target"] = this.#buildIdentifier(ctx.target);
            }

            // Apply hx-config overrides
            let hxConfig = this.#attributeValue(sourceElement, "hx-config");
            if (hxConfig) {
                HCON.merge(hxConfig, ctx.request);
                ctx.request.mode = this.config.mode;  // mode is security-sensitive, never allow per-element override
            }
            return ctx;
        }

        #buildIdentifier(elt) {
            return `${elt.tagName.toLowerCase()}${elt.id ? '#' + encodeURI(elt.id) : ''}`;
        }

        #createCoreHeaders(elt) {
            let headers = {
                "HX-Request": "true",
                "HX-Source": this.#buildIdentifier(elt),
                "HX-Current-URL": location.href,
                "Accept": "text/html"
            };
            if (this.#isBoosted(elt)) {
                headers["HX-Boosted"] = "true"
            }
            return headers;
        }

        #handleHxHeaders(elt, ctx) {
            return this.#getAttributeObject(elt, "hx-headers", obj => {
                for (let key in obj) ctx.request.headers[key] = String(obj[key]);
            }, {ctx});
        }

        #resolveTarget(elt, selector) {
            if (selector instanceof Element) {
                return selector;
            } else if (selector != null) {
                return this.#findOrWarn(elt, selector, "hx-target");
            } else if (this.#isBoosted(elt)) {
                return document.body
            } else {
                return elt;
            }
        }

        #isBoosted(elt) {
            return elt?._htmx?.boosted;
        }

        async #handleTriggerEvent(ctx) {
            let elt = ctx.sourceElement
            let evt = ctx.sourceEvent
            if (!elt.isConnected) return

            if (this.#isModifierKeyClick(evt)) return

            if (this.#shouldCancel(evt)) evt.preventDefault()

            // determine if request uses query params
            let usesQueryParams = /GET|DELETE/.test(ctx.request.method);

            // Only include *enclosing* form info for request types that do not use
            // query parameters (can still be included explicitly with hx-include)
            let form = usesQueryParams
                ? (elt.matches('form') ? elt : null)
                : (elt.form || elt.closest("form"))

            // Build request body
            let body = this.#collectFormData(elt, form, evt.submitter, ctx.request.validate, usesQueryParams)
            if (!body) return  // Validation failed
            let valsResult = this.#getAttributeObject(elt, "hx-vals", obj => {
                ctx.vals = obj; // make available for json extensions
                for (let key in obj) body.set(key, obj[key]);
            }, {ctx});
            if (valsResult) await valsResult; // Only await if it returned a promise
            if (ctx.values) {
                for (let k in ctx.values) {
                    body.delete(k);
                    body.append(k, ctx.values[k]);
                }
            }

            // Handle dynamic headers
            let headersResult = this.#handleHxHeaders(elt, ctx)
            if (headersResult) await headersResult  // Only await if it returned a promise

            // Setup event-dependent request details
            Object.assign(ctx.request, {
                form,
                submitter: evt.submitter,
                body
            })

            if (!this.#trigger(elt, "htmx:config:request", {ctx: ctx})) return
            if (ctx.request.method === 'DIALOG') return

            let javascriptContent = this.#extractJavascriptContent(ctx.request.action);
            if (javascriptContent != null) {
                let data = Object.fromEntries(ctx.request.body);
                await this.#executeJavaScript(ctx.sourceElement, data, javascriptContent, false);
                return
            } else if (usesQueryParams) {
                let url = new URL(ctx.request.action, document.baseURI);

                for (let key of ctx.request.body.keys()) {
                    url.searchParams.delete(key);
                }
                for (let [key, value] of ctx.request.body) {
                    url.searchParams.append(key, value);
                }

                // Keep relative if same origin, otherwise use full URL
                if (url.origin === location.origin) {
                    ctx.request.action = url.pathname + url.search;
                } else {
                    ctx.request.action = url.href;
                }
                ctx.request.body = null;
            } else if ((this.#attributeValue(elt, "hx-encoding") ?? form?.enctype) !== "multipart/form-data") {
                ctx.request.body = new URLSearchParams(ctx.request.body);
            }

            await this.#issueRequest(ctx);
        }

        async #issueRequest(ctx) {
            let elt = ctx.sourceElement
            let syncStrategy = this.#determineSyncStrategy(elt);
            let requestQueue = this.#getRequestQueue(elt);
            this.#initializeAbortListener(elt);

            if (requestQueue.admit(
                syncStrategy,
                () => this.#issueRequest(ctx), // run when ready
                () => ctx.request?.abort?.()    // abort if replaced
            ) !== "run") return

            ctx.status = "issuing"

            let indicators = [];
            let disableElements = [];
            try {
                // Handle confirmation
                if (ctx.confirm) {
                    let confirmed = await new Promise(resolve => {
                        let detail = {ctx, issueRequest: () => resolve(true), dropRequest: () => resolve(false)};
                        if (this.#trigger(elt, "htmx:confirm", detail)) {
                            let js = this.#extractJavascriptContent(ctx.confirm);
                            resolve(js ? this.#executeJavaScript(elt, {ctx}, js, true) : window.confirm(ctx.confirm));
                        }
                    });
                    if (!confirmed) return;
                }

                // initialize timeout & indicators after confirmation
                this.#initTimeout(ctx);
                indicators = this.#showIndicators(elt);
                disableElements = this.#disableElements(elt);

                ctx.fetch ||= window.fetch.bind(window)
                // Set HX-Request-Type based on final target/select (after all modifications)
                ctx.request.headers["HX-Request-Type"] = (ctx.target === document.body || ctx.select) ? "full" : "partial";
                if (!this.#trigger(elt, "htmx:before:request", {ctx})) return;

                let response = await ctx.fetch(ctx.request.action, ctx.request);

                ctx.response = {
                    raw: response,
                    status: response.status,
                    headers: response.headers,
                }
                this.#extractHxHeaders(ctx);
                if (!this.#trigger(elt, "htmx:before:response", {ctx})) return;
                ctx.text = await response.text();
                if (!this.#trigger(elt, "htmx:after:request", {ctx})) return;

                if (ctx.response.status >= 400) {
                    this.#trigger(elt, "htmx:response:error", {ctx})
                }

                if(this.#handleHeadersAndMaybeReturnEarly(ctx)){
                    ctx.keepIndicators = true;
                    return
                }

                if (ctx.status === "issuing") {
                    if (ctx.hx.retarget) ctx.target = ctx.hx.retarget;   // HX-Retarget
                    if (ctx.hx.reswap) ctx.swap = ctx.hx.reswap;       // HX-Reswap
                    if (ctx.hx.reselect) ctx.select = ctx.hx.reselect; // HX-Reselect
                    ctx.status = "response received";
                    this.#handleStatusCodes(ctx);
                    await this.swap(ctx);
                    ctx.status = "swapped";
                }

            } catch (error) {
                ctx.status = "error: " + error;
                this.#trigger(elt, "htmx:error", {ctx, error})
            } finally {
                // An extension that took over the response reports when it has
                // finished delivering. Undefined for a normal request.
                await ctx.extensionPromise?.catch(() => {});
                clearTimeout(ctx.requestTimeout);
                if (ctx.hx?.trigger) { // HX-Trigger
                    this.#handleTriggerHeader(ctx.hx.trigger, ctx.sourceElement);
                }
                this.#trigger(elt, "htmx:finally:request", {ctx})
                if (!ctx.keepIndicators) {
                    this.#hideIndicators(indicators);
                    this.#enableElements(disableElements);
                }

                requestQueue.continue()
            }
        }

        // Extract HX-* response headers into ctx.hx
        // Maps: HX-Trigger -> ctx.hx.trigger, HX-Push-Url -> ctx.hx.pushurl, etc.
        #extractHxHeaders(ctx) {
            ctx.hx = {}
            for (let [k, v] of ctx.response.raw.headers) {
                if (k.toLowerCase().startsWith('hx-')) {
                    ctx.hx[k.slice(3).toLowerCase().replace(/-/g, '')] = v
                }
            }
        }

        // Handle response headers that abort normal swap processing.
        // Returns true if the response was fully handled by a header.
        #handleHeadersAndMaybeReturnEarly(ctx) {
            if (ctx.hx.refresh === 'true') { // HX-Refresh
                this._loc.reload();
                return true
            }
            if (ctx.hx.redirect) { // HX-Redirect
                this._loc.href = ctx.hx.redirect;
                return true
            }
            if (ctx.hx.location) { // HX-Location
                let path = ctx.hx.location, opts = {};
                let parsed = HCON.parse(path);
                if (path[0] === '{' || parsed.path != null) {
                    opts = parsed;
                    path = opts.path;
                    delete opts.path;
                }
                if (opts.push == null && opts.replace == null) opts.push = 'true';
                this.ajax('GET', path, opts);
                return true
            }
        }

        #initTimeout(ctx) {
            let timeout = ctx.request.timeout != null
                ? this.parseInterval(ctx.request.timeout)
                : this.config.defaultTimeout;
            if (timeout) {
                ctx.requestTimeout = setTimeout(() => ctx.request?.abort?.(), timeout);
            }
        }

        #determineSyncStrategy(elt) {
            let hxSync = this.#attributeValue(elt, "hx-sync");
            if (!hxSync) return "queue first";
            let strategy = hxSync.split(":").pop().trim();
            return /^(drop|abort|replace|queue)/.test(strategy) ? strategy : "queue first";
        }

        #getRequestQueue(elt) {
            let hxSync = this.#attributeValue(elt, "hx-sync");
            let syncElt = elt
            if (hxSync) {
                let selector = hxSync.includes(":")
                    ? hxSync.slice(0, hxSync.lastIndexOf(":")).trim()
                    : (/^(drop|abort|replace|queue)/.test(hxSync) ? null : hxSync);
                if (selector) syncElt = this.#findOrWarn(elt, selector, "hx-sync") || elt;
            }
            return this.#htmxState(syncElt).rq ||= new RequestQueue()
        }

        #isModifierKeyClick(evt) {
            return evt.type === 'click' && (evt.ctrlKey || evt.metaKey || evt.shiftKey)
                && !!evt.currentTarget?.closest?.('a[href]')
        }

        #shouldCancel(evt) {
            let elt = evt.currentTarget
            let isSubmit = evt.type === 'submit' && elt?.tagName === 'FORM'
            if (isSubmit) return true

            let isClick = evt.type === 'click' && evt.button === 0
            if (!isClick) return false

            let btn = elt?.closest?.('button, input[type="submit"], input[type="image"]')
            let form = btn?.form || btn?.closest('form')
            let isSubmitButton = btn && !btn.disabled && form &&
                (btn.type === 'submit' || btn.type === 'image' || (!btn.type && btn.tagName === 'BUTTON'))
            if (isSubmitButton) return true

            let link = elt?.closest?.('a')
            if (!link || !link.href) return false

            let href = link.getAttribute('href')
            let isFragmentOnly = href && href.startsWith('#') && href.length > 1
            return !isFragmentOnly
        }

        #initializeTriggers(elt, initialHandler = elt._htmx.eventHandler) {
            let hxTrigger = this.#attributeValue(elt, "hx-trigger");
            let trigger = hxTrigger || (elt.matches("form") ? "submit" :
                elt.matches("input:not([type=button]):not([type=submit]),select,textarea") ? "change" :
                    "click");
            this.#onTrigger(elt, trigger, initialHandler)
        }

        // Wire up event listeners with full modifier support (once, prevent, stop,
        // delay, throttle, changed, capture, passive, from, filter, etc.)
        #onTrigger(elt, specString, handler) {
            let specs = this.#parseTriggerSpecs(specString)
            this.#htmxProp(elt).triggerSpecs.push(...specs)

            for (let spec of specs) {
                spec.listeners = []

                let [eventName, filter] = this.#extractFilter(spec.name);

                // Resolve from: elements (self listens on elt but filters by event.target in guard)
                let fromElts = [elt];
                if (spec.from === 'outside') fromElts = [document];
                else if (spec.from && spec.from !== 'self') fromElts = this.#findAllExt(elt, spec.from);

                // Inner: runs after delay/throttle resolves
                let inner = (evt) => {
                    if (spec.halt || spec.prevent) evt.preventDefault();
                    if (spec.halt || spec.stop || spec.consume) evt.stopPropagation();
                    if (spec.once) {
                        for (let info of spec.listeners) info.fromElt.removeEventListener(info.eventName, info.handler, info);
                    }
                    handler(evt);
                };

                // Wrap inner with delay/throttle if needed
                let timed = inner;
                if (spec.delay) {
                    timed = evt => {
                        clearTimeout(spec.timeout);
                        spec.timeout = setTimeout(() => inner(evt), this.parseInterval(spec.delay));
                    };
                } else if (spec.throttle) {
                    timed = evt => {
                        if (spec.throttled) {
                            spec.throttledEvent = evt;
                        } else {
                            spec.throttled = true;
                            inner(evt);
                            spec.throttleTimeout = setTimeout(() => {
                                spec.throttled = false;
                                if (spec.throttledEvent) {
                                    let e = spec.throttledEvent;
                                    spec.throttledEvent = null;
                                    timed(e);
                                }
                            }, this.parseInterval(spec.throttle));
                        }
                    };
                }

                // Guarded: pre-timing checks that determine if event should proceed
                spec.handler = (evt) => {
                    if (spec.from === 'self' && evt.target !== elt) return;
                    if (spec.from === 'outside' && elt.contains(evt.target)) return;
                    if (spec.target && !evt.target?.matches?.(spec.target)) return;
                    if (spec.changed) {
                        let values = spec.values ??= new WeakMap();
                        let changed = false;
                        for (let fromElt of fromElts) {
                            if (values.get(fromElt) !== fromElt.value) {
                                changed = true;
                                values.set(fromElt, fromElt.value);
                            }
                        }
                        if (!changed) return;
                    }
                    if (filter) {
                        if (this.#shouldCancel(evt)) evt.preventDefault();
                        let evtArgs = {}; for (let k in evt) evtArgs[k] = evt[k];
                        if (!this.#executeJavaScript(elt, evtArgs, filter, true, false)) return;
                    }
                    timed(evt);
                };

                // Intersect/revealed: set up observer
                if (eventName === 'intersect' || eventName === 'revealed') {
                    let observerOptions = {rootMargin: spec.rootMargin};
                    if (spec.root) observerOptions.root = this.#findOrWarn(elt, spec.root);
                    if (spec.threshold) observerOptions.threshold = parseFloat(spec.threshold);
                    let isRevealed = eventName === 'revealed';
                    spec.observer = new IntersectionObserver((entries) => {
                        for (let i = 0; i < entries.length; i++) {
                            if (entries[i].isIntersecting) {
                                this.trigger(elt, 'intersect', {}, false);
                                if (isRevealed) spec.observer.disconnect();
                                break;
                            }
                        }
                    }, observerOptions);
                    eventName = 'intersect';
                    spec.observer.observe(elt);
                }

                // Every: set up interval
                if (eventName === "every") {
                    let interval = Object.keys(spec).find(k => k !== 'name');
                    spec.interval = setInterval(() => {
                        if (elt.isConnected) this.#trigger(elt, 'every', {}, false);
                        else clearInterval(spec.interval);
                    }, this.parseInterval(interval));
                }

                // Load: fire immediately, no listener needed
                if (eventName === 'load') {
                    spec.handler(new CustomEvent('load'));
                    continue;
                }

                // Register listeners
                for (let fromElt of fromElts) {
                    let listenerInfo = {fromElt, eventName, handler: spec.handler,
                        capture: !!spec.capture, passive: !!spec.passive};
                    elt._htmx.listeners.push(listenerInfo);
                    spec.listeners.push(listenerInfo);
                    fromElt.addEventListener(eventName, spec.handler, listenerInfo);
                }
            }
        }

        #extractFilter(str) {
            let match = str.match(/^([^\[]*)\[([^\]]*)]/);
            if (!match) return [str, null];
            return [match[1], match[2]];
        }

        #handleTriggerHeader(value, elt) {
            if (value[0] === '{') {
                let triggers = HCON.parse(value);
                for (let name in triggers) {
                    let detail = triggers[name];
                    let target = elt;
                    if (detail?.target) {
                        target = this.find(detail.target);
                    }
                    this.trigger(target, name, typeof detail === 'object' ? detail : {value: detail});
                }
            } else {
                value.split(',').forEach(name => this.trigger(elt, name.trim(), {}));
            }
        }

        #apiMethods(thisArg) {
            let bound = {};
            let proto = Object.getPrototypeOf(this);
            for (let name of Object.getOwnPropertyNames(proto)) {
                if (name !== 'constructor' && typeof this[name] === 'function') {
                    if (["find", "findAll"].includes(name)) {
                        bound[name] = (arg1, arg2) => {
                            if (arg2 === undefined) {
                                return this[name](thisArg, arg1)
                            } else {
                                return this[name](arg1, arg2)
                            }
                        }
                    } else {
                        bound[name] = this[name].bind(this);
                    }
                }
            }
            return bound;
        }

        #executeJavaScript(thisArg, obj, code, expression = true, isAsync = true, compile = false) {
            let args = {}
            Object.assign(args, this.#apiMethods(thisArg))
            let scope = {};
            let detail = { scope, code };
            this.#triggerExtensions(thisArg, "htmx:scope", detail);
            code = detail.code;
            Object.assign(args, scope);
            Object.assign(args, obj)
            let keys = Object.keys(args);
            let values = Object.values(args);
            let FunctionConstructor = isAsync ? this.#AsyncFunction : this.#Function;
            let func = new FunctionConstructor(...keys, expression ? `return (${code})` : code);
            return compile ? () => func.call(thisArg, ...values) : func.call(thisArg, ...values);
        }

        /**
         * Initialize htmx attributes on root and all its descendants. When force is true, root
         * and every powered descendant are first torn down and re-wired from their current
         * attributes - use this after mutating hx-* attributes on an already-processed element.
         * @see https://four.htmx.org/reference/methods/htmx-process
         * @param {Element | ShadowRoot} root
         * @param {boolean} [force]
         */
        process(root, force) {
            if (!root?.isConnected) return;
            if (!(root instanceof Element)) { // ShadowRoot
                for (let elt of root.children || []) this.process(elt, force);
                return;
            }
            if (force) this.#cleanup(root, true);
            if (this.#ignore(root)) return;
            if (!this.#trigger(root, "htmx:before:process")) return
            let hxOnNodes = [root];
            let iter = this.#hxOnQuery.evaluate(root)
            let node = null
            while (node = iter.iterateNext()) hxOnNodes.push(node)
            for (let hxOnNode of hxOnNodes) {
                if (!this.#ignore(hxOnNode) && this.#trigger(hxOnNode, "htmx:before:on:init", {}, true)) {
                    this.#handleHxOnAttributes(hxOnNode);
                }
            }
            for (let elt of this.#queryEltAndDescendants(root, this.#actionSelector)) {
                this.#initializeElement(elt);
            }
            for (let elt of this.#queryEltAndDescendants(root, this.#boostSelector)) {
                this.#maybeBoost(elt);
            }
            this.#trigger(root, "htmx:after:process");
        }

        #maybeBoost(elt) {
            let hxBoost = this.#attributeValue(elt, "hx-boost");
            if (hxBoost && hxBoost !== "false" && this.#shouldBoost(elt) && this.#trigger(elt, "htmx:before:init", {}, true)) {
                let htmxProp = this.#htmxProp(elt);
                htmxProp.initialized = true;
                htmxProp.eventHandler = this.#createHtmxEventHandler(elt);
                htmxProp.boosted = hxBoost;
                let eventName = elt.matches('a') ? 'click' : 'submit';
                elt._htmx.listeners.push({fromElt: elt, eventName, handler: elt._htmx.eventHandler});
                elt.addEventListener(eventName, elt._htmx.eventHandler);
                this.#trigger(elt, "htmx:after:init", {}, true)
            }
        }

        #shouldBoost(elt) {
            if (this.#shouldInitialize(elt)) {
                if (elt.tagName === "A") {
                    if (elt.target === '' || elt.target === '_self') {
                        return !elt.hasAttribute('download') && !elt.getAttribute('href')?.startsWith?.("#") && this.#isSameOrigin(elt.href)
                    }
                } else if (elt.tagName === "FORM") {
                    return elt.method !== 'dialog' &&  this.#isSameOrigin(elt.action);
                }
            }
        }

        #isSameOrigin(url) {
            try {
                // URL constructor handles both relative and absolute URLs
                const parsed = new URL(url, window.location.href);
                return parsed.origin === window.location.origin;
            } catch (e) {
                // If URL parsing fails, assume not same-origin
                return false;
            }
        }

        #shouldInitialize(elt) {
            return !elt._htmx?.initialized && !this.#ignore(elt);
        }

        /**
         * Remove listeners, timers, and observers from elt and all its powered descendants.
         * When force is true, also delete their htmx state so a re-process fully re-initializes them.
         * @param {Element} elt
         * @param {boolean} [force]
         */
        #cleanup(elt, force) {
            let elts = [elt, ...elt.querySelectorAll?.('[data-htmx-powered]') ?? []];
            for (let e of elts) {
                if (!e._htmx) continue;
                this.#trigger(e, "htmx:before:cleanup")
                for (let spec of e._htmx.triggerSpecs || []) {
                    if (spec.interval) clearInterval(spec.interval);
                    if (spec.timeout) clearTimeout(spec.timeout);
                    if (spec.throttleTimeout) clearTimeout(spec.throttleTimeout);
                    spec.observer?.disconnect()
                }
                for (let info of e._htmx.listeners || []) {
                    info.fromElt.removeEventListener(info.eventName, info.handler, info);
                }
                e.removeAttribute('data-htmx-powered');
                this.#trigger(e, "htmx:after:cleanup")
                if (force) delete e._htmx;
            }
        }

        #handlePreservedElements(fragment) {
            let pantry = document.createElement('div');
            pantry.hidden = true;
            document.body.insertAdjacentElement('afterend', pantry);
            let newPreservedElts = fragment.querySelectorAll?.(this.#prefixSelector('[hx-preserve]')) || [];
            for (let preservedElt of newPreservedElts) {
                let currentElt = document.getElementById(preservedElt.id);
                if (currentElt) {
                    this.#moveBefore(pantry, currentElt, null);
                }
            }
            return pantry
        }

        #restorePreservedElements(pantry) {
            for (let preservedElt of [...pantry.children]) {
                let newElt = document.getElementById(preservedElt.id);
                if (newElt) {
                    this.#moveBefore(newElt.parentNode, preservedElt, newElt);
                    this.#cleanup(newElt)
                    newElt.remove()
                }
            }
            pantry.remove();
        }

        #parseHTML(resp) {
            let trusted = this.#ttPolicy.createHTML(resp);
            return Document.parseHTMLUnsafe?.(trusted) || new DOMParser().parseFromString(trusted, 'text/html');
        }

        #makeFragment(text) {
            // Convert <hx-*> tags (e.g. <hx-partial>, <hx-oob>) to <template hx type="*">
            let response = text.replace(/<hx-([a-z]+)(\s+|>)/gi, '<template hx type="$1"$2').replace(/<\/hx-[a-z]+>/gi, '</template>');
            let title = '';
            response = response.replace(/<head(\s[^>]*)?>[\s\S]*?<\/head>/i, m => (title = this.#parseHTML(m).title, ''));
            let startTag = response.match(/<([a-z][^\/>\x20\t\r\n\f]*)/i)?.[1]?.toLowerCase();

            let doc, fragment;
            if (startTag === 'html' || startTag === 'body') {
                doc = this.#parseHTML(response);
                fragment = document.createDocumentFragment();
                fragment.append(doc.body);
            } else {
                doc = this.#parseHTML(`<template>${response}</template>`);
                fragment = doc.querySelector('template').content;
            }

            if (!title) {
                let titleElt = fragment.querySelector('title:not(svg title)');
                if (titleElt) {
                    title = titleElt.textContent;
                    titleElt.remove();
                }
            }

            this.#processScripts(fragment);

            return {
                fragment,
                title
            };
        }

        #createOOBTask(tasks, elt, oobValue, sourceElement) {
            let targetSelector = elt.id ? '#' + CSS.escape(elt.id) : null;
            if (oobValue !== 'true' && oobValue && !oobValue.includes(' ')) {
                [oobValue, targetSelector = targetSelector] = oobValue.split(/:(.*)/);
            }
            if (oobValue === 'true' || !oobValue) oobValue = 'outerHTML';

            let swapSpec = this.#parseSwapSpec(oobValue);
            targetSelector = swapSpec.target || targetSelector;
            swapSpec.strip ??= !swapSpec.style.startsWith('outer');
            if (!targetSelector) return;
            let targets = [...document.querySelectorAll(targetSelector)];
            for (let target of targets) {
                let fragment = document.createDocumentFragment();
                fragment.append(elt.cloneNode(true));
                tasks.push({type: 'oob', fragment, target, swapSpec, sourceElement});
            }
            elt.remove();
        }

        #processOOB(fragment, sourceElement, selectOOB) {
            let tasks = [];

            // Process hx-select-oob first (select elements from response)
            if (selectOOB) {
                for (let spec of selectOOB.split(',')) {
                    let [selector, oobValue = 'true'] = spec.split(/:(.*)/);
                    for (let elt of fragment.querySelectorAll(selector)) {
                        this.#createOOBTask(tasks, elt, oobValue, sourceElement);
                    }
                }
            }

            // Process elements with hx-swap-oob attribute
            for (let oobElt of fragment.querySelectorAll(this.#prefixSelector('[hx-swap-oob]'))) {
                let oobAttr = this.#attrName(oobElt, 'hx-swap-oob');
                let oobValue = oobElt.getAttribute(oobAttr);
                oobElt.removeAttribute(oobAttr);
                this.#createOOBTask(tasks, oobElt, oobValue, sourceElement);
            }
            return tasks;
        }

        #insertNodes(parent, before, fragment) {
            if (before) {
                before.before(...fragment.childNodes);
            } else {
                parent.append(...fragment.childNodes);
            }
        }

        #parseSwapSpec(swapStr) {
            swapStr = swapStr.trim();
            let style = this.config.defaultSwap
            if (swapStr && !/^\S*:/.test(swapStr)) {
                let m = swapStr.match(/^(\S+)\s*(.*)$/);
                style = m[1];
                swapStr = m[2];
            }
            return {style: this.#normalizeSwapStyle(style), ...HCON.parse(swapStr)};
        }

        #processPartials(fragment, ctx) {
            let tasks = [];

            for (let templateElt of fragment.querySelectorAll('template[hx]')) {
                let type = templateElt.getAttribute('type');
                
                if (type === 'partial') {
                    let targetSelector = this.#attr(templateElt, 'hx-target') || (templateElt.id ? '#' + CSS.escape(templateElt.id) : null);
                    if (targetSelector) {
                        this.#processScripts(templateElt.content);
                        let swapSpec = this.#parseSwapSpec(this.#attr(templateElt, 'hx-swap') || this.config.defaultSwap);
                        let targets = this.#findAllExt(ctx.sourceElement, targetSelector);
                        for (let target of targets.length ? targets : [null]) {
                            tasks.push({
                                type: 'partial',
                                fragment: templateElt.content.cloneNode(true),
                                target,
                                swapSpec,
                                sourceElement: ctx.sourceElement
                            });
                        }
                    }
                } else {
                    this.#triggerExtensions(templateElt, 'htmx:process:' + type, { ctx, tasks });
                }
                templateElt.remove();
            }

            return tasks;
        }

        #setFocus(elt, options, start, end) {
            try {
                if (start != null && elt.setSelectionRange) {
                    elt.setSelectionRange(start, end);
                }
                elt.focus(options);
            } catch (e) {
                // setSelectionRange or Web component focus may fail so ignore
            }
        }

        #handleAutoFocus(elt) {
            let autofocus = this.#queryEltAndDescendants(elt, '[autofocus]')[0];
            if (autofocus) {
                this.#setFocus(autofocus);
            }
        }

        #handleScroll(swapSpec, target) {
            if (swapSpec.scroll) {
                let scrollTarget = swapSpec.scrollTarget ? this.#findExt(swapSpec.scrollTarget) : target;
                if (scrollTarget) {
                    if (swapSpec.scroll === 'top') {
                        scrollTarget.scrollTop = 0;
                    } else if (swapSpec.scroll === 'bottom'){
                        scrollTarget.scrollTop = scrollTarget.scrollHeight;
                    }
                }
            }
            if (swapSpec.show === 'top' || swapSpec.show === 'bottom') {
                let showTarget = swapSpec.showTarget ? this.#findExt(swapSpec.showTarget) : target;
                showTarget?.scrollIntoView?.(swapSpec.show === 'top')
            }
        }

        #handleAnchorScroll(ctx) {
            if (ctx.request?.anchor) {
                document.getElementById(ctx.request.anchor)?.scrollIntoView({block: 'start', behavior: 'auto'});
            }
        }

        #processScripts(container) {
            let scripts = this.#queryEltAndDescendants(container, 'script');
            for (let oldScript of scripts) {
                let newScript = document.createElement('script');
                for (let attr of oldScript.attributes) {
                    newScript.setAttribute(attr.name, attr.value);
                }
                if (this.config.inlineScriptNonce) {
                    newScript.nonce = this.config.inlineScriptNonce;
                }
                newScript.textContent = this.#ttPolicy.createScript(oldScript.textContent);
                oldScript.replaceWith(newScript);
            }
        }

        //============================================================================================
        // Public JS API
        //============================================================================================

        initialize() {
            if (this.config.history && !this.#historyInitialized) {
                this.#historyInitialized = true;
                if (!history.state) history.replaceState({htmx: true}, '', location.href);
                if (window.navigation && !/firefox/i.test(navigator.userAgent)) {
                    navigation.addEventListener('navigate', (event) => {
                        if (event.navigationType === 'traverse' && event.canIntercept && !event.hashChange)
                            event.intercept({handler: () => this.#restoreHistory()});
                    });
                /* c8 ignore next 3 */
                } else {
                    window.addEventListener('popstate', (event) => this.#restoreHistory(event.state));
                }
            }
            this.process(document.body);
        }

        async swap(ctx) {
            try {
                this.#handleHistoryUpdate(ctx);
                let {fragment, title} = this.#makeFragment(ctx.text);
                ctx.title = title;
                let tasks = [];

                // Process OOB and partials
                let oobTasks = this.#processOOB(fragment, ctx.sourceElement, ctx.selectOOB);
                let partialTasks = this.#processPartials(fragment, ctx);
                tasks.push(...oobTasks, ...partialTasks);

                // Determine if empty swap should be prevented
                // partials always prevent; oob prevents by default unless config.allowEmptySwapAfterOOB is true
                let hasPartials = partialTasks.length || (oobTasks.length && !this.config.allowEmptySwapAfterOOB);

                // Process main swap
                let mainSwap = this.#processMainSwap(ctx, fragment, hasPartials);
                if (mainSwap) {
                    tasks.unshift(mainSwap);
                }

                if(!this.#trigger(ctx.sourceElement, "htmx:before:swap", {ctx, tasks})){
                    return
                }

                let swapPromises = [];
                let transitionTasks = [];
                for (let task of tasks) {
                    if (task.swapSpec?.transition ?? mainSwap?.transition ?? ctx.transition) {
                        transitionTasks.push(task);
                    } else {
                        swapPromises.push(this.#insertContent(task));
                    }
                }

                // submit all transition tasks in the transition queue w/no CSS transitions
                if (transitionTasks.length > 0) {
                    let tasksWrapper = async ()=> {
                        for (let task of transitionTasks) {
                            await this.#insertContent(task, false)
                        }
                    }
                    swapPromises.push(this.#submitTransitionTask(tasksWrapper, ctx));
                }

                await Promise.all(swapPromises);

                if (!ctx.sourceElement?.isConnected && mainSwap?.target?.isConnected) {
                    ctx.sourceElement = mainSwap.target;
                }

                this.#trigger(ctx.sourceElement, "htmx:after:swap", {ctx});
                if (ctx.title && !mainSwap?.swapSpec?.ignoreTitle) document.title = ctx.title;
                this.#handleAnchorScroll(ctx);
            } finally {
                this.#trigger(ctx.sourceElement, "htmx:finally:swap", {ctx});
            }
        }

        #processMainSwap(ctx, fragment, hasPartials) {
            // Create main task if needed
            let swapSpec = this.#parseSwapSpec(ctx.swap || this.config.defaultSwap);
            // skip main swap if fragment is empty after partial/oob removal
            // swapEmpty modifier can override; default: skip if hasPartials
            if (
                swapSpec.style === 'delete' ||    // delete always runs regardless of content
                fragment.childElementCount > 0 || // or fragment has elements
                fragment.textContent.trim() ||    // or fragment has text
                (swapSpec.swapEmpty ?? !hasPartials)
            ) {
                if (ctx.select) {
                    let selected = fragment.querySelectorAll(ctx.select);
                    fragment = document.createDocumentFragment();
                    fragment.append(...selected);
                }
                if (this.#isBoosted(ctx.sourceElement)) {
                    swapSpec.show ||= 'top';
                }
                let mainSwap = {
                    type: 'main',
                    fragment,
                    target: this.#resolveTarget(ctx.sourceElement || document.body, swapSpec.target || ctx.target),
                    swapSpec,
                    sourceElement: ctx.sourceElement,
                    transition: ctx.transition && swapSpec.transition !== false
                };
                return mainSwap;
            }
        }

        async #insertContent(task, cssTransition = true) {
            let {target, swapSpec, fragment} = task;
            if (typeof target === 'string') {
                target = document.querySelector(target);
            }
            if (!target) return;
            if (typeof swapSpec === 'string') {
                swapSpec = this.#parseSwapSpec(swapSpec);
            }
            let swapStyle = swapSpec.style;
            if (swapStyle === 'none') return;
            // Body fragment: strip wrapper unless outer* swap on document.body
            if (fragment.firstElementChild?.tagName === 'BODY') {
                const keepBody = target === document.body && swapStyle.startsWith('outer')
                if (keepBody && swapStyle === 'outerHTML') swapStyle = 'outerSync'
                swapSpec.strip ??= !keepBody
            }
            if (swapSpec.strip && fragment.firstElementChild) {
                fragment = document.createDocumentFragment();
                fragment.append(...(task.fragment.firstElementChild.content || task.fragment.firstElementChild).childNodes);
            }

            this.#addClass(target, "htmx-swapping")
            if (cssTransition && task.swapSpec?.swap) {
                await this.timeout(task.swapSpec?.swap)
            }

            if (swapStyle === 'delete') {
                if (target.parentNode) {
                    this.#cleanup(target);
                    target.parentNode.removeChild(target);
                }
                return;
            }

            // innerHTML/outerHTML swaps backup focus and handle CSS transitions
            let focusInfo;
            let settleTasks = []
            let settleDelay = swapSpec.settle ?? this.config.defaultSettleDelay;
            let parentNode = target.parentNode;
            if (swapStyle === 'innerHTML' || (swapStyle === 'outerHTML' && parentNode)) {
                let activeElt = document.activeElement;
                if (activeElt?.id) {
                    let start, end;
                    try { start = activeElt.selectionStart; end = activeElt.selectionEnd; } catch (e) {}
                    focusInfo = { elt: activeElt, start, end };
                }
                settleTasks = cssTransition && settleDelay ? this.#startCSSTransitions(fragment, target) : []
            }

            let pantry = this.#handlePreservedElements(fragment);
            let newContent = [...fragment.childNodes]
            try {
                if (swapStyle === 'innerHTML') {
                    for (const child of target.children) {
                        this.#cleanup(child)
                    }
                    target.replaceChildren(...fragment.childNodes);
                } else if (swapStyle === 'textContent') {
                    for (const child of target.querySelectorAll('[data-htmx-powered]')) {
                        this.#cleanup(child)
                    }
                    target.textContent = fragment.textContent;
                } else if (swapStyle === 'outerHTML') {
                    if (parentNode) {
                        this.#insertNodes(parentNode, target, fragment);
                        this.#cleanup(target)
                        parentNode.removeChild(target);
                        target = newContent[0] || parentNode
                    }
                } else if (swapStyle === 'outerSync') {
                    this.#copyAttributes(target, fragment.firstElementChild);
                    for (const child of target.children) {
                        this.#cleanup(child)
                    }
                    target.replaceChildren(...fragment.firstElementChild.childNodes);
                    newContent = [target];
                } else if (swapStyle === 'innerMorph') {
                    this.#morph(target, fragment, true);
                    newContent = [...target.childNodes];
                } else if (swapStyle === 'outerMorph') {
                    this.#morph(target, fragment, false);
                    newContent.push(target);
                } else if (swapStyle === 'beforebegin') {
                    if (parentNode) {
                        this.#insertNodes(parentNode, target, fragment);
                    }
                } else if (swapStyle === 'afterbegin') {
                    this.#insertNodes(target, target.firstChild, fragment);
                } else if (swapStyle === 'beforeend') {
                    this.#insertNodes(target, null, fragment);
                } else if (swapStyle === 'afterend') {
                    if (parentNode) {
                        this.#insertNodes(parentNode, target.nextSibling, fragment);
                    }
                } else {
                    let methods = this.#extMethods.get('handle_swap') || []
                    let handled = false;
                    for (const method of methods) {
                        let result = method(swapStyle, target, fragment, swapSpec);
                        if (result) {
                            handled = true;
                            if (Array.isArray(result)) {
                                newContent = result;
                            }
                            break;
                        }
                    }
                    if (!handled) {
                        throw new Error(`Unknown swap style: ${swapStyle}`);
                    }
                }
            } finally {
                this.#removeClass(target, "htmx-swapping")
            }
            task.target = target;
            this.#restorePreservedElements(pantry);
            if (focusInfo && !focusInfo.elt.matches(':focus')) {
                let newElt = document.getElementById(focusInfo.elt.id);
                if (newElt) {
                    let focusOptions = { preventScroll: swapSpec.focusScroll !== undefined ? !swapSpec.focusScroll : !this.config.defaultFocusScroll };
                    this.#setFocus(newElt, focusOptions, focusInfo.start, focusInfo.end);
                }
            }

            this.#trigger(target, "htmx:before:settle", {task, newContent, settleTasks})

            for (const elt of newContent) {
                this.#addClass(elt, "htmx-added")
            }

            if (cssTransition && settleTasks.length > 0) {
                this.#addClass(target, "htmx-settling")
                await this.timeout(settleDelay);
                // invoke settle tasks
                for (let settleTask of settleTasks) {
                    settleTask()
                }
                this.#removeClass(target, "htmx-settling")
            }

            this.#trigger(target, "htmx:after:settle", {task, newContent, settleTasks})

            for (const elt of newContent) {
                this.#removeClass(elt, "htmx-added")
                this.process(elt);
                this.#handleAutoFocus(elt);
            }
            
            this.#handleScroll(swapSpec, target);
        }

        #trigger(on, eventName, detail = {}, bubbles = true) {
            // Convention: events with detail.error log at error level, detail.warn at warn level,
            // otherwise at event level (gated by config.logAll). One emit per event.
            if (detail.error) {
                let prefix = `htmx: ${eventName}: ${detail.error.message ?? detail.error}`;
                if (detail.error instanceof Error) console.error(prefix, detail.error, { elt: on, detail });
                else console.error(prefix, { elt: on, detail });
            } else if (detail.warn) {
                console.warn(`htmx: ${eventName}: ${detail.warn}`, { elt: on, detail });
            } else if (this.config.logAll) {
                console.log(`htmx: ${eventName}`, { elt: on, detail });
            }
            on = this.#normalizeElement(on)
            this.#triggerExtensions(on, eventName, detail);
            return this.trigger(on, this.#maybeAdjustMetaCharacter(eventName), detail, bubbles)
        }

        #triggerExtensions(elt, eventName, detail = {}) {
            let methods = this.#extMethods.get(eventName.replace(/:/g, '_'))
            if (methods) {
                detail.cancelled = false;
                for (const fn of methods) {
                    if (fn(elt, detail) === false || detail.cancelled) {
                        detail.cancelled = true;
                        return false;
                    }
                }
            }
            return true;
        }

        timeout(time) {
            time = this.parseInterval(time);
            if (time > 0) {
                return new Promise(resolve => setTimeout(resolve, time));
            }
        }

        onLoad(callback) {
            this.on(this.#maybeAdjustMetaCharacter("htmx:after:process"), (evt) => {
                callback(evt.target)
            })
        }

        on(eventOrElt, eventOrCallback, callback) {
            let event;
            let elt = document;
            if (callback === undefined) {
                event = eventOrElt;
                callback =  eventOrCallback
            } else {
                elt = this.#normalizeElement(eventOrElt);
                event = eventOrCallback;
            }
            elt.addEventListener(event, callback);
            return callback;
        }

        find(selectorOrElt, selector) {
            return this.#findExt(selectorOrElt, selector)
        }

        findAll(selectorOrElt, selector) {
            return this.#findAllExt(selectorOrElt, selector)
        }

        parseInterval(str) {
            if (typeof str === 'number') return str;
            let m = {ms: 1, s: 1000, m: 60000};
            let [, n, u] = str?.match(/^([\d.]+)(ms|s|m)?$/) || [];
            let v = parseFloat(n) * (m[u] || 1);
            return isNaN(v) ? undefined : v;
        }

        trigger(on, eventName, detail = {}, bubbles = true) {
            on = this.#normalizeElement(on)
            let evt = new CustomEvent(eventName, {
                detail,
                cancelable: true,
                bubbles,
                composed: true
            });
            let target = on?.isConnected ? on : document;
            let result = !detail.cancelled && target.dispatchEvent(evt);
            return result
        }
        ajax(verb, path, options) {
            // Normalize options to object
            if (!options || options instanceof Element || typeof options === 'string') {
                options = {target: options};
            }

            let sourceElt = typeof options.source === 'string' ?
                document.querySelector(options.source) : options.source;

            // If source selector was provided but didn't match, reject
            if (typeof options.source === 'string' && !sourceElt) {
                return Promise.reject(new Error('Source not found'));
            }

            // Resolve explicit target if provided; otherwise #createRequestContext
            // will resolve from hx-target on the source element
            if (options.target) {
                let target = this.#resolveTarget(document.body, options.target);
                if (!target) {
                    return Promise.reject(new Error('Target not found'));
                }
                sourceElt ||= target;
            }
            sourceElt ||= document.body;

            let ctx = this.#createRequestContext(sourceElt, options.event || {});
            Object.assign(ctx, options);
            if (options.target) ctx.target = this.#resolveTarget(document.body, options.target);
            Object.assign(ctx.request, {action: path, method: verb.toUpperCase()});
            if (options.headers) Object.assign(ctx.request.headers, options.headers);

            return this.#handleTriggerEvent(ctx);
        }

        //============================================================================================
        // History Support
        //============================================================================================

        #pushUrlIntoHistory(path) {
            if (!this.config.history) return;
            if (!history.state) history.replaceState({htmx: true}, '', location.href);
            history.pushState({htmx: true}, '', path);
            this.#trigger(document, "htmx:after:history:push", {path});
        }

        #replaceUrlInHistory(path) {
            if (!this.config.history) return;
            history.replaceState({htmx: true}, '', path);
            this.#trigger(document, "htmx:after:history:replace", {path});
        }

        async #restoreHistory(state, path) {
            await this.timeout(1);
            state ??= history.state;
            if (!state?.htmx) return;
            this.#historyAbort?.abort();
            path = path || location.pathname + location.search;
            let historyElt = document.querySelector(this.#prefixSelector('[hx-history-elt]')) || document.body;
            if (this.#trigger(document, "htmx:before:history:restore", {path, cacheMiss: true})) {
                if (this.config.history === "reload") {
                    this._loc.reload();
                } else {
                    this.#historyAbort = new AbortController();
                    return this.ajax('GET', path, {
                        target: historyElt,
                        swap: 'outerSync',
                        select: historyElt !== document.body ? this.#prefixSelector('[hx-history-elt]') : undefined,
                        request: {
                            headers: {'HX-History-Restore-Request': 'true'},
                            signal: this.#historyAbort.signal
                        }
                    });
                }
            }
        }

        #resolveHistoryAction(ctx) {
            let {sourceElement, push, replace, hx, response} = ctx;

            // allow response headers to override history action
            if (hx?.pushurl || hx?.replaceurl) { // HX-Push-Url, HX-Replace-Url
                push = hx.pushurl;
                replace = hx.replaceurl;
            }

            // if this is a boosted element, default to pushing
            if (push == null && replace == null && this.#isBoosted(sourceElement)) {
                push = 'true';
            }
            
            // normalize "false" to null
            if (push === 'false' || push === false) push = null;
            if (replace === 'false' || replace === false) replace = null;

            if (!push && !replace) return null;

            let path = push || replace;
            // if the path is simply "true" normalize to the current path
            if (path === 'true') {
                let finalUrl = response?.raw?.url || ctx.request.action;
                let url = new URL(finalUrl, location.href);
                path = url.pathname + url.search + (ctx.request.anchor ? '#' + ctx.request.anchor : '');
            }

            let type = push ? 'push' : 'replace';
            return {type, path};
        }

        #handleHistoryUpdate(ctx) {
            if (!this.config.history) return;
            let action = this.#resolveHistoryAction(ctx);
            if (!action) return;

            let historyDetail = {
                history: action,
                sourceElement: ctx.sourceElement,
                response: ctx.response
            };
            if (!this.#trigger(document, "htmx:before:history:update", historyDetail)) return;
            if (action.type === 'push') {
                this.#pushUrlIntoHistory(action.path);
            } else {
                this.#replaceUrlInHistory(action.path);
            }
            this.#trigger(document, "htmx:after:history:update", historyDetail);
        }

        // hx-on:<event> binds to <event> directly
        // hx-on::<event> is shorthand for hx-on:htmx:<event> (htmx events)
        #handleHxOnAttributes(node) {
            if (node._htmx?.onInitialized) return;
            let hxOnNames = this.#prefixes("hx-on");
            let mc = this.config.metaCharacter || ':';
            let handler = (code) => async (evt) => {
                try {
                    await this.#executeJavaScript(node, { event: evt },
                        `with(event?.detail||{}){${code}}`, false);
                } catch (e) {
                    if (typeof e !== 'symbol') this.#trigger(node, 'htmx:error', { error: e });
                }
            };
            for (let attr of node.getAttributeNames()) {
                let prefix = hxOnNames.find(p => attr.startsWith(p));
                if (!prefix) continue;
                this.#htmxProp(node).onInitialized = true;
                let rest = attr.substring(prefix.length);
                let value = node.getAttribute(attr);
                // hx-on="click once -> doA(); blur -> doB()"
                if (!rest) {
                    for (let part of value.split(/;(?=[^;]*->)/)) {
                        let idx = part.indexOf('->');
                        if (idx !== -1) this.#onTrigger(node, part.substring(0, idx).trim(), handler(part.substring(idx + 2).trim()));
                    }
                    continue;
                }
                // hx-on:click="code" or hx-on::before:request="code"
                if (rest[0] !== mc) continue;
                let eventName = rest.substring(1);
                if (eventName.startsWith(mc)) eventName = 'htmx' + mc + eventName.substring(1);
                this.#onTrigger(node, eventName, handler(value));
            }
        }

        #showIndicators(elt) {
            let hxIndicator = this.#attributeValue(elt, "hx-indicator");
            let indicatorElements;
            if (!hxIndicator) {
                if (elt === document.body) return [];
                indicatorElements = [elt]
            } else {
                indicatorElements = this.#findAllExt(elt, hxIndicator, "hx-indicator");
            }
            for (const indicator of indicatorElements) {
                let s = this.#htmxState(indicator);
                s.rc = (s.rc || 0) + 1;
                this.#addClass(indicator, this.config.requestClass)
            }
            return indicatorElements
        }

        #hideIndicators(indicatorElements) {
            for (let indicator of indicatorElements) {
                let s = this.#htmxState(indicator);
                if (s.rc && --s.rc <= 0) {
                    this.#removeClass(indicator, this.config.requestClass);
                    delete s.rc;
                }
            }
        }

        #disableElements(elt) {
            let hxDisable = this.#attributeValue(elt, "hx-disable");
            let disabledElements = []
            if (hxDisable) {
                disabledElements = this.#findAllExt(elt, hxDisable, "hx-disable");
                for (let indicator of disabledElements) {
                    let s = this.#htmxState(indicator);
                    s.dc = (s.dc || 0) + 1;
                    indicator.disabled = true
                }
            }
            return disabledElements
        }

        #enableElements(disabledElements) {
            for (const indicator of disabledElements) {
                let s = this.#htmxState(indicator);
                if (s.dc && --s.dc <= 0) {
                    indicator.disabled = false
                    delete s.dc;
                }
            }
        }

        #collectFormData(elt, form, submitter, validate, isGet) {
            if (validate && form && !form.reportValidity()) return
            
            let formData = form ? new FormData(form) : new FormData()
            let included = form ? new Set(form.elements) : new Set()
            if (!form) {
                if (validate && elt.reportValidity && !elt.reportValidity()) return
                this.#addInputValues(elt, included, formData, isGet);
            }
            if (submitter && submitter.name) {
                formData.append(submitter.name, submitter.value)
                included.add(submitter);
            }
            let hxInclude = this.#attributeValue(elt, "hx-include");
            if (hxInclude) {
                for (let node of this.#findAllExt(elt, hxInclude)) {
                    if (validate && node.reportValidity && !node.reportValidity()) return
                    this.#addInputValues(node, included, formData);
                }
            }
            return formData
        }

        #addInputValues(elt, included, formData, isGet) {
            let tag = elt.tagName;
            let inputs = [];
            if (tag === 'BUTTON' || tag.includes('-')) {
                inputs = [elt]; // send own value only, never collect children
            } else if (['INPUT', 'SELECT', 'TEXTAREA', 'FIELDSET'].includes(tag) || !isGet) {
                inputs = this.#queryEltAndDescendants(elt, '[name]:not(button)');
            }
            // GET on non-form-control containers (div, etc.) sends nothing; use hx-include for explicit inclusion

            for (let input of inputs) {
                let name = input.name || input.getAttribute?.('name');
                if (!name || input.matches(':disabled') || included.has(input)) continue;
                included.add(input);

                let type = input.type;
                if (type === 'checkbox' || type === 'radio' || (input.tagName !== 'INPUT' && 'checked' in input)) {
                    // Only add if checked
                    if (input.checked) {
                        formData.append(name, input.value);
                    }
                } else if (type === 'file') {
                    // Add all selected files
                    for (let file of input.files) {
                        formData.append(name, file);
                    }
                } else if (type === 'select-multiple') {
                    // Add all selected options
                    for (let option of input.selectedOptions) {
                        formData.append(name, option.value);
                    }
                } else if (Array.isArray(input.value)) {
                    // Add all array values (e.g. custom elements)
                    for (let v of input.value) {
                        formData.append(name, v);
                    }
                } else {
                    formData.append(name, input.value);
                }
            }
        }

        #getAttributeObject(elt, attrName, callback, scope = {}) {
            let hxAttr = this.#attributeValue(elt, attrName);
            if (!hxAttr) return null;

            let javascriptContent = this.#extractJavascriptContent(hxAttr);
            if (javascriptContent) {
                // Wrap in braces if not already wrapped (for htmx 2.x compatibility)
                if (javascriptContent.indexOf('{') !== 0) {
                    javascriptContent = '{' + javascriptContent + '}';
                }
                // Return promise for async evaluation
                return this.#executeJavaScript(elt, scope, javascriptContent, true).then(obj => {
                    callback(obj);
                });
            } else {
                // Synchronous path - return the parsed object directly
                callback(HCON.parse(hxAttr));
            }
        }

        #stringHyperscriptStyleSelector(selector) {
            let s = selector.trim();
            return s.startsWith('<') && s.endsWith('/>') ? s.slice(1, -2) : s;
        }

        #findAllExt(eltOrSelector, maybeSelector, thisAttr, global) {
            let selector = maybeSelector ?? eltOrSelector;
            let elt = maybeSelector ? (this.#normalizeElement(eltOrSelector) || document.body) : document;
            if (selector.startsWith('global ')) {
                return this.#findAllExt(elt, selector.slice(7), thisAttr, true);
            }
            let parts = selector ? HCON.split(selector) : [];
            let result = []
            let unprocessedParts = []
            for (const part of parts) {
                let selector = this.#stringHyperscriptStyleSelector(part)
                let item
                if (selector.startsWith('closest ')) {
                    item = elt.closest(selector.slice(8))
                } else if (selector.startsWith('find ')) {
                    item = elt.querySelector(selector.slice(5))
                } else if (selector.startsWith('findAll ')) {
                    result.push(...elt.querySelectorAll(selector.slice(8)))
                } else if (selector === 'next' || selector === 'nextElementSibling') {
                    item = elt.nextElementSibling
                } else if (selector.startsWith('next ')) {
                    item = this.#scanForwardQuery(elt, selector.slice(5), !!global)
                } else if (selector === 'previous' || selector === 'previousElementSibling') {
                    item = elt.previousElementSibling
                } else if (selector.startsWith('previous ')) {
                    item = this.#scanBackwardsQuery(elt, selector.slice(9), !!global)
                } else if (selector === 'document') {
                    item = document
                } else if (selector === 'window') {
                    item = window
                } else if (selector === 'body') {
                    item = document.body
                } else if (selector === 'host') {
                    item = (elt.getRootNode()).host
                } else if (selector === 'this') {
                    if (thisAttr) {
                        result.push(...this.#findThisElements(elt, thisAttr));
                        continue;
                    }
                    item = elt
                } else {
                    unprocessedParts.push(selector)
                }

                if (item) {
                    result.push(item)
                }
            }

            if (unprocessedParts.length > 0) {
                let standardSelector = unprocessedParts.join(',')
                let rootNode = this.#getRootNode(elt, !!global)
                result.push(...rootNode.querySelectorAll(standardSelector))
            }

            return [...new Set(result)]
        }

        #scanForwardQuery(start, match, global) {
            return this.#scanUntilComparison(this.#getRootNode(start, global).querySelectorAll(match), start, Node.DOCUMENT_POSITION_PRECEDING);
        }

        #scanBackwardsQuery(start, match, global) {
            let results = [...this.#getRootNode(start, global).querySelectorAll(match)].reverse()
            return this.#scanUntilComparison(results, start, Node.DOCUMENT_POSITION_FOLLOWING);
        }

        #scanUntilComparison(results, start, comparison) {
            for (const elt of results) {
                if (elt.compareDocumentPosition(start) === comparison) {
                    return elt
                }
            }
        }

        #getRootNode(elt, global) {
            if (elt.isConnected && elt.getRootNode) {
                return elt.getRootNode?.({composed: global})
            } else {
                return document
            }
        }

        #findOrWarn(elt, selector, thisAttr) {
            let result = this.#findAllExt(elt, selector, thisAttr)[0]
            if (!result) {
                console.warn(`htmx: '${selector}' on ${thisAttr} did not match any element`,
                    { elt, selector, attr: thisAttr });
            }
            return result
        }

        #findExt(eltOrSelector, selector, thisAttr) {
            return this.#findAllExt(eltOrSelector, selector, thisAttr)[0]
        }

        #extractJavascriptContent(string) {
            if (string != null) {
                if (string.startsWith("js:")) {
                    return string.substring(3);
                } else if (string.startsWith("javascript:")) {
                    return string.substring(11);
                }
            }
        }

        #initializeAbortListener(elt) {
            let htmxProp = this.#htmxProp(elt);
            if (htmxProp.abortInitialized) return;
            htmxProp.abortInitialized = true;
            let handler = () => {
                let requestQueue = this.#getRequestQueue(elt);
                requestQueue.abort();
            };
            elt.addEventListener("htmx:abort", handler);
            htmxProp.listeners.push({fromElt: elt, eventName: "htmx:abort", handler});
        }

        #morph(oldNode, fragment, innerHTML) {
            let {persistentIds, idMap} = this.#createIdMaps(oldNode, fragment);
            let pantry = document.createElement("div");
            pantry.hidden = true;
            document.body.after( pantry);
            let ctx = {target: oldNode, idMap, persistentIds, pantry, futureMatches: new WeakSet()};

            if (innerHTML) {
                this.#morphChildren(ctx, oldNode, fragment);
            } else {
                this.#morphChildren(ctx, oldNode.parentNode, fragment, oldNode, oldNode.nextSibling);
            }
            this.#cleanup(pantry)
            pantry.remove();
        }

        #morphChildren(ctx, oldParent, newParent, insertionPoint = null, endPoint = null) {
            if (oldParent instanceof HTMLTemplateElement && newParent instanceof HTMLTemplateElement) {
                oldParent = oldParent.content;
                newParent = newParent.content;
            }
            insertionPoint ||= oldParent.firstChild;

            let newChild = newParent.firstChild;
            while (newChild) {
                let matchedNode;
                if (insertionPoint && insertionPoint != endPoint) {
                    matchedNode = this.#findBestMatch(ctx, newChild, insertionPoint, endPoint);
                    if (matchedNode) {
                        if (matchedNode !== insertionPoint) {
                            let cursor = insertionPoint;
                            while (cursor && cursor !== matchedNode) {
                                let tempNode = cursor;
                                cursor = cursor.nextSibling;
                                // remove nodes unless they match upcoming content in which case move them to end for later use
                                if (tempNode instanceof Element && (ctx.idMap.has(tempNode) || this.#matchesUpcomingSibling(ctx, tempNode, newChild))) {
                                    this.#moveBefore(oldParent, tempNode, endPoint);
                                } else {
                                    this.#removeNode(ctx, tempNode);
                                }
                            }
                        }
                    }
                }

                if (!matchedNode && newChild instanceof Element && ctx.persistentIds.has(newChild.id)) {
                    let escapedId = CSS.escape(newChild.id);
                    matchedNode = (ctx.target.id === newChild.id && ctx.target) ||
                        ctx.target.querySelector(`[id="${escapedId}"]`) ||
                        ctx.pantry.querySelector(`[id="${escapedId}"]`);
                    let element = matchedNode;
                    while ((element = element.parentNode)) {
                        let idSet = ctx.idMap.get(element);
                        if (idSet) {
                            idSet.delete(matchedNode.id);
                            if (!idSet.size) ctx.idMap.delete(element);
                        }
                    }
                    this.#moveBefore(oldParent, matchedNode, insertionPoint);
                }

                if (matchedNode) {
                    this.#morphNode(matchedNode, newChild, ctx);
                    insertionPoint = matchedNode.nextSibling;
                    newChild = newChild.nextSibling;
                    continue;
                }

                let nextNewChild = newChild.nextSibling;
                if (ctx.idMap.has(newChild)) {
                    let placeholder = document.createElement(newChild.tagName);
                    oldParent.insertBefore(placeholder, insertionPoint);
                    this.#morphNode(placeholder, newChild, ctx);
                    this.process(placeholder);
                    insertionPoint = placeholder.nextSibling;
                } else {
                    oldParent.insertBefore(newChild, insertionPoint);
                    insertionPoint = newChild.nextSibling;
                }
                newChild = nextNewChild;
            }

            while (insertionPoint && insertionPoint != endPoint) {
                let tempNode = insertionPoint;
                insertionPoint = insertionPoint.nextSibling;
                this.#removeNode(ctx, tempNode);
            }
        }

        #matchesUpcomingSibling(ctx, oldElt, startNode) {
            if (ctx.futureMatches.has(oldElt)) return true;
            for (let sibling = startNode.nextSibling, i = 0; sibling && i < this.config.morphScanLimit; sibling = sibling.nextSibling, i++) {
                if (sibling instanceof Element && oldElt.isEqualNode(sibling)) {
                    ctx.futureMatches.add(oldElt);
                    return true;
                }
            }
            return false;
        }

        #findBestMatch(ctx, node, startPoint, endPoint) {
            // text nodes match positionally (patch in place via #morphNode), 3 = TEXT_NODE
            if (node.nodeType === 3) return startPoint?.nodeType === 3 ? startPoint : null;
            if (!(node instanceof Element)) return null;
            let softMatch = null, displaceMatchCount = 0, scanLimit = this.config.morphScanLimit;
            let newSet = ctx.idMap.get(node), nodeMatchCount = newSet?.size || 0;
            // If node has a non-persistent ID, insert instead of soft matching
            if (node.id && !newSet) return null;
            let cursor = startPoint;
            while (cursor && cursor != endPoint) {
                let oldSet = ctx.idMap.get(cursor);
                if (this.#internalAPI.isSoftMatch(cursor, node)) {
                    // Hard match: matching IDs found in both nodes
                    if (oldSet && newSet && [...oldSet].some(id => newSet.has(id))) return cursor;
                    if (!oldSet) {
                        // Exact match: nodes are identical
                        if (scanLimit > 0 && cursor.isEqualNode(node)) return cursor;
                        // Soft match: same tag/type, save as fallback
                        if (!softMatch) softMatch = cursor;
                    }
                }
                // Stop if too many ID elements would be displaced
                displaceMatchCount += oldSet?.size || 0;
                if (displaceMatchCount > nodeMatchCount) break;
                // Don't move elements containing a focused typeable input
                if (document.activeElement?.selectionStart != null && cursor.contains(document.activeElement)) break;
                // Stop scanning if limit reached and no IDs to match
                if (--scanLimit < 1 && nodeMatchCount === 0) break;
                cursor = cursor.nextSibling;
            }
            // Only return fallback softMatch if it does not match upcoming content
            if (softMatch && this.#matchesUpcomingSibling(ctx, softMatch, node)) return null;
            return softMatch;
        }

        #isSoftMatch(oldNode, newNode) {
            if (!(oldNode instanceof Element) || oldNode.tagName !== newNode.tagName) {
                return false;
            }
            // Script tags must be identical to match - never patch a script with different content
            if (oldNode.tagName === 'SCRIPT' && !oldNode.isEqualNode(newNode)) return false;
            return !oldNode.id || oldNode.id === newNode.id;
        }

        #removeNode(ctx, node) {
            if (ctx.idMap.has(node)) {
                this.#moveBefore(ctx.pantry, node, null);
            } else {
                this.#cleanup(node)
                node.remove();
            }
        }

        #moveBefore(parentNode, element, after) {
            if (parentNode.moveBefore) {
                try {
                    parentNode.moveBefore(element, after);
                    return
                } catch (e) {
                    // ignore and insertBefore instead
                }
            }
            parentNode.insertBefore(element, after);
        }

        #morphNode(oldNode, newNode, ctx) {
            if (oldNode.nodeType === 3) { // text node
                if (oldNode.nodeValue !== newNode.nodeValue) oldNode.nodeValue = newNode.nodeValue;
                return;
            }
            if (this.config.morphSkip && oldNode.matches?.(this.config.morphSkip)) return;
                
            // Trigger extension hook - if returns false, skip morphing this node
            if (!this.#triggerExtensions(oldNode, "htmx:before:morph:node", {oldNode, newNode})) return;
                
            this.#copyAttributes(oldNode, newNode);
            if (oldNode instanceof HTMLTextAreaElement && document.activeElement !== oldNode && oldNode.defaultValue != newNode.defaultValue) {
                oldNode.value = newNode.value;
            }
            let skipChildren = this.config.morphSkipChildren && oldNode.matches?.(this.config.morphSkipChildren);
            // isEqualNode does not detect template content diff so always morph templates
            if (!skipChildren && (!oldNode.isEqualNode(newNode) || newNode.tagName === 'TEMPLATE' || newNode.querySelector?.('template'))) {
                this.#morphChildren(ctx, oldNode, newNode);
            }
        }

        #copyAttributes(destination, source) {
            let attributesToIgnore = this.config.morphIgnore || [];
            let needsReinit = false;
            let isHxAttr = name => this.#prefixes('hx-').some(p => name.startsWith(p));
            for (const attr of source.attributes) {
                if (!attributesToIgnore.some(p => attr.name.startsWith(p)) && destination.getAttribute(attr.name) !== attr.value) {
                    if (isHxAttr(attr.name)) needsReinit = true;
                    if (!this.#triggerExtensions(destination, 'htmx:before:morph:attr', { attrName: attr.name, newValue: attr.value })) continue;
                    destination.setAttribute(attr.name, attr.value);
                    if (attr.name === "value" && destination instanceof HTMLInputElement && destination.type !== "file" && document.activeElement !== destination) {
                        destination.value = attr.value;
                    }
                }
            }
            for (let i = destination.attributes.length - 1; i >= 0; i--) {
                let attr = destination.attributes[i];
                if (attr && !source.hasAttribute(attr.name) && !attributesToIgnore.some(p => attr.name.startsWith(p))) {
                    if (isHxAttr(attr.name)) needsReinit = true;
                    if (!this.#triggerExtensions(destination, 'htmx:before:morph:attr', { attrName: attr.name, newValue: null })) continue;
                    destination.removeAttribute(attr.name);
                }
            }
            if (needsReinit) this.#cleanup(destination, true);
        }

        #populateIdMapWithTree(idMap, persistentIds, root, elements) {
            for (const elt of elements) {
                if (persistentIds.has(elt.id)) {
                    let current = elt;
                    while (current && current !== root) {
                        let idSet = idMap.get(current);
                        if (idSet == null) {
                            idSet = new Set();
                            idMap.set(current, idSet);
                        }
                        idSet.add(elt.id);
                        current = current.parentElement;
                    }
                }
            }
        }

        #createIdMaps(oldNode, newContent) {
            let oldIdElements = this.#queryEltAndDescendants(oldNode, "[id]");
            let newIdElements = newContent.querySelectorAll("[id]");
            let persistentIds = this.#createPersistentIds(oldIdElements, newIdElements);
            let idMap = new Map();
            this.#populateIdMapWithTree(idMap, persistentIds, oldNode.parentElement, oldIdElements);
            this.#populateIdMapWithTree(idMap, persistentIds, newContent, newIdElements);
            return {persistentIds, idMap};
        }

        #createPersistentIds(oldIdElements, newIdElements) {
            let duplicateIds = new Set(), oldIdTagNameMap = new Map();
            for (const {id, tagName} of oldIdElements) {
                if (oldIdTagNameMap.has(id)) duplicateIds.add(id);
                else if (id) oldIdTagNameMap.set(id, tagName);
            }
            let persistentIds = new Set();
            for (const {id, tagName} of newIdElements) {
                if (persistentIds.has(id)) duplicateIds.add(id);
                else if (oldIdTagNameMap.get(id) === tagName) persistentIds.add(id);
            }
            for (const id of duplicateIds) persistentIds.delete(id);
            return persistentIds;
        }

        #handleStatusCodes(ctx) {
            let status = ctx.response.raw.status;
            let noSwapStrings = this.config.noSwap.map(x => x + "");
            let str = status + ""
            for (let pattern of [str, str.slice(0, 2) + 'x', str[0] + 'xx']) {
                if (noSwapStrings.includes(pattern)) {
                    ctx.swap = "none";
                    return
                }
                let statusValue = this.#attributeValue(ctx.sourceElement, "hx-status:" + pattern);
                if (statusValue) {
                    HCON.merge(statusValue, ctx);
                    return;
                }
            }
        }

        #submitTransitionTask(task, ctx) {
            return new Promise((resolve) => {
                this.#transitionQueue ||= [];
                this.#transitionQueue.push({ task, resolve, ctx });
                if (!this.#processingTransition) {
                    this.#processTransitionQueue();
                }
            });
        }

        async #processTransitionQueue() {
            if (this.#transitionQueue.length === 0 || this.#processingTransition) {
                return;
            }

            this.#processingTransition = true;
            let { task, resolve, ctx } = this.#transitionQueue.shift();

            try {
                if (document.startViewTransition) {
                    let detail = {task, ctx};
                    this.#trigger(ctx.sourceElement, "htmx:before:viewTransition", detail)
                    await document.startViewTransition(detail.task).finished;
                    this.#trigger(ctx.sourceElement, "htmx:after:viewTransition", detail)
                } else {
                    await task();
                }
            } catch (e) {
                // Transitions can be skipped/aborted - this is normal
            } finally {
                this.#processingTransition = false;
                resolve();
                this.#processTransitionQueue();
            }
        }

        #startCSSTransitions(fragment, root) {
            let idElements = root.querySelectorAll("[id]");
            let existingElementsById = Object.fromEntries([...idElements].map(e => [e.id, e]));
            let newElementsWithIds = fragment.querySelectorAll("[id]");
            let restoreTasks = []
            for (let elt of newElementsWithIds) {
                let existing = existingElementsById[elt.id];
                if (existing?.tagName === elt.tagName) {
                    let clone = elt.cloneNode(false); // shallow clone node
                    this.#copyAttributes(elt, existing)
                    restoreTasks.push(()=>{
                        this.#copyAttributes(elt, clone)
                    })
                }
            }
            return restoreTasks;
        }

        #addClass(elt, cls) {
            elt?.classList?.add?.(cls);
        }

        #removeClass(elt, cls) {
            elt?.classList?.remove?.(cls);
            if (elt?.classList?.length === 0) elt.removeAttribute('class');
        }

        #normalizeElement(cssOrElement) {
            if (typeof cssOrElement === "string") {
                return this.find(cssOrElement);
            } else {
                return cssOrElement
            }
        }

        #maybeAdjustMetaCharacter(string) {
            if (this.config.metaCharacter) {
                return string.replace(/:/g, this.config.metaCharacter);
            } else {
                return string;
            }
        }

    }

    return new Htmx()
})()

;

htmx.version += "-htmax";
htmx.config.historyCache ??= { disable: true };
(() => {
    let api;
    let warnedLegacyAttributes = new Set();

    // ========================================
    // HELPERS
    // ========================================

    function getConfig(element) {
        let hasHxSseConnect = api.attributeValue(element, 'hx-sse:connect') != null;
        let hxConfig = api.HCON.parse(api.attributeValue(element, 'hx-config')).sse || {};

        return {
            reconnect: hasHxSseConnect,
            reconnectDelay: 500,
            reconnectMaxDelay: 60000,
            reconnectMaxAttempts: Infinity,
            reconnectJitter: 0.3,
            pauseOnBackground: hasHxSseConnect,
            releaseOn: hasHxSseConnect ? 'immediate' : 'end',
            ...htmx.config.sse,
            ...hxConfig
        };
    }

    function clearLastEventIdHeader(headers) {
        for (let name of Object.keys(headers)) {
            if (name.toLowerCase() === 'last-event-id') delete headers[name];
        }
    }

    // ========================================
    // SSE PARSER
    // ========================================

    async function* parseSSE(connection) {
        let reader = connection.reader;
        let lastEventId = connection.lastEventId;
        let decoder = new TextDecoder();
        let buffer = '';
        let hasData = false;
        let hasId = false;
        let message = {data: '', event: '', retry: null};
        let firstChunk = true;

        try {
            while (true) {
                let {done, value} = await reader.read();
                if (done) break;

                let chunk = decoder.decode(value, {stream: true});
                // Strip leading BOM (U+FEFF) per SSE spec
                if (firstChunk) {
                    if (chunk.charCodeAt(0) === 0xFEFF) chunk = chunk.slice(1);
                    firstChunk = false;
                }
                buffer += chunk;

                // Split on \r\n, \r, or \n (SSE spec allows all three)
                let lines = buffer.split(/\r\n|\r|\n/);
                buffer = lines.pop() || '';

                for (let line of lines) {
                    if (!line) {
                        if (hasData || hasId || message.event) {
                            yield {...message, id: lastEventId, hasData, hasId};
                        }
                        hasData = false;
                        hasId = false;
                        message = {data: '', event: '', retry: null};
                        continue;
                    }

                    let colonIndex = line.indexOf(':');
                    if (colonIndex === 0) continue; // comment line

                    let field, value;
                    if (colonIndex < 0) {
                        // No colon: entire line is field name, value is empty string
                        field = line;
                        value = '';
                    } else {
                        field = line.slice(0, colonIndex);
                        value = line.slice(colonIndex + 1);
                        if (value[0] === ' ') value = value.slice(1);
                    }

                    if (field === 'data') {
                        message.data += (hasData ? '\n' : '') + value;
                        hasData = true;
                    } else if (field === 'event') {
                        message.event = value;
                    } else if (field === 'id') {
                        if (!value.includes('\0')) {
                            lastEventId = value;
                            hasId = true;
                        }
                    } else if (field === 'retry') {
                        let retryValue = parseInt(value, 10);
                        if (!isNaN(retryValue)) message.retry = retryValue;
                    }
                }
            }
        } finally {
            reader.releaseLock();
            // On the same tick as releaseLock(), so cleanup() or visibilityHandler 
            // calling connection.reader?.cancel() can't hit a released reader.
            connection.reader = null;
        }
    }

    // ========================================
    // STREAMING LOOP
    // ========================================

    // Starts streaming from a response. Handles reconnection by re-fetching
    // with the saved request context (no full pipeline re-run).
    async function handleSSEResponse(ctx, releaseRequest) {
        let element = ctx.sourceElement;
        let config = getConfig(element);
        let reconnectRequested = false;

        function release() {
            if (releaseRequest) {
                releaseRequest();
                releaseRequest = null;
            }
        }

        if (config.releaseOn === 'immediate') release();

        let connection = {
            url: ctx.request.action,
            config: config,
            abortController: { abort: ctx.request.abort, signal: ctx.request.signal },
            reader: null,
            lastEventId: '',
            delayCanceller: null,
            visibilityHandler: null,
            attempt: 0,
            cancelled: false,
            status: null
        };
        api.htmxProp(element).sse = connection;

        let reconnect = () => {
            if (!element.isConnected || reconnectRequested) return;
            reconnectRequested = true;
            if (connection.delayCanceller) connection.delayCanceller();
            connection.reader?.cancel();
        };

        let paused = false;
        let unpauseResolver = null;

        if (config.pauseOnBackground) {
            let visibilityHandler = () => {
                if (document.hidden) {
                    paused = true;
                    connection.reader?.cancel();
                } else if (paused) {
                    paused = false;
                    if (unpauseResolver) unpauseResolver();
                }
            };
            document.addEventListener('visibilitychange', visibilityHandler);
            connection.visibilityHandler = visibilityHandler;
        }

        connection.cancelled = false;
        if (!api.triggerHtmxEvent(element, 'htmx:sse:before:connection', {connection}) || connection.cancelled) {
            cleanup(element, 'cancelled');
            return;
        }

        connection.status = ctx.response.status;
        api.triggerHtmxEvent(element, 'htmx:sse:after:connection', {connection});

        let currentResponse = ctx.response.raw;

        try {
            while (element.isConnected) {
                // Reconnection (not on first iteration, we already have the response)
                if (connection.attempt > 0) {
                    // Wait while paused (tab backgrounded with pauseOnBackground)
                    if (paused) {
                        await new Promise(r => { unpauseResolver = r; });
                        unpauseResolver = null;
                        if (!element.isConnected) break;
                        connection.attempt = 1; // reset so delay doesn't escalate from pauses
                        reconnectRequested = true; // bypass maxAttempts check
                    }

                    if (!reconnectRequested) {
                        if (!config.reconnect || connection.attempt > config.reconnectMaxAttempts) break;
                    }

                    let baseDelay = htmx.parseInterval(config.reconnectDelay) ?? config.reconnectDelay;
                    let maxDelay = htmx.parseInterval(config.reconnectMaxDelay) ?? config.reconnectMaxDelay;
                    let delay = Math.min(
                        baseDelay * Math.pow(2, connection.attempt - 1),
                        maxDelay
                    );
                    if (config.reconnectJitter > 0) {
                        let jitterRange = delay * config.reconnectJitter;
                        delay = Math.max(0, delay + (Math.random() * 2 - 1) * jitterRange);
                    }

                    connection.cancelled = false;
                    if (!api.triggerHtmxEvent(element, 'htmx:sse:before:connection', {connection}) || connection.cancelled) break;

                    await new Promise(r => {
                        connection.delayCanceller = r;
                        setTimeout(r, delay);
                    });
                    connection.delayCanceller = null;
                    if (!element.isConnected) break;

                    // Re-fetch using saved request context (no full pipeline re-run)
                    let ac = new AbortController();
                    connection.abortController = ac;
                    try {
                        clearLastEventIdHeader(ctx.request.headers);
                        if (connection.lastEventId) ctx.request.headers['Last-Event-ID'] = connection.lastEventId;
                        currentResponse = await fetch(ctx.request.action, {
                            ...ctx.request,
                            signal: ac.signal
                        });
                    } catch (e) {
                        if (ac.signal.aborted) break;
                        api.triggerHtmxEvent(element, 'htmx:sse:error', {connection, error: e});
                        reconnectRequested = false;
                        connection.attempt++;
                        continue;
                    }

                    if (!currentResponse.ok) {
                        api.triggerHtmxEvent(element, 'htmx:sse:error', {
                            connection,
                            error: new Error(`SSE reconnect failed with status ${currentResponse.status}`),
                            status: currentResponse.status
                        });
                        reconnectRequested = false;
                        connection.attempt++;
                        continue;
                    }

                    connection.status = currentResponse.status;
                    api.triggerHtmxEvent(element, 'htmx:sse:after:connection', {connection});
                    connection.attempt = 0;
                }

                // Stream messages
                reconnectRequested = false;

                try {
                    connection.reader = currentResponse.body.getReader();

                    for await (let msg of parseSSE(connection)) {
                        if (!element.isConnected || reconnectRequested) break;

                        if (msg.hasId) {
                            connection.lastEventId = msg.id;
                            if (!msg.id) clearLastEventIdHeader(ctx.request.headers);
                        }

                        if (!msg.hasData && !msg.event) continue;

                        let pendingWork = [];
                        let detail = {
                            connection,
                            message: {data: msg.data, event: msg.event, id: msg.id},
                            cancelled: false,
                            waitUntil: promise => pendingWork.push(Promise.resolve(promise))
                        };
                        let shouldProcess = api.triggerHtmxEvent(element, 'htmx:sse:before:message', detail);

                        await Promise.all(pendingWork);
                        if (!shouldProcess || detail.cancelled) continue;

                        if (msg.retry != null) config.reconnectDelay = msg.retry;

                        if (detail.message.event) {
                            // hx:release triggers early release
                            if (detail.message.event === 'hx:release') release();

                            htmx.trigger(element, detail.message.event, {data: detail.message.data, id: detail.message.id});
                            api.triggerHtmxEvent(element, 'htmx:sse:after:message', {connection, message: detail.message});

                            // hx-sse:close="eventname": close connection on matching event
                            let closeEvent = api.attributeValue(element, 'hx-sse:close');
                            if (closeEvent && detail.message.event === closeEvent) {
                                cleanup(element, 'message');
                                return;
                            }
                            continue;
                        }

                        // Swap content using the ctx from core (target/swap already resolved)
                        ctx.text = detail.message.data;
                        // Always prevent empty swap for SSE - protects against empty data and
                        // ensures OOB-only messages don't clear target (regardless of allowEmptySwapAfterOOB)
                        if (!ctx.swap.includes('swapEmpty')) ctx.swap += ' swapEmpty:false';
                        await htmx.swap(ctx);
                        if (config.releaseOn === 'first') release();
                        api.triggerHtmxEvent(element, 'htmx:sse:after:message', {connection, message: detail.message});
                    }
                } catch (e) {
                    // core aborts its own controller, so check the error too
                    if (!connection.abortController?.signal?.aborted && e.name !== 'AbortError') {
                        api.triggerHtmxEvent(element, 'htmx:sse:error', {connection, error: e});
                    }
                }

                if (!element.isConnected) break;

                connection.attempt++;
            }
        } finally {
            release();  // Always release when stream ends
            cleanup(element, element.isConnected ? 'ended' : 'removed');
        }
    }

    // ========================================
    // ELEMENT PROCESSING
    // ========================================

    function processElement(element) {
        let connectUrl = api.attributeValue(element, 'hx-sse:connect');
        if (!connectUrl) return;
        if (element._htmx?.sse) return; // already set up

        let hxTrigger = api.attributeValue(element, 'hx-trigger') || 'load';
        api.onTrigger(element, hxTrigger, () => {
            if (element._htmx?.sse) return; // prevent duplicate connections
            htmx.ajax('GET', connectUrl, {source: element});
        });
    }

    // ========================================
    // CLEANUP
    // ========================================

    function cleanup(element, reason) {
        let connection = element?._htmx?.sse;
        if (!connection) return;

        connection.abortController?.abort();
        connection.reader?.cancel?.();
        if (connection.delayCanceller) connection.delayCanceller();
        if (connection.visibilityHandler) {
            document.removeEventListener('visibilitychange', connection.visibilityHandler);
        }
        api.triggerHtmxEvent(element, 'htmx:sse:close', {connection, reason: reason || 'cleanup'});
        delete element._htmx.sse;
    }

    // ========================================
    // BACKWARD COMPATIBILITY
    // ========================================

    function checkLegacyAttributes(element) {
        for (let attribute of ['sse-connect', 'sse-close', 'sse-swap']) {
            if (!element.hasAttribute(attribute) || warnedLegacyAttributes.has(attribute)) continue;

            if (attribute === 'sse-swap') {
                console.warn('htmx: [hx-sse] sse-swap is removed in htmx 4. Unnamed SSE messages are swapped automatically. Named events are dispatched as DOM events.');
            } else {
                console.warn(`htmx: [hx-sse] legacy attribute ${attribute} is deprecated; use hx-sse:${attribute.slice(4)} instead`);
            }
            warnedLegacyAttributes.add(attribute);
        }
    }

    // ========================================
    // EXTENSION REGISTRATION
    // ========================================

    htmx.registerExtension('sse', {
        init: (internalAPI) => {
            api = internalAPI;
        },

        htmx_config_request: (element, {ctx: {request}}) => {
            request.headers.Accept =
                `${request.headers.Accept ?? request.headers.accept ?? 'text/html'}, text/event-stream`;
        },

        // Intercept SSE responses before core consumes the body
        htmx_before_response: (element, detail) => {
            let ctx = detail.ctx;
            let contentType = ctx.response.raw.headers.get('Content-Type');
            if (!contentType?.includes('text/event-stream')) return;

            // Take over streaming; use extensionPromise to hold the request open
            clearTimeout(ctx.requestTimeout);
            let releaseRequest;
            ctx.extensionPromise = new Promise(resolve => releaseRequest = resolve);
            handleSSEResponse(ctx, releaseRequest).catch(e => {
                // an aborted stream is a normal end, not an error
                if (e.name !== 'AbortError') {
                    api.triggerHtmxEvent(element, 'htmx:sse:error', {error: e, url: ctx.request.action});
                }
            });
            return false;
        },

        htmx_after_process: (element) => {
            let mc = htmx.config.metaCharacter || ':';
            let processSSEElement = (element) => {
                checkLegacyAttributes(element);
                for (let name of ['connect', 'close']) {
                    let legacyAttr = `sse-${name}`;
                    if (!element.hasAttribute(legacyAttr)) continue;

                    let attr = (htmx.config.prefix || 'hx-') + 'sse' + mc + name;
                    if (!element.hasAttribute(attr)) element.setAttribute(attr, element.getAttribute(legacyAttr));
                }
                processElement(element);
            };

            processSSEElement(element);
            let sseAttr = CSS.escape('hx-sse' + mc + 'connect');
            let sseSelector = `[${sseAttr}]`;
            if (htmx.config.prefix) sseSelector += `,[${CSS.escape(htmx.config.prefix + 'sse' + mc + 'connect')}]`;
            element.querySelectorAll(`${sseSelector},[sse-connect],[sse-close],[sse-swap]`).forEach(processSSEElement);
        },

        htmx_before_cleanup: (element) => {
            cleanup(element);
        }
    });
})();
(() => {
    let api;
    
    // Build a CSS selector for querySelectorAll, respecting prefix + metaCharacter
    function wsSelector(suffix) {
        let mc = htmx.config.metaCharacter || ':';
        let sel = `[${CSS.escape('hx-ws' + mc + suffix)}]`;
        if (htmx.config.prefix) sel += `,[${CSS.escape(htmx.config.prefix + 'ws' + mc + suffix)}]`;
        return sel;
    }


    // ========================================
    // CONFIGURATION
    // ========================================
    
    function getConfig(element) {
        let hxConfig = api.HCON.parse(api.attributeValue(element, 'hx-config')).ws || {};

        return {
            reconnect: true,
            reconnectCodes: [
                1001, // Going Away
                1005, // No Status Received
                1006, // Abnormal Closure
                1011, // Internal Error
                1012, // Service Restart
                1013, // Try Again Later
                1014  // Bad Gateway
            ],
            reconnectDelay: 500,
            reconnectMaxDelay: 60000,
            reconnectMaxAttempts: Infinity,
            reconnectJitter: 0.3,
            pauseOnBackground: true,
            maxOutgoingMessagesQueueSize: 100,
            ...htmx.config.ws, // global defaults
            ...hxConfig // hx-config overrides
        };
    }
    
    // ========================================
    // URL NORMALIZATION
    // ========================================
    
    function normalizeWebSocketUrl(url) {
        // Already a WebSocket URL
        if (url.startsWith('ws://') || url.startsWith('wss://')) {
            return url;
        }

        // Convert http(s):// to ws(s)://
        if (url.startsWith('http://')) {
            return 'ws://' + url.slice(7);
        }
        if (url.startsWith('https://')) {
            return 'wss://' + url.slice(8);
        }

        // Relative URL - build absolute ws(s):// URL
        let protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        let host = window.location.host;
        
        if (url.startsWith('//')) {
            // Protocol-relative URL
            return protocol + url;
        }
        
        if (url.startsWith('/')) {
            // Absolute path
            return protocol + '//' + host + url;
        }
        
        // Relative path - resolve against current location
        let basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        return protocol + '//' + host + basePath + url;
    }
    
    // ========================================
    // CONNECTIONS
    // ========================================
    
    const connections = new Set();
    
    function getOrCreateConnection(url, element) {
        if (element._htmx.ws.connection) return element._htmx.ws.connection;
        let normalizedUrl = normalizeWebSocketUrl(url);

        let connection = {
            url: normalizedUrl,
            config: getConfig(element),
            socket: null,
            attempt: 0,
            timer: null,
            queue: [],
            receiving: Promise.resolve(),
            sending: Promise.resolve(),
            abortController: null,
            visibilityHandler: null,
            cancelled: false
        };

        if (!api.triggerHtmxEvent(element, 'htmx:ws:before:connection', {connection}) || connection.cancelled) {
            api.triggerHtmxEvent(element, 'htmx:ws:close', {
                connection, reason: 'cancelled', code: null
            });
            return null;
        }

        element._htmx.ws.connection = connection;
        connections.add(connection);
        createWebSocket(element, connection);

        let config = connection.config;
        if (config.pauseOnBackground) {
            connection.visibilityHandler = () => {
                if (document.hidden) {
                    if (connection.socket && connection.socket.readyState === WebSocket.OPEN) {
                        connection.socket.close();
                    }
                } else if (!connection.socket || connection.socket.readyState === WebSocket.CLOSED) {
                    connection.attempt = 0;
                    createWebSocket(element, connection);
                }
            };
            document.addEventListener('visibilitychange', connection.visibilityHandler);
        }

        return connection;
    }
    
    function cleanupConnection(element, connection) {
        if (connection.timer) clearTimeout(connection.timer);
        if (connection.visibilityHandler) {
            document.removeEventListener('visibilitychange', connection.visibilityHandler);
        }
        if (connection.abortController) {
            connection.abortController.abort();
        }
        connection.queue.length = 0;
        if (connection.socket) {
            try {
                if (connection.socket.readyState === WebSocket.OPEN || connection.socket.readyState === WebSocket.CONNECTING) {
                    connection.socket.close();
                }
            } catch (e) {
                // Socket may already be in an invalid state
            }
        }
        if (element._htmx?.ws?.connection === connection) delete element._htmx.ws.connection;
        connections.delete(connection);
    }

    function createWebSocket(element, connection) {
        let url = connection.url;
        // Abort old socket's listeners and close it
        if (connection.abortController) {
            connection.abortController.abort();
        }
        if (connection.socket) {
            let oldSocket = connection.socket;
            connection.socket = null;
            try {
                if (oldSocket.readyState === WebSocket.OPEN || oldSocket.readyState === WebSocket.CONNECTING) {
                    oldSocket.close();
                }
            } catch (e) {
                // Socket may already be in an invalid state
            }
        }

        try {
            connection.socket = new WebSocket(url, connection.config?.protocols);
            let ac = new AbortController();
            connection.abortController = ac;
            let opts = { signal: ac.signal };

            connection.socket.addEventListener('open', () => {
                if (element.isConnected) {
                    api.triggerHtmxEvent(element, 'htmx:ws:after:connection', {connection});
                } else {
                    cleanupConnection(element, connection);
                    return;
                }
                connection.attempt = 0;
                flushQueue(connection);
            }, opts);

            connection.socket.addEventListener('message', (event) => {
                connection.receiving = connection.receiving
                    .then(() => handleMessage(element, connection, event))
                    .catch(error => {
                        if (element.isConnected) api.triggerHtmxEvent(element, 'htmx:ws:error', {connection, error});
                    });
            }, opts);

            connection.socket.addEventListener('close', (event) => {
                if (event.target !== connection.socket) return;

                if (element.isConnected) api.triggerHtmxEvent(element, 'htmx:ws:close', {
                    connection, reason: 'closed', code: event.code
                });

                if (!connections.has(connection)) return;

                let config = connection.config;
                if (config.pauseOnBackground && document.hidden) return;

                if (config.reconnect && config.reconnectCodes.includes(event.code) && element.isConnected) {
                    scheduleReconnect(element, connection);
                } else {
                    cleanupConnection(element, connection);
                }
            }, opts);

            connection.socket.addEventListener('error', (error) => {
                if (element.isConnected) api.triggerHtmxEvent(element, 'htmx:ws:error', {connection, error});
            }, opts);

        } catch (error) {
            if (element.isConnected) api.triggerHtmxEvent(element, 'htmx:ws:error', {connection, error});
        }
    }
    
    function scheduleReconnect(element, connection) {
        let config = connection.config;

        connection.attempt++;
        let attempt = connection.attempt;

        if (!config.reconnect || attempt > config.reconnectMaxAttempts) {
            cleanupConnection(element, connection);
            return;
        }

        let baseDelay = htmx.parseInterval(config.reconnectDelay) ?? config.reconnectDelay;
        let maxDelay = htmx.parseInterval(config.reconnectMaxDelay) ?? config.reconnectMaxDelay;

        let delay = Math.min(
            baseDelay * Math.pow(2, attempt - 1),
            maxDelay
        );

        if (config.reconnectJitter > 0) {
            let jitterRange = delay * config.reconnectJitter;
            delay = Math.max(0, delay + (Math.random() * 2 - 1) * jitterRange);
        }

        if (element.isConnected) {
            connection.cancelled = false;
            if (!api.triggerHtmxEvent(element, 'htmx:ws:before:connection', {connection}) || connection.cancelled) {
                api.triggerHtmxEvent(element, 'htmx:ws:close', {
                    connection, reason: 'cancelled', code: null
                });
                cleanupConnection(element, connection);
                return;
            }
        } else {
            cleanupConnection(element, connection);
            return;
        }

        connection.timer = setTimeout(() => {
            if (element.isConnected) {
                createWebSocket(element, connection);
            } else {
                cleanupConnection(element, connection);
            }
        }, delay);
    }
    
    // ========================================
    // MESSAGES
    // ========================================

    function transmitMessage(connection, element, message) {
        try {
            connection.socket.send(message.data);
            api.triggerHtmxEvent(element, 'htmx:ws:after:message:outgoing', {connection, message});
        } catch (error) {
            api.triggerHtmxEvent(element, 'htmx:ws:error', {connection, error});
        }
    }

    function flushQueue(connection) {
        while (connection.queue.length && connection.socket?.readyState === WebSocket.OPEN) {
            let queuedMessage = connection.queue.shift();
            transmitMessage(connection, queuedMessage.element, queuedMessage.message);
        }
    }

    async function sendMessage(element, event) {
        let owner = element.closest(wsSelector('connect'));
        let url = owner && api.attributeValue(owner, 'hx-ws:connect');

        if (!url) {
            api.triggerHtmxEvent(element, 'htmx:ws:error', {
                url: null, error: 'No WebSocket connection found for element'
            });
            return;
        }

        let normalizedUrl = normalizeWebSocketUrl(url);
        let connection = owner._htmx?.ws?.connection;

        if (!connection) {
            api.triggerHtmxEvent(element, 'htmx:ws:error', { url: normalizedUrl, error: 'Connection not open' });
            return;
        }

        // Build headers using core's request context (same as HTTP requests)
        let ctx = api.createRequestContext(element, event);
        let headers = {...ctx.request.headers};
        delete headers['Accept'];

        // Build outgoing values from form data.
        let form = element.form || element.closest('form');
        let formData = api.collectFormData(element, form, event.submitter);

        // Preserve multi-value form fields (checkboxes, multi-selects)
        let values = {};
        for (let [key, value] of formData) {
            if (key in values) {
                values[key] = [].concat(values[key], value);
            } else {
                values[key] = value;
            }
        }

        // Merge hx-vals after serialization to preserve JS types (numbers, booleans)
        let hxValsResult = api.getAttributeObject(element, 'hx-vals', obj => Object.assign(values, obj));

        let outgoingMessage = connection.sending.then(async () => {
            if (hxValsResult) await hxValsResult;
            delete values.headers;

            let pendingWork = [];
            let message = {
                headers,
                values,
                data: undefined
            };
            let detail = {
                connection,
                message,
                cancelled: false,
                waitUntil(promise) {
                    pendingWork.push(Promise.resolve(promise));
                }
            };
            let shouldSend = api.triggerHtmxEvent(element, 'htmx:ws:before:message:outgoing', detail);

            try {
                await Promise.all(pendingWork);
                if (!shouldSend || detail.cancelled) return;

                message.data ??= JSON.stringify({ ...message.values, headers: message.headers });
                if (!connections.has(connection)) {
                    api.triggerHtmxEvent(element, 'htmx:ws:error', {connection, error: 'Connection closed'});
                    return;
                }

                if (connection.socket?.readyState === WebSocket.OPEN) {
                    transmitMessage(connection, element, message);
                } else if (connection.queue.length >= connection.config.maxOutgoingMessagesQueueSize) {
                    api.triggerHtmxEvent(element, 'htmx:ws:error', {
                        connection,
                        error: 'Outgoing messages queue is full'
                    });
                } else {
                    connection.queue.push({element, message});
                }
            } catch (error) {
                api.triggerHtmxEvent(element, 'htmx:ws:error', {connection, error});
            }
        });
        connection.sending = outgoingMessage.catch(() => {});
        await outgoingMessage;
    }
    
    // ========================================
    // MESSAGE RECEIVING & ROUTING
    // ========================================
    
    async function handleMessage(element, connection, event) {
        let pendingWork = [];
        let message = {
            data: event.data,
            text() {
                let data = message.data;
                return typeof data === 'string'
                    ? Promise.resolve(data)
                    : data instanceof Blob
                        ? data.text()
                        : Promise.resolve(new TextDecoder().decode(data));
            },
            json() {
                return message.text().then(JSON.parse);
            }
        };

        if (!element.isConnected) {
            cleanupConnection(element, connection);
            return;
        }

        let detail = {
            connection,
            message,
            cancelled: false,
            waitUntil(promise) {
                pendingWork.push(Promise.resolve(promise));
            }
        };
        let shouldProcess = api.triggerHtmxEvent(element, 'htmx:ws:before:message:incoming', detail);

        await Promise.all(pendingWork);
        if (!shouldProcess || detail.cancelled) return;

        let json = null;
        let html;
        if (typeof message.data === 'string') {
            try {
                json = await message.json();
            } catch (e) {
                html = await message.text();
            }
        }

        // JSON with 'content' or 'payload' field: swap the HTML
        // Raw (non-JSON) string: swap the entire string as HTML
        // JSON without 'content'/'payload': data-only message, no swap (handle via events)
        if (json) {
            if (json.content !== undefined) {
                html = json.content;
            } else if (json.payload !== undefined) {
                html = json.payload; // backwards compat
                // Warn once per connection (not on every message)
                if (!connection._payloadWarnFired) {
                    console.warn('htmx: [hx-ws] json.payload is deprecated; use json.content instead');
                    connection._payloadWarnFired = true;
                }
            }
        }
        if (html != null) {
            let target = json?.target || api.attributeValue(element, 'hx-target');
            let swap = json?.swap || api.attributeValue(element, 'hx-swap') || htmx.config.defaultSwap;
            if (!/(?:^|\s)swapEmpty(?::(?:true|false))?(?=\s|$)/.test(swap)) swap += ' swapEmpty:false';

            await htmx.swap({
                sourceElement: element,
                target: target || element,
                swap,
                select: json?.select ?? api.attributeValue(element, 'hx-select'),
                selectOOB: api.attributeValue(element, 'hx-select-oob'),
                text: html,
                transition: false
            });
        }

        api.triggerHtmxEvent(element, 'htmx:ws:after:message:incoming', {connection, message});
    }
    
    // ========================================
    // ELEMENT LIFECYCLE
    // ========================================
    
    function initializeElement(element) {
        api.htmxProp(element).ws ??= {};
        if (element._htmx.ws.initialized) return;

        let connectUrl = api.attributeValue(element, 'hx-ws:connect');
        if (!connectUrl) return;

        let specString = api.attributeValue(element, 'hx-trigger') || 'load';
        api.onTrigger(element, specString, () => {
            getOrCreateConnection(connectUrl, element);
        });
        element._htmx.ws.initialized = true;
    }
    
    function initializeSendElement(element) {
        api.htmxProp(element).ws ??= {};
        if (element._htmx.ws.sendInitialized) return;

        let specString = api.attributeValue(element, 'hx-trigger');
        if (!specString) {
            specString = element.matches('form') ? 'submit' :
                         element.matches('input:not([type=button]):not([type=submit]),select,textarea') ? 'change' :
                         'click';
        }

        api.onTrigger(element, specString, async (evt) => {
            if (element.matches('form') && evt.type === 'submit') {
                evt.preventDefault();
            }
            await sendMessage(element, evt);
        });
        element._htmx.ws.sendInitialized = true;
    }
    
    function cleanupElement(element) {
        let connection = element._htmx?.ws?.connection;
        if (!connection) return;
        api.triggerHtmxEvent(element, 'htmx:ws:close', {
            connection, reason: 'removed', code: null
        });
        cleanupConnection(element, connection);
    }
    
    // ========================================
    // BACKWARD COMPATIBILITY
    // ========================================
    
    function checkLegacyAttributes(element) {
        if (element.hasAttribute('ws-connect') || element.hasAttribute('ws-send')) {
            console.warn('htmx: [hx-ws] legacy attributes ws-connect and ws-send are deprecated; use hx-ws:connect and hx-ws:send instead');

            if (element.hasAttribute('ws-connect')) {
                let url = element.getAttribute('ws-connect');
                let mc = htmx.config.metaCharacter || ':';
                let attr = (htmx.config.prefix || 'hx-') + 'ws' + mc + 'connect';
                if (!element.hasAttribute(attr)) {
                    element.setAttribute(attr, url);
                }
            }

            if (element.hasAttribute('ws-send')) {
                let mc = htmx.config.metaCharacter || ':';
                let attr = (htmx.config.prefix || 'hx-') + 'ws' + mc + 'send';
                if (!element.hasAttribute(attr)) {
                    element.setAttribute(attr, '');
                }
            }
        }
    }
    
    // ========================================
    // EXTENSION REGISTRATION
    // ========================================
    
    htmx.registerExtension('ws', {
        init: (internalAPI) => {
            api = internalAPI;
            
            // Initialize default config if not set
            if (!htmx.config.ws) {
                htmx.config.ws = {};
            }
        },
        
        htmx_after_process: (element) => {
            const processNode = (node) => {
                checkLegacyAttributes(node);

                let send = api.attributeValue(node, 'hx-ws:send');
                if (api.attributeValue(node, 'hx-ws:connect') != null) {
                    initializeElement(node);
                }

                if (send != null) {
                    initializeSendElement(node);
                }
            };

            processNode(element);

            let sel = wsSelector('connect') + ',' + wsSelector('send') + ',[ws-connect],[ws-send]';
            element.querySelectorAll(sel).forEach(processNode);
        },
        
        htmx_before_cleanup: (element) => {
            cleanupElement(element);
        }
    });
    
    if (typeof window !== 'undefined' && window.htmx) {
        // Clean up all WS connections on page navigation to prevent browser errors
        window.addEventListener('pagehide', () => {
            connections.forEach((connection) => {
                if (connection.socket) {
                    connection.socket.close(1000, 'page navigating away');
                }
            });
        });

    }
})();
(()=>{
    let api;

    function initializePreload(elt) {
        let preloadSpec = api.attributeValue(elt, "hx-preload");
        if (preloadSpec == undefined && !elt._htmx?.boosted) return;

        let preloadEvents = []
        let timeout = 5000;
        if (preloadSpec) {
            let specs = api.parseTriggerSpecs(preloadSpec);
            if (specs.length === 0) return;
            for (const spec of specs) {
                preloadEvents.push(spec.name)
                if (spec.timeout) {
                    timeout = htmx.parseInterval(spec.timeout)
                }
            }
        } else {
            let isBoostedAnchor = elt._htmx?.boosted && elt.tagName === "A";
            let isHxGet = api.attributeValue(elt, "hx-get") != null;
            if (!isBoostedAnchor && !isHxGet) return;
            if (isBoostedAnchor && htmx.config?.preload?.autoBoost === false) return;
            if (htmx.config?.preload?.boostTimeout) {
                timeout = htmx.parseInterval(htmx.config.preload.boostTimeout)
            }
            preloadEvents.push(htmx.config?.preload?.boostEvent || "mousedown");
            preloadEvents.push("touchstart");
        }

        let preloadListener = async (evt) => {
            let {method} = api.determineMethodAndAction(elt, evt);
            if (method !== 'GET') return;

            if (elt._htmx?.preload) return;

            let ctx = api.createRequestContext(elt, evt);
            let form = elt.form || elt.closest("form");
            let body = api.collectFormData(elt, form, evt.submitter);
            let valsResult = api.getAttributeObject(elt, 'hx-vals', obj => {
                for (let key in obj) body.set(key, obj[key]);
            });
            if (valsResult) await valsResult;

            let action = ctx.request.action.replace?.(/#.*$/, '');

            let params = new URLSearchParams(body);
            if (params.size) action += (/\?/.test(action) ? "&" : "?") + params;

            let url = new URL(action, location.href);
            elt._htmx.preload = {
                prefetch: fetch(action, ctx.request),
                action: url.origin === location.origin ? url.pathname + url.search : url.href,
                expiresAt: Date.now() + timeout
            };

            try {
                await elt._htmx.preload.prefetch;
            } catch (error) {
                delete elt._htmx.preload;
            }
        };
        for (let eventName of preloadEvents) {
            elt.addEventListener(eventName, preloadListener, { passive: true });
        }
        elt._htmx.preloadListener = preloadListener;
        elt._htmx.preloadEvents = preloadEvents;
    }

    htmx.registerExtension('preload', {
        init: (internalAPI) => {
            api = internalAPI;
        },

        htmx_after_init: (elt) => {
            initializePreload(elt);
        },

        htmx_before_request: (elt, detail) => {
            let {ctx} = detail;
            if (elt._htmx?.preload &&
                elt._htmx.preload.action === ctx.request.action &&
                Date.now() < elt._htmx.preload.expiresAt) {
                let prefetch = elt._htmx.preload.prefetch;
                ctx.fetch = () => prefetch;
                delete elt._htmx.preload;
            } else {
                if (elt._htmx) delete elt._htmx.preload;
            }
        },

        htmx_before_cleanup: (elt) => {
            if (elt._htmx?.preloadListener) {
                for (let eventName of elt._htmx.preloadEvents) {
                    elt.removeEventListener(eventName, elt._htmx.preloadListener);
                }
            }
        }
    });
})();
(() => {

    if (typeof navigation === 'undefined') return;

    let api;
    let activeCount = 0;
    let activeAborts = new Set();

    let cleanupNavigation = null;

    function shouldShowIndicator(elt) {
        let val = api.attributeValue(elt, 'hx-browser-indicator');
        if (val != null && val !== 'false') return true;
        if (htmx.config.boostBrowserIndicator && elt._htmx?.boosted) return true;
        return false;
    }

    function listenForNavigate() {
        navigation.addEventListener('navigate', (event) => {
            if (!event.canIntercept) return;

            // save state before intercept (navigation.navigate() with {history:'replace'} wipes it)
            let savedState = history.state;

            let hideBrowserIndicator;
            event.intercept({
                handler: () => new Promise(r => { hideBrowserIndicator = r }),
                scroll: 'manual',
                focusReset: 'manual'
            });

            event.signal.addEventListener('abort', () => {
                if (activeCount > 0) {
                    activeAborts.forEach(abort => abort());
                    activeAborts.clear();
                    activeCount = 0;
                }
                cleanupNavigation = null;
            });

            cleanupNavigation = () => {
                hideBrowserIndicator();
                // restore after resolving (replaceState during a pending intercept aborts the signal early)
                history.replaceState(savedState, '');
            };
        }, {once: true});
    }

    function startIndicator() {
        listenForNavigate();
        navigation.navigate(location.href, { history: 'replace' });
    }

    function stopIndicator() {
        if (cleanupNavigation) {
            cleanupNavigation();
            cleanupNavigation = null;
        }
    }

    htmx.registerExtension('browser-indicator', {
        init: (internalAPI) => {
            api = internalAPI;
        },

        htmx_before_history_update: () => {
            // stop indicator before htmx pushState fires a navigate event that would abort it
            stopIndicator();
        },

        htmx_before_request: (elt, detail) => {
            if (!shouldShowIndicator(elt)) return;
            detail.ctx._browserIndicator = true;
            activeCount++;
            if (activeCount === 1) startIndicator();
            // add abort after startIndicator() so it isn't present when navigate fires during navigation.navigate()
            if (detail.ctx.request?.abort) activeAborts.add(detail.ctx.request.abort);
        },

        htmx_finally_request: (elt, detail) => {
            if (!detail.ctx._browserIndicator) return;
            if (detail.ctx.request?.abort) activeAborts.delete(detail.ctx.request.abort);
            if (activeCount === 0) return;
            activeCount--;
            if (activeCount === 0) stopIndicator();
        }
    });
})();
//==========================================================
// hx-download.js
//
// An extension that triggers a file download instead of a
// DOM swap, with streaming progress events for progress bars.
//
// Activates when:
//   - hx-swap="download" is set on the element
//   - server responds with Content-Disposition: attachment
//   - server responds with HX-Download: <url> (fetches that
//     url as the download, useful when the backend cannot
//     stream the file directly as the htmx response)
//
// Usage:
//   <button hx-get="/file.pdf" hx-swap="download"
//           hx-ext="download">Download</button>
//
// Events:
//   htmx:download:start    {total}
//   htmx:download:progress {loaded, total, percent}
//   htmx:download:complete {filename, size}
//==========================================================
(() => {
    let api;

    htmx.registerExtension('download', {
        init: (internalAPI) => {
            api = internalAPI;
        },
        htmx_before_response: (elt, {ctx}) => {
            let downloadUrl = ctx.response.headers.get('HX-Download');
            if (downloadUrl) {
                (async () => streamDownload(ctx.sourceElement, await fetch(downloadUrl), downloadUrl))();
                return;
            }
            let cd = ctx.response.headers.get('Content-Disposition');
            if (ctx.swap !== 'download' && !cd?.includes('attachment')) return;
            // a download has no fixed duration, so drop the request timeout and
            // hand core a promise so it holds the request until we finish
            clearTimeout(ctx.requestTimeout);
            ctx.extensionPromise = streamDownload(ctx.sourceElement, ctx.response.raw, ctx.request.action);
            return false;
        }
    });

    function streamDownload(sourceElement, response, url) {
        return (async () => {
            let total = +response.headers.get('Content-Length') || null;
            api.triggerHtmxEvent(sourceElement, 'htmx:download:start', {total});
            let reader = response.body.getReader();
            let chunks = [], loaded = 0;
            while (true) {
                let {done, value} = await reader.read();
                if (done) break;
                chunks.push(value);
                loaded += value.length;
                api.triggerHtmxEvent(sourceElement, 'htmx:download:progress', {
                    loaded, total,
                    percent: total ? Math.round(loaded / total * 100) : null
                });
            }
            let blob = new Blob(chunks, {
                type: response.headers.get('Content-Type') || 'application/octet-stream'
            });
            let filename = parseFilename(response.headers, url);
            let blobUrl = URL.createObjectURL(blob);
            Object.assign(document.createElement('a'), {href: blobUrl, download: filename}).click();
            URL.revokeObjectURL(blobUrl);
            api.triggerHtmxEvent(sourceElement, 'htmx:download:complete', {filename, size: blob.size});
        })();
    }

    function parseFilename(headers, url) {
        let cd = headers.get('Content-Disposition');
        if (cd) {
            let match = cd.match(/filename\*?=['"]?(?:UTF-8'')?([^'";]+)/i);
            if (match) return decodeURIComponent(match[1]);
        }
        return url.split('/').pop().split('?')[0] || 'download';
    }
})();
(() =>{

    function normalizeSwapStyle(style) {
        return style === 'before' ? 'beforebegin' :
            style === 'after' ? 'afterend' :
                style === 'prepend' ? 'afterbegin' :
                    style === 'append' ? 'beforeend' : style;
    }

    let api;

    function insertPendingContent(ctx) {
        ctx.pending = api.attributeValue(ctx.sourceElement, "hx-pending");
        if (!ctx.pending) {
            return
        }

        let sourceElt = document.querySelector(ctx.pending);
        if (!sourceElt) return;

        let target = ctx.target;

        if (typeof target === 'string') {
            target = document.querySelector(target);
        }
        if (!target) return;

        // Create pending div with reset styling
        let pendingDiv = document.createElement('div');
        pendingDiv.style.cssText = 'all: initial';
        pendingDiv.classList.add('hx-pending');
        let sourceNodes = sourceElt instanceof HTMLTemplateElement ? sourceElt.content.childNodes : sourceElt.childNodes;
        for (let child of sourceNodes) pendingDiv.appendChild(child.cloneNode(true));

        // Set data-* for each request param
        if (ctx.pendingBody) {
            let keys = new Set(ctx.pendingBody.keys());
            for (let k of keys) {
                let values = ctx.pendingBody.getAll(k).filter(v => typeof v === 'string');
                if (!values.length) continue;
                let val = values.length === 1 ? values[0] : JSON.stringify(values);
                try {
                    pendingDiv.dataset[k] = val;
                } catch (e) {
                    try {
                        pendingDiv.setAttribute('data-' + k, val);
                    } catch (e2) { /* truly invalid name, skip */ }
                }
            }
        }

        let swapStyle = normalizeSwapStyle(ctx.swap);
        ctx.pendingHidden = [];

        if (swapStyle === 'innerHTML') {
            // Hide children of target
            for (let child of target.children) {
                child.style.display = 'none';
                ctx.pendingHidden.push(child);
            }
            target.appendChild(pendingDiv);
        } else if (['beforebegin', 'afterbegin', 'beforeend', 'afterend'].includes(swapStyle)) {
            target.insertAdjacentElement(swapStyle, pendingDiv);
        } else {
            // Assume outerHTML-like behavior, Hide target and insert div after it
            target.style.display = 'none';
            ctx.pendingHidden.push(target);
            target.after(pendingDiv);
        }
        ctx.pendingDiv = pendingDiv;
        htmx.process(pendingDiv);
    }

    function removePendingContent(ctx) {
        if (!ctx.pendingDiv) return;

        // Remove pending div
        ctx.pendingDiv.remove();

        // Unhide any hidden elements
        for (let elt of ctx.pendingHidden) {
            elt.style.display = '';
        }
    }

    htmx.registerExtension('hx-pending', {
        init: (internalAPI) => { api = internalAPI; },
        htmx_config_request: (elt, detail) => {
            let body = detail.ctx.request.body;
            if (body?.entries) detail.ctx.pendingBody = body;
        },
        htmx_before_request: (elt, detail) => {
            insertPendingContent(detail.ctx);
        },
        htmx_error : (elt, detail) => {
            removePendingContent(detail.ctx)
        },
        htmx_before_swap : (elt, detail) => {
            removePendingContent(detail.ctx)
        }
    });
})();
//==========================================================
// hx-targets.js
//
// An extension that adds an 'hx-targets' attribute to target
// multiple elements with the same swap content.
//
// Usage:
//   <button hx-get="/api" hx-targets=".card">Click</button>
//
// The response will be swapped into all elements matching
// the selector. The hx-targets attribute is inherited.
//==========================================================
(() => {
    let api;

    htmx.registerExtension('hx-targets', {
        init: (internalAPI) => {
            api = internalAPI;
        },
        htmx_before_swap: (elt, detail) => {
            let {ctx, tasks} = detail;
            let selector = api.attributeValue(ctx.sourceElement, 'hx-targets');
            if (!selector) return;

            let targets = htmx.findAll(ctx.sourceElement, selector);
            if (!targets.length) {
                console.warn(`htmx: '${selector}' on hx-targets did not match any elements`, { selector });
                return;
            }

            // Replace main task with one task per target
            let mainIndex = tasks.findIndex(t => t.type === 'main');
            if (mainIndex === -1) return;

            let mainTask = tasks[mainIndex];
            let newTasks = Array.from(targets).map(target => ({
                ...mainTask,
                fragment: mainTask.fragment.cloneNode(true),
                target
            }));

            tasks.splice(mainIndex, 1, ...newTasks);
        }
    });
})();
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
(() => {
    let api;
    let _currentId = null;

    const INDEX_KEY = 'htmx-history-index';

    function cfg() {
        return htmx.config.historyCache;
    }

    function prefixSelector(s) {
        let result = [s];
        if (htmx.config.prefix) result.push(s.replaceAll('hx-', htmx.config.prefix));
        return result.join(',');
    }

    function canUseStorage() {
        try {
            sessionStorage.setItem('__htmx_test__', '1');
            sessionStorage.removeItem('__htmx_test__');
            return true;
        } catch (_) { return false; }
    }

    function genId() {
        return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
    }

    function getHistoryTarget() {
        return htmx.find(prefixSelector('[hx-history-elt]')) || document.body;
    }

    const ATTR_VALUE   = 'data-htmx-history-value';
    const ATTR_CHECKED = 'data-htmx-history-checked';
    const ATTR_SCROLL  = 'data-htmx-history-scroll';

    function annotateState(root) {
        root.querySelectorAll('input, textarea, select').forEach(el => {
            let type = el.type?.toLowerCase();
            if (type === 'file' || type === 'password') return;
            if (type === 'checkbox' || type === 'radio') {
                if (el.checked) el.setAttribute(ATTR_CHECKED, '1');
            } else if (el.tagName === 'SELECT' && el.multiple) {
                let selected = Array.from(el.options).filter(o => o.selected).map(o => o.value);
                if (selected.length) el.setAttribute(ATTR_VALUE, JSON.stringify(selected));
            } else if (el.value) {
                el.setAttribute(ATTR_VALUE, el.value);
            }
        });
        root.querySelectorAll('*').forEach(el => {
            if (el.scrollTop > 0 || el.scrollLeft > 0)
                el.setAttribute(ATTR_SCROLL, `${el.scrollTop},${el.scrollLeft}`);
        });
    }

    function restoreAnnotations(root) {
        root.querySelectorAll(`[${ATTR_CHECKED}]`).forEach(el => {
            el.checked = true;
            el.removeAttribute(ATTR_CHECKED);
        });
        root.querySelectorAll(`[${ATTR_VALUE}]`).forEach(el => {
            let raw = el.getAttribute(ATTR_VALUE);
            if (el.tagName === 'SELECT' && el.multiple) {
                let values = JSON.parse(raw);
                Array.from(el.options).forEach(o => { o.selected = values.includes(o.value); });
            } else {
                el.value = raw;
            }
            el.removeAttribute(ATTR_VALUE);
        });
        root.querySelectorAll(`[${ATTR_SCROLL}]`).forEach(el => {
            let [top, left] = el.getAttribute(ATTR_SCROLL).split(',').map(Number);
            el.scrollTop = top;
            el.scrollLeft = left;
            el.removeAttribute(ATTR_SCROLL);
        });
    }

    function cleanContent(elt) {
        let clone = elt.cloneNode(true);
        clone.querySelectorAll('.htmx-request').forEach(el => el.classList.remove('htmx-request'));
        clone.querySelectorAll('[disabled][data-disabled-by-htmx]').forEach(el => {
            el.removeAttribute('disabled');
            el.removeAttribute('data-disabled-by-htmx');
        });
        return clone.outerHTML;
    }

    // --- Stamp the current history entry with an htmxId and track it ---

    function stampCurrentEntry() {
        let state = history.state || { htmx: true };
        let id = state.htmxId;
        if (!id) {
            id = genId();
            history.replaceState({ ...state, htmxId: id }, '', location.href);
        }
        _currentId = id;
    }

    // --- sessionStorage (LRU index of htmxIds) ---

    function readIndex() {
        try { return JSON.parse(sessionStorage.getItem(INDEX_KEY)) || []; } catch { return []; }
    }

    function writeIndex(index) {
        sessionStorage.setItem(INDEX_KEY, JSON.stringify(index));
    }

    function saveToStorage(htmxId, entry) {
        if (!canUseStorage() || cfg().size <= 0) return false;
        let index = readIndex().filter(id => id !== htmxId);
        while (index.length >= cfg().size) {
            sessionStorage.removeItem('htmx-history-' + index.shift());
        }
        let data = JSON.stringify(entry);
        while (true) {
            try {
                sessionStorage.setItem('htmx-history-' + htmxId, data);
                index.push(htmxId);
                writeIndex(index);
                return true;
            } catch (e) {
                if (index.length === 0) return false;
                sessionStorage.removeItem('htmx-history-' + index.shift());
            }
        }
    }

    function getFromStorage(htmxId) {
        try { return JSON.parse(sessionStorage.getItem('htmx-history-' + htmxId)); } catch { return null; }
    }

    // --- save / get ---


    function saveCurrentPage(targetId) {
        targetId = targetId || _currentId;
        if (!targetId) return;
        if (htmx.find(prefixSelector('[hx-history="false"]'))) return;

        let target = getHistoryTarget();
        annotateState(target);
        let head = document.head.outerHTML;
        let scroll = window.scrollY;
        let title = document.title;

        let detail = { target, head };
        if (api.triggerHtmxEvent(document, 'htmx:history:cache:before:save', detail) === false) return;
        let content = cleanContent(target);
        head = detail.head;

        saveToStorage(targetId, { content, head, scroll, title });
        api.triggerHtmxEvent(document, 'htmx:history:cache:after:save', { content, head, scroll, title });
    }

    function getCachedContent() {
        let id = history.state?.htmxId;
        if (!id) return null;
        return canUseStorage() ? getFromStorage(id) : null;
    }

    async function restoreFromCache(item) {
        let detail = { head: item.head, ready: null };
        api.triggerHtmxEvent(document, 'htmx:history:cache:before:restore', detail);
        if (detail.ready) await detail.ready;

        let cachedHTML = item.content;
        let restoreSwapTarget = getHistoryTarget();
        let restoreSwapStyle = cfg().swapStyle;
        let ctx = {
            sourceElement: document.body,
            target: restoreSwapTarget,
            swap: restoreSwapStyle,
            text: cachedHTML,
            transition: false
        };
        await htmx.swap(ctx);

        document.title = item.title || document.title;
        requestAnimationFrame(() => {
            window.scrollTo(0, item.scroll || 0);
            restoreAnnotations(getHistoryTarget());
            detail.item = item;
            api.triggerHtmxEvent(document, 'htmx:history:cache:after:restore', detail);
        });
    }

    htmx.registerExtension('history-cache', {
        init: (internalAPI) => {
            api = internalAPI;
            htmx.config.historyCache            ??= {};
            htmx.config.historyCache.size          ??= 10;
            htmx.config.historyCache.refreshOnMiss ??= false;
            htmx.config.historyCache.disable       ??= false;
            htmx.config.historyCache.swapStyle     ??= 'outerSync';
            stampCurrentEntry();
        },

        // Before core pushes/replaces, save the outgoing page
        htmx_before_history_update: (elt, detail) => {
            if (cfg().disable) return;
            stampCurrentEntry();
            saveCurrentPage();
        },

        // After core pushes/replaces, stamp the new entry and track it
        htmx_after_history_update: () => {
            if (cfg().disable) return;
            stampCurrentEntry();
        },

        htmx_before_history_restore: (elt, detail) => {
            if (cfg().disable) return;

            let outgoingId = _currentId;
            let destinationId = history.state?.htmxId;

            if (outgoingId && outgoingId !== destinationId) {
                saveCurrentPage(outgoingId);
            }

            if (!destinationId) {
                stampCurrentEntry();
            } else {
                _currentId = destinationId;
            }

            let item = getCachedContent();
            if (!item) {
                let missDetail = { path: detail.path, refreshOnMiss: cfg().refreshOnMiss };
                api.triggerHtmxEvent(document, 'htmx:history:cache:miss', missDetail);
                if (missDetail.refreshOnMiss) { location.reload(); return false; }
                return;
            }

            let hitDetail = { path: detail.path, item };
            if (api.triggerHtmxEvent(document, 'htmx:history:cache:hit', hitDetail) === false) return;

            detail.cancelled = true;
            restoreFromCache(hitDetail.item);
            return false;
        }
    });
})();
//==========================================================
// hx-upsert.js
//
// An extension to add 'upsert' swap style that updates
// existing elements by ID and inserts new ones.
//
// Modifiers:
//   key:attr - attribute name for sorting (default: id)
//   sort - sort ascending
//   sort:desc - sort descending
//   prepend - prepend elements without keys (default: append)
//==========================================================
(() => {
    let api;
    
    htmx.registerExtension('upsert', {
        init: (internalAPI) => {
            api = internalAPI;
        },
        htmx_process_upsert: (templateElt, detail) => {
            let {ctx, tasks} = detail;
            let swapSpec = {style: 'upsert'};
            let key = templateElt.getAttribute('key');
            let sort = templateElt.getAttribute('sort');
            let prepend = templateElt.hasAttribute('prepend');
            if (key) swapSpec.key = key;
            if (sort !== null) swapSpec.sort = sort || true;
            if (prepend) swapSpec.prepend = true;
            tasks.push({
                type: 'partial',
                fragment: templateElt.content.cloneNode(true),
                target: api.attributeValue(templateElt, 'hx-target'),
                swapSpec,
                sourceElement: ctx.sourceElement
            });
        },
        handle_swap: (style, target, fragment, swapSpec) => {
            if (style === 'upsert') {
                let keyAttr = swapSpec.key || 'id';
                let desc = swapSpec.sort === 'desc';
                let firstChild = target.firstChild;
                
                let getKey = (el) => el.getAttribute(keyAttr) || el.id;
                
                let compare = (a, b) => {
                    let result = a.localeCompare(b, undefined, {numeric: true});
                    return desc ? -result : result;
                };
                
                for (let newEl of Array.from(fragment.children)) {
                    let id = newEl.id;
                    if (id) {
                        let existing = document.getElementById(id);
                        if (existing) {
                            existing.replaceWith(newEl);
                            continue;
                        }
                    }
                    
                    let newKey = getKey(newEl);
                    if (!newKey) {
                        if (swapSpec.prepend) {
                            target.insertBefore(newEl, firstChild);
                        } else {
                            target.appendChild(newEl);
                        }
                        continue;
                    }
                    
                    let inserted = false;
                    for (let child of target.children) {
                        let childKey = getKey(child);
                        if (childKey && compare(newKey, childKey) < 0) {
                            target.insertBefore(newEl, child);
                            inserted = true;
                            break;
                        }
                    }
                    
                    if (!inserted) {
                        target.appendChild(newEl);
                    }
                }
                return true;
            }
            return false;
        }
    });
})();
//==========================================================
// hx-alpine-compat.js
//
// Alpine.js compatibility extension for htmx
// Initializes Alpine on fragments before swap
// and preserves Alpine state during morph operations
//==========================================================
(() => {
    let api;
    let deferCount = 0;

    function maybeFlush() {
        if (deferCount > 0) deferCount--;
        if (deferCount === 0 && window.Alpine?.flushAndStopDeferringMutations) {
            window.Alpine.flushAndStopDeferringMutations();
        }
    }

    htmx.registerExtension('alpine-compat', {
        init: (internalAPI) => {
            api = internalAPI;
            
            // Override isSoftMatch to handle Alpine reactive IDs
            let originalIsSoftMatch = api.isSoftMatch;
            api.isSoftMatch = function(oldNode, newNode) {
                // If both have Alpine reactive ID bindings, ignore ID mismatch
                if (oldNode._x_bindings?.id && newNode.matches?.('[\\:id], [x-bind\\:id]')) {
                    return oldNode instanceof Element && oldNode.tagName === newNode.tagName;
                }
                return originalIsSoftMatch(oldNode, newNode);
            };
        },
        
        htmx_before_swap: (elt, detail) => {
            if (!window.Alpine?.closestDataStack || !window.Alpine?.cloneNode || !window.Alpine?.deferMutations) {
                return;
            }
            if (deferCount === 0) {
                window.Alpine.deferMutations();
            }
            deferCount++;
            
            let {tasks} = detail;
            for (let task of tasks) {
                if (task.swapSpec.style === 'innerMorph' || task.swapSpec.style === 'outerMorph') {
                    if (!task.fragment || !task.target) continue;
                    
                    let target = typeof task.target === 'string' 
                        ? document.querySelector(task.target) 
                        : task.target;
                    if (!target) continue;
                }
            }
        },
        
        htmx_before_morph_node: (elt, detail) => {
            if (!window.Alpine?.closestDataStack || !window.Alpine?.cloneNode) {
                return;
            }
            let {oldNode, newNode} = detail;
            
            let oldDataStack = window.Alpine.closestDataStack(oldNode);
            newNode._x_dataStack = oldDataStack;
            
            // skip cloneNode for template children that will have errors as they can not have reactive content 
            if (!oldNode.isConnected) return;
            
            window.Alpine.cloneNode(oldNode, newNode);
            
            // If both have _x_teleport, morph the teleport target
            if (oldNode._x_teleport && newNode._x_teleport) {
                let fragment = document.createDocumentFragment();
                fragment.append(newNode._x_teleport);
                api.morph(oldNode._x_teleport, fragment, false);
            }
        },

        htmx_history_cache_before_save: (elt, detail) => {
            if (!window.Alpine?.destroyTree) return;
            detail.target.querySelectorAll('[x-data]').forEach(el => {
                if (el._x_dataStack) {
                    el.setAttribute('data-alpine-state', JSON.stringify(el._x_dataStack[0]));
                }
            });
            window.Alpine.destroyTree(detail.target);
        },

        htmx_history_cache_after_restore: (elt, detail) => {
            if (!window.Alpine) return;
            document.querySelectorAll('[data-alpine-state]').forEach(el => {
                let saved = JSON.parse(el.getAttribute('data-alpine-state'));
                el.removeAttribute('data-alpine-state');
                if (el._x_dataStack) {
                    for (let key in saved) {
                        try { el._x_dataStack[0][key] = saved[key]; } catch {}
                    }
                }
            });
        },

        htmx_after_swap: (elt, detail) => {
            detail.ctx._alpineFlushed = true;
            maybeFlush();
        },

        htmx_finally_request: (elt, detail) => {
            if (!detail.ctx._alpineFlushed) maybeFlush();
        }
    });
})();
