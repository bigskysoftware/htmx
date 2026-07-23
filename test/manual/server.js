const http = require('http');
const fs = require('fs').promises;

const serve = (file, type = 'text/html') => async (req, res) => {
    try {
        const content = await fs.readFile(file);
        res.writeHead(200, { 'Content-Type': type });
        res.end(content);
    } catch (err) {
        res.writeHead(404);
        res.end('Not Found');
    }
};

const sse = (handler) => (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    handler(req, res);
};

const routes = {
    '/':               (req, res) => { res.writeHead(302, {'Location': '/sse'}); res.end(); },
    '/sse':            serve('test/manual/sse.html'),
    '/ios-sse':        serve('test/manual/ios-sse.html'),
    '/htmx.js':        serve('src/htmx.js', 'application/javascript'),
    '/ext/hx-sse.js':  serve('src/ext/hx-sse.js', 'application/javascript'),
    '/htmax.js':       serve('dist/htmax.js', 'application/javascript'),
    '/htmax':          serve('test/manual/htmax.html'),

    // htmax test endpoints
    '/htmax/clicked':       (req, res) => { res.writeHead(200, {'Content-Type': 'text/html'}); res.end('<span class="text-green-600 font-semibold">✓ SSE extension loaded (hx-sse registered)</span>'); },
    '/htmax/ws-status':     (req, res) => { res.writeHead(200, {'Content-Type': 'text/html'}); res.end('<span class="text-green-600 font-semibold">✓ WS extension loaded (hx-ws registered)</span>'); },
    '/htmax/preload-target':(req, res) => { res.writeHead(200, {'Content-Type': 'text/html'}); res.end('<span class="text-green-600 font-semibold">✓ Preloaded and swapped!</span>'); },
    '/htmax/download':      (req, res) => { res.writeHead(200, {'Content-Type': 'text/plain', 'Content-Disposition': 'attachment; filename="htmax-test.txt"'}); res.end('htmax download test'); },
    '/htmax/optimistic':    (req, res) => { setTimeout(() => { res.writeHead(200, {'Content-Type': 'text/html'}); res.end('<span class="text-green-600 font-semibold">✓ Server confirmed</span>'); }, 1500); },
    '/htmax/targets':       (req, res) => { res.writeHead(200, {'Content-Type': 'text/html'}); res.end('<span class="text-green-600 font-semibold">✓ hx-targets swapped both elements</span>'); },
    '/htmax/upsert':        (req, res) => { res.writeHead(200, {'Content-Type': 'text/html'}); res.end('<template hx type="upsert" hx-target="#upsert-list"><div id="item-1" class="p-2 bg-green-100 rounded">Item 1 (updated)</div><div id="item-3" class="p-2 bg-blue-100 rounded">Item 3 (new)</div></template>'); },
    '/htmax/page2':         (req, res) => { res.writeHead(200, {'Content-Type': 'text/html'}); res.end('<div id="history-content" hx-push-url="/htmax/page2"><p>Page 2 content — hit back to test history cache restore.</p><a hx-get="/htmax/page1" hx-target="#history-content" hx-push-url="/htmax/page1" href="/htmax/page1">Back to page 1</a></div>'); },
    '/htmax/page1':         (req, res) => { res.writeHead(200, {'Content-Type': 'text/html'}); res.end('<div id="history-content" hx-push-url="/htmax/page1"><p>Page 1 content — restored from cache!</p><a hx-get="/htmax/page2" hx-target="#history-content" hx-push-url="/htmax/page2" href="/htmax/page2">Go to page 2</a></div>'); },
    '/htmax/indicator':     (req, res) => { setTimeout(() => { res.writeHead(200, {'Content-Type': 'text/html'}); res.end('<span class="text-green-600 font-semibold">✓ Request complete</span>'); }, 1500); },
    '/htmax/live-count':    (req, res) => { res.writeHead(200, {'Content-Type': 'text/html'}); res.end('<span id="live-count">0</span>'); },

    '/htmax/sse-stream': sse((req, res) => {
        let n = 0;
        const send = () => {
            if (n++ < 5) {
                res.write(`data: <span>SSE message #${n}</span>\n\n`);
                setTimeout(send, 800);
            } else {
                res.write(`event: close\ndata: <span class="text-green-600 font-semibold">✓ Stream complete</span>\n\n`);
            }
        };
        send();
    }),

    '/htmax/ws': (req, res) => { res.writeHead(200, {'Content-Type': 'text/html'}); res.end('<span class="text-green-600 font-semibold">✓ WS extension present (full WS test requires ws-server.js)</span>'); },

    '/heartbeat': sse((req, res) => {
        let count = 0;
        const send = () => {
            count++;
            const time = new Date().toLocaleTimeString();
            res.write(`data: <div>#${count} - ${time}</div>\n\n`);
        };
        send();
        const interval = setInterval(send, 2000);
        req.on('close', () => clearInterval(interval));
    }),

    '/matrix-stream': sse((req, res) => {
        const fullText = "Wake up, Neo... The Matrix has you.";
        let index = 0;

        const typeChar = () => {
            if (index < fullText.length) {
                index++;
                res.write(`data: <div class="matrix-text">${fullText.slice(0, index)}</div>\n\n`);
                setTimeout(typeChar, index === 16 ? 250 : 20 + Math.random() * 20);
            } else {
                setTimeout(() => {
                    const deleteChar = () => {
                        if (index > 0) {
                            index--;
                            res.write(`data: <div class="matrix-text">${fullText.slice(0, index)}</div>\n\n`);
                            setTimeout(deleteChar, 20);
                        } else {
                            res.write(`data: <div>\u200E</div>\n\n`);
                            res.end();
                        }
                    };
                    deleteChar();
                }, 750);
            }
        };
        typeChar();
    }),

    '/events': sse((req, res) => {
        const activities = ['User joined', 'File uploaded', 'Comment added', 'Task completed', 'Message sent'];
        const statuses = ['Paused', 'Active', 'Overdrive'];
        let status = 'Active';
        let statusChangeTimer = Date.now() + 2000;

        res.write(`data: <hx-partial hx-target="#events-output" hx-swap="beforeend"><div class="events-active"></div></hx-partial>\n\n`);
        res.write(`data: <hx-partial hx-target="#system-status" hx-swap="innerHTML">${status}</hx-partial>\n\n`);

        const send = () => {
            const now = Date.now();
            if (now >= statusChangeTimer) {
                const available = statuses.filter(s => s !== status);
                status = available[Math.floor(Math.random() * available.length)];
                res.write(`data: <hx-partial hx-target="#system-status" hx-swap="innerHTML">${status}</hx-partial>\n\n`);
                statusChangeTimer = now + 2000;
            }

            if (status === 'Paused') return setTimeout(send, 100);

            const delay = status === 'Overdrive' ? 100 : 500;
            res.write(`data: <hx-partial hx-target="#activity" hx-swap="beforeend"><div>${activities[Math.floor(Math.random() * activities.length)]}</div></hx-partial>\n\n`);
            setTimeout(send, delay);
        };
        send();
    }),

    '/progress-stream': sse((req, res) => {
        let progress = 0;
        const update = () => {
            if (progress < 100) {
                progress += Math.floor(Math.random() * 5) + 5;
                if (progress > 100) progress = 100;
                res.write(`event: progress\ndata: ${progress}\n\n`);
                setTimeout(update, 50);
            } else {
                res.write(`event: done\ndata: complete\n\n`);
                res.end();
            }
        };
        update();
    })
};

http.createServer(async (req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const handler = routes[pathname];

    if (handler) {
        try {
            await handler(req, res);
        } catch (err) {
            if (!res.headersSent) {
                res.writeHead(500);
                res.end('Server Error');
            }
        }
    } else {
        res.writeHead(404);
        res.end('404 Not Found');
    }
}).listen(3000, '0.0.0.0', () => {
    const nets = require('os').networkInterfaces();
    const ip = Object.values(nets).flat().find(n => n.family === 'IPv4' && !n.internal)?.address;
    console.log('Local:   http://localhost:3000');
    if (ip) console.log(`Network: http://${ip}:3000`);
});
