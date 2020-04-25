var HTMx = HTMx || (function()
{
    function getClosestAttributeValue(elt, attributeName)
    {
        let attribute = elt.getAttribute(attributeName);
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
        let targetVal = getClosestAttributeValue(elt, "hx-target");
        if (targetVal) {
            return document.querySelector(targetVal);
        } else {
            return elt;
        }
    }

    function makeFragment(resp) {
        let range = document.createRange();
        return range.createContextualFragment(resp);
    }

    function swapResponse(elt, resp) {
        let target = getTarget(elt);
        let swapStyle = getClosestAttributeValue(elt, "hx-swap");
        if (swapStyle === "outerHTML") {
            target.outerHTML = resp;
            processElement(target);
        } else if (swapStyle === "prepend") {
            let fragment = makeFragment(resp);
            for (let i = fragment.children.length - 1; i >= 0; i--) {
                const child = fragment.children[i];
                processElement(child);
                target.insertBefore(child, target.firstChild);
            }
        } else if (swapStyle === "append") {
            let fragment = makeFragment(resp);
            for (let i = 0; i < fragment.children.length; i++) {
                const child = fragment.children[i];
                processElement(child);
                target.appendChild(child);
            }
        } else {
            target.innerHTML = resp;
            for (let i = 0; i < target.children.length; i++) {
                const child = target.children[i];
                processElement(child);
            }
        }
    }

    // core ajax request
    function issueAjaxRequest(elt, url)
    {
        let request = new XMLHttpRequest();
        // TODO - support more request types POST, PUT, DELETE, etc.
        request.open('GET', url, true);
        request.onload = function()
        {
            if (this.status >= 200 && this.status < 400)
            {
                // don't process 'No Content' response
                if (this.status != 204) {
                    // Success!
                    let resp = this.response;
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

    // DOM element processing
    function processElement(elt) {
        if(elt.getAttribute('hx-get')) {
            elt.addEventListener("click", function(evt){
                issueAjaxRequest(elt, elt.getAttribute('hx-get'));
                evt.stopPropagation();
            });
        }
        for (let i = 0; i < elt.children.length; i++) {
            const child = elt.children[i];
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

    // public API
    return {
        version : "0.0.1"
    }
})();