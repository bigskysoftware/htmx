/* Test Utilities */

htmx.logAll();

function byId(id) {
    return document.getElementById(id);
}

function make(htmlStr) {
    var makeFn = function(){
        var  range = document.createRange();
        var  fragment = range.createContextualFragment(htmlStr);
        var  wa = getWorkArea();
        for (var  i = fragment.childNodes.length - 1; i >= 0; i--) {
            var child = fragment.childNodes[i];
            htmx.process(child);
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

function parseParams(str) {
    var re = /([^&=]+)=?([^&]*)/g;
    var decode = function (str) {
        return decodeURIComponent(str.replace(/\+/g, ' '));
    };
    var params = {}, e;
    if (str) {
        if (str.substr(0, 1) == '?') {
            str = str.substr(1);
        }
        while (e = re.exec(str)) {
            var k = decode(e[1]);
            var v = decode(e[2]);
            if (params[k] !== undefined) {
                if (!Array.isArray(params[k])) {
                    params[k] = [params[k]];
                }
                params[k].push(v);
            } else {
                params[k] = v;
            }
        }
    }
    return params;
}
