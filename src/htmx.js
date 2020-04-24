var HTMx = HTMx || (function()
{
    // core ajax request
    function issueAjaxRequest(elt, url)
    {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.onload = function()
        {
            if (this.status >= 200 && this.status < 400) 
            {
                // Success!
                var resp = this.response;
                elt.innerHTML = resp;
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
            elt.addEventListener("click", function(){
                issueAjaxRequest(elt, elt.getAttribute('hx-get'))
            });
        }
        for (let i = 0; i < elt.children.length; i++) {
            const child = elt.children[i];
            processElement(child);
        }
    }

    function ready(fn) {
        if (document.readyState != 'loading'){
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