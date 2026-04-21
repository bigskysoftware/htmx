const http = require('http');
const fs = require('fs').promises;

const routes = {
    '/': (req, res) => {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(`<!DOCTYPE html>
<html>
<head>
    <title>hx-download demo</title>
    <script src="/htmx.js"></script>
    <script src="/ext/hx-download.js"></script>
    <style>
        body { font-family: system-ui; max-width: 600px; margin: 40px auto; padding: 0 20px; }
        button { padding: 8px 16px; cursor: pointer; font-size: 14px; }
        progress { width: 100%; height: 24px; margin: 12px 0; }
        #status { color: #666; font-size: 14px; min-height: 20px; }
    </style>
</head>
<body>
    <h2>hx-swap="download" demo</h2>

    <button hx-get="/small-file" hx-swap="download" hx-ext="download">
        Small file (instant)
    </button>

    <button hx-get="/large-file" hx-swap="download" hx-ext="download">
        Large file (slow, with progress)
    </button>

    <progress id="prog" value="0" max="100"></progress>
    <div id="status"></div>

    <script>
        let status = document.getElementById("status");
        let prog = document.getElementById("prog");

        document.body.addEventListener("htmx:download:start", e => {
            prog.value = 0;
            let total = e.detail.total;
            status.textContent = total
                ? "Downloading " + (total / 1024).toFixed(0) + " KB..."
                : "Downloading...";
        });

        document.body.addEventListener("htmx:download:progress", e => {
            if (e.detail.percent != null) prog.value = e.detail.percent;
        });

        document.body.addEventListener("htmx:download:complete", e => {
            prog.value = 100;
            status.textContent = "Saved " + e.detail.filename + " (" + (e.detail.size / 1024).toFixed(0) + " KB)";
        });
    </script>
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

    // Small file — downloads instantly
    '/small-file': (req, res) => {
        let body = 'Hello from hx-download!\n';
        res.writeHead(200, {
            'Content-Type': 'text/plain',
            'Content-Length': Buffer.byteLength(body),
            'Content-Disposition': 'attachment; filename="hello.txt"'
        });
        res.end(body);
    },

    // Large file — streams slowly so you can see the progress bar
    '/large-file': (req, res) => {
        let chunkSize = 16 * 1024;  // 16 KB chunks
        let totalChunks = 32;       // 512 KB total
        let total = chunkSize * totalChunks;

        res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Length': total,
            'Content-Disposition': 'attachment; filename="test-data.bin"'
        });

        let sent = 0;
        let interval = setInterval(() => {
            let chunk = Buffer.alloc(chunkSize, 0x42);  // fill with 'B'
            res.write(chunk);
            sent += chunkSize;
            if (sent >= total) {
                clearInterval(interval);
                res.end();
            }
        }, 100);

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
