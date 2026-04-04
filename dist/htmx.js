// noinspection ES6ConvertVarToLetConst
var htmx = (() => {

    class ReqQ {
        #c = null
        #q = []

        issue(ctx, queueStrategy) {
            ctx.queueStrategy = queueStrategy
            if (!this.#c) {
                this.#c = ctx
                return true
            } else {
                // Replace strategy OR current is abortable: abort current and issue new
                if (queueStrategy === "replace" || (queueStrategy !== "abort" && this.#c.queueStrategy === "abort")) {
                    this.#q.forEach(value => value.status = "dropped");
                    this.#q = []
                    this.#c.request?.abort?.();
                    this.#c = ctx
                    return true
                } else if (queueStrategy === "queue all") {
                    this.#q.push(ctx)
                    ctx.status = "queued";
                } else if (queueStrategy === "drop") {
                    // ignore the request
                    ctx.status = "dropped";
                } else if (queueStrategy === "queue last") {
                    this.#q.forEach(value => value.status = "dropped");
                    this.#q = [ctx]
                    ctx.status = "queued";
                } else if (this.#q.length === 0 && queueStrategy !== "abort") {
                    // default queue first
                    this.#q.push(ctx)
                    ctx.status = "queued";
                } else {
                    ctx.status = "dropped";
                }
                return false
            }
        }

        finish() {
            this.#c = null
        }

        next() {
            return this.#q.shift()
        }

        abort() {
            this.#c?.request?.abort?.()
        }

        more() {
            return this.#q?.length
        }
    }

    class Htmx {

        #extMethods = new Map();
        #approvedExt = '';
        #registeredExt = new Set();
        #internalAPI;
        #actionSelector
        #boostSelector = "a,form";
        #verbs = ["get", "post", "put", "patch", "delete"];
        #hxOnQuery
        #transitionQueue
        #historyAbort
        #processingTransition

        constructor() {
            this.#initHtmxConfig();
            this.#initRequestIndicatorCss();
            this.#actionSelector = `[${this.#prefix("hx-action")}],[${this.#prefix("hx-get")}],[${this.#prefix("hx-post")}],[${this.#prefix("hx-put")}],[${this.#prefix("hx-patch")}],[${this.#prefix("hx-delete")}]`;
            this.#hxOnQuery = new XPathEvaluator().createExpression(`.//*[@*[ starts-with(name(), "${this.#prefix("hx-on")}")]]`);
            this.#internalAPI = {
                attributeValue: this.#attributeValue.bind(this),
                parseTriggerSpecs: this.#parseTriggerSpecs.bind(this),
                determineMethodAndAction: this.#determineMethodAndAction.bind(this),
                createRequestContext: this.#createRequestContext.bind(this),
                collectFormData: this.#collectFormData.bind(this),
                getAttributeObject: this.#getAttributeObject.bind(this),
                insertContent: this.#insertContent.bind(this),
                morph: this.#morph.bind(this),
                isSoftMatch: this.#isSoftMatch.bind(this),
                onTrigger: this.#onTrigger.bind(this),
                htmxProp: this.#htmxProp.bind(this),
                triggerHtmxEvent: this.#trigger.bind(this)
            };
            let init = () => {
                this.#initHistoryHandling()
                this.process(document.body)
            };
            if (document.readyState === 'loading') {
                document.addEventListener("DOMContentLoaded", init)
            } else {
                // wait a tick so extensions can register
                setTimeout(init)
            }
        }

        #initHtmxConfig() {
            this.version = '4.0.0-beta1'
            this.config = {
                logAll: false,
                prefix: "",
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
                morphScanLimit: 10,
                noSwap: [204, 304],
                implicitInheritance: false,
                defaultSettleDelay: 1
            }
            let metaConfig = document.querySelector('meta[name="htmx-config"]');
            if (metaConfig) {
                this.#mergeConfig(metaConfig.content, this.config);
            }
            this.#approvedExt = this.config.extensions;
        }

        #initRequestIndicatorCss() {
            if (this.config.includeIndicatorCSS !== false) {
                let nonceAttribute = "";
                if (this.config.inlineStyleNonce) {
                    nonceAttribute = ` nonce="${this.config.inlineStyleNonce}"`;
                }
                let indicator = this.config.indicatorClass
                let request = this.config.requestClass
                document.head.insertAdjacentHTML('beforeend', `<style${nonceAttribute}>` +
                    `.${indicator}{opacity:0;visibility: hidden} ` +
                    `.${request} .${indicator}, .${request}.${indicator}{opacity:1;visibility: visible;transition: opacity 200ms ease-in}` +
                    '</style>'
                )
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
            return !elt.closest || elt.closest(`[${this.#prefix("hx-ignore")}]`) != null
        }

        #prefix(s) {
            return this.config.prefix ? s.replace('hx-', this.config.prefix) : s;
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
            let unprefixed = name;
            name = this.#maybeAdjustMetaCharacter(this.#prefix(name));
            let appendName = name + this.#maybeAdjustMetaCharacter(":append");
            let inheritName = name + (this.config.implicitInheritance ? "" : this.#maybeAdjustMetaCharacter(":inherited"));
            let inheritAppendName = name + this.#maybeAdjustMetaCharacter(":inherited:append");

            if (elt.hasAttribute(name)) {
                let val = elt.getAttribute(name);
                return eltCollector ? eltCollector(val, elt) : val;
            }

            if (elt.hasAttribute(inheritName)) {
                let val = elt.getAttribute(inheritName);
                return eltCollector ? eltCollector(val, elt) : val;
            }

            if (elt.hasAttribute(appendName) || elt.hasAttribute(inheritAppendName)) {
                let appendValue = elt.getAttribute(appendName) || elt.getAttribute(inheritAppendName);
                let parent = elt.parentNode?.closest?.(`[${CSS.escape(inheritName)}],[${CSS.escape(inheritAppendName)}]`);
                if (eltCollector) {
                    eltCollector(appendValue, elt);
                }
                if (parent) {
                    let inherited = this.#attributeValue(parent, unprefixed, undefined, eltCollector);
                    return inherited ? (inherited + "," + appendValue).replace(/[{}]/g, '') : appendValue;
                }
                return appendValue;
            }

            let parent = elt.parentNode?.closest?.(`[${CSS.escape(inheritName)}],[${CSS.escape(inheritAppendName)}]`);
            if (parent) {
                let val = this.#attributeValue(parent, unprefixed, undefined, eltCollector);
                if (!eltCollector && val && this.config.implicitInheritance) {
                    this.#triggerExtensions(elt, "htmx:after:implicitInheritance", {elt, name, parent})
                }
                return val;
            }
            return defaultVal;
        }

        #parseConfig(configString) {
            if (!configString) return {};
            if (configString[0] === '{') return JSON.parse(configString);
            let configPattern = /(?:"([^"]+)"|([^\s,:]+))(?:\s*:\s*(?:"([^"]*)"|'([^']*)'|<([^>]+)\/>|([^\s,]+)))?(?=\s|,|$)/g;
            return [...configString.matchAll(configPattern)].reduce((result, match) => {
                let keyPath = (match[1] ?? match[2]).split('.');
                let value = (match[3] ?? match[4] ?? match[5] ?? match[6] ?? 'true').trim();
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else if (/^\d+$/.test(value)) value = parseInt(value);
                if (keyPath.some(k => this.#internalField(k))) return result;
                keyPath.slice(0, -1).reduce((obj, key) => obj[key] ??= {}, result)[keyPath.at(-1)] = value;
                return result;
            }, {});
        }

        #internalField(k) {
            return k === '#proto#' || k === 'constructor' || k === 'prototype';
        }

        #mergeConfig(configString, target) {
            let parsed = this.#parseConfig(configString);
            for (let key in parsed) {
                if (this.#internalField(key)) continue;
                let val = parsed[key];
                if (val && typeof val === 'object' && !Array.isArray(val) && target[key]) {
                    Object.assign(target[key], val);
                } else {
                    target[key] = val;
                }
            }
            return target;
        }

        #parseTriggerSpecs(spec) {
            return spec.split(',').map(s => {
                let m = s.match(/^\s*(\S+\[[^\]]*\]|\S+)\s*(.*?)\s*$/);
                if (!m || !m[1]) return null;
                if (m[1].includes('[') && !m[1].includes(']')) throw "unterminated:" + m[1];
                let result = m[2] ? this.#parseConfig(m[2]) : {};
                result.name = m[1];
                return result;
            }).filter(s => s);
        }

        #determineMethodAndAction(elt, evt) {
            if (this.#isBoosted(elt)) {
                return this.#boostedMethodAndAction(elt, evt)
            } else {
                let method = this.#attributeValue(elt, "hx-method") || "GET"
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
                method = method.toUpperCase()
                return {action, method}
            }
        }

        #boostedMethodAndAction(elt, evt) {
            if (elt.matches("a")) {
                return {action: elt.getAttribute("href"), method: "GET"}
            } else {
                let action = evt.submitter?.getAttribute?.("formAction") || elt.getAttribute("action");
                let method = evt.submitter?.getAttribute?.("formMethod") || elt.getAttribute("method") || "GET";
                return {action, method: method.toUpperCase()}
            }
        }

        #htmxProp(elt) {
            if (!elt._htmx) {
                elt._htmx = { listeners: [], triggerSpecs: [] };
                elt.setAttribute('data-htmx-powered', 'true');
            }
            return elt._htmx;
        }

        #initializeElement(elt) {
            if (this.#shouldInitialize(elt) && this.#trigger(elt, "htmx:before:init", {}, true)) {
                let htmxProp = this.#htmxProp(elt);
                htmxProp.initialized = true;
                htmxProp.eventHandler = this.#createHtmxEventHandler(elt);
                this.#initializeTriggers(elt);
                this.#initializeAbortListener(elt)
                this.#trigger(elt, "htmx:after:init", {}, true)
            }
        }

        #createHtmxEventHandler(elt) {
            return async (evt) => {
                try {
                    let ctx = this.#createRequestContext(elt, evt);
                    await this.#handleTriggerEvent(ctx);
                } catch (e) {
                    console.error(e)
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
                this.#mergeConfig(sourceElement._htmx.boosted, ctx);
            }
            ctx.target = this.#resolveTarget(sourceElement, ctx.target);
            ctx.request.headers["HX-Request-Type"] = (ctx.target === document.body || ctx.select) ? "full" : "partial";
            if (ctx.target) {
                ctx.request.headers["HX-Target"] = this.#buildIdentifier(ctx.target);
            }

            // Apply hx-config overrides
            let configAttr = this.#attributeValue(sourceElement, "hx-config");
            if (configAttr) {
                this.#mergeConfig(configAttr, ctx.request);
            }
            return ctx;
        }

        #buildIdentifier(elt) {
            return `${elt.tagName.toLowerCase()}${elt.id ? '#' + elt.id : ''}`;
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

        #handleHxHeaders(elt, headers) {
            return this.#getAttributeObject(elt, "hx-headers", obj => {
                for (let key in obj) headers[key] = String(obj[key]);
            });
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
            let body = this.#collectFormData(elt, form, evt.submitter, ctx.request.validate)
            if (!body) return  // Validation failed
            let valsResult = this.#getAttributeObject(elt, "hx-vals", obj => {
                ctx.vals = obj;
                for (let key in obj) body.set(key, obj[key]);
            });
            if (valsResult) await valsResult; // Only await if it returned a promise
            if (ctx.values) {
                for (let k in ctx.values) {
                    body.delete(k);
                    body.append(k, ctx.values[k]);
                }
            }

            // Handle dynamic headers
            let headersResult = this.#handleHxHeaders(elt, ctx.request.headers)
            if (headersResult) await headersResult  // Only await if it returned a promise

            // Setup event-dependent request details
            Object.assign(ctx.request, {
                form,
                submitter: evt.submitter,
                body
            })

            if (!this.#trigger(elt, "htmx:config:request", {ctx: ctx})) return
            if (!this.#verbs.includes(ctx.request.method.toLowerCase())) return

            let javascriptContent = this.#extractJavascriptContent(ctx.request.action);
            if (javascriptContent != null) {
                let data = Object.fromEntries(ctx.request.body);
                await this.#executeJavaScriptAsync(ctx.sourceElement, data, javascriptContent, false);
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
            } else if (this.#attributeValue(elt, "hx-encoding") !== "multipart/form-data") {
                ctx.request.body = new URLSearchParams(ctx.request.body);
            }

            await this.#issueRequest(ctx);
        }

        async #issueRequest(ctx) {
            let elt = ctx.sourceElement
            let syncStrategy = this.#determineSyncStrategy(elt);
            let requestQueue = this.#getRequestQueue(elt);

            if (!requestQueue.issue(ctx, syncStrategy)) return

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
                            resolve(js ? this.#executeJavaScriptAsync(elt, {}, js, true) : window.confirm(ctx.confirm));
                        }
                    });
                    if (!confirmed) return;
                }

                // initialize timeout & indicators after confirmation
                this.#initTimeout(ctx);
                indicators = this.#showIndicators(elt);
                disableElements = this.#disableElements(elt);

                ctx.fetch ||= window.fetch.bind(window)
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
                clearTimeout(ctx.requestTimeout);
                this.#trigger(elt, "htmx:finally:request", {ctx})
                if (!ctx.keepIndicators) {
                    this.#hideIndicators(indicators);
                    this.#enableElements(disableElements);
                }

                requestQueue.finish()
                if (requestQueue.more()) {
                    // intentionally not awaited — #issueRequest has its own try/catch
                    this.#issueRequest(requestQueue.next())
                }
            }
        }

        // Extract HX-* response headers into ctx.hx
        // Maps: HX-Trigger → ctx.hx.trigger, HX-Push-Url → ctx.hx.pushurl, etc.
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
            if (ctx.hx.trigger) { // HX-Trigger
                this.#handleTriggerHeader(ctx.hx.trigger, ctx.sourceElement);
            }
            if (ctx.hx.refresh === 'true') { // HX-Refresh
                location.reload();
                return true // TODO - necessary?  wouldn't it abort the current js?
            }
            if (ctx.hx.redirect) { // HX-Redirect
                location.href = ctx.hx.redirect;
                return true // TODO - same, necessary?
            }
            if (ctx.hx.location) { // HX-Location
                let path = ctx.hx.location, opts = {};
                if (path[0] === '{' || /[\s,]/.test(path)) {
                    opts = this.#parseConfig(path);
                    path = opts.path;
                    delete opts.path;
                }
                opts.push = opts.push || 'true';
                this.ajax('GET', path, opts);
                return true // TODO this seems legit
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
            let syncValue = this.#attributeValue(elt, "hx-sync");
            if (!syncValue) return "queue first";
            let strategy = syncValue.split(":").pop().trim();
            return /^(drop|abort|replace|queue)/.test(strategy) ? strategy : "queue first";
        }

        #getRequestQueue(elt) {
            let syncValue = this.#attributeValue(elt, "hx-sync");
            let syncElt = elt
            if (syncValue) {
                let selector = syncValue.includes(":")
                    ? syncValue.slice(0, syncValue.lastIndexOf(":")).trim()
                    : (/^(drop|abort|replace|queue)/.test(syncValue) ? null : syncValue);
                if (selector) syncElt = this.#findOrWarn(elt, selector, "hx-sync") || elt;
            }
            return syncElt._htmxRequestQueue ||= new ReqQ()
        }

        #isModifierKeyClick(evt) {
            return evt.type === 'click' && (evt.ctrlKey || evt.metaKey || evt.shiftKey)
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
            let specString = this.#attributeValue(elt, "hx-trigger");
            if (!specString) {
                specString = elt.matches("form") ? "submit" :
                    elt.matches("input:not([type=button]):not([type=submit]),select,textarea") ? "change" :
                        "click";
            }
            this.#onTrigger(elt, specString, initialHandler)
        }

        // Wire up trigger listeners with full modifier support (delay, throttle, once, etc.)
        #onTrigger(elt, specString, handler) {
            let specs = this.#parseTriggerSpecs(specString)
            this.#htmxProp(elt).triggerSpecs.push(...specs)

            for (let spec of specs) {
                spec.handler = handler
                spec.listeners = []
                spec.values = new WeakMap()

                let [eventName, filter] = this.#extractFilter(spec.name);

                // should be first so logic is called only when all other filters pass
                if (spec.once) {
                    let original = spec.handler
                    spec.handler = (evt) => {
                        original(evt)
                        for (let listenerInfo of spec.listeners) {
                            listenerInfo.fromElt.removeEventListener(listenerInfo.eventName, listenerInfo.handler)
                        }
                    }
                }

                if (eventName === 'intersect' || eventName === "revealed") {
                    let observerOptions = {}
                    if (spec.opts?.root) {
                        observerOptions.root = this.#findOrWarn(elt, spec.opts.root)
                    }
                    if (spec.opts?.threshold) {
                        observerOptions.threshold = parseFloat(spec.opts.threshold)
                    }
                    let isRevealed = eventName === "revealed"
                    spec.observer = new IntersectionObserver((entries) => {
                        for (let i = 0; i < entries.length; i++) {
                            let entry = entries[i]
                            if (entry.isIntersecting) {
                                this.trigger(elt, 'intersect', {}, false)
                                if (isRevealed) {
                                    spec.observer.disconnect()
                                }
                                break;
                            }
                        }
                    }, observerOptions)
                    eventName = "intersect"
                    spec.observer.observe(elt)
                }

                if (spec.delay) {
                    let original = spec.handler
                    spec.handler = evt => {
                        clearTimeout(spec.timeout)
                        spec.timeout = setTimeout(() => original(evt),
                            this.parseInterval(spec.delay));
                    }
                }

                if (spec.throttle) {
                    let original = spec.handler
                    spec.handler = evt => {
                        if (spec.throttled) {
                            spec.throttledEvent = evt
                        } else {
                            spec.throttled = true
                            original(evt);
                            spec.throttleTimeout = setTimeout(() => {
                                spec.throttled = false
                                if (spec.throttledEvent) {
                                    // implement trailing-edge throttling
                                    let throttledEvent = spec.throttledEvent;
                                    spec.throttledEvent = null
                                    spec.handler(throttledEvent);
                                }
                            }, this.parseInterval(spec.throttle))
                        }
                    }
                }

                if (spec.target) {
                    let original = spec.handler
                    spec.handler = evt => {
                        if (evt.target?.matches?.(spec.target)) {
                            original(evt)
                        }
                    }
                }

                if (eventName === "every") {
                    let interval = Object.keys(spec).find(k => k !== 'name');
                    spec.interval = setInterval(() => {
                        if (elt.isConnected) {
                            this.#trigger(elt, 'every', {}, false);
                        } else {
                            clearInterval(spec.interval)
                        }
                    }, this.parseInterval(interval));
                }

                if (spec.consume) {
                    let original = spec.handler
                    spec.handler = (evt) => {
                        evt.stopPropagation()
                        original(evt)
                    }
                }

                if (filter) {
                    let original = spec.handler
                    spec.handler = (evt) => {
                        if (this.#shouldCancel(evt)) evt.preventDefault()
                        if (this.#executeFilter(elt, evt, filter)) {
                            original(evt)
                        }
                    }
                }

                let fromElts = [elt];
                if (spec.from) {
                    fromElts = this.#findAllExt(elt, spec.from)
                }

                if (spec.changed) {
                    let original = spec.handler
                    spec.handler = (evt) => {
                        let trigger = false
                        for (let fromElt of fromElts) {
                            if (spec.values.get(fromElt) !== fromElt.value) {
                                trigger = true
                                spec.values.set(fromElt, fromElt.value);
                            }
                        }
                        if (trigger) {
                            original(evt)
                        }
                    }
                }

                // load: fire handler directly (no listener needed)
                if (eventName === 'load') {
                    spec.handler(new CustomEvent('load'))
                    continue
                }

                for (let fromElt of fromElts) {
                    let listenerInfo = {fromElt, eventName, handler: spec.handler};
                    elt._htmx.listeners.push(listenerInfo)
                    spec.listeners.push(listenerInfo)
                    fromElt.addEventListener(eventName, spec.handler);
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
                let triggers = this.#parseConfig(value);
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

        async #executeJavaScriptAsync(thisArg, obj, code, expression = true) {
            let args = {}
            Object.assign(args, this.#apiMethods(thisArg))
            Object.assign(args, obj)
            let keys = Object.keys(args);
            let values = Object.values(args);
            let AsyncFunction = Object.getPrototypeOf(async function () {
            }).constructor;
            let func = new AsyncFunction(...keys, expression ? `return (${code})` : code);
            return await func.call(thisArg, ...values);
        }

        #executeFilter(thisArg, event, code) {
            let args = {}
            Object.assign(args, this.#apiMethods(thisArg))
            for (let key in event) {
                args[key] = event[key];
            }
            let keys = Object.keys(args);
            let values = Object.values(args);
            let func = new Function(...keys, `return (${code})`);
            return func.call(thisArg, ...values);
        }

        process(elt) {
            if (!elt) return;
            if (!(elt instanceof Element)) {
                for (let child of elt.children || []) this.process(child);
                return;
            }
            if (this.#ignore(elt)) return;
            if (!this.#trigger(elt, "htmx:before:process")) return
            let hxOnNodes = [elt];
            let iter = this.#hxOnQuery.evaluate(elt)
            let node = null
            while (node = iter.iterateNext()) hxOnNodes.push(node)
            for (let hxOnNode of hxOnNodes) {
                if (!this.#ignore(hxOnNode)) {
                    this.#handleHxOnAttributes(hxOnNode)
                }
            }
            for (let child of this.#queryEltAndDescendants(elt, this.#actionSelector)) {
                this.#initializeElement(child);
            }
            for (let child of this.#queryEltAndDescendants(elt, this.#boostSelector)) {
                this.#maybeBoost(child);
            }
            this.#trigger(elt, "htmx:after:process");
        }

        #maybeBoost(elt) {
            let boostValue = this.#attributeValue(elt, "hx-boost");
            if (boostValue && boostValue !== "false" && this.#shouldBoost(elt) && this.#trigger(elt, "htmx:before:init", {}, true)) {
                let htmxProp = this.#htmxProp(elt);
                htmxProp.initialized = true;
                htmxProp.eventHandler = this.#createHtmxEventHandler(elt);
                htmxProp.boosted = boostValue;
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
                        return !elt.getAttribute('href')?.startsWith?.("#") && this.#isSameOrigin(elt.href)
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

        #cleanup(elt) {
            if (elt._htmx) {
                this.#trigger(elt, "htmx:before:cleanup")
                for (let spec of elt._htmx.triggerSpecs || []) {
                    if (spec.interval) clearInterval(spec.interval);
                    if (spec.timeout) clearTimeout(spec.timeout);
                    if (spec.throttleTimeout) clearTimeout(spec.throttleTimeout);
                    spec.observer?.disconnect()
                }
                for (let listenerInfo of elt._htmx.listeners || []) {
                    listenerInfo.fromElt.removeEventListener(listenerInfo.eventName, listenerInfo.handler);
                }
                this.#trigger(elt, "htmx:after:cleanup")
            }
            if (elt.firstChild) {
                for (let child of elt.querySelectorAll('[data-htmx-powered]')) {
                    this.#cleanup(child);
                }
            }
        }

        #handlePreservedElements(fragment) {
            let pantry = document.createElement('div');
            pantry.style.display = 'none';
            document.body.insertAdjacentElement('afterend', pantry);
            let newPreservedElts = fragment.querySelectorAll?.(`[${this.#prefix('hx-preserve')}]`) || [];
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
            return Document.parseHTMLUnsafe?.(resp) || new DOMParser().parseFromString(resp, 'text/html');
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
                while (doc.body.childNodes.length > 0) {
                    fragment.append(doc.body.childNodes[0]);
                }
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
            for (let oobElt of fragment.querySelectorAll(`[${this.#prefix('hx-swap-oob')}]`)) {
                let oobValue = oobElt.getAttribute(this.#prefix('hx-swap-oob'));
                oobElt.removeAttribute(this.#prefix('hx-swap-oob'));
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
            return {style: this.#normalizeSwapStyle(style), ...this.#parseConfig(swapStr)};
        }

        #processPartials(fragment, ctx) {
            let tasks = [];

            for (let templateElt of fragment.querySelectorAll('template[hx]')) {
                let type = templateElt.getAttribute('type');
                
                if (type === 'partial') {
                    let targetSelector = templateElt.getAttribute(this.#prefix('hx-target')) || (templateElt.id ? '#' + CSS.escape(templateElt.id) : null);
                    if (targetSelector) {
                        this.#processScripts(templateElt.content);
                        let swapSpec = this.#parseSwapSpec(templateElt.getAttribute(this.#prefix('hx-swap')) || this.config.defaultSwap);
                        for (let target of document.querySelectorAll(targetSelector)) {
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
                showTarget?.scrollIntoView(swapSpec.show === 'top')
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
                newScript.textContent = oldScript.textContent;
                oldScript.replaceWith(newScript);
            }
        }

        //============================================================================================
        // Public JS API
        //============================================================================================

        async swap(ctx) {
            this.#handleHistoryUpdate(ctx);
            let {fragment, title} = this.#makeFragment(ctx.text);
            ctx.title = title;
            let tasks = [];

            // Process OOB and partials
            let oobTasks = this.#processOOB(fragment, ctx.sourceElement, ctx.selectOOB);
            let partialTasks = this.#processPartials(fragment, ctx);
            tasks.push(...oobTasks, ...partialTasks);

            // Process main swap first
            let mainSwap = this.#processMainSwap(ctx, fragment, partialTasks);
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
                swapPromises.push(this.#submitTransitionTask(tasksWrapper));
            }

            await Promise.all(swapPromises);

            this.#trigger(ctx.sourceElement, "htmx:after:swap", {ctx});
            if (ctx.title && !mainSwap?.swapSpec?.ignoreTitle) document.title = ctx.title;
            this.#handleAnchorScroll(ctx);
        }

        #processMainSwap(ctx, fragment, partialTasks) {
            // Create main task if needed
            let swapSpec = this.#parseSwapSpec(ctx.swap || this.config.defaultSwap);
            // skip creating main swap if extracting partials resulted in empty response except for delete style
            if (swapSpec.style === 'delete' || fragment.childElementCount > 0 || /\S/.test(fragment.textContent) || !partialTasks.length) {
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
                    }
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
            if (this.config.logAll) {
                console.log(eventName, detail, on)
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

        forEvent(event, timeout, on = document) {
            return new Promise((resolve, reject) => {
                let handler = (evt) => {
                    clearTimeout(timeoutId);
                    resolve(evt);
                };

                let timeoutId = timeout && setTimeout(() => {
                    on.removeEventListener(event, handler);
                    resolve(null);
                }, timeout);

                on.addEventListener(event, handler, { once: true });
            })
        }

        onLoad(callback) {
            this.on(this.#maybeAdjustMetaCharacter("htmx:after:process"), (evt) => {
                callback(evt.target)
            })
        }

        takeClass(element, className, container = element.parentElement) {
            for (let elt of this.#findAllExt(this.#normalizeElement(container), "." + className)) {
                this.#removeClass(elt, className);
            }
            this.#addClass(element, className);
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
        // TODO - make async
        ajax(verb, path, context) {
            // Normalize context to object
            if (!context || context instanceof Element || typeof context === 'string') {
                context = {target: context};
            }

            let sourceElt = typeof context.source === 'string' ?
                document.querySelector(context.source) : context.source;

            // If source selector was provided but didn't match, reject
            if (typeof context.source === 'string' && !sourceElt) {
                return Promise.reject(new Error('Source not found'));
            }

            // Resolve explicit target if provided; otherwise #createRequestContext
            // will resolve from hx-target on the source element
            if (context.target) {
                let target = this.#resolveTarget(document.body, context.target);
                if (!target) {
                    return Promise.reject(new Error('Target not found'));
                }
                sourceElt ||= target;
            }
            sourceElt ||= document.body;

            let ctx = this.#createRequestContext(sourceElt, context.event || {});
            Object.assign(ctx, context);
            if (context.target) ctx.target = this.#resolveTarget(document.body, context.target);
            Object.assign(ctx.request, {action: path, method: verb.toUpperCase()});
            if (context.headers) Object.assign(ctx.request.headers, context.headers);

            return this.#handleTriggerEvent(ctx);
        }

        //============================================================================================
        // History Support
        //============================================================================================

        #initHistoryHandling() {
            if (!this.config.history) return;
            if (!history.state) {
                history.replaceState({htmx: true}, '', location.href);
            }
            window.addEventListener('popstate', (event) => {
                if (event.state && event.state.htmx) {
                    this.#historyAbort?.abort();
                    this.#restoreHistory();
                }
            });
        }

        #pushUrlIntoHistory(path) {
            if (!this.config.history) return;
            history.pushState({htmx: true}, '', path);
            this.#trigger(document, "htmx:after:history:push", {path});
        }

        #replaceUrlInHistory(path) {
            if (!this.config.history) return;
            history.replaceState({htmx: true}, '', path);
            this.#trigger(document, "htmx:after:history:replace", {path});
        }

        #restoreHistory(path) {
            path = path || location.pathname + location.search;
            if (this.#trigger(document, "htmx:before:history:restore", {path, cacheMiss: true})) {
                if (this.config.history === "reload") {
                    location.reload();
                } else {
                    this.#historyAbort = new AbortController();
                    this.ajax('GET', path, {
                        target: 'body',
                        swap: 'innerHTML',
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
            let searchString = this.#maybeAdjustMetaCharacter(this.#prefix("hx-on:"));
            for (let attr of node.getAttributeNames()) {
                if (attr.startsWith(searchString)) {
                    let evtName = attr.substring(searchString.length)
                    let mc = this.config.metaCharacter || ':';
                    if (evtName.startsWith(mc)) evtName = 'htmx' + evtName
                    let code = node.getAttribute(attr);
                    let handler = async (evt) => {
                        try {
                            await this.#executeJavaScriptAsync(node, {"event": evt}, code, false)
                        } catch (e) {
                            console.error(e);
                        }
                    };
                    node.addEventListener(evtName, handler);
                    this.#htmxProp(node).listeners.push({fromElt: node, eventName: evtName, handler});
                }
            }
        }

        #showIndicators(elt) {
            let indicatorsSelector = this.#attributeValue(elt, "hx-indicator");
            let indicatorElements;
            if (!indicatorsSelector) {
                indicatorElements = [elt]
            } else {
                indicatorElements = this.#findAllExt(elt, indicatorsSelector, "hx-indicator");
            }
            for (const indicator of indicatorElements) {
                indicator._htmxReqCount ||= 0
                indicator._htmxReqCount++
                this.#addClass(indicator, this.config.requestClass)
            }
            return indicatorElements
        }

        #hideIndicators(indicatorElements) {
            for (let indicator of indicatorElements) {
                if (indicator._htmxReqCount) {
                    indicator._htmxReqCount--;
                    if (indicator._htmxReqCount <= 0) {
                        this.#removeClass(indicator, this.config.requestClass);
                        delete indicator._htmxReqCount
                    }
                }
            }
        }

        #disableElements(elt) {
            let disabledSelector = this.#attributeValue(elt, "hx-disable");
            let disabledElements = []
            if (disabledSelector) {
                disabledElements = this.#findAllExt(elt, disabledSelector, "hx-disable");
                for (let indicator of disabledElements) {
                    indicator._htmxDisableCount ||= 0
                    indicator._htmxDisableCount++
                    indicator.disabled = true
                }
            }
            return disabledElements
        }

        #enableElements(disabledElements) {
            for (const indicator of disabledElements) {
                if (indicator._htmxDisableCount) {
                    indicator._htmxDisableCount--
                    if (indicator._htmxDisableCount <= 0) {
                        indicator.disabled = false
                        delete indicator._htmxDisableCount
                    }
                }
            }
        }

        #collectFormData(elt, form, submitter, validate) {
            if (validate && form && !form.reportValidity()) return
            
            let formData = form ? new FormData(form) : new FormData()
            let included = form ? new Set(form.elements) : new Set()
            if (!form && elt.name) {
                if (validate && elt.reportValidity && !elt.reportValidity()) return
                formData.append(elt.name, elt.value)
                included.add(elt);
            }
            if (submitter && submitter.name) {
                formData.append(submitter.name, submitter.value)
                included.add(submitter);
            }
            let includeSelector = this.#attributeValue(elt, "hx-include");
            if (includeSelector) {
                for (let node of this.#findAllExt(elt, includeSelector)) {
                    if (validate && node.reportValidity && !node.reportValidity()) return
                    this.#addInputValues(node, included, formData);
                }
            }
            return formData
        }

        #addInputValues(elt, included, formData) {
            let inputs = this.#queryEltAndDescendants(elt, 'input:not([disabled]), select:not([disabled]), textarea:not([disabled])');

            for (let input of inputs) {
                if (!input.name || included.has(input)) continue;
                included.add(input);

                let type = input.type;
                if (type === 'checkbox' || type === 'radio') {
                    // Only add if checked
                    if (input.checked) {
                        formData.append(input.name, input.value);
                    }
                } else if (type === 'file') {
                    // Add all selected files
                    for (let file of input.files) {
                        formData.append(input.name, file);
                    }
                } else if (type === 'select-multiple') {
                    // Add all selected options
                    for (let option of input.selectedOptions) {
                        formData.append(input.name, option.value);
                    }
                } else if (input.matches('select, textarea, input')) {
                    // Regular inputs, single selects, textareas
                    formData.append(input.name, input.value);
                }
            }
        }

        #getAttributeObject(elt, attrName, callback) {
            let attrValue = this.#attributeValue(elt, attrName);
            if (!attrValue) return null;

            let javascriptContent = this.#extractJavascriptContent(attrValue);
            if (javascriptContent) {
                // Wrap in braces if not already wrapped (for htmx 2.x compatibility)
                if (javascriptContent.indexOf('{') !== 0) {
                    javascriptContent = '{' + javascriptContent + '}';
                }
                // Return promise for async evaluation
                return this.#executeJavaScriptAsync(elt, {}, javascriptContent, true).then(obj => {
                    callback(obj);
                });
            } else {
                // Synchronous path - return the parsed object directly
                callback(this.#parseConfig(attrValue));
            }
        }

        #stringHyperscriptStyleSelector(selector) {
            let s = selector.trim();
            return s.startsWith('<') && s.endsWith('/>') ? s.slice(1, -2) : s;
        }

        #findAllExt(eltOrSelector, maybeSelector, thisAttr, global) {
            let selector = maybeSelector ?? eltOrSelector;
            let elt = maybeSelector ? this.#normalizeElement(eltOrSelector) : document;
            if (selector.startsWith('global ')) {
                return this.#findAllExt(elt, selector.slice(7), thisAttr, true);
            }
            let parts = selector ? selector.replace(/<[^>]+\/>/g, m => m.replace(/,/g, '%2C'))
                .split(',').map(p => p.replace(/%2C/g, ',')) : [];
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
                console.warn(`htmx: '${selector}' on ${thisAttr} did not match any element`)
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
            let handler = () => {
                let requestQueue = this.#getRequestQueue(elt);
                requestQueue.abort();
            };
            elt.addEventListener("htmx:abort", handler);
            elt._htmx.listeners.push({fromElt: elt, eventName: "htmx:abort", handler});
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
                // Don't move elements containing focus
                if (cursor.contains(document.activeElement)) break;
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
            // If both have Alpine reactive ID bindings, ignore ID mismatch
            if (oldNode._x_bindings?.id && newNode.matches?.('[\\:id], [x-bind\\:id]')) {
                return true;
            }
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
            if (this.config.morphSkip && oldNode.matches?.(this.config.morphSkip)) return;
                
            // Trigger extension hook - if returns false, skip morphing this node
            if (!this.#triggerExtensions(oldNode, "htmx:before:morph:node", {oldNode, newNode})) return;
                
            this.#copyAttributes(oldNode, newNode);
            if (oldNode instanceof HTMLTextAreaElement && oldNode.defaultValue != newNode.defaultValue) {
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
            for (const attr of source.attributes) {
                if (!attributesToIgnore.includes(attr.name) && destination.getAttribute(attr.name) !== attr.value) {
                    destination.setAttribute(attr.name, attr.value);
                    if (attr.name === "value" && destination instanceof HTMLInputElement && destination.type !== "file") {
                        destination.value = attr.value;
                    }
                }
            }
            for (let i = destination.attributes.length - 1; i >= 0; i--) {
                let attr = destination.attributes[i];
                if (attr && !source.hasAttribute(attr.name) && !attributesToIgnore.includes(attr.name)) {
                    destination.removeAttribute(attr.name);
                }
            }
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
                let statusValue = this.#attributeValue(ctx.sourceElement, this.#maybeAdjustMetaCharacter("hx-status:") + pattern);
                if (statusValue) {
                    this.#mergeConfig(statusValue, ctx);
                    return;
                }
            }
        }

        #submitTransitionTask(task) {
            return new Promise((resolve) => {
                this.#transitionQueue ||= [];
                this.#transitionQueue.push({ task, resolve });
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
            let { task, resolve } = this.#transitionQueue.shift();

            try {
                if (document.startViewTransition) {
                    this.#trigger(document, "htmx:before:viewTransition", {task})
                    await document.startViewTransition(task).finished;
                    this.#trigger(document, "htmx:after:viewTransition", {task})
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
