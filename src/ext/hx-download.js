//==========================================================
// hx-download.js
//
// An extension that adds a 'download' swap style which
// triggers a file download instead of a DOM swap, with
// streaming progress events for progress bars.
//
// Usage:
//   <button hx-get="/file.pdf" hx-swap="download"
//           hx-ext="download">Download</button>
//
// Events:
//   htmx:download:start    {total}
//   htmx:download:progress {loaded, total, percent}
//   htmx:download:complete {filename, size}
//==========================================================
(() => {
    htmx.registerExtension('download', {
        htmx_before_request: (elt, {ctx}) => {
            if (ctx.swap !== 'download') return;
            let originalFetch = ctx.fetch;
            ctx.fetch = async (url, options) => {
                let response = await originalFetch(url, options);
                let total = +response.headers.get('Content-Length') || null;
                htmx.trigger(ctx.sourceElement, 'htmx:download:start', {total});

                let reader = response.body.getReader();
                let chunks = [], loaded = 0;
                while (true) {
                    let {done, value} = await reader.read();
                    if (done) break;
                    chunks.push(value);
                    loaded += value.length;
                    htmx.trigger(ctx.sourceElement, 'htmx:download:progress', {
                        loaded, total,
                        percent: total ? Math.round(loaded / total * 100) : null
                    });
                }

                ctx.download = {
                    blob: new Blob(chunks, {
                        type: response.headers.get('Content-Type') || 'application/octet-stream'
                    }),
                    filename: parseFilename(response.headers, url)
                };
                return new Response('', {status: response.status, headers: response.headers});
            };
        },

        htmx_before_swap: (elt, {ctx}) => {
            if (!ctx.download) return;
            let {blob, filename} = ctx.download;
            let url = URL.createObjectURL(blob);
            let a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            htmx.trigger(ctx.sourceElement, 'htmx:download:complete', {filename, size: blob.size});
            return false;
        }
    });

    function parseFilename(headers, url) {
        let cd = headers.get('Content-Disposition');
        if (cd) {
            let match = cd.match(/filename\*?=['"]?(?:UTF-8'')?([^'";]+)/i);
            if (match) return decodeURIComponent(match[1]);
        }
        return url.split('/').pop().split('?')[0] || 'download';
    }
})();
