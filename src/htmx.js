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

        function isRawObject(o) {
            return Object.prototype.toString.call(o) === "[object Object]";
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

        function directSwap(child) {
            var swapDirect = getAttributeValue(child, 'hx-swap-direct');
            if (swapDirect) {
                var target = getDocument().getElementById(getRawAttribute(child,'id'));
                if (target) {
                    if (swapDirect === "merge") {
                        mergeInto(target, child);
                    } else {
                        var newParent = parentElt(target);
                        newParent.insertBefore(child, target);
                        newParent.removeChild(target);
                        return true;
                    }
                }
            }
            return false;
        }

        function processResponseNodes(parentNode, insertBefore, text, executeAfter) {
            var fragment = makeFragment(text);
            forEach(toArray(fragment.childNodes), function(child){
                if (!directSwap(child)) {
                    parentNode.insertBefore(child, insertBefore);
                }
                if (child.nodeType !== Node.TEXT_NODE) {
                    triggerEvent(child, 'load.hx', {parent:parentElt(child)});
                    processNode(child);
                }
            })
            if(executeAfter) {
                executeAfter.call();
            }
        }

        function findMatch(elt, possible) {
            for (var i = 0; i < possible.length; i++) {
                var candidate = possible[i];
                if (elt.hasAttribute("id") && elt.id === candidate.id) {
                    return candidate;
                }
                if (!candidate.hasAttribute("id") && elt.tagName === candidate.tagName) {
                    return candidate;
                }
            }
            return null;
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

        function mergeChildren(mergeTo, mergeFrom) {
            var oldChildren = toArray(mergeTo.children);
            var marker = getDocument().createElement("span");
            mergeTo.insertBefore(marker, mergeTo.firstChild);
            forEach(mergeFrom.childNodes, function (newChild) {
                var match = findMatch(newChild, oldChildren);
                if (match) {
                    while (marker.nextSibling && marker.nextSibling !== match) {
                        mergeTo.removeChild(marker.nextSibling);
                    }
                    mergeTo.insertBefore(marker, match.nextSibling);
                    mergeInto(match, newChild);
                } else {
                    mergeTo.insertBefore(newChild, marker);
                }
            });
            while (marker.nextSibling) {
                mergeTo.removeChild(marker.nextSibling);
            }
            mergeTo.removeChild(marker);
        }

        function mergeInto(mergeTo, mergeFrom) {
            cloneAttributes(mergeTo, mergeFrom);
            mergeChildren(mergeTo, mergeFrom);
        }

        function mergeResponse(target, resp) {
            var fragment = makeFragment(resp);
            mergeInto(target, fragment.firstElementChild);
        }

        function swapResponse(target, elt, resp, after) {
            var swapStyle = getClosestAttributeValue(elt, "hx-swap");
            if (swapStyle === "merge") {
                mergeResponse(target, resp);
            } else if (swapStyle === "outerHTML") {
                processResponseNodes(parentElt(target), target, resp, after);
                parentElt(target).removeChild(target);
            } else if (swapStyle === "prepend") {
                processResponseNodes(target, target.firstChild, resp, after);
            } else if (swapStyle === "prependBefore") {
                processResponseNodes(parentElt(target), target, resp, after);
            } else if (swapStyle === "append") {
                processResponseNodes(target, null, resp, after);
            } else if (swapStyle === "appendAfter") {
                processResponseNodes(parentElt(target), target.nextSibling, resp, after);
            } else {
                target.innerHTML = "";
                processResponseNodes(target, null, resp, after);
            }
        }

        function triggerEvent(elt, eventName, details) {
            details["elt"] = elt;
            var event;
            if (window.CustomEvent && typeof window.CustomEvent === 'function') {
                 event = new CustomEvent(eventName, {detail: details});
            } else {
                event = getDocument().createEvent('CustomEvent');
                event.initCustomEvent(eventName, true, true, details);
            }
            return elt.dispatchEvent(event);
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
                        if (getDocument().body.contains(elt)) {
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
                if (!eventData.handled) {
                    eventData.handled = true;
                    issueAjaxRequest(elt, verb, path, evt.target);
                }
            };
            nodeData.trigger = trigger;
            nodeData.eventListener = eventListener;
            elt.addEventListener(trigger, eventListener);
        }

        function processNode(elt) {
            var nodeData = getInternalData(elt);
            if (!nodeData.processed) {
                nodeData.processed = true;
                var trigger = getTrigger(elt);
                var explicitAction = false;
                forEach(VERBS, function(verb){
                    var path = getAttributeValue(elt, 'hx-' + verb);
                    if (path) {
                        explicitAction = true;
                        if (trigger === 'load') {
                            if (!nodeData.loaded) {
                                nodeData.loaded = true;
                                issueAjaxRequest(elt, verb, path);
                            }
                        } else if (trigger.trim().indexOf('every ') === 0) {
                            nodeData.polling = true;
                            processPolling(elt, verb, path);
                        } else {
                            addEventListener(elt, verb, path, nodeData, trigger);
                        }
                    }
                });
                if (!explicitAction && getClosestAttributeValue(elt, "hx-boost") == "true") {
                    boostElement(elt, nodeData, trigger);
                }
                if (getAttributeValue(elt, 'hx-add-class')) {
                    processClassList(elt, getAttributeValue(elt, 'hx-add-class'), "add");
                }
                if (getAttributeValue(elt, 'hx-remove-class')) {
                    processClassList(elt, getAttributeValue(elt, 'hx-remove-class'), "remove");
                }
            }
            forEach(elt.children, function(child) { processNode(child) });
        }

        //====================================================================
        // History Support
        //====================================================================

        function makeHistoryId() {
            return Math.random().toString(36).substr(3, 9);
        }

        function getHistoryElement() {
            var historyElt = getDocument().getElementsByClassName('hx-history-element');
            if (historyElt.length > 0) {
                return historyElt[0];
            } else {
                return getDocument().body;
            }
        }

        function saveLocalHistoryData(historyData) {
            localStorage.setItem('hx-history', JSON.stringify(historyData));
        }

        function getLocalHistoryData() {
            var historyEntry = localStorage.getItem('hx-history');
            var historyData;
            if (historyEntry) {
                historyData = JSON.parse(historyEntry);
            } else {
                var initialId = makeHistoryId();
                historyData = {"current": initialId, "slots": [initialId]};
                saveLocalHistoryData(historyData);
            }
            return historyData;
        }

        function newHistoryData() {
            var historyData = getLocalHistoryData();
            var newId = makeHistoryId();
            var slots = historyData.slots;
            if (slots.length > 20) {
                var toEvict = slots.shift();
                localStorage.removeItem('hx-history-' + toEvict);
            }
            slots.push(newId);
            historyData.current = newId;
            saveLocalHistoryData(historyData);
        }

        function updateCurrentHistoryContent() {
            var elt = getHistoryElement();
            var historyData = getLocalHistoryData();
            history.replaceState({"hx-history-key": historyData.current}, getDocument().title, window.location.href);
            localStorage.setItem('hx-history-' + historyData.current, elt.innerHTML);
        }

        function restoreHistory(data) {
            var historyKey = data['hx-history-key'];
            var content = localStorage.getItem('hx-history-' + historyKey);
            var elt = getHistoryElement();
            elt.innerHTML = "";
            processResponseNodes(elt, null, content);
        }

        function shouldPush(elt) {
            return getClosestAttributeValue(elt, "hx-push-url") === "true" ||
                (elt.tagName === "A" && getInternalData(elt).boosted);
        }

        function snapshotForCurrentHistoryEntry(elt) {
            if (shouldPush(elt)) {
                // TODO event to allow de-initialization of HTML elements in target
                updateCurrentHistoryContent();
            }
        }

        function initNewHistoryEntry(elt, url) {
            if (shouldPush(elt)) {
                newHistoryData();
                history.pushState({}, "", url);
                updateCurrentHistoryContent();
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
            return Object.keys(values).length === 0 ? null : values;
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
                xhr.open('GET', path + (inputValues ? "?" + urlEncode(inputValues) : ""), true);
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
                if (getDocument().activeElement.value) {
                    setHeader(xhr,"Active-Element-Value", getDocument().activeElement.value);
                }
            }

            xhr.onload = function () {
                try {
                    if(!triggerEvent(elt, 'beforeOnLoad.hx', {xhr:xhr, target:target})) return;
                    snapshotForCurrentHistoryEntry(elt, path);
                    var trigger = this.getResponseHeader("X-HX-Trigger");
                    handleTrigger(elt, trigger);
                    initNewHistoryEntry(elt, path);
                    if (this.status >= 200 && this.status < 400) {
                        // don't process 'No Content' response
                        if (this.status !== 204) {
                            // Success!
                            var resp = this.response;
                            if(!triggerEvent(elt, 'beforeSwap.hx', {xhr:xhr, target:target})) return;
                            swapResponse(target, elt, resp, function(){
                                updateCurrentHistoryContent();
                                triggerEvent(elt, 'afterSwap.hx', {xhr:xhr, target:target});
                            });
                        }
                    } else {
                        triggerEvent(elt, 'errorResponse.hx', {xhr:xhr, response: xhr.response, status: xhr.status, target:target});
                    }
                } finally {
                    removeRequestIndicatorClasses(elt);
                    triggerEvent(elt, 'afterOnLoad.hx', {xhr:xhr, response: xhr.response, status: xhr.status, target:target});
                    endRequestLock();
                }
            };
            xhr.onerror = function () {
                removeRequestIndicatorClasses(elt);
                triggerEvent(elt, 'onError.hx', {xhr:xhr});
                endRequestLock();
            };

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
                restoreHistory(event.state);
            };
        })

        function internalEval(str){
            return eval(str);
        }

        // Public API
        return {
            processElement: processNode,
            version: "0.0.1",
            _:internalEval
        }
    }
)();