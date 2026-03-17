+++
title = "Streaming Partials Extension"
+++

## Overview

The Streaming Partials extension enables incremental rendering by extracting and swapping `<hx-*>` elements as they arrive in the HTML stream, before the full response completes.

**Key benefit:** Partials swap immediately while the rest of the page continues streaming.

## How It Works

### Standard Streaming Mode

1. Server sends HTML with embedded `<hx-*>` partials
2. Extension streams response and buffers content
3. When complete `<hx-*>...</hx-*>` detected, pass to `htmx.swap()` immediately
4. htmx handles all parsing, target resolution, and swapping natively
5. Remove partial from buffer
6. Continue until stream ends
7. Process remaining content as main response

### Background Partials Mode

When the response includes a complete HTML document (ending with `</html>`), the extension enables a special mode:

1. Server sends complete HTML document up to `</html>` tag
2. Extension detects `</html>` and returns that content as the main response
3. Main HTML document swaps into page normally, with full settlement
4. **After settlement completes**, extension processes remaining stream content
5. Any `<hx-*>` partials after `</html>` swap in the background
6. Enables lazy-loading and progressive enhancement in a single response

This allows you to return a fast skeleton page, then stream additional content updates after the page has rendered.

## Installation

### Via CDN

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-alpha6/dist/htmx.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-alpha6/dist/ext/hx-streaming-partials.js"></script>
```

### Download

Download the files and include them in your project:

```html
<script src="/path/to/htmx.min.js"></script>
<script src="/path/to/hx-streaming-partials.js"></script>
```

### npm

For npm-style build systems:

```sh
npm install htmx.org@4.0.0-alpha6
```

Then include both files:

```html
<script src="node_modules/htmx.org/dist/htmx.min.js"></script>
<script src="node_modules/htmx.org/dist/ext/hx-streaming-partials.js"></script>
```

### Module Imports

When using module bundlers:

```javascript
import htmx from 'htmx.org';
import 'htmx.org/dist/ext/hx-streaming-partials';
```

The extension registers automatically when loaded. Use `hx-ext="streaming-partials"` to enable it on specific elements.

## Usage

```html
<div hx-get="/page" hx-ext="streaming-partials">
  Load Page
</div>
```

Server must send `HX-Stream-Partials: true` header to enable streaming.

**Note:** In htmx4, extensions auto-register globally but you still need `hx-ext="streaming-partials"` to activate the extension on specific elements.

## Server Response

### Standard Mode

```html
<!-- Partial swaps immediately when complete -->
<hx-partial hx-target="#sidebar" hx-swap="innerHTML">
  <div>Sidebar content (swaps first)</div>
</hx-partial>

<!-- Main content continues streaming -->
<div>
  <h1>Main Content</h1>
  <p>This keeps streaming...</p>
</div>

<!-- Another partial swaps when complete -->
<hx-partial hx-target="#footer" hx-swap="innerHTML">
  <div>Footer content</div>
</hx-partial>

<!-- More main content -->
<div>More content...</div>
```

### Background Partials Mode

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
</head>
<body>
    <div id="sidebar">Loading...</div>
    <div id="content">Loading...</div>
    <div id="footer">Loading...</div>
</body>
</html>
<!-- Everything above swaps immediately -->

<!-- Partials below stream in AFTER page loads -->
<hx-partial hx-target="#sidebar" hx-swap="innerHTML">
    <nav>Sidebar content loaded lazily</nav>
</hx-partial>

<hx-partial hx-target="#content" hx-swap="innerHTML">
    <article>Heavy content from slow API</article>
</hx-partial>

<hx-partial hx-target="#footer" hx-swap="innerHTML">
    <footer>Footer with analytics</footer>
</hx-partial>
```

## Extension Code

