---
title: "htmx.config.defaultFocusScroll"
description: "Scroll to the focused element after a swap"
---

The `htmx.config.defaultFocusScroll` option, when set to `true`, causes htmx to scroll the focused element into view after each swap.

**Default:** `false`

## Example

```javascript
htmx.config.defaultFocusScroll = true;
```

```html
<meta name="htmx-config" content='{"defaultFocusScroll":true}'>
```

Useful when swapping content that moves focus to a new element and you want the user's view to follow.

See also: [`htmx.config`](/reference/config/htmx-config)
