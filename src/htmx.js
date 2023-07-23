// UMD insanity
// This code sets up support for (in order) AMD, ES6 modules, and globals.
(function (root, factory) {
    //@ts-ignore
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        //@ts-ignore
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals
        // @ts-ignore
        root.htmx = root.htmx || factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
return (function () {
        'use strict';

        /**
         * @returns {import("./htmx").Internal.FeatureSet}
         * @param {string} name
         * @param {Partial<import("./htmx").FeaturesCollection>} features
         */
        function makeFeatureSet(name, features) {
            return {
                name: name,
                features: features,
            }
        }
        /** @type {Record<string, import("./htmx").Internal.FeatureSet>} */
        var extensionFeatures = {};

        /**
         * @type {typeof import("./htmx")}
         */
        var htmx = {
            onLoad: onLoadHelper,
            process: processNode,
            on: addEventListenerImpl,
            off: removeEventListenerImpl,
            trigger : triggerEvent,
            ajax : ajaxHelper,
            find : find,
            findAll : findAll,
            closest : closest,
            values : function(elt, type){
                var inputValues = getInputValues(elt, type || "post");
                return inputValues.values;
            },
            remove : removeElement,
            addClass : addClassToElement,
            removeClass : removeClassFromElement,
            toggleClass : toggleClassOnElement,
            takeClass : takeClassForElement,
            defineExtension : defineExtension,
            removeExtension : removeExtension,
            morph : morph,
            logAll : logAll,
            logNone : logNone,
            logger : null,
            config : {
                historyEnabled:true,
                historyCacheSize:10,
                refreshOnHistoryMiss:false,
                defaultSwapStyle:'innerHTML',
                defaultSwapDelay:0,
                defaultSettleDelay:20,
                defaultEncoding: 'application/x-www-form-urlencoded',
                includeIndicatorStyles:true,
                indicatorClass:'htmx-indicator',
                requestClass:'htmx-request',
                addedClass:'htmx-added',
                settlingClass:'htmx-settling',
                swappingClass:'htmx-swapping',
                allowEval:true,
                inlineScriptNonce:'',
                attributesToSettle:["class", "style", "width", "height"],
                withCredentials:false,
                timeout:0,
                wsReconnectDelay: 'full-jitter',
                wsBinaryType: 'blob',
                disableSelector: "[hx-disable], [data-hx-disable]",
                useTemplateFragments: false,
                scrollBehavior: 'smooth',
                defaultFocusScroll: false,
                getCacheBusterParam: false,
                globalViewTransitions: false,
            },
            parseInterval:parseInterval,
            _:internalEval,
            createEventSource: function(url){
                return new EventSource(url, {withCredentials:true})
            },
            // TODO 2.0 - should we remove/move these?
            createWebSocket: function(url){
                var sock = new WebSocket(url, []);
                sock.binaryType = htmx.config.wsBinaryType;
                return sock;
            },
            version: "1.9.3",
            registerExtension: registerExtension
        };

        var internalAPI = {
            addTriggerHandler: addTriggerHandler,
            bodyContains: bodyContains,
            canAccessLocalStorage: canAccessLocalStorage,
            findThisElement: findThisElement,
            filterValues: filterValues,
            hasAttribute: hasAttribute,
            getAttributeValue: getAttributeValue,
            getClosestAttributeValue: getClosestAttributeValue,
            getClosestMatch: getClosestMatch,
            getExpressionVars: getExpressionVars,
            getHeaders: getHeaders,
            getInputValues: getInputValues,
            getInternalData: getInternalData,
            getSwapSpecification: getSwapSpecification,
            getTriggerSpecs: getTriggerSpecs,
            getTarget: getTarget,
            makeFragment: makeFragment,
            mergeObjects: mergeObjects,
            makeSettleInfo: makeSettleInfo,
            oobSwap: oobSwap,
            querySelectorExt: querySelectorExt,
            selectAndSwap: selectAndSwap,
            settleImmediately: settleImmediately,
            shouldCancel: shouldCancel,
            triggerEvent: triggerEvent,
            triggerErrorEvent: triggerErrorEvent,
            withExtensions: withExtensions,
        }

        var coreFeatureSet = makeFeatureSet("htmx", {
            encodings: {
                "application/x-www-form-urlencoded": (values) => {
                    var returnStr = "";
                    for (var name in values) {
                        if (values.hasOwnProperty(name)) {
                            var value = values[name];
                            if (Array.isArray(value)) {
                                forEach(value, function (v) {
                                    returnStr = appendParam(returnStr, name, v);
                                });
                            } else {
                                returnStr = appendParam(returnStr, name, value);
                            }
                        }
                    }
                    return { body: returnStr, contentType: "application/x-www-form-urlencoded" };
                },
                "multipart/form-data": (values) => {
                    var formData = new FormData();
                    for (var name in values) {
                        if (values.hasOwnProperty(name)) {
                            var value = values[name];
                            if (Array.isArray(value)) {
                                forEach(value, function (v) {
                                    formData.append(name, v);
                                });
                            } else {
                                formData.append(name, value);
                            }
                        }
                    }
                    // contentType is null, because the browser will generate it automatically
                    return { body: formData, contentType: null }
                }
            },
            swaps: {
                "none": { handleSwap: () => { } },
                "innerHTML": { handleSwap: swapInnerHTML },
                "outerHTML": { handleSwap: swapOuterHTML, isInlineSwap: true },
                "afterbegin": { handleSwap: swapAfterBegin },
                "beforebegin": { handleSwap: swapBeforeBegin },
                "beforeend": { handleSwap: swapBeforeEnd },
                "afterend": { handleSwap: swapAfterEnd },
                "delete": { handleSwap: swapDelete },
                "morph": "morph:outerHTML",
                "morph:outerHTML": { handleSwap: (target, fragment) => swapMorph(target, fragment, "outerHTML"), isInlineSwap: true },
                "morph:innerHTML": { handleSwap: (target, fragment) => swapMorph(target, fragment, "innerHTML") },
            },
        });
        var VERBS = ['get', 'post', 'put', 'delete', 'patch'];
        var VERB_SELECTOR = VERBS.map(function(verb){
            return "[hx-" + verb + "], [data-hx-" + verb + "]"
        }).join(", ");

        //====================================================================
        // Utilities
        //====================================================================

        function parseInterval(str) {
            if (str == undefined)  {
                return undefined
            }
            if (str.slice(-2) == "ms") {
                return parseFloat(str.slice(0,-2)) || undefined
            }
            if (str.slice(-1) == "s") {
                return (parseFloat(str.slice(0,-1)) * 1000) || undefined
            }
            if (str.slice(-1) == "m") {
                return (parseFloat(str.slice(0,-1)) * 1000 * 60) || undefined
            }
            return parseFloat(str) || undefined
        }

        /**
         * @param {HTMLElement} elt
         * @param {string} name
         * @returns {(string | null)}
         */
        function getRawAttribute(elt, name) {
            return elt.getAttribute && elt.getAttribute(name);
        }

        // resolve with both hx and data-hx prefixes
        function hasAttribute(elt, qualifiedName) {
            return elt.hasAttribute && (elt.hasAttribute(qualifiedName) ||
                elt.hasAttribute("data-" + qualifiedName));
        }

        /**
         *
         * @param {HTMLElement} elt
         * @param {string} qualifiedName
         * @returns {(string | null)}
         */
        function getAttributeValue(elt, qualifiedName) {
            return getRawAttribute(elt, qualifiedName) || getRawAttribute(elt, "data-" + qualifiedName);
        }

        /**
         * @param {HTMLElement} elt
         * @returns {HTMLElement | null}
         */
        function parentElt(elt) {
            return elt.parentElement;
        }

        /**
         * @returns {Document}
         */
        function getDocument() {
            return document;
        }

        /**
         * @param {HTMLElement} elt
         * @param {(e:HTMLElement) => boolean} condition
         * @returns {HTMLElement | null}
         */
        function getClosestMatch(elt, condition) {
            while (elt && !condition(elt)) {
                elt = parentElt(elt);
            }

            return elt ? elt : null;
        }

        function getAttributeValueWithDisinheritance(initialElement, ancestor, attributeName){
            var attributeValue = getAttributeValue(ancestor, attributeName);
            var disinherit = getAttributeValue(ancestor, "hx-disinherit");
            if (initialElement !== ancestor && disinherit && (disinherit === "*" || disinherit.split(" ").indexOf(attributeName) >= 0)) {
                return "unset";
            } else {
                return attributeValue
            }
        }

        /**
         * @param {HTMLElement} elt
         * @param {string} attributeName
         * @returns {string | null}
         */
        function getClosestAttributeValue(elt, attributeName) {
            var closestAttr = null;
            getClosestMatch(elt, function (e) {
                return !!(closestAttr = getAttributeValueWithDisinheritance(elt, e, attributeName));
            });
            if (closestAttr !== "unset") {
                return closestAttr;
            }
        }

        /**
         * @param {HTMLElement} elt
         * @param {string} selector
         * @returns {boolean}
         */
        function matches(elt, selector) {
            // @ts-ignore: non-standard properties for browser compatability
            // noinspection JSUnresolvedVariable
            var matchesFunction = elt.matches || elt.matchesSelector || elt.msMatchesSelector || elt.mozMatchesSelector || elt.webkitMatchesSelector || elt.oMatchesSelector;
            return matchesFunction && matchesFunction.call(elt, selector);
        }

        /**
         * @param {string} str
         * @returns {string}
         */
        function getStartTag(str) {
            var tagMatcher = /<([a-z][^\/\0>\x20\t\r\n\f]*)/i
            var match = tagMatcher.exec( str );
            if (match) {
                return match[1].toLowerCase();
            } else {
                return "";
            }
        }

        /**
         *
         * @param {string} resp
         * @param {number} depth
         * @returns {Element}
         */
        function parseHTML(resp, depth) {
            var parser = new DOMParser();
            var responseDoc = parser.parseFromString(resp, "text/html");

            /** @type {Element} */
            var responseNode = responseDoc.body;
            while (depth > 0) {
                depth--;
                // @ts-ignore
                responseNode = responseNode.firstChild;
            }
            if (responseNode == null) {
                // @ts-ignore
                responseNode = getDocument().createDocumentFragment();
            }
            return responseNode;
        }

        function aFullPageResponse(resp) {
            return resp.match(/<body/);
        }

        /**
         *
         * @param {string} resp
         * @returns {Element}
         */
        function makeFragment(resp) {
            var partialResponse = !aFullPageResponse(resp);
            if (htmx.config.useTemplateFragments && partialResponse) {
                var documentFragment = parseHTML("<body><template>" + resp + "</template></body>", 0);
                // @ts-ignore type mismatch between DocumentFragment and Element.
                // TODO: Are these close enough for htmx to use interchangably?
                return documentFragment.querySelector('template').content;
            } else {
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
        }

        /**
         * @param {Function} func
         */
        function maybeCall(func){
            if(func) {
                func();
            }
        }

        /**
         * @param {any} o
         * @param {string} type
         * @returns
         */
        function isType(o, type) {
            return Object.prototype.toString.call(o) === "[object " + type + "]";
        }

        /**
         * @param {*} o
         * @returns {o is Function}
         */
        function isFunction(o) {
            return isType(o, "Function");
        }

        /**
         * @param {*} o
         * @returns {o is Object}
         */
        function isRawObject(o) {
            return isType(o, "Object");
        }

        /**
         * getInternalData retrieves "private" data stored by htmx within an element
         * @param {HTMLElement} elt
         * @returns {*}
         */
        function getInternalData(elt) {
            var dataProp = 'htmx-internal-data';
            var data = elt[dataProp];
            if (!data) {
                data = elt[dataProp] = {};
            }
            return data;
        }

        /**
         * toArray converts an ArrayLike object into a real array.
         * @param {ArrayLike} arr
         * @returns {any[]}
         */
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

        /**
         * mergeObjects takes all of the keys from
         * obj2 and duplicates them into obj1
         * @param {Object} obj1
         * @param {Object} obj2
         * @returns {Object}
         */
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

        function canAccessLocalStorage() {
            var test = 'htmx:localStorageTest';
            try {
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
            } catch(e) {
                return false;
            }
        }

        function normalizePath(path) {
            const base = path.startsWith("/") ? window.location.origin : undefined
            var url = new URL(path, base);
            if (url) {
                path = url.pathname + url.search;
            }
            // remove trailing slash, unless index page
            if (!path.match('^/$')) {
                path = path.replace(/\/+$/, '');
            }
            return path;
        }

        //==========================================================================================
        // public API
        //==========================================================================================

        function internalEval(str){
            return maybeEval(getDocument().body, function () {
                return eval(str);
            });
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

        function logNone() {
            htmx.logger = null
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
                setTimeout(function(){
                    removeElement(elt);
                    elt = null;
                }, delay);
            } else {
                elt.parentElement.removeChild(elt);
            }
        }

        function addClassToElement(elt, clazz, delay) {
            elt = resolveTarget(elt);
            if (delay) {
                setTimeout(function(){
                    addClassToElement(elt, clazz);
                    elt = null;
                }, delay);
            } else {
                elt.classList && elt.classList.add(clazz);
            }
        }

        function removeClassFromElement(elt, clazz, delay) {
            elt = resolveTarget(elt);
            if (delay) {
                setTimeout(function(){
                    removeClassFromElement(elt, clazz);
                    elt = null;
                }, delay);
            } else {
                if (elt.classList) {
                    elt.classList.remove(clazz);
                    // if there are no classes left, remove the class attribute
                    if (elt.classList.length === 0) {
                        elt.removeAttribute("class");
                    }
                }
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
            return elt.closest(selector);
        }

        function normalizeSelector(selector) {
            var trimmedSelector = selector.trim();
            if (trimmedSelector.startsWith("<") && trimmedSelector.endsWith("/>")) {
                return trimmedSelector.substring(1, trimmedSelector.length - 2);
            } else {
                return trimmedSelector;
            }
        }

        function querySelectorAllExt(elt, selector) {
            if (selector.indexOf("closest ") === 0) {
                return [closest(elt, normalizeSelector(selector.substr(8)))];
            } else if (selector.indexOf("find ") === 0) {
                return [find(elt, normalizeSelector(selector.substr(5)))];
            } else if (selector.indexOf("next ") === 0) {
                return [scanForwardQuery(elt, normalizeSelector(selector.substr(5)))];
            } else if (selector.indexOf("previous ") === 0) {
                return [scanBackwardsQuery(elt, normalizeSelector(selector.substr(9)))];
            } else if (selector === 'document') {
                return [document];
            } else if (selector === 'window') {
                return [window];
            } else {
                return getDocument().querySelectorAll(normalizeSelector(selector));
            }
        }

        var scanForwardQuery = function(start, match) {
            var results = getDocument().querySelectorAll(match);
            for (var i = 0; i < results.length; i++) {
                var elt = results[i];
                if (elt.compareDocumentPosition(start) === Node.DOCUMENT_POSITION_PRECEDING) {
                    return elt;
                }
            }
        }

        var scanBackwardsQuery = function(start, match) {
            var results = getDocument().querySelectorAll(match);
            for (var i = results.length - 1; i >= 0; i--) {
                var elt = results[i];
                if (elt.compareDocumentPosition(start) === Node.DOCUMENT_POSITION_FOLLOWING) {
                    return elt;
                }
            }
        }

        function querySelectorExt(eltOrSelector, selector) {
            if (selector) {
                return querySelectorAllExt(eltOrSelector, selector)[0];
            } else {
                return querySelectorAllExt(getDocument().body, eltOrSelector)[0];
            }
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

        var DUMMY_ELT = getDocument().createElement("output"); // dummy element for bad selectors
        function findAttributeTargets(elt, attrName) {
            var attrTarget = getClosestAttributeValue(elt, attrName);
            if (attrTarget) {
                if (attrTarget === "this") {
                    return [findThisElement(elt, attrName)];
                } else {
                    var result = querySelectorAllExt(elt, attrTarget);
                    if (result.length === 0) {
                        logError('The selector "' + attrTarget + '" on ' + attrName + " returned no matches!");
                        return [DUMMY_ELT]
                    } else {
                        return result;
                    }
                }
            }
        }

        function findThisElement(elt, attribute){
            return getClosestMatch(elt, function (elt) {
                return getAttributeValue(elt, attribute) != null;
            })
        }

        function getTarget(elt) {
            var targetStr = getClosestAttributeValue(elt, "hx-target");
            if (targetStr) {
                if (targetStr === "this") {
                    return findThisElement(elt,'hx-target');
                } else {
                    return querySelectorExt(elt, targetStr)
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

        /**
         *
         * @param {string} oobValue
         * @param {HTMLElement} oobElement
         * @param {*} settleInfo
         * @returns
         */
        function oobSwap(oobValue, oobElement, settleInfo) {
            var selector = "#" + oobElement.id;
            var swapStyle = "outerHTML";
            if (oobValue === "true") {
                // do nothing
            } else if (oobValue.indexOf(":") > 0) {
                swapStyle = oobValue.substr(0, oobValue.indexOf(":"));
                selector  = oobValue.substr(oobValue.indexOf(":") + 1, oobValue.length);
            } else {
                swapStyle = oobValue;
            }

            var targets = getDocument().querySelectorAll(selector);
            if (targets) {
                forEach(
                    targets,
                    function (target) {
                        var fragment;
                        /** @type {import("./htmx").Swap} */
                        var swapFeature = getFeature(target, "swaps", swapStyle);

                        var oobElementClone = oobElement.cloneNode(true);

                        fragment = getDocument().createDocumentFragment();
                        fragment.appendChild(oobElementClone);

                        if (swapStyle != "outerHTML" && swapFeature && !swapFeature.isInlineSwap) {
                            fragment = oobElementClone
                        }

                        var beforeSwapDetails = {shouldSwap: true, target: target, fragment:fragment };
                        if (!triggerEvent(target, 'htmx:oobBeforeSwap', beforeSwapDetails)) return;

                        target = beforeSwapDetails.target; // allow re-targeting
                        if (beforeSwapDetails['shouldSwap']){
                            swap(swapStyle, target, target, fragment, settleInfo);
                        }
                        forEach(settleInfo.elts, function (elt) {
                            triggerEvent(elt, 'htmx:oobAfterSwap', beforeSwapDetails);
                        });
                    }
                );
                oobElement.parentNode.removeChild(oobElement);
            } else {
                oobElement.parentNode.removeChild(oobElement);
                triggerErrorEvent(getDocument().body, "htmx:oobErrorNoTarget", {content: oobElement});
            }
            return oobValue;
        }

        function handleOutOfBandSwaps(elt, fragment, settleInfo) {
            var oobSelects = getClosestAttributeValue(elt, "hx-select-oob");
            if (oobSelects) {
                var oobSelectValues = oobSelects.split(",");
                for (let i = 0; i < oobSelectValues.length; i++) {
                    var oobSelectValue = oobSelectValues[i].split(":", 2);
                    var id = oobSelectValue[0].trim();
                    if (id.indexOf("#") === 0) {
                        id = id.substring(1);
                    }
                    var oobValue = oobSelectValue[1] || "true";
                    var oobElement = fragment.querySelector("#" + id);
                    if (oobElement) {
                        oobSwap(oobValue, oobElement, settleInfo);
                    }
                }
            }
            forEach(findAll(fragment, '[hx-swap-oob], [data-hx-swap-oob]'), function (oobElement) {
                var oobValue = getAttributeValue(oobElement, "hx-swap-oob");
                if (oobValue != null) {
                    oobSwap(oobValue, oobElement, settleInfo);
                }
            });
        }

        function handlePreservedElements(fragment) {
            forEach(findAll(fragment, '[hx-preserve], [data-hx-preserve]'), function (preservedElt) {
                var id = getAttributeValue(preservedElt, "id");
                var oldElt = getDocument().getElementById(id);
                if (oldElt != null) {
                    preservedElt.parentNode.replaceChild(oldElt, preservedElt);
                }
            });
        }

        function handleAttributes(parentNode, fragment, settleInfo) {
            forEach(fragment.querySelectorAll("[id]"), function (newNode) {
                if (newNode.id && newNode.id.length > 0) {
                    var normalizedId = newNode.id.replace("'", "\\'");
                    var normalizedTag = newNode.tagName.replace(':', '\\:');
                    var oldNode = parentNode.querySelector(normalizedTag + "[id='" + normalizedId + "']");
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

        function pushChildLoadTasks(child, settleInfo) {
            if (child.nodeType == Node.TEXT_NODE || child.nodeType == Node.COMMENT_NODE) return

            const task = () => {
                removeClassFromElement(child, htmx.config.addedClass)
                processNode(child)
                processScripts(child)
                processFocus(child)
                triggerEvent(child, 'htmx:load')
            }
            settleInfo.tasks.push(task)
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
                addClassToElement(child, htmx.config.addedClass);
                parentNode.insertBefore(child, insertBefore);
                pushChildLoadTasks(child, settleInfo)
            }
        }

        // based on https://gist.github.com/hyamamoto/fd435505d29ebfa3d9716fd2be8d42f0,
        // derived from Java's string hashcode implementation
        function stringHash(string, hash) {
            var char = 0;
            while (char < string.length){
                hash = (hash << 5) - hash + string.charCodeAt(char++) | 0; // bitwise or ensures we have a 32-bit int
            }
            return hash;
        }

        function attributeHash(elt) {
            var hash = 0;
            for (var i = 0; i < elt.attributes.length; i++) {
                var attribute = elt.attributes[i];
                if(attribute.value){ // only include attributes w/ actual values (empty is same as non-existent)
                    hash = stringHash(attribute.name, hash);
                    hash = stringHash(attribute.value, hash);
                }
            }
            return hash;
        }

        function deInitNode(element) {
            var internalData = getInternalData(element);
            if (internalData.timeout) {
                clearTimeout(internalData.timeout);
            }
            if (internalData.listenerInfos) {
                forEach(internalData.listenerInfos, function (info) {
                    if (info.on) {
                        info.on.removeEventListener(info.trigger, info.listener);
                    }
                });
            }
            if (internalData.onHandlers) {
                for (let i = 0; i < internalData.onHandlers.length; i++) {
                    const handlerInfo = internalData.onHandlers[i];
                    element.removeEventListener(handlerInfo.name, handlerInfo.handler);
                }
            }
        }

        function cleanUpElement(element) {
            triggerEvent(element, "htmx:beforeCleanupElement")
            deInitNode(element);
            forEach(element.children, function(child) { cleanUpElement(child) });
        }

        function swapOuterHTML(target, fragment, settleInfo) {
            if (target.tagName === "BODY") {
                return swapInnerHTML(target, fragment, settleInfo);
            } else {
                /** @type {Node} */
                var newElt
                var eltBeforeNewContent = target.previousSibling;
                insertNodesBefore(parentElt(target), target, fragment, settleInfo);
                if (eltBeforeNewContent == null) {
                    newElt = parentElt(target).firstChild;
                } else {
                    newElt = eltBeforeNewContent.nextSibling;
                }
                getInternalData(target).replacedWith = newElt; // tuck away so we can fire events on it later
                settleInfo.elts = [] // clear existing elements
                while(newElt && newElt !== target) {
                    if (newElt.nodeType === Node.ELEMENT_NODE) {
                        settleInfo.elts.push(newElt);
                    }
                    newElt = newElt.nextElementSibling;
                }
                cleanUpElement(target);
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
        function swapDelete(target, fragment, settleInfo) {
            cleanUpElement(target);
            return parentElt(target).removeChild(target);
        }

        function swapInnerHTML(target, fragment, settleInfo) {
            var firstChild = target.firstChild;
            insertNodesBefore(target, firstChild, fragment, settleInfo);
            if (firstChild) {
                while (firstChild.nextSibling) {
                    cleanUpElement(firstChild.nextSibling)
                    target.removeChild(firstChild.nextSibling);
                }
                cleanUpElement(firstChild)
                target.removeChild(firstChild);
            }
        }

        /** @returns {import("./htmx").SwapResult} */
        function swapMorph(target, fragment, morphStyle) {
            const newElements = morph(target, fragment.children, { morphStyle })
            return { newElements: newElements };
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
            /** @type {import("./htmx").Swap} */
            var swapFeature = getFeature(elt, "swaps", swapStyle);

            if (!swapFeature) {
                swapFeature = getFeature(elt, "swaps", htmx.config.defaultSwapStyle)
            }

            var swapResult = swapFeature.handleSwap(target, fragment, settleInfo);

            if (swapResult && swapResult.newElements && swapResult.newElements.length) {
                for (const child of swapResult.newElements) {
                    pushChildLoadTasks(child, settleInfo)
                }
            }
        }

        function findTitle(content) {
            if (content.indexOf('<title') > -1) {
                var contentWithSvgsRemoved = content.replace(/<svg(\s[^>]*>|>)([\s\S]*?)<\/svg>/gim, '');
                var result = contentWithSvgsRemoved.match(/<title(\s[^>]*>|>)([\s\S]*?)<\/title>/im);

                if (result) {
                    return result[2];
                }
            }
        }

        function selectAndSwap(swapStyle, target, elt, responseText, settleInfo) {
            settleInfo.title = findTitle(responseText);
            var fragment = makeFragment(responseText);
            if (fragment) {
                handleOutOfBandSwaps(elt, fragment, settleInfo);
                fragment = maybeSelectFromResponse(elt, fragment);
                handlePreservedElements(fragment);
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
        var WHITESPACE_OR_COMMA = /[\s,]/;
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

        function maybeGenerateConditional(elt, tokens, paramName) {
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
                                var conditionFunction = maybeEval(elt,function () {
                                    return Function(conditionalSource)();
                                    },
                                    function(){return true})
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

        var INPUT_SELECTOR = 'input, textarea, select';

        /**
         * @param {HTMLElement} elt
         */
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
                            every.pollInterval = parseInterval(consumeUntil(tokens, /[,\[\s]/));
                            consumeUntil(tokens, NOT_WHITESPACE);
                            var eventFilter = maybeGenerateConditional(elt, tokens, "event");
                            if (eventFilter) {
                                every.eventFilter = eventFilter;
                            }
                            triggerSpecs.push(every);
                        } else {
                            var triggerSpec = {trigger: trigger};
                            var eventFilter = maybeGenerateConditional(elt, tokens, "event");
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
                                } else if (token === "consume") {
                                    triggerSpec.consume = true;
                                } else if (token === "delay" && tokens[0] === ":") {
                                    tokens.shift();
                                    triggerSpec.delay = parseInterval(consumeUntil(tokens, WHITESPACE_OR_COMMA));
                                } else if (token === "from" && tokens[0] === ":") {
                                    tokens.shift();
                                    var from_arg = consumeUntil(tokens, WHITESPACE_OR_COMMA);
                                    if (from_arg === "closest" || from_arg === "find" || from_arg === "next" || from_arg === "previous") {
                                        tokens.shift();
                                        from_arg +=
                                            " " +
                                            consumeUntil(
                                                tokens,
                                                WHITESPACE_OR_COMMA
                                            );
                                    }
                                    triggerSpec.from = from_arg;
                                } else if (token === "target" && tokens[0] === ":") {
                                    tokens.shift();
                                    triggerSpec.target = consumeUntil(tokens, WHITESPACE_OR_COMMA);
                                } else if (token === "throttle" && tokens[0] === ":") {
                                    tokens.shift();
                                    triggerSpec.throttle = parseInterval(consumeUntil(tokens, WHITESPACE_OR_COMMA));
                                } else if (token === "queue" && tokens[0] === ":") {
                                    tokens.shift();
                                    triggerSpec.queue = consumeUntil(tokens, WHITESPACE_OR_COMMA);
                                } else if ((token === "root" || token === "threshold") && tokens[0] === ":") {
                                    tokens.shift();
                                    triggerSpec[token] = consumeUntil(tokens, WHITESPACE_OR_COMMA);
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
            } else if (matches(elt, 'input[type="button"]')){
                return [{trigger: 'click'}];
            } else if (matches(elt, INPUT_SELECTOR)) {
                return [{trigger: 'change'}];
            } else {
                return [{trigger: 'click'}];
            }
        }

        function cancelPolling(elt) {
            getInternalData(elt).cancelled = true;
        }

        function processPolling(elt, handler, spec) {
            var nodeData = getInternalData(elt);
            nodeData.timeout = setTimeout(function () {
                if (bodyContains(elt) && nodeData.cancelled !== true) {
                    if (!maybeFilterEvent(spec, elt, makeEvent('hx:poll:trigger', {
                        triggerSpec: spec,
                        target: elt
                    }))) {
                        handler(elt);
                    }
                    processPolling(elt, handler, spec);
                }
            }, spec.pollInterval);
        }

        function isLocalLink(elt) {
            return location.hostname === elt.hostname &&
                getRawAttribute(elt,'href') &&
                getRawAttribute(elt,'href').indexOf("#") !== 0;
        }

        function boostElement(elt, nodeData, triggerSpecs) {
            if ((elt.tagName === "A" && isLocalLink(elt) && (elt.target === "" || elt.target === "_self")) || elt.tagName === "FORM") {
                nodeData.boosted = true;
                var verb, path;
                if (elt.tagName === "A") {
                    verb = "get";
                    path = elt.href; // DOM property gives the fully resolved href of a relative link
                } else {
                    var rawAttribute = getRawAttribute(elt, "method");
                    verb = rawAttribute ? rawAttribute.toLowerCase() : "get";
                    if (verb === "get") {
                    }
                    path = getRawAttribute(elt, 'action');
                }
                triggerSpecs.forEach(function(triggerSpec) {
                    addEventListener(elt, function(elt, evt) {
                        issueAjaxRequest(verb, path, elt, evt)
                    }, nodeData, triggerSpec, true);
                });
            }
        }

        /**
         *
         * @param {Event} evt
         * @param {HTMLElement} elt
         * @returns
         */
        function shouldCancel(evt, elt) {
            if (evt.type === "submit" || evt.type === "click") {
                if (elt.tagName === "FORM") {
                    return true;
                }
                if (matches(elt, 'input[type="submit"], button') && closest(elt, 'form') !== null) {
                    return true;
                }
                if (elt.tagName === "A" && elt.href &&
                    (elt.getAttribute('href') === '#' || elt.getAttribute('href').indexOf("#") !== 0)) {
                    return true;
                }
            }
            return false;
        }

        function ignoreBoostedAnchorCtrlClick(elt, evt) {
            return getInternalData(elt).boosted && elt.tagName === "A" && evt.type === "click" && (evt.ctrlKey || evt.metaKey);
        }

        function maybeFilterEvent(triggerSpec, elt, evt) {
            var eventFilter = triggerSpec.eventFilter;
            if(eventFilter){
                try {
                    return eventFilter.call(elt, evt) !== true;
                } catch(e) {
                    triggerErrorEvent(getDocument().body, "htmx:eventFilter:error", {error: e, source:eventFilter.source});
                    return true;
                }
            }
            return false;
        }

        function addEventListener(elt, handler, nodeData, triggerSpec, explicitCancel) {
            var elementData = getInternalData(elt);
            var eltsToListenOn;
            if (triggerSpec.from) {
                eltsToListenOn = querySelectorAllExt(elt, triggerSpec.from);
            } else {
                eltsToListenOn = [elt];
            }
            // store the initial value of the element so we can tell if it changes
            if (triggerSpec.changed) {
                elementData.lastValue = elt.value;
            }
            forEach(eltsToListenOn, function (eltToListenOn) {
                var eventListener = function (evt) {
                    if (!bodyContains(elt)) {
                        eltToListenOn.removeEventListener(triggerSpec.trigger, eventListener);
                        return;
                    }
                    if (ignoreBoostedAnchorCtrlClick(elt, evt)) {
                        return;
                    }
                    if (explicitCancel || shouldCancel(evt, elt)) {
                        evt.preventDefault();
                    }
                    if (maybeFilterEvent(triggerSpec, elt, evt)) {
                        return;
                    }
                    var eventData = getInternalData(evt);
                    eventData.triggerSpec = triggerSpec;
                    if (eventData.handledFor == null) {
                        eventData.handledFor = [];
                    }
                    if (eventData.handledFor.indexOf(elt) < 0) {
                        eventData.handledFor.push(elt);
                        if (triggerSpec.consume) {
                            evt.stopPropagation();
                        }
                        if (triggerSpec.target && evt.target) {
                            if (!matches(evt.target, triggerSpec.target)) {
                                return;
                            }
                        }
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
                            if (!elementData.throttle) {
                                handler(elt, evt);
                                elementData.throttle = setTimeout(function () {
                                    elementData.throttle = null;
                                }, triggerSpec.throttle);
                            }
                        } else if (triggerSpec.delay) {
                            elementData.delayed = setTimeout(function() { handler(elt, evt) }, triggerSpec.delay);
                        } else {
                            triggerEvent(elt, 'htmx:trigger')
                            handler(elt, evt);
                        }
                    }
                };
                if (nodeData.listenerInfos == null) {
                    nodeData.listenerInfos = [];
                }
                nodeData.listenerInfos.push({
                    trigger: triggerSpec.trigger,
                    listener: eventListener,
                    on: eltToListenOn
                })
                eltToListenOn.addEventListener(triggerSpec.trigger, eventListener);
            });
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
            if (!hasAttribute(elt,'data-hx-revealed') && isScrolledIntoView(elt)) {
                elt.setAttribute('data-hx-revealed', 'true');
                var nodeData = getInternalData(elt);
                if (nodeData.initHash) {
                    triggerEvent(elt, 'revealed');
                } else {
                    // if the node isn't initialized, wait for it before triggering the request
                    elt.addEventListener("htmx:afterProcessNode", function(evt) { triggerEvent(elt, 'revealed') }, {once: true});
                }
            }
        }

        function loadImmediately(elt, handler, nodeData, delay) {
            var load = function(){
                if (!nodeData.loaded) {
                    nodeData.loaded = true;
                    handler(elt);
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
                        addTriggerHandler(elt, triggerSpec, nodeData, function (elt, evt) {
                            issueAjaxRequest(verb, path, elt, evt)
                        })
                    });
                }
            });
            return explicitAction;
        }

        function addTriggerHandler(elt, triggerSpec, nodeData, handler) {
            if (triggerSpec.trigger === "revealed") {
                initScrollHandler();
                addEventListener(elt, handler, nodeData, triggerSpec);
                maybeReveal(elt);
            } else if (triggerSpec.trigger === "intersect") {
                var observerOptions = {};
                if (triggerSpec.root) {
                    observerOptions.root = querySelectorExt(elt, triggerSpec.root)
                }
                if (triggerSpec.threshold) {
                    observerOptions.threshold = parseFloat(triggerSpec.threshold);
                }
                var observer = new IntersectionObserver(function (entries) {
                    for (var i = 0; i < entries.length; i++) {
                        var entry = entries[i];
                        if (entry.isIntersecting) {
                            triggerEvent(elt, "intersect");
                            break;
                        }
                    }
                }, observerOptions);
                observer.observe(elt);
                addEventListener(elt, handler, nodeData, triggerSpec);
            } else if (triggerSpec.trigger === "load") {
                if (!maybeFilterEvent(triggerSpec, elt, makeEvent("load", {elt: elt}))) {
                                loadImmediately(elt, handler, nodeData, triggerSpec.delay);
                            }
            } else if (triggerSpec.pollInterval) {
                nodeData.polling = true;
                processPolling(elt, handler, triggerSpec);
            } else {
                addEventListener(elt, handler, nodeData, triggerSpec);
            }
        }

        function evalScript(script) {
            if (script.type === "text/javascript" || script.type === "module" || script.type === "") {
                var newScript = getDocument().createElement("script");
                forEach(script.attributes, function (attr) {
                    newScript.setAttribute(attr.name, attr.value);
                });
                newScript.textContent = script.textContent;
                newScript.async = false;
                if (htmx.config.inlineScriptNonce) {
                    newScript.nonce = htmx.config.inlineScriptNonce;
                }
                var parent = script.parentElement;

                try {
                    parent.insertBefore(newScript, script);
                } catch (e) {
                    logError(e);
                } finally {
                    // remove old script element, but only if it is still in DOM
                    if (script.parentElement) {
                        script.parentElement.removeChild(script);
                    }
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

        function hasChanceOfBeingBoosted() {
            return document.querySelector("[hx-boost], [data-hx-boost]");
        }

        function findElementsToProcess(elt) {
            if (elt.querySelectorAll) {
                var boostedElts = hasChanceOfBeingBoosted() ? ", a, form" : "";
                var results = elt.querySelectorAll(VERB_SELECTOR + boostedElts + ", [hx-ext], [data-hx-ext], [hx-trigger], [data-hx-trigger], [hx-on], [data-hx-on]");
                return results;
            } else {
                return [];
            }
        }

        function initButtonTracking(form){
            var maybeSetLastButtonClicked = function(evt){
                var elt = closest(evt.target, "button, input[type='submit']");
                if (elt !== null) {
                    var internalData = getInternalData(form);
                    internalData.lastButtonClicked = elt;
                }
            };

            // need to handle both click and focus in:
            //   focusin - in case someone tabs in to a button and hits the space bar
            //   click - on OSX buttons do not focus on click see https://bugs.webkit.org/show_bug.cgi?id=13724

            form.addEventListener('click', maybeSetLastButtonClicked)
            form.addEventListener('focusin', maybeSetLastButtonClicked)
            form.addEventListener('focusout', function(evt){
                var internalData = getInternalData(form);
                internalData.lastButtonClicked = null;
            })
        }

        function countCurlies(line) {
            var tokens = tokenizeString(line);
            var netCurlies = 0;
            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];
                if (token === "{") {
                    netCurlies++;
                } else if (token === "}") {
                    netCurlies--;
                }
            }
            return netCurlies;
        }

        function addHxOnEventHandler(elt, eventName, code) {
            var nodeData = getInternalData(elt);
            nodeData.onHandlers = [];
            var func = new Function("event", code + "; return;");
            var listener = elt.addEventListener(eventName, function (e) {
                return func.call(elt, e);
            });
            nodeData.onHandlers.push({event:eventName, listener:listener});
            return {nodeData, code, func, listener};
        }

        function processHxOn(elt) {
            var hxOnValue = getAttributeValue(elt, 'hx-on');
            if (hxOnValue && htmx.config.allowEval) {
                var handlers = {}
                var lines = hxOnValue.split("\n");
                var currentEvent = null;
                var curlyCount = 0;
                while (lines.length > 0) {
                    var line = lines.shift();
                    var match = line.match(/^\s*([a-zA-Z:\-]+:)(.*)/);
                    if (curlyCount === 0 && match) {
                        line.split(":")
                        currentEvent = match[1].slice(0, -1); // strip last colon
                        handlers[currentEvent] = match[2];
                    } else {
                        handlers[currentEvent] += line;
                    }
                    curlyCount += countCurlies(line);
                }

                for (var eventName in handlers) {
                    addHxOnEventHandler(elt, eventName, handlers[eventName]);
                }
            }
        }

        function initNode(elt) {
            if (elt.closest && elt.closest(htmx.config.disableSelector)) {
                return;
            }
            var nodeData = getInternalData(elt);
            if (nodeData.initHash !== attributeHash(elt)) {

                nodeData.initHash = attributeHash(elt);

                // clean up any previously processed info
                deInitNode(elt);

                processHxOn(elt);

                triggerEvent(elt, "htmx:beforeProcessNode")

                if (elt.value) {
                    nodeData.lastValue = elt.value;
                }

                var triggerSpecs = getTriggerSpecs(elt);
                var hasExplicitHttpAction = processVerbs(elt, nodeData, triggerSpecs);

                if (!hasExplicitHttpAction) {
                    if (getClosestAttributeValue(elt, "hx-boost") === "true") {
                        boostElement(elt, nodeData, triggerSpecs);
                    } else if (hasAttribute(elt, 'hx-trigger')) {
                        triggerSpecs.forEach(function (triggerSpec) {
                            // For "naked" triggers, don't do anything at all
                            addTriggerHandler(elt, triggerSpec, nodeData, function () {
                            })
                        })
                    }
                }

                if (elt.tagName === "FORM") {
                    initButtonTracking(elt);
                }

                triggerEvent(elt, "htmx:afterProcessNode");
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
            return eventName === "htmx:afterProcessNode"
        }

        /**
         * `withExtensions` locates all active extensions for a provided element, then
         * executes the provided function using each of the active extensions.  It should
         * be called internally at every extendable execution point in htmx.
         *
         * @param {HTMLElement} elt
         * @param {(extension:htmx.HtmxExtension) => void} toDo
         * @returns void
         */
        function withExtensions(elt, toDo) {
            forEach(getExtensions(elt), function(extension){
                try {
                    toDo(extension);
                } catch (e) {
                    logError(e);
                }
            });
        }

        /**
         * @returns {any}
         * @param {HTMLElement} elt an element for which we attempt to discover available features
         * @param {keyof import("./htmx").FeaturesCollection} featureCollectionName a name of the feature collection for which we perform the lookup
         * @param {string} featureName a name of the feature we need from the collection
         */
        function getFeature(elt, featureCollectionName, featureName) {
            console.log(featureCollectionName, featureName)
            // if desired feature is part of the core, we don't need the extensions
            const coreFeature = get(coreFeatureSet.features[featureCollectionName], featureName);
            if (coreFeature) {
                return coreFeature;
            };

            /**
             * @returns {import("./htmx").Feature<any>[]}
             * @param {HTMLElement} elt
             * @param {htmx.Feature<any>[]} featuresToReturn
             * @param {string[]} featuresToIgnore
             */
            function getFeaturesRecursively(elt, featuresToReturn, featuresToIgnore) {
                if (elt == undefined) {
                    return featuresToReturn;
                }
                var extensionsForElement = getAttributeValue(elt, "hx-ext");
                if (extensionsForElement) {
                    forEach(extensionsForElement.split(","), function (extensionName) {
                        extensionName = extensionName.replace(/ /g, '');
                        if (extensionName.slice(0, 7) == "ignore:") {
                            featuresToIgnore.push(extensionName.slice(7));
                            return;
                        }
                        if (featuresToIgnore.indexOf(extensionName) < 0) {
                            var feature = extensionFeatures[extensionName];
                            if (feature && featuresToReturn.indexOf(feature.features[featureCollectionName]) < 0 && feature.features[featureCollectionName]) {
                                featuresToReturn.push(feature.features[featureCollectionName]);
                            }
                        }
                    });
                }
                return getFeaturesRecursively(parentElt(elt), featuresToReturn, featuresToIgnore);
            }

            var features = getFeaturesRecursively(elt, [{}], []);
            var finalFeatures = Object.assign.apply(null, features);

            /**
             * @param {import("./htmx").Feature<any>} feature
             * @param {string} name
             * @returns {any}
             */
            function get(feature, name) {
                var featureImpl = feature[name]
                if (typeof featureImpl === 'string') {
                    return get(feature, featureImpl);
                } else {
                    return featureImpl;
                }
            }

            return get(finalFeatures, featureName);
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
        var currentPathForHistory = location.pathname+location.search;

        function getHistoryElement() {
            var historyElt = getDocument().querySelector('[hx-history-elt],[data-hx-history-elt]');
            return historyElt || getDocument().body;
        }

        function saveToHistoryCache(url, content, title, scroll) {
            if (!canAccessLocalStorage()) {
                return;
            }

            url = normalizePath(url);

            var historyCache = parseJSON(localStorage.getItem("htmx-history-cache")) || [];
            for (var i = 0; i < historyCache.length; i++) {
                if (historyCache[i].url === url) {
                    historyCache.splice(i, 1);
                    break;
                }
            }
            var newHistoryItem = {url:url, content: content, title:title, scroll:scroll};
            triggerEvent(getDocument().body, "htmx:historyItemCreated", {item:newHistoryItem, cache: historyCache})
            historyCache.push(newHistoryItem)
            while (historyCache.length > htmx.config.historyCacheSize) {
                historyCache.shift();
            }
            while(historyCache.length > 0){
                try {
                    localStorage.setItem("htmx-history-cache", JSON.stringify(historyCache));
                    break;
                } catch (e) {
                    triggerErrorEvent(getDocument().body, "htmx:historyCacheError", {cause:e, cache: historyCache})
                    historyCache.shift(); // shrink the cache and retry
                }
            }
        }

        function getCachedHistory(url) {
            if (!canAccessLocalStorage()) {
                return null;
            }

            url = normalizePath(url);

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

        function saveCurrentPageToHistory() {
            var elt = getHistoryElement();
            var path = currentPathForHistory || location.pathname+location.search;

            // Allow history snapshot feature to be disabled where hx-history="false"
            // is present *anywhere* in the current document we're about to save,
            // so we can prevent privileged data entering the cache.
            // The page will still be reachable as a history entry, but htmx will fetch it
            // live from the server onpopstate rather than look in the localStorage cache
            var disableHistoryCache = getDocument().querySelector('[hx-history="false" i],[data-hx-history="false" i]');
            if (!disableHistoryCache) {
                triggerEvent(getDocument().body, "htmx:beforeHistorySave", {path: path, historyElt: elt});
                saveToHistoryCache(path, cleanInnerHtmlForHistory(elt), getDocument().title, window.scrollY);
            }

            if (htmx.config.historyEnabled) history.replaceState({htmx: true}, getDocument().title, window.location.href);
        }

        function pushUrlIntoHistory(path) {
            // remove the cache buster parameter, if any
            if (htmx.config.getCacheBusterParam) {
                path = path.replace(/org\.htmx\.cache-buster=[^&]*&?/, '')
                if (path.endsWith('&') || path.endsWith("?")) {
                    path = path.slice(0, -1);
                }
            }
            if(htmx.config.historyEnabled) {
                history.pushState({htmx:true}, "", path);
            }
            currentPathForHistory = path;
        }

        function replaceUrlInHistory(path) {
            if(htmx.config.historyEnabled)  history.replaceState({htmx:true}, "", path);
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
            request.setRequestHeader("HX-History-Restore-Request", "true");
            request.onload = function () {
                if (this.status >= 200 && this.status < 400) {
                    triggerEvent(getDocument().body, "htmx:historyCacheMissLoad", details);
                    var fragment = makeFragment(this.response);
                    // @ts-ignore
                    fragment = fragment.querySelector('[hx-history-elt],[data-hx-history-elt]') || fragment;
                    var historyElement = getHistoryElement();
                    var settleInfo = makeSettleInfo(historyElement);
                    var title = findTitle(this.response);
                    if (title) {
                        var titleElt = find("title");
                        if (titleElt) {
                            titleElt.innerHTML = title;
                        } else {
                            window.document.title = title;
                        }
                    }
                    // @ts-ignore
                    swapInnerHTML(historyElement, fragment, settleInfo)
                    settleImmediately(settleInfo.tasks);
                    currentPathForHistory = path;
                    triggerEvent(getDocument().body, "htmx:historyRestore", {path: path, cacheMiss:true, serverResponse:this.response});
                } else {
                    triggerErrorEvent(getDocument().body, "htmx:historyCacheMissLoadError", details);
                }
            };
            request.send();
        }

        function restoreHistory(path) {
            saveCurrentPageToHistory();
            path = path || location.pathname+location.search;
            var cached = getCachedHistory(path);
            if (cached) {
                var fragment = makeFragment(cached.content);
                var historyElement = getHistoryElement();
                var settleInfo = makeSettleInfo(historyElement);
                swapInnerHTML(historyElement, fragment, settleInfo)
                settleImmediately(settleInfo.tasks);
                document.title = cached.title;
                setTimeout(function () {
                    window.scrollTo(0, cached.scroll);
                }, 0); // next 'tick', so browser has time to render layout
                currentPathForHistory = path;
                triggerEvent(getDocument().body, "htmx:historyRestore", {path:path, item:cached});
            } else {
                if (htmx.config.refreshOnHistoryMiss) {

                    // @ts-ignore: optional parameter in reload() function throws error
                    window.location.reload(true);
                } else {
                    loadHistoryFromServer(path);
                }
            }
        }

        function addRequestIndicatorClasses(elt) {
            var indicators = findAttributeTargets(elt, 'hx-indicator');
            if (indicators == null) {
                indicators = [elt];
            }
            forEach(indicators, function (ic) {
                var internalData = getInternalData(ic);
                internalData.requestCount = (internalData.requestCount || 0) + 1;
                ic.classList["add"].call(ic.classList, htmx.config.requestClass);
            });
            return indicators;
        }

        function removeRequestIndicatorClasses(indicators) {
            forEach(indicators, function (ic) {
                var internalData = getInternalData(ic);
                internalData.requestCount = (internalData.requestCount || 0) - 1;
                if (internalData.requestCount === 0) {
                    ic.classList["remove"].call(ic.classList, htmx.config.requestClass);
                }
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

        function processInputValue(processed, values, errors, elt, validate) {
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
                    if (current !== undefined) {
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
                if (validate) {
                    validateElement(elt, errors);
                }
            }
            if (matches(elt, 'form')) {
                var inputs = elt.elements;
                forEach(inputs, function(input) {
                    processInputValue(processed, values, errors, input, validate);
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

        /**
         * @param {HTMLElement} elt
         * @param {string} verb
         */
        function getInputValues(elt, verb) {
            var processed = [];
            var values = {};
            var formValues = {};
            var errors = [];
            var internalData = getInternalData(elt);

            // only validate when form is directly submitted and novalidate or formnovalidate are not set
            // or if the element has an explicit hx-validate="true" on it
            var validate = (matches(elt, 'form') && elt.noValidate !== true) || getAttributeValue(elt, "hx-validate") === "true";
            if (internalData.lastButtonClicked) {
                validate = validate && internalData.lastButtonClicked.formNoValidate !== true;
            }

            // for a non-GET include the closest form
            if (verb !== 'get') {
                processInputValue(processed, formValues, errors, closest(elt, 'form'), validate);
            }

            // include the element itself
            processInputValue(processed, values, errors, elt, validate);

            // if a button or submit was clicked last, include its value
            if (internalData.lastButtonClicked) {
                var name = getRawAttribute(internalData.lastButtonClicked,"name");
                if (name) {
                    values[name] = internalData.lastButtonClicked.value;
                }
            }

            // include any explicit includes
            var includes = findAttributeTargets(elt, "hx-include");
            forEach(includes, function(node) {
                processInputValue(processed, values, errors, node, validate);
                // if a non-form is included, include any input values within it
                if (!matches(node, 'form')) {
                    forEach(node.querySelectorAll(INPUT_SELECTOR), function (descendant) {
                        processInputValue(processed, values, errors, descendant, validate);
                    })
                }
            });

            // form values take precedence, overriding the regular values
            values = mergeObjects(values, formValues);

            return {errors:errors, values:values};
        }

        function appendParam(returnStr, name, realValue) {
            if (returnStr !== "") {
                returnStr += "&";
            }
            if (String(realValue) === "[object Object]") {
                realValue = JSON.stringify(realValue);
            }
            var s = encodeURIComponent(realValue);
            returnStr += encodeURIComponent(name) + "=" + s;
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

        /**
         * @param {HTMLElement} elt
         * @param {HTMLElement} target
         * @param {string} prompt
         * @returns {Object} // TODO: Define/Improve HtmxHeaderSpecification
         */
        function getHeaders(elt, target, prompt) {
            var headers = {
                "HX-Request" : "true",
                "HX-Trigger" : getRawAttribute(elt, "id"),
                "HX-Trigger-Name" : getRawAttribute(elt, "name"),
                "HX-Target" : getAttributeValue(target, "id"),
                "HX-Current-URL" : getDocument().location.href,
            }
            getValuesForElement(elt, "hx-headers", false, headers)
            if (prompt !== undefined) {
                headers["HX-Prompt"] = prompt;
            }
            if (getInternalData(elt).boosted) {
                headers["HX-Boosted"] = "true";
            }
            return headers;
        }

        /**
         * filterValues takes an object containing form input values
         * and returns a new object that only contains keys that are
         * specified by the closest "hx-params" attribute
         * @param {Object} inputValues
         * @param {HTMLElement} elt
         * @returns {Object}
         */
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

        function isAnchorLink(elt) {
          return getRawAttribute(elt, 'href') && getRawAttribute(elt, 'href').indexOf("#") >=0
        }

        /**
         *
         * @param {HTMLElement} elt
         * @param {string} swapInfoOverride
         */
        function getSwapSpecification(elt, swapInfoOverride) {
            var swapInfo = swapInfoOverride ? swapInfoOverride : getClosestAttributeValue(elt, "hx-swap");
            var swapSpec = {
                "swapStyle" : getInternalData(elt).boosted ? 'innerHTML' : htmx.config.defaultSwapStyle,
                "swapDelay" : htmx.config.defaultSwapDelay,
                "settleDelay" : htmx.config.defaultSettleDelay
            }
            if (getInternalData(elt).boosted && !isAnchorLink(elt)) {
              swapSpec["show"] = "top"
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
                        if (modifier.indexOf("transition:") === 0) {
                            swapSpec["transition"] = modifier.substr(11) === "true";
                        }
                        if (modifier.indexOf("scroll:") === 0) {
                            var scrollSpec = modifier.substr(7);
                            var splitSpec = scrollSpec.split(":");
                            var scrollVal = splitSpec.pop();
                            var selectorVal = splitSpec.length > 0 ? splitSpec.join(":") : null;
                            swapSpec["scroll"] = scrollVal;
                            swapSpec["scrollTarget"] = selectorVal;
                        }
                        if (modifier.indexOf("show:") === 0) {
                            var showSpec = modifier.substr(5);
                            var splitSpec = showSpec.split(":");
                            var showVal = splitSpec.pop();
                            var selectorVal = splitSpec.length > 0 ? splitSpec.join(":") : null;
                            swapSpec["show"] = showVal;
                            swapSpec["showTarget"] = selectorVal;
                        }
                        if (modifier.indexOf("focus-scroll:") === 0) {
                            var focusScrollVal = modifier.substr("focus-scroll:".length);
                            swapSpec["focusScroll"] = focusScrollVal == "true";
                        }
                    }
                }
            }
            return swapSpec;
        }

        function getEncoding(elt) {
            return getClosestAttributeValue(elt, "hx-encoding") || (matches(elt, "form") && getRawAttribute(elt, 'enctype')) || htmx.config.defaultEncoding;
        }

        /** @returns {import("./htmx").EncodingResult | XMLHttpRequestBodyInit} */
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
                var encoding = getEncoding(elt);
                /** @type {import("./htmx").BodyEncoding} */
                var encodingFeature = getFeature(elt, "encodings", encoding);
                return encodingFeature(filteredParameters)
            }
        }

        /**
         *
         * @param {Element} target
         */
        function makeSettleInfo(target) {
            return {tasks: [], elts: [target]};
        }

        function updateScrollState(content, swapSpec) {
            var first = content[0];
            var last = content[content.length - 1];
            if (swapSpec.scroll) {
                var target = null;
                if (swapSpec.scrollTarget) {
                    target = querySelectorExt(first, swapSpec.scrollTarget);
                }
                if (swapSpec.scroll === "top" && (first || target)) {
                    target = target || first;
                    target.scrollTop = 0;
                }
                if (swapSpec.scroll === "bottom" && (last || target)) {
                    target = target || last;
                    target.scrollTop = target.scrollHeight;
                }
            }
            if (swapSpec.show) {
                var target = null;
                if (swapSpec.showTarget) {
                    var targetStr = swapSpec.showTarget;
                    if (swapSpec.showTarget === "window") {
                        targetStr = "body";
                    }
                    target = querySelectorExt(first, targetStr);
                }
                if (swapSpec.show === "top" && (first || target)) {
                    target = target || first;
                    target.scrollIntoView({block:'start', behavior: htmx.config.scrollBehavior});
                }
                if (swapSpec.show === "bottom" && (last || target)) {
                    target = target || last;
                    target.scrollIntoView({block:'end', behavior: htmx.config.scrollBehavior});
                }
            }
        }

        /**
         * @param {HTMLElement} elt
         * @param {string} attr
         * @param {boolean=} evalAsDefault
         * @param {Object=} values
         * @returns {Object}
         */
        function getValuesForElement(elt, attr, evalAsDefault, values) {
            if (values == null) {
                values = {};
            }
            if (elt == null) {
                return values;
            }
            var attributeValue = getAttributeValue(elt, attr);
            if (attributeValue) {
                var str = attributeValue.trim();
                var evaluateValue = evalAsDefault;
                if (str === "unset") {
                    return null;
                }
                if (str.indexOf("javascript:") === 0) {
                    str = str.substr(11);
                    evaluateValue = true;
                } else if (str.indexOf("js:") === 0) {
                    str = str.substr(3);
                    evaluateValue = true;
                }
                if (str.indexOf('{') !== 0) {
                    str = "{" + str + "}";
                }
                var varsValues;
                if (evaluateValue) {
                    varsValues = maybeEval(elt,function () {return Function("return (" + str + ")")();}, {});
                } else {
                    varsValues = parseJSON(str);
                }
                for (var key in varsValues) {
                    if (varsValues.hasOwnProperty(key)) {
                        if (values[key] == null) {
                            values[key] = varsValues[key];
                        }
                    }
                }
            }
            return getValuesForElement(parentElt(elt), attr, evalAsDefault, values);
        }

        function maybeEval(elt, toEval, defaultVal) {
            if (htmx.config.allowEval) {
                return toEval();
            } else {
                triggerErrorEvent(elt, 'htmx:evalDisallowedError');
                return defaultVal;
            }
        }

        /**
         * @param {HTMLElement} elt
         * @param {*} expressionVars
         * @returns
         */
        function getHXVarsForElement(elt, expressionVars) {
            return getValuesForElement(elt, "hx-vars", true, expressionVars);
        }

        /**
         * @param {HTMLElement} elt
         * @param {*} expressionVars
         * @returns
         */
        function getHXValsForElement(elt, expressionVars) {
            return getValuesForElement(elt, "hx-vals", false, expressionVars);
        }

        /**
         * @param {HTMLElement} elt
         * @returns {Object}
         */
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

        function getPathFromResponse(xhr) {
            if (xhr.responseURL) {
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

        function ajaxHelper(verb, path, context) {
            verb = verb.toLowerCase();
            if (context) {
                if (context instanceof Element || isType(context, 'String')) {
                    return issueAjaxRequest(verb, path, null, null, {
                        targetOverride: resolveTarget(context),
                        returnPromise: true
                    });
                } else {
                    return issueAjaxRequest(verb, path, resolveTarget(context.source), context.event,
                        {
                            handler : context.handler,
                            headers : context.headers,
                            values : context.values,
                            targetOverride: resolveTarget(context.target),
                            swapOverride: context.swap,
                            returnPromise: true
                        });
                }
            } else {
                return issueAjaxRequest(verb, path, null, null, {
                        returnPromise: true
                });
            }
        }

        function hierarchyForElt(elt) {
            var arr = [];
            while (elt) {
                arr.push(elt);
                elt = elt.parentElement;
            }
            return arr;
        }

        function issueAjaxRequest(verb, path, elt, event, etc, confirmed) {
            var resolve = null;
            var reject = null;
            etc = etc != null ? etc : {};
            if(etc.returnPromise && typeof Promise !== "undefined"){
                var promise = new Promise(function (_resolve, _reject) {
                    resolve = _resolve;
                    reject = _reject;
                });
            }
            if(elt == null) {
                elt = getDocument().body;
            }
            var responseHandler = etc.handler || handleAjaxResponse;

            if (!bodyContains(elt)) {
                return; // do not issue requests for elements removed from the DOM
            }
            var target = etc.targetOverride || getTarget(elt);
            if (target == null || target == DUMMY_ELT) {
                triggerErrorEvent(elt, 'htmx:targetError', {target: getAttributeValue(elt, "hx-target")});
                return;
            }

            // allow event-based confirmation w/ a callback
            if (!confirmed) {
                var issueRequest = function() {
                    return issueAjaxRequest(verb, path, elt, event, etc, true);
                }
                var confirmDetails = {target: target, elt: elt, path: path, verb: verb, triggeringEvent: event, etc: etc, issueRequest: issueRequest};
                if (triggerEvent(elt, 'htmx:confirm', confirmDetails) === false) {
                    return;
                }
            }

            var syncElt = elt;
            var eltData = getInternalData(elt);
            var syncStrategy = getClosestAttributeValue(elt, "hx-sync");
            var queueStrategy = null;
            var abortable = false;
            if (syncStrategy) {
                var syncStrings = syncStrategy.split(":");
                var selector = syncStrings[0].trim();
                if (selector === "this") {
                    syncElt = findThisElement(elt, 'hx-sync');
                } else {
                    syncElt = querySelectorExt(elt, selector);
                }
                // default to the drop strategy
                syncStrategy = (syncStrings[1] || 'drop').trim();
                eltData = getInternalData(syncElt);
                if (syncStrategy === "drop" && eltData.xhr && eltData.abortable !== true) {
                    return;
                } else if (syncStrategy === "abort") {
                    if (eltData.xhr) {
                        return;
                    } else {
                        abortable = true;
                    }
                } else if (syncStrategy === "replace") {
                    triggerEvent(syncElt, 'htmx:abort'); // abort the current request and continue
                } else if (syncStrategy.indexOf("queue") === 0) {
                    var queueStrArray = syncStrategy.split(" ");
                    queueStrategy = (queueStrArray[1] || "last").trim();
                }
            }

            if (eltData.xhr) {
                if (eltData.abortable) {
                    triggerEvent(syncElt, 'htmx:abort'); // abort the current request and continue
                } else {
                    if(queueStrategy == null){
                        if (event) {
                            var eventData = getInternalData(event);
                            if (eventData && eventData.triggerSpec && eventData.triggerSpec.queue) {
                                queueStrategy = eventData.triggerSpec.queue;
                            }
                        }
                        if (queueStrategy == null) {
                            queueStrategy = "last";
                        }
                    }
                    if (eltData.queuedRequests == null) {
                        eltData.queuedRequests = [];
                    }
                    if (queueStrategy === "first" && eltData.queuedRequests.length === 0) {
                        eltData.queuedRequests.push(function () {
                            issueAjaxRequest(verb, path, elt, event, etc)
                        });
                    } else if (queueStrategy === "all") {
                        eltData.queuedRequests.push(function () {
                            issueAjaxRequest(verb, path, elt, event, etc)
                        });
                    } else if (queueStrategy === "last") {
                        eltData.queuedRequests = []; // dump existing queue
                        eltData.queuedRequests.push(function () {
                            issueAjaxRequest(verb, path, elt, event, etc)
                        });
                    }
                    return;
                }
            }

            var xhr = new XMLHttpRequest();
            eltData.xhr = xhr;
            eltData.abortable = abortable;
            var endRequestLock = function(){
                eltData.xhr = null;
                eltData.abortable = false;
                if (eltData.queuedRequests != null &&
                    eltData.queuedRequests.length > 0) {
                    var queuedRequest = eltData.queuedRequests.shift();
                    queuedRequest();
                }
            }
            var promptQuestion = getClosestAttributeValue(elt, "hx-prompt");
            if (promptQuestion) {
                var promptResponse = prompt(promptQuestion);
                // prompt returns null if cancelled and empty string if accepted with no entry
                if (promptResponse === null ||
                    !triggerEvent(elt, 'htmx:prompt', {prompt: promptResponse, target:target})) {
                    maybeCall(resolve);
                    endRequestLock();
                    return promise;
                }
            }

            var confirmQuestion = getClosestAttributeValue(elt, "hx-confirm");
            if (confirmQuestion) {
                if(!confirm(confirmQuestion)) {
                    maybeCall(resolve);
                    endRequestLock()
                    return promise;
                }
            }


            var headers = getHeaders(elt, target, promptResponse);
            if (etc.headers) {
                headers = mergeObjects(headers, etc.headers);
            }
            var results = getInputValues(elt, verb);
            var errors = results.errors;
            var rawParameters = results.values;
            if (etc.values) {
                rawParameters = mergeObjects(rawParameters, etc.values);
            }
            var expressionVars = getExpressionVars(elt);
            var allParameters = mergeObjects(rawParameters, expressionVars);
            var filteredParameters = filterValues(allParameters, elt);

            if (htmx.config.getCacheBusterParam && verb === 'get') {
                filteredParameters['org.htmx.cache-buster'] = getRawAttribute(target, "id") || "true";
            }

            // behavior of anchors w/ empty href is to use the current URL
            if (path == null || path === "") {
                path = getDocument().location.href;
            }


            var requestAttrValues = getValuesForElement(elt, 'hx-request');

            var eltIsBoosted = getInternalData(elt).boosted;
            var requestConfig = {
                boosted: eltIsBoosted,
                parameters: filteredParameters,
                unfilteredParameters: allParameters,
                headers:headers,
                target:target,
                verb:verb,
                errors:errors,
                withCredentials: etc.credentials || requestAttrValues.credentials || htmx.config.withCredentials,
                timeout:  etc.timeout || requestAttrValues.timeout || htmx.config.timeout,
                path:path,
                triggeringEvent:event
            };

            if(!triggerEvent(elt, 'htmx:configRequest', requestConfig)){
                maybeCall(resolve);
                endRequestLock();
                return promise;
            }

            // copy out in case the object was overwritten
            path = requestConfig.path;
            verb = requestConfig.verb;
            headers = requestConfig.headers;
            filteredParameters = requestConfig.parameters;
            errors = requestConfig.errors;

            if(errors && errors.length > 0){
                triggerEvent(elt, 'htmx:validation:halted', requestConfig)
                maybeCall(resolve);
                endRequestLock();
                return promise;
            }

            var splitPath = path.split("#");
            var pathNoAnchor = splitPath[0];
            var anchor = splitPath[1];
            var finalPathForGet = null;
            if (verb === 'get' || verb === 'delete') {
                finalPathForGet = pathNoAnchor;
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
                xhr.open(verb.toUpperCase(), finalPathForGet, true);
            } else {
                xhr.open(verb.toUpperCase(), path, true);
            }

            xhr.overrideMimeType("text/html");
            xhr.withCredentials = requestConfig.withCredentials;
            xhr.timeout = requestConfig.timeout;

            // request headers
            if (requestAttrValues.noHeaders) {
                // ignore all headers
            } else {
                for (var header in headers) {
                    if (headers.hasOwnProperty(header)) {
                        var headerValue = headers[header];
                        safelySetHeaderValue(xhr, header, headerValue);
                    }
                }
            }

            var responseInfo = {
                xhr: xhr, target: target, requestConfig: requestConfig, etc: etc, boosted: eltIsBoosted,
                pathInfo: {
                    requestPath: path,
                    finalRequestPath: finalPathForGet || path,
                    anchor: anchor
                }
            };

            xhr.onload = function () {
                try {
                    var hierarchy = hierarchyForElt(elt);
                    responseInfo.pathInfo.responsePath = getPathFromResponse(xhr);
                    responseHandler(elt, responseInfo);
                    removeRequestIndicatorClasses(indicators);
                    triggerEvent(elt, 'htmx:afterRequest', responseInfo);
                    triggerEvent(elt, 'htmx:afterOnLoad', responseInfo);
                    // if the body no longer contains the element, trigger the event on the closest parent
                    // remaining in the DOM
                    if (!bodyContains(elt)) {
                        var secondaryTriggerElt = null;
                        while (hierarchy.length > 0 && secondaryTriggerElt == null) {
                            var parentEltInHierarchy = hierarchy.shift();
                            if (bodyContains(parentEltInHierarchy)) {
                                secondaryTriggerElt = parentEltInHierarchy;
                            }
                        }
                        if (secondaryTriggerElt) {
                            triggerEvent(secondaryTriggerElt, 'htmx:afterRequest', responseInfo);
                            triggerEvent(secondaryTriggerElt, 'htmx:afterOnLoad', responseInfo);
                        }
                    }
                    maybeCall(resolve);
                    endRequestLock();
                } catch (e) {
                    triggerErrorEvent(elt, 'htmx:onLoadError', mergeObjects({error:e}, responseInfo));
                    throw e;
                }
            }
            xhr.onerror = function () {
                removeRequestIndicatorClasses(indicators);
                triggerErrorEvent(elt, 'htmx:afterRequest', responseInfo);
                triggerErrorEvent(elt, 'htmx:sendError', responseInfo);
                maybeCall(reject);
                endRequestLock();
            }
            xhr.onabort = function() {
                removeRequestIndicatorClasses(indicators);
                triggerErrorEvent(elt, 'htmx:afterRequest', responseInfo);
                triggerErrorEvent(elt, 'htmx:sendAbort', responseInfo);
                maybeCall(reject);
                endRequestLock();
            }
            xhr.ontimeout = function() {
                removeRequestIndicatorClasses(indicators);
                triggerErrorEvent(elt, 'htmx:afterRequest', responseInfo);
                triggerErrorEvent(elt, 'htmx:timeout', responseInfo);
                maybeCall(reject);
                endRequestLock();
            }
            if(!triggerEvent(elt, 'htmx:beforeRequest', responseInfo)){
                maybeCall(resolve);
                endRequestLock()
                return promise
            }
            var indicators = addRequestIndicatorClasses(elt);

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
            triggerEvent(elt, 'htmx:beforeSend', responseInfo);
            var encoded = encodeParamsForBody(xhr, elt, filteredParameters);

            if (encoded.hasOwnProperty("body")) {
                if (encoded.contentType != null) {
                    xhr.setRequestHeader("Content-Type", encoded.contentType)
                }
                xhr.send(verb === 'get' ? null : encoded.body);
            } else {
                xhr.send(verb === 'get' ? null : encoded);
            }
            return promise;
        }

        function determineHistoryUpdates(elt, responseInfo) {

            var xhr = responseInfo.xhr;

            //===========================================
            // First consult response headers
            //===========================================
            var pathFromHeaders = null;
            var typeFromHeaders = null;
            if (hasHeader(xhr,/HX-Push:/i)) {
                pathFromHeaders = xhr.getResponseHeader("HX-Push");
                typeFromHeaders = "push";
            } else if (hasHeader(xhr,/HX-Push-Url:/i)) {
                pathFromHeaders = xhr.getResponseHeader("HX-Push-Url");
                typeFromHeaders = "push";
            } else if (hasHeader(xhr,/HX-Replace-Url:/i)) {
                pathFromHeaders = xhr.getResponseHeader("HX-Replace-Url");
                typeFromHeaders = "replace";
            }

            // if there was a response header, that has priority
            if (pathFromHeaders) {
                if (pathFromHeaders === "false") {
                    return {}
                } else {
                    return {
                        type: typeFromHeaders,
                        path : pathFromHeaders
                    }
                }
            }

            //===========================================
            // Next resolve via DOM values
            //===========================================
            var requestPath =  responseInfo.pathInfo.finalRequestPath;
            var responsePath =  responseInfo.pathInfo.responsePath;

            var pushUrl = getClosestAttributeValue(elt, "hx-push-url");
            var replaceUrl = getClosestAttributeValue(elt, "hx-replace-url");
            var elementIsBoosted = getInternalData(elt).boosted;

            var saveType = null;
            var path = null;

            if (pushUrl) {
                saveType = "push";
                path = pushUrl;
            } else if (replaceUrl) {
                saveType = "replace";
                path = replaceUrl;
            } else if (elementIsBoosted) {
                saveType = "push";
                path = responsePath || requestPath; // if there is no response path, go with the original request path
            }

            if (path) {
                // false indicates no push, return empty object
                if (path === "false") {
                    return {};
                }

                // true indicates we want to follow wherever the server ended up sending us
                if (path === "true") {
                    path = responsePath || requestPath; // if there is no response path, go with the original request path
                }

                // restore any anchor associated with the request
                if (responseInfo.pathInfo.anchor &&
                    path.indexOf("#") === -1) {
                    path = path + "#" + responseInfo.pathInfo.anchor;
                }

                return {
                    type:saveType,
                    path: path
                }
            } else {
                return {};
            }
        }

        function handleAjaxResponse(elt, responseInfo) {
            var xhr = responseInfo.xhr;
            var target = responseInfo.target;
            var etc = responseInfo.etc;

            if (!triggerEvent(elt, 'htmx:beforeOnLoad', responseInfo)) return;

            if (hasHeader(xhr, /HX-Trigger:/i)) {
                handleTrigger(xhr, "HX-Trigger", elt);
            }

            if (hasHeader(xhr, /HX-Location:/i)) {
                saveCurrentPageToHistory();
                var redirectPath = xhr.getResponseHeader("HX-Location");
                var swapSpec;
                if (redirectPath.indexOf("{") === 0) {
                    swapSpec = parseJSON(redirectPath);
                    // what's the best way to throw an error if the user didn't include this
                    redirectPath = swapSpec['path'];
                    delete swapSpec['path'];
                }
                ajaxHelper('GET', redirectPath, swapSpec).then(function(){
                    pushUrlIntoHistory(redirectPath);
                });
                return;
            }

            if (hasHeader(xhr, /HX-Redirect:/i)) {
                location.href = xhr.getResponseHeader("HX-Redirect");
                return;
            }

            if (hasHeader(xhr,/HX-Refresh:/i)) {
                if ("true" === xhr.getResponseHeader("HX-Refresh")) {
                    location.reload();
                    return;
                }
            }

            if (hasHeader(xhr,/HX-Retarget:/i)) {
                responseInfo.target = getDocument().querySelector(xhr.getResponseHeader("HX-Retarget"));
            }

            var historyUpdate = determineHistoryUpdates(elt, responseInfo);

            // by default htmx only swaps on 200 return codes and does not swap
            // on 204 'No Content'
            // this can be ovverriden by responding to the htmx:beforeSwap event and
            // overriding the detail.shouldSwap property
            var shouldSwap = xhr.status >= 200 && xhr.status < 400 && xhr.status !== 204;
            var serverResponse = xhr.response;
            var isError = xhr.status >= 400;
            var beforeSwapDetails = mergeObjects({shouldSwap: shouldSwap, serverResponse:serverResponse, isError:isError}, responseInfo);
            if (!triggerEvent(target, 'htmx:beforeSwap', beforeSwapDetails)) return;

            target = beforeSwapDetails.target; // allow re-targeting
            serverResponse = beforeSwapDetails.serverResponse; // allow updating content
            isError = beforeSwapDetails.isError; // allow updating error

            responseInfo.target = target; // Make updated target available to response events
            responseInfo.failed = isError; // Make failed property available to response events
            responseInfo.successful = !isError; // Make successful property available to response events

            if (beforeSwapDetails.shouldSwap) {
                if (xhr.status === 286) {
                    cancelPolling(elt);
                }

                withExtensions(elt, function (extension) {
                    serverResponse = extension.transformResponse(serverResponse, xhr, elt);
                });

                // Save current page if there will be a history update
                if (historyUpdate.type) {
                    saveCurrentPageToHistory();
                }

                var swapOverride = etc.swapOverride;
                if (hasHeader(xhr,/HX-Reswap:/i)) {
                    swapOverride = xhr.getResponseHeader("HX-Reswap");
                }
                var swapSpec = getSwapSpecification(elt, swapOverride);

                target.classList.add(htmx.config.swappingClass);

                // optional transition API promise callbacks
                var settleResolve = null;
                var settleReject = null;

                var doSwap = function () {
                    try {
                        var activeElt = document.activeElement;
                        var selectionInfo = {};
                        try {
                            selectionInfo = {
                                elt: activeElt,
                                // @ts-ignore
                                start: activeElt ? activeElt.selectionStart : null,
                                // @ts-ignore
                                end: activeElt ? activeElt.selectionEnd : null
                            };
                        } catch (e) {
                            // safari issue - see https://github.com/microsoft/playwright/issues/5894
                        }

                        var settleInfo = makeSettleInfo(target);
                        selectAndSwap(swapSpec.swapStyle, target, elt, serverResponse, settleInfo);

                        if (selectionInfo.elt &&
                            !bodyContains(selectionInfo.elt) &&
                            selectionInfo.elt.id) {
                            var newActiveElt = document.getElementById(selectionInfo.elt.id);
                            var focusOptions = { preventScroll: swapSpec.focusScroll !== undefined ? !swapSpec.focusScroll : !htmx.config.defaultFocusScroll };
                            if (newActiveElt) {
                                // @ts-ignore
                                if (selectionInfo.start && newActiveElt.setSelectionRange) {
                                    // @ts-ignore
                                    try {
                                        newActiveElt.setSelectionRange(selectionInfo.start, selectionInfo.end);
                                    } catch (e) {
                                        // the setSelectionRange method is present on fields that don't support it, so just let this fail
                                    }
                                }
                                newActiveElt.focus(focusOptions);
                            }
                        }

                        target.classList.remove(htmx.config.swappingClass);
                        forEach(settleInfo.elts, function (elt) {
                            if (elt.classList) {
                                elt.classList.add(htmx.config.settlingClass);
                            }
                            triggerEvent(elt, 'htmx:afterSwap', responseInfo);
                        });

                        if (hasHeader(xhr, /HX-Trigger-After-Swap:/i)) {
                            var finalElt = elt;
                            if (!bodyContains(elt)) {
                                finalElt = getDocument().body;
                            }
                            handleTrigger(xhr, "HX-Trigger-After-Swap", finalElt);
                        }

                        var doSettle = function () {
                            forEach(settleInfo.tasks, function (task) {
                                task.call();
                            });
                            forEach(settleInfo.elts, function (elt) {
                                if (elt.classList) {
                                    elt.classList.remove(htmx.config.settlingClass);
                                }
                                triggerEvent(elt, 'htmx:afterSettle', responseInfo);
                            });

                            // if we need to save history, do so
                            if (historyUpdate.type) {
                                if (historyUpdate.type === "push") {
                                    pushUrlIntoHistory(historyUpdate.path);
                                    triggerEvent(getDocument().body, 'htmx:pushedIntoHistory', {path: historyUpdate.path});
                                } else {
                                    replaceUrlInHistory(historyUpdate.path);
                                    triggerEvent(getDocument().body, 'htmx:replacedInHistory', {path: historyUpdate.path});
                                }
                            }
                            if (responseInfo.pathInfo.anchor) {
                                var anchorTarget = find("#" + responseInfo.pathInfo.anchor);
                                if(anchorTarget) {
                                    anchorTarget.scrollIntoView({block:'start', behavior: "auto"});
                                }
                            }

                            if(settleInfo.title) {
                                var titleElt = find("title");
                                if(titleElt) {
                                    titleElt.innerHTML = settleInfo.title;
                                } else {
                                    window.document.title = settleInfo.title;
                                }
                            }

                            updateScrollState(settleInfo.elts, swapSpec);

                            if (hasHeader(xhr, /HX-Trigger-After-Settle:/i)) {
                                var finalElt = elt;
                                if (!bodyContains(elt)) {
                                    finalElt = getDocument().body;
                                }
                                handleTrigger(xhr, "HX-Trigger-After-Settle", finalElt);
                            }
                            maybeCall(settleResolve);
                        }

                        if (swapSpec.settleDelay > 0) {
                            setTimeout(doSettle, swapSpec.settleDelay)
                        } else {
                            doSettle();
                        }
                    } catch (e) {
                        triggerErrorEvent(elt, 'htmx:swapError', responseInfo);
                        maybeCall(settleReject);
                        throw e;
                    }
                };

                var shouldTransition = htmx.config.globalViewTransitions
                if(swapSpec.hasOwnProperty('transition')){
                    shouldTransition = swapSpec.transition;
                }

                if(shouldTransition &&
                    triggerEvent(elt, 'htmx:beforeTransition', responseInfo) &&
                    typeof Promise !== "undefined" && document.startViewTransition){
                    var settlePromise = new Promise(function (_resolve, _reject) {
                        settleResolve = _resolve;
                        settleReject = _reject;
                    });
                    // wrap the original doSwap() in a call to startViewTransition()
                    var innerDoSwap = doSwap;
                    doSwap = function() {
                        document.startViewTransition(function () {
                            innerDoSwap();
                            return settlePromise;
                        });
                    }
                }


                if (swapSpec.swapDelay > 0) {
                    setTimeout(doSwap, swapSpec.swapDelay)
                } else {
                    doSwap();
                }
            }
            if (isError) {
                triggerErrorEvent(elt, 'htmx:responseError', mergeObjects({error: "Response Status Error Code " + xhr.status + " from " + responseInfo.pathInfo.requestPath}, responseInfo));
            }
        }

        //====================================================================
        // Extensions API
        //====================================================================

        /** @type {Object<string, htmx.HtmxExtension>} */
        var extensions = {};

        /**
         * extensionBase defines the default functions for all extensions.
         * @returns {htmx.HtmxExtension}
         */
        function extensionBase() {
            return {
                init: function(api) {return null;},
                onEvent : function(name, evt) {return true;},
                transformResponse : function(text, xhr, elt) {return text;},
                isInlineSwap : function(swapStyle) {return false;},
                handleSwap : function(swapStyle, target, fragment, settleInfo) {return false;},
                encodeParameters : function(xhr, parameters, elt) {return null;}
            }
        }

        function defineExtension(name, extension) {
            if(extension.init) {
                extension.init(internalAPI)
            }
            extensions[name] = mergeObjects(extensionBase(), extension);
        }

        /**
         * removeExtension removes an extension from the htmx registry
         *
         * @param {string} name
         */
        function removeExtension(name) {
            delete extensions[name];
        }


        /**
         * @type {htmx.registerExtension}
         */
        function registerExtension(name, registration) {
            var featureSet = makeFeatureSet(name, registration);
            extensionFeatures[name] = featureSet;
        }

        /**
         * getExtensions searches up the DOM tree to return all extensions that can be applied to a given element
         *
         * @param {HTMLElement} elt
         * @param {htmx.HtmxExtension[]=} extensionsToReturn
         * @param {htmx.HtmxExtension[]=} extensionsToIgnore
         */
         function getExtensions(elt, extensionsToReturn, extensionsToIgnore) {

            if (elt == undefined) {
                return extensionsToReturn;
            }
            if (extensionsToReturn == undefined) {
                extensionsToReturn = [];
            }
            if (extensionsToIgnore == undefined) {
                extensionsToIgnore = [];
            }
            var extensionsForElement = getAttributeValue(elt, "hx-ext");
            if (extensionsForElement) {
                forEach(extensionsForElement.split(","), function(extensionName){
                    extensionName = extensionName.replace(/ /g, '');
                    if (extensionName.slice(0, 7) == "ignore:") {
                        extensionsToIgnore.push(extensionName.slice(7));
                        return;
                    }
                    if (extensionsToIgnore.indexOf(extensionName) < 0) {
                        var extension = extensions[extensionName];
                        if (extension && extensionsToReturn.indexOf(extension) < 0) {
                            extensionsToReturn.push(extension);
                        }
                    }
                });
            }
            return getExtensions(parentElt(elt), extensionsToReturn, extensionsToIgnore);
        }

        /** Start of Idiomorph */

        //=============================================================================
        // Core Idiomorph Algorithm - morph, morphNormalizedContent, morphOldNodeTo, morphChildren
        //=============================================================================
        let EMPTY_SET = new Set();

        function morph(oldNode, newContent, config = {}) {

            if (oldNode instanceof Document) {
                oldNode = oldNode.documentElement;
            }

            if (typeof newContent === 'string') {
                newContent = parseContent(newContent);
            }

            let normalizedContent = normalizeContent(newContent);

            let ctx = createMorphContext(oldNode, normalizedContent, config);

            return morphNormalizedContent(oldNode, normalizedContent, ctx);
        }

        function morphNormalizedContent(oldNode, normalizedNewContent, ctx) {
            if (ctx.head.block) {
                let oldHead = oldNode.querySelector('head');
                let newHead = normalizedNewContent.querySelector('head');
                if (oldHead && newHead) {
                    let promises = handleHeadElement(newHead, oldHead, ctx);
                    // when head promises resolve, call morph again, ignoring the head tag
                    Promise.all(promises).then(function () {
                        morphNormalizedContent(oldNode, normalizedNewContent, Object.assign(ctx, {
                            head: {
                                block: false,
                                ignore: true
                            }
                        }));
                    });
                    return;
                }
            }

            if (ctx.morphStyle === "innerHTML") {

                // innerHTML, so we are only updating the children
                morphChildren(normalizedNewContent, oldNode, ctx);
                return oldNode.children;

            } else if (ctx.morphStyle === "outerHTML" || ctx.morphStyle == null) {
                // otherwise find the best element match in the new content, morph that, and merge its siblings
                // into either side of the best match
                let bestMatch = findBestNodeMatch(normalizedNewContent, oldNode, ctx);

                // stash the siblings that will need to be inserted on either side of the best match
                let previousSibling = bestMatch?.previousSibling;
                let nextSibling = bestMatch?.nextSibling;

                // morph it
                let morphedNode = morphOldNodeTo(oldNode, bestMatch, ctx);

                if (bestMatch) {
                    // if there was a best match, merge the siblings in too and return the
                    // whole bunch
                    return insertSiblings(previousSibling, morphedNode, nextSibling);
                } else {
                    // otherwise nothing was added to the DOM
                    return []
                }
            } else {
                throw "Do not understand how to morph style " + ctx.morphStyle;
            }
        }



        /**
         * @param oldNode root node to merge content into
         * @param newContent new content to merge
         * @param ctx the merge context
         * @returns {Element} the element that ended up in the DOM
         */
        function morphOldNodeTo(oldNode, newContent, ctx) {
            if (ctx.ignoreActive && oldNode === document.activeElement) {
                // don't morph focused element
            } else if (newContent == null) {
                if (ctx.callbacks.beforeNodeRemoved(oldNode) === false) return;

                oldNode.remove();
                ctx.callbacks.afterNodeRemoved(oldNode);
                return null;
            } else if (!isSoftMatch(oldNode, newContent)) {
                if (ctx.callbacks.beforeNodeRemoved(oldNode) === false) return;
                if (ctx.callbacks.beforeNodeAdded(newContent) === false) return;

                oldNode.parentElement.replaceChild(newContent, oldNode);
                ctx.callbacks.afterNodeAdded(newContent);
                ctx.callbacks.afterNodeRemoved(oldNode);
                return newContent;
            } else {
                if (ctx.callbacks.beforeNodeMorphed(oldNode, newContent) === false) return;

                if (oldNode instanceof HTMLHeadElement && ctx.head.ignore) {
                    // ignore the head element
                } else if (oldNode instanceof HTMLHeadElement && ctx.head.style !== "morph") {
                    handleHeadElement(newContent, oldNode, ctx);
                } else {
                    syncNodeFrom(newContent, oldNode);
                    morphChildren(newContent, oldNode, ctx);
                }
                ctx.callbacks.afterNodeMorphed(oldNode, newContent);
                return oldNode;
            }
        }

        /**
         * This is the core algorithm for matching up children.  The idea is to use id sets to try to match up
         * nodes as faithfully as possible.  We greedily match, which allows us to keep the algorithm fast, but
         * by using id sets, we are able to better match up with content deeper in the DOM.
         *
         * Basic algorithm is, for each node in the new content:
         *
         * - if we have reached the end of the old parent, append the new content
         * - if the new content has an id set match with the current insertion point, morph
         * - search for an id set match
         * - if id set match found, morph
         * - otherwise search for a "soft" match
         * - if a soft match is found, morph
         * - otherwise, prepend the new node before the current insertion point
         *
         * The two search algorithms terminate if competing node matches appear to outweigh what can be achieved
         * with the current node.  See findIdSetMatch() and findSoftMatch() for details.
         *
         * @param {Element} newParent the parent element of the new content
         * @param {Element } oldParent the old content that we are merging the new content into
         * @param ctx the merge context
         */
        function morphChildren(newParent, oldParent, ctx) {

            let nextNewChild = newParent.firstChild;
            let insertionPoint = oldParent.firstChild;
            let newChild;

            // run through all the new content
            while (nextNewChild) {

                newChild = nextNewChild;
                nextNewChild = newChild.nextSibling;

                // if we are at the end of the exiting parent's children, just append
                if (insertionPoint == null) {
                    if (ctx.callbacks.beforeNodeAdded(newChild) === false) return;

                    oldParent.appendChild(newChild);
                    ctx.callbacks.afterNodeAdded(newChild);
                    removeIdsFromConsideration(ctx, newChild);
                    continue;
                }

                // if the current node has an id set match then morph
                if (isIdSetMatch(newChild, insertionPoint, ctx)) {
                    morphOldNodeTo(insertionPoint, newChild, ctx);
                    insertionPoint = insertionPoint.nextSibling;
                    removeIdsFromConsideration(ctx, newChild);
                    continue;
                }

                // otherwise search forward in the existing old children for an id set match
                let idSetMatch = findIdSetMatch(newParent, oldParent, newChild, insertionPoint, ctx);

                // if we found a potential match, remove the nodes until that point and morph
                if (idSetMatch) {
                    insertionPoint = removeNodesBetween(insertionPoint, idSetMatch, ctx);
                    morphOldNodeTo(idSetMatch, newChild, ctx);
                    removeIdsFromConsideration(ctx, newChild);
                    continue;
                }

                // no id set match found, so scan forward for a soft match for the current node
                let softMatch = findSoftMatch(newParent, oldParent, newChild, insertionPoint, ctx);

                // if we found a soft match for the current node, morph
                if (softMatch) {
                    insertionPoint = removeNodesBetween(insertionPoint, softMatch, ctx);
                    morphOldNodeTo(softMatch, newChild, ctx);
                    removeIdsFromConsideration(ctx, newChild);
                    continue;
                }

                // abandon all hope of morphing, just insert the new child before the insertion point
                // and move on
                if (ctx.callbacks.beforeNodeAdded(newChild) === false) return;

                oldParent.insertBefore(newChild, insertionPoint);
                ctx.callbacks.afterNodeAdded(newChild);
                removeIdsFromConsideration(ctx, newChild);
            }

            // remove any remaining old nodes that didn't match up with new content
            while (insertionPoint !== null) {

                let tempNode = insertionPoint;
                insertionPoint = insertionPoint.nextSibling;
                removeNode(tempNode, ctx);
            }
        }

        //=============================================================================
        // Attribute Syncing Code
        //=============================================================================

        /**
         * syncs a given node with another node, copying over all attributes and
         * inner element state from the 'from' node to the 'to' node
         *
         * @param {Element} from the element to copy attributes & state from
         * @param {Element} to the element to copy attributes & state to
         */
        function syncNodeFrom(from, to) {
            let type = from.nodeType

            // if is an element type, sync the attributes from the
            // new node into the new node
            if (type === 1 /* element type */) {
                const fromAttributes = from.attributes;
                const toAttributes = to.attributes;
                for (const fromAttribute of fromAttributes) {
                    if (to.getAttribute(fromAttribute.name) !== fromAttribute.value) {
                        to.setAttribute(fromAttribute.name, fromAttribute.value);
                    }
                }
                for (const toAttribute of toAttributes) {
                    if (!from.hasAttribute(toAttribute.name)) {
                        to.removeAttribute(toAttribute.name);
                    }
                }
            }

            // sync text nodes
            if (type === 8 /* comment */ || type === 3 /* text */) {
                if (to.nodeValue !== from.nodeValue) {
                    to.nodeValue = from.nodeValue;
                }
            }

            // NB: many bothans died to bring us information:
            //
            // https://github.com/patrick-steele-idem/morphdom/blob/master/src/specialElHandlers.js
            // https://github.com/choojs/nanomorph/blob/master/lib/morph.jsL113

            // sync input value
            if (from instanceof HTMLInputElement &&
                to instanceof HTMLInputElement &&
                from.type !== 'file') {

                to.value = from.value || '';
                syncAttribute(from, to, 'value');

                // sync boolean attributes
                syncAttribute(from, to, 'checked');
                syncAttribute(from, to, 'disabled');
            } else if (from instanceof HTMLOptionElement) {
                syncAttribute(from, to, 'selected')
            } else if (from instanceof HTMLTextAreaElement && to instanceof HTMLTextAreaElement) {
                let fromValue = from.value;
                let toValue = to.value;
                if (fromValue !== toValue) {
                    to.value = fromValue;
                }
                if (to.firstChild && to.firstChild.nodeValue !== fromValue) {
                    to.firstChild.nodeValue = fromValue
                }
            }
        }

        function syncAttribute(from, to, attributeName) {
            if (from[attributeName] !== to[attributeName]) {
                if (from[attributeName]) {
                    to.setAttribute(attributeName, from[attributeName]);
                } else {
                    to.removeAttribute(attributeName);
                }
            }
        }

        //=============================================================================
        // the HEAD tag can be handled specially, either w/ a 'merge' or 'append' style
        //=============================================================================
        function handleHeadElement(newHeadTag, currentHead, ctx) {

            let added = []
            let removed = []
            let preserved = []
            let nodesToAppend = []

            let headMergeStyle = ctx.head.style;

            // put all new head elements into a Map, by their outerHTML
            let srcToNewHeadNodes = new Map();
            for (const newHeadChild of newHeadTag.children) {
                srcToNewHeadNodes.set(newHeadChild.outerHTML, newHeadChild);
            }

            // for each elt in the current head
            for (const currentHeadElt of currentHead.children) {

                // If the current head element is in the map
                let inNewContent = srcToNewHeadNodes.has(currentHeadElt.outerHTML);
                let isReAppended = ctx.head.shouldReAppend(currentHeadElt);
                let isPreserved = ctx.head.shouldPreserve(currentHeadElt);
                if (inNewContent || isPreserved) {
                    if (isReAppended) {
                        // remove the current version and let the new version replace it and re-execute
                        removed.push(currentHeadElt);
                    } else {
                        // this element already exists and should not be re-appended, so remove it from
                        // the new content map, preserving it in the DOM
                        srcToNewHeadNodes.delete(currentHeadElt.outerHTML);
                        preserved.push(currentHeadElt);
                    }
                } else {
                    if (headMergeStyle === "append") {
                        // we are appending and this existing element is not new content
                        // so if and only if it is marked for re-append do we do anything
                        if (isReAppended) {
                            removed.push(currentHeadElt);
                            nodesToAppend.push(currentHeadElt);
                        }
                    } else {
                        // if this is a merge, we remove this content since it is not in the new head
                        if (ctx.head.shouldRemove(currentHeadElt) !== false) {
                            removed.push(currentHeadElt);
                        }
                    }
                }
            }

            // Push the remaining new head elements in the Map into the
            // nodes to append to the head tag
            nodesToAppend.push(...srcToNewHeadNodes.values());
            log("to append: ", nodesToAppend);

            let promises = [];
            for (const newNode of nodesToAppend) {
                log("adding: ", newNode);
                let newElt = document.createRange().createContextualFragment(newNode.outerHTML).firstChild;
                log(newElt);
                if (ctx.callbacks.beforeNodeAdded(newElt) !== false) {
                    if (newElt.href || newElt.src) {
                        let resolve = null;
                        let promise = new Promise(function (_resolve) {
                            resolve = _resolve;
                        });
                        newElt.addEventListener('load',function() {
                            resolve();
                        });
                        promises.push(promise);
                    }
                    currentHead.appendChild(newElt);
                    ctx.callbacks.afterNodeAdded(newElt);
                    added.push(newElt);
                }
            }

            // remove all removed elements, after we have appended the new elements to avoid
            // additional network requests for things like style sheets
            for (const removedElement of removed) {
                if (ctx.callbacks.beforeNodeRemoved(removedElement) !== false) {
                    currentHead.removeChild(removedElement);
                    ctx.callbacks.afterNodeRemoved(removedElement);
                }
            }

            ctx.head.afterHeadMorphed(currentHead, {added: added, kept: preserved, removed: removed});
            return promises;
        }

        //=============================================================================
        // Misc
        //=============================================================================

        function log() {
            //console.log(arguments);
        }

        function noOp() {}

        function createMorphContext(oldNode, newContent, config) {
            return {
                target:oldNode,
                newContent: newContent,
                config: config,
                morphStyle : config.morphStyle,
                ignoreActive : config.ignoreActive,
                idMap: createIdMap(oldNode, newContent),
                deadIds: new Set(),
                callbacks: Object.assign({
                    beforeNodeAdded: noOp,
                    afterNodeAdded : noOp,
                    beforeNodeMorphed: noOp,
                    afterNodeMorphed : noOp,
                    beforeNodeRemoved: noOp,
                    afterNodeRemoved : noOp,

                }, config.callbacks),
                head: Object.assign({
                    style: 'merge',
                    shouldPreserve : function(elt) {
                        return elt.getAttribute("im-preserve") === "true";
                    },
                    shouldReAppend : function(elt) {
                        return elt.getAttribute("im-re-append") === "true";
                    },
                    shouldRemove : noOp,
                    afterHeadMorphed : noOp,
                }, config.head),
            }
        }

        function isIdSetMatch(node1, node2, ctx) {
            if (node1 == null || node2 == null) {
                return false;
            }
            if (node1.nodeType === node2.nodeType && node1.tagName === node2.tagName) {
                if (node1.id !== "" && node1.id === node2.id) {
                    return true;
                } else {
                    return getIdIntersectionCount(ctx, node1, node2) > 0;
                }
            }
            return false;
        }

        function isSoftMatch(node1, node2) {
            if (node1 == null || node2 == null) {
                return false;
            }
            return node1.nodeType === node2.nodeType && node1.tagName === node2.tagName
        }

        function removeNodesBetween(startInclusive, endExclusive, ctx) {
            while (startInclusive !== endExclusive) {
                let tempNode = startInclusive;
                startInclusive = startInclusive.nextSibling;
                removeNode(tempNode, ctx);
            }
            removeIdsFromConsideration(ctx, endExclusive);
            return endExclusive.nextSibling;
        }

        //=============================================================================
        // Scans forward from the insertionPoint in the old parent looking for a potential id match
        // for the newChild.  We stop if we find a potential id match for the new child OR
        // if the number of potential id matches we are discarding is greater than the
        // potential id matches for the new child
        //=============================================================================
        function findIdSetMatch(newContent, oldParent, newChild, insertionPoint, ctx) {

            // max id matches we are willing to discard in our search
            let newChildPotentialIdCount = getIdIntersectionCount(ctx, newChild, oldParent);

            let potentialMatch = null;

            // only search forward if there is a possibility of an id match
            if (newChildPotentialIdCount > 0) {
                let potentialMatch = insertionPoint;
                // if there is a possibility of an id match, scan forward
                // keep track of the potential id match count we are discarding (the
                // newChildPotentialIdCount must be greater than this to make it likely
                // worth it)
                let otherMatchCount = 0;
                while (potentialMatch != null) {

                    // If we have an id match, return the current potential match
                    if (isIdSetMatch(newChild, potentialMatch, ctx)) {
                        return potentialMatch;
                    }

                    // computer the other potential matches of this new content
                    otherMatchCount += getIdIntersectionCount(ctx, potentialMatch, newContent);
                    if (otherMatchCount > newChildPotentialIdCount) {
                        // if we have more potential id matches in _other_ content, we
                        // do not have a good candidate for an id match, so return null
                        return null;
                    }

                    // advanced to the next old content child
                    potentialMatch = potentialMatch.nextSibling;
                }
            }
            return potentialMatch;
        }

        //=============================================================================
        // Scans forward from the insertionPoint in the old parent looking for a potential soft match
        // for the newChild.  We stop if we find a potential soft match for the new child OR
        // if we find a potential id match in the old parents children OR if we find two
        // potential soft matches for the next two pieces of new content
        //=============================================================================
        function findSoftMatch(newContent, oldParent, newChild, insertionPoint, ctx) {

            let potentialSoftMatch = insertionPoint;
            let nextSibling = newChild.nextSibling;
            let siblingSoftMatchCount = 0;

            while (potentialSoftMatch != null) {

                if (getIdIntersectionCount(ctx, potentialSoftMatch, newContent) > 0) {
                    // the current potential soft match has a potential id set match with the remaining new
                    // content so bail out of looking
                    return null;
                }

                // if we have a soft match with the current node, return it
                if (isSoftMatch(newChild, potentialSoftMatch)) {
                    return potentialSoftMatch;
                }

                if (isSoftMatch(nextSibling, potentialSoftMatch)) {
                    // the next new node has a soft match with this node, so
                    // increment the count of future soft matches
                    siblingSoftMatchCount++;
                    nextSibling = nextSibling.nextSibling;

                    // If there are two future soft matches, bail to allow the siblings to soft match
                    // so that we don't consume future soft matches for the sake of the current node
                    if (siblingSoftMatchCount >= 2) {
                        return null;
                    }
                }

                // advanced to the next old content child
                potentialSoftMatch = potentialSoftMatch.nextSibling;
            }

            return potentialSoftMatch;
        }

        function parseContent(newContent) {
            let parser = new DOMParser();

            // remove svgs to avoid false-positive matches on head, etc.
            let contentWithSvgsRemoved = newContent.replace(/<svg(\s[^>]*>|>)([\s\S]*?)<\/svg>/gim, '');

            // if the newContent contains a html, head or body tag, we can simply parse it w/o wrapping
            if (contentWithSvgsRemoved.match(/<\/html>/) || contentWithSvgsRemoved.match(/<\/head>/) || contentWithSvgsRemoved.match(/<\/body>/)) {
                let content = parser.parseFromString(newContent, "text/html");
                // if it is a full HTML document, return the document itself as the parent container
                if (contentWithSvgsRemoved.match(/<\/html>/)) {
                    content.generatedByIdiomorph = true;
                    return content;
                } else {
                    // otherwise return the html element as the parent container
                    let htmlElement = content.firstChild;
                    if (htmlElement) {
                        htmlElement.generatedByIdiomorph = true;
                        return htmlElement;
                    } else {
                        return null;
                    }
                }
            } else {
                // if it is partial HTML, wrap it in a template tag to provide a parent element and also to help
                // deal with touchy tags like tr, tbody, etc.
                let responseDoc = parser.parseFromString("<body><template>" + newContent + "</template></body>", "text/html");
                let content = responseDoc.body.querySelector('template').content;
                content.generatedByIdiomorph = true;
                return content
            }
        }

        function normalizeContent(newContent) {
            if (newContent == null) {
                // noinspection UnnecessaryLocalVariableJS
                const dummyParent = document.createElement('div');
                return dummyParent;
            } else if (newContent.generatedByIdiomorph) {
                // the template tag created by idiomorph parsing can serve as a dummy parent
                return newContent;
            } else if (newContent instanceof Node) {
                // a single node is added as a child to a dummy parent
                const dummyParent = document.createElement('div');
                dummyParent.append(newContent);
                return dummyParent;
            } else {
                // all nodes in the array or HTMLElement collection are consolidated under
                // a single dummy parent element
                const dummyParent = document.createElement('div');
                for (const elt of [...newContent]) {
                    dummyParent.append(elt);
                }
                return dummyParent;
            }
        }

        function insertSiblings(previousSibling, morphedNode, nextSibling) {
            let stack = []
            let added = []
            while (previousSibling != null) {
                stack.push(previousSibling);
                previousSibling = previousSibling.previousSibling;
            }
            while (stack.length > 0) {
                let node = stack.pop();
                added.push(node); // push added preceding siblings on in order and insert
                morphedNode.parentElement.insertBefore(node, morphedNode);
            }
            added.push(morphedNode);
            while (nextSibling != null) {
                stack.push(nextSibling);
                added.push(nextSibling); // here we are going in order, so push on as we scan, rather than add
                nextSibling = nextSibling.nextSibling;
            }
            while (stack.length > 0) {
                morphedNode.parentElement.insertBefore(stack.pop(), morphedNode.nextSibling);
            }
            return added;
        }

        function findBestNodeMatch(newContent, oldNode, ctx) {
            let currentElement;
            currentElement = newContent.firstChild;
            let bestElement = currentElement;
            let score = 0;
            while (currentElement) {
                let newScore = scoreElement(currentElement, oldNode, ctx);
                if (newScore > score) {
                    bestElement = currentElement;
                    score = newScore;
                }
                currentElement = currentElement.nextSibling;
            }
            return bestElement;
        }

        function scoreElement(node1, node2, ctx) {
            if (isSoftMatch(node1, node2)) {
                return .5 + getIdIntersectionCount(ctx, node1, node2);
            }
            return 0;
        }

        function removeNode(tempNode, ctx) {
            removeIdsFromConsideration(ctx, tempNode)
            if (ctx.callbacks.beforeNodeRemoved(tempNode) === false) return;

            tempNode.remove();
            ctx.callbacks.afterNodeRemoved(tempNode);
        }

        //=============================================================================
        // ID Set Functions
        //=============================================================================

        function isIdInConsideration(ctx, id) {
            return !ctx.deadIds.has(id);
        }

        function idIsWithinNode(ctx, id, targetNode) {
            let idSet = ctx.idMap.get(targetNode) || EMPTY_SET;
            return idSet.has(id);
        }

        function removeIdsFromConsideration(ctx, node) {
            let idSet = ctx.idMap.get(node) || EMPTY_SET;
            for (const id of idSet) {
                ctx.deadIds.add(id);
            }
        }

        function getIdIntersectionCount(ctx, node1, node2) {
            let sourceSet = ctx.idMap.get(node1) || EMPTY_SET;
            let matchCount = 0;
            for (const id of sourceSet) {
                // a potential match is an id in the source and potentialIdsSet, but
                // that has not already been merged into the DOM
                if (isIdInConsideration(ctx, id) && idIsWithinNode(ctx, id, node2)) {
                    ++matchCount;
                }
            }
            return matchCount;
        }

        /**
         * A bottom up algorithm that finds all elements with ids inside of the node
         * argument and populates id sets for those nodes and all their parents, generating
         * a set of ids contained within all nodes for the entire hierarchy in the DOM
         *
         * @param node {Element}
         * @param {Map<Node, Set<String>>} idMap
         */
        function populateIdMapForNode(node, idMap) {
            let nodeParent = node.parentElement;
            // find all elements with an id property
            let idElements = node.querySelectorAll('[id]');
            for (const elt of idElements) {
                let current = elt;
                // walk up the parent hierarchy of that element, adding the id
                // of element to the parent's id set
                while (current !== nodeParent && current != null) {
                    let idSet = idMap.get(current);
                    // if the id set doesn't exist, create it and insert it in the  map
                    if (idSet == null) {
                        idSet = new Set();
                        idMap.set(current, idSet);
                    }
                    idSet.add(elt.id);
                    current = current.parentElement;
                }
            }
        }

        /**
         * This function computes a map of nodes to all ids contained within that node (inclusive of the
         * node).  This map can be used to ask if two nodes have intersecting sets of ids, which allows
         * for a looser definition of "matching" than tradition id matching, and allows child nodes
         * to contribute to a parent nodes matching.
         *
         * @param {Element} oldContent  the old content that will be morphed
         * @param {Element} newContent  the new content to morph to
         * @returns {Map<Node, Set<String>>} a map of nodes to id sets for the
         */
        function createIdMap(oldContent, newContent) {
            let idMap = new Map();
            populateIdMapForNode(oldContent, idMap);
            populateIdMapForNode(newContent, idMap);
            return idMap;
        }

        /** End of Idiomorph */

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
                // @ts-ignore
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
            var restoredElts = getDocument().querySelectorAll(
                "[hx-trigger='restored'],[data-hx-trigger='restored']"
            );
            body.addEventListener("htmx:abort", function (evt) {
                var target = evt.target;
                var internalData = getInternalData(target);
                if (internalData && internalData.xhr) {
                    internalData.xhr.abort();
                }
            });
            var originalPopstate = window.onpopstate;
            window.onpopstate = function (event) {
                if (event.state && event.state.htmx) {
                    restoreHistory();
                    forEach(restoredElts, function(elt){
                        triggerEvent(elt, 'htmx:restored', {
                            'document': getDocument(),
                            'triggerEvent': triggerEvent
                        });
                    });
                } else {
                    if (originalPopstate) {
                        originalPopstate(event);
                    }
                }
            };
            setTimeout(function () {
                triggerEvent(body, 'htmx:load', {}); // give ready handlers a chance to load up before firing this event
                body = null; // kill reference for gc
            }, 0);
        })

        return htmx;
    }
)()
}));

