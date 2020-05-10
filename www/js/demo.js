//====================================
// Server setup
//====================================
var server = sinon.fakeServer.create();
server.fakeHTTPMethods = true;
server.getHTTPMethod = function(xhr) {
    return xhr.requestHeaders['X-HTTP-Method-Override'] || xhr.method;
}
server.autoRespond = true;

//====================================
// Request Handling
//====================================

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

function getQuery(url) {
    var question = url.indexOf("?");
    var hash = url.indexOf("#");
    if(hash==-1 && question==-1) return "";
    if(hash==-1) hash = url.length;
    return question==-1 || hash==question+1 ? url.substring(hash) :
        url.substring(question+1,hash);
}

function params(request) {
    if (server.getHTTPMethod(request) == "GET") {
        return parseParams(getQuery(request.url));
    } else {
        return parseParams(request.requestBody);
    }
}

//====================================
// Routing
//====================================

function init(path, response) {
    onGet(path, response);
    let content = response(null, {});
    document.getElementById("demo-canvas").innerHTML = content;
    pushActivityChip("Initial State", "init", demoInitialStateTemplate(content));
}

function onGet(path, response) {
    server.respondWith("GET", path, function(request){
        let body = response(request, params(request));
        request.respond(200, {}, body);
    });
}

function onPut(path, response) {
    server.respondWith("PUT", path, function(request){
        let body = response(request, params(request));
        request.respond(200, {}, body);
    });
}

//====================================
// Activites
//====================================

var requestId = 0;
kutty.on("beforeSwap.kutty", function(event) {
    requestId++;
    pushActivityChip(`${server.getHTTPMethod(event.detail.xhr)} ${event.detail.xhr.url}`, `req-${requestId}`, demoResponseTemplate(event.detail));
    document.getElementById("request-count").innerText = ": " + requestId;
});

function showTimelineEntry(id) {
    var children = document.getElementById("demo-current-request").children;
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (child.id == id) {
            child.classList.remove('hide');
        } else {
            child.classList.add('hide');
        }
    }
    var children = document.getElementById("demo-timeline").children;
    for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (child.id == id + "-link" ) {
            child.classList.add('active');
        } else {
            child.classList.remove('active');
        }
    }
}

function pushActivityChip(name, id, content) {
    document.getElementById("demo-timeline").insertAdjacentHTML("afterbegin", `<li id="${id}-link"><a onclick="showTimelineEntry('${id}')">${name}</a></li>`);
    document.getElementById("demo-current-request").insertAdjacentHTML("afterbegin", `<div id="${id}">${content}</div>`);
    showTimelineEntry(id);
    Prism.highlightAll();
}

//====================================
// Templates
//====================================

function escapeHtml(string) {
    var pre = document.createElement('pre');
    var text = document.createTextNode( string );
    pre.appendChild(text);
    return pre.innerHTML;
}

function demoInitialStateTemplate(html){
    return `<span class="activity initial">
  <b>HTML</b>
  <pre class="language-html"><code class="language-html">${escapeHtml(html)}</code></pre>
</span>`
}

function demoResponseTemplate(details){
    return `<span class="activity response">
  <div>
  <b>${server.getHTTPMethod(details.xhr)}</b> ${details.xhr.url}
  </div>
  <div>
    parameters: ${JSON.stringify(params(details.xhr))}
  </div>
  <div>
  <b>Response</b>
  <pre class="language-html"><code class="language-html">${escapeHtml(details.response)}</code> </pre>  
  </div>
</span>`;
}