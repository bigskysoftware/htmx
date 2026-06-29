---
title: "hx-prompt"
description: "Prompt before a request, send the answer as a header"
category: "UX"
icon: "icon-[mdi--comment-question-outline]"
keywords: ["prompt", "input", "header", "hx-prompt", "htmx2"]
---

The `hx-prompt` extension restores htmx 2's `hx-prompt` attribute.

Before each request, it pops up a browser prompt. The answer becomes the `HX-Prompt` header. If the user cancels, the request never fires.

## Installing

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/htmx.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/ext/hx-prompt.js"></script>
```

## Usage

```html
<button hx-delete="/items/1" hx-prompt="Reason for deletion?">
    Delete
</button>
```

On click:

1. Browser asks `Reason for deletion?`.
2. Cancel aborts.
3. Any answer (even empty) fires a cancelable [`htmx:prompt` event](#htmxprompt-event) carrying it in `event.detail.prompt`.
4. If nothing cancels it, htmx sends the request with the `HX-Prompt` header set to the answer.

### `htmx:prompt` event

The `htmx:prompt` event fires on the source element after a valid answer.

Listen with `hx-on::prompt` and call `event.preventDefault()` to abort:

```html
<button hx-delete="/items/1"
        hx-prompt="Reason?"
        hx-on::prompt="if (prompt.length < 3) event.preventDefault()">
    Delete
</button>
```

`event.detail` carries `{ prompt, target }`. `hx-on` exposes it directly, so they're in scope without unwrapping.

### Inheritance

The `hx-prompt` attribute supports inheritance.

```html
<div hx-prompt:inherited="Reason?">
    <button hx-delete="/items/1">Delete</button>
    <button hx-delete="/items/2">Delete</button>
</div>
```

### Composing with hx-confirm

`hx-prompt` runs *before* `hx-confirm`. Both must pass for the request to proceed:

```html
<button hx-delete="/items/1"
        hx-prompt="Reason?"
        hx-confirm="Are you sure?">
    Delete
</button>
```

If the user cancels the prompt, the confirm dialog is not shown.

### Custom Dialogs

Assign a function to `window.htmxPrompt` to use a custom (synchronous) dialog.

```js
// receives the question, returns the answer string or null to cancel
window.htmxPrompt = (question) => myCustomSyncDialog(question);
```

The extension uses [`window.prompt`](https://developer.mozilla.org/en-US/docs/Web/API/Window/prompt) by default.

### Server-Side Example

`HX-Prompt` is a regular request header. Read it however your server reads headers.

```python
def delete_item(request, id):
    reason = request.headers.get("HX-Prompt", "")
    Item.objects.filter(id=id).delete(reason=reason)
    return HttpResponse("")  # empty response removes the row
```

## Without the extension

If you'd rather skip the extension, a single `hx-on` can do the same thing:

```html
<button hx-delete="/items/1"
        hx-on::config:request="ctx.request.headers['HX-Prompt'] = prompt('Reason?') ?? event.preventDefault()">
    Delete
</button>
```
