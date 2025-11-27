const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Create HTTP server for serving static files
const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    
    // Map URLs to actual file paths
    const urlMap = {
        '/': './test/manual/ws.html',
        '/dist/htmx.js': './dist/htmx.js',
        '/src/ext/hx-ws.js': './src/ext/hx-ws.js',
        '/test/manual/ws.html': './test/manual/ws.html',
    };

    if (urlMap[req.url]) {
        filePath = urlMap[req.url];
    }
    
    console.log(`[${new Date().toISOString()}] HTTP ${req.method} ${req.url} -> ${filePath}`);

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found: ' + filePath);
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Create WebSocket server
const wss = new WebSocket.Server({ server, clientTracking: true });

// Shared state
let counter = 0;
const stocks = {
    HTMX: 142.50,
    AJAX: 98.30,
    REST: 67.80,
    GRPC: 112.40
};

// Broadcast to all connected clients
function broadcast(channel, data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client.channel === channel) {
            client.send(JSON.stringify(data));
        }
    });
}

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
    const url = req.url;
    console.log(`[${new Date().toISOString()}] New connection: ${url}`);
    
    // Determine channel from URL
    ws.channel = url.replace('/', '');
    
    // Handle different channels
    switch (ws.channel) {
        case 'chat':
            handleChatConnection(ws);
            break;
        case 'notifications':
            handleNotificationsConnection(ws);
            break;
        case 'counter':
            handleCounterConnection(ws);
            break;
        case 'ticker':
            handleTickerConnection(ws);
            break;
        case 'dashboard':
            handleDashboardConnection(ws);
            break;
        default:
            console.log(`Unknown channel: ${ws.channel}`);
    }

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(ws, data);
        } catch (e) {
            console.error('Error parsing message:', e);
        }
    });

    ws.on('close', () => {
        console.log(`[${new Date().toISOString()}] Connection closed: ${ws.channel}`);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Chat handler
function handleChatConnection(ws) {
    // Send welcome message (no hx-partial, let hx-swap handle it)
    ws.send(JSON.stringify({
        payload: '<div class="message received"><div>👋 Welcome to the chat!</div><div class="message-time">' + new Date().toLocaleTimeString() + '</div></div>'
    }));
}

// Notifications handler
let notificationInterval;
function handleNotificationsConnection(ws) {
    const notifications = [
        '📦 Package delivered',
        '👤 New follower',
        '💬 New comment on your post',
        '⭐ Someone starred your repository',
        '📧 You have new email',
        '🔔 Reminder: Meeting in 5 minutes',
        '✅ Build successful',
        '❌ Test failed',
    ];

    // Send a notification every 5-8 seconds
    const sendNotification = () => {
        const notification = notifications[Math.floor(Math.random() * notifications.length)];
        // No hx-partial - let hx-swap="afterbegin" handle it
        const html = `<div class="notification">${notification}<div class="notification-time">${new Date().toLocaleTimeString()}</div></div>`;
        
        broadcast('notifications', {
            payload: html
        });

        setTimeout(sendNotification, 5000 + Math.random() * 3000);
    };

    setTimeout(sendNotification, 3000);
}

// Counter handler
function handleCounterConnection(ws) {
    // Send current counter value
    ws.send(JSON.stringify({
        payload: `<hx-partial id="counter">${counter}</hx-partial>`
    }));
}

// Ticker handler
function handleTickerConnection(ws) {
    // Send initial stock prices
    const html = Object.entries(stocks).map(([symbol, price]) => 
        `<div class="ticker-item">
            <span class="ticker-symbol">${symbol}</span>
            <span class="ticker-price">$${price.toFixed(2)}</span>
            <span class="ticker-change up">+0.00%</span>
        </div>`
    ).join('');
    
    ws.send(JSON.stringify({
        payload: `<hx-partial id="ticker">${html}</hx-partial>`
    }));

    // Update prices every 2-3 seconds
    const updatePrices = () => {
        Object.keys(stocks).forEach(symbol => {
            const change = (Math.random() - 0.5) * 5;
            stocks[symbol] = Math.max(10, stocks[symbol] + change);
        });

        const html = Object.entries(stocks).map(([symbol, price]) => {
            const change = ((Math.random() - 0.5) * 5);
            const changePercent = (change / price * 100).toFixed(2);
            const changeClass = change >= 0 ? 'up' : 'down';
            const changeSign = change >= 0 ? '+' : '';
            
            return `<div class="ticker-item">
                <span class="ticker-symbol">${symbol}</span>
                <span class="ticker-price">$${price.toFixed(2)}</span>
                <span class="ticker-change ${changeClass}">${changeSign}${changePercent}%</span>
            </div>`;
        }).join('');

        broadcast('ticker', {
            payload: `<hx-partial id="ticker">${html}</hx-partial>`
        });

        setTimeout(updatePrices, 2000 + Math.random() * 1000);
    };

    setTimeout(updatePrices, 2000);
}

// Dashboard handler
function handleDashboardConnection(ws) {
    // Update system stats every second
    const updateStats = () => {
        const cpu = Math.floor(Math.random() * 100);
        const memory = Math.floor(Math.random() * 100);
        const disk = Math.floor(Math.random() * 100);

        broadcast('dashboard', {
            payload: `
                <hx-partial id="cpu">CPU: ${cpu}%</hx-partial>
                <hx-partial id="memory">Memory: ${memory}%</hx-partial>
                <hx-partial id="disk">Disk: ${disk}%</hx-partial>
            `
        });

        setTimeout(updateStats, 1000);
    };

    setTimeout(updateStats, 1000);
}

// Handle incoming messages
function handleMessage(ws, data) {
    console.log(`[${new Date().toISOString()}] Message from ${ws.channel}:`, data);

    if (ws.channel === 'chat') {
        // Broadcast chat message
        if (data.values && data.values.message) {
            const message = data.values.message;
            // Don't use hx-partial - just send raw HTML and let hx-swap="beforeend" handle it
            const html = `<div class="message sent"><div>${escapeHtml(message)}</div><div class="message-time">${new Date().toLocaleTimeString()}</div></div>`;
            
            // Echo back to sender
            ws.send(JSON.stringify({
                payload: html,
                request_id: data.request_id
            }));

            // Simulate bot response after 1 second
            setTimeout(() => {
                const responses = [
                    'That\'s interesting! 🤔',
                    'Tell me more! 💭',
                    'I agree! 👍',
                    'Awesome! 🎉',
                    'Really? 😮',
                    'Nice! ✨'
                ];
                const botResponse = responses[Math.floor(Math.random() * responses.length)];
                // Don't use hx-partial - let hx-swap handle it
                const botHtml = `<div class="message received"><div>🤖 ${botResponse}</div><div class="message-time">${new Date().toLocaleTimeString()}</div></div>`;
                
                broadcast('chat', {
                    payload: botHtml
                });
            }, 1000);
        }
    } else if (ws.channel === 'counter') {
        // Handle counter actions
        const action = data.values?.action || data.action;
        
        if (action === 'increment') {
            counter++;
        } else if (action === 'decrement') {
            counter--;
        } else if (action === 'reset') {
            counter = 0;
        }

        // Broadcast new counter value to all clients
        broadcast('counter', {
            payload: `<hx-partial id="counter">${counter}</hx-partial>`,
            request_id: data.request_id
        });
    }
}

// Utility function to escape HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Start server
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 HTMX WebSocket Demo Server                          ║
║                                                           ║
║   HTTP Server: http://localhost:${PORT}                       ║
║   WebSocket Server: ws://localhost:${PORT}                    ║
║                                                           ║
║   Open http://localhost:${PORT} in your browser              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
});

