const http = require('http');
const fs = require('fs').promises;

const serve = (file, type = 'text/html') => async (req, res) => {
    res.writeHead(200, { 'Content-Type': type });
    res.end(await fs.readFile(file));
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
    '/':               serve('test/manual/index.html'),
    '/sse':            serve('test/manual/sse.html'),
    '/ios-sse':        serve('test/manual/ios-sse.html'),
    '/htmx.js':        serve('src/htmx.js', 'application/javascript'),

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
            res.writeHead(500);
            res.end('Server Error');
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
