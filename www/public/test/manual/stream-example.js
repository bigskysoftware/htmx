const http = require('http');
const fs = require('fs').promises;

const routes = {
    '/': (req, res) => {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(`<!DOCTYPE html>
<html>
<head>
    <title>hx-stream demo</title>
    <script src="/htmx.js"></script>
    <script src="/ext/hx-stream.js"></script>
    <style>
        body { font-family: system-ui; max-width: 600px; margin: 40px auto; padding: 0 20px; }
        button { padding: 8px 16px; cursor: pointer; font-size: 14px; }
        #output { border: 1px solid #ddd; border-radius: 4px; padding: 16px; min-height: 100px;
                   margin: 12px 0; white-space: pre-wrap; line-height: 1.6; }
        #status { color: #666; font-size: 14px; min-height: 20px; }
    </style>
</head>
<body>
    <h2>hx-swap="stream" demo</h2>

    <button hx-get="/ai-response" hx-swap="stream" hx-target="#output" hx-ext="stream">
        Generate AI response
    </button>

    <button hx-get="/html-stream" hx-swap="stream" hx-target="#output" hx-ext="stream">
        Stream HTML fragments
    </button>

    <div id="output"></div>
    <div id="status"></div>

    <script>
        let status = document.getElementById("status");

        document.body.addEventListener("htmx:stream:start", () => {
            status.textContent = "Streaming...";
        });

        document.body.addEventListener("htmx:stream:end", e => {
            status.textContent = "Done (" + e.detail.loaded + " bytes)";
        });
    </script>
</body>
</html>`);
    },

    '/htmx.js': async (req, res) => {
        res.writeHead(200, {'Content-Type': 'application/javascript'});
        res.end(await fs.readFile('src/htmx.js'));
    },

    '/ext/hx-stream.js': async (req, res) => {
        res.writeHead(200, {'Content-Type': 'application/javascript'});
        res.end(await fs.readFile('src/ext/hx-stream.js'));
    },

    // Simulates an LLM streaming plain text word-by-word
    '/ai-response': (req, res) => {
        res.writeHead(200, {'Content-Type': 'text/html'});
        let words = `The key insight behind hypermedia-driven applications is that the server sends HTML, not JSON. This means the server controls the presentation layer, and the client simply renders what it receives. This approach dramatically simplifies the client-side code, eliminates an entire class of state synchronization bugs, and lets you build rich interactive applications with remarkably little JavaScript.`.split(' ');
        let i = 0;
        let interval = setInterval(() => {
            if (i < words.length) {
                res.write((i > 0 ? ' ' : '') + words[i]);
                i++;
            } else {
                clearInterval(interval);
                res.end();
            }
        }, 50);
        req.on('close', () => clearInterval(interval));
    },

    // Streams complete HTML fragments
    '/html-stream': (req, res) => {
        res.writeHead(200, {'Content-Type': 'text/html'});
        let items = [
            '<p><strong>Step 1:</strong> Connecting to server...</p>',
            '<p><strong>Step 2:</strong> Authenticating...</p>',
            '<p><strong>Step 3:</strong> Fetching data...</p>',
            '<p><strong>Step 4:</strong> Processing results...</p>',
            '<p style="color: green"><strong>Done!</strong> All steps completed.</p>'
        ];
        let i = 0;
        let interval = setInterval(() => {
            if (i < items.length) {
                res.write(items[i]);
                i++;
            } else {
                clearInterval(interval);
                res.end();
            }
        }, 500);
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
}).listen(3002, () => console.log('http://localhost:3002'));
