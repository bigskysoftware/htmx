//====================================
// Fetch Mock Server
//====================================

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

    const response = new Response(body, { status: 200, headers });
    response.mockBody = body; // Store for later access

    return response;
};

function parseParams(method, url, body) {
    const parse = str => {
        const params = {};
        str?.replace(/([^&=]+)=([^&]*)/g, (_, k, v) => params[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' ')));
        return Object.keys(params).length > 0 ? params : null;
    };

    if (method === "GET") return parse(url.split('?')[1]);
    if (typeof body === 'string') return parse(body);
    if (body instanceof URLSearchParams || body instanceof FormData) {
        const params = {};
        for (const [k, v] of body.entries()) if (typeof v === 'string') params[k] = v;
        return Object.keys(params).length > 0 ? params : null;
    }
    return null;
}


function params(request) { return parseParams(request.method, request.url, request.body); }
function headers(request) {
    const hx = {};
    for (const [k, v] of Object.entries(request.headers || {})) if (k.toLowerCase().startsWith('hx-')) hx[k] = v;
    return hx;
}