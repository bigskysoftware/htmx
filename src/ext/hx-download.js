//==========================================================
// hx-download.js
//
// An extension that triggers a file download instead of a
// DOM swap, with streaming progress events for progress bars.
//
// Activates when:
//   - hx-swap="download" is set on the element
//   - server responds with Content-Disposition: attachment
//   - server responds with HX-Download: <url> (fetches that
//     url as the download, useful when the backend cannot
//     stream the file directly as the htmx response)
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
    let api;

    htmx.registerExtension('download', {
        init: (internalAPI) => {
            api = internalAPI;
        },
        htmx_before_response: (elt, {ctx}) => {
            let downloadUrl = ctx.response.headers.get('HX-Download');
            if (downloadUrl) {
                (async () => streamDownload(ctx.sourceElement, await fetch(downloadUrl), downloadUrl))();
                return;
            }
            let cd = ctx.response.headers.get('Content-Disposition');
            if (ctx.swap !== 'download' && !cd?.includes('attachment')) return;
            streamDownload(ctx.sourceElement, ctx.response.raw, ctx.request.action);
            return false;
        }
    });

    function streamDownload(sourceElement, response, url) {
        (async () => {
            let total = +response.headers.get('Content-Length') || null;
            api.triggerHtmxEvent(sourceElement, 'htmx:download:start', {total});
            let reader = response.body.getReader();
            let chunks = [], loaded = 0;
            while (true) {
                let {done, value} = await reader.read();
                if (done) break;
                chunks.push(value);
                loaded += value.length;
                api.triggerHtmxEvent(sourceElement, 'htmx:download:progress', {
                    loaded, total,
                    percent: total ? Math.round(loaded / total * 100) : null
                });
            }
            let blob = new Blob(chunks, {
                type: response.headers.get('Content-Type') || 'application/octet-stream'
            });
            let filename = parseFilename(response.headers, url);
            let blobUrl = URL.createObjectURL(blob);
            Object.assign(document.createElement('a'), {href: blobUrl, download: filename}).click();
            URL.revokeObjectURL(blobUrl);
            api.triggerHtmxEvent(sourceElement, 'htmx:download:complete', {filename, size: blob.size});
        })();
    }

    function parseFilename(headers, url) {
        let cd = headers.get('Content-Disposition');
        if (cd) {
            let match = cd.match(/filename\*?=['"]?(?:UTF-8'')?([^'";]+)/i);
            if (match) return decodeURIComponent(match[1]);
        }
        return url.split('/').pop().split('?')[0] || 'download';
    }
})();
