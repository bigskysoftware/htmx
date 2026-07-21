---
title: "htmx:after:actions"
description: "Fires after server actions run"
---

The `htmx:after:actions` event fires after htmx runs a set of server actions.

## When It Fires

After each `runActions()` call executes. It does not fire when [`htmx:before:actions`](/reference/events/htmx-before-actions) is cancelled.

## Event Detail

- `actions` - Actions that ran, e.g. `{trigger: "myEvent"}`
- `ctx` - Request context for HTTP response actions

Other callers can add detail. For example, multipart actions also include `part`.

## Example

```javascript
htmx.on('htmx:after:actions', (evt) => {
  console.log('Actions ran:', evt.detail.actions);
});
```

## See Also

- [`htmx:before:actions`](/reference/events/htmx-before-actions)
