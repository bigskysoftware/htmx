---
title: "load"
description: "Fires after element initialization"
---

The `load` event is a _synthetic_ event that fires immediately on element initialization, mimicking the standard DOM `load` event.  It is not a real event and cannot be listened for, but can be used in an `hx-trigger`.

## When It Fires

Right before [`htmx:after:init`](/reference/events/htmx-after-init), providing a familiar event name for developers.

## Event Detail

Empty - no additional context provided.

## Example

```html
<div hx-get="/content" hx-trigger="load">
  Loading...
</div>
```

This provides compatibility with standard DOM patterns.
