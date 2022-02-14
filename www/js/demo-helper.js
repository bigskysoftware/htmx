function addScript(url) {
    var myScript = document.createElement('script');
    myScript.setAttribute('src', url);
    document.head.appendChild(myScript);
}

function interpolate(str) {
    var returnStr = "";
    var charArray = Array.from(str);
    while (charArray.length > 0) {
        var current = charArray.shift();
        if (current === "$" && charArray[0] === "{") {
            var evalStr = "(function() { return "
            charArray.shift();
            while (charArray.length > 0 && charArray[0] !== "}") {
                evalStr += charArray.shift()
            }
            charArray.shift();
            evalStr += " })()";
            console.log("Evaling", evalStr);
            returnStr += eval(evalStr);
        } else {
            returnStr += current;
        }
    }
    return returnStr;
}

function initMockRequests() {
    if(typeof MockRequests === "undefined" ||
        typeof htmx === "undefined" ||
        typeof _hyperscript === "undefined") {
        console.log("Not defined yet");
        setTimeout(initMockRequests, 20);
    } else {
        console.log("defining");
        htmx.findAll("template").forEach(function(elt){
            if(elt.getAttribute("url")){
                MockRequests.setDynamicMockUrlResponse(elt.getAttribute("url"),
                    {dynamicResponseModFn:
                            function(request, response) {
                                return interpolate(elt.innerHTML);
                            },
                    usePathnameForAllQueries: true});
            }
        });
    }
}

addScript("https://unpkg.com/htmx.org@1.6.1/dist/htmx.js");
addScript("https://unpkg.com/hyperscript.org@0.9.4/dist/_hyperscript_w9y.min.js");
addScript("https://unpkg.com/mock-requests@1.3.2/index.js");
initMockRequests();
