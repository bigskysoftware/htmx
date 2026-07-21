---
title: "htmx:before:actions"
description: "Fires before server actions run"
---

The `htmx:before:actions` event fires before htmx runs a set of server actions, such as `HX-Trigger` or `HX-Push-Url`.

## When It Fires

Before each `runActions()` call executes. Core runs response actions once per request, after status and history rules and before the swap.

## Event Detail

- `actions` - Actions about to run, e.g. `{trigger: "myEvent"}`
- `ctx` - Request context for HTTP response actions

Other callers can add detail. For example, multipart actions also include `part`.

## Example

```javascript
htmx.on('htmx:before:actions', (evt) => {
  console.log('Running actions:', evt.detail.actions);
});
```

Unknown `HX-*` response headers become custom actions: `HX-Toast: Saved!` arrives as `actions.toast`. Core ignores them; handle them here.

```javascript
htmx.on('htmx:before:actions', (evt) => {
  if (evt.detail.actions.toast) showToast(evt.detail.actions.toast);
});
```

Cancel this event to skip execution and [`htmx:after:actions`](/reference/events/htmx-after-actions).

## See Also

- [`htmx:after:actions`](/reference/events/htmx-after-actions)
- [`htmx:before:history:update`](/reference/events/htmx-before-history-update)
