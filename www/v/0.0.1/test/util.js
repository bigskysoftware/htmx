/* Test Utilities */

HTMx.logger = function(elt, event, data) {
    if(console) {
        console.log(event, elt, data);
    }
}

function byId(id) {
    return document.getElementById(id);
}

function make(htmlStr) {
    var makeFn = function(){
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
    if (getWorkArea()) {
        return makeFn();
    } else {
        ready(makeFn);
    }
}

function ready(fn) {
    if (document.readyState !== 'loading') {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
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
    var server = sinon.fakeServer.create();
    server.fakeHTTPMethods = true;
    server.getHTTPMethod = function(xhr) {
        return xhr.requestHeaders['X-HTTP-Method-Override'] || xhr.method;
    }
    return server;
}
