---
title: "hx-optimistic"
description: "Apply optimistic UI updates before the server responds"
category: "UX"
icon: "icon-[mdi--lightning-bolt-outline]"
keywords: ["optimistic", "ui", "instant", "updates"]
---

The `hx-optimistic` extension shows a preview of the expected result immediately when a request is made, before the server responds. When the response arrives (or on error), the optimistic content is removed and replaced with the real content.

## Installing

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/htmx.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htmx.org@next/dist/ext/hx-optimistic.js"></script>
```

Add `hx-optimistic` to your extensions whitelist:

```html
<meta name="htmx-config" content='extensions:"hx-optimistic"'>
```

## Usage

Add `hx-optimistic` to any element that makes a request, pointing to a template element:

```html
<ul id="messages">
    <li>Hello world</li>
</ul>

<template id="msg-opt">
    <li>Sending...</li>
</template>

<form hx-post="/message" hx-target="#messages" hx-swap="beforeend" hx-optimistic="#msg-opt">
    <input name="body" placeholder="Message...">
    <button type="submit">Send</button>
</form>
```

When the form submits, the template content is immediately inserted into the target. When the server responds, the optimistic content is removed and the real response is swapped in.

## Request Parameters as Data Attributes

The extension captures all string request parameters (form inputs, `hx-vals`, `hx-include`) and sets them as `data-*` attributes on the optimistic element. This makes the submitted values available to CSS and to the [hx-live](/extensions/hx-live) extension.

For a form with `<input name="author" value="You">`, the optimistic div gets `data-author="You"`.

Multi-value fields (checkboxes, multi-selects) are stored as JSON arrays: `data-tags='["js","css"]'`.

## Dynamic Templates with hx-live

When used with the `hx-live` extension, optimistic templates can display the submitted values using `:text` bindings and the `data` proxy:

```html
<template id="msg-opt">
    <li><strong :text="data.author"></strong>: <span :text="data.body"></span></li>
</template>

<form hx-post="/message" hx-target="#messages" hx-swap="beforeend" hx-optimistic="#msg-opt">
    <input name="author" value="You">
    <input name="body" placeholder="Message...">
    <button type="submit">Send</button>
</form>
```

The `data` proxy reads `data-*` attributes from the nearest ancestor, and hx-live's `:text` binding sets `textContent` safely (no XSS risk). Full JavaScript expressions are supported:

```html
<template id="order-opt">
    <div>
        <span :text="data.item"></span>
        <span :text="'$' + (data.price * data.qty).toFixed(2)"></span>
        <span :text="Array.isArray(data.tags) ? data.tags.join(', ') : data.tags"></span>
    </div>
</template>
```

## Styling

The optimistic element receives a `hx-optimistic` class, which you can style with CSS:

```css
.hx-optimistic {
    opacity: 0.6;
    font-style: italic;
}

.hx-optimistic::after {
    content: " (sending...)";
    font-size: 0.8em;
    color: #888;
}
```

You can also style based on the request parameters:

```css
.hx-optimistic[data-priority="high"] {
    border-left: 3px solid red;
}
```

## How It Works

1. On `htmx:config:request` — captures the raw `FormData` before htmx transforms it
2. On `htmx:before:request` — clones the template, sets `data-*` for each param, inserts it into the target (respecting swap style), and calls `htmx.process()` so hx-live bindings activate
3. On `htmx:before:swap` or `htmx:error` — removes the optimistic content and unhides any hidden elements

## Swap Style Behavior

The extension respects the `hx-swap` value:

| Swap Style | Behavior |
|---|---|
| `innerHTML` | Hides target's children, appends optimistic content |
| `beforebegin`, `afterbegin`, `beforeend`, `afterend` | Inserts optimistic content at that position |
| `outerHTML` / other | Hides target, inserts optimistic content after it |

## Without hx-live

The extension works without hx-live — static template content displays as-is, and the `data-*` attributes are still available for CSS selectors. You only need hx-live if you want dynamic `:text` / `:class` / `:style` bindings in the template.
