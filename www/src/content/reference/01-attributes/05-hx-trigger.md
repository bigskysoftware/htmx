---
title: "hx-trigger"
description: "Specify event that triggers request"
---

The `hx-trigger` attribute specifies what triggers an AJAX request.

## Examples

```html
<!-- Trigger on click -->
<div hx-get="..." hx-trigger="click">Click Me</div>

<!-- Search with debounce -->
<input hx-get="..." hx-trigger="input changed delay:1s">

<!-- Lazy load on scroll -->
<div hx-get="..." hx-trigger="revealed">Loading...</div>

<!-- Poll every 2 seconds -->
<div hx-get="..." hx-trigger="every 2s">Waiting...</div>
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
<button hx-post="..." hx-trigger="click">Submit</button>
<input hx-get="..." hx-trigger="input">
<form hx-post="..." hx-trigger="submit">
<div hx-get="..." hx-trigger="mouseenter">
```

[Custom events](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) work too. You can trigger them from JavaScript or from the server via the [`HX-Trigger`](/reference/headers/HX-Trigger) response header.

```html
<div hx-get="..." hx-trigger="my-custom-event">...</div>
```

## Event Filters

Add a JavaScript expression in `[brackets]` after the event name. The request only fires when the expression returns `true`.

Inside the brackets you have direct access to the [DOM event object](https://developer.mozilla.org/en-US/docs/Web/API/Event):

- `click[ctrlKey]` checks [`MouseEvent.ctrlKey`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/ctrlKey)
- `keyup[key=='Enter']` checks [`KeyboardEvent.key`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key)

```html
<!-- Check a property on the event -->
<div hx-get="..." hx-trigger="click[ctrlKey]">...</div>

<!-- Check the key that was pressed -->
<input hx-get="..." hx-trigger="keyup[key=='Enter']">

<!-- Combine conditions -->
<div hx-get="..." hx-trigger="click[ctrlKey&&shiftKey]">...</div>

<!-- Call a global function -->
<div hx-get="..." hx-trigger="click[checkGlobalState()]">...</div>
```

If a symbol isn't found on the event object, htmx looks for it in the global scope. This is how `checkGlobalState()` works above.

Event filters use [`eval()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval) under the hood. See [security considerations](/docs/security/best-practices#htmx--eval).

## Event Modifiers

Events can have modifiers that change how they behave.

### `once`

The event will only trigger once (e.g. the first click).

```html
<button hx-get="..." hx-trigger="click once">Load Once</button>
```

### `changed`

The event will only trigger if the element's `value` has changed since the last time it fired.

```html
<input hx-get="..." hx-trigger="input changed">
```

Note: [`change`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event) is a DOM event. `changed` is an htmx modifier. Different things.

### `delay`

The event will wait before triggering. If the event fires again, the delay resets.

```html
<input hx-get="..." hx-trigger="input delay:1s">
```

### `throttle`

The event will trigger, then ignore all further events for the given interval.

```html
<div hx-get="..." hx-trigger="scroll throttle:500ms">...</div>
```

```
  0ms  scroll → request fires
100ms  scroll → ignored
200ms  scroll → ignored
500ms         → throttle window ends
600ms  scroll → request fires
```

This is the opposite of [`delay`](#delay). `delay` waits for a *pause* in events (debounce). `throttle` fires immediately and then limits the rate.

### `from`

The event will be listened for on a different element. Takes a CSS selector or an [extended selector](/docs/features/extended-selectors).

```html
<!-- Listen for Enter key on the body (hotkeys) -->
<div hx-get="..." hx-trigger="keyup[key=='Enter'] from:body">...</div>

<!-- Listen on the document -->
<div hx-get="..." hx-trigger="my-event from:document">...</div>

<!-- Listen on the closest form -->
<div hx-get="..." hx-trigger="submit from:closest form">...</div>
```

The selector is evaluated once when the element is initialized. It is not re-evaluated when the page changes.

### `target`

The event will only trigger if its [`event.target`](https://developer.mozilla.org/en-US/docs/Web/API/Event/target) matches the given CSS selector. Useful for listening on a parent for events from children that might not exist yet.

```html
<div hx-get="..." hx-trigger="click target:.child-button from:body">...</div>
```

### `consume`

The event will not propagate to parent elements. Prevents other htmx requests from triggering on ancestors.

```html
<button hx-get="..." hx-trigger="click consume">...</button>
```

### `queue`

The event will be queued if a request is already in flight.

```html
<div hx-get="..." hx-trigger="click queue:all">...</div>
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
       hx-get="/search" hx-trigger="input changed delay:1s"
       hx-target="#search-results"/>
```

## Synthetic Events

htmx provides some synthetic events beyond the standard web API events:

### `load`

Fires when the element is loaded into the DOM. Useful for [lazy-loading](/patterns/loading/lazy-load) content.

```html
<div hx-get="..." hx-trigger="load">Loading...</div>
```

### `revealed`

Fires when the element is scrolled into the viewport. Also useful for lazy-loading.

```html
<div hx-get="..." hx-trigger="revealed">Loading...</div>
```

If you are using `overflow` in CSS (e.g. `overflow-y: scroll`), use [`intersect`](#intersect) [`once`](#once) instead.

### `intersect`

Fires once when an element first intersects the viewport.

```html
<tr hx-get="..."
    hx-trigger="intersect once"
    hx-swap="outerHTML">
  <td>Loading more...</td>
</tr>
```

#### `root`

A CSS selector of the root element for intersection.

```html
<div hx-get="..." hx-trigger="intersect root:#scroll-container">...</div>
```

#### `threshold`

A float between 0.0 and 1.0 indicating what amount of intersection to fire the event on.

```html
<div hx-get="..." hx-trigger="intersect threshold:0.5">...</div>
```

## HX-Trigger Header

To fire an event from the `HX-Trigger` response header, you will likely want to use the [`from:body`](#from) modifier. For example, if you send `HX-Trigger: my-custom-event` with a response:

```html
<div hx-get="..." hx-trigger="my-custom-event from:body">
  Triggered by HX-Trigger header...
</div>
```

This is because the header triggers the event in a different DOM hierarchy than the element you want to trigger. For a similar reason, you will often listen for hot keys [`from`](#from) the body.

## Polling

Using `every <timing declaration>` you can have an element poll periodically:

```html
<div hx-get="/latest_updates" hx-trigger="every 1s">
  Nothing Yet!
</div>
```

To add a filter to polling, add it after the poll declaration:

```html
<div hx-get="/latest_updates" hx-trigger="every 1s [someConditional]">
  Nothing Yet!
</div>
```

## Multiple Triggers

Multiple triggers can be provided, separated by commas. Each trigger gets its own options.

```html
<div hx-get="/news" hx-trigger="load, click delay:1s"></div>
```

This loads `/news` immediately on page load, and then again with a 1 second delay after each click.

## Via JavaScript

The AJAX request can be triggered via JavaScript using [`htmx.trigger()`](/reference/methods/htmx-trigger).

## Notes

* `hx-trigger` can be used without an AJAX request, in which case it will only fire the `htmx:trigger` event.
* To pass a CSS selector that contains whitespace (e.g. `form input`) to the [`from`](#from) or [`target`](#target) modifier, surround the selector in parentheses or curly brackets (e.g. `from:(form input)` or `from:closest (form input)`).
* A `reset` event in `hx-trigger` (e.g. `hx-trigger="change, reset"`) might not work as intended, since htmx builds its values and sends a request before the browser resets the form. As a workaround, add a delay: `hx-trigger="change, reset delay:0.01s"`.
