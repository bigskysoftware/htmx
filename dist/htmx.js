// noinspection ES6ConvertVarToLetConst
var htmx = (() => {

    class ReqQ {
        #c = null
        #q = []

        issue(ctx, queueStrategy) {
            if (!this.#c) {
                this.#c = ctx
                return true
            } else {
                // Update ctx.status properly for replaced request contexts
                if (queueStrategy === "replace") {
                    this.#q.map(value => value.status = "dropped");
                    this.#q = []
                    if (this.#c) {
                        this.#c.abort();
                    }
                    return true
                } else if (queueStrategy === "queue all") {
                    this.#q.push(ctx)
                    ctx.status = "queued";
                } else if (queueStrategy === "drop") {
                    // ignore the request
                    ctx.status = "dropped";
                } else if (queueStrategy === "queue last") {
                    this.#q.map(value => value.status = "dropped");
                    this.#q = [ctx]
                    ctx.status = "queued";
                } else if (this.#q.length === 0) {
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
            this.#c?.abort?.()
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
                handleHxVals: this.#handleHxVals.bind(this)
            };
            document.addEventListener("DOMContentLoaded", () => {
                this.#initHistoryHandling();
                this.process(document.body)
            })
        }

        #initHtmxConfig() {
            this.config = {
                version: '4.0.0-alpha3',
                logAll: false,
                prefix: "",
                transitions: true,
                history: true,
                historyReload: false,
                mode: 'same-origin',
                defaultSwap: "innerHTML",
                indicatorClass: "htmx-indicator",
                requestClass: "htmx-request",
                includeIndicatorCSS: true,
                defaultTimeout: 60000, /* 60 second default timeout */
                extensions: '',
                sse: {
                    reconnect: false,
                    reconnectDelay: 500,
                    reconnectMaxDelay: 60000,
                    reconnectMaxAttempts: 10,
                    reconnectJitter: 0.3,
                    pauseInBackground: false
                },
                morphIgnore: ["data-htmx-powered"],
                noSwap: [204, 304],
                implicitInheritance: false
            }
            let metaConfig = document.querySelector('meta[name="htmx:config"]');
            if (metaConfig) {
                let content = metaConfig.content;
                let overrides = this.#parseConfig(content);
                // Deep merge nested config objects
                for (let key in overrides) {
                    let val = overrides[key];
                    if (val && typeof val === 'object' && !Array.isArray(val) && this.config[key]) {
                        Object.assign(this.config[key], val);
                    } else {
                        this.config[key] = val;
                    }
                }
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
            let results = [...elt.querySelectorAll(selector)];
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

        #attributeValue(elt, name, defaultVal, returnElt) {
            name = this.#prefix(name);
            let appendName = name + this.#maybeAdjustMetaCharacter(":append");
            let inheritName = name + (this.config.implicitInheritance ? "" : this.#maybeAdjustMetaCharacter(":inherited"));
            let inheritAppendName = name + this.#maybeAdjustMetaCharacter(":inherited:append");

            if (elt.hasAttribute(name)) {
                return returnElt ? elt : elt.getAttribute(name);
            }

            if (elt.hasAttribute(inheritName)) {
                return returnElt ? elt : elt.getAttribute(inheritName);
            }

            if (elt.hasAttribute(appendName) || elt.hasAttribute(inheritAppendName)) {
                let appendValue = elt.getAttribute(appendName) || elt.getAttribute(inheritAppendName);
                let parent = elt.parentNode?.closest?.(`[${CSS.escape(inheritName)}],[${CSS.escape(inheritAppendName)}]`);
                if (parent) {
                    let inherited = this.#attributeValue(parent, name, undefined, returnElt);
                    return returnElt ? inherited : (inherited ? inherited + "," + appendValue : appendValue);
                } else {
                    return returnElt ? elt : appendValue;
                }
            }

            let parent = elt.parentNode?.closest?.(`[${CSS.escape(inheritName)}],[${CSS.escape(inheritAppendName)}]`);
            if (parent) {
                let val = this.#attributeValue(parent, name, undefined, returnElt);
                if (!returnElt && val && this.config.implicitInheritance) {
                    this.#triggerExtensions(elt, "htmx:after:implicitInheritance", {elt, parent})
                }
                return val;
            }
            return returnElt ? elt : defaultVal;
        }

        #parseConfig(configString) {
            if (configString[0] === '{') return JSON.parse(configString);
            let configPattern = /([^\s,]+?)(?:\s*:\s*(?:"([^"]*)"|'([^']*)'|<([^>]+)\/>|([^\s,]+)))?(?=\s|,|$)/g;
            return [...configString.matchAll(configPattern)].reduce((result, match) => {
                let keyPath = match[1].split('.');
                let value = (match[2] ?? match[3] ?? match[4] ?? match[5] ?? 'true').trim();
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else if (/^\d+$/.test(value)) value = parseInt(value);
                keyPath.slice(0, -1).reduce((obj, key) => obj[key] ??= {}, result)[keyPath.at(-1)] = value;
                return result;
            }, {});
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
                        if (verbAction) {
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
                return {action, method}
            }
        }

        #initializeElement(elt) {
            if (this.#shouldInitialize(elt) && this.#trigger(elt, "htmx:before:init", {}, true)) {
                elt._htmx = {eventHandler: this.#createHtmxEventHandler(elt)}
                elt.setAttribute('data-htmx-powered', 'true');
                this.#initializeTriggers(elt);
                this.#initializeAbortListener(elt)
                this.#trigger(elt, "htmx:after:init", {}, true)
                this.#trigger(elt, "load", {}, false)
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
                target: this.#resolveTarget(sourceElement, this.#attributeValue(sourceElement, "hx-target")),
                swap: this.#attributeValue(sourceElement, "hx-swap", this.config.defaultSwap),
                push: this.#attributeValue(sourceElement, "hx-push-url"),
                replace: this.#attributeValue(sourceElement, "hx-replace-url"),
                transition: this.config.transitions,
                confirm: this.#attributeValue(sourceElement, "hx-confirm"),
                request: {
                    validate: "true" === this.#attributeValue(sourceElement, "hx-validate", sourceElement.matches('form') ? "true" : "false"),
                    action: fullAction,
                    anchor,
                    method,
                    headers: this.#determineHeaders(sourceElement),
                    abort: ac.abort.bind(ac),
                    credentials: "same-origin",
                    signal: ac.signal,
                    mode: this.config.mode
                }
            };

            // Apply hx-config overrides
            let configAttr = this.#attributeValue(sourceElement, "hx-config");
            if (configAttr) {
                let configOverrides = this.#parseConfig(configAttr);
                let req = ctx.request;
                for (let key in configOverrides) {
                    if (key.startsWith('+')) {
                        let actualKey = key.substring(1);
                        if (req[actualKey] && typeof req[actualKey] === 'object') {
                            Object.assign(req[actualKey], configOverrides[key]);
                        } else {
                            req[actualKey] = configOverrides[key];
                        }
                    } else {
                        req[key] = configOverrides[key];
                    }
                }
                if (req.etag) {
                    (sourceElement._htmx ||= {}).etag ||= req.etag
                }
            }
            if (sourceElement._htmx?.etag) {
                ctx.request.headers["If-none-match"] = sourceElement._htmx.etag
            }
            return ctx;
        }

        #determineHeaders(elt) {
            let headers = {
                "HX-Request": "true",
                "HX-Source": elt.id || elt.name,
                "HX-Current-URL": location.href,
                "Accept": "text/html, text/event-stream"
            };
            if (this.#isBoosted(elt)) {
                headers["HX-Boosted"] = "true"
            }
            let headersAttribute = this.#attributeValue(elt, "hx-headers");
            if (headersAttribute) {
                Object.assign(headers, this.#parseConfig(headersAttribute));
            }
            return headers;
        }

        #resolveTarget(elt, selector) {
            if (selector instanceof Element) {
                return selector;
            } else if (selector === 'this') {
                return this.#attributeValue(elt, "hx-target", undefined, true);
            } else if (selector != null) {
                return this.find(elt, selector);
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

            // Build request body
            let form = elt.form || elt.closest("form")
            let body = this.#collectFormData(elt, form, evt.submitter)
            let valsResult = this.#handleHxVals(elt, body)
            if (valsResult) await valsResult  // Only await if it returned a promise
            if (ctx.values) {
                for (let k in ctx.values) {
                    body.delete(k);
                    body.append(k, ctx.values[k]);
                }
            }

            // Setup event-dependent request details
            Object.assign(ctx.request, {
                form,
                submitter: evt.submitter,
                body
            })

            if (!this.#trigger(elt, "htmx:config:request", {ctx: ctx})) return
            if (!this.#verbs.includes(ctx.request.method.toLowerCase())) return
            if (ctx.request.validate && ctx.request.form && !ctx.request.form.reportValidity()) return

            let javascriptContent = this.#extractJavascriptContent(ctx.request.action);
            if (javascriptContent != null) {
                let data = Object.fromEntries(ctx.request.body);
                await this.#executeJavaScriptAsync(ctx.sourceElement, data, javascriptContent, false);
                return
            } else if (/GET|DELETE/.test(ctx.request.method)) {
                let url = new URL(ctx.request.action, document.baseURI);
                
                for (let key of ctx.request.body.keys()) {
                    url.searchParams.delete(key);
                }
                for (let [key, value] of ctx.request.body) {
                    url.searchParams.append(key, value);
                }
                
                ctx.request.action = url.pathname + url.search;
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
            this.#initTimeout(ctx);

            let indicatorsSelector = this.#attributeValue(elt, "hx-indicator");
            let indicators = this.#showIndicators(elt, indicatorsSelector);
            let disableSelector = this.#attributeValue(elt, "hx-disable");
            let disableElements = this.#disableElements(elt, disableSelector);

            try {
                // Handle confirmation
                if (ctx.confirm) {
                    let issueRequest = null;
                    let confirmed = await new Promise(resolve => {
                        issueRequest = resolve;
                        if (this.#trigger(elt, "htmx:confirm", {ctx, issueRequest: (skip) => issueRequest?.(skip !== false)})) {
                            let js = this.#extractJavascriptContent(ctx.confirm);
                            resolve(js ? this.#executeJavaScriptAsync(elt, {}, js, true) : window.confirm(ctx.confirm));
                        }
                    });
                    if (!confirmed) return;
                }
                
                ctx.fetch ||= window.fetch.bind(window)
                if (!this.#trigger(elt, "htmx:before:request", {ctx})) return;

                let response = await ctx.fetch(ctx.request.action, ctx.request);

                ctx.response = {
                    raw: response,
                    status: response.status,
                    headers: response.headers,
                }
                this.#extractHxHeaders(ctx);
                ctx.isSSE = response.headers.get("Content-Type")?.includes('text/event-stream');
                if (!ctx.isSSE) {
                    ctx.text = await response.text();
                }
                if (!this.#trigger(elt, "htmx:after:request", {ctx})) return;

                if(this.#handleHeadersAndMaybeReturnEarly(ctx)){
                    return
                }

                let isSSE = response.headers.get("Content-Type")?.includes('text/event-stream');
                if (isSSE) {
                    // SSE response
                    await this.#handleSSE(ctx, elt, response);
                } else {
                    // HTTP response
                    if (ctx.status === "issuing") {
                        if (ctx.hx.retarget) ctx.target = ctx.hx.retarget;
                        if (ctx.hx.reswap) ctx.swap = ctx.hx.reswap;
                        if (ctx.hx.reselect) ctx.select = ctx.hx.reselect;
                        ctx.status = "response received";
                        this.#handleStatusCodes(ctx);
                        await this.swap(ctx);
                        ctx.status = "swapped";
                    }
                }

            } catch (error) {
                ctx.status = "error: " + error;
                this.#trigger(elt, "htmx:error", {ctx, error})
            } finally {
                this.#hideIndicators(indicators);
                this.#enableElements(disableElements);
                this.#trigger(elt, "htmx:finally:request", {ctx})

                requestQueue.finish()
                if (requestQueue.more()) {
                    // TODO is it OK to not await here?  try/catch?
                    this.#issueRequest(requestQueue.next())
                }
            }
        }

        // Extract HX-* headers into ctx.hx
        #extractHxHeaders(ctx) {
            ctx.hx = {}
            for (let [k, v] of ctx.response.raw.headers) {
                if (k.toLowerCase().startsWith('hx-')) {
                    ctx.hx[k.slice(3).toLowerCase().replace(/-/g, '')] = v
                }
            }
        }

        // returns true if the header aborts the current response handling
        #handleHeadersAndMaybeReturnEarly(ctx) {
            if (ctx.hx.trigger) {
                this.#handleTriggerHeader(ctx.hx.trigger, ctx.sourceElement);
            }
            if (ctx.hx.refresh === 'true') {
                location.reload();
                return true // TODO - necessary?  wouldn't it abort the current js?
            }
            if (ctx.hx.redirect) {
                location.href = ctx.hx.redirect;
                return true // TODO - same, necessary?
            }
            if (ctx.hx.location) {
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
            if(ctx.response?.headers?.get?.("Etag")) {
                ctx.sourceElement._htmx ||= {}
                ctx.sourceElement._htmx.etag = ctx.response.headers.get("Etag");
            }
        }

        async #handleSSE(ctx, elt, response) {
            let config = {...this.config.sse, ...ctx.request.sse}

            let waitForVisible = () => new Promise(r => {
                let onVisible = () => !document.hidden && (document.removeEventListener('visibilitychange', onVisible), r());
                document.addEventListener('visibilitychange', onVisible);
            });

            let lastEventId = null, attempt = 0, currentResponse = response;

            while (elt.isConnected) {
                // Handle reconnection for subsequent iterations
                if (attempt > 0) {
                    if (!config.reconnect || attempt > config.reconnectMaxAttempts) break;

                    if (config.pauseInBackground && document.hidden) {
                        await waitForVisible();
                        if (!elt.isConnected) break;
                    }

                    let delay = Math.min(this.parseInterval(config.reconnectDelay) * Math.pow(2, attempt - 1), this.parseInterval(config.reconnectMaxDelay));
                    if (config.reconnectJitter > 0) {
                        let jitterRange = delay * config.reconnectJitter;
                        let jitter = (Math.random() * 2 - 1) * jitterRange;
                        delay = Math.max(0, delay + jitter);
                    }
                    let reconnect = {attempt, delay, lastEventId, cancelled: false};

                    ctx.status = "reconnecting to stream";
                    if (!this.#trigger(elt, "htmx:before:sse:reconnect", {
                        ctx,
                        reconnect
                    }) || reconnect.cancelled) break;

                    await new Promise(r => setTimeout(r, reconnect.delay));
                    if (!elt.isConnected) break;

                    try {
                        if (lastEventId) (ctx.request.headers = ctx.request.headers || {})['Last-Event-ID'] = lastEventId;
                        currentResponse = await fetch(ctx.request.action, ctx.request);
                    } catch (e) {
                        ctx.status = "stream error";
                        this.#trigger(elt, "htmx:error", {ctx, error: e});
                        attempt++;
                        continue;
                    }
                }

                // Core streaming logic
                if (!this.#trigger(elt, "htmx:before:sse:stream", {ctx})) break;
                ctx.status = "streaming";

                attempt = 0; // Reset on successful connection

                try {
                    for await (const sseMessage of this.#parseSSE(currentResponse)) {
                        if (!elt.isConnected) break;

                        if (config.pauseInBackground && document.hidden) {
                            await waitForVisible();
                            if (!elt.isConnected) break;
                        }

                        let msg = {data: sseMessage.data, event: sseMessage.event, id: sseMessage.id, cancelled: false};
                        if (!this.#trigger(elt, "htmx:before:sse:message", {
                            ctx,
                            message: msg
                        }) || msg.cancelled) continue;

                        if (sseMessage.id) lastEventId = sseMessage.id;

                        // Trigger custom event if `event:` line is present
                        if (sseMessage.event) {
                            this.#trigger(elt, sseMessage.event, {data: sseMessage.data, id: sseMessage.id});
                            // Skip swap for custom events
                            this.#trigger(elt, "htmx:after:sse:message", {ctx, message: msg});
                            continue;
                        }

                        ctx.text = sseMessage.data;
                        ctx.status = "stream message received";

                        if (!ctx.response.cancelled) {
                            await this.swap(ctx);
                            ctx.status = "swapped";
                        }
                        this.#trigger(elt, "htmx:after:sse:message", {ctx, message: msg});
                    }
                } catch (e) {
                    ctx.status = "stream error";
                    this.#trigger(elt, "htmx:error", {ctx, error: e});
                }

                if (!elt.isConnected) break;
                this.#trigger(elt, "htmx:after:sse:stream", {ctx});

                attempt++;
            }
        }

        async* #parseSSE(response) {
            let reader = response.body.getReader();
            let decoder = new TextDecoder();
            let buffer = '';
            let message = {data: '', event: '', id: '', retry: null};

            try {
                while (true) {
                    let {done, value} = await reader.read();
                    if (done) break;

                    // Decode chunk and add to buffer
                    buffer += decoder.decode(value, {stream: true});
                    let lines = buffer.split('\n');
                    // Keep incomplete line in buffer
                    buffer = lines.pop() || '';

                    for (let line of lines) {
                        // Empty line or carriage return indicates end of message
                        if (!line || line === '\r') {
                            if (message.data) {
                                yield message;
                                message = {data: '', event: '', id: '', retry: null};
                            }
                            continue;
                        }

                        // Parse field: value
                        let colonIndex = line.indexOf(':');
                        if (colonIndex <= 0) continue;

                        let field = line.slice(0, colonIndex);
                        let value = line.slice(colonIndex + 1).trimStart();

                        if (field === 'data') {
                            message.data += (message.data ? '\n' : '') + value;
                        } else if (field === 'event') {
                            message.event = value;
                        } else if (field === 'id') {
                            message.id = value;
                        } else if (field === 'retry') {
                            let retryValue = parseInt(value, 10);
                            if (!isNaN(retryValue)) {
                                message.retry = retryValue;
                            }
                        }
                    }
                }
            } finally {
                reader.releaseLock();
            }
        }

        #initTimeout(ctx) {
            let timeoutInterval;
            if (ctx.request.timeout) {
                timeoutInterval = this.parseInterval(ctx.request.timeout);
            } else {
                timeoutInterval = this.config.defaultTimeout;
            }
            ctx.requestTimeout = setTimeout(() => ctx.abort?.(), timeoutInterval);
        }

        #determineSyncStrategy(elt) {
            let syncValue = this.#attributeValue(elt, "hx-sync");
            return syncValue?.split(":")[1] || "queue first";
        }

        #getRequestQueue(elt) {
            let syncValue = this.#attributeValue(elt, "hx-sync");
            let syncElt = elt
            if (syncValue && syncValue.includes(":")) {
                let strings = syncValue.split(":");
                let selector = strings[0];
                syncElt = this.#findExt(selector);
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
                    elt.matches("input:not([type=button]),select,textarea") ? "change" :
                        "click";
            }
            elt._htmx.triggerSpecs = this.#parseTriggerSpecs(specString)
            elt._htmx.listeners = []
            for (let spec of elt._htmx.triggerSpecs) {
                spec.handler = initialHandler
                spec.listeners = []
                spec.values = {}

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
                        observerOptions.root = this.#findExt(elt, spec.opts.root)
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
                    if (detail?.target) elt = this.find(detail.target) || elt;
                    this.trigger(elt, name, typeof detail === 'object' ? detail : {value: detail});
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
            if (!elt || this.#ignore(elt)) return;
            if (!this.#trigger(elt, "htmx:before:process")) return
            for (let child of this.#queryEltAndDescendants(elt, this.#actionSelector)) {
                this.#initializeElement(child);
            }
            for (let child of this.#queryEltAndDescendants(elt, this.#boostSelector)) {
                this.#maybeBoost(child);
            }
            this.#handleHxOnAttributes(elt);
            let iter = this.#hxOnQuery.evaluate(elt)
            let node = null
            while (node = iter.iterateNext()) this.#handleHxOnAttributes(node)
            this.#trigger(elt, "htmx:after:process");
        }

        #maybeBoost(elt) {
            if (this.#attributeValue(elt, "hx-boost") === "true" && this.#shouldBoost(elt)) {
                elt._htmx = {eventHandler: this.#createHtmxEventHandler(elt), requests: [], boosted: true}
                elt.setAttribute('data-htmx-powered', 'true');
                if (elt.matches('a') && !elt.hasAttribute("target")) {
                    elt.addEventListener('click', (click) => {
                        elt._htmx.eventHandler(click)
                    })
                } else {
                    elt.addEventListener('submit', (submit) => {
                        elt._htmx.eventHandler(submit)
                    })
                }
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
            return !elt._htmx && !this.#ignore(elt);
        }

        #cleanup(elt) {
            if (elt._htmx) {
                this.#trigger(elt, "htmx:before:cleanup")
                if (elt._htmx.interval) clearInterval(elt._htmx.interval);
                for (let spec of elt._htmx.triggerSpecs || []) {
                    if (spec.interval) clearInterval(spec.interval);
                    if (spec.timeout) clearTimeout(spec.timeout);
                }
                for (let listenerInfo of elt._htmx.listeners || []) {
                    listenerInfo.fromElt.removeEventListener(listenerInfo.eventName, listenerInfo.handler);
                }
                this.#trigger(elt, "htmx:after:cleanup")
            }
            for (let child of elt.querySelectorAll('[data-htmx-powered]')) {
                this.#cleanup(child);
            }
        }

        #handlePreservedElements(fragment) {
            let pantry = document.createElement('div');
            pantry.style.display = 'none';
            document.body.appendChild(pantry);
            let newPreservedElts = fragment.querySelectorAll?.(`[${this.#prefix('hx-preserve')}]`) || [];
            for (let preservedElt of newPreservedElts) {
                let currentElt = document.getElementById(preservedElt.id);
                if (pantry.moveBefore) {
                    pantry.moveBefore(currentElt, null);
                } else {
                    pantry.appendChild(currentElt);
                }
            }
            return pantry
        }

        #restorePreservedElements(pantry) {
            for (let preservedElt of pantry.children) {
                let newElt = document.getElementById(preservedElt.id);
                if (newElt.parentNode.moveBefore) {
                    newElt.parentNode.moveBefore(preservedElt, newElt);
                } else {
                    newElt.replaceWith(preservedElt);
                }
                this.#cleanup(newElt)
                newElt.remove()
            }
            pantry.remove();
        }

        #parseHTML(resp) {
            return Document.parseHTMLUnsafe?.(resp) || new DOMParser().parseFromString(resp, 'text/html');
        }

        #makeFragment(text) {
            let response = text.replace(/<hx-([a-z]+)(\s+|>)/gi, '<template hx type="$1"$2').replace(/<\/hx-[a-z]+>/gi, '</template>');
            let title = '';
            response = response.replace(/<title[^>]*>[\s\S]*?<\/title>/i, m => (title = this.#parseHTML(m).title, ''));
            let responseWithNoHead = response.replace(/<head(\s[^>]*)?>[\s\S]*?<\/head>/i, '');
            let startTag = responseWithNoHead.match(/<([a-z][^\/>\x20\t\r\n\f]*)/i)?.[1]?.toLowerCase();

            let doc, fragment;
            if (startTag === 'html') {
                doc = this.#parseHTML(response);
                fragment = doc.body;
            } else if (startTag === 'body') {
                doc = this.#parseHTML(responseWithNoHead);
                fragment = doc.body;
            } else {
                doc = this.#parseHTML(`<template>${responseWithNoHead}</template>`);
                fragment = doc.querySelector('template').content;
            }
            this.#processScripts(fragment);

            return {
                fragment,
                title
            };
        }

        #createOOBTask(tasks, elt, oobValue, sourceElement) {
            let target = elt.id ? '#' + CSS.escape(elt.id) : null;
            if (oobValue !== 'true' && oobValue && !oobValue.includes(' ')) {
                [oobValue, target = target] = oobValue.split(/:(.*)/);
            }
            if (oobValue === 'true' || !oobValue) oobValue = 'outerHTML';

            let swapSpec = this.#parseSwapSpec(oobValue);
            target = swapSpec.target || target;
            swapSpec.strip ??= !swapSpec.style.startsWith('outer');
            if (!target) return;
            let fragment = document.createDocumentFragment();
            fragment.append(elt);
            tasks.push({type: 'oob', fragment, target, swapSpec, sourceElement});
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
                    let swapSpec = this.#parseSwapSpec(templateElt.getAttribute(this.#prefix('hx-swap')) || this.config.defaultSwap);

                    tasks.push({
                        type: 'partial',
                        fragment: templateElt.content.cloneNode(true),
                        target: templateElt.getAttribute(this.#prefix('hx-target')),
                        swapSpec,
                        sourceElement: ctx.sourceElement
                    });
                } else {
                    this.#triggerExtensions(templateElt, 'htmx:process:' + type, { ctx, tasks });
                }
                templateElt.remove();
            }

            return tasks;
        }

        #handleAutoFocus(elt) {
            let autofocus = this.find(elt, "[autofocus]");
            autofocus?.focus?.()
        }

        #handleScroll(task) {
            if (task.swapSpec.scroll) {
                let target = task.swapSpec.scrollTarget ? this.#findExt(task.swapSpec.scrollTarget) : task.target;
                if (task.swapSpec.scroll === 'top') {
                    target.scrollTop = 0;
                } else if (task.swapSpec.scroll === 'bottom'){
                    target.scrollTop = target.scrollHeight;
                }
            }
            if (task.swapSpec.show) {
                let target = task.swapSpec.showTarget ? this.#findExt(task.swapSpec.showTarget) : task.target;
                target.scrollIntoView(task.swapSpec.show === 'top')
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

            // Process main swap
            let mainSwap = this.#processMainSwap(ctx, fragment, partialTasks);
            if (mainSwap) {
                tasks.push(mainSwap);
            }

            // TODO - can we remove this and just let the function complete?
            if (tasks.length === 0) return;

            // Separate transition/nonTransition tasks
            let transitionTasks = tasks.filter(t => t.transition);
            let nonTransitionTasks = tasks.filter(t => !t.transition);

            if(!this.#trigger(document, "htmx:before:swap", {ctx, tasks})){
                return
            }

            // insert non-transition tasks immediately or with delay
            for (let task of nonTransitionTasks) {
                if (task.swapSpec?.swap) {
                    setTimeout(() => this.#insertContent(task), this.parseInterval(task.swapSpec.swap));
                } else {
                    this.#insertContent(task)
                }
            }

            // insert transition tasks in the transition queue
            if (transitionTasks.length > 0) {
                let tasksWrapper = ()=> {
                    for (let task of transitionTasks) {
                        this.#insertContent(task)
                    }
                }
                await this.#submitTransitionTask(tasksWrapper);
            }

            this.#trigger(document, "htmx:after:swap", {ctx});
            if (ctx.title && !mainSwap?.swapSpec?.ignoreTitle) document.title = ctx.title;
            await this.timeout(1);
            // invoke restore tasks
            for (let task of tasks) {
                for (let restore of task.restoreTasks || []) {
                    restore()
                }
            }
            this.#trigger(document, "htmx:after:restore", { ctx });
            this.#handleAnchorScroll(ctx);
            // TODO this stuff should be an extension
            // if (ctx.hx?.triggerafterswap) this.#handleTriggerHeader(ctx.hx.triggerafterswap, ctx.sourceElement);
        }

        #processMainSwap(ctx, fragment, partialTasks) {
            // Create main task if needed
            let swapSpec = this.#parseSwapSpec(ctx.swap || this.config.defaultSwap);
            // skip creating main swap if extracting partials resulted in empty response except for delete style
            if (swapSpec.style === 'delete' || /\S/.test(fragment.innerHTML || '') || !partialTasks.length) {
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
                    transition: (ctx.transition !== false) && (swapSpec.transition !== false)
                };
                return mainSwap;
            }
        }

        #insertContent(task) {
            let {target, swapSpec, fragment} = task;
            if (typeof target === 'string') {
                target = document.querySelector(target);
            }
            if (!target) return;
            if (swapSpec.strip && fragment.firstElementChild) {
                task.unstripped = fragment;
                fragment = document.createDocumentFragment();
                fragment.append(...(task.fragment.firstElementChild.content || task.fragment.firstElementChild).childNodes);
            }

            let pantry = this.#handlePreservedElements(fragment);
            let parentNode = target.parentNode;
            let newContent = [...fragment.childNodes]
            if (swapSpec.style === 'innerHTML') {
                this.#captureCSSTransitions(task, target);
                for (const child of target.children) {
                    this.#cleanup(child)
                }
                target.replaceChildren(...fragment.childNodes);
            } else if (swapSpec.style === 'outerHTML') {
                if (parentNode) {
                    this.#captureCSSTransitions(task, parentNode);
                    this.#insertNodes(parentNode, target, fragment);
                    this.#cleanup(target)
                    parentNode.removeChild(target);
                }
            } else if (swapSpec.style === 'innerMorph') {
                this.#morph(target, fragment, true);
            } else if (swapSpec.style === 'outerMorph') {
                this.#morph(target, fragment, false);
            } else if (swapSpec.style === 'beforebegin') {
                if (parentNode) {
                    this.#insertNodes(parentNode, target, fragment);
                }
            } else if (swapSpec.style === 'afterbegin') {
                this.#insertNodes(target, target.firstChild, fragment);
            } else if (swapSpec.style === 'beforeend') {
                this.#insertNodes(target, null, fragment);
            } else if (swapSpec.style === 'afterend') {
                if (parentNode) {
                    this.#insertNodes(parentNode, target.nextSibling, fragment);
                }
            } else if (swapSpec.style === 'delete') {
                if (parentNode) {
                    this.#cleanup(target)
                    parentNode.removeChild(target)
                }
                return;
            } else if (swapSpec.style === 'none') {
                return;
            } else {
                task.target = target;
                task.fragment = fragment;
                if (!this.#triggerExtensions(target, 'htmx:handle:swap', task)) return;
                throw new Error(`Unknown swap style: ${swapSpec.style}`);
            }
            this.#restorePreservedElements(pantry);
            for (const elt of newContent) {
                this.process(elt);
                this.#handleAutoFocus(elt);
            }
            this.#handleScroll(task);
        }

        #trigger(on, eventName, detail = {}, bubbles = true) {
            if (this.config.logAll) {
                console.log(eventName, detail, on)
            }
            on = this.#normalizeElement(on)
            this.#triggerExtensions(on, eventName, detail);
            return this.trigger(on, eventName, detail, bubbles)
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
            this.on("htmx:after:process", (evt) => {
                callback(evt.target)
            })
        }

        takeClass(element, className, container = element.parentElement) {
            for (let elt of this.findAll(this.#normalizeElement(container), "." + className)) {
                elt.classList.remove(className);
            }
            element.classList.add(className);
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
                composed: true,
                originalTarget: on
            });
            let target = on.isConnected ? on : document;
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

            // Resolve target, defaulting to body only if no source or target provided
            let target = this.#resolveTarget(document.body, context.target || sourceElt);
            if (!target) {
                return Promise.reject(new Error('Target not found'));
            }

            sourceElt ||= target;

            let ctx = this.#createRequestContext(sourceElt, context.event || {});
            Object.assign(ctx, context, {target});
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
                history.replaceState({htmx: true}, '', location.pathname + location.search);
            }
            window.addEventListener('popstate', (event) => {
                if (event.state && event.state.htmx) {
                    this.#restoreHistory();
                } 
            });
        }

        #pushUrlIntoHistory(path) {
            if (!this.config.history) return;
            history.pushState({htmx: true}, '', path);
            this.#trigger(document, "htmx:after:push:into:history", {path});
        }

        #replaceUrlInHistory(path) {
            if (!this.config.history) return;
            history.replaceState({htmx: true}, '', path);
            this.#trigger(document, "htmx:after:replace:into:history", {path});
        }

        #restoreHistory(path) {
            path = path || location.pathname + location.search;
            if (this.#trigger(document, "htmx:before:restore:history", {path, cacheMiss: true})) {
                if (this.config.historyReload) {
                    location.reload();
                } else {
                    this.ajax('GET', path, {
                        target: 'body',
                        request: {headers: {'HX-History-Restore-Request': 'true'}}
                    });
                }
            } else if (elt.tagName === "FORM") {
                return elt.method !== 'dialog' &&  this.#isSameOrigin(elt.action);
            }
        }

        #handleHistoryUpdate(ctx) {
            let {sourceElement, push, replace, hx, response} = ctx;
            if (hx?.push || hx?.pushurl || hx?.replaceurl) {
                push = hx.push || hx.pushurl;
                replace = hx.replaceurl;
            }

            if (!push && !replace && this.#isBoosted(sourceElement)) {
                push = 'true';
            }

            let path = push || replace;
            if (!path || path === 'false' || path === false) return;

            if (path === 'true') {
                path = ctx.request.action + (ctx.request.anchor ? '#' + ctx.request.anchor : '');
            }

            let type = push ? 'push' : 'replace';

            let historyDetail = {
                history: {type, path},
                sourceElement,
                response
            };
            if (!this.#trigger(document, "htmx:before:history:update", historyDetail)) return;
            if (type === 'push') {
                this.#pushUrlIntoHistory(path);
            } else {
                this.#replaceUrlInHistory(path);
            }
            this.#trigger(document, "htmx:after:history:update", historyDetail);
        }

        #handleHxOnAttributes(node) {
            for (let attr of node.getAttributeNames()) {
                var searchString = this.#maybeAdjustMetaCharacter(this.#prefix("hx-on:"));
                if (attr.startsWith(searchString)) {
                    let evtName = attr.substring(searchString.length)
                    let code = node.getAttribute(attr);
                    node.addEventListener(evtName, async (evt) => {
                        try {
                            await this.#executeJavaScriptAsync(node, {"event": evt}, code, false)
                        } catch (e) {
                            console.log(e);
                        }
                    });
                }
            }
        }

        #showIndicators(elt, indicatorsSelector) {
            let indicatorElements = []
            if (indicatorsSelector) {
                indicatorElements = [elt, ...this.#queryEltAndDescendants(elt, indicatorsSelector)];
                for (const indicator of indicatorElements) {
                    indicator._htmxReqCount ||= 0
                    indicator._htmxReqCount++
                    indicator.classList.add(this.config.requestClass)
                }
            }
            return indicatorElements
        }

        #hideIndicators(indicatorElements) {
            for (let indicator of indicatorElements) {
                if (indicator._htmxReqCount) {
                    indicator._htmxReqCount--;
                    if (indicator._htmxReqCount <= 0) {
                        indicator.classList.remove(this.config.requestClass);
                        delete indicator._htmxReqCount
                    }
                }
            }
        }

        #disableElements(elt, disabledSelector) {
            let disabledElements = []
            if (disabledSelector) {
                disabledElements = this.#queryEltAndDescendants(elt, disabledSelector);
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

        #collectFormData(elt, form, submitter) {
            let formData = form ? new FormData(form) : new FormData()
            let included = form ? new Set(form.elements) : new Set()
            if (!form && elt.name) {
                formData.append(elt.name, elt.value)
                included.add(elt);
            }
            if (submitter && submitter.name) {
                formData.append(submitter.name, submitter.value)
                included.add(submitter);
            }
            let includeSelector = this.#attributeValue(elt, "hx-include");
            if (includeSelector) {
                let includeNodes = this.#findAllExt(elt, includeSelector);
                for (let node of includeNodes) {
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

        #handleHxVals(elt, body) {
            let hxValsValue = this.#attributeValue(elt, "hx-vals");
            if (hxValsValue) {
                let javascriptContent = this.#extractJavascriptContent(hxValsValue);
                if (javascriptContent) {
                    // Return promise for async evaluation
                    return this.#executeJavaScriptAsync(elt, {}, javascriptContent, true).then(obj => {
                        for (let key in obj) {
                            body.append(key, obj[key])
                        }
                    });
                } else {
                    // Synchronous path
                    let obj = this.#parseConfig(hxValsValue);
                    for (let key in obj) {
                        body.append(key, obj[key])
                    }
                }
            }
        }

        #stringHyperscriptStyleSelector(selector) {
            let s = selector.trim();
            return s.startsWith('<') && s.endsWith('/>') ? s.slice(1, -2) : s;
        }

        #findAllExt(eltOrSelector, maybeSelector, global) {
            let selector = maybeSelector ?? eltOrSelector;
            let elt = maybeSelector ? this.#normalizeElement(eltOrSelector) : document;
            if (selector.startsWith('global ')) {
                return this.#findAllExt(elt, selector.slice(7), true);
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
                    item = document.querySelector(elt, selector.slice(5))
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
                } else if (selector === 'root') {
                    item = this.#getRootNode(elt, !!global)
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
                let standardSelector = unprocessedParts.join(',')
                let rootNode = this.#getRootNode(elt, !!global)
                result.push(...rootNode.querySelectorAll(standardSelector))
            }

            return result
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

        #findExt(eltOrSelector, selector) {
            return this.#findAllExt(eltOrSelector, selector)[0]
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
            elt.addEventListener("htmx:abort", () => {
                let requestQueue = this.#getRequestQueue(elt);
                requestQueue.abort();
            })
        }

        #morph(oldNode, fragment, innerHTML) {
            let {persistentIds, idMap} = this.#createIdMaps(oldNode, fragment);
            let pantry = document.createElement("div");
            pantry.hidden = true;
            document.body.after( pantry);
            let ctx = {target: oldNode, idMap, persistentIds, pantry};

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

            for (const newChild of newParent.childNodes) {
                if (insertionPoint && insertionPoint != endPoint) {
                    let bestMatch = this.#findBestMatch(ctx, newChild, insertionPoint, endPoint);
                    if (bestMatch) {
                        if (bestMatch !== insertionPoint) {
                            let cursor = insertionPoint;
                            while (cursor && cursor !== bestMatch) {
                                let tempNode = cursor;
                                cursor = cursor.nextSibling;
                                this.#removeNode(ctx, tempNode);
                            }
                        }
                        this.#morphNode(bestMatch, newChild, ctx);
                        insertionPoint = bestMatch.nextSibling;
                        continue;
                    }
                }

                if (newChild instanceof Element && ctx.persistentIds.has(newChild.id)) {
                    let target = (ctx.target.id === newChild.id && ctx.target) ||
                        ctx.target.querySelector(`[id="${newChild.id}"]`) ||
                        ctx.pantry.querySelector(`[id="${newChild.id}"]`);
                    let elementId = target.id;
                    let element = target;
                    while ((element = element.parentNode)) {
                        let idSet = ctx.idMap.get(element);
                        if (idSet) {
                            idSet.delete(elementId);
                            if (!idSet.size) ctx.idMap.delete(element);
                        }
                    }
                    this.#moveBefore(oldParent, target, insertionPoint);
                    this.#morphNode(target, newChild, ctx);
                    insertionPoint = target.nextSibling;
                    continue;
                }

                let tempChild;
                if (ctx.idMap.has(newChild)) {
                    tempChild = document.createElement(newChild.tagName);
                    oldParent.insertBefore(tempChild, insertionPoint);
                    this.#morphNode(tempChild, newChild, ctx);
                } else {
                    tempChild = document.importNode(newChild, true);
                    oldParent.insertBefore(tempChild, insertionPoint);
                }
                insertionPoint = tempChild.nextSibling;
            }

            while (insertionPoint && insertionPoint != endPoint) {
                let tempNode = insertionPoint;
                insertionPoint = insertionPoint.nextSibling;
                this.#removeNode(ctx, tempNode);
            }
        }

        #findBestMatch(ctx, node, startPoint, endPoint) {
            let softMatch = null, nextSibling = node.nextSibling, siblingSoftMatchCount = 0, displaceMatchCount = 0;
            let newSet = ctx.idMap.get(node), nodeMatchCount = newSet?.size || 0;
            let cursor = startPoint;
            while (cursor && cursor != endPoint) {
                let oldSet = ctx.idMap.get(cursor);
                if (this.#isSoftMatch(cursor, node)) {
                    if (oldSet && newSet && [...oldSet].some(id => newSet.has(id))) return cursor;
                    if (softMatch === null && !oldSet) {
                        if (!nodeMatchCount) return cursor;
                        else softMatch = cursor;
                    }
                }
                displaceMatchCount += oldSet?.size || 0;
                if (displaceMatchCount > nodeMatchCount) break;
                if (softMatch === null && nextSibling && this.#isSoftMatch(cursor, nextSibling)) {
                    siblingSoftMatchCount++;
                    nextSibling = nextSibling.nextSibling;
                    if (siblingSoftMatchCount >= 2) softMatch = undefined;
                }
                if (cursor.contains(document.activeElement)) break;
                cursor = cursor.nextSibling;
            }
            return softMatch || null;
        }

        #isSoftMatch(oldNode, newNode) {
            return oldNode.nodeType === newNode.nodeType && oldNode.tagName === newNode.tagName &&
                (!oldNode.id || oldNode.id === newNode.id);
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
                    // ignore and insertBefore insteat
                }
            }
            parentNode.insertBefore(element, after);
        }

        #morphNode(oldNode, newNode, ctx) {
            let type = newNode.nodeType;

            if (type === 1) {
                let noMorph = this.config.morphIgnore || [];
                this.#copyAttributes(oldNode, newNode, noMorph);
                if (oldNode instanceof HTMLTextAreaElement && oldNode.defaultValue != newNode.defaultValue) {
                    oldNode.value = newNode.value;
                }
            }

            if ((type === 8 || type === 3) && oldNode.nodeValue !== newNode.nodeValue) {
                oldNode.nodeValue = newNode.nodeValue;
            }
            if (!oldNode.isEqualNode(newNode)) this.#morphChildren(ctx, oldNode, newNode);
        }

        #copyAttributes(destination, source, attributesToIgnore = []) {
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
                else oldIdTagNameMap.set(id, tagName);
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
                    Object.assign(ctx, this.#parseConfig(statusValue));
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
                    task();
                }
            } catch (e) {
                // Transitions can be skipped/aborted - this is normal
            } finally {
                this.#processingTransition = false;
                resolve();
                this.#processTransitionQueue();
            }
        }

        #captureCSSTransitions(task, root) {
            let idElements = root.querySelectorAll("[id]");
            let existingElementsById = Object.fromEntries([...idElements].map(e => [e.id, e]));
            let newElementsWithIds = task.fragment.querySelectorAll("[id]");
            task.restoreTasks = []
            for (let elt of newElementsWithIds) {
                let existing = existingElementsById[elt.id];
                if (existing?.tagName === elt.tagName) {
                    let clone = elt.cloneNode(false); // shallow clone node
                    this.#copyAttributes(elt, existing, this.config.morphIgnore)
                    task.restoreTasks.push(()=>{
                        this.#copyAttributes(elt, clone, this.config.morphIgnore)
                    })
                }
            }
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
