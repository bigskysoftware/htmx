// noinspection JSUnusedAssignment
var kutty = kutty || (function () {
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

        // resolve with both kt and data-kt prefixes
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

        function getStartTag(str) {
            var tagMatcher = /<([a-z][^\/\0>\x20\t\r\n\f]*)/i
            var match = tagMatcher.exec( str );
            if (match) {
                return match[1].toLowerCase();
            } else {
                return "";
            }
        }

        function parseHTML(resp, depth) {
            var parser = new DOMParser();
            var responseDoc = parser.parseFromString(resp, "text/html");
            var responseNode = responseDoc.body;
            while (depth > 0) {
                depth--;
                responseNode = responseNode.firstChild;
            }
            return responseNode;
        }

        function makeFragment(resp) {
            var startTag = getStartTag(resp);
            switch (startTag) {
                case "thead":
                case "tbody":
                case "tfoot":
                case "colgroup":
                case "caption":
                    return parseHTML("<table>" + resp + "</table>", 1);
                case "col":
                    return parseHTML("<table><colgroup>" + resp + "</colgroup></table>", 2);
                case "tr":
                    return parseHTML("<table><tbody>" + resp + "</tbody></table>", 2);
                case "td":
                case "th":
                    return parseHTML("<table><tbody><tr>" + resp + "</tr></tbody></table>", 3);
                default:
                    return parseHTML(resp, 0);
            }
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
            var dataProp = 'kutty-internal-data';
            var data = elt[dataProp];
            if (!data) {
                data = elt[dataProp] = {};
            }
            return data;
        }

        function forEach(arr, func) {
            if (arr) {
                for (var i = 0; i < arr.length; i++) {
                    func(arr[i]);
                }
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

        function concat(arr1, arr2) {
            return arr1.concat(arr2);
        }

        function splitOnWhitespace(trigger) {
            return trigger.split(/\s+/);
        }

        function addRule(rule) {
            var sheet = getDocument().styleSheets[0];
            sheet.insertRule(rule, sheet.cssRules.length);
        }

        //====================================================================
        // Node processing
        //====================================================================

        function getTarget(elt) {
            var explicitTarget = getClosestMatch(elt, function(e){return getRawAttribute(e,"kt-target") !== null});
            if (explicitTarget) {
                var targetStr = getRawAttribute(explicitTarget, "kt-target");
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
            var settleTasks = [];
            forEach(fragment.children, function (child) {
                if (getAttributeValue(child, "kt-swap-oob") === "true") {
                    var target = getDocument().getElementById(child.id);
                    if (target) {
                        var fragment = getDocument().createDocumentFragment();
                        fragment.appendChild(child);
                        settleTasks = settleTasks.concat(swapOuterHTML(target, fragment));
                    } else {
                        child.parentNode.removeChild(child);
                        triggerEvent(getDocument().body, "oobErrorNoTarget.kutty", {id: child.id, content: child})
                    }
                }
            });
            return settleTasks;
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
            return attributeSwaps;
        }

        function insertNodesBefore(parentNode, insertBefore, fragment) {
            var settleTasks = handleAttributes(parentNode, fragment);
            while(fragment.childNodes.length > 0){
                var child = fragment.firstChild;
                parentNode.insertBefore(child, insertBefore);
                if (child.nodeType !== Node.TEXT_NODE) {
                    triggerEvent(child, 'load.kutty', {elt:child, parent:parentElt(child)});
                    processNode(child);
                }
            }
            return settleTasks;
        }

        function swapOuterHTML(target, fragment) {
            if (target.tagName === "BODY") {
                return swapInnerHTML(target, fragment);
            } else {
                var settleTasks = insertNodesBefore(parentElt(target), target, fragment);
                parentElt(target).removeChild(target);
                return settleTasks;
            }
        }

        function swapAfterBegin(target, fragment) {
            return insertNodesBefore(target, target.firstChild, fragment);
        }

        function swapBeforeBegin(target, fragment) {
            return insertNodesBefore(parentElt(target), target, fragment);
        }

        function swapBeforeEnd(target, fragment) {
            return insertNodesBefore(target, null, fragment);
        }

        function swapAfterEnd(target, fragment) {
            return insertNodesBefore(parentElt(target), target.nextSibling, fragment);
        }

        function swapInnerHTML(target, fragment) {
            var firstChild = target.firstChild;
            var settleTasks = insertNodesBefore(target, firstChild, fragment);
            if (firstChild) {
                while (firstChild.nextSibling) {
                    target.removeChild(firstChild.nextSibling);
                }
                target.removeChild(firstChild);
            }
            return settleTasks;
        }

        function maybeSelectFromResponse(elt, fragment) {
            var selector = getClosestAttributeValue(elt, "kt-select");
            if (selector) {
                var newFragment = getDocument().createDocumentFragment();
                forEach(fragment.querySelectorAll(selector), function (node) {
                    newFragment.appendChild(node);
                });
                fragment = newFragment;
            }
            return fragment;
        }

        function swapResponse(swapStyle, target, elt, responseText) {
            var fragment = makeFragment(responseText);
            if (fragment) {
                var settleTasks = handleOutOfBandSwaps(fragment);

                fragment = maybeSelectFromResponse(elt, fragment);

                switch(swapStyle) {
                    case "outerHTML": return concat(settleTasks, swapOuterHTML(target, fragment));
                    case "afterbegin": return concat(settleTasks, swapAfterBegin(target, fragment));
                    case "beforebegin": return concat(settleTasks, swapBeforeBegin(target, fragment));
                    case "beforeend": return concat(settleTasks, swapBeforeEnd(target, fragment));
                    case "afterend": return concat(settleTasks, swapAfterEnd(target, fragment));
                    default: return concat(settleTasks, swapInnerHTML(target, fragment));
                }
            }
        }

        function handleTrigger(elt, trigger) {
            if (trigger) {
                if (trigger.indexOf("{") === 0) {
                    var triggers = JSON.parse(trigger);
                    for (var eventName in triggers) {
                        if (triggers.hasOwnProperty(eventName)) {
                            var detail = triggers[eventName];
                            if (!isRawObject(detail)) {
                                detail = {"value": detail}
                            }
                            triggerEvent(elt, eventName, detail);
                        }
                    }
                } else {
                    triggerEvent(elt, trigger, []);
                }
            }
        }

        function getTriggerSpec(elt) {

            var triggerSpec = {
                "trigger" : "click"
            }
            var explicitTrigger = getClosestAttributeValue(elt, 'kt-trigger');
            if (explicitTrigger) {
                var tokens = splitOnWhitespace(explicitTrigger);
                if (tokens.length > 0) {
                    var trigger = tokens[0];
                    if (trigger === "every") {
                        triggerSpec.pollInterval = parseInterval(tokens[1]);
                    } else if (trigger.indexOf("sse:") === 0) {
                        triggerSpec.sseEvent = trigger.substr(4);
                    } else {
                        triggerSpec['trigger'] = trigger;
                        for (var i = 1; i < tokens.length; i++) {
                            var token = tokens[i].trim();
                            if (token === "changed") {
                                triggerSpec.changed = true;
                            }
                            if (token === "once") {
                                triggerSpec.once = true;
                            }
                            if (token.indexOf("delay:") === 0) {
                                triggerSpec.delay = parseInterval(token.substr(6));
                            }
                        }
                    }
                }
            } else {
                if (matches(elt, 'form')) {
                    triggerSpec['trigger'] = 'submit';
                } else if (matches(elt, 'input, textarea, select')) {
                    triggerSpec['trigger'] = 'change';
                }
            }
            return triggerSpec;
        }

        function parseClassOperation(trimmedValue) {
            var split = splitOnWhitespace(trimmedValue);
            if (split.length > 1) {
                var operation = split[0];
                var classDef = split[1].trim();
                var cssClass;
                var delay;
                if (classDef.indexOf(":") > 0) {
                    var splitCssClass = classDef.split(':');
                    cssClass = splitCssClass[0];
                    delay = parseInterval(splitCssClass[1]);
                } else {
                    cssClass = classDef;
                    delay = 100;
                }
                return {
                    operation:operation,
                    cssClass:cssClass,
                    delay:delay
                }
            } else {
                return null;
            }
        }

        function processClassList(elt, classList, operation) {
            forEach(classList.split("&"), function (run) {
                var currentRunTime = 0;
                forEach(run.split(","), function(value){
                    var trimmedValue = value.trim();
                    var classOperation = parseClassOperation(trimmedValue);
                    if (classOperation) {
                        if (classOperation.operation === "toggle") {
                            setTimeout(function () {
                                setInterval(function () {
                                    elt.classList[classOperation.operation].call(elt.classList, classOperation.cssClass);
                                }, classOperation.delay);
                            }, currentRunTime);
                            currentRunTime = currentRunTime + classOperation.delay;
                        } else {
                            currentRunTime = currentRunTime + classOperation.delay;
                            setTimeout(function () {
                                elt.classList[classOperation.operation].call(elt.classList, classOperation.cssClass);
                            }, currentRunTime);
                        }
                    }
                });
            });
        }

        function processPolling(elt, verb, path, interval) {
            var nodeData = getInternalData(elt);
            nodeData.timeout = setTimeout(function () {
                if (bodyContains(elt)) {
                    issueAjaxRequest(elt, verb, path);
                    processPolling(elt, verb, getAttributeValue(elt, "kt-" + verb), interval);
                }
            }, interval);
        }

        function isLocalLink(elt) {
            return location.hostname === elt.hostname &&
                getRawAttribute(elt,'href') &&
                !getRawAttribute(elt,'href').startsWith("#")
        }

        function boostElement(elt, nodeData, triggerSpec) {
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
                addEventListener(elt, verb, path, nodeData, triggerSpec, true);
            }
        }

        function shouldCancel(elt) {
            return elt.tagName === "FORM" ||
                (matches(elt, 'input[type="submit"], button') && closest(elt, 'form') !== null) ||
                (elt.tagName === "A" && elt.href && elt.href.indexOf('#') !== 0);
        }

        function addEventListener(elt, verb, path, nodeData, triggerSpec, explicitCancel) {
            var eventListener = function (evt) {
                if(explicitCancel || shouldCancel(elt)) evt.preventDefault();
                var eventData = getInternalData(evt);
                var elementData = getInternalData(elt);
                if (!eventData.handled) {
                    eventData.handled = true;
                    if (triggerSpec.once) {
                        if (elementData.triggeredOnce) {
                            return;
                        } else {
                            elementData.triggeredOnce = true;
                        }
                    }
                    if (triggerSpec.changed) {
                        if (elementData.lastValue === elt.value) {
                            return;
                        } else {
                            elementData.lastValue = elt.value;
                        }
                    }
                    if (elementData.delayed) {
                        clearTimeout(elementData.delayed);
                    }
                    var issueRequest = function(){
                        issueAjaxRequest(elt, verb, path, evt.target);
                    }
                    if (triggerSpec.delay) {
                        elementData.delayed = setTimeout(issueRequest, parseInterval(triggerSpec.delay));
                    } else {
                        issueRequest();
                    }
                }
            };
            nodeData.trigger = triggerSpec.trigger;
            nodeData.eventListener = eventListener;
            elt.addEventListener(triggerSpec.trigger, eventListener);
        }

        function initScrollHandler() {
            if (!window['kuttyScrollHandler']) {
                var scrollHandler = function() {
                    forEach(getDocument().querySelectorAll("[kt-trigger='reveal']"), function (elt) {
                        maybeReveal(elt);
                    });
                };
                window['kuttyScrollHandler'] = scrollHandler;
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
            var detail = {
                initializer: function() { new EventSource(sseSrc, detail.config) },
                config:{withCredentials: true}
            };
            triggerEvent(elt, "initSSE.kutty", {config:detail})
            var source = detail.initializer();
            source.onerror = function (e) {
                triggerEvent(elt, "sseError.kutty", {error:e, source:source});
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
                triggerEvent(elt, "noSSESourceError.kutty")
            }
        }

        function loadImmediately(nodeData, elt, verb, path) {
            if (!nodeData.loaded) {
                nodeData.loaded = true;
                issueAjaxRequest(elt, verb, path);
            }
        }

        function processVerbs(elt, nodeData, triggerSpec) {
            var explicitAction = false;
            forEach(VERBS, function (verb) {
                var path = getAttributeValue(elt, 'kt-' + verb);
                if (path) {
                    explicitAction = true;
                    nodeData.path = path;
                    nodeData.verb = verb;
                    if (triggerSpec.sseEvent) {
                        processSSETrigger(triggerSpec.sseEvent, elt, verb, path);
                    } else if (triggerSpec.trigger === "revealed") {
                        initScrollHandler();
                        maybeReveal(elt);
                    } else if (triggerSpec.trigger === "load") {
                        loadImmediately(nodeData, elt, verb, path);
                    } else if (triggerSpec.pollInterval) {
                        nodeData.polling = true;
                        processPolling(elt, verb, path, triggerSpec.pollInterval);
                    } else {
                        addEventListener(elt, verb, path, nodeData, triggerSpec);
                    }
                }
            });
            return explicitAction;
        }

        function processNode(elt) {
            var nodeData = getInternalData(elt);
            if (!nodeData.processed) {
                nodeData.processed = true;

                var triggerSpec = getTriggerSpec(elt);
                var explicitAction = processVerbs(elt, nodeData, triggerSpec);

                if (!explicitAction && getClosestAttributeValue(elt, "kt-boost") === "true") {
                    boostElement(elt, nodeData, triggerSpec);
                }
                var sseSrc = getAttributeValue(elt, 'kt-sse-source');
                if (sseSrc) {
                    initSSESource(elt, sseSrc);
                }
                var addClass = getAttributeValue(elt, 'kt-classes');
                if (addClass) {
                    processClassList(elt, addClass);
                }
            }
            if (elt.children) { // IE
                forEach(elt.children, function(child) { processNode(child) });
            }
        }

        //====================================================================
        // Event/Log Support
        //====================================================================

        function sendError(elt, eventName, detail) {
            var errorURL = getClosestAttributeValue(elt, "kt-error-url");
            if (errorURL) {
                var xhr = new XMLHttpRequest();
                xhr.open("POST", errorURL);
                xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                xhr.send(JSON.stringify({ "elt": elt.id, "event": eventName, "detail" : detail }));
            }
        }

        function makeEvent(eventName, detail) {
            var evt;
            if (window.CustomEvent && typeof window.CustomEvent === 'function') {
                evt = new CustomEvent(eventName, {bubbles: true, cancelable: true, detail: detail});
            } else {
                evt = getDocument().createEvent('CustomEvent');
                evt.initCustomEvent(eventName, true, true, detail);
            }
            return evt;
        }

        function triggerEvent(elt, eventName, detail) {
            detail["elt"] = elt;
            var event = makeEvent(eventName, detail);
            if (kutty.logger) {
                kutty.logger(elt, eventName, detail);
                if (eventName.indexOf("Error") > 0) {
                    sendError(elt, eventName, detail);
                }
            }
            var eventResult = elt.dispatchEvent(event);
            var allResult = elt.dispatchEvent(makeEvent("all.kutty", {elt:elt, originalDetail:detail, originalEvent: event}));
            return eventResult && allResult;
        }

        function addKuttyEventListener(arg1, arg2, arg3) {
            var target, event, listener;
            if (isFunction(arg1)) {
                ready(function(){
                    target = getDocument().body;
                    event = "all.kutty";
                    listener = arg1;
                    target.addEventListener(event, listener);
                })
            } else if (isFunction(arg2)) {
                ready(function () {
                    target = getDocument().body;
                    event = arg1;
                    listener = arg2;
                    target.addEventListener(event, listener);
                })
            } else {
                target = arg1;
                event = arg2;
                listener = arg3;
                target.addEventListener(event, listener);
            }
        }

        //====================================================================
        // History Support
        //====================================================================
        function getHistoryElement() {
            var historyElt = getDocument().querySelector('.kutty-history-elt');
            return historyElt || getDocument().body;
        }

        function purgeOldestPaths(paths, historyTimestamps) {
            paths = paths.sort(function (path1, path2) {
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
            var historyTimestamps = JSON.parse(localStorage.getItem("kt-history-timestamps")) || {};
            historyTimestamps[pathAndSearch] = Date.now();
            var paths = Object.keys(historyTimestamps);
            if (paths.length > 20) {
                purgeOldestPaths(paths, historyTimestamps);
            }
            localStorage.setItem("kt-history-timestamps", JSON.stringify(historyTimestamps));
        }

        function saveHistory() {
            var elt = getHistoryElement();
            var pathAndSearch = location.pathname+location.search;
            triggerEvent(getDocument().body, "historyUpdate.kutty", {path:pathAndSearch, historyElement:elt});
            history.replaceState({}, getDocument().title, window.location.href);
            localStorage.setItem('kt-history:' + pathAndSearch, elt.innerHTML);
            bumpHistoryAccessDate(pathAndSearch);
        }

        function pushUrlIntoHistory(url) {
            history.pushState({}, "", url );
        }

        function settleImmediately(settleTasks) {
            forEach(settleTasks, function (task) {
                task.call();
            });
        }

        function loadHistoryFromServer(pathAndSearch) {
            triggerEvent(getDocument().body, "historyCacheMiss.kutty", {path: pathAndSearch});
            var request = new XMLHttpRequest();
            request.open('GET', pathAndSearch, true);
            request.onload = function () {
                triggerEvent(getDocument().body, "historyCacheMissLoad.kutty", {path: pathAndSearch});
                if (this.status >= 200 && this.status < 400) {
                    var fragment = makeFragment(this.response);
                    fragment = fragment.querySelector('.kutty-history-elt') || fragment;
                    settleImmediately(swapInnerHTML(getHistoryElement(), fragment));
                }
            };
        }

        function restoreHistory() {
            var pathAndSearch = location.pathname+location.search;
            triggerEvent(getDocument().body, "historyRestore.kutty", {path:pathAndSearch});
            var content = localStorage.getItem('kt-history:' + pathAndSearch);
            if (content) {
                bumpHistoryAccessDate(pathAndSearch);
                settleImmediately(swapInnerHTML(getHistoryElement(), makeFragment(content)));
            } else {
                loadHistoryFromServer(pathAndSearch);
            }
        }

        function shouldPush(elt) {
            return getClosestAttributeValue(elt, "kt-push-url") === "true" ||
                (elt.tagName === "A" && getInternalData(elt).boosted);
        }

        function addRequestIndicatorClasses(elt) {
            mutateRequestIndicatorClasses(elt, "add");
        }

        function removeRequestIndicatorClasses(elt) {
            mutateRequestIndicatorClasses(elt, "remove");
        }

        function mutateRequestIndicatorClasses(elt, action) {
            var indicator = getClosestAttributeValue(elt, 'kt-indicator');
            if (indicator) {
                var indicators = getDocument().querySelectorAll(indicator);
            } else {
                indicators = [elt];
            }
            forEach(indicators, function(ic) {
                ic.classList[action].call(ic.classList, "kutty-request");
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

        function shouldInclude(elt) {
            if(elt.name === "" || elt.name == null || elt.disabled) {
                return false;
            }
            // ignore "submitter" types (see jQuery src/serialize.js)
            if (elt.type === "button" || elt.type === "submit" || elt.tagName === "image" || elt.tagName === "reset" || elt.tagName === "file" ) {
                return false;
            }
            if (elt.type === "checkbox" || elt.type === "radio" ) {
                return elt.checked;
            }
        }

        function processInputValue(processed, values, elt) {
            if (elt == null || haveSeenNode(processed, elt)) {
                return;
            } else {
                processed.push(elt);
            }
            if (shouldInclude(elt)) {
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
            var includes = getClosestAttributeValue(elt, "kt-include");
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
            xhr.setRequestHeader((noPrefix ? "" : "X-KT-") + name, value || "");
        }

        function setRequestHeaders(xhr, elt, target, prompt, eventTarget) {
            setHeader(xhr, "Request", "true");
            setHeader(xhr, "Trigger-Id", getRawAttribute(elt, "id"));
            setHeader(xhr, "Trigger-Name", getRawAttribute(elt, "name"));
            setHeader(xhr, "Target-Id", getRawAttribute(target, "id"));
            setHeader(xhr, "Current-URL", getDocument().location.href);
            if (prompt) {
                setHeader(xhr, "Prompt", prompt);
            }
            if (eventTarget) {
                setHeader(xhr, "Event-Target", getRawAttribute(eventTarget, "id"));
            }
            if (getDocument().activeElement) {
                setHeader(xhr, "Active-Element", getRawAttribute(getDocument().activeElement, "id"));
                // noinspection JSUnresolvedVariable
                if (getDocument().activeElement.value) {
                    setHeader(xhr, "Active-Element-Value", getDocument().activeElement.value);
                }
            }
        }

        function filterValues(inputValues, elt, verb) {
            var paramsValue = getClosestAttributeValue(elt, "kt-params");
            if (paramsValue) {
                if (paramsValue === "none") {
                    return {};
                } else if (paramsValue === "*") {
                    return inputValues;
                } else if(paramsValue.indexOf("not ") === 0) {
                    forEach(paramsValue.substr(4).split(","), function (value) {
                        value = value.trim();
                        delete inputValues[value];
                    });
                    return inputValues;
                } else {
                    var newValues = {}
                    forEach(paramsValue.split(","), function (value) {
                        newValues[value] = inputValues[value];
                    });
                    return newValues;
                }
            } else {
                // By default GET does not include parameters
                if (verb === 'get') {
                    return {};
                } else {
                    return inputValues;
                }
            }
        }

        function getSwapSpecification(elt) {
            var swapInfo = getClosestAttributeValue(elt, "kt-swap");
            var swapSpec = {
                "swapStyle" : "innerHTML",
                "swapDelay" : 0,
                "settleDelay" : 100
            }
            if (swapInfo) {
                var split = splitOnWhitespace(swapInfo);
                if (split.length > 0) {
                    swapSpec["swapStyle"] = split[0];
                    for (var i = 1; i < swapSpec.length; i++) {
                        var modifier = swapSpec[i];
                        if (modifier.indexOf("swap:") === 0) {
                            swapSpec["swapDelay"] = parseInterval(modifier.substr(5));
                        }
                        if (modifier.indexOf("settle:") === 0) {
                            swapSpec["settleDelay"] = parseInterval(modifier.substr(7));
                        }
                    }
                }
            }
            return swapSpec;
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
            var promptQuestion = getClosestAttributeValue(elt, "kt-prompt");
            if (promptQuestion) {
                var prompt = prompt(promptQuestion);
                if(!triggerEvent(elt, 'prompt.kutty', {prompt: prompt, target:target})) return endRequestLock();
            }

            var confirmQuestion = getClosestAttributeValue(elt, "kt-confirm");
            if (confirmQuestion) {
                if(!confirm(confirmQuestion)) return endRequestLock();
            }

            var xhr = new XMLHttpRequest();

            var inputValues = getInputValues(elt, verb);

            inputValues = filterValues(inputValues, elt, verb);

            if(!triggerEvent(elt, 'values.kutty', {values: inputValues, target:target})) return endRequestLock();

            // request type
            var requestURL;
            if (verb === 'get') {
                var noValues = Object.keys(inputValues).length === 0;
                requestURL = path + (noValues ? "" : "?" + urlEncode(inputValues));
                xhr.open('GET', requestURL, true);
            } else {
                requestURL = path;
                xhr.open('POST', requestURL, true);
                setHeader(xhr,'Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8', true);
                if (verb !== 'post') {
                    setHeader(xhr, 'X-HTTP-Method-Override', verb.toUpperCase(), true);
                }
            }

            // TODO  IE10 compatibility?
            xhr.overrideMimeType("text/html");

            // request headers
            setRequestHeaders(xhr, elt, target, prompt, eventTarget);

            xhr.onload = function () {
                try {
                    if (!triggerEvent(elt, 'beforeOnLoad.kutty', {xhr: xhr, target: target})) return;

                    handleTrigger(elt, this.getResponseHeader("X-KT-Trigger"));
                    var pushedUrl = this.getResponseHeader("X-KT-Push")

                    var shouldSaveHistory = shouldPush(elt) || pushedUrl;

                    if (this.status >= 200 && this.status < 400) {
                        // don't process 'No Content' response
                        if (this.status !== 204) {
                            // Success!
                            var resp = this.response;
                            if (!triggerEvent(elt, 'beforeSwap.kutty', {xhr: xhr, target: target, response:resp})) return;

                            // Save current page
                            if (shouldSaveHistory) {
                                saveHistory();
                            }

                            var swapSpec = getSwapSpecification(elt);

                            target.classList.add("kutty-swapping");
                            var doSwap = function () {
                                try {
                                    var settleTasks = swapResponse(swapSpec.swapStyle, target, elt, resp);
                                    target.classList.remove("kutty-swapping");
                                    target.classList.add("kutty-settling");
                                    triggerEvent(elt, 'afterSwap.kutty', {xhr: xhr, target: target});

                                    var doSettle = function(){
                                        forEach(settleTasks, function (settleTask) {
                                            settleTask.call();
                                        });
                                        target.classList.remove("kutty-settling");
                                        // push URL and save new page
                                        if (shouldSaveHistory) {
                                            pushUrlIntoHistory(pushedUrl || requestURL );
                                            saveHistory();
                                        }
                                        triggerEvent(elt, 'afterSettle.kutty', {xhr: xhr, target: target});
                                    }

                                    if (swapSpec.settleDelay > 0) {
                                        setTimeout(doSettle, swapSpec.settleDelay)
                                    } else {
                                        doSettle();
                                    }
                                } catch (e) {
                                    triggerEvent(elt, 'swapError.kutty', {xhr: xhr, response: xhr.response, status: xhr.status, target: target});
                                    throw e;
                                }
                            };

                            if (swapSpec.swapDelay > 0) {
                                setTimeout(doSwap, parseInterval(swapSpec.swapDelay))
                            } else {
                                doSwap();
                            }
                        }
                    } else {
                        triggerEvent(elt, 'responseError.kutty', {xhr: xhr, response: xhr.response, status: xhr.status, target: target});
                    }
                } catch (e) {
                    triggerEvent(elt, 'onLoadError.kutty', {xhr: xhr, response: xhr.response, status: xhr.status, target: target});
                    throw e;
                } finally {
                    removeRequestIndicatorClasses(elt);
                    endRequestLock();
                    triggerEvent(elt, 'afterOnLoad.kutty', {xhr: xhr, response: xhr.response, status: xhr.status, target: target});
                }
            }
            xhr.onerror = function () {
                removeRequestIndicatorClasses(elt);triggerEvent(elt, 'sendError.kutty', {xhr:xhr});
                endRequestLock();
            }
            if(!triggerEvent(elt, 'beforeRequest.kutty', {xhr:xhr, values: inputValues, target:target})) return endRequestLock();
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

        // insert kutty-indicator css rules
        addRule(".kutty-indicator{opacity:0;transition: opacity 200ms ease-in;}");
        addRule(".kutty-request .kutty-indicator{opacity:1}");
        addRule(".kutty-request.kutty-indicator{opacity:1}");

        // initialize the document
        ready(function () {
            var body = getDocument().body;
            processNode(body);
            triggerEvent(body, 'load.kutty', {elt: body});
            window.onpopstate = function () {
                restoreHistory();
            };
        })

        function internalEval(str){
            return eval(str);
        }

        function onLoadHelper(callback) {
            kutty.on("load.kutty", function(evt) {
                callback(evt.detail.elt);
            });
        }

        // Public API
        return {
            processElement: processNode,
            on: addKuttyEventListener,
            onLoad: onLoadHelper,
            version: "0.0.1",
            _:internalEval
        }
    }
)();