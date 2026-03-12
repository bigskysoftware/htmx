---
title: "Mental Model"
description: "Learn to think in hypermedia rather than client-side state"
thumbnail: "docs/mental-model.svg"
---

<!-- TODO: Add section for developers coming from React/Vue/Svelte -
     cover the mindset shift from "client builds UI from JSON" to
     "server sends ready-to-render HTML". Address common misconceptions
     and patterns to unlearn. -->

htmx extends HTML's built-in hypermedia controls. 

To understand htmx, first understand these controls.

## HTML's Native Controls

HTML has two elements that issue HTTP requests: `<a>` and `<form>`.

### The Anchor Tag

```html
<a href="/blog">Blog</a>
```

Click the link. Browser issues GET request to `/blog`. Response loads in the browser window.

### The Form Tag

```html
<form method="post" action="/register">
    <label>Email: <input type="email"></label>
    <button type="submit">Submit</button>
</form>
```

Submit the form. Browser issues POST request to `/register`. Response loads in the browser window.

## Transclusion

Both elements support a `target` attribute. Place the response in an iframe instead of the full window:

```html
<form method="post" action="/register" target="iframe1">
    <label>Email: <input type="email"></label>
    <button type="submit">Submit</button>
</form>
<iframe name="iframe1">
    <!-- Response appears here -->
</iframe>
```

This is [transclusion](https://en.wikipedia.org/wiki/Transclusion) - one HTML document included inside another.

## How htmx Extends This

htmx generalizes these concepts. Any element can issue any HTTP verb to any URL, triggered by any event, with the response placed anywhere.

```html
<button hx-post="/clicked"
        hx-trigger="click"
        hx-target="#output"
        hx-swap="outerHTML">
    Click Me
</button>
<output id="output"></output>
```

**What this means:**

> When a user clicks this button, issue a POST request to `/clicked`. Use the response to replace the element with id `output`.

## The Key Difference

Like anchor and form tags, htmx expects **HTML responses**, not JSON.

**Traditional SPA approach:**
1. Server returns JSON
2. JavaScript parses JSON
3. JavaScript builds HTML
4. JavaScript updates DOM

**htmx approach:**
1. Server returns HTML
2. htmx updates DOM

The server sends the final HTML directly. No client-side templating needed.

## The Philosophy

htmx follows the [original web programming model](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm). It uses [Hypertext As The Engine Of Application State](https://en.wikipedia.org/wiki/HATEOAS) (HATEOAS).

The server controls what the user sees by sending HTML. The hypermedia itself drives the application.

## What This Enables

**Any element** can make requests:
```html
<div hx-get="/status">Check Status</div>
```

**Any HTTP verb:**
```html
<button hx-delete="/item/5">Delete</button>
```

**Any event:**
```html
<input hx-post="/save" hx-trigger="blur">
```

**Response goes anywhere:**
```html
<button hx-get="/data" hx-target="#results">Load</button>
<div id="results"></div>
```

This is htmx: HTML's hypermedia controls, generalized.