See [source code](https://github.com/bigskysoftware/htmx/blob/master/src/ext/hx-streaming-partials.js) for implementation details.

The extension intercepts fetch requests and streams the response, extracting `<hx-*>` tags and passing them to `htmx.swap()` for native processing.

## Server Examples

### Node.js/Express

```javascript
app.get('/page', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('HX-Stream-Partials', 'true');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    // Send partial immediately
    res.write(`
        <hx-partial hx-target="#sidebar" hx-swap="innerHTML">
            <div>Sidebar loaded!</div>
        </hx-partial>
    `);
    
    // Simulate slow main content
    setTimeout(() => {
        res.write(`
            <div>
                <h1>Main Content</h1>
                <p>This took longer to generate...</p>
            </div>
        `);
        
        // Another partial
        res.write(`
            <hx-partial hx-target="#footer">
                <div>Footer loaded!</div>
            </hx-partial>
        `);
        
        res.end();
    }, 1000);
});
```

### Python/Flask

```python
@app.route('/page')
def page():
    def generate():
        # Fast partial
        yield '''
            <hx-partial hx-target="#sidebar">
                <div>Sidebar loaded!</div>
            </hx-partial>
        '''
        
        time.sleep(1)
        
        # Slow main content
        yield '''
            <div>
                <h1>Main Content</h1>
                <p>This took longer...</p>
            </div>
        '''
        
        # Another partial
        yield '''
            <hx-partial hx-target="#footer">
                <div>Footer loaded!</div>
            </hx-partial>
        '''
    
    return Response(
        generate(),
        mimetype='text/html',
        headers={'HX-Stream-Partials': 'true'}
    )
```

## Events

- `htmx:streaming:partial` - Fired when each partial is swapped
  - `detail.count` - Number of partials swapped so far
  - `detail.background` - Boolean indicating if this is a background partial (after `</html>`)

- `htmx:streaming:background-start` - Fired when background partial processing begins (after main swap settles)

- `htmx:streaming:background-complete` - Fired when all background partials are processed
  - `detail.count` - Total number of partials processed

- `htmx:streaming:background-error` - Fired if an error occurs during background processing
  - `detail.error` - The error object

## Use Cases

### Progressive Page Load with Background Updates

```html
<!DOCTYPE html>
<html>
<body>
    <div id="sidebar">⏳ Loading...</div>
    <div id="content">⏳ Loading...</div>
</body>
</html>

<!-- Background partials load after initial page render -->
<hx-partial hx-target="#sidebar" hx-swap="innerHTML">
    <nav>Navigation loaded</nav>
</hx-partial>

<hx-partial hx-target="#content" hx-swap="innerHTML">
    <article>Heavy content from database</article>
</hx-partial>
```

### Dashboard with Multiple Data Sources

```html
<!-- Each widget loads as data becomes available -->
<hx-partial hx-target="#widget-1">
    <div>Fast API data</div>
</hx-partial>

<hx-partial hx-target="#widget-2">
    <div>Slow API data</div>
</hx-partial>

<!-- Main dashboard layout -->
<div class="dashboard-grid">
    <div id="widget-1">Loading...</div>
    <div id="widget-2">Loading...</div>
</div>
```

### Progressive Content Loading

```html
<!DOCTYPE html>
<html>
<body>
    <h1>Article Title</h1>
    <div id="article">Loading...</div>
    <div id="comments">Loading comments...</div>
</body>
</html>

<!-- Article loads first -->
<hx-partial hx-target="#article">
    <article>Main article content...</article>
</hx-partial>

<!-- Comments load after article -->
<hx-partial hx-target="#comments">
    <div>User comments (loaded from slow service)...</div>
</hx-partial>
```

## Advantages

✅ **Immediate feedback** - Fast partials swap before slow content  
✅ **No SSE needed** - Uses regular HTML streaming  
✅ **Progressive enhancement** - Falls back to normal processing  
✅ **Native htmx parsing** - Uses `htmx.swap()` for all `<hx-*>` types  
✅ **Single request** - Everything in one HTTP response  
✅ **Extensible** - Works with any `<hx-*>` tag htmx supports  
✅ **Background mode** - Load full HTML documents with lazy content updates  
✅ **Works with hx-boost** - Compatible with full-page navigation  
✅ **Settlement-aware** - Background partials wait for main swap to complete  

## Limitations

❌ **Requires header** - Server must send `HX-Stream-Partials: true`  
❌ **No reconnection** - Unlike SSE, stream doesn't reconnect  
❌ **Buffering needed** - Must buffer to detect complete tags  

## Comparison with SSE

| Feature | Streaming Partials | SSE |
|---------|-------------------|-----|
| Single request | ✅ | ❌ |
| Reconnection | ❌ | ✅ |
| Message boundaries | Template tags | `\n\n` |
| Browser support | All | All |
| Server complexity | Medium | Low |

## When to Use

**Use Streaming Partials when:**
- You want progressive page loads in one request
- Different parts of page have different load times
- You can't use SSE (firewall, proxy issues)

**Use SSE when:**
- You need reconnection
- You want simpler server code
- You're okay with multiple requests

**Use hard links when:**
- Full page navigation
- Native browser streaming is enough
- You want View Transitions API
