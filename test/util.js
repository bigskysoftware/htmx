/* Test Utilities */
function byId(id) {
    return document.getElementById(id);
}

function make(htmlStr) {
    var  range = document.createRange();
    var  fragment = range.createContextualFragment(htmlStr);
    var  wa = getWorkArea();
    for (var  i = fragment.children.length - 1; i >= 0; i--) {
        var child = fragment.children[i];
        HTMx.processElement(child);
        wa.appendChild(child);
    }
    return wa.lastChild;
}

function getWorkArea() {
    return byId("work-area");
}

function clearWorkArea() {
    getWorkArea().innerHTML = "";
}

function removeWhiteSpace(str) {
    return str.replace(/\s/g, "");
}

function makeServer(){
    var server = sinon.fakeServer.create({logger:function(msg) {
            console.log(msg);
        }});
    server.fakeHTTPMethods = true;
    server.getHTTPMethod = function(xhr) {
        return xhr.requestHeaders['X-HTTP-Method-Override'] || xhr.method;
    }
    return server;
}