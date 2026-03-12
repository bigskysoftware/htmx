---
title: "htmx.config.morphScanLimit"
description: "Maximum number of siblings scanned when matching elements during morphing"
---

The `htmx.config.morphScanLimit` option limits how many sibling elements htmx will scan when trying to match nodes during a morph swap. Higher values improve accuracy for long lists without IDs at the cost of performance.

**Default:** `10`

## Example

```javascript
htmx.config.morphScanLimit = 20;
```

```html
<meta name="htmx-config" content='{"morphScanLimit":20}'>
```

If morphing produces unexpected reorders in long lists, try increasing this limit.

See also: [`htmx.config`](/reference/config/htmx-config)
