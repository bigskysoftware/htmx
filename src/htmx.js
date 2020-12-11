//AMD insanity
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else {
        // Browser globals
        root.htmx = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
return (function () {
        'use strict';

        // Public API
        var htmx = {
            onLoad: onLoadHelper,
            process: processNode,
            on: addEventListenerImpl,
            off: removeEventListenerImpl,
            trigger : triggerEvent,
            find : find,
            findAll : findAll,
            closest : closest,
            remove : removeElement,
            addClass : addClassToElement,
            removeClass : removeClassFromElement,
            toggleClass : toggleClassOnElement,
            takeClass : takeClassForElement,
            defineExtension : defineExtension,
            removeExtension : removeExtension,
            logAll : logAll,
            logger : null,
            config : {
                historyEnabled:true,
                historyCacheSize:10,
                defaultSwapStyle:'innerHTML',
                defaultSwapDelay:0,
                defaultSettleDelay:100,
                includeIndicatorStyles:true,
                indicatorClass:'htmx-indicator',
                requestClass:'htmx-request',
                settlingClass:'htmx-settling',
                swappingClass:'htmx-swapping',
                attributesToSettle:["class", "style", "width", "height"]
            },
            parseInterval:parseInterval,
            _:internalEval,
            createEventSource: function(url){
                return new EventSource(url, {withCredentials:true})
            },
            createWebSocket: function(url){
                return new WebSocket(url, []);
            }
        };

        var VERBS = ['get', 'post', 'put', 'delete', 'patch'];
        var VERB_SELECTOR = VERBS.map(function(verb){
            return "[hx-" + verb + "], [data-hx-" + verb + "]"
        }).join(", ");

        //====================================================================
        // Utilities
        //====================================================================
        function parseInterval(str) {
            if (str == null || str === "null" || str === "false" || str === "") {
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
        function hasAttribute(elt, qualifiedName) {
            return elt.hasAttribute && (elt.hasAttribute(qualifiedName) ||
                elt.hasAttribute("data-" + qualifiedName));
        }

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
                return closestAttr = getAttributeValue(e, attributeName);
            });
            return closestAttr;
        }

        function matches(elt, selector) {
            // noinspection JSUnresolvedVariable
            var matchesFunction = elt.matches ||
                elt.matchesSelector || elt.msMatchesSelector || elt.mozMatchesSelector
                || elt.webkitMatchesSelector || elt.oMatchesSelector;
            return matchesFunction && matchesFunction.call(elt, selector);
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
            if (responseNode == null) {
                responseNode = getDocument().createDocumentFragment();
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
                case "script":
                    return parseHTML("<div>" + resp + "</div>", 1);
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
            var dataProp = 'htmx-internal-data';
            var data = elt[dataProp];
            if (!data) {
                data = elt[dataProp] = {};
            }
            return data;
        }

        function toArray(arr) {
            var returnArr = [];
            if (arr) {
                for (var i = 0; i < arr.length; i++) {
                    returnArr.push(arr[i]);
                }
            }
            return returnArr
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

        function splitOnWhitespace(trigger) {
            return trigger.trim().split(/\s+/);
        }

        function mergeObjects(obj1, obj2) {
            for (var key in obj2) {
                if (obj2.hasOwnProperty(key)) {
                    obj1[key] = obj2[key];
                }
            }
            return obj1;
        }

        function parseJSON(jString) {
            try {
                return JSON.parse(jString);
            } catch(error) {
                logError(error);
                return null;
            }
        }

        //==========================================================================================
        // public API
        //==========================================================================================

        function internalEval(str){
            return eval(str);
        }

        function onLoadHelper(callback) {
            var value = htmx.on("htmx:load", function(evt) {
                callback(evt.detail.elt);
            });
            return value;
        }

        function logAll(){
            htmx.logger = function(elt, event, data) {
                if(console) {
                    console.log(event, elt, data);
                }
            }
        }

        function find(eltOrSelector, selector) {
            if (selector) {
                return eltOrSelector.querySelector(selector);
            } else {
                return find(getDocument(), eltOrSelector);
            }
        }

        function findAll(eltOrSelector, selector) {
            if (selector) {
                return eltOrSelector.querySelectorAll(selector);
            } else {
                return findAll(getDocument(), eltOrSelector);
            }
        }

        function removeElement(elt, delay) {
            elt = resolveTarget(elt);
            if (delay) {
                setTimeout(function(){removeElement(elt);}, delay)
            } else {
                elt.parentElement.removeChild(elt);
            }
        }

        function addClassToElement(elt, clazz, delay) {
            elt = resolveTarget(elt);
            if (delay) {
                setTimeout(function(){addClassToElement(elt, clazz);}, delay)
            } else {
                elt.classList.add(clazz);
            }
        }

        function removeClassFromElement(elt, clazz, delay) {
            elt = resolveTarget(elt);
            if (delay) {
                setTimeout(function(){removeClassFromElement(elt, clazz);}, delay)
            } else {
                elt.classList.remove(clazz);
            }
        }

        function toggleClassOnElement(elt, clazz) {
            elt = resolveTarget(elt);
            elt.classList.toggle(clazz);
        }

        function takeClassForElement(elt, clazz) {
            elt = resolveTarget(elt);
            forEach(elt.parentElement.children, function(child){
                removeClassFromElement(child, clazz);
            })
            addClassToElement(elt, clazz);
        }

        function closest(elt, selector) {
            elt = resolveTarget(elt);
            do if (elt == null || matches(elt, selector)) return elt;
            while (elt = elt && parentElt(elt));
        }

        function resolveTarget(arg2) {
            if (isType(arg2, 'String')) {
                return find(arg2);
            } else {
                return arg2;
            }
        }

        function processEventArgs(arg1, arg2, arg3) {
            if (isFunction(arg2)) {
                return {
                    target: getDocument().body,
                    event: arg1,
                    listener: arg2
                }
            } else {
                return {
                    target: resolveTarget(arg1),
                    event: arg2,
                    listener: arg3
                }
            }

        }

        function addEventListenerImpl(arg1, arg2, arg3) {
            ready(function(){
                var eventArgs = processEventArgs(arg1, arg2, arg3);
                eventArgs.target.addEventListener(eventArgs.event, eventArgs.listener);
            })
            var b = isFunction(arg2);
            return b ? arg2 : arg3;
        }

        function removeEventListenerImpl(arg1, arg2, arg3) {
            ready(function(){
                var eventArgs = processEventArgs(arg1, arg2, arg3);
                eventArgs.target.removeEventListener(eventArgs.event, eventArgs.listener);
            })
            return isFunction(arg2) ? arg2 : arg3;
        }

        //====================================================================
        // Node processing
        //====================================================================

        function getTarget(elt) {
            var explicitTarget = getClosestMatch(elt, function(e){return getAttributeValue(e,"hx-target") !== null});
            if (explicitTarget) {
                var targetStr = getAttributeValue(explicitTarget, "hx-target");
                if (targetStr === "this") {
                    return explicitTarget;
                } else if (targetStr.indexOf("closest ") === 0) {
                    return closest(elt, targetStr.substr(8));
                } else if (targetStr.indexOf("find ") === 0) {
                    return find(elt, targetStr.substr(5));
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

        function shouldSettleAttribute(name) {
            var attributesToSettle = htmx.config.attributesToSettle;
            for (var i = 0; i < attributesToSettle.length; i++) {
                if (name === attributesToSettle[i]) {
                    return true;
                }
            }
            return false;
        }

        function cloneAttributes(mergeTo, mergeFrom) {
            forEach(mergeTo.attributes, function (attr) {
                if (!mergeFrom.hasAttribute(attr.name) && shouldSettleAttribute(attr.name)) {
                    mergeTo.removeAttribute(attr.name)
                }
            });
            forEach(mergeFrom.attributes, function (attr) {
                if (shouldSettleAttribute(attr.name)) {
                    mergeTo.setAttribute(attr.name, attr.value);
                }
            });
        }

        function isInlineSwap(swapStyle, target) {
            var extensions = getExtensions(target);
            for (var i = 0; i < extensions.length; i++) {
                var extension = extensions[i];
                try {
                    if (extension.isInlineSwap(swapStyle)) {
                        return true;
                    }
                } catch(e) {
                    logError(e);
                }
            }
            return swapStyle === "outerHTML";
        }

        function oobSwap(oobValue, child, settleInfo) {
            if (oobValue === "true") {
                oobValue = "outerHTML"
            }
            var target = getDocument().getElementById(child.id);
            if (target) {
                var fragment;
                fragment = getDocument().createDocumentFragment();
                fragment.appendChild(child); // pulls the child out of the existing fragment
                if (!isInlineSwap(oobValue, target)) {
                    fragment = child; // if this is not an inline swap, we use the content of the node, not the node itself
                }
                swap(oobValue, target, target, fragment, settleInfo);
            } else {
                child.parentNode.removeChild(child);
                triggerErrorEvent(getDocument().body, "htmx:oobErrorNoTarget", {content: child})
            }
            return oobValue;
        }

        function handleOutOfBandSwaps(fragment, settleInfo) {
            forEach(findAll(fragment, '[hx-swap-oob], [data-hx-swap-oob]'), function (child) {
                var oobValue = getAttributeValue(child, "hx-swap-oob");
                if (oobValue != null) {
                    oobSwap(oobValue, child, settleInfo);
                }
            });
        }

        function handleAttributes(parentNode, fragment, settleInfo) {
            forEach(fragment.querySelectorAll("[id]"), function (newNode) {
                if (newNode.id && newNode.id.length > 0) {
                    var oldNode = parentNode.querySelector(newNode.tagName + "[id='" + newNode.id + "']");
                    if (oldNode && oldNode !== parentNode) {
                        var newAttributes = newNode.cloneNode();
                        cloneAttributes(newNode, oldNode);
                        settleInfo.tasks.push(function () {
                            cloneAttributes(newNode, newAttributes);
                        });
                    }
                }
            });
        }

        function makeAjaxLoadTask(child) {
            return function () {
                processNode(child);
                processScripts(child);
                processFocus(child)
                triggerEvent(child, 'htmx:load');
            };
        }

        function processFocus(child) {
            var autofocus = "[autofocus]";
            var autoFocusedElt = matches(child, autofocus) ? child : child.querySelector(autofocus)
            if (autoFocusedElt != null) {
                autoFocusedElt.focus();
            }
        }

        function insertNodesBefore(parentNode, insertBefore, fragment, settleInfo) {
            handleAttributes(parentNode, fragment, settleInfo);
            while(fragment.childNodes.length > 0){
                var child = fragment.firstChild;
                parentNode.insertBefore(child, insertBefore);
                if (child.nodeType !== Node.TEXT_NODE && child.nodeType !== Node.COMMENT_NODE) {
                    settleInfo.tasks.push(makeAjaxLoadTask(child));
                }
            }
        }

        function closeConnections(target) {
            var internalData = getInternalData(target);
            if (internalData.webSocket) {
                internalData.webSocket.close();
            }
            if (internalData.sseEventSource) {
                internalData.sseEventSource.close();
            }
            if (target.children) { // IE
                forEach(target.children, function(child) { closeConnections(child) });
            }
        }

        function swapOuterHTML(target, fragment, settleInfo) {
            if (target.tagName === "BODY") {
                return swapInnerHTML(target, fragment);
            } else {
                var eltBeforeNewContent = target.previousSibling;
                insertNodesBefore(parentElt(target), target, fragment, settleInfo);
                if (eltBeforeNewContent == null) {
                    var newElt = parentElt(target).firstChild;
                } else {
                    var newElt = eltBeforeNewContent.nextSibling;
                }
                getInternalData(target).replacedWith = newElt; // tuck away so we can fire events on it later
                while(newElt && newElt !== target) {
                    if (newElt.nodeType === Node.ELEMENT_NODE) {
                        settleInfo.elts.push(newElt);
                    }
                    newElt = newElt.nextElementSibling;
                }
                closeConnections(target);
                parentElt(target).removeChild(target);
            }
        }

        function swapAfterBegin(target, fragment, settleInfo) {
            return insertNodesBefore(target, target.firstChild, fragment, settleInfo);
        }

        function swapBeforeBegin(target, fragment, settleInfo) {
            return insertNodesBefore(parentElt(target), target, fragment, settleInfo);
        }

        function swapBeforeEnd(target, fragment, settleInfo) {
            return insertNodesBefore(target, null, fragment, settleInfo);
        }

        function swapAfterEnd(target, fragment, settleInfo) {
            return insertNodesBefore(parentElt(target), target.nextSibling, fragment, settleInfo);
        }

        function swapInnerHTML(target, fragment, settleInfo) {
            var firstChild = target.firstChild;
            insertNodesBefore(target, firstChild, fragment, settleInfo);
            if (firstChild) {
                while (firstChild.nextSibling) {
                    closeConnections(firstChild.nextSibling)
                    target.removeChild(firstChild.nextSibling);
                }
                closeConnections(firstChild)
                target.removeChild(firstChild);
            }
        }

        function maybeSelectFromResponse(elt, fragment) {
            var selector = getClosestAttributeValue(elt, "hx-select");
            if (selector) {
                var newFragment = getDocument().createDocumentFragment();
                forEach(fragment.querySelectorAll(selector), function (node) {
                    newFragment.appendChild(node);
                });
                fragment = newFragment;
            }
            return fragment;
        }

        function swap(swapStyle, elt, target, fragment, settleInfo) {
            switch (swapStyle) {
                case "none":
                    return;
                case "outerHTML":
                    swapOuterHTML(target, fragment, settleInfo);
                    return;
                case "afterbegin":
                    swapAfterBegin(target, fragment, settleInfo);
                    return;
                case "beforebegin":
                    swapBeforeBegin(target, fragment, settleInfo);
                    return;
                case "beforeend":
                    swapBeforeEnd(target, fragment, settleInfo);
                    return;
                case "afterend":
                    swapAfterEnd(target, fragment, settleInfo);
                    return;
                default:
                    var extensions = getExtensions(elt);
                    for (var i = 0; i < extensions.length; i++) {
                        var ext = extensions[i];
                        try {
                            var newElements = ext.handleSwap(swapStyle, target, fragment, settleInfo);
                            if (newElements) {
                                if (typeof newElements.length !== 'undefined') {
                                    // if handleSwap returns an array (like) of elements, we handle them
                                    for (var j = 0; j < newElements.length; j++) {
                                        var child = newElements[j];
                                        if (child.nodeType !== Node.TEXT_NODE && child.nodeType !== Node.COMMENT_NODE) {
                                            settleInfo.tasks.push(makeAjaxLoadTask(child));
                                        }
                                    }
                                }
                                return;
                            }
                        } catch (e) {
                            logError(e);
                        }
                    }
                    swapInnerHTML(target, fragment, settleInfo);
            }
        }

        var TITLE_FINDER = /<title>([\s\S]+?)<\/title>/im;
        function findTitle(content) {
            var result = TITLE_FINDER.exec(content);
            if (result) {
                return result[1];
            }
        }

        function selectAndSwap(swapStyle, target, elt, responseText, settleInfo) {
            var title = findTitle(responseText);
            if(title) {
                var titleElt = find("title");
                if(titleElt) {
                    titleElt.innerHTML = title;
                } else {
                    window.document.title = title;
                }
            }
            var fragment = makeFragment(responseText);
            if (fragment) {
                handleOutOfBandSwaps(fragment, settleInfo);
                fragment = maybeSelectFromResponse(elt, fragment);
                return swap(swapStyle, elt, target, fragment, settleInfo);
            }
        }

        function handleTrigger(xhr, header, elt) {
            var triggerBody = xhr.getResponseHeader(header);
            if (triggerBody.indexOf("{") === 0) {
                var triggers = parseJSON(triggerBody);
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
                triggerEvent(elt, triggerBody, []);
            }
        }

        var WHITESPACE = /\s/;
        var SYMBOL_START = /[_$a-zA-Z]/;
        var SYMBOL_CONT = /[_$a-zA-Z0-9]/;
        var STRINGISH_START = ['"', "'", "/"];
        var NOT_WHITESPACE = /[^\s]/;
        function tokenizeString(str) {
            var tokens = [];
            var position = 0;
            while (position < str.length) {
                if(SYMBOL_START.exec(str.charAt(position))) {
                    var startPosition = position;
                    position++;
                    while (SYMBOL_CONT.exec(str.charAt(position + 1))) {
                        position++;
                    }
                    tokens.push(str.substr(startPosition, position - startPosition + 1));
                } else if (STRINGISH_START.indexOf(str.charAt(position)) !== -1) {
                    var startChar = str.charAt(position);
                    var startPosition = position;
                    position++;
                    while (position < str.length && str.charAt(position) !== startChar ) {
                        if (str.charAt(position) === "\\") {
                            position++;
                        }
                        position++;
                    }
                    tokens.push(str.substr(startPosition, position - startPosition + 1));
                } else {
                    var symbol = str.charAt(position);
                    tokens.push(symbol);
                }
                position++;
            }
            return tokens;
        }

        function isPossibleRelativeReference(token, last, paramName) {
            return SYMBOL_START.exec(token.charAt(0)) &&
                token !== "true" &&
                token !== "false" &&
                token !== "this" &&
                token !== paramName &&
                last !== ".";
        }

        function maybeGenerateConditional(tokens, paramName) {
            if (tokens[0] === '[') {
                tokens.shift();
                var bracketCount = 1;
                var conditionalSource = " return (function(" + paramName + "){ return (";
                var last = null;
                while (tokens.length > 0) {
                    var token = tokens[0];
                    if (token === "]") {
                        bracketCount--;
                        if (bracketCount === 0) {
                            if (last === null) {
                                conditionalSource = conditionalSource + "true";
                            }
                            tokens.shift();
                            conditionalSource += ")})";
                            try {
                                var conditionFunction = Function(conditionalSource)();
                                conditionFunction.source = conditionalSource;
                                return conditionFunction;
                            } catch (e) {
                                triggerErrorEvent(getDocument().body, "htmx:syntax:error", {error:e, source:conditionalSource})
                                return null;
                            }
                        }
                    } else if (token === "[") {
                        bracketCount++;
                    }
                    if (isPossibleRelativeReference(token, last, paramName)) {
                            conditionalSource += "((" + paramName + "." + token + ") ? (" + paramName + "." + token + ") : (window." + token + "))";
                    } else {
                        conditionalSource = conditionalSource + token;
                    }
                    last = tokens.shift();
                }
            }
        }

        function consumeUntil(tokens, match) {
            var result = "";
            while (tokens.length > 0 && !tokens[0].match(match)) {
                result += tokens.shift();
            }
            return result;
        }

        function getTriggerSpecs(elt) {
            var explicitTrigger = getAttributeValue(elt, 'hx-trigger');
            var triggerSpecs = [];
            if (explicitTrigger) {
                var tokens = tokenizeString(explicitTrigger);
                do {
                    consumeUntil(tokens, NOT_WHITESPACE);
                    var initialLength = tokens.length;
                    var trigger = consumeUntil(tokens, /[,\[\s]/);
                    if (trigger !== "") {
                        if (trigger === "every") {
                            var every = {trigger: 'every'};
                            consumeUntil(tokens, NOT_WHITESPACE);
                            every.pollInterval = parseInterval(consumeUntil(tokens, WHITESPACE));
                            triggerSpecs.push(every);
                        } else if (trigger.indexOf("sse:") === 0) {
                            triggerSpecs.push({trigger: 'sse', sseEvent: trigger.substr(4)});
                        } else {
                            var triggerSpec = {trigger: trigger};
                            var eventFilter = maybeGenerateConditional(tokens, "event");
                            if (eventFilter) {
                                triggerSpec.eventFilter = eventFilter;
                            }
                            while (tokens.length > 0 && tokens[0] !== ",") {
                                consumeUntil(tokens, NOT_WHITESPACE)
                                var token = tokens.shift();
                                if (token === "changed") {
                                    triggerSpec.changed = true;
                                } else if (token === "once") {
                                    triggerSpec.once = true;
                                } else if (token === "delay" && tokens[0] === ":") {
                                    tokens.shift();
                                    triggerSpec.delay = parseInterval(consumeUntil(tokens, WHITESPACE));
                                } else if (token === "throttle" && tokens[0] === ":") {
                                    tokens.shift();
                                    triggerSpec.throttle = parseInterval(consumeUntil(tokens, WHITESPACE));
                                } else {
                                    triggerErrorEvent(elt, "htmx:syntax:error", {token:tokens.shift()});
                                }
                            }
                            triggerSpecs.push(triggerSpec);
                        }
                    }
                    if (tokens.length === initialLength) {
                        triggerErrorEvent(elt, "htmx:syntax:error", {token:tokens.shift()});
                    }
                    consumeUntil(tokens, NOT_WHITESPACE);
                } while (tokens[0] === "," && tokens.shift())
            }

            if (triggerSpecs.length > 0) {
                return triggerSpecs;
            } else if (matches(elt, 'form')) {
                return [{trigger: 'submit'}];
            } else if (matches(elt, 'input, textarea, select')) {
                return [{trigger: 'change'}];
            } else {
                return [{trigger: 'click'}];
            }
        }

        function cancelPolling(elt) {
            getInternalData(elt).cancelled = true;
        }

        function processPolling(elt, verb, path, interval) {
            var nodeData = getInternalData(elt);
            nodeData.timeout = setTimeout(function () {
                if (bodyContains(elt) && nodeData.cancelled !== true) {
                    issueAjaxRequest(elt, verb, path);
                    processPolling(elt, verb, getAttributeValue(elt, "hx-" + verb), interval);
                }
            }, interval);
        }

        function isLocalLink(elt) {
            return location.hostname === elt.hostname &&
                getRawAttribute(elt,'href') &&
                getRawAttribute(elt,'href').indexOf("#") !== 0;
        }

        function boostElement(elt, nodeData, triggerSpecs) {
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
                triggerSpecs.forEach(function(triggerSpec) {
                    addEventListener(elt, verb, path, nodeData, triggerSpec, true);
                });
            }
        }

        function shouldCancel(elt) {
            return elt.tagName === "FORM" ||
                (matches(elt, 'input[type="submit"], button') && closest(elt, 'form') !== null) ||
                (elt.tagName === "A" && elt.href && elt.href.indexOf('#') !== 0);
        }

        function ignoreBoostedAnchorCtrlClick(elt, evt) {
            return getInternalData(elt).boosted && elt.tagName === "A" && evt.type === "click" && evt.ctrlKey;
        }

        function maybeFilterEvent(triggerSpec, evt) {
            var eventFilter = triggerSpec.eventFilter;
            if(eventFilter){
                try {
                    return eventFilter(evt) !== true;
                } catch(e) {
                    triggerErrorEvent(getDocument().body, "htmx:eventFilter:error", {error: e, source:eventFilter.source});
                    return true;
                }
            }
            return false;
        }

        function addEventListener(elt, verb, path, nodeData, triggerSpec, explicitCancel) {
            var eventListener = function (evt) {
                if (maybeFilterEvent(triggerSpec, evt)) {
                    return;
                }
                if (ignoreBoostedAnchorCtrlClick(elt, evt)) {
                    return;
                }
                if(explicitCancel || shouldCancel(elt)){
                    evt.preventDefault();
                }
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
                    if (elementData.throttle) {
                        return;
                    }

                    if (triggerSpec.throttle) {
                        elementData.throttle = setTimeout(function(){
                            issueAjaxRequest(elt, verb, path, evt.target, evt);
                            elementData.throttle = null;
                        }, triggerSpec.throttle);
                    } else if (triggerSpec.delay) {
                        elementData.delayed = setTimeout(function(){
                            issueAjaxRequest(elt, verb, path, evt.target, evt);
                        }, triggerSpec.delay);
                    } else {
                        issueAjaxRequest(elt, verb, path, evt.target, evt);
                    }
                }
            };
            nodeData.trigger = triggerSpec.trigger;
            nodeData.eventListener = eventListener;
            elt.addEventListener(triggerSpec.trigger, eventListener);
        }

        var windowIsScrolling = false // used by initScrollHandler
        var scrollHandler = null;
        function initScrollHandler() {
            if (!scrollHandler) {
                scrollHandler = function() {
                    windowIsScrolling = true
                };
                window.addEventListener("scroll", scrollHandler)
                setInterval(function() {
                    if (windowIsScrolling) {
                        windowIsScrolling = false;
                        forEach(getDocument().querySelectorAll("[hx-trigger='revealed'],[data-hx-trigger='revealed']"), function (elt) {
                            maybeReveal(elt);
                        })
                    }
                }, 200);
            }
        }

        function maybeReveal(elt) {
            var nodeData = getInternalData(elt);
            if (!nodeData.revealed && isScrolledIntoView(elt)) {
                nodeData.revealed = true;
                issueAjaxRequest(elt, nodeData.verb, nodeData.path);
            }
        }

        function processWebSocketInfo(elt, nodeData, info) {
            var values = splitOnWhitespace(info);
            for (var i = 0; i < values.length; i++) {
                var value = values[i].split(/:(.+)/);
                if (value[0] === "connect") {
                    processWebSocketSource(elt, value[1]);
                }
                if (value[0] === "send") {
                    processWebSocketSend(elt);
                }
            }
        }

        function processWebSocketSource(elt, wssSource) {
            if (wssSource.indexOf("ws:") !== 0 && wssSource.indexOf("wss:") !== 0) {
                wssSource = "wss:" + wssSource;
            }
            var socket = htmx.createWebSocket(wssSource);
            socket.onerror = function (e) {
                triggerErrorEvent(elt, "htmx:wsError", {error:e, socket:socket});
                maybeCloseWebSocketSource(elt);
            };
            getInternalData(elt).webSocket = socket;
            socket.addEventListener('message', function (event) {
                if (maybeCloseWebSocketSource(elt)) {
                    return;
                }

                var response = event.data;
                withExtensions(elt, function(extension){
                    response = extension.transformResponse(response, null, elt);
                });

                var settleInfo = makeSettleInfo(elt);
                var fragment = makeFragment(response);
                var children = toArray(fragment.children);
                for (var i = 0; i < children.length; i++) {
                    var child = children[i];
                    oobSwap(getAttributeValue(child, "hx-swap-oob") || "true", child, settleInfo);
                }

                settleImmediately(settleInfo.tasks);
            });
        }

        function maybeCloseWebSocketSource(elt) {
            if (!bodyContains(elt)) {
                getInternalData(elt).webSocket.close();
                return true;
            }
        }

        function processWebSocketSend(elt) {
            var webSocketSourceElt = getClosestMatch(elt, function (parent) {
                return getInternalData(parent).webSocket != null;
            });
            if (webSocketSourceElt) {
                var webSocket = getInternalData(webSocketSourceElt).webSocket;
                elt.addEventListener(getTriggerSpecs(elt)[0].trigger, function (evt) {
                    var headers = getHeaders(elt, webSocketSourceElt, null, elt);
                    var results = getInputValues(elt, 'post');
                    var errors = results.errors;
                    var rawParameters = results.values;
                    var expressionVars = getExpressionVars(elt);
                    var allParameters = mergeObjects(rawParameters, expressionVars);
                    var filteredParameters = filterValues(allParameters, elt);
                    filteredParameters['HEADERS'] = headers;
                    if (errors && errors.length > 0) {
                        triggerEvent(elt, 'htmx:validation:halted', errors);
                        return;
                    }
                    webSocket.send(JSON.stringify(filteredParameters));
                    if(shouldCancel(elt)){
                        evt.preventDefault();
                    }
                });
            } else {
                triggerErrorEvent(elt, "htmx:noWebSocketSourceError");
            }
        }

        //====================================================================
        // Server Sent Events
        //====================================================================

        function processSSEInfo(elt, nodeData, info) {
            var values = splitOnWhitespace(info);
            for (var i = 0; i < values.length; i++) {
                var value = values[i].split(/:(.+)/);
                if (value[0] === "connect") {
                    processSSESource(elt, value[1]);
                }

                if ((value[0] === "swap")) {
                    processSSESwap(elt, value[1])
                }
            }
        }

        function processSSESource(elt, sseSrc) {
            var source = htmx.createEventSource(sseSrc);
            source.onerror = function (e) {
                triggerErrorEvent(elt, "htmx:sseError", {error:e, source:source});
                maybeCloseSSESource(elt);
            };
            getInternalData(elt).sseEventSource = source;
        }

        function processSSESwap(elt, sseEventName) {
            var sseSourceElt = getClosestMatch(elt, hasEventSource);
            if (sseSourceElt) {
                var sseEventSource = getInternalData(sseSourceElt).sseEventSource;
                var sseListener = function (event) {
                    if (maybeCloseSSESource(sseSourceElt)) {
                        sseEventSource.removeEventListener(sseEventName, sseListener);
                        return;
                    }

                    ///////////////////////////
                    // TODO: merge this code with AJAX and WebSockets code in the future.

                    var response = event.data;
                    withExtensions(elt, function(extension){
                        response = extension.transformResponse(response, null, elt);
                    });

                    var swapSpec = getSwapSpecification(elt)
                    var target = getTarget(elt)
                    var settleInfo = makeSettleInfo(elt);

                    selectAndSwap(swapSpec.swapStyle, elt, target, response, settleInfo)
                    triggerEvent(elt, "htmx:sseMessage", event)
                };

                getInternalData(elt).sseListener = sseListener;
                sseEventSource.addEventListener(sseEventName, sseListener);
            } else {
                triggerErrorEvent(elt, "htmx:noSSESourceError");
            }
        }

        function processSSETrigger(elt, verb, path, sseEventName) {
            var sseSourceElt = getClosestMatch(elt, hasEventSource);
            if (sseSourceElt) {
                var sseEventSource = getInternalData(sseSourceElt).sseEventSource;
                var sseListener = function () {
                    if (!maybeCloseSSESource(sseSourceElt)) {
                        if (bodyContains(elt)) {
                            issueAjaxRequest(elt, verb, path);
                        } else {
                            sseEventSource.removeEventListener(sseEventName, sseListener);
                        }
                    }
                };
                getInternalData(elt).sseListener = sseListener;
                sseEventSource.addEventListener(sseEventName, sseListener);
            } else {
                triggerErrorEvent(elt, "htmx:noSSESourceError");
            }
        }

        function maybeCloseSSESource(elt) {
            if (!bodyContains(elt)) {
                getInternalData(elt).sseEventSource.close();
                return true;
            }
        }

        function hasEventSource(node) {
            return getInternalData(node).sseEventSource != null;
        }

        //====================================================================

        function loadImmediately(elt, verb, path, nodeData, delay) {
            var load = function(){
                if (!nodeData.loaded) {
                    nodeData.loaded = true;
                    issueAjaxRequest(elt, verb, path);
                }
            }
            if (delay) {
                setTimeout(load, delay);
            } else {
                load();
            }
        }

        function processVerbs(elt, nodeData, triggerSpecs) {
            var explicitAction = false;
            forEach(VERBS, function (verb) {
                if (hasAttribute(elt,'hx-' + verb)) {
                    var path = getAttributeValue(elt, 'hx-' + verb);
                    explicitAction = true;
                    nodeData.path = path;
                    nodeData.verb = verb;
                    triggerSpecs.forEach(function(triggerSpec) {
                        if (triggerSpec.sseEvent) {
                            processSSETrigger(elt, verb, path, triggerSpec.sseEvent);
                        } else if (triggerSpec.trigger === "revealed") {
                            initScrollHandler();
                            maybeReveal(elt);
                        } else if (triggerSpec.trigger === "load") {
                            loadImmediately(elt, verb, path, nodeData, triggerSpec.delay);
                        } else if (triggerSpec.pollInterval) {
                            nodeData.polling = true;
                            processPolling(elt, verb, path, triggerSpec.pollInterval);
                        } else {
                            addEventListener(elt, verb, path, nodeData, triggerSpec);
                        }
                    });
                }
            });
            return explicitAction;
        }

        function evalScript(script) {
            if (script.type === "text/javascript" || script.type === "") {
                try {
                    Function(script.innerText)();
                } catch (e) {
                    logError(e);
                }
            }
        }

        function processScripts(elt) {
            if (matches(elt, "script")) {
                evalScript(elt);
            }
            forEach(findAll(elt, "script"), function (script) {
                evalScript(script);
            });
        }

        function isBoosted() {
            return document.querySelector("[hx-boost], [data-hx-boost]");
        }

        function findElementsToProcess(elt) {
            if (elt.querySelectorAll) {
                var boostedElts = isBoosted() ? ", a, form" : "";
                var results = elt.querySelectorAll(VERB_SELECTOR + boostedElts + ", [hx-sse], [data-hx-sse], [hx-ws]," +
                    " [data-hx-ws]");
                return results;
            } else {
                return [];
            }
        }

        function initNode(elt) {
            var nodeData = getInternalData(elt);
            if (!nodeData.initialized) {
                nodeData.initialized = true;

                if (elt.value) {
                    nodeData.lastValue = elt.value;
                }

                var triggerSpecs = getTriggerSpecs(elt);
                var explicitAction = processVerbs(elt, nodeData, triggerSpecs);

                if (!explicitAction && getClosestAttributeValue(elt, "hx-boost") === "true") {
                    boostElement(elt, nodeData, triggerSpecs);
                }

                var sseInfo = getAttributeValue(elt, 'hx-sse');
                if (sseInfo) {
                    processSSEInfo(elt, nodeData, sseInfo);
                }

                var wsInfo = getAttributeValue(elt, 'hx-ws');
                if (wsInfo) {
                    processWebSocketInfo(elt, nodeData, wsInfo);
                }
                triggerEvent(elt, "htmx:processedNode");
            }
        }

        function processNode(elt) {
            elt = resolveTarget(elt);
            initNode(elt);
            forEach(findElementsToProcess(elt), function(child) { initNode(child) });
        }

        //====================================================================
        // Event/Log Support
        //====================================================================

        function kebabEventName(str) {
            return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
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

        function triggerErrorEvent(elt, eventName, detail) {
            triggerEvent(elt, eventName, mergeObjects({error:eventName}, detail));
        }

        function ignoreEventForLogging(eventName) {
            return eventName === "htmx:processedNode"
        }

        function withExtensions(elt, toDo) {
            forEach(getExtensions(elt), function(extension){
                try {
                    toDo(extension);
                } catch (e) {
                    logError(e);
                }
            });
        }

        function logError(msg) {
            if(console.error) {
                console.error(msg);
            } else if (console.log) {
                console.log("ERROR: ", msg);
            }
        }

        function triggerEvent(elt, eventName, detail) {
            elt = resolveTarget(elt);
            if (detail == null) {
                detail = {};
            }
            detail["elt"] = elt;
            var event = makeEvent(eventName, detail);
            if (htmx.logger && !ignoreEventForLogging(eventName)) {
                htmx.logger(elt, eventName, detail);
            }
            if (detail.error) {
                logError(detail.error);
                triggerEvent(elt, "htmx:error", {errorInfo:detail})
            }
            var eventResult = elt.dispatchEvent(event);
            var kebabName = kebabEventName(eventName);
            if (eventResult && kebabName !== eventName) {
                var kebabedEvent = makeEvent(kebabName, event.detail);
                eventResult = eventResult && elt.dispatchEvent(kebabedEvent)
            }
            withExtensions(elt, function (extension) {
                eventResult = eventResult && (extension.onEvent(eventName, event) !== false)
            });
            return eventResult;
        }

        //====================================================================
        // History Support
        //====================================================================
        var currentPathForHistory = null;

        function getHistoryElement() {
            var historyElt = getDocument().querySelector('[hx-history-elt],[data-hx-history-elt]');
            return historyElt || getDocument().body;
        }

        function saveToHistoryCache(url, content, title, scroll) {
            var historyCache = parseJSON(localStorage.getItem("htmx-history-cache")) || [];
            for (var i = 0; i < historyCache.length; i++) {
                if (historyCache[i].url === url) {
                    historyCache = historyCache.slice(i, 1);
                    break;
                }
            }
            historyCache.push({url:url, content: content, title:title, scroll:scroll})
            while (historyCache.length > htmx.config.historyCacheSize) {
                historyCache.shift();
            }
            try {
                localStorage.setItem("htmx-history-cache", JSON.stringify(historyCache));
            } catch (e) {
                triggerErrorEvent(getDocument().body, "htmx:historyCacheError", {cause:e})
            }
        }

        function getCachedHistory(url) {
            var historyCache = parseJSON(localStorage.getItem("htmx-history-cache")) || [];
            for (var i = 0; i < historyCache.length; i++) {
                if (historyCache[i].url === url) {
                    return historyCache[i];
                }
            }
            return null;
        }

        function cleanInnerHtmlForHistory(elt) {
            var className = htmx.config.requestClass;
            var clone = elt.cloneNode(true);
            forEach(findAll(clone, "." + className), function(child){
                removeClassFromElement(child, className);
            });
            return clone.innerHTML;
        }

        function saveHistory() {
            var elt = getHistoryElement();
            var path = currentPathForHistory || location.pathname+location.search;
            triggerEvent(getDocument().body, "htmx:beforeHistorySave", {path:path, historyElt:elt});
            if(htmx.config.historyEnabled) history.replaceState({htmx:true}, getDocument().title, window.location.href);
            saveToHistoryCache(path, cleanInnerHtmlForHistory(elt), getDocument().title, window.scrollY);
        }

        function pushUrlIntoHistory(path) {
            if(htmx.config.historyEnabled)  history.pushState({htmx:true}, "", path);
            currentPathForHistory = path;
        }

        function settleImmediately(tasks) {
            forEach(tasks, function (task) {
                task.call();
            });
        }

        function loadHistoryFromServer(path) {
            var request = new XMLHttpRequest();
            var details = {path: path, xhr:request};
            triggerEvent(getDocument().body, "htmx:historyCacheMiss", details);
            request.open('GET', path, true);
            request.onload = function () {
                if (this.status >= 200 && this.status < 400) {
                    triggerEvent(getDocument().body, "htmx:historyCacheMissLoad", details);
                    var fragment = makeFragment(this.response);
                    fragment = fragment.querySelector('[hx-history-elt],[data-hx-history-elt]') || fragment;
                    var historyElement = getHistoryElement();
                    var settleInfo = makeSettleInfo(historyElement);
                    swapInnerHTML(historyElement, fragment, settleInfo)
                    settleImmediately(settleInfo.tasks);
                    currentPathForHistory = path;
                } else {
                    triggerErrorEvent(getDocument().body, "htmx:historyCacheMissLoadError", details);
                }
            };
            request.send();
        }

        function restoreHistory(path) {
            saveHistory(currentPathForHistory);
            path = path || location.pathname+location.search;
            triggerEvent(getDocument().body, "htmx:historyRestore", {path:path});
            var cached = getCachedHistory(path);
            if (cached) {
                var fragment = makeFragment(cached.content);
                var historyElement = getHistoryElement();
                var settleInfo = makeSettleInfo(historyElement);
                swapInnerHTML(historyElement, fragment, settleInfo)
                settleImmediately(settleInfo.tasks);
                document.title = cached.title;
                window.scrollTo(0, cached.scroll);
                currentPathForHistory = path;
            } else {
                loadHistoryFromServer(path);
            }
        }

        function shouldPush(elt) {
            var pushUrl = getClosestAttributeValue(elt, "hx-push-url");
            return (pushUrl && pushUrl !== "false") ||
                (elt.tagName === "A" && getInternalData(elt).boosted);
        }

        function getPushUrl(elt) {
            var pushUrl = getClosestAttributeValue(elt, "hx-push-url");
            return (pushUrl === "true" || pushUrl === "false") ? null : pushUrl;
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
                ic.classList[action].call(ic.classList, htmx.config.requestClass);
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
            return true;
        }

        function processInputValue(processed, values, errors, elt) {
            if (elt == null || haveSeenNode(processed, elt)) {
                return;
            } else {
                processed.push(elt);
            }
            if (shouldInclude(elt)) {
                var name = getRawAttribute(elt,"name");
                var value = elt.value;
                if (elt.multiple) {
                    value = toArray(elt.querySelectorAll("option:checked")).map(function (e) { return e.value });
                }
                // include file inputs
                if (elt.files) {
                    value = toArray(elt.files);
                }
                // This is a little ugly because both the current value of the named value in the form
                // and the new value could be arrays, so we have to handle all four cases :/
                if (name != null && value != null) {
                    var current = values[name];
                    if(current) {
                        if (Array.isArray(current)) {
                            if (Array.isArray(value)) {
                                values[name] = current.concat(value);
                            } else {
                                current.push(value);
                            }
                        } else {
                            if (Array.isArray(value)) {
                                values[name] = [current].concat(value);
                            } else {
                                values[name] = [current, value];
                            }
                        }
                    } else {
                        values[name] = value;
                    }
                }
                validateElement(elt, errors);
            }
            if (matches(elt, 'form')) {
                var inputs = elt.elements;
                forEach(inputs, function(input) {
                    processInputValue(processed, values, errors, input);
                });
            }
        }

        function validateElement(element, errors) {
            if (element.willValidate) {
                triggerEvent(element, "htmx:validation:validate")
                if (!element.checkValidity()) {
                    errors.push({elt: element, message:element.validationMessage, validity:element.validity});
                    triggerEvent(element, "htmx:validation:failed", {message:element.validationMessage, validity:element.validity})
                }
            }
        }

        function getInputValues(elt, verb) {
            var processed = [];
            var values = {};
            var errors = [];

            // for a non-GET include the closest form
            if (verb !== 'get') {
                processInputValue(processed, values, errors, closest(elt, 'form'));
            }

            // include the element itself
            processInputValue(processed, values, errors, elt);

            // include any explicit includes
            var includes = getClosestAttributeValue(elt, "hx-include");
            if (includes) {
                var nodes = getDocument().querySelectorAll(includes);
                forEach(nodes, function(node) {
                    processInputValue(processed, values, errors, node);
                });
            }


            return {errors:errors, values:values};
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

        function makeFormData(values) {
            var formData = new FormData();
            for (var name in values) {
                if (values.hasOwnProperty(name)) {
                    var value = values[name];
                    if (Array.isArray(value)) {
                        forEach(value, function(v) {
                            formData.append(name, v);
                        });
                    } else {
                        formData.append(name, value);
                    }
                }
            }
            return formData;
        }

        //====================================================================
        // Ajax
        //====================================================================

        function getHeaders(elt, target, prompt, eventTarget) {
            var headers = {
                "HX-Request" : "true",
                "HX-Trigger" : getRawAttribute(elt, "id"),
                "HX-Trigger-Name" : getRawAttribute(elt, "name"),
                "HX-Target" : getAttributeValue(target, "id"),
                "HX-Current-URL" : getDocument().location.href,
            }
            if (prompt !== undefined) {
                headers["HX-Prompt"] = prompt;
            }
            if (eventTarget) {
                headers["HX-Event-Target"] = getRawAttribute(eventTarget, "id");
            }
            if (getDocument().activeElement) {
                headers["HX-Active-Element"] = getRawAttribute(getDocument().activeElement, "id");
                headers["HX-Active-Element-Name"] = getRawAttribute(getDocument().activeElement, "name");
                if (getDocument().activeElement.value) {
                    headers["HX-Active-Element-Value"] = getRawAttribute(getDocument().activeElement, "value");
                }
            }
            return headers;
        }

        function filterValues(inputValues, elt) {
            var paramsValue = getClosestAttributeValue(elt, "hx-params");
            if (paramsValue) {
                if (paramsValue === "none") {
                    return {};
                } else if (paramsValue === "*") {
                    return inputValues;
                } else if(paramsValue.indexOf("not ") === 0) {
                    forEach(paramsValue.substr(4).split(","), function (name) {
                        name = name.trim();
                        delete inputValues[name];
                    });
                    return inputValues;
                } else {
                    var newValues = {}
                    forEach(paramsValue.split(","), function (name) {
                        name = name.trim();
                        newValues[name] = inputValues[name];
                    });
                    return newValues;
                }
            } else {
                return inputValues;
            }
        }

        function getSwapSpecification(elt) {
            var swapInfo = getClosestAttributeValue(elt, "hx-swap");
            var swapSpec = {
                "swapStyle" : htmx.config.defaultSwapStyle,
                "swapDelay" : htmx.config.defaultSwapDelay,
                "settleDelay" : htmx.config.defaultSettleDelay
            }
            if (swapInfo) {
                var split = splitOnWhitespace(swapInfo);
                if (split.length > 0) {
                    swapSpec["swapStyle"] = split[0];
                    for (var i = 1; i < split.length; i++) {
                        var modifier = split[i];
                        if (modifier.indexOf("swap:") === 0) {
                            swapSpec["swapDelay"] = parseInterval(modifier.substr(5));
                        }
                        if (modifier.indexOf("settle:") === 0) {
                            swapSpec["settleDelay"] = parseInterval(modifier.substr(7));
                        }
                        if (modifier.indexOf("scroll:") === 0) {
                            swapSpec["scroll"] = modifier.substr(7);
                        }
                        if (modifier.indexOf("show:") === 0) {
                            swapSpec["show"] = modifier.substr(5);
                        }
                    }
                }
            }
            return swapSpec;
        }

        function encodeParamsForBody(xhr, elt, filteredParameters) {
            var encodedParameters = null;
            withExtensions(elt, function (extension) {
                if (encodedParameters == null) {
                    encodedParameters = extension.encodeParameters(xhr, filteredParameters, elt);
                }
            });
            if (encodedParameters != null) {
                return encodedParameters;
            } else {
                if (getClosestAttributeValue(elt, "hx-encoding") === "multipart/form-data") {
                    return makeFormData(filteredParameters);
                } else {
                    return urlEncode(filteredParameters);
                }
            }
        }

        function makeSettleInfo(target) {
            return {tasks: [], elts: [target]};
        }

        function updateScrollState(target, altContent, swapSpec) {
            if (swapSpec.scroll) {
                if (swapSpec.scroll === "top") {
                    target.scrollTop = 0;
                }
                if (swapSpec.scroll === "bottom") {
                    target.scrollTop = target.scrollHeight;
                }
            }
            if (swapSpec.show) {
                if (swapSpec.show === "top") {
                    target.scrollIntoView(true);
                }
                if (swapSpec.show === "bottom") {
                    target.scrollIntoView(false);
                }
            }
        }

        function getValuesForElement(elt, attr, strToValues, expressionVars) {
            if (expressionVars == null) {
                expressionVars = {};
            }
            if (elt == null) {
                return expressionVars;
            }
            var attributeValue = getAttributeValue(elt, attr);
            if (attributeValue) {
                var str = attributeValue.trim();
                if (str.indexOf('{') !== 0) {
                    str = "{" + str + "}";
                }
                var varsValues = strToValues(str);
                for (var key in varsValues) {
                    if (varsValues.hasOwnProperty(key)) {
                        if (expressionVars[key] == null) {
                            expressionVars[key] = varsValues[key];
                        }
                    }
                }
            }
            return getValuesForElement(parentElt(elt), attr, strToValues, expressionVars);
        }

        function getHXVarsForElement(elt, expressionVars) {
            return getValuesForElement(elt, "hx-vars", function(valueStr){
                return Function("return (" + valueStr + ")")()
            }, expressionVars);
        }

        function getHXValsForElement(elt, expressionVars) {
            return getValuesForElement(elt, "hx-vals", function(valueStr){
                return parseJSON(valueStr);
            }, expressionVars);
        }

        function getExpressionVars(elt) {
            return mergeObjects(getHXVarsForElement(elt), getHXValsForElement(elt));
        }

        function safelySetHeaderValue(xhr, header, headerValue) {
            if (headerValue !== null) {
                try {
                    xhr.setRequestHeader(header, headerValue);
                } catch (e) {
                    // On an exception, try to set the header URI encoded instead
                    xhr.setRequestHeader(header, encodeURIComponent(headerValue));
                    xhr.setRequestHeader(header + "-URI-AutoEncoded", "true");
                }
            }
        }

        function getResponseURL(xhr) {
            // NB: IE11 does not support this stuff
            if (xhr.responseURL && typeof(URL) !== "undefined") {
                try {
                    var url = new URL(xhr.responseURL);
                    return url.pathname + url.search;
                } catch (e) {
                    triggerErrorEvent(getDocument().body, "htmx:badResponseUrl", {url: xhr.responseURL});
                }
            }
        }

        function hasHeader(xhr, regexp) {
            return xhr.getAllResponseHeaders().match(regexp);
        }

        function issueAjaxRequest(elt, verb, path, eventTarget, triggeringEvent) {
            if (!bodyContains(elt)) {
                console.log("Body does not contain", elt);
                return; // do not issue requests for elements removed from the DOM
            }
            var target = getTarget(elt);
            if (target == null) {
                triggerErrorEvent(elt, 'htmx:targetError', {target: getAttributeValue(elt, "hx-target")});
                return;
            }
            var eltData = getInternalData(elt);
            if (eltData.requestInFlight) {
                eltData.queuedRequest = function(){issueAjaxRequest(elt, verb, path, eventTarget, triggeringEvent)};
                return;
            } else {
                eltData.requestInFlight = true;
            }
            var endRequestLock = function(){
                eltData.requestInFlight = false
                var queuedRequest = eltData.queuedRequest;
                eltData.queuedRequest = null;
                if (queuedRequest) {
                    queuedRequest();
                }
            }
            var promptQuestion = getClosestAttributeValue(elt, "hx-prompt");
            if (promptQuestion) {
                var promptResponse = prompt(promptQuestion);
                // prompt returns null if cancelled and empty string if accepted with no entry
                if (promptResponse === null ||
                    !triggerEvent(elt, 'htmx:prompt', {prompt: promptResponse, target:target}))
                    return endRequestLock();
            }

            var confirmQuestion = getClosestAttributeValue(elt, "hx-confirm");
            if (confirmQuestion) {
                if(!confirm(confirmQuestion)) return endRequestLock();
            }

            var xhr = new XMLHttpRequest();

            var headers = getHeaders(elt, target, promptResponse, eventTarget);
            var results = getInputValues(elt, verb);
            var errors = results.errors;
            var rawParameters = results.values;
            var expressionVars = getExpressionVars(elt);
            var allParameters = mergeObjects(rawParameters, expressionVars);
            var filteredParameters = filterValues(allParameters, elt);

            if (verb !== 'get' && getClosestAttributeValue(elt, "hx-encoding") == null) {
                headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
            }

            // behavior of anchors w/ empty href is to use the current URL
            if (path == null || path === "") {
                path = getDocument().location.href;
            }

            var requestConfig = {
                parameters: filteredParameters,
                unfilteredParameters: allParameters,
                headers:headers,
                target:target,
                verb:verb,
                errors:errors,
                path:path,
                triggeringEvent:triggeringEvent
            };

            if(!triggerEvent(elt, 'htmx:configRequest', requestConfig)) return endRequestLock();
            // copy out in case the object was overwritten
            path = requestConfig.path;
            verb = requestConfig.verb;
            headers = requestConfig.headers;
            filteredParameters = requestConfig.parameters;
            errors = requestConfig.errors;

            if(errors && errors.length > 0){
                triggerEvent(elt, 'htmx:validation:halted', requestConfig)
                return endRequestLock();
            }

            var splitPath = path.split("#");
            var pathNoAnchor = splitPath[0];
            var anchor = splitPath[1];
            if (verb === 'get') {
                var finalPathForGet = pathNoAnchor;
                var values = Object.keys(filteredParameters).length !== 0;
                if (values) {
                    if (finalPathForGet.indexOf("?") < 0) {
                        finalPathForGet += "?";
                    } else {
                        finalPathForGet += "&";
                    }
                    finalPathForGet += urlEncode(filteredParameters);
                    if (anchor) {
                        finalPathForGet += "#" + anchor;
                    }
                }
                xhr.open('GET', finalPathForGet, true);
            } else {
                xhr.open(verb.toUpperCase(), path, true);
            }

            xhr.overrideMimeType("text/html");

            // request headers
            for (var header in headers) {
                if (headers.hasOwnProperty(header)) {
                    var headerValue = headers[header];
                    safelySetHeaderValue(xhr, header, headerValue);
                }
            }

            var eventDetail = {xhr: xhr, target: target, requestConfig: requestConfig};
            xhr.onload = function () {
                try {
                    if (!triggerEvent(elt, 'htmx:beforeOnLoad', eventDetail)) return;

                    if (hasHeader(xhr, /HX-Trigger:/i)) {
                        handleTrigger(xhr, "HX-Trigger", elt);
                    }

                    if (hasHeader(xhr,/HX-Push:/i)) {
                        var pushedUrl = xhr.getResponseHeader("HX-Push");
                    }

                    if (hasHeader(xhr, /HX-Redirect:/i)) {
                        window.location.href = xhr.getResponseHeader("HX-Redirect");
                        return;
                    }

                    if (hasHeader(xhr,/HX-Refresh:/i)) {
                        if ("true" === xhr.getResponseHeader("HX-Refresh")) {
                            location.reload();
                            return;
                        }
                    }

                    var shouldSaveHistory = shouldPush(elt) || pushedUrl;

                    if (this.status >= 200 && this.status < 400) {
                        if (this.status === 286) {
                            cancelPolling(elt);
                        }
                        // don't process 'No Content'
                        if (this.status !== 204) {
                            if (!triggerEvent(target, 'htmx:beforeSwap', eventDetail)) return;

                            var serverResponse = this.response;
                            withExtensions(elt, function(extension){
                                serverResponse = extension.transformResponse(serverResponse, xhr, elt);
                            });

                            // Save current page
                            if (shouldSaveHistory) {
                                saveHistory();
                            }

                            var swapSpec = getSwapSpecification(elt);

                            target.classList.add(htmx.config.swappingClass);
                            var doSwap = function () {
                                try {

                                    var activeElt = document.activeElement;
                                    var selectionInfo = {
                                        elt: activeElt,
                                        start: activeElt ? activeElt.selectionStart : null,
                                        end: activeElt ? activeElt.selectionEnd : null
                                    };

                                    var settleInfo = makeSettleInfo(target);
                                    selectAndSwap(swapSpec.swapStyle, target, elt, serverResponse, settleInfo);

                                    if (selectionInfo.elt &&
                                        !bodyContains(selectionInfo.elt) &&
                                        selectionInfo.elt.id) {
                                        var newActiveElt = document.getElementById(selectionInfo.elt.id);
                                        if (newActiveElt) {
                                            if (selectionInfo.start && newActiveElt.setSelectionRange) {
                                                newActiveElt.setSelectionRange(selectionInfo.start, selectionInfo.end);
                                            }
                                            newActiveElt.focus();
                                        }
                                    }

                                    target.classList.remove(htmx.config.swappingClass);
                                    forEach(settleInfo.elts, function (elt) {
                                        if (elt.classList) {
                                            elt.classList.add(htmx.config.settlingClass);
                                        }
                                        triggerEvent(elt, 'htmx:afterSwap', eventDetail);
                                    });
                                    if (anchor) {
                                        location.hash = anchor;
                                    }

                                    if (hasHeader(xhr, /HX-Trigger-After-Swap:/i)) {
                                        handleTrigger(xhr, "HX-Trigger-After-Swap", elt);
                                    }

                                    var doSettle = function(){
                                        forEach(settleInfo.tasks, function (task) {
                                            task.call();
                                        });
                                        forEach(settleInfo.elts, function (elt) {
                                            if (elt.classList) {
                                                elt.classList.remove(htmx.config.settlingClass);
                                            }
                                            triggerEvent(elt, 'htmx:afterSettle', eventDetail);
                                        });
                                        // push URL and save new page
                                        if (shouldSaveHistory) {
                                            var pathToPush = pushedUrl || getPushUrl(elt) || getResponseURL(xhr) || finalPathForGet || path;
                                            pushUrlIntoHistory(pathToPush);
                                            triggerEvent(getDocument().body, 'htmx:pushedIntoHistory', {path:pathToPush});
                                        }
                                        updateScrollState(target, settleInfo.elts, swapSpec);

                                        if (hasHeader(xhr, /HX-Trigger-After-Settle:/i)) {
                                            handleTrigger(xhr, "HX-Trigger-After-Settle", elt);
                                        }
                                    }

                                    if (swapSpec.settleDelay > 0) {
                                        setTimeout(doSettle, swapSpec.settleDelay)
                                    } else {
                                        doSettle();
                                    }
                                } catch (e) {
                                    triggerErrorEvent(elt, 'htmx:swapError', eventDetail);
                                    throw e;
                                }
                            };

                            if (swapSpec.swapDelay > 0) {
                                setTimeout(doSwap, swapSpec.swapDelay)
                            } else {
                                doSwap();
                            }
                        }
                    } else {
                        triggerErrorEvent(elt, 'htmx:responseError', mergeObjects({error: "Response Status Error Code " + this.status + " from " + path}, eventDetail));
                    }
                } catch (e) {
                    triggerErrorEvent(elt, 'htmx:onLoadError', mergeObjects({error:e}, eventDetail));
                    throw e;
                } finally {
                    removeRequestIndicatorClasses(elt);
                    var finalElt = getInternalData(elt).replacedWith || elt;
                    triggerEvent(finalElt, 'htmx:afterRequest', eventDetail);
                    triggerEvent(finalElt, 'htmx:afterOnLoad', eventDetail);
                    endRequestLock();
                }
            }
            xhr.onerror = function () {
                removeRequestIndicatorClasses(elt);
                triggerErrorEvent(elt, 'htmx:afterRequest', eventDetail);
                triggerErrorEvent(elt, 'htmx:sendError', eventDetail);
                endRequestLock();
            }
            xhr.onabort = function() {
                removeRequestIndicatorClasses(elt);
                endRequestLock();
            }
            if(!triggerEvent(elt, 'htmx:beforeRequest', eventDetail)) return endRequestLock();
            addRequestIndicatorClasses(elt);

            forEach(['loadstart', 'loadend', 'progress', 'abort'], function(eventName) {
                forEach([xhr, xhr.upload], function (target) {
                    target.addEventListener(eventName, function(event){
                        triggerEvent(elt, "htmx:xhr:" + eventName, {
                            lengthComputable:event.lengthComputable,
                            loaded:event.loaded,
                            total:event.total
                        });
                    })
                });
            });
            xhr.send(verb === 'get' ? null : encodeParamsForBody(xhr, elt, filteredParameters));
        }

        //====================================================================
        // Extensions API
        //====================================================================
        var extensions = {};
        function extensionBase() {
            return {
                onEvent : function(name, evt) {return true;},
                transformResponse : function(text, xhr, elt) {return text;},
                isInlineSwap : function(swapStyle) {return false;},
                handleSwap : function(swapStyle, target, fragment, settleInfo) {return false;},
                encodeParameters : function(xhr, parameters, elt) {return null;}
            }
        }

        function defineExtension(name, extension) {
            extensions[name] = mergeObjects(extensionBase(), extension);
        }

        function removeExtension(name) {
            delete extensions[name];
        }

        function getExtensions(elt, extensionsToReturn) {
            if (elt == null) {
                return extensionsToReturn;
            }
            if (extensionsToReturn == null) {
                extensionsToReturn = [];
            }
            var extensionsForElement = getAttributeValue(elt, "hx-ext");
            if (extensionsForElement) {
                forEach(extensionsForElement.split(","), function(extensionName){
                    extensionName = extensionName.replace(/ /g, '');
                    var extension = extensions[extensionName];
                    if (extension && extensionsToReturn.indexOf(extension) < 0) {
                        extensionsToReturn.push(extension);
                    }
                });
            }
            return getExtensions(parentElt(elt), extensionsToReturn);
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

        function insertIndicatorStyles() {
            if (htmx.config.includeIndicatorStyles !== false) {
                getDocument().head.insertAdjacentHTML("beforeend",
                    "<style>\
                      ." + htmx.config.indicatorClass + "{opacity:0;transition: opacity 200ms ease-in;}\
                      ." + htmx.config.requestClass + " ." + htmx.config.indicatorClass + "{opacity:1}\
                      ." + htmx.config.requestClass + "." + htmx.config.indicatorClass + "{opacity:1}\
                    </style>");
            }
        }

        function getMetaConfig() {
            var element = getDocument().querySelector('meta[name="htmx-config"]');
            if (element) {
                return parseJSON(element.content);
            } else {
                return null;
            }
        }

        function mergeMetaConfig() {
            var metaConfig = getMetaConfig();
            if (metaConfig) {
                htmx.config = mergeObjects(htmx.config , metaConfig)
            }
        }

        // initialize the document
        ready(function () {
            mergeMetaConfig();
            insertIndicatorStyles();
            var body = getDocument().body;
            processNode(body);
            triggerEvent(body, 'htmx:load', {});
            window.onpopstate = function (event) {
                if (event.state && event.state.htmx) {
                    restoreHistory();
                }
            };
        })

        return htmx;
    }
)()
}));
