function addScript(url) {
    var myScript = document.createElement('script');
    myScript.setAttribute('src', url);
    document.head.appendChild(myScript);
}

function interpolate(str, params) {
    var returnStr = "";
    try {
        var charArray = Array.from(str);
        while (charArray.length > 0) {
            var current = charArray.shift();
            if (current === "$" && charArray[0] === "{") {
                var evalStr = "(function(env) { with(env) { return "
                charArray.shift();
                while (charArray.length > 0 && charArray[0] !== "}") {
                    evalStr += charArray.shift()
                }
                charArray.shift();
                evalStr += " } })";
                // console.log("Evaling", evalStr);
                returnStr += eval(evalStr)(params);
            } else {
                returnStr += current;
            }
        }
    } catch (e) {
        returnStr = e.message;
    }
    return returnStr;
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
