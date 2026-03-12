---
title: "htmx:before:process"
description: "Before htmx processes a DOM node"
---

The `htmx:before:process` event fires before htmx begins processing a DOM node or subtree to attach htmx behaviors.

## When It Fires

- During initial page load processing
- After new content is swapped into the DOM
- When `htmx.process()` is called manually

## Event Detail

Empty - no additional context provided.

## Example

```javascript
htmx.on('htmx:before:process', (evt) => {
  console.log('About to process:', evt.target);
});
```

Cancel this event to prevent htmx from processing the element.
