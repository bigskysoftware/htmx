var HTMx = HTMx || (function()
{
    'use strict';

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

    function getClosestAttributeValue(elt, attributeName)
    {
        var attribute = getAttributeValue(elt, attributeName);
        if(attribute)
        {
            return attribute;
        }
        else if (elt.parentElement)
        {
            return getClosestAttributeValue(elt.parentElement, attributeName);
        }
        else
        {
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

    function processResponseNodes(parent, target, text) {
        var fragment = makeFragment(text);
        for (var i = fragment.childNodes.length - 1; i >= 0; i--) {
            var child = fragment.childNodes[i];
            parent.insertBefore(child, target);
            if (child.nodeType != Node.TEXT_NODE) {
                processElement(child);
            }
        }
    }

    function swapResponse(elt, resp) {
        var target = getTarget(elt);
        var swapStyle = getClosestAttributeValue(elt, "hx-swap");
        if (swapStyle === "outerHTML") {
            processResponseNodes(target.parentElement, target, resp);
            target.parentElement.removeChild(target);
        } else if (swapStyle === "prepend") {
            processResponseNodes(target, target.firstChild, resp);
        } else if (swapStyle === "prependBefore") {
            processResponseNodes(target.parentElement, target, resp);
        } else if (swapStyle === "append") {
            processResponseNodes(target, null, resp);
        } else if (swapStyle === "appendAfter") {
            processResponseNodes(target.parentElement, target.nextSibling, resp);
        } else {
            target.innerHTML = "";
            processResponseNodes(target, null, resp);
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

    function isRawObject(o){
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

    // core ajax request
    function issueAjaxRequest(elt, url)
    {
        var request = new XMLHttpRequest();
        // TODO - support more request types POST, PUT, DELETE, etc.
        request.open('GET', url, true);
        request.onload = function()
        {
            var trigger = this.getResponseHeader("X-HX-Trigger");
            handleTrigger(elt, trigger);
            if (this.status >= 200 && this.status < 400)
            {
                // don't process 'No Content' response
                if (this.status != 204) {
                    // Success!
                    var resp = this.response;
                    swapResponse(elt, resp);
                }
            }
            else
            {
                // TODO error handling
                elt.innerHTML = "ERROR";
            }
        };
        request.onerror = function () {
            // TODO error handling
            // There was a connection error of some sort
        };
        request.send();
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

    function processElement(elt) {
        if(getAttributeValue(elt,'hx-get')) {
            var trigger = getTrigger(elt);
            if (trigger === 'load') {
                issueAjaxRequest(elt, getAttributeValue(elt, 'hx-get'));
            } else {
                elt.addEventListener(trigger, function(evt){
                    issueAjaxRequest(elt, getAttributeValue(elt, 'hx-get'));
                    evt.stopPropagation();
                });
            }
        }
        if (getAttributeValue(elt, 'hx-add-class')) {
            processClassList(elt, getAttributeValue(elt,'hx-add-class'), "add");
        }
        if (getAttributeValue(elt, 'hx-remove-class')) {
            processClassList(elt, getAttributeValue(elt,'hx-remove-class'), "remove");
        }
        for (var i = 0; i < elt.children.length; i++) {
            var child = elt.children[i];
            processElement(child);
        }
    }

    function ready(fn) {
        if (document.readyState !== 'loading'){
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    // initialize the document
    ready(function () {
        processElement(document.body);
    })

    // Public API
    return {
        processElement : processElement,
        version : "0.0.1"
    }
})();