---
title: "hx-trigger"
description: "Controls when the element issues a request"
---

The `hx-trigger` attribute specifies what triggers an AJAX request.

## Examples

```html
<!-- Trigger on click -->
<div hx-trigger="click" hx-get="...">Click Me</div>

<!-- Search with debounce -->
<input hx-trigger="input changed delay:1s" hx-get="...">

<!-- Lazy load on scroll -->
<div hx-trigger="revealed" hx-get="...">Loading...</div>

<!-- Poll every 2 seconds -->
<div hx-trigger="every 2s" hx-get="...">Waiting...</div>
```

A trigger value can be:

* A [standard event](#standard-events): `click`, `input`, `keyup`
* A [synthetic event](#synthetic-events): `load`, `revealed`, `intersect`
* A [polling](#polling) expression: `every 1s`
* [Multiple triggers](#multiple-triggers) (comma-separated)

Events can be refined with [filters](#event-filters) and [modifiers](#event-modifiers) (e.g. `input changed delay:1s`).

## Defaults

When `hx-trigger` is omitted, htmx uses a sensible default based on the element:

| Element | Default trigger |
|---|---|
| `<input>`, `<textarea>`, `<select>` | `change` |
| `<form>` | `submit` |
| Everything else | `click` |

## Standard Events

`hx-trigger` accepts any [DOM event](https://developer.mozilla.org/en-US/docs/Web/API/Element#events): [`click`](https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event), [`input`](https://developer.mozilla.org/en-US/docs/Web/API/Element/input_event), [`keyup`](https://developer.mozilla.org/en-US/docs/Web/API/Element/keyup_event), [`submit`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event), etc.

```html
<button hx-trigger="click" hx-post="...">Submit</button>
<input hx-trigger="input" hx-get="...">
<form hx-trigger="submit" hx-post="...">
<div hx-trigger="mouseenter" hx-get="...">
```

[Custom events](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) work too. You can trigger them from JavaScript or from the server via the [`HX-Trigger`](/reference/headers/HX-Trigger) response header.

```html
<div hx-trigger="my-custom-event" hx-get="...">...</div>
```

## Event Modifiers

### `[filter]`

Only fires when the `[expression]` after the event name is `true`.

```html
<input hx-trigger="keyup[key == 'Enter']" hx-get="/search">
```

Inside the brackets, all properties of the event are available as bare names:

- [`click`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent#instance_properties) → `altKey`, `ctrlKey`, `shiftKey`, `metaKey`, ...
- [`keydown`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#instance_properties) → `key`, `code`, `repeat`, ...

Global functions work too: `click[hasUnsavedChanges()]`.

### `once`

Fires once, then stops listening.

```html
<button hx-trigger="click once" hx-get="...">Load Once</button>
```

### `changed`

Only fires if the element's `value` changed since last time.

```html
<input hx-trigger="input changed" hx-get="...">
```

Note: [`change`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event) is a DOM event. `changed` is an htmx modifier. Different things.

### `delay`

Waits before firing. If the event fires again, the delay resets (debounce).

```html
<input hx-trigger="input delay:1s" hx-get="...">
```

### `throttle`

Fires, then ignores further events for the given interval.

```html
<div hx-trigger="scroll throttle:500ms" hx-get="...">...</div>
```

### `from`

Listens on a different element. Takes a CSS selector or an [extended selector](/docs/features/extended-selectors).

```html
<div hx-trigger="keyup[key=='Enter'] from:body" hx-get="...">...</div>
<div hx-trigger="my-event from:document" hx-get="...">...</div>
<div hx-trigger="submit from:closest form" hx-get="...">...</div>
```

### `target`

Only fires if `event.target` matches the given CSS selector.

```html
<div hx-trigger="click target:.child-button" hx-get="...">...</div>
```

### `consume`

Calls `event.stopPropagation()` *and* stops other listeners on the same element.

```html
<button hx-trigger="click consume" hx-get="...">...</button>
```

### `queue`

Queues events while a request is already in flight.

```html
<div hx-trigger="click queue:all" hx-get="...">...</div>
```

Options:

* `first` - queue the first event
* `last` - queue the last event (default)
* `all` - queue all events (issue a request for each)
* `none` - do not queue new events

### Example

A search box that searches on `input`, but only if the value has [`changed`](#changed) and the user hasn't typed anything new for 1 second ([`delay`](#delay)):

```html
<input name="q"
       hx-trigger="input changed delay:1s"
       hx-get="/search"
       hx-target="#search-results"/>
```

## Synthetic Events

htmx provides some synthetic events beyond the standard web API events:

### `load`

Fires when the element is loaded into the DOM. Useful for [lazy-loading](/patterns/loading/lazy-load) content.

```html
<div hx-trigger="load" hx-get="...">Loading...</div>
```

### `revealed`

Fires when the element is scrolled into the viewport. Also useful for lazy-loading.

```html
<div hx-trigger="revealed" hx-get="...">Loading...</div>
```

If you are using `overflow` in CSS (e.g. `overflow-y: scroll`), use [`intersect`](#intersect) [`once`](#once) instead.

### `intersect`

Fires once when an element first intersects the viewport.

```html
<tr hx-trigger="intersect once"
    hx-get="..."
    hx-swap="outerHTML">
  <td>Loading more...</td>
</tr>
```

#### `root`

A CSS selector of the root element for intersection.

```html
<div hx-trigger="intersect root:#scroll-container" hx-get="...">...</div>
```

#### `threshold`

A float between 0.0 and 1.0 indicating what amount of intersection to fire the event on.

```html
<div hx-trigger="intersect threshold:0.5" hx-get="...">...</div>
```

## HX-Trigger Header

To fire an event from the `HX-Trigger` response header, you will likely want to use the [`from:body`](#from) modifier. For example, if you send `HX-Trigger: my-custom-event` with a response:

```html
<div hx-trigger="my-custom-event from:body" hx-get="...">
  Triggered by HX-Trigger header...
</div>
```

This is because the header triggers the event in a different DOM hierarchy than the element you want to trigger. For a similar reason, you will often listen for hot keys [`from`](#from) the body.

## Polling

Using `every <timing declaration>` you can have an element poll periodically:

```html
<div hx-trigger="every 1s" hx-get="/updates">
  Nothing Yet!
</div>
```

To add a filter to polling, add it after the poll declaration:

```html
<div hx-trigger="every 1s [someConditional]" hx-get="/updates">
  Nothing Yet!
</div>
```

## Multiple Triggers

Multiple triggers can be provided, separated by commas. Each trigger gets its own options.

```html
<div hx-trigger="load, click delay:1s" hx-get="/news"></div>
```

This loads `/news` immediately on page load, and then again with a 1 second delay after each click.

## Via JavaScript

The AJAX request can be triggered via JavaScript using [`htmx.trigger()`](/reference/methods/htmx-trigger).

## Notes

* `hx-trigger` can be used without an AJAX request, in which case it will only fire the `htmx:trigger` event.
* To pass a CSS selector that contains whitespace (e.g. `form input`) to the [`from`](#from) or [`target`](#target) modifier, surround the selector in parentheses or curly brackets (e.g. `from:(form input)` or `from:closest (form input)`).
* A `reset` event in `hx-trigger` (e.g. `hx-trigger="change, reset"`) might not work as intended, since htmx builds its values and sends a request before the browser resets the form. As a workaround, add a delay: `hx-trigger="change, reset delay:0.01s"`.

## See Also

- [`hx-on`](/reference/attributes/hx-on) — run inline JavaScript when an event fires, using the same event modifiers, filters, and synthetic events
