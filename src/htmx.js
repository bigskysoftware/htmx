var HTMx = HTMx || (function () {
        'use strict';

        var VERBS = ['get', 'post', 'put', 'delete', 'patch']

        function parseInterval(str) {
            if (str === "null" || str === "false" || str === "") {
                return null;
            } else if (str.lastIndexOf("ms") === str.length - 2) {
                return parseFloat(str.substr(0, str.length - 2));
            } else if (str.lastIndexOf("s") === str.length - 1) {
                return parseFloat(str.substr(0, str.length - 1)) * 1000;
            } else {
                return 1000;
            }
        }

        // resolve with both hx and data-hx prefixes
        function getAttributeValue(elt, qualifiedName) {
            return elt.getAttribute(qualifiedName) || elt.getAttribute("data-" + qualifiedName);
        }

        function getClosestAttributeValue(elt, attributeName) {
            var attribute = getAttributeValue(elt, attributeName);
            if (attribute) {
                return attribute;
            } else if (elt.parentElement) {
                return getClosestAttributeValue(elt.parentElement, attributeName);
            } else {
                return null;
            }
        }

        function getTarget(elt) {
            var targetVal = getClosestAttributeValue(elt, "hx-target");
            if (targetVal) {
                return document.querySelector(targetVal);
            } else {
                return elt;
            }
        }

        function makeFragment(resp) {
            var range = document.createRange();
            return range.createContextualFragment(resp);
        }

        function processResponseNodes(parent, target, text, after) {
            var fragment = makeFragment(text);
            for (var i = fragment.childNodes.length - 1; i >= 0; i--) {
                var child = fragment.childNodes[i];
                parent.insertBefore(child, target);
                if (child.nodeType !== Node.TEXT_NODE) {
                    processElement(child);
                }
            }
            if(after) {
                after.call();
            }
        }

        function swapResponse(target, elt, resp, after) {
            var swapStyle = getClosestAttributeValue(elt, "hx-swap");
            if (swapStyle === "outerHTML") {
                processResponseNodes(target.parentElement, target, resp, after);
                target.parentElement.removeChild(target);
            } else if (swapStyle === "prepend") {
                processResponseNodes(target, target.firstChild, resp, after);
            } else if (swapStyle === "prependBefore") {
                processResponseNodes(target.parentElement, target, resp, after);
            } else if (swapStyle === "append") {
                processResponseNodes(target, null, resp, after);
            } else if (swapStyle === "appendAfter") {
                processResponseNodes(target.parentElement, target.nextSibling, resp, after);
            } else {
                target.innerHTML = "";
                processResponseNodes(target, null, resp, after);
            }
        }

        function triggerEvent(elt, eventName, details) {
            details["elt"] = elt;
            if (window.CustomEvent && typeof window.CustomEvent === 'function') {
                var event = new CustomEvent(eventName, {detail: details});
            } else {
                var event = document.createEvent('CustomEvent');
                event.initCustomEvent(eventName, true, true, details);
            }
            elt.dispatchEvent(event);
        }

        function isRawObject(o) {
            return Object.prototype.toString.call(o) === "[object Object]";
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

        function makeHistoryId() {
            return Math.random().toString(36).substr(3, 9);
        }

        function getHistoryElement() {
            var historyElt = document.getElementsByClassName('hx-history-element');
            if (historyElt.length > 0) {
                return historyElt[0];
            } else {
                return document.body;
            }
        }

        function saveLocalHistoryData(historyData) {
            localStorage.setItem('hx-history', JSON.stringify(historyData));
        }

        function getLocalHistoryData() {
            var historyEntry = localStorage.getItem('hx-history');
            if (historyEntry) {
                var historyData = JSON.parse(historyEntry);
            } else {
                var initialId = makeHistoryId();
                var historyData = {"current": initialId, "slots": [initialId]};
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
            history.replaceState({"hx-history-key": historyData.current}, document.title, window.location.href);
            localStorage.setItem('hx-history-' + historyData.current, elt.innerHTML);
        }

        function restoreHistory(data) {
            var historyKey = data['hx-history-key'];
            var content = localStorage.getItem('hx-history-' + historyKey);
            var elt = getHistoryElement();
            elt.innerHTML = "";
            processResponseNodes(elt, null, content);
        }

        function snapshotForCurrentHistoryEntry(elt) {
            if (getClosestAttributeValue(elt, "hx-push-url") === "true") {
                // TODO event to allow deinitialization of HTML elements in target
                updateCurrentHistoryContent();
            }
        }

        function initNewHistoryEntry(elt, url) {
            if (getClosestAttributeValue(elt, "hx-push-url") === "true") {
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
                var indicators = document.querySelectorAll(indicator);
            } else {
                indicators = [elt];
            }
            for (var i = 0; i < indicators.length; i++) {
                indicators[i].classList[action].call(indicators[i].classList, "hx-show-indicator");
            }
        }

        // core ajax request
        function issueAjaxRequest(elt, verb, path) {
            var target = getTarget(elt);
            if (getClosestAttributeValue(elt, "hx-prompt")) {
                var prompt = prompt(getClosestAttributeValue(elt, "hx-prompt"));
            }

            var xhr = new XMLHttpRequest();

            // request type
            if (verb === 'get') {
                xhr.open('GET', path, true);
            } else {
                xhr.open('POST', path, true);
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
                if (verb !== 'post') {
                    xhr.setRequestHeader('X-HTTP-Method-Override', verb.toUpperCase());
                }
            }

            // TODO  IE10 compatibility?
            xhr.overrideMimeType("text/html");

            // request headers
            xhr.setRequestHeader("X-HX-Request", "true");
            xhr.setRequestHeader("X-HX-Trigger-Id", elt.getAttribute("id") || "");
            xhr.setRequestHeader("X-HX-Trigger-Name", elt.getAttribute("name") || "");
            xhr.setRequestHeader("X-HX-Target-Id", target.getAttribute("id") || "");
            xhr.setRequestHeader("X-HX-Current-URL", document.location.href);
            if (prompt) {
                xhr.setRequestHeader("X-HX-Prompt", prompt);
            }

            // request variables


            xhr.onload = function () {
                snapshotForCurrentHistoryEntry(elt, path);
                var trigger = this.getResponseHeader("X-HX-Trigger");
                handleTrigger(elt, trigger);
                initNewHistoryEntry(elt, path);
                if (this.status >= 200 && this.status < 400) {
                    // don't process 'No Content' response
                    if (this.status != 204) {
                        // Success!
                        var resp = this.response;
                        swapResponse(target, elt, resp, function(){
                            updateCurrentHistoryContent();
                        });
                    }
                } else {
                    // TODO error handling
                    elt.innerHTML = "ERROR";
                }
                removeRequestIndicatorClasses(elt);
            };
            xhr.onerror = function () {
                removeIndicatorClasses(elt);
                elt.innerHTML = "ERROR";
                // TODO error handling
                // There was a connection error of some sort
            };
            addRequestIndicatorClasses(elt);
            xhr.send();
        }

        function matches(el, selector) {
            return (el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector).call(el, selector);
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

        // DOM element processing
        function processClassList(elt, classList, operation) {
            var values = classList.split(",");
            for (var i = 0; i < values.length; i++) {
                var cssClass = "";
                var delay = 50;
                if (values[i].trim().indexOf(":") > 0) {
                    var split = values[i].trim().split(':');
                    cssClass = split[0];
                    delay = parseInterval(split[1]);
                } else {
                    cssClass = values[i].trim();
                }
                setTimeout(function () {
                    elt.classList[operation].call(elt.classList, cssClass);
                }, delay);
            }
        }

        function processPolling(elt, verb, path) {
            var trigger = getTrigger(elt);
            if (trigger.trim().indexOf("every ") === 0) {
                var args = trigger.split(/\s+/);
                var intervalStr = args[1];
                if (intervalStr) {
                    var interval = parseInterval(intervalStr);
                    // TODO store for cancelling
                    var timeout = setTimeout(function () {
                        if (document.body.contains(elt)) {
                            issueAjaxRequest(elt, verb, path);
                            processPolling(elt, verb, getAttributeValue(etl, "hx-" + verb));
                        }
                    }, interval);
                }
            }
        }

        function processElement(elt) {
            for (var i = 0; i < VERBS.length; i++) {
                var verb = VERBS[i];
                var path = getAttributeValue(elt, 'hx-' + verb);
                if (path) {
                    var trigger = getTrigger(elt);
                    if (trigger === 'load') {
                        issueAjaxRequest(elt, verb, path);
                    } else if (trigger.trim().indexOf('every ') === 0) {
                        processPolling(elt, action);
                    } else {
                        elt.addEventListener(trigger, function (evt) {
                            issueAjaxRequest(elt, verb, path);
                            evt.stopPropagation();
                        });
                    }
                    break;
                }
            }
            if (getAttributeValue(elt, 'hx-add-class')) {
                processClassList(elt, getAttributeValue(elt, 'hx-add-class'), "add");
            }
            if (getAttributeValue(elt, 'hx-remove-class')) {
                processClassList(elt, getAttributeValue(elt, 'hx-remove-class'), "remove");
            }
            for (var i = 0; i < elt.children.length; i++) {
                var child = elt.children[i];
                processElement(child);
            }
        }

        function ready(fn) {
            if (document.readyState !== 'loading') {
                fn();
            } else {
                document.addEventListener('DOMContentLoaded', fn);
            }
        }

        // initialize the document
        ready(function () {
            processElement(document.body);
            window.onpopstate = function (event) {
                restoreHistory(event.state);
            };
        })

        function internalEval(str){
            return eval(str);
        }

        // Public API
        return {
            processElement: processElement,
            version: "0.0.1",
            _:internalEval
        }
    }

)();