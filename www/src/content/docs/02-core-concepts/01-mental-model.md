---
title: "Mental Model"
description: "Learn to think in hypermedia rather than client-side state"
thumbnail: "docs/mental-model.svg"
---

<!-- TODO: Add section for developers coming from React/Vue/Svelte -
     cover the mindset shift from "client builds UI from JSON" to
     "server sends ready-to-render HTML". Address common misconceptions
     and patterns to unlearn. -->

htmx extends HTML's built-in concept of [hypermedia controls](https://dl.acm.org/doi/fullHtml/10.1145/3648188.3675127).

To understand htmx, you should first understand what these are.

## HTML's Native Controls

HTML has two major elements that issue HTTP requests in response to user actions: `<a>` (anchors, aka "links") and
`<form>`.

### The Anchor Tag

```html
<a href="/blog">Blog</a>
```

When a user click this link a browser will issue an HTTP `GET` request to `/blog`. It will then load the HTML response
into the browser's window.

### The Form Tag

```html

<form method="post" action="/register">
    <label>Email: <input type="email"></label>
    <button type="submit">Submit</button>
</form>
```

When a user submits this form (by, say, clicking on the "Submit" button) a browser will issue an HTTP `POST` request to
`/register`. Again, it will load the HTML response to this request into the browser window.

These two hypermedia controls demonstrate the core idea behind them: in response to a user action a
request is made and new content is loaded into the client.

## Transclusion

Both of these HTML elements support a (relatively little-known and unused)
[`target`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAnchorElement/target) attribute.

By using this attribute you can place the response in, for example, an iframe rather than replacing the entire
content in the window:

```html

<form method="post" action="/register" target="iframe1">
    <label>Email: <input type="email"></label>
    <button type="submit">Submit</button>
</form>
<iframe name="iframe1">
    <!-- Response appears here -->
</iframe>
```

This is [transclusion](https://en.wikipedia.org/wiki/Transclusion), where one HTML document is included inside of
another.

## How htmx Extends This Idea

htmx generalizes these concepts. Any element can issue any type of HTTP request to any URL. Any event can trigger the
request. And the response HTML can be placed anywhere in the DOM.

```html

<button hx-post="/clicked"
        hx-trigger="click"
        hx-target="#output"
        hx-swap="outerHTML">
    Click Me
</button>
<output id="output"></output>
```

These htmx attributes (which start with `hx-`) tell a browser:

> When a user clicks this button, issue a POST request to `/clicked`. Use the response to replace the element with id
`output`.

Like anchor and form tags, htmx expects _HTML responses_ from the server.

This is in contrast with many front-end libraries and frameworks today which instead expect JSON and
use client-side templating to transform that JSON into HTML on the client.

## htmx's Philosophy

Because htmx works in terms of HTML it follows the [original web programming model](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm). 
It uses [Hypertext As The Engine Of Application State](https://en.wikipedia.org/wiki/HATEOAS) (HATEOAS).

The server controls what the user sees by sending HTML.  Users select actions from that HTML and the server responds with
more HTML (i.e. hypertext). 

Thus, the hypermedia itself drives the application.
