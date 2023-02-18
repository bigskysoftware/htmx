---
layout: layout.njk
title: </> htmx - high power tools for html
---

## The `refresh-href` Extension

The `refresh-href` extension refreshes href attributes of anchor elements having hx-get attribute, with the actual URL used to make the Ajax call.

This enables the browser to show the actual target when hovering the link, and makes "Open link in new tab" work, assuming of course the response is a full document.

Refresh is made by default on "init" (initialization) and "mouseover" event. Events can be changed by listing them in refresh-href -attribute, separated by comma.

### Usage

```html
<div hx-ext="refresh-href">
    <!-- adds href="/test" on initialization, and refreshes it onmouseover -->
    <a hx-get="/test">test</div>
</div>
```

### Source

<https://unpkg.com/htmx.org/dist/ext/refresh-href.js>
