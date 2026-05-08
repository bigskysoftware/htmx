const http = require('http');
const fs = require('fs').promises;

const routes = {
    '/': (req, res) => {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(`<!DOCTYPE html>
<html>
<head>
    <title>hx-download demo</title>
    <meta name="htmx-config" content='{"extensions":"download"}'>
    <script src="/htmx.js"></script>
    <script src="/ext/hx-download.js"></script>
    <style>
        body { font-family: system-ui; max-width: 700px; margin: 40px auto; padding: 0 20px; }
        h2 { margin-top: 2em; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
        button { padding: 8px 16px; cursor: pointer; font-size: 14px; margin-right: 8px; }
        progress { width: 100%; height: 20px; margin: 8px 0; }
        .status { color: #555; font-size: 13px; min-height: 18px; margin-bottom: 8px; }
        #swap-result { border: 1px solid #ccc; padding: 8px; min-height: 2em; margin-top: 8px; color: #333; }
        .htmx-indicator { display: none; }
        .htmx-request .htmx-indicator, .htmx-request.htmx-indicator { display: inline; }
    </style>
</head>
<body hx-ext="download">
    <h1>hx-download demo</h1>

    <progress id="prog" value="0" max="100"></progress>
    <div class="status" id="status">—</div>

    <script>
        let prog = document.getElementById('prog');
        let status = document.getElementById('status');
        document.body.addEventListener('htmx:download:start', e => {
            prog.value = 0;
            status.textContent = 'start — total: ' + (e.detail.total ?? 'unknown');
        });
        document.body.addEventListener('htmx:download:progress', e => {
            if (e.detail.percent != null) prog.value = e.detail.percent;
            status.textContent = 'progress — ' + e.detail.loaded + ' bytes'
                + (e.detail.percent != null ? ' (' + e.detail.percent + '%)' : ' (no Content-Length)');
        });
        document.body.addEventListener('htmx:download:complete', e => {
            prog.value = 100;
            status.textContent = 'complete — ' + e.detail.filename + ' (' + e.detail.size + ' bytes)';
        });
    </script>

    <h2>1. hx-swap="download" (explicit)</h2>
    <p>Expected: downloads <code>hello.txt</code></p>
    <button hx-get="/small-file" hx-swap="download">Small file (instant)</button>

    <h2>2. Large file with progress</h2>
    <p>Expected: progress bar fills over ~3s, downloads <code>large.bin</code></p>
    <button hx-get="/large-file" hx-swap="download">Large file (slow, with progress)</button>

    <h2>3. Content-Disposition: attachment auto-detect</h2>
    <p>Expected: downloads <code>auto.txt</code> with no <code>hx-swap</code> needed on the element</p>
    <button hx-get="/auto-detect" hx-target="#swap-result">Download (auto-detect)</button>

    <h2>4. HX-Download header — download + swap</h2>
    <p>Expected: downloads <code>redirected.txt</code> AND swaps HTML into the box below</p>
    <button hx-get="/hx-download-header" hx-target="#swap-result">Download + swap (HX-Download)</button>
    <div id="swap-result">swap target (should update on test 4)</div>

    <h2>5. UTF-8 filename (filename*=UTF-8''...)</h2>
    <p>Expected: downloads <code>café report.txt</code></p>
    <button hx-get="/utf8-filename" hx-swap="download">UTF-8 filename</button>

    <h2>6. No Content-Length header</h2>
    <p>Expected: downloads <code>unknown-size.txt</code>, progress shows bytes but no percent</p>
    <button hx-get="/no-content-length" hx-swap="download">No Content-Length</button>

    <h2>7. Indicators cleared after download</h2>
    <p>Expected: spinner visible during download, hidden after — button re-enabled</p>
    <button id="ind-btn"
            hx-get="/large-file"
            hx-swap="download"
            hx-indicator="#spinner"
            hx-disabled-elt="#ind-btn">
        Download with indicator <span id="spinner" class="htmx-indicator">⏳ loading...</span>
    </button>
</body>
</html>`);
    },

    '/htmx.js': async (req, res) => {
        res.writeHead(200, {'Content-Type': 'application/javascript'});
        res.end(await fs.readFile('src/htmx.js'));
    },

    '/ext/hx-download.js': async (req, res) => {
        res.writeHead(200, {'Content-Type': 'application/javascript'});
        res.end(await fs.readFile('src/ext/hx-download.js'));
    },

    // 1. Small file — downloads instantly via hx-swap="download"
    '/small-file': (req, res) => {
        let body = 'Hello from hx-download!\n';
        res.writeHead(200, {
            'Content-Type': 'text/plain',
            'Content-Length': Buffer.byteLength(body),
            'Content-Disposition': 'attachment; filename="hello.txt"'
        });
        res.end(body);
    },

    // 2. Large file — streams slowly so progress bar is visible
    '/large-file': (req, res) => {
        let chunkSize = 16 * 1024;
        let totalChunks = 32;
        let total = chunkSize * totalChunks;
        res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Length': total,
            'Content-Disposition': 'attachment; filename="large.bin"'
        });
        let sent = 0;
        let interval = setInterval(() => {
            res.write(Buffer.alloc(chunkSize, 0x42));
            sent += chunkSize;
            if (sent >= total) { clearInterval(interval); res.end(); }
        }, 100);
        req.on('close', () => clearInterval(interval));
    },

    // 3. Auto-detect via Content-Disposition: attachment, no hx-swap needed
    '/auto-detect': (req, res) => {
        let body = 'auto-detected download\n';
        res.writeHead(200, {
            'Content-Type': 'text/plain',
            'Content-Length': Buffer.byteLength(body),
            'Content-Disposition': 'attachment; filename="auto.txt"'
        });
        res.end(body);
    },

    // 4a. HX-Download header — also returns HTML for the swap
    '/hx-download-header': (req, res) => {
        let body = '<em>swap also happened!</em>';
        res.writeHead(200, {
            'Content-Type': 'text/html',
            'Content-Length': Buffer.byteLength(body),
            'HX-Download': '/hx-download-target'
        });
        res.end(body);
    },

    // 4b. The actual file fetched by the extension via HX-Download
    '/hx-download-target': (req, res) => {
        let body = 'redirected download content\n';
        res.writeHead(200, {
            'Content-Type': 'text/plain',
            'Content-Length': Buffer.byteLength(body),
            'Content-Disposition': 'attachment; filename="redirected.txt"'
        });
        res.end(body);
    },

    // 5. UTF-8 encoded filename via filename*=UTF-8''
    '/utf8-filename': (req, res) => {
        let body = 'unicode filename test\n';
        res.writeHead(200, {
            'Content-Type': 'text/plain',
            'Content-Length': Buffer.byteLength(body),
            'Content-Disposition': "attachment; filename*=UTF-8''caf%C3%A9%20report.txt"
        });
        res.end(body);
    },

    // 6. No Content-Length — percent should be null in progress events
    '/no-content-length': (req, res) => {
        let chunks = ['no ', 'content-', 'length\n'].map(s => Buffer.from(s));
        res.writeHead(200, {
            'Content-Type': 'text/plain',
            'Content-Disposition': 'attachment; filename="unknown-size.txt"'
        });
        let i = 0;
        let interval = setInterval(() => {
            res.write(chunks[i++]);
            if (i >= chunks.length) { clearInterval(interval); res.end(); }
        }, 200);
        req.on('close', () => clearInterval(interval));
    }
};

http.createServer(async (req, res) => {
    let pathname = new URL(req.url, 'http://localhost').pathname;
    let handler = routes[pathname];
    if (handler) {
        try { await handler(req, res); }
        catch (e) { if (!res.headersSent) { res.writeHead(500); res.end('Error'); } }
    } else {
        res.writeHead(404); res.end('Not Found');
    }
}).listen(3001, () => console.log('http://localhost:3001'));
