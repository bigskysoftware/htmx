---
title: "hx-on"
description: "Run inline JavaScript when an event fires"
---

The `hx-on` attribute wires inline JavaScript to run when an event fires. 

It is an enhanced version of [`onevent` properties](https://developer.mozilla.org/en-US/docs/Web/Events/Event_handlers#using_onevent_properties) that keeps behavior in the markup ([Locality of Behaviour](/essays/locality-of-behaviour)).

## Syntax

**Simple form**

One event, one expression:

```html
<!-- hx-on:<event>=<js> -->

<dialog hx-on:load="this.showModal()">
```

For htmx events, use `::` as shorthand for `htmx:`:

```html
<!-- hx-on::before:request is shorthand for hx-on:htmx:before:request -->
<button hx-get="/api" hx-on::before:request="showSpinner()">
<button hx-get="/api" hx-on::after:request="hideSpinner()">
```

**Extended form**

Builds on [`hx-trigger`](/reference/attributes/hx-trigger)'s grammar, adding `->` to wire events to JavaScript:

```html
<!-- hx-on="<event>[<filter>] <modifiers> [, ...] -> <js> | { <js>; ... } [; ...]" -->

<!-- Open dialog on page load / swap -->
<dialog hx-on="load -> this.showModal()">

<!-- Unfocus input on Escape -->
<input hx-on="keydown[key=='Escape'] -> this.blur()">
    
<!-- Close dialog on custom event (e.g. HX-Trigger: closeDialog) -->
<dialog hx-on="closeDialog from:body -> this.close()">
    
<!-- Close on backdrop click OR custom event -->
<dialog hx-on="click from:self, closeDialog from:body -> this.close()">

<!-- Run multiple statements -->
<dialog hx-on="close -> this.remove(); log('dialog removed')">
        
<!-- Different code for different events -->
<dialog hx-on="load -> this.showModal();
               click from:self, closeDialog from:body -> this.close();
               close -> this.remove(); log('removed')">
```

- `->` event(s) on the left, JavaScript code on the right
- `,` multiple events, same code
- `;` separate event -> code pairs (only splits on the `;` immediately before a `->`, so semicolons in your JS are safe)

## Standard Events

`hx-on` works with any DOM event: `click`, `input`, `keyup`, `submit`, etc.

```html
<button hx-on:click="...">
<input hx-on:input="...">
<form hx-on:submit="...">
<div hx-on:mouseenter="...">
```

## Custom Events

Custom events work too. Dispatch them from JavaScript with [`htmx.trigger()`](/reference/methods/htmx-trigger), or from the server via the [`HX-Trigger`](/reference/headers/HX-Trigger) response header.

Events from `HX-Trigger` are dispatched on the `body`, so use [`from:body`](#from) to listen for them:

```html
<div hx-on="productsUpdated from:body -> log('Products updated!')">
```

## Synthetic Events

htmx provides synthetic events beyond standard DOM events.

These work with both the simple form (`hx-on:load`) and the extended form (`hx-on="load -> ..."`).

### `load`

Fires when the element is loaded into the DOM.

```html
<div hx-on:load="this.classList.add('loaded')">
```

### `revealed`

Fires when the element is scrolled into the viewport.

```html
<div hx-on:revealed="this.classList.add('visible')">
```

_Note: `revealed` always observes the browser viewport. For scrollable containers with `overflow`, use [`intersect`](#intersect) with `root` instead._

### `intersect`

Fires when an element becomes visible in the viewport.

Uses the [IntersectionObserver API](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/IntersectionObserver#options) and supports [`root`](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/root), [`rootMargin`](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/rootMargin), and [`threshold`](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/thresholds) as modifiers.

```html
<div hx-on="intersect once -> this.classList.add('in-view')">
<div hx-on="intersect rootMargin:100px -> this.classList.add('near')">
```

### `every <time>`

Fires repeatedly on an interval. Only available in the extended form.

```html
<div hx-on="every 1s -> this.textContent = new Date().toLocaleTimeString()">
```

## Event Modifiers

### `[filter]`

A JavaScript expression in brackets after the event name. Only fires when it evaluates to `true`.

```html
<button hx-on="click[ctrlKey] -> navigator.clipboard.writeText(this.textContent)">
```

Inside the brackets, all properties of the event are available as bare names:

- [`click`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent#instance_properties) → `altKey`, `ctrlKey`, `shiftKey`, `metaKey`, ...
- [`keydown`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent#instance_properties) → `key`, `code`, `repeat`, ...

Global functions work too: `click[hasUnsavedChanges()]`.

### `once`

Fires once, then stops listening.

```html
<button hx-on="click once -> this.textContent = 'Done!'">Click me</button>
```

### `changed`

Only fires if the element's `value` changed since last time.

```html
<input hx-on="input changed -> console.log(this.value)">
```

Note: [`change`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event) is a DOM event. `changed` is an htmx modifier. Different things.

### `delay:<time>`

Waits before firing. If the event fires again, the delay resets (debounce).

```html
<input hx-on="input delay:500ms -> console.log(this.value)">
```

### `throttle:<time>`

Fires, then ignores further events for the given interval.

```html
<div hx-on="scroll throttle:100ms -> this.dataset.scrollY = window.scrollY"></div>
```

### `from:<selector>`

Listens on a different element. Takes a CSS selector or an [extended selector](/docs/features/extended-selectors). Two special values: `self` (only the element itself, not children) and `outside` (anything outside the element).

```html
<div hx-on="keydown[key=='Escape'] from:body -> this.hidden = true">
<div hx-on="click from:outside -> this.hidden = true">
```

### `target:<selector>`

Only fires if `event.target` matches the given CSS selector.

```html
<ul hx-on="click target:li -> event.target.classList.toggle('selected')"></ul>
```

### `prevent`

Calls `event.preventDefault()`.

```html
<form hx-on="submit prevent -> console.log(new FormData(this))"></form>
```

### `stop` / `consume`

Calls `event.stopPropagation()`.

```html
<button hx-on="click stop -> this.textContent = 'clicked'"></button>
```

### `halt`

Shorthand for `prevent stop`.

```html
<a hx-on="click halt -> console.log(this.href)"></a>
```

### `capture`

Listens during the capture phase (top-down) instead of the bubble phase (bottom-up).

```html
<div hx-on="click capture -> console.log('capture:', event.target.tagName)"></div>
```

### `passive`

Tells the browser the handler won't call `preventDefault()`, so the browser can scroll without waiting for your code to finish.

```html
<div hx-on="scroll passive -> this.dataset.scrollY = window.scrollY"></div>
```

## Symbols

Like `onevent`, two symbols are made available to event handler scripts:

### `this`

The element the `hx-on` attribute is on.

```html
<button hx-on:click="this.classList.toggle('active')">Toggle</button>
```

### `event`

The event that fired.

Any properties on `event.detail` are unpacked into scope, so you can write `message` instead of `event.detail.message`:

```html
<!-- dispatched with detail: { message: 'hello' } -->
<div hx-on="my-event -> alert(message)">
<!-- equivalent to: alert(event.detail.message) -->
</div>
```

## Notes

* Works with any event, including [htmx events](/reference#events).
* `hx-on` is _not_ inherited, but events on children still [bubble up](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#event_bubbling_and_capture) and trigger it.
* Both forms (`hx-on:event` and `hx-on="..."`) can coexist on the same element.
* Browsers lowercase attribute names, so `hx-on:myEvent` won't match a `myEvent` dispatch. Use the extended form: `hx-on="myEvent -> ..."`.
## See Also

- [`hx-trigger`](/reference/attributes/hx-trigger) (attribute)
- [Client Scripting](/docs/core-concepts/client-scripting) (guide)
- [Extended Selectors](/docs/features/extended-selectors) (reference)
- [Locality of Behaviour](/essays/locality-of-behaviour) (essay)
