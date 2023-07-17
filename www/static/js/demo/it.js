(function(){

    function addScript(url) {
        var myScript = document.createElement('script');
        myScript.setAttribute('src', url);
        document.head.appendChild(myScript);
    }

    function interpolate(str, params) {
        try {
            var escapedCode = str.replace(/`/, '\\`');
            return eval(
                `env => { with (env) { return \`${escapedCode}\` } }`
            )(params)
        } catch (e) {
            log('demo:response-error', "An error occurred during a mock response", e);
            return e.message;
        }
    }

    function log(name, message) {
        console.log("@ " + new Date().valueOf() + " - ", ...arguments);
        var event = new Event(name, {name:name, info:arguments});
        if (document.body) {
            document.body.dispatchEvent(event);
        }
    }

    function initHtmxAndHyperscript() {
        if (typeof htmx === "undefined" || typeof _hyperscript === "undefined") {
            setTimeout(initHtmxAndHyperscript, 20);
        } else {
            enableThings();
            log('demo:ready', "the demo environment is ready");
        }
    }

    var DISABLEABLE_ELTS = "button, command, fieldset, keygen, optgroup, option, select, textarea, input";
    function disableThings() {
        log('demo:disabling-elts', "disabling elements");
        document.querySelectorAll(DISABLEABLE_ELTS).forEach(function(elt){
            elt.setAttribute("data-was-disabled", elt.hasAttribute('disabled'));
            elt.setAttribute("disabled", "true");
        })
    }

    function enableThings() {
        log('demo:enabling-elts', "enabling elements");
        document.querySelectorAll(DISABLEABLE_ELTS).forEach(function(elt){
            if (elt.getAttribute("data-was-disabled") == "false") {
                elt.removeAttribute("disabled");
            }
        })
    }

    function initMockRequests() {
        if(typeof MockRequests === "undefined") {
            // console.log("Not defined yet");
            setTimeout(initMockRequests, 20);
        } else {

            log('demo:mock-request-loaded', "mock-request library loaded, mocking requests and loading htmx & hyperscript")

            //-----------------------------------------------------------------
            // mock requests based on template tags
            //-----------------------------------------------------------------
            document.querySelectorAll("template").forEach(function(elt){
                if(elt.getAttribute("url")){
                    var configDelay = elt.getAttribute("delay");
                    if (configDelay) {
                        var delay = Number.parseInt(configDelay);
                    }
                    MockRequests.setDynamicMockUrlResponse(elt.getAttribute("url"),
                        {dynamicResponseModFn:
                                function(request, response, parameters) {
                                    log("demo:request", "A mock request was made: ", request, response, parameters)
                                    return interpolate(elt.innerHTML, { ...parameters, ...Object.fromEntries(new URLSearchParams(request)) });
                                },
                            delay: delay,
                            usePathnameForAllQueries: true});
                }
            });

            log('demo:htmx-loading', "loading htmx & hyperscript...")
            addScript("https://unpkg.com/htmx.org");
            addScript("https://unpkg.com/hyperscript.org");
            initHtmxAndHyperscript();
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        disableThings();
        log('demo:mock-request-loading', "loading mock-request library...")
        addScript("https://unpkg.com/mock-requests@1.3.2/index.js");
        initMockRequests();
    }, false);
})();
