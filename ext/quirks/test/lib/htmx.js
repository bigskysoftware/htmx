// noinspection ES6ConvertVarToLetConst
var htmx = (() => {

    class RequestQueue {
        #currentRequest = null
        #requestQueue = []
        shouldIssueRequest(ctx, queueStrategy) {
            if (!this.#currentRequest) {
                this.#currentRequest = ctx
                return true
            } else {
                if (queueStrategy === "replace") {
                    this.#requestQueue = []
                    if (this.#currentRequest) {
                        this.#currentRequest.cancelled = true;
                        this.#currentRequest.abort();
                    }
                    return true
                } else if (queueStrategy === "queue all") {
                    this.#requestQueue.push(ctx)
                } else if (queueStrategy === "drop") {
                    // ignore the request
                } else if (queueStrategy === "queue last") {
                    this.#requestQueue = [ctx]
                } else if (this.#requestQueue.length === 0) {
                    // default queue first
                    this.#requestQueue.push(ctx)
                }
                return false
            }
        }
        nextRequest() {
            this.#currentRequest = null
            return this.#requestQueue.shift()
        }
    }

    class Htmx {

        __mutationObserver = new MutationObserver((records) => this.__onMutation(records));
        __actionSelector = "[hx-action],[hx-get],[hx-post],[hx-put],[hx-patch],[hx-delete]";
        __boostSelector = "a,form";
        __verbs = ["get", "post", "put", "patch", "delete"];
        __hxOnQuery = new XPathEvaluator().createExpression('.//*[@*[ starts-with(name(), "hx-on:")]]')

        constructor() {
            this.__initHtmxConfig();
            document.addEventListener("mx:process", (evt) => this.process(evt.target));
            this.__initInternals();
        }

        __initInternals() {
            document.addEventListener("DOMContentLoaded", () => {
                this.__mutationObserver.observe(document.body, {childList: true, subtree: true});
                this.__maybeEstablishSSEConnection();
                this.__initHistoryHandling();
                this.process(document.body)
            })
        }

        __onMutation(mutations) {
            for (let mutation of mutations) {
                for (let node of mutation.removedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.__cleanup(node);
                    }
                }
                for (let node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.__processScripts(node);
                        this.process(node);
                    }
                }
            }
        };

        // TODO harden the SSE implementation, implement a custom 'htmx:trigger' event to trigger an event
        __maybeEstablishSSEConnection() {
            if (this.config.sse) {
                this.__eventSource = new EventSource(this.config.sseUrl);
                this.__eventSource.onmessage = async (event) => {
                    let ctx = {swapCfg: {swap: 'innerHTML'}};
                    this.extractResponseContent(event.data, ctx);
                    if (ctx.partialConfigs.length > 0) {
                        if(!this.__trigger(document, "htmx:before:swap", {})) return;
                        for (let swapCfg of ctx.partialConfigs) {
                            await this.swap(swapCfg).catch(() => {});
                        }
                        this.__trigger(document, "htmx:after:swap", {});
                    }
                };
            }
        }

        // TODO make most of the things like default swap, etc configurable
        __initHtmxConfig() {
            this.config = {
                sse: false,
                sseUrl: "/events",
                logAll: false,
                viewTransitions: true,
                historyEnabled: true,
                selfRequestsOnly: true,
                defaultTimeout: 60000 /* 00 second default timeout */
            }
            let metaConfig = this.find('meta[name="htmx:config"]');
            if (metaConfig) {
                Object.assign(this.config, JSON.parse(metaConfig.content));
            }
        }

        __ignore(elt) {
            return elt.closest("[hx-ignore]") != null
        }

        __evaledAttributeValue(elt, name, defaultVal = null, scope = elt) {
            let stringVal = this.__attributeValue(elt, name, defaultVal);
            let jsContent = this.__extractJavascriptContent(stringVal)
            if (jsContent) {
                return this.__executeJavaScript(elt, scope, jsContent);
            } else {
                return stringVal;
            }
        }

        __attributeValue(elt, name, defaultVal) {
            let inheritName = name + ":inherited";
            if (elt.hasAttribute(name) || elt.hasAttribute(inheritName)) {
                return elt.getAttribute(name) || elt.getAttribute(inheritName);
            }
            let value = elt.parentNode?.closest?.(`[${CSS.escape(inheritName)}`)?.getAttribute(inheritName) || defaultVal;
            return value
        }

        __tokenize(str) {
            let tokens = [], i = 0;
            while (i < str.length) {
                let c = str[i];
                if (c === '"' || c === "'") {
                    let q = c, s = c;
                    i++;
                    while (i < str.length) {
                        c = str[i];
                        s += c;
                        i++;
                        if (c === '\\' && i < str.length) {
                            s += str[i];
                            i++;
                        } else if (c === q) break;
                    }
                    tokens.push(s);
                } else if (/\s/.test(c)) {
                    while (i < str.length && /\s/.test(str[i])) i++;
                } else if (c === ':' || c === ',') {
                    tokens.push(c);
                    i++;
                } else {
                    let t = '';
                    while (i < str.length && !/[\s"':,]/.test(str[i])) t += str[i++];
                    tokens.push(t);
                }
            }
            return tokens;
        }

        __parseTriggerSpecs(spec) {
            let specs = []
            let currentSpec = null
            let tokens = this.__tokenize(spec);
            for (let i = 0; i < tokens.length; i++) {
                let token = tokens[i];
                if (token === ",") {
                    currentSpec = null;
                } else if (!currentSpec) {
                    while (token.includes("[") && !token.includes("]") && i + 1 < tokens.length) {
                        token += tokens[++i];
                    }
                    if (token.includes("[") && !token.includes("]")) {
                        throw "Unterminated event filter: " + token;
                    }
                    currentSpec = {name: token};
                    specs.push(currentSpec);
                } else if (tokens[i + 1] === ":") {
                    currentSpec[token] = tokens[i += 2];
                } else {
                    currentSpec[token] = true;
                }
            }

            return specs;
        }

        __determineMethodAndAction(elt, evt) {
            if (this.__isBoosted(elt)) {
                return this.__boostedMethodAndAction(elt, evt)
            } else {
                let method = this.__attributeValue(elt, "hx-method") || "get";
                let action = this.__attributeValue(elt, "hx-action");
                if (!action) {
                    for (let verb of this.__verbs) {
                        let verbAttribute = this.__attributeValue(elt, "hx-" + verb);
                        if (verbAttribute) {
                            action = verbAttribute;
                            method = verb;
                            break;
                        }
                    }
                }
                method = method.toUpperCase()
                return {action, method}
            }
        }

        __boostedMethodAndAction(elt, evt) {
            if (elt.matches("a")) {
                return {action: elt.getAttribute("href"), method: "GET"}
            } else {
                let action = evt.submitter?.getAttribute?.("formAction") || elt.getAttribute("action");
                let method = evt.submitter?.getAttribute?.("formMethod") || elt.getAttribute("method") || "GET";
                return {action, method}
            }
        }

        __initializeElement(elt) {
            if (this.__shouldInitialize(elt) && this.__trigger(elt, "htmx:before:init", {}, true)) {
                elt.__htmx = {eventHandler: this.__createHtmxEventHandler(elt), requests: []}
                elt.setAttribute('data-htmx-powered', 'true');
                this.__initializeTriggers(elt);
                this.__initializePreload(elt);
                this.__trigger(elt, "htmx:after:init", {}, true)
                this.__trigger(elt, "load", {}, false)
            }
        }

        __createHtmxEventHandler(elt) {
            return async (evt) => {
                try {
                    let ctx = this.__createRequestConfig(elt, evt);
                    await this.handleTriggerEvent(ctx);
                } catch(e) {
                    console.error(e)
                }
            };
        }

        __createRequestConfig(elt, evt) {
            let {action, method} = this.__determineMethodAndAction(elt, evt);
            let ctx = {
                elt,
                evt,
                action,
                validate: "true" === this.__attributeValue(elt, "hx-validate", elt.matches('form') ? "true" : "false"),
                select: this.__attributeValue(elt, "hx-select"),
                optimistic: this.__attributeValue(elt, "hx-optimistic"),
                options: {
                    method,
                    headers: this.__determineHeaders(elt)
                },
                swapCfg: {
                    target: this.__attributeValue(elt, "hx-target"),
                    swap: this.__attributeValue(elt, "hx-swap", "outerHTML"),
                    transition: this.config.viewTransitions
                }
            };

            // Apply hx-config overrides
            let configAttr = this.__attributeValue(elt, "hx-config");
            if (configAttr) {
                let configOverrides = JSON.parse(configAttr);
                for (let key in configOverrides) {
                    if (key.startsWith('+')) {
                        let actualKey = key.substring(1);
                        if (ctx[actualKey] && typeof ctx[actualKey] === 'object') {
                            Object.assign(ctx[actualKey], configOverrides[key]);
                        } else {
                            ctx[actualKey] = configOverrides[key];
                        }
                    } else {
                        ctx[key] = configOverrides[key];
                    }
                }
            }

            return ctx;
        }

        __determineHeaders(elt) {
            let headers = {"HX-Request": "true"};
            if (this.__isBoosted(elt)) {
                headers["HX-Boosted"] = "true"
            }
            let headersAttribute = this.__attributeValue(elt, "hx-headers");
            if (headersAttribute) {
                Object.assign(headers, JSON.parse(headersAttribute));
            }
            return headers;
        }

        __resolveTarget(elt, selector) {
            if (selector === 'this') {
                if (elt.hasAttribute("hx-target")) {
                    return elt;
                } else {
                    return elt.closest("[hx-target\\:inherited='this']")
                }
            } else if (selector != null) {
                return document.querySelector(selector);
            } else if (this.__isBoosted(elt)) {
                return document.body
            } else {
                return elt;
            }
        }

        __isBoosted(elt) {
            return elt.__htmx.boosted;
        }

        async handleTriggerEvent(ctx) {
            let elt = ctx.elt
            let evt = ctx.evt
            if (!elt.isConnected) return

            if (this.__isModifierKeyClick(evt)) return

            if (this.__shouldCancel(evt)) evt.preventDefault()

            // Resolve swap target
            Object.assign(ctx.swapCfg, {
                target: this.__resolveTarget(elt, ctx.swapCfg.target),
                elt
            })

            // Build request body
            let form = elt.form || elt.closest("form")
            let body = this.__collectFormData(elt, form, evt.submitter)
            this.__handleHxVals(elt, body)

            // Setup abort controller and action
            let ac = new AbortController()
            let action = ctx.action.replace?.(/#.*$/, '')

            Object.assign(ctx, {
                originalAction: ctx.action,
                action,
                form,
                submitter: evt.submitter,
                response: null,
                abort: ac.abort.bind(ac)
            })

            // TODO - consider how this works with hx-config
            Object.assign(ctx.options, {
                body,
                credentials: "same-origin",
                signal: ac.signal,
                ...(this.config.selfRequestsOnly && {mode: "same-origin"})
            })

            if (!this.__trigger(elt, "htmx:config:request", {ctx})) return
            if (!this.__verbs.includes(ctx.options.method.toLowerCase())) return
            if (ctx.validate && ctx.form && !ctx.form.reportValidity()) return

            let javascriptContent = this.__extractJavascriptContent(ctx.action);
            if (!javascriptContent && /GET|DELETE/.test(ctx.options.method)) {
                let params = new URLSearchParams(ctx.options.body)
                if (params.size) ctx.action += (/\?/.test(ctx.action) ? "&" : "?") + params
                ctx.options.body = null
            } else if(this.__attributeValue(elt, "hx-encoding") !== "multipart/form-data") {
                ctx.options.body = new URLSearchParams(ctx.options.body)
            }

            if (javascriptContent) {
                this.__executeJavaScript(ctx.elt, {}, javascriptContent, false);
            } else {
                await this.__issueRequest(ctx);
            }
        }

        async __issueRequest(ctx) {
            let elt = ctx.elt
            // Don't check isConnected here - queued requests should complete even if element was swapped
            let syncStrategy = this.__determineSyncStrategy(elt);
            let requestQueue = this.__getRequestQueue(elt);
            if(requestQueue.shouldIssueRequest(ctx, syncStrategy)){

                // establish timeout handler
                this.__initTimeout(ctx);
                let indicatorsSelector = this.__attributeValue(elt, "hx-indicator");
                this.__showIndicators(indicatorsSelector);
                let disableSelector = this.__attributeValue(elt, "hx-disable");
                this.__disableElts(disableSelector);
                try {
                    let confirmVal = this.__evaledAttributeValue(elt, 'hx-confirm')
                    if (confirmVal) {
                        if (confirmVal instanceof String) {
                            window.confirm(confirmVal)
                        } else {
                            let result = await confirmVal;
                            if (!result) return
                        }
                    }
                    if (!this.__trigger(elt, "htmx:before:request", {ctx})) return

                    // Check for valid preload
                    let response;
                    if (elt.__htmx.preload &&
                        elt.__htmx.preload.action === ctx.action &&
                        Date.now() < elt.__htmx.preload.expiresAt) {
                        response = await elt.__htmx.preload.prefetch;
                        delete elt.__htmx.preload;
                    } else {
                        delete elt.__htmx.preload;
                        // insert optimistic content, hide in case of outerHTML or innerHTML targets
                        this.__insertOptimisticContent(ctx);
                        response = await fetch(ctx.action, ctx.options);
                    }
                    ctx.response = {
                        raw: response,
                        status: response.status,
                        headers: response.headers,
                        cancelled: false
                    }
                    ctx.text = await response.text();

                    if (!this.__trigger(elt, "htmx:after:request", {ctx})) return
                    if (!ctx.response.cancelled) {
                        this.__handleHistoryUpdate(ctx);
                        // remove optimistic content
                        this.__removeOptimisticContent(ctx);
                        await this.__swapResponse(ctx);
                        // Scroll to anchor if present in original action
                        let anchor = ctx.originalAction?.split('#')[1]
                        if (anchor) {
                            document.getElementById(anchor)?.scrollIntoView({block: 'start', behavior: 'auto'})
                        }
                    }
                } catch (error) {
                    // remove optimistic content
                    this.__removeOptimisticContent(ctx);
                    this.__trigger(elt, "htmx:error", {ctx, error})
                } finally {
                    this.__hideIndicators(indicatorsSelector);
                    this.__enableElts(disableSelector);
                    this.__trigger(elt, "htmx:finally:request", {ctx})
                    let nextRequest = requestQueue.nextRequest();
                    if (nextRequest) {
                        // on the next tick, issue the next request if any
                        setTimeout(()=> this.__issueRequest(nextRequest), 0)
                    }
                }
            }
        }

        __initTimeout(ctx) {
            let timeoutInterval;
            if (ctx.options.timeout) {
                timeoutInterval = this.parseInterval(ctx.options.timeout);
            } else {
                timeoutInterval = htmx.config.defaultTimeout;
            }
            ctx.requestTimeout = setTimeout(() => ctx.abort(), timeoutInterval);
        }

        __determineSyncStrategy(elt) {
            let syncValue = this.__attributeValue(elt, "hx-sync");
            return syncValue?.split(":")[1] || "queue first";
        }

        __getRequestQueue(elt) {
            let syncValue = this.__attributeValue(elt, "hx-sync");
            let syncElt = elt
            if (syncValue != null && syncValue !== 'this') {
                let selector = syncValue.split(":")[0];
                syncElt = this.__findExt(selector);
            }
            return syncElt.__htmxRequestQueue ||= new RequestQueue()
        }

        __isModifierKeyClick(evt) {
            return evt.type === 'click' && (evt.ctrlKey || evt.metaKey || evt.shiftKey)
        }

        __shouldCancel(evt) {
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

        __initializeTriggers(elt) {
            let specString = this.__attributeValue(elt, "hx-trigger");
            if (!specString) {
                specString = elt.matches("form") ? "submit" :
                    elt.matches("input:not([type=button]),select,textarea") ? "change" :
                        "click";
            }
            elt.__htmx.triggerSpecs = this.__parseTriggerSpecs(specString)
            elt.__htmx.listeners = []
            for (let spec of elt.__htmx.triggerSpecs) {
                spec.handler = elt.__htmx.eventHandler
                spec.listeners = []
                spec.values = {}

                let [eventName, filter] = this.__extractFilter(spec.name);

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
                    const observerOptions = {}
                    if (spec.opts['root']) {
                        observerOptions.root = this.__findExt(elt, spec.opts['root'])
                    }
                    if (spec.threshold) {
                        observerOptions.threshold = parseFloat(spec.threshold)
                    }
                    let observer = new IntersectionObserver((entries) => {
                        for (let i = 0; i < entries.length; i++) {
                            const entry = entries[i]
                            if (entry.isIntersecting) {
                                setTimeout(()=> {
                                    this.trigger(elt, 'intersect')
                                }, 20)
                                break
                            }
                        }
                    }, observerOptions)
                    observer.observe(elt)
                    if (eventName === "revealed") {
                        eventName = 'intersect'; // revealed is handled by intersection observers as well
                        spec.once = true;
                    }
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
                            this.__trigger(elt, 'every', {}, false);
                        } else {
                            clearInterval(spec.interval)
                        }
                    }, this.parseInterval(interval));
                }

                if (filter) {
                    let original = spec.handler
                    spec.handler = (evt) => {
                        if (this.__executeJavaScript(elt, evt, filter)) {
                            original(evt)
                        }
                    }
                }

                let fromElts = [elt];
                if (spec.from) {
                    fromElts = this.__findAllExt(spec.from)
                }

                if (spec.consume) {
                    let original = spec.handler
                    spec.handler = (evt) => {
                        evt.stopPropagation()
                        original(evt)
                    }
                }

                if (spec.changed) {
                    let original = spec.handler
                    spec.handler = (evt) => {
                        let trigger = false
                        for (let fromElt of fromElts) {
                            if (spec.values[fromElt] !== fromElt.value) {
                                trigger = true
                                spec.values[fromElt] = fromElt.value
                            }
                        }
                        if (trigger) {
                            original(evt)
                        }
                    }
                }

                for (let fromElt of fromElts) {
                    let listenerInfo = {fromElt, eventName, handler: spec.handler};
                    elt.__htmx.listeners.push(listenerInfo)
                    spec.listeners.push(listenerInfo)
                    fromElt.addEventListener(eventName, spec.handler);
                }
            }
        }

        __initializePreload(elt) {
            let preloadSpec = this.__attributeValue(elt, "hx-preload");
            if (!preloadSpec) return;

            let specs = this.__parseTriggerSpecs(preloadSpec);
            if (specs.length === 0) return;

            let spec = specs[0];
            let eventName = spec.name;
            let timeout = spec.timeout ? this.parseInterval(spec.timeout) : 5000;

            let preloadListener = async (evt) => {
                // Only preload GET requests
                let {method} = this.__determineMethodAndAction(elt, evt);
                if (method !== 'GET') return;

                // Skip if already preloading
                if (elt.__htmx.preload) return;

                // Create config and build full action URL with params
                let ctx = this.__createRequestConfig(elt, evt);
                let form = elt.form || elt.closest("form");
                let body = this.__collectFormData(elt, form, evt.submitter);
                this.__handleHxVals(elt, body);

                let action = ctx.action.replace?.(/#.*$/, '');
                let params = new URLSearchParams(body);
                if (params.size) action += (/\?/.test(action) ? "&" : "?") + params;

                // Store preload info
                elt.__htmx.preload = {
                    prefetch: fetch(action, ctx.options),
                    action: action,
                    expiresAt: Date.now() + timeout
                };

                try {
                    await elt.__htmx.preload.prefetch;
                } catch (error) {
                    // Clear on error so actual trigger will retry
                    delete elt.__htmx.preload;
                }
            };
            elt.addEventListener(eventName, preloadListener);
            elt.__htmx.preloadListener = preloadListener;
            elt.__htmx.preloadEvent = eventName;
        }

        __extractFilter(str) {
            let match = str.match(/^([^\[]*)\[([^\]]*)]/);
            if (!match) return [str, null];
            return [match[1], match[2]];
        }

        __executeJavaScript(thisArg, obj, code, expression = true) {
            let keys = Object.keys(obj);
            let values = Object.values(obj);
            let func = new Function(...keys, expression ? `return (${code})` : code);
            return func.call(thisArg, ...values);
        }

        process(elt) {
            if (this.__ignore(elt)) return
            if (elt.matches(this.__actionSelector)) {
                this.__initializeElement(elt)
            }
            for (let child of elt.querySelectorAll(this.__actionSelector)) {
                this.__initializeElement(child);
            }
            if (elt.matches(this.__boostSelector)) {
                this.__maybeBoost(elt)
            }
            for (let child of elt.querySelectorAll(this.__boostSelector)) {
                this.__maybeBoost(child);
            }
            this.__handleHxOnAttributes(elt);
            let iter = this.__hxOnQuery.evaluate(elt)
            let node = null
            while (node = iter.iterateNext()) this.__handleHxOnAttributes(node)

        }

        __maybeBoost(elt) {
            if (this.__attributeValue(elt, "hx-boost") === "true") {
                if (this.__shouldInitialize(elt)) {
                    elt.__htmx = {eventHandler: this.__createHtmxEventHandler(elt), requests: [], boosted: true}
                    elt.setAttribute('data-htmx-powered', 'true');
                    if (elt.matches('a') && !elt.hasAttribute("target")) {
                        elt.addEventListener('click', (click) => {
                            elt.__htmx.eventHandler(click)
                        })
                    } else {
                        elt.addEventListener('submit', (submit) => {
                            elt.__htmx.eventHandler(submit)
                        })
                    }
                }
            }
        }

        __shouldInitialize(elt) {
            return !elt.__htmx && !this.__ignore(elt);
        }

        __cleanup(elt) {
            if (elt.__htmx) {
                this.__trigger(elt, "htmx:before:cleanup")
                if (elt.__htmx.interval) clearInterval(elt.__htmx.interval);
                for (let spec of elt.__htmx.triggerSpecs || []) {
                    if (spec.interval) clearInterval(spec.interval);
                    if (spec.timeout) clearTimeout(spec.timeout);
                }
                for (let listenerInfo of elt.__htmx.listeners || []) {
                    listenerInfo.fromElt.removeEventListener(listenerInfo.eventName, listenerInfo.handler);
                }
                if (elt.__htmx.preloadListener) {
                    elt.removeEventListener(elt.__htmx.preloadEvent, elt.__htmx.preloadListener);
                }
                this.__trigger(elt, "htmx:after:cleanup")
            }
            for (let child of elt.querySelectorAll('[data-htmx-powered]')) {
                this.__cleanup(child);
            }
        }

        __handlePreservedElements(fragment) {
            let preserved = fragment.querySelectorAll?.('[hx-preserve]') || [];
            preserved.forEach(newElt => {
                let id = newElt.getAttribute('id');
                if (!id) return;
                let existingElement = document.getElementById(id);
                if (existingElement) {
                    let pantry = document.getElementById('htmx-preserve-pantry');
                    if (!pantry) {
                        pantry = document.createElement('div');
                        pantry.id = 'htmx-preserve-pantry';
                        pantry.style.display = 'none';
                        document.body.appendChild(pantry);
                    }
                    if (pantry.moveBefore) {
                        pantry.moveBefore(existingElement, null);
                    } else {
                        pantry.appendChild(existingElement);
                    }
                }
            });
        }

        __restorePreserved() {
            let pantry = document.getElementById('htmx-preserve-pantry');
            if (!pantry) return;
            for (let preservedElt of [...pantry.children]) {
                let existingElement = document.getElementById(preservedElt.id);
                if (existingElement) {
                    existingElement.replaceWith(preservedElt);
                }
            }
            pantry.remove();
        }

        __parseHTML(resp) {
            return Document.parseHTMLUnsafe?.(resp) || new DOMParser().parseFromString(resp, 'text/html');
        }

        __insertNodes(parent, before, fragment) {
            if (before) {
                before.before(...fragment.childNodes);
            } else {
                parent.append(...fragment.childNodes);
            }
        }

        extractResponseContent(response, ctx = { swapCfg: {} }) {
            response = response.replace(/<partial\b/gi, '<template partial').replace(/<\/partial>/gi, '</template>');
            let responseWithNoHead = response.replace(/<head(\s[^>]*)?>[\s\S]*?<\/head>/i, '');
            let startTag = responseWithNoHead.match(/<([a-z][^\/>\x20\t\r\n\f]*)/i)?.[1]?.toLowerCase();

            let doc, fragment;
            if (startTag === 'html') {
                doc = this.__parseHTML(response);
                fragment = doc.body;
            } else if (startTag === 'body') {
                doc = this.__parseHTML(responseWithNoHead);
                fragment = doc.body;
            } else {
                doc = this.__parseHTML(`<body>${responseWithNoHead}</body>`);
                fragment = doc.body;
            }

            ctx.partialConfigs = [];

            // Extract OOB elements as partials
            let oobElements = Array.from(fragment.querySelectorAll('[hx-swap-oob], [data-hx-swap-oob]'));
            oobElements.forEach(elt => {
                let oobValue = elt.getAttribute('hx-swap-oob') || elt.getAttribute('data-hx-swap-oob');
                let target = '#' + elt.id;
                let swapSpec;

                if (oobValue === 'true') {
                    swapSpec = {style: 'outerHTML'};
                } else if (oobValue.includes(' ')) {
                    swapSpec = this.__parseSwapModifiers(oobValue);
                    if (swapSpec.target) {
                        target = swapSpec.target;
                    }
                } else {
                    let colonIdx = oobValue.indexOf(':');
                    if (colonIdx !== -1) {
                        let swapStyle = oobValue.substring(0, colonIdx);
                        target = oobValue.substring(colonIdx + 1);
                        swapSpec = this.__parseSwapModifiers(swapStyle);
                    } else {
                        swapSpec = this.__parseSwapModifiers(oobValue);
                    }
                }

                elt.removeAttribute('hx-swap-oob');
                elt.removeAttribute('data-hx-swap-oob');

                const oobElementClone = elt.cloneNode(true);
                let frag;
                if (swapSpec.strip === undefined && swapSpec.style !== 'outerHTML') {
                    swapSpec.strip = true;
                }
                if (swapSpec.strip) {
                    frag = oobElementClone.content || oobElementClone;
                } else {
                    frag = document.createDocumentFragment();
                    frag.appendChild(oobElementClone);
                }

                ctx.partialConfigs.push({
                    fragment: frag,
                    target,
                    swapSpec,
                    type: 'oob'
                });
                elt.remove();
            });

            // Extract template partials
            fragment.querySelectorAll('template[partial]').forEach(elt => {
                let swapSpec = this.__parseSwapModifiers(elt.getAttribute('hx-swap') || 'outerHTML');
                ctx.partialConfigs.push({
                    fragment: elt.content.cloneNode(true),
                    target: elt.getAttribute('hx-target'),
                    swapSpec,
                    type: 'partial'
                });
                elt.remove();
            });

            ctx.swapCfg.swapSpec = this.__parseSwapModifiers(ctx?.swapCfg?.swap || 'innerHTML');
            ctx.swapCfg.title = doc.title;

            let resultFragment = document.createDocumentFragment();
            if (ctx?.select) {
                let selected = fragment.querySelector(ctx.select);
                if (selected) {
                    if (ctx.swapCfg.swapSpec.strip === false) {
                        resultFragment.append(selected);
                    } else {
                        resultFragment.append(...selected.childNodes);
                    }
                }
            } else if (ctx.swapCfg.swapSpec.strip && fragment.firstElementChild) {
                resultFragment.append(...fragment.firstElementChild.childNodes);
            } else {
                resultFragment.append(...fragment.childNodes);
            }
            ctx.swapCfg.fragment = resultFragment;
            ctx.swapCfg.type = 'main';
            return ctx;
        }

        // TODO can we reuse __parseTriggerSpecs here?
        __parseSwapModifiers(swapStr) {
            let tokens = this.__tokenize(swapStr);
            let config = {style: tokens[1] === ':' ? 'outerHTML' : (tokens[0] || 'outerHTML')};
            let startIdx = tokens[1] === ':' ? 0 : 1;

            for (let i = startIdx; i < tokens.length; i++) {
                if (tokens[i + 1] === ':') {
                    let key = tokens[i], value = tokens[i = i + 2];
                    if (key === 'swap') config.swapDelay = this.parseInterval(value);
                    else if (key === 'settle') config.settleDelay = this.parseInterval(value);
                    else if (key === 'transition' || key === 'ignoreTitle' || key === 'strip') config[key] = value === 'true';
                    else if (key === 'focus-scroll') config.focusScroll = value === 'true';
                    else if (key === 'scroll' || key === 'show') {
                        let parts = [value];
                        while (tokens[i + 1] === ':') {
                            parts.push(tokens[i + 2]);
                            i += 2;
                        }
                        config[key] = parts.length === 1 ? parts[0] : parts.pop();
                        if (parts.length > 1) config[key + 'Target'] = parts.join(':');
                    } else if (key === 'target') {
                        let parts = [value];
                        while (i + 1 < tokens.length && tokens[i + 1] !== ':' && tokens[i + 2] !== ':') {
                            parts.push(tokens[i + 1]);
                            i++;
                        }
                        config[key] = parts.join(' ');
                    }
                }
            }
            return config;
        }

        __insertOptimisticContent(ctx) {
            if (!ctx.optimistic) return;

            let sourceElt = document.querySelector(ctx.optimistic);
            if (!sourceElt) return;

            let target = ctx.swapCfg.target;
            if (!target) return;

            if (typeof target === 'string') {
                target = this.find(target);
            }

            // Create optimistic div with reset styling
            let optimisticDiv = document.createElement('div');
            optimisticDiv.style.cssText = 'all: initial; display: block;';
            optimisticDiv.setAttribute('data-hx-optimistic', 'true');
            optimisticDiv.innerHTML = sourceElt.innerHTML;

            let swapStyle = ctx.swapCfg.swap;

            if (swapStyle === 'innerHTML') {
                // Hide children of target
                Array.from(target.children).forEach(child => {
                    child.style.display = 'none';
                    child.setAttribute('data-hx-oh', 'true');
                });
                target.appendChild(optimisticDiv);
                ctx.optimisticDiv = optimisticDiv;
            } else if (['beforebegin', 'afterbegin', 'beforeend', 'afterend'].includes(swapStyle)) {
                target.insertAdjacentElement(swapStyle, optimisticDiv);
                ctx.optimisticDiv = optimisticDiv;
            } else {
                // Assume outerHTML-like behavior, Hide target and insert div after it
                target.style.display = 'none';
                target.setAttribute('data-hx-oh', 'true');
                target.insertAdjacentElement('afterend', optimisticDiv);
                ctx.optimisticDiv = optimisticDiv;
            }
        }

        __removeOptimisticContent(ctx) {
            if (!ctx.optimisticDiv) return;

            // Remove optimistic div
            ctx.optimisticDiv.remove();

            // Unhide any hidden elements
            document.querySelectorAll('[data-hx-oh]').forEach(elt => {
                elt.style.display = '';
                elt.removeAttribute('data-hx-oh');
            });
        }

        __handleScroll(target, scroll) {
            if (scroll === 'top') target.scrollTop = 0;
            else if (scroll === 'bottom') target.scrollTop = target.scrollHeight;
        }

        // TODO - did we punt on other folks inserting scripts?
       __processScripts(container) {
            container.querySelectorAll('script').forEach(oldScript => {
                let newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value);
                });
                newScript.textContent = oldScript.textContent;
                oldScript.replaceWith(newScript);
            });
        }

        //============================================================================================
        // Public JS API
        //============================================================================================

        async swap(swapConfig) {
            if (typeof swapConfig.target === 'string') {
                swapConfig.target = this.find(swapConfig.target);
            }
            if (!swapConfig.target) return; // TODO target error?
            swapConfig.modifiers = swapConfig.swapSpec || this.__parseSwapModifiers(swapConfig.swap);
            if (swapConfig.modifiers.swapDelay) {
                await this.timeout(swapConfig.modifiers.swapDelay);
            }
            let swapTask = () => {
                this.__insertContent(swapConfig);
            }
            let eventTarget = this.__resolveSwapEventTarget(swapConfig);
            if (!this.__trigger(eventTarget, "htmx:before:" + swapConfig.type + ":swap", {ctx: swapConfig})) return;
            if (swapConfig.transition && document["startViewTransition"]) {
                await document.startViewTransition(swapTask).finished;
            } else {
                swapTask();
            }
            eventTarget = this.__resolveSwapEventTarget(swapConfig);
            this.__trigger(eventTarget, "htmx:after:" + swapConfig.type + ":swap", {ctx: swapConfig})
        }

        __insertContent(swapConfig) {
            let modifiers = swapConfig.modifiers;
            this.__handlePreservedElements(swapConfig.fragment);
            const target = swapConfig.target, parentNode = target.parentNode;
            if (modifiers.style === 'innerHTML') {
                target.replaceChildren(...swapConfig.fragment.childNodes);
            } else if (modifiers.style === 'outerHTML') {
                if (parentNode) {
                    this.__insertNodes(parentNode, target, swapConfig.fragment);
                    parentNode.removeChild(target);
                }
            } else if (modifiers.style === 'beforebegin') {
                if (parentNode) {
                    this.__insertNodes(parentNode, target, swapConfig.fragment);
                }
            } else if (modifiers.style === 'afterbegin') {
                this.__insertNodes(target, target.firstChild, swapConfig.fragment);
            } else if (modifiers.style === 'beforeend') {
                this.__insertNodes(target, null, swapConfig.fragment);
            } else if (modifiers.style === 'afterend') {
                if (parentNode) {
                    this.__insertNodes(parentNode, target.nextSibling, swapConfig.fragment);
                }
            } else if (modifiers.style === 'delete') {
                if (parentNode) {
                    parentNode.removeChild(target);
                }
                return;
            } else if (modifiers.style === 'none') {
                return;
            } else {
                throw new Error(`Unknown swap style: ${modifiers.style}`);
            }
            this.__restorePreserved();
            if (modifiers.scroll) this.__handleScroll(target, modifiers.scroll);
        }

        __resolveSwapEventTarget(swapConfig) {
            if (swapConfig.elt && document.contains(swapConfig.elt)) {
                return swapConfig.elt;
            } else if (swapConfig.target && document.contains(swapConfig.target)) {
                return swapConfig.target;
            } else {
                return document;
            }
        }

        async __swapResponse(ctx) {
            this.extractResponseContent(ctx.text, ctx);
            // TODO - why this line?
            if (ctx.partialConfigs.length > 0) ctx.swapCfg.transition = false;
            let allConfigs = [ctx.swapCfg].concat(ctx.partialConfigs)
            let eventTarget = this.__resolveSwapEventTarget(ctx.swapCfg);
            if(!this.__trigger(eventTarget, "htmx:before:swap", {ctx})) return;
            for (let currentConfig of allConfigs) {
                await this.swap(currentConfig);
            }
            eventTarget = this.__resolveSwapEventTarget(ctx.swapCfg)
            this.__trigger(eventTarget, "htmx:after:swap", {ctx})
        }

        __trigger(on, eventName, detail = {}, bubbles = true) {
            if (this.config.logAll) {
                console.log(eventName, detail, on)
            }
            return this.trigger(on, eventName, detail, bubbles)
        }

        timeout(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        forEvent(event, timeout, on = document) {
            return new Promise((resolve, reject) => {
                let timeoutId = timeout && setTimeout(() => {
                    on.removeEventListener(event, handler);
                    reject(new Error(`Timeout waiting for ${event}`));
                }, timeout);
                let handler = (event) => {
                    clearTimeout(timeoutId);
                    on.removeEventListener(event, handler);
                    resolve(event);
                };
                on.addEventListener(event, handler);
            })
        }

        find(selector, on = document) {
            return on.querySelector(selector)
        }

        findAll(selector, on = document) {
            return on.querySelectorAll(selector)
        }

        parseInterval(str) {
            let m = {ms: 1, s: 1000, m: 60000};
            let [, n, u] = str?.match(/^([\d.]+)(ms|s|m)?$/) || [];
            let v = parseFloat(n) * (m[u] || 1);
            return isNaN(v) ? undefined : v;
        }

        trigger(on, eventName, detail = {}, bubbles = true) {
            return on.dispatchEvent(new CustomEvent(eventName, {
                detail, cancelable: true, bubbles, composed: true
            }))
        }

        async waitATick() {
            return this.timeout(1)
        }

        //============================================================================================
        // History Support
        //============================================================================================

        __initHistoryHandling() {
            if (!this.config.historyEnabled) return;
            // Handle browser back/forward navigation
            window.addEventListener('popstate', (event) => {
                if (event.state && event.state.htmx) {
                    this.__restoreHistory();
                }
            });
        }

        __pushUrlIntoHistory(path) {
            if (!this.config.historyEnabled) return;
            history.pushState({htmx: true}, '', path);
            this.__trigger(document.body, "htmx:after:push:into:history", {path});
        }

        __replaceUrlInHistory(path) {
            if (!this.config.historyEnabled) return;
            history.replaceState({htmx: true}, '', path);
            this.__trigger(document.body, "htmx:after:replace:into:history", {path});
        }

        __restoreHistory(path) {
            path = path || location.pathname + location.search;
            if (this.__trigger(document.body, "htmx:before:restore:history", {path, cacheMiss: true})) {
                location.reload();
            }
        }

        __handleHistoryUpdate(ctx) {
            let elt = ctx.elt
            let push = ctx.response.headers?.get?.('HX-Push') || ctx.response.headers?.get?.('HX-Push-Url');
            let replace = ctx.response.headers?.get?.('HX-Replace-Url');
            let headerPath = push || replace;

            if (!headerPath) {
                push = this.__attributeValue(elt, "hx-push-url");
                replace = this.__attributeValue(elt, "hx-replace-url");
                if (!push && !replace && this.__isBoosted(elt)) {
                    push = 'true';
                }
            }

            let path = headerPath || push || replace;
            if (!path || path === 'false') return;

            if (path === 'true') {
                path = ctx.originalAction;
            }

            let type = push ? 'push' : 'replace';

            let historyDetail = {
                history: {type, path},
                elt,
                response: ctx.response
            };
            if(!this.__trigger(document.body, "htmx:before:history:update", historyDetail)) return;
            if (type === 'push') {
                this.__pushUrlIntoHistory(path);
            } else {
                this.__replaceUrlInHistory(path);
            }
            this.__trigger(document.body, "htmx:after:history:update", historyDetail);
        }

        __handleHxOnAttributes(node) {
            for (let attr of node.getAttributeNames()) {
                if (attr.startsWith("hx-on:")) {
                    let evtName = attr.substring(6)
                    let code = node.getAttribute(attr);
                    node.addEventListener(evtName, (evt) => {
                        this.__executeJavaScript(node, {"event": evt}, code, false)
                    });
                }
            }
        }

        __showIndicators(indicatorsSelector) {
            if (indicatorsSelector) {
                let indicators = this.__findAllExt(indicatorsSelector);
                for (const indicator of indicators) {
                    indicator.__htmxIndicatorRequests ||= 0
                    indicator.__htmxIndicatorRequests++
                    indicator.classList.add("htmx-request")
                }
            }
        }

        __hideIndicators(indicatorsSelector) {
            if (indicatorsSelector) {
                let indicators = this.__findAllExt(indicatorsSelector);
                for (const indicator of indicators) {
                    indicator.__htmxIndicatorRequests ||= 1
                    indicator.__htmxIndicatorRequests--
                    if (indicator.__htmxIndicatorRequests === 0) {
                        indicator.classList.remove("htmx-request");
                    }
                }
            }
        }

        __disableElts(disabledSelector) {
            if (disabledSelector) {
                let indicators = this.__findAllExt(disabledSelector);
                for (const indicator of indicators) {
                    indicator.__htmxDisabledRequests ||= 0
                    indicator.__htmxDisabledRequests++
                    indicator.disabled = true
                }
            }
        }

        __enableElts(disabledSelector) {
            if (disabledSelector) {
                let indicators = this.__findAllExt(disabledSelector);
                for (const indicator of indicators) {
                    indicator.__htmxDisabledRequests ||= 1
                    indicator.__htmxDisabledRequests--
                    if (indicator.__htmxDisabledRequests === 0) {
                        indicator.disabled = false
                    }
                }
            }
        }

        __collectFormData(elt, form, submitter) {
            let formData = new FormData()
            let included = new Set()
            if (form){
                this.__addInputValues(form, included, formData)
            } else if(elt.name) {
                formData.append(elt.name, elt.value)
                included.add(elt);
            }
            if (submitter && submitter.name) {
                formData.append(submitter.name, submitter.value)
                included.add(submitter);
            }
            let includeSelector = this.__attributeValue(elt, "hx-include");
            if (includeSelector) {
                let includeNodes = this.__findAllExt(includeSelector);
                for (let node of includeNodes) {
                    this.__addInputValues(node, included, formData);
                }
            }
            return formData
        }

        __addInputValues(elt, included, formData) {
            // Get all form elements under this element
            let inputs = elt.querySelectorAll('input:not([disabled]), select:not([disabled]), textarea:not([disabled])');

            for (let input of inputs) {
                // Skip elements without a name or already seen
                if (!input.name || included.has(input)) continue;
                included.add(input);

                if (input.matches('input[type=checkbox], input[type=radio]')) {
                    // Only add if checked
                    if (input.checked) {
                        formData.append(input.name, input.value);
                    }
                } else if (input.matches('input[type=file]')) {
                    // Add all selected files
                    for (let file of input.files) {
                        formData.append(input.name, file);
                    }
                } else if (input.matches('select[multiple]')) {
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

        __handleHxVals(elt, body) {
            let hxValsValue = this.__attributeValue(elt, "hx-vals");
            if (hxValsValue) {
                if (!hxValsValue.includes('{')) {
                    hxValsValue = `{${hxValsValue}}`
                }
                let obj = JSON.parse(hxValsValue);
                for (let key in obj) {
                    body.append(key, obj[key])
                }
            }
        }

        __stringHyperscriptStyleSelector(selector) {
            const s = selector.trim();
            return s.startsWith('<') && s.endsWith('/>') ? s.slice(1, -2) : s;
        }

        __findAllExt(eltOrSelector, maybeSelector, global) {
            let [elt, selector] = this.__normalizeElementAndSelector(eltOrSelector, maybeSelector)
            if (selector.startsWith('global ')) {
                return this.__findAllExt(elt, selector.slice(7), true);
            }
            const parts = this.__tokenizeExtendedSelector(selector);
            const result = []
            const unprocessedParts = []
            for (const part of parts) {
                const selector = this.__stringHyperscriptStyleSelector(part)
                let item
                if (selector.startsWith('closest ')) {
                    item = elt.closest(selector.slice(8))
                } else if (selector.startsWith('find ')) {
                    item = this.find(elt, selector.slice(5))
                } else if (selector === 'next' || selector === 'nextElementSibling') {
                    item = elt.nextElementSibling
                } else if (selector.startsWith('next ')) {
                    item = this.__scanForwardQuery(elt, selector.slice(5), !!global)
                } else if (selector === 'previous' || selector === 'previousElementSibling') {
                    item = elt.previousElementSibling
                } else if (selector.startsWith('previous ')) {
                    item = this.__scanBackwardsQuery(elt, selector.slice(9), !!global)
                } else if (selector === 'document') {
                    item = document
                } else if (selector === 'window') {
                    item = window
                } else if (selector === 'body') {
                    item = document.body
                } else if (selector === 'root') {
                    item = this.__getRootNode(elt, !!global)
                } else if (selector === 'host') {
                    item = (elt.getRootNode()).host
                } else {
                    unprocessedParts.push(selector)
                }

                if (item) {
                    result.push(item)
                }
            }

            if (unprocessedParts.length > 0) {
                const standardSelector = unprocessedParts.join(',')
                const rootNode = this.__getRootNode(elt, !!global)
                result.push(...rootNode.querySelectorAll(standardSelector))
            }

            return result
        }

        __normalizeElementAndSelector(eltOrSelector, selector) {
            return typeof eltOrSelector === "string" ? [document, eltOrSelector] : [eltOrSelector, selector];
        }

        __tokenizeExtendedSelector(selector) {
            const parts = []
            let angleBracketDepth = 0
            let offset = 0
            for (let i = 0; i < selector.length; i++) {
                const char = selector[i]
                if (char === ',' && angleBracketDepth === 0) {
                    parts.push(selector.substring(offset, i))
                    offset = i + 1
                    continue
                }
                if (char === '<') {
                    angleBracketDepth++
                } else if (char === '/' && selector[i + 1] === '>') {
                    angleBracketDepth--
                }
            }
            if (offset < selector.length) {
                parts.push(selector.substring(offset))
            }
            return parts;
        }

        __scanForwardQuery(start, match, global) {
            return this.__scanUntilComparison(this.__getRootNode(start, global).querySelectorAll(match), start, Node.DOCUMENT_POSITION_PRECEDING);
        }

        __scanBackwardsQuery(start, match, global) {
            const results = [...this.__getRootNode(start, global).querySelectorAll(match)].reverse()
            return this.__scanUntilComparison(results, start, Node.DOCUMENT_POSITION_FOLLOWING);
        }

        __scanUntilComparison(results, start, comparison) {
            for (const elt of results) {
                if (elt.compareDocumentPosition(start) === comparison) {
                    return elt
                }
            }
        }

        __getRootNode(elt, global) {
            if (elt.isConnected && elt.getRootNode) {
                return elt.getRootNode?.({ composed: global })
            } else {
                return document
            }
        }

        __findExt(eltOrSelector, selector) {
            return this.__findAllExt(eltOrSelector, selector)[0]
        }

        __extractJavascriptContent(string) {
            if(string != null){
                if(string.startsWith("js:")) {
                    return string.substring(3);
                } else if (string.startsWith("javascript:")) {
                    return string.substring(11);
                }
            }
        }
    }

    return new Htmx()
})()