var HTMx = HTMx || (function()
{
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

    function swapResponse(elt, resp) {
        var target = getTarget(elt);
        var swapStyle = getClosestAttributeValue(elt, "hx-swap");
        if (swapStyle === "outerHTML") {
            var fragment = makeFragment(resp);
            for (var i = fragment.children.length - 1; i >= 0; i--) {
                var child = fragment.children[i];
                processElement(child);
                target.parentElement.insertBefore(child, target.firstChild);
            }
            target.parentElement.removeChild(target);
        } else if (swapStyle === "prepend") {
            var fragment = makeFragment(resp);
            for (var i = fragment.children.length - 1; i >= 0; i--) {
                var child = fragment.children[i];
                processElement(child);
                target.insertBefore(child, target.firstChild);
            }
        } else if (swapStyle === "append") {
            var fragment = makeFragment(resp);
            for (var i = 0; i < fragment.children.length; i++) {
                var child = fragment.children[i];
                processElement(child);
                target.appendChild(child);
            }
        } else {
            target.innerHTML = resp;
            for (var i = 0; i < target.children.length; i++) {
                var child = target.children[i];
                processElement(child);
            }
        }
    }

    // core ajax request
    function issueAjaxRequest(elt, url)
    {
        var request = new XMLHttpRequest();
        // TODO - support more request types POST, PUT, DEvarE, etc.
        request.open('GET', url, true);
        request.onload = function()
        {
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
                elt.innerHTML = "ERROR";
            }
        };
        request.onerror = function () {
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