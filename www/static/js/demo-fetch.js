//====================================
// Fetch Mock Server
//====================================
const routes = [];
const originalFetch = window.fetch;

window.fetch = async function(url, init = {}) {
    url = typeof url === 'string' ? url : url.url;
    const method = (init.headers?.['X-HTTP-Method-Override'] || init.method || 'GET').toUpperCase();

    // Pass through root and absolute URLs
    if (url === "/" || url.startsWith("http")) return originalFetch.apply(this, arguments);

    // Find matching route (strip query params for matching)
    const urlWithoutQuery = url.split('?')[0];
    const route = routes.find(r => r.method === method && (r.url instanceof RegExp ? r.url.test(urlWithoutQuery) : r.url === urlWithoutQuery));
    if (!route) return originalFetch.apply(this, arguments);

    // Simulate network delay
    await new Promise(r => setTimeout(r, 80));

    // Execute handler
    const headers = {};
    const body = route.handler({ url, method, body: init.body, headers: init.headers }, parseParams(method, url, init.body), headers);

    return new Response(body, { status: 200, headers });
};

function parseParams(method, url, body) {
    const parse = str => {
        const params = {};
        str?.replace(/([^&=]+)=([^&]*)/g, (_, k, v) => params[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' ')));
        return params;
    };

    if (method === "GET") return parse(url.split('?')[1]);
    if (typeof body === 'string') return parse(body);
    if (body instanceof URLSearchParams || body instanceof FormData) {
        const params = {};
        for (const [k, v] of body.entries()) if (typeof v === 'string') params[k] = v;
        return params;
    }
    return {};
}

//====================================
// Routing API
//====================================
function init(path, response) {
    onGet(path, response);
    const canvas = document.getElementById("demo-canvas");
    if (canvas) {
        const content = response(null, {});
        canvas.innerHTML = content;
        pushActivityChip("Initial State", "init", `<span class="activity initial"><b>HTML</b><pre class="language-html"><code class="language-html">${escapeHtml(content)}</code></pre></span>`);
    }
}

function onGet(path, handler) { routes.push({ method: 'GET', url: path, handler }); }
function onPost(path, handler) { routes.push({ method: 'POST', url: path, handler }); }
function onPut(path, handler) { routes.push({ method: 'PUT', url: path, handler }); }
function onDelete(path, handler) { routes.push({ method: 'DELETE', url: path, handler }); }

function params(request) { return parseParams(request.method, request.url, request.body); }
function headers(request) {
    const hx = {};
    for (const [k, v] of Object.entries(request.headers || {})) if (k.toLowerCase().startsWith('hx-')) hx[k] = v;
    return hx;
}

//====================================
// Activity Timeline
//====================================
let requestId = 0;

// Register event listener - will be called after htmx loads
function setupActivityTracking() {
    document.addEventListener("htmx:after:swap", function(evt) {
        if (!document.getElementById("request-count")) return;

        const ctx = evt.detail.ctx;
        const hxHeaders = {};
        if (ctx.response?.headers) {
            ctx.response.headers.forEach((v, k) => { if (k.toLowerCase().startsWith('hx-')) hxHeaders[k] = v; });
        }

        pushActivityChip(
            `${ctx.request.method} ${ctx.request.action}`,
            `req-${++requestId}`,
            `<span class="activity response">
                <div><b>${ctx.request.method}</b> ${ctx.request.action}</div>
                <div>parameters: ${JSON.stringify(parseParams(ctx.request.method, ctx.request.action, ctx.request.body))}</div>
                <div>headers: ${JSON.stringify(hxHeaders)}</div>
                <div><b>Response</b><pre class="language-html"><code class="language-html">${escapeHtml(ctx.text || '')}</code></pre></div>
            </span>`
        );
        document.getElementById("request-count").innerText = ": " + requestId;
    });
}

// Set up tracking when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupActivityTracking);
} else {
    setupActivityTracking();
}

function showTimelineEntry(id) {
    document.querySelectorAll("#demo-current-request > div").forEach(el => el.classList.toggle('hide', el.id !== id));
    document.querySelectorAll("#demo-timeline > li").forEach(el => el.classList.toggle('active', el.id === id + "-link"));
}

function pushActivityChip(name, id, content) {
    if (content.length > 750) content = content.substr(0, 750) + "...";
    document.getElementById("demo-timeline").insertAdjacentHTML("afterbegin", `<li id="${id}-link"><a onclick="showTimelineEntry('${id}')" style="cursor: pointer">${name}</a></li>`);
    document.getElementById("demo-current-request").insertAdjacentHTML("afterbegin", `<div id="${id}">${content}</div>`);
    showTimelineEntry(id);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
