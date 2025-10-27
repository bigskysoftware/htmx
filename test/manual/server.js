const http = require('http');
const fs = require('fs').promises;

const routes = {
    '/': async (req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(await fs.readFile('test/manual/sse.html'));
    },

    '/htmx.js': async (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(await fs.readFile('src/htmx.js'));
    },

    '/matrix-stream': (req, res) => {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        const fullText = "Wake up, Neo... The Matrix has you.";
        let index = 0;

        const typeChar = () => {
            if (index < fullText.length) {
                index++;
                res.write(`data: <div class="matrix-text">${fullText.slice(0, index)}</div>\n\n`);

                if (index === 16) {
                    // Pause after "Wake up, Neo..."
                    setTimeout(typeChar, 250);
                } else {
                    setTimeout(typeChar, 20 + Math.random() * 20);
                }
            } else {
                // Pause before deleting
                setTimeout(() => {
                    const deleteChar = () => {
                        if (index > 0) {
                            index--;
                            res.write(`data: <div class="matrix-text">${fullText.slice(0, index)}</div>\n\n`);
                            setTimeout(deleteChar, 20);
                        } else {
                            res.write(`data: <div>‎</div>\n\n`);
                            res.end();
                        }
                    };
                    deleteChar();
                }, 750);
            }
        };

        typeChar();
        req.on('close', () => {});
    },

    // TODO: re-implement with <htmx-action>
    // '/events': (req, res) => {
    //     res.writeHead(200, {
    //         'Content-Type': 'text/event-stream',
    //         'Cache-Control': 'no-cache',
    //         'Connection': 'keep-alive'
    //     });
    //
    //     const activities = ['👤 User joined', '📁 File uploaded', '💬 Comment added', '✓ Task completed', '📨 Message sent'];
    //     const statuses = ['Paused', 'Active', 'Overdrive'];
    //     let status = 'Active';
    //     let statusChangeTimer = Date.now() + 2000;
    //
    //     // Send .events-active class
    //     res.write(`data: <partial hx-target="#events-output" hx-swap="beforeend"><div class="events-active"></div></partial>\n\n`);
    //
    //     // Send initial status
    //     res.write(`data: <partial hx-target="#system-status" hx-swap="innerHTML">${status}</partial>\n\n`);
    //
    //     const send = () => {
    //         const now = Date.now();
    //
    //         // Change status every 2 seconds
    //         if (now >= statusChangeTimer) {
    //             const available = statuses.filter(s => s !== status);
    //             status = available[Math.floor(Math.random() * available.length)];
    //             res.write(`data: <partial hx-target="#system-status" hx-swap="innerHTML">${status}</partial>\n\n`);
    //             statusChangeTimer = now + 2000;
    //         }
    //
    //         if (status === 'Paused') return setTimeout(send, 100);
    //
    //         const delay = status === 'Overdrive' ? 100 : 500;
    //
    //         res.write(`data: <partial hx-target="#activity" hx-swap="beforeend"><div>${activities[Math.floor(Math.random() * activities.length)]}</div></partial>\n\n`);
    //
    //         setTimeout(send, delay);
    //     };
    //
    //     send();
    //     req.on('close', () => {});
    // }
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
