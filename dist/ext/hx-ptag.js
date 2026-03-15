//==========================================================
// hx-ptag.js
//
// An extension for per-element polling tags (ptags) that
// allow servers to skip swaps when content hasn't changed.
//
// Usage:
//   <div hx-get="/news" hx-trigger="every 3s" hx-ptag="initial-value">
//     Latest News...
//   </div>
//
// The server responds with an HX-PTag header. On subsequent
// requests, the stored ptag is sent as an HX-PTag request
// header. If nothing changed, the server returns 304.
//==========================================================
(() => {
    let api;
    htmx.registerExtension('ptag', {
        init(internalAPI) { api = internalAPI },

        htmx_after_init(elt) {
            let ptag = api.attributeValue(elt, "hx-ptag");
            if (ptag) api.htmxProp(elt).ptag = ptag;
        },

        htmx_config_request(elt, {ctx}) {
            let ptag = elt._htmx?.ptag;
            if (ptag) ctx.request.headers["HX-PTag"] = ptag;
        },

        htmx_after_request(elt, {ctx}) {
            let ptag = ctx.response?.headers?.get?.("HX-PTag");
            if (ptag) api.htmxProp(elt).ptag = ptag;
        }
    });
})();
