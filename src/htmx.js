// noinspection JSUnusedAssignment
var HTMx = HTMx || (function () {
        'use strict';

        var VERBS = ['get', 'post', 'put', 'delete', 'patch']

        //====================================================================
        // Utilities
        //====================================================================

        function parseInterval(str) {
            if (str === "null" || str === "false" || str === "") {
                return null;
            } else if (str.lastIndexOf("ms") === str.length - 2) {
                return parseFloat(str.substr(0, str.length - 2));
            } else if (str.lastIndexOf("s") === str.length - 1) {
                return parseFloat(str.substr(0, str.length - 1)) * 1000;
            } else {
                return parseFloat(str);
            }
        }

        function getRawAttribute(elt, name) {
            return elt.getAttribute && elt.getAttribute(name);
        }

        // resolve with both hx and data-hx prefixes
        function getAttributeValue(elt, qualifiedName) {
            return getRawAttribute(elt, qualifiedName) || getRawAttribute(elt, "data-" + qualifiedName);
        }

        function parentElt(elt) {
            return elt.parentElement;
        }

        function getDocument() {
            return document;
        }

        function getClosestMatch(elt, condition) {
            if (condition(elt)) {
                return elt;
            } else if (parentElt(elt)) {
                return getClosestMatch(parentElt(elt), condition);
            } else {
                return null;
            }
        }

        function getClosestAttributeValue(elt, attributeName) {
            var closestAttr = null;
            getClosestMatch(elt, function (e) {
                return closestAttr = getRawAttribute(e, attributeName);
            });
            return closestAttr;
        }

        function matches(elt, selector) {
            // noinspection JSUnresolvedVariable
            return (elt != null) &&(elt.matches || elt.matchesSelector || elt.msMatchesSelector || elt.mozMatchesSelector
                || elt.webkitMatchesSelector || elt.oMatchesSelector).call(elt, selector);
        }

        function closest (elt, selector) {
            do if (elt == null || matches(elt, selector)) return elt;
            while (elt = elt && parentElt(elt));
        }

        function makeFragment(resp) {
            var range = getDocument().createRange();
            return range.createContextualFragment(resp);
        }

        function isType(o, type) {
            return Object.prototype.toString.call(o) === "[object " + type + "]";
        }

        function isFunction(o) {
            return isType(o, "Function");
        }

        function isRawObject(o) {
            return isType(o, "Object");
        }

        function getInternalData(elt) {
            var dataProp = 'hx-data-internal';
            var data = elt[dataProp];
            if (!data) {
                data = elt[dataProp] = {};
            }
            return data;
        }

        function toArray(object) {
            var arr = [];
            forEach(object, function(elt) {
                arr.push(elt)
            });
            return arr;
        }

        function forEach(arr, func) {
            for (var i = 0; i < arr.length; i++) {
                func(arr[i]);
            }
        }

        function isScrolledIntoView(el) {
            var rect = el.getBoundingClientRect();
            var elemTop = rect.top;
            var elemBottom = rect.bottom;
            return elemTop < window.innerHeight && elemBottom >= 0;
        }

        function bodyContains(elt) {
            return getDocument().body.contains(elt);
        }

        //====================================================================
        // Node processing
        //====================================================================

        function getTarget(elt) {
            var explicitTarget = getClosestMatch(elt, function(e){return getRawAttribute(e,"hx-target") !== null});
            if (explicitTarget) {
                var targetStr = getRawAttribute(explicitTarget, "hx-target");
                if (targetStr === "this") {
                    return explicitTarget;
                } else {
                    return getDocument().querySelector(targetStr);
                }
            } else {
                var data = getInternalData(elt);
                if (data.boosted) {
                    return getDocument().body;
                } else {
                    return elt;
                }
            }
        }

        function cloneAttributes(mergeTo, mergeFrom) {
            forEach(mergeTo.attributes, function (attr) {
                if (!mergeFrom.hasAttribute(attr.name)) {
                    mergeTo.removeAttribute(attr.name)
                }
            });
            forEach(mergeFrom.attributes, function (attr) {
                mergeTo.setAttribute(attr.name, attr.value);
            });
        }

        function handleOutOfBandSwaps(fragment) {
            forEach(fragment.children, function(child){
                if (getAttributeValue(child, "hx-swap-oob") === "true") {
                    var target = getDocument().getElementById(child.id);
                    if (target) {
                        var fragment = new DocumentFragment()
                        fragment.append(child);
                        swapOuterHTML(target, fragment);
                    } else {
                        child.parentNode.removeChild(child);
                        triggerEvent(getDocument().body, "oobErrorNoTarget.hx", {id:child.id, content:child})
                    }
                }
            })
        }

        function handleAttributes(parentNode, fragment) {
            var attributeSwaps = [];
            forEach(fragment.querySelectorAll("[id]"), function (newNode) {
                var oldNode = parentNode.querySelector(newNode.tagName + "[id=" + newNode.id + "]")
                if (oldNode) {
                    var newAttributes = newNode.cloneNode();
                    cloneAttributes(newNode, oldNode);
                    attributeSwaps.push(function () {
                        cloneAttributes(newNode, newAttributes);
                    });
                }
            });
            setTimeout(function () {
                forEach(attributeSwaps, function (swap) {
                    swap.call();
                });
            }, 100);
        }

        function insertNodesBefore(parentNode, insertBefore, fragment) {
            handleAttributes(parentNode, fragment);
            while(fragment.childNodes.length > 0){
                var child = fragment.firstChild;
                parentNode.insertBefore(child, insertBefore);
                if (child.nodeType !== Node.TEXT_NODE) {
                    triggerEvent(child, 'load.hx', {elt:child, parent:parentElt(child)});
                    processNode(child);
                }
            }
        }

        function swapOuterHTML(target, fragment) {
            if (target.tagName === "BODY") {
                swapInnerHTML(target, fragment);
            } else {
                insertNodesBefore(parentElt(target), target, fragment);
                parentElt(target).removeChild(target);
            }
        }

        function swapPrepend(target, fragment) {
            insertNodesBefore(target, target.firstChild, fragment);
        }

        function swapPrependBefore(target, fragment) {
            insertNodesBefore(parentElt(target), target, fragment);
        }

        function swapAppend(target, fragment) {
            insertNodesBefore(target, null, fragment);
        }

        function swapAppendAfter(target, fragment) {
            insertNodesBefore(parentElt(target), target.nextSibling, fragment);
        }

        function swapInnerHTML(target, fragment) {
            target.innerHTML = "";
            insertNodesBefore(target, null, fragment);
        }

        function maybeSelectFromResponse(elt, fragment) {
            var selector = getClosestAttributeValue(elt, "hx-select");
            if (selector) {
                var newFragment = new DocumentFragment();
                forEach(fragment.querySelectorAll(selector), function (node) {
                    newFragment.append(node);
                });
                fragment = newFragment;
            }
            return fragment;
        }

        function swapResponse(target, elt, responseText, callBack) {

            var fragment = makeFragment(responseText);
            handleOutOfBandSwaps(fragment);

            fragment = maybeSelectFromResponse(elt, fragment);

            var swapStyle = getClosestAttributeValue(elt, "hx-swap");
            if (swapStyle === "outerHTML") {
                swapOuterHTML(target, fragment);
            } else if (swapStyle === "prepend") {
                swapPrepend(target, fragment);
            } else if (swapStyle === "prependBefore") {
                swapPrependBefore(target, fragment);
            } else if (swapStyle === "append") {
                swapAppend(target, fragment);
            } else if (swapStyle === "appendAfter") {
                swapAppendAfter(target, fragment);
            } else {
                swapInnerHTML(target, fragment);
            }

            if(callBack) {
                callBack.call();
            }
        }

        function handleTrigger(elt, trigger) {
            if (trigger) {
                if (trigger.indexOf("{") === 0) {
                    var triggers = JSON.parse(trigger);
                    for (var eventName in triggers) {
                        if (triggers.hasOwnProperty(eventName)) {
                            var details = triggers[eventName];
                            if (!isRawObject(details)) {
                                details = {"value": details}
                            }
                            triggerEvent(elt, eventName, details);
                        }
                    }
                } else {
                    triggerEvent(elt, trigger, []);
                }
            }
        }

        function getTrigger(elt) {
            var explicitTrigger = getClosestAttributeValue(elt, 'hx-trigger');
            if (explicitTrigger) {
                return explicitTrigger;
            } else {
                if (matches(elt, 'button')) {
                    return 'click';
                } else if (matches(elt, 'form')) {
                    return 'submit';
                } else if (matches(elt, 'input, textarea, select')) {
                    return 'change';
                } else {
                    return 'click';
                }
            }
        }

        function processClassList(elt, classList, operation) {
            var values = classList.split(",");
            forEach(values, function(value){
                var cssClass = "";
                var delay = 50;
                var trimmedValue = value.trim();
                if (trimmedValue.indexOf(":") > 0) {
                    var split = trimmedValue.split(':');
                    cssClass = split[0];
                    delay = parseInterval(split[1]);
                } else {
                    cssClass = trimmedValue;
                }
                setTimeout(function () {
                    elt.classList[operation].call(elt.classList, cssClass);
                }, delay);
            });
        }

        function processPolling(elt, verb, path) {
            var trigger = getTrigger(elt);
            var nodeData = getInternalData(elt);
            if (trigger.trim().indexOf("every ") === 0) {
                var args = trigger.split(/\s+/);
                var intervalStr = args[1];
                if (intervalStr) {
                    var interval = parseInterval(intervalStr);
                    nodeData.timeout = setTimeout(function () {
                        if (bodyContains(elt)) {
                            issueAjaxRequest(elt, verb, path);
                            processPolling(elt, verb, getAttributeValue(elt, "hx-" + verb));
                        }
                    }, interval);
                }
            }
        }

        function isLocalLink(elt) {
            return location.hostname === elt.hostname &&
                getRawAttribute(elt,'href') &&
                !getRawAttribute(elt,'href').startsWith("#")
        }

        function boostElement(elt, nodeData, trigger) {
            if ((elt.tagName === "A" && isLocalLink(elt)) || elt.tagName === "FORM") {
                nodeData.boosted = true;
                var verb, path;
                if (elt.tagName === "A") {
                    verb = "get";
                    path = getRawAttribute(elt, 'href');
                } else {
                    var rawAttribute = getRawAttribute(elt, "method");
                    verb = rawAttribute ? rawAttribute.toLowerCase() : "get";
                    path = getRawAttribute(elt, 'action');
                }
                addEventListener(elt, verb, path, nodeData, trigger, true);
            }
        }

        function addEventListener(elt, verb, path, nodeData, trigger, cancel) {
            var eventListener = function (evt) {
                if(cancel) evt.preventDefault();
                var eventData = getInternalData(evt);
                var elementData = getInternalData(elt);
                if (!eventData.handled) {
                    eventData.handled = true;
                    if (getAttributeValue(elt, "hx-trigger-once") === "true") {
                        if (elementData.triggeredOnce) {
                            return;
                        } else {
                            elementData.triggeredOnce = true;
                        }
                    }
                    if (getAttributeValue(elt, "hx-trigger-changed-only") === "true") {
                        if (elementData.lastValue === elt.value) {
                            return;
                        } else {
                            elementData.lastValue = elt.value;
                        }
                    }
                    if (elementData.delayed) {
                        clearTimeout(elementData.delayed);
                    }
                    var eventDelay = getAttributeValue(elt, "hx-trigger-delay");
                    var issueRequest = function(){
                        issueAjaxRequest(elt, verb, path, evt.target);
                    }
                    if (eventDelay) {
                        elementData.delayed = setTimeout(issueRequest, parseInterval(eventDelay));
                    } else {
                        issueRequest();
                    }
                }
            };
            nodeData.trigger = trigger;
            nodeData.eventListener = eventListener;
            elt.addEventListener(trigger, eventListener);
        }

        function initScrollHandler() {
            if (!window['hxScrollHandler']) {
                var scrollHandler = function() {
                    forEach(getDocument().querySelectorAll("[hx-trigger='reveal']"), function (elt) {
                        maybeReveal(elt);
                    });
                };
                window['hxScrollHandler'] = scrollHandler;
                window.addEventListener("scroll", scrollHandler)
            }
        }

        function maybeReveal(elt) {
            var nodeData = getInternalData(elt);
            if (!nodeData.revealed && isScrolledIntoView(elt)) {
                nodeData.revealed = true;
                issueAjaxRequest(elt, nodeData.verb, nodeData.path);
            }
        }

        function maybeCloseSSESource(elt) {
            if (!bodyContains(elt)) {
                elt.sseSource.close();
                return true;
            }
        }

        function initSSESource(elt, sseSrc) {
            var details = {
               initializer: function() { new EventSource(sseSrc, details.config) },
               config:{withCredentials: true}
            };
            triggerEvent(elt, "initSSE.mx", {config:details})
            var source = details.initializer();
            source.onerror = function (e) {
                triggerEvent(elt, "sseError.mx", {error:e, source:source});
                maybeCloseSSESource(elt);
            };
            getInternalData(elt).sseSource = source;
        }

        function processSSETrigger(sseEventName, elt, verb, path) {
            var sseSource = getClosestMatch(elt, function (parent) {
                return parent.sseSource;
            });
            if (sseSource) {
                var sseListener = function () {
                    if (!maybeCloseSSESource(sseSource)) {
                        if (bodyContains(elt)) {
                            issueAjaxRequest(elt, verb, path);
                        } else {
                            sseSource.sseSource.removeEventListener(sseEventName, sseListener);
                        }
                    }
                };
                sseSource.sseSource.addEventListener(sseEventName, sseListener);
            } else {
                triggerEvent(elt, "noSSESourceError.mx")
            }
        }

        function loadImmediately(nodeData, elt, verb, path) {
            if (!nodeData.loaded) {
                nodeData.loaded = true;
                issueAjaxRequest(elt, verb, path);
            }
        }

        function processVerbs(elt, nodeData, trigger) {
            var explicitAction = false;
            forEach(VERBS, function (verb) {
                var path = getAttributeValue(elt, 'hx-' + verb);
                if (path) {
                    explicitAction = true;
                    nodeData.path = path;
                    nodeData.verb = verb;
                    if (trigger.indexOf("sse:") === 0) {
                        processSSETrigger(trigger.substr(4), elt, verb, path);
                    } else if (trigger === 'revealed') {
                        initScrollHandler();
                        maybeReveal(elt);
                    } else if (trigger === 'load') {
                        loadImmediately(nodeData, elt, verb, path);
                    } else if (trigger.trim().indexOf('every ') === 0) {
                        nodeData.polling = true;
                        processPolling(elt, verb, path);
                    } else {
                        addEventListener(elt, verb, path, nodeData, trigger);
                    }
                }
            });
            return explicitAction;
        }

        function processNode(elt) {
            var nodeData = getInternalData(elt);
            if (!nodeData.processed) {
                nodeData.processed = true;

                var trigger = getTrigger(elt);
                var explicitAction = processVerbs(elt, nodeData, trigger);

                if (!explicitAction && getClosestAttributeValue(elt, "hx-boost") === "true") {
                    boostElement(elt, nodeData, trigger);
                }
                var sseSrc = getAttributeValue(elt, 'hx-sse-source');
                if (sseSrc) {
                    initSSESource(elt, sseSrc);
                }
                var addClass = getAttributeValue(elt, 'hx-add-class');
                if (addClass) {
                    processClassList(elt, addClass, "add");
                }
                var removeClass = getAttributeValue(elt, 'hx-remove-class');
                if (removeClass) {
                    processClassList(elt, removeClass, "remove");
                }
            }
            forEach(elt.children, function(child) { processNode(child) });
        }

        //====================================================================
        // Event/Log Support
        //====================================================================

        function sendError(elt, eventName, details) {
            var errorURL = getClosestAttributeValue(elt, "hx-error-url");
            if (errorURL) {
                var xhr = new XMLHttpRequest();
                xhr.open("POST", errorURL);
                xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                xhr.send(JSON.stringify({ "elt": elt.id, "event": eventName, "details" : details }));
            }
        }

        function makeEvent(eventName, details) {
            var evt;
            if (window.CustomEvent && typeof window.CustomEvent === 'function') {
                evt = new CustomEvent(eventName, {detail: details});
            } else {
                evt = getDocument().createEvent('CustomEvent');
                evt.initCustomEvent(eventName, true, true, details);
            }
            return evt;
        }

        function triggerEvent(elt, eventName, details) {
            details["elt"] = elt;
            var event = makeEvent(eventName, details);
            if (HTMx.logger) {
                HTMx.logger(elt, eventName, details);
                if (eventName.indexOf("Error") > 0) {
                    sendError(elt, eventName, details);
                }
            }
            var eventResult = elt.dispatchEvent(event);
            var allResult = elt.dispatchEvent(makeEvent("all.hx", {elt:elt, originalDetails:details, originalEvent: event}));
            return eventResult && allResult;
        }

        function addHTMxEventListener(arg1, arg2, arg3) {
            var target, event, listener;
            if (isFunction(arg1)) {
                target = getDocument().body;
                event = "all.hx";
                listener = arg1;
            } else if (isFunction(arg2)) {
                target = getDocument().body;
                event = arg1;
                listener = arg2;
            } else {
                target = arg1;
                event = arg2;
                listener = arg3;
            }
            return target.addEventListener(event, listener);
        }

        //====================================================================
        // History Support
        //====================================================================
        function getHistoryElement() {
            var historyElt = getDocument().querySelector('.hx-history-element');
            return historyElt || getDocument().body;
        }

        function purgeOldestPaths(paths, historyTimestamps) {
            var paths = paths.sort(function (path1, path2) {
                return historyTimestamps[path2] - historyTimestamps[path1]
            });
            var slot = 0;
            forEach(paths, function (path) {
                slot++;
                if (slot > 20) {
                    delete historyTimestamps[path];
                    localStorage.removeItem(path);
                }
            });
        }

        function bumpHistoryAccessDate(pathAndSearch) {
            var historyTimestamps = JSON.parse(localStorage.getItem("hx-history-timestamps")) || {};
            historyTimestamps[pathAndSearch] = Date.now;
            var paths = Object.keys(historyTimestamps);
            if (paths.length > 20) {
                purgeOldestPaths(paths, historyTimestamps);
            }
            localStorage.setItem("hx-history-timestamps", JSON.stringify(historyTimestamps));
        }

        function saveForHistory() {
            var elt = getHistoryElement();
            var pathAndSearch = location.pathname+location.search;
            triggerEvent(getDocument().body, "historyUpdate.hx", {path:pathAndSearch});
            history.replaceState({}, getDocument().title, window.location.href);
            localStorage.setItem('hx-history-content-' + pathAndSearch, elt.innerHTML);
            bumpHistoryAccessDate(pathAndSearch);
        }

        function initNewHistoryEntry(elt, url) {
            if (shouldPush(elt)) {
                history.pushState({}, "", url );
                saveForHistory();
            }
        }

        function loadHistoryFromServer(pathAndSearch) {
            triggerEvent(getDocument().body, "historyCacheMiss.hx", {path: pathAndSearch});
            var request = new XMLHttpRequest();
            request.open('GET', pathAndSearch, true);
            request.onload = function () {
                triggerEvent(getDocument().body, "historyCacheMissLoad.hx", {path: pathAndSearch});
                if (this.status >= 200 && this.status < 400) {
                    var fragment = makeFragment(this.response);
                    fragment = fragment.querySelector('.hx-history-element') || fragment;
                    swapInnerHTML(getHistoryElement(), fragment);
                }
            };
        }

        function restoreHistory() {
            var pathAndSearch = location.pathname+location.search;
            triggerEvent(getDocument().body, "historyUpdate.hx", {path:pathAndSearch});
            var content = localStorage.getItem('hx-history-content-' + pathAndSearch);
            if (content) {
                bumpHistoryAccessDate(pathAndSearch);
                swapInnerHTML(getHistoryElement(), makeFragment(content));
            } else {
                loadHistoryFromServer(pathAndSearch);
            }
        }

        function shouldPush(elt) {
            return getClosestAttributeValue(elt, "hx-push-url") === "true" ||
                (elt.tagName === "A" && getInternalData(elt).boosted);
        }

        function snapshotForCurrentHistoryEntry(elt) {
            if (shouldPush(elt)) {
                // TODO event to allow de-initialization of HTML elements in target
                saveForHistory();
            }
        }


        function addRequestIndicatorClasses(elt) {
            mutateRequestIndicatorClasses(elt, "add");
        }

        function removeRequestIndicatorClasses(elt) {
            mutateRequestIndicatorClasses(elt, "remove");
        }

        function mutateRequestIndicatorClasses(elt, action) {
            var indicator = getClosestAttributeValue(elt, 'hx-indicator');
            if (indicator) {
                var indicators = getDocument().querySelectorAll(indicator);
            } else {
                indicators = [elt];
            }
            forEach(indicators, function(ic) {
                ic.classList[action].call(ic.classList, "hx-show-indicator");
            });
        }

        //====================================================================
        // Input Value Processing
        //====================================================================

        function haveSeenNode(processed, elt) {
            for (var i = 0; i < processed.length; i++) {
                var node = processed[i];
                if (node.isSameNode(elt)) {
                    return true;
                }
            }
            return false;
        }

        function processInputValue(processed, values, elt) {
            if (elt == null || haveSeenNode(processed, elt)) {
                return;
            } else {
                processed.push(elt);
            }
            var name = getRawAttribute(elt,"name");
            var value = elt.value;
            if (name && value) {
                var current = values[name];
                if(current) {
                    if (Array.isArray(current)) {
                        current.push(value);
                    } else {
                        values[name] = [current, value];
                    }
                } else {
                    values[name] = value;
                }
            }
            if (matches(elt, 'form')) {
                var inputs = elt.elements;
                forEach(inputs, function(input) {
                    processInputValue(processed, values, input);
                });
            }
        }

        function getInputValues(elt) {
            var processed = [];
            var values = {};
            // include the element itself
            processInputValue(processed, values, elt);

            // include any explicit includes
            var includes = getAttributeValue(elt, "hx-include");
            if (includes) {
                var nodes = getDocument().querySelectorAll(includes);
                forEach(nodes, function(node) {
                    processInputValue(processed, values, node);
                });
            }

            // include the closest form
            processInputValue(processed, values, closest(elt, 'form'));
            return values;
        }

        function appendParam(returnStr, name, realValue) {
            if (returnStr !== "") {
                returnStr += "&";
            }
            returnStr += encodeURIComponent(name) + "=" + encodeURIComponent(realValue);
            return returnStr;
        }

        function urlEncode(values) {
            var returnStr = "";
            for (var name in values) {
                if (values.hasOwnProperty(name)) {
                    var value = values[name];
                    if (Array.isArray(value)) {
                        forEach(value, function(v) {
                            returnStr = appendParam(returnStr, name, v);
                        });
                    } else {
                        returnStr = appendParam(returnStr, name, value);
                    }
                }
            }
            return returnStr;
        }

        //====================================================================
        // Ajax
        //====================================================================

        function setHeader(xhr, name, value, noPrefix) {
            xhr.setRequestHeader((noPrefix ? "" : "X-HX-") + name, value || "");
        }

        function issueAjaxRequest(elt, verb, path, eventTarget) {
            var eltData = getInternalData(elt);
            if (eltData.requestInFlight) {
                return;
            } else {
                eltData.requestInFlight = true;
            }
            var endRequestLock = function(){
                eltData.requestInFlight = false
            }
            var target = getTarget(elt);
            var promptQuestion = getClosestAttributeValue(elt, "hx-prompt");
            if (promptQuestion) {
                var prompt = prompt(promptQuestion);
                if(!triggerEvent(elt, 'prompt.hx', {prompt: prompt, target:target})) return endRequestLock();
            }

            var confirmQuestion = getClosestAttributeValue(elt, "hx-confirm");
            if (confirmQuestion) {
                if(!confirm(confirmQuestion)) return endRequestLock();
            }

            var xhr = new XMLHttpRequest();

            var inputValues = getInputValues(elt);
            if(!triggerEvent(elt, 'values.hx', {values: inputValues, target:target})) return endRequestLock();

            // request type
            if (verb === 'get') {
                var noValues = Object.keys(inputValues).length === 0;
                xhr.open('GET', path + (noValues ? "" : "?" + urlEncode(inputValues)), true);
            } else {
                xhr.open('POST', path, true);
                setHeader(xhr,'Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8', true);
                if (verb !== 'post') {
                    setHeader(xhr, 'X-HTTP-Method-Override', verb.toUpperCase(), true);
                }
            }

            // TODO  IE10 compatibility?
            xhr.overrideMimeType("text/html");

            // request headers
            setHeader(xhr, "Request", "true");
            setHeader(xhr,"Trigger-Id", getRawAttribute(elt,"id"));
            setHeader(xhr,"Trigger-Name", getRawAttribute(elt, "name"));
            setHeader(xhr,"Target-Id", getRawAttribute(target,"id"));
            setHeader(xhr,"Current-URL", getDocument().location.href);
            if (prompt) {
                setHeader(xhr,"Prompt", prompt);
            }
            if (eventTarget) {
                setHeader(xhr,"Event-Target", getRawAttribute(eventTarget,"id"));
            }
            if (getDocument().activeElement) {
                setHeader(xhr,"Active-Element", getRawAttribute(getDocument().activeElement,"id"));
                // noinspection JSUnresolvedVariable
                if (getDocument().activeElement.value) {
                    setHeader(xhr,"Active-Element-Value", getDocument().activeElement.value);
                }
            }

            xhr.onload = function () {
                try {
                    if (!triggerEvent(elt, 'beforeOnLoad.hx', {xhr: xhr, target: target})) return;
                    snapshotForCurrentHistoryEntry(elt, path);
                    var trigger = this.getResponseHeader("X-HX-Trigger");
                    handleTrigger(elt, trigger);
                    initNewHistoryEntry(elt, path);
                    if (this.status >= 200 && this.status < 400) {
                        // don't process 'No Content' response
                        if (this.status !== 204) {
                            // Success!
                            var resp = this.response;
                            if (!triggerEvent(elt, 'beforeSwap.hx', {xhr: xhr, target: target})) return;
                            target.classList.add("hx-swapping");
                            var doSwap = function () {
                                try {
                                    swapResponse(target, elt, resp, function () {
                                        target.classList.remove("hx-swapping");
                                        setTimeout(saveForHistory, 200);
                                        triggerEvent(elt, 'afterSwap.hx', {xhr: xhr, target: target});
                                    });
                                } catch (e) {
                                    triggerEvent(elt, 'swapError.hx', {xhr: xhr, response: xhr.response, status: xhr.status, target: target});
                                    throw e;
                                }
                            };
                            var swapDelayStr = getAttributeValue(elt, "hx-swap-delay");
                            if (swapDelayStr) {
                                setTimeout(doSwap, parseInterval(swapDelayStr))
                            } else {
                                doSwap();
                            }
                        }
                    } else {
                        triggerEvent(elt, 'responseError.hx', {xhr: xhr, response: xhr.response, status: xhr.status, target: target});
                    }
                } catch (e) {
                    triggerEvent(elt, 'onLoadError.hx', {xhr: xhr, response: xhr.response, status: xhr.status, target: target});
                    throw e;
                } finally {
                    removeRequestIndicatorClasses(elt);
                    endRequestLock();
                    triggerEvent(elt, 'afterOnLoad.hx', {xhr: xhr, response: xhr.response, status: xhr.status, target: target});
                }
            }
            xhr.onerror = function () {
                removeRequestIndicatorClasses(elt);triggerEvent(elt, 'loadError.hx', {xhr:xhr});
                endRequestLock();
            }
            if(!triggerEvent(elt, 'beforeRequest.hx', {xhr:xhr, values: inputValues, target:target})) return endRequestLock();
            addRequestIndicatorClasses(elt);
            xhr.send(verb === 'get' ? null : urlEncode(inputValues));
        }

        //====================================================================
        // Initialization
        //====================================================================

        function ready(fn) {
            if (getDocument().readyState !== 'loading') {
                fn();
            } else {
                getDocument().addEventListener('DOMContentLoaded', fn);
            }
        }

        // initialize the document
        ready(function () {
            processNode(getDocument().body);
            window.onpopstate = function (event) {
                restoreHistory();
            };
        })

        function internalEval(str){
            return eval(str);
        }

        // Public API
        return {
            processElement: processNode,
            on: addHTMxEventListener,
            version: "0.0.2",
            _:internalEval
        }
    }
)();