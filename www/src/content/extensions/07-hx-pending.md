---
title: "hx-pending"
description: "Show custom content during requests - from loading states to optimistic updates"
category: "UX"
icon: "icon-[mdi--progress-check]"
keywords: ["pending", "optimistic", "ui", "loading", "placeholder", "skeleton"]
---

The `hx-pending` extension shows custom content while a request is in flight. When the response arrives (or on error), the pending content is removed and replaced with the real server response.

This enables patterns from simple loading placeholders to full optimistic updates. You control how much to show before the server confirms.

## When to Use

For most cases, htmx's built-in [indicator support](/docs#request-indicators) is sufficient: show a spinner or "Loading..." message during requests. Use `hx-pending` when you need more control:

- **Loading skeletons**: Show a placeholder that matches the shape of expected content
- **Data-aware pending states**: Display what the user submitted, styled as "in progress"
- **Optimistic updates**: Show the expected result immediately (for low-stakes operations where rollback isn't jarring)

## Installing

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/htmx.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/ext/hx-pending.js"></script>
```

## Basic Usage

Add `hx-pending` to any element that makes a request, pointing to a template containing your pending content:

```html
<ul id="messages">
    <li>Hello world</li>
</ul>

<template id="sending-template">
    <li class="pending">Sending...</li>
</template>

<form hx-post="/message" hx-target="#messages" hx-swap="beforeend" hx-pending="#sending-template">
    <input name="body" placeholder="Message...">
    <button type="submit">Send</button>
</form>
```

The template content is inserted immediately when the form submits, then replaced by the server response (or removed on error).

## Styling Pending Content

The pending element receives an `hx-pending` class for styling:

```css
.hx-pending {
    opacity: 0.6;
    font-style: italic;
}
```

This gives users a clear signal that the content is provisional, or you can style it to match your final state for a more optimistic UI.

## Data-Aware Pending States

The extension captures request parameters (form inputs, `hx-vals`, `hx-include`) and sets them as `data-*` attributes on the pending element. Combined with the [hx-live](/extensions/hx-live) extension, you can display the submitted values:

```html
<template id="msg-template">
    <li class="pending">
        <strong :text="data.author"></strong>: <span :text="data.body"></span>
    </li>
</template>

<form hx-post="/message" hx-target="#messages" hx-swap="beforeend" hx-pending="#msg-template">
    <input name="author" value="You">
    <input name="body" placeholder="Message...">
    <button type="submit">Send</button>
</form>
```

Now users see their message immediately — styled as pending — while it's being sent. More informative than a spinner, but the styling makes clear it's not yet confirmed.

Multi-value fields (checkboxes, multi-selects) are stored as JSON arrays: `data-tags='["js","css"]'`.

