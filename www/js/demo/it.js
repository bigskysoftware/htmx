function addScript(url) {
    var myScript = document.createElement('script');
    myScript.setAttribute('src', url);
    document.head.appendChild(myScript);
}

function interpolate(str, params) {
    try {
        return eval(`env => { with (env) { return \`${str}\` } }`)(params)
    } catch (e) {
        return e.message;
    }
}

function initMockRequests() {
    if(typeof MockRequests === "undefined" ||
        typeof htmx === "undefined" ||
        typeof _hyperscript === "undefined") {
        // console.log("Not defined yet");
        setTimeout(initMockRequests, 20);
    } else {
        // console.log("defining");
        htmx.findAll("template").forEach(function(elt){
            if(elt.getAttribute("url")){
                MockRequests.setDynamicMockUrlResponse(elt.getAttribute("url"),
                    {dynamicResponseModFn:
                            function(request, response, parameters) {
                                console.log(request, response, parameters)
                                return interpolate(elt.innerHTML, parameters);
                            },
                    usePathnameForAllQueries: true});
            }
        });
    }
}

addScript("https://unpkg.com/htmx.org");
addScript("https://unpkg.com/hyperscript.org");
addScript("https://unpkg.com/mock-requests@1.3.2/index.js");
initMockRequests();
