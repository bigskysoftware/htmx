/**
 * hx-csp + Trusted Types CSP test server
 *
 * Usage:
 *   node test/manual/hx-csp/csp-server.js
 *
 * Modes (?csp= query param or csp-mode cookie):
 *
 *   permissive (default)       script-src 'unsafe-inline' 'unsafe-eval'
 *   nonce                      script-src 'nonce-X' 'unsafe-eval'
 *   nonce-no-eval              script-src 'nonce-X'
 *   nonce-no-eval-no-safeeval  script-src 'nonce-X', safeEval disabled
 *   trusted-types              nonce + require-trusted-types-for + trusted-types htmx
 *   trusted-types-no-eval      trusted-types, no unsafe-eval
 *   trusted-types-multi        trusted-types htmx my-app
 *   trusted-types-no-htmx      trusted-types my-app only — htmx policy blocked
 *   alpine-csp                 nonce, no unsafe-eval, Alpine CSP build from CDN
 *   alpine-csp-tt              alpine-csp + Trusted Types
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const HTMX_SRC       = path.join(__dirname, '..', '..', '..', 'src', 'htmx.js');
const HX_CSP_SRC     = path.join(__dirname, '..', '..', '..', 'src', 'ext', 'hx-csp.js');
const HX_ALPINE_SRC  = path.join(__dirname, '..', '..', '..', 'src', 'ext', 'hx-alpine-compat.js');

function makeNonce() {
    return crypto.randomBytes(16).toString('base64');
}

function makeCsp(mode, nonce) {
    const tt = `require-trusted-types-for 'script'; trusted-types htmx`;
    switch (mode) {
        case 'nonce':
            return `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'unsafe-eval'; style-src 'self' 'nonce-${nonce}';`;
        case 'nonce-no-eval':
        case 'nonce-no-eval-no-safeeval':
            return `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}';`;
        case 'trusted-types':
            return `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'unsafe-eval'; style-src 'self' 'nonce-${nonce}'; ${tt};`;
        case 'trusted-types-no-eval':
            return `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}'; ${tt};`;
        case 'trusted-types-multi':
            return `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'unsafe-eval'; style-src 'self' 'nonce-${nonce}'; require-trusted-types-for 'script'; trusted-types htmx my-app;`;
        case 'trusted-types-no-htmx':
            // 'htmx' not whitelisted — createPolicy('htmx') throws, all htmx blocked
            return `default-src 'self'; script-src 'self' 'nonce-${nonce}' 'unsafe-eval'; style-src 'self' 'nonce-${nonce}'; require-trusted-types-for 'script'; trusted-types my-app;`;
        case 'alpine-csp':
            // Alpine CSP build handles expressions without Function() — no unsafe-eval needed.
            // CDN allowed for Alpine CSP build.
            return `default-src 'self'; script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net; style-src 'self' 'nonce-${nonce}';`;
        case 'alpine-csp-tt':
            return `default-src 'self'; script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net; style-src 'self' 'nonce-${nonce}'; ${tt};`;
        default: // permissive
            return `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';`;
    }
}

// Replace __NONCE__ placeholder and stamp hx-nonce on hx- elements.
// Elements with data-no-nonce are intentionally left without hx-nonce for testing.
function stampNonce(html, nonce) {
    return html
        .replaceAll('__NONCE__', nonce)
        .replace(/(<[^>]+\shx-(?:get|post|put|patch|delete|boost|on)[^>]*)(>)/gi,
            (m, attrs, close) => (attrs.includes('hx-nonce') || attrs.includes('data-no-nonce')) ? m : `${attrs} hx-nonce="${nonce}"${close}`
        );
}

function readFile(filePath) {
    try { return fs.readFileSync(filePath, 'utf8'); } catch { return null; }
}

function partialHeaders(partialNonce) {
    return { 'Content-Type': 'text/html', 'Content-Security-Policy': `script-src 'nonce-${partialNonce}';` };
}

http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname;

    // Source files — no CSP needed
    if (pathname === '/htmx.js') {
        const content = readFile(HTMX_SRC);
        if (!content) { res.writeHead(404); res.end('htmx.js not found'); return; }
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(content);
        return;
    }
    if (pathname === '/ext/hx-csp.js') {
        const content = readFile(HX_CSP_SRC);
        if (!content) { res.writeHead(404); res.end('hx-csp.js not found'); return; }
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(content);
        return;
    }
    if (pathname === '/ext/hx-alpine-compat.js') {
        const content = readFile(HX_ALPINE_SRC);
        if (!content) { res.writeHead(404); res.end('hx-alpine-compat.js not found'); return; }
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(content);
        return;
    }

    // Fresh nonce per request
    const nonce = makeNonce();
    const cookieMode = (req.headers.cookie || '').match(/csp-mode=([^;]+)/)?.[1];
    const mode = url.searchParams.get('csp') || cookieMode || 'permissive';
    const csp = makeCsp(mode, nonce);

    const pageHeaders = {
        'Content-Type': 'text/html',
        'Content-Security-Policy': csp,
        'Set-Cookie': `csp-mode=${mode}; Path=/`,
        'X-CSP-Nonce': nonce,
    };

    // Script execution tests
    if (pathname === '/script-with-nonce') {
        const pn = makeNonce();
        res.writeHead(200, partialHeaders(pn));
        res.end(`<div hx-nonce="${pn}">
  <p>Nonced script — should execute (check console).</p>
  <script nonce="${pn}">console.log('script-with-nonce: executed \u2713');</script>
</div>`);
        return;
    }

    if (pathname === '/script-without-nonce') {
        const pn = makeNonce();
        res.writeHead(200, partialHeaders(pn));
        res.end(`<div hx-nonce="${pn}">
  <p>Unnnonced script — should be blocked by CSP (check console for violation, NOT execution).</p>
  <script>console.log('script-without-nonce: executed \u2717 \u2014 CSP should have blocked this');</script>
</div>`);
        return;
    }

    if (pathname === '/partial') {
        const pn = makeNonce();
        res.writeHead(200, partialHeaders(pn));
        res.end(`<div hx-nonce="${pn}">
  <p>Partial loaded at ${new Date().toLocaleTimeString()}</p>
  <button hx-get="/partial" hx-target="#result" hx-nonce="${pn}">Reload partial</button>
</div>`);
        return;
    }

    if (pathname === '/eval-partial') {
        const pn = makeNonce();
        res.writeHead(200, partialHeaders(pn));
        res.end(`<div hx-nonce="${pn}" hx-on:htmx:after:swap="console.log('hx-on fired from eval-partial')">
  <p>hx-on: loaded \u2014 check console for eval output</p>
</div>`);
        return;
    }

    if (pathname === '/alpine' || pathname === '/alpine.html') {
        const template = readFile(path.join(ROOT, 'alpine.html'));
        if (!template) { res.writeHead(404); res.end('alpine.html not found'); return; }
        res.writeHead(200, pageHeaders);
        res.end(stampNonce(template, nonce));
        return;
    }

    if (pathname === '/' || pathname === '/index.html') {
        const template = readFile(path.join(ROOT, 'index.html'));
        if (!template) { res.writeHead(404); res.end('index.html not found'); return; }
        let html = stampNonce(template, nonce);
        if (mode === 'nonce-no-eval-no-safeeval') {
            html = html.replace('extensions:"hx-csp",safeEval:true', 'extensions:"hx-csp"');
        }
        res.writeHead(200, pageHeaders);
        res.end(html);
        return;
    }

    res.writeHead(404);
    res.end('Not found');

}).listen(3002, () => {
    console.log('hx-csp CSP test server: http://localhost:3002\n');
    console.log('  permissive                 http://localhost:3002/?csp=permissive');
    console.log('  nonce                      http://localhost:3002/?csp=nonce');
    console.log('  nonce-no-eval              http://localhost:3002/?csp=nonce-no-eval');
    console.log('  nonce-no-eval-no-safeeval  http://localhost:3002/?csp=nonce-no-eval-no-safeeval');
    console.log('  trusted-types              http://localhost:3002/?csp=trusted-types');
    console.log('  trusted-types-no-eval      http://localhost:3002/?csp=trusted-types-no-eval');
    console.log('  trusted-types-multi        http://localhost:3002/?csp=trusted-types-multi');
    console.log('  trusted-types-no-htmx      http://localhost:3002/?csp=trusted-types-no-htmx');
    console.log('  alpine-csp                 http://localhost:3002/alpine?csp=alpine-csp');
    console.log('  alpine-csp-tt              http://localhost:3002/alpine?csp=alpine-csp-tt');
});
