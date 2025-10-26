const http = require('http');
const fs = require('fs').promises;

const routes = {
    '/': async (req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(await fs.readFile('test/manual/index.html'));
    },

    '/htmx.js': async (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(await fs.readFile('src/htmx.js'));
    },

    '/sse': (req, res) => {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        let count = 0;
        const interval = setInterval(() => {
            res.write(`data: <partial hx-target="#target" hx-swap="beforeend"><div><strong>${++count}.</strong> ${new Date().toLocaleTimeString()}</div></partial>\n\n`);
        }, 250);

        req.on('close', () => clearInterval(interval));
    }
};

http.createServer(async (req, res) => {
    const path = new URL(req.url, 'http://localhost').pathname;
    const handler = routes[path];

    if (handler) {
        try {
            await handler(req, res);
        } catch (err) {
            res.writeHead(500);
            res.end('Server Error');
        }
    } else {
        res.writeHead(404);
        res.end('404 Not Found');
    }
}).listen(3000, () => console.log('http://localhost:3000'));
