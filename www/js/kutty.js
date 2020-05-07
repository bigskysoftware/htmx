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

        function makeFragment(resp) {
            // var range = getDocument().createRange();
            // return range.createContextualFragment(resp);
            var parser = new DOMParser();
            var responseDoc = parser.parseFromString(resp, "text/html");
            return responseDoc.body;
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

        function concat(arr1, arr2) {
            return arr1.concat(arr2);
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
            forEach(fragment.children, function(child){
                if (getAttributeValue(child, "kt-swap-oob") === "true") {
                    var target = getDocument().getElementById(child.id);
                    if (target) {
                        var fragment = new DocumentFragment()
                        fragment.append(child);
                        settleTasks = settleTasks.concat(swapOuterHTML(target, fragment));
                    } else {
                        child.parentNode.removeChild(child);
                        triggerEvent(getDocument().body, "oobErrorNoTarget.kutty", {id:child.id, content:child})
                    }
                }
            })
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

        function swapPrepend(target, fragment) {
            return insertNodesBefore(target, target.firstChild, fragment);
        }

        function swapPrependBefore(target, fragment) {
            return insertNodesBefore(parentElt(target), target, fragment);
        }

        function swapAppend(target, fragment) {
            return insertNodesBefore(target, null, fragment);
        }

        function swapAppendAfter(target, fragment) {
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
                var newFragment = new DocumentFragment();
                forEach(fragment.querySelectorAll(selector), function (node) {
                    newFragment.append(node);
                });
                fragment = newFragment;
            }
            return fragment;
        }

        function swapResponse(target, elt, responseText) {
            var fragment = makeFragment(responseText);
            var settleTasks = handleOutOfBandSwaps(fragment);

            fragment = maybeSelectFromResponse(elt, fragment);

            var swapStyle = getClosestAttributeValue(elt, "kt-swap");
            switch(swapStyle) {
                case "outerHTML": return concat(settleTasks, swapOuterHTML(target, fragment));
                case "prepend": return concat(settleTasks, swapPrepend(target, fragment));
                case "prependBefore": return concat(settleTasks, swapPrependBefore(target, fragment));
                case "append": return concat(settleTasks, swapAppend(target, fragment));
                case "appendAfter": return concat(settleTasks, swapAppendAfter(target, fragment));
                default: return concat(settleTasks, swapInnerHTML(target, fragment));
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
            var explicitTrigger = getClosestAttributeValue(elt, 'kt-trigger');
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
                            processPolling(elt, verb, getAttributeValue(elt, "kt-" + verb));
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
                    if (getAttributeValue(elt, "kt-trigger-once") === "true") {
                        if (elementData.triggeredOnce) {
                            return;
                        } else {
                            elementData.triggeredOnce = true;
                        }
                    }
                    if (getAttributeValue(elt, "kt-trigger-changed-only") === "true") {
                        if (elementData.lastValue === elt.value) {
                            return;
                        } else {
                            elementData.lastValue = elt.value;
                        }
                    }
                    if (elementData.delayed) {
                        clearTimeout(elementData.delayed);
                    }
                    var eventDelay = getAttributeValue(elt, "kt-trigger-delay");
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
            var details = {
                initializer: function() { new EventSource(sseSrc, details.config) },
                config:{withCredentials: true}
            };
            triggerEvent(elt, "initSSE.kutty", {config:details})
            var source = details.initializer();
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

        function processVerbs(elt, nodeData, trigger) {
            var explicitAction = false;
            forEach(VERBS, function (verb) {
                var path = getAttributeValue(elt, 'kt-' + verb);
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

                if (!explicitAction && getClosestAttributeValue(elt, "kt-boost") === "true") {
                    boostElement(elt, nodeData, trigger);
                }
                var sseSrc = getAttributeValue(elt, 'kt-sse-source');
                if (sseSrc) {
                    initSSESource(elt, sseSrc);
                }
                var addClass = getAttributeValue(elt, 'kt-add-class');
                if (addClass) {
                    processClassList(elt, addClass, "add");
                }
                var removeClass = getAttributeValue(elt, 'kt-remove-class');
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
            var errorURL = getClosestAttributeValue(elt, "kt-error-url");
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
            if (kutty.logger) {
                kutty.logger(elt, eventName, details);
                if (eventName.indexOf("Error") > 0) {
                    sendError(elt, eventName, details);
                }
            }
            var eventResult = elt.dispatchEvent(event);
            var allResult = elt.dispatchEvent(makeEvent("all.kutty", {elt:elt, originalDetails:details, originalEvent: event}));
            return eventResult && allResult;
        }

        function addKuttyEventListener(arg1, arg2, arg3) {
            var target, event, listener;
            if (isFunction(arg1)) {
                target = getDocument().body;
                event = "all.kutty";
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
            var historyElt = getDocument().querySelector('.kt-history-element');
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
                    fragment = fragment.querySelector('.kt-history-element') || fragment;
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
                ic.classList[action].call(ic.classList, "kutty-show-indicator");
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
            var includes = getAttributeValue(elt, "kt-include");
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

            var inputValues = getInputValues(elt);
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
                            if (!triggerEvent(elt, 'beforeSwap.kutty', {xhr: xhr, target: target})) return;

                            // Save current page
                            if (shouldSaveHistory) {
                                saveHistory();
                            }

                            target.classList.add("kutty-swapping");
                            var doSwap = function () {
                                try {
                                    var settleTasks = swapResponse(target, elt, resp);
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

                                    var settleDelayStr = getAttributeValue(elt, "kt-settle-delay") || "100ms";
                                    if (settleDelayStr) {
                                        setTimeout(doSettle, parseInterval(settleDelayStr))
                                    } else {
                                        doSettle();
                                    }
                                } catch (e) {
                                    triggerEvent(elt, 'swapError.kutty', {xhr: xhr, response: xhr.response, status: xhr.status, target: target});
                                    throw e;
                                }
                            };

                            var swapDelayStr = getAttributeValue(elt, "kt-swap-delay");
                            if (swapDelayStr) {
                                setTimeout(doSwap, parseInterval(swapDelayStr))
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
                removeRequestIndicatorClasses(elt);triggerEvent(elt, 'loadError.kutty', {xhr:xhr});
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
            on: addKuttyEventListener,
            version: "0.0.1",
            _:internalEval
        }
    }
)();