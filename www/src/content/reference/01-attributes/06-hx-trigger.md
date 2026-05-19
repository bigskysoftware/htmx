---
title: "hx-trigger"
description: "Control when an element issues a request"
---

The `hx-trigger` attribute controls which event(s) trigger an element's AJAX request (set via [`hx-get`](/reference/attributes/hx-get), [`hx-post`](/reference/attributes/hx-post), etc.).

Defaults to:
- [`change`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event) → `<input>` / `<textarea>` / `<select>`
- [`submit`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event) → `<form>`
- [`click`](https://developer.mozilla.org/en-US/docs/Web/API/Element/click_event) → `<input type=button>`, `<input type=submit>`, and everything else

## Syntax

```html
<!-- hx-trigger="<event>[<filter>] <modifiers> [, ...]" -->

<!-- Basic (click is the default) -->
<button hx-get="...">

<!-- With from: modifier — listen on a different element -->
<button hx-trigger="click from:outside" hx-get="...">

<!-- With a filter -->
<button hx-trigger="click[shiftKey]" hx-get="...">

<!-- Multiple triggers -->
<button hx-trigger="click, keyup[key=='Enter']" hx-get="...">
```

## Standard Events

`hx-trigger` accepts any DOM event: `click`, `input`, `keyup`, `submit`, etc.

```html
<button hx-trigger="click" hx-post="...">
<input hx-trigger="input" hx-get="...">
<form hx-trigger="submit" hx-post="...">
<div hx-trigger="mouseenter" hx-get="...">
```

## Custom Events

Custom events work too. Dispatch them from JavaScript with [`htmx.trigger()`](/reference/methods/htmx-trigger), or from the server via the [`HX-Trigger`](/reference/headers/HX-Trigger) response header.

Events from `HX-Trigger` are dispatched on the `body`, so use [`from:body`](#from) to listen for them:

```html
<div hx-trigger="productsUpdated from:body" hx-get="...">...</div>
```

## Synthetic Events

htmx provides synthetic events beyond standard DOM events:

### `load`

Fires when the element is loaded into the DOM. Useful for [lazy-loading](/patterns/loading/lazy-load) content.

```html
<div hx-trigger="load" hx-get="...">Loading...</div>
```

### `revealed`

Fires when the element is scrolled into the viewport. Useful for [infinite scroll](/patterns/loading/infinite-scroll).

```html
<div hx-trigger="revealed" hx-get="...">Loading...</div>
```

_Note: `revealed` always observes the browser viewport. For scrollable containers with `overflow`, use [`intersect`](#intersect) with `root` instead._

### `intersect`

Fires when an element becomes visible in the viewport. 

Uses the [IntersectionObserver API](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/IntersectionObserver#options) and supports [`root`](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/root), [`rootMargin`](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/rootMargin), and [`threshold`](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/thresholds) as modifiers.

```html
<div hx-trigger="intersect once" hx-get="...">...</div>
<div hx-trigger="intersect root:#scroll-container" hx-get="...">...</div>
<div hx-trigger="intersect rootMargin:100px" hx-get="...">...</div>
<div hx-trigger="intersect threshold:0.5" hx-get="...">...</div>
```

### `every <time>`

Fires repeatedly on an interval.

```html
<div hx-trigger="every 1s" hx-get="/updates">...</div>
```

To add a filter to polling, add it after the interval:

```html
<div hx-trigger="every 1s [someConditional]" hx-get="/updates">...</div>
```

## Event Modifiers

### `[filter]`

A JavaScript expression in brackets after the event name. Only fires when it evaluates to `true`.

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

### `delay:<time>`

Waits before firing. If the event fires again, the delay resets (debounce).

```html
<input hx-trigger="input delay:1s" hx-get="...">
```

### `throttle:<time>`

Fires, then ignores further events for the given interval.

```html
<div hx-trigger="scroll throttle:500ms" hx-get="...">...</div>
```

### `from:<selector>`

Listens on a different element. Takes a CSS selector or an [extended selector](/docs/features/extended-selectors). Two special values: `self` (only the element itself, not children) and `outside` (anything outside the element).

```html
<div hx-trigger="keyup[key=='Enter'] from:body" hx-get="...">...</div>
<div hx-trigger="my-event from:document" hx-get="...">...</div>
<div hx-trigger="submit from:closest form" hx-get="...">...</div>
<div hx-trigger="click from:self" hx-get="...">...</div>
<div hx-trigger="click from:outside" hx-get="...">...</div>
```

### `target:<selector>`

Only fires if `event.target` matches the given CSS selector.

```html
<div hx-trigger="click target:.child-button" hx-get="...">...</div>
```

### `prevent`

Calls `event.preventDefault()`.

```html
<form hx-trigger="submit prevent" hx-post="...">...</form>
```

### `stop` / `consume`

Calls `event.stopPropagation()`.

```html
<button hx-trigger="click stop" hx-get="...">...</button>
```

### `halt`

Shorthand for `prevent stop`.

```html
<a hx-trigger="click halt" hx-get="...">...</a>
```

### `capture`

Listens during the capture phase (top-down) instead of the bubble phase (bottom-up).

```html
<div hx-trigger="click capture" hx-get="...">...</div>
```

### `passive`

Tells the browser the handler won't call `preventDefault()`, so the browser can scroll without waiting for your code to finish.

```html
<div hx-trigger="scroll passive" hx-get="...">...</div>
```

### Example

A search box that searches on `input`, but only if the value has [`changed`](#changed) and the user hasn't typed anything new for 1 second ([`delay`](#delay)):

```html
<input name="q"
       hx-trigger="input changed delay:1s"
       hx-get="/search"
       hx-target="#search-results"/>
```

## Notes

* Selectors with whitespace in [`from`](#from) or [`target`](#target) need parentheses: `from:(form input)`.
* `hx-trigger="change, reset"` may fire before the browser resets the form. As a workaround, add a short delay: `hx-trigger="change, reset delay:0.01s"`.

## See Also

- [`hx-on`](/reference/attributes/hx-on) (attribute)
- [Extended Selectors](/docs/features/extended-selectors) (reference)
- [Lazy Load](/patterns/loading/lazy-load) (pattern)
- [Infinite Scroll](/patterns/loading/infinite-scroll) (pattern)
- [Progress Bar](/patterns/loading/progress-bar) (pattern)
