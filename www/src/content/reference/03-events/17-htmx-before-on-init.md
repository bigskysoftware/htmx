---
title: "htmx:before:on:init"
description: "Fires before htmx wires the hx-on attributes on an element"
---

The `htmx:before:on:init` event fires before htmx binds the [`hx-on`](/reference/attributes/hx-on) attributes on an element.

Cancel it to leave those attributes unbound.

## When It Fires

During [`htmx.process()`](/reference/methods/htmx-process), after [`htmx:before:process`](/reference/events/htmx-before-process) and before element initialization.

htmx fires it once for the processed root, and once for each descendant that carries an `hx-on` attribute.

## Event Detail

Empty - no additional context provided.

## Example

```javascript
htmx.on('htmx:before:on:init', (evt) => {
  if (evt.target.closest('.no-inline-handlers')) {
    evt.preventDefault();
  }
});
```

## Notes

* The event bubbles and is cancelable.
* `preventDefault()` stops htmx from binding the `hx-on` attributes on that element only. Processing continues for the rest of the tree.

## See Also

* [`hx-on`](/reference/attributes/hx-on)
* [`htmx:before:process`](/reference/events/htmx-before-process)
* [`htmx:before:init`](/reference/events/htmx-before-init)
