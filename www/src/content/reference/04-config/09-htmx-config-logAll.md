---
title: "htmx.config.logAll"
description: "Log all htmx events to console"
---

The `htmx.config.logAll` option, when set to `true`, causes htmx to surface event-level output through `htmx.logger`.

**Default:** `false`

Errors and warnings always flow to the logger regardless of this flag. `logAll` controls only the chatty event-by-event output that's useful when debugging behavior. Most of the time you don't need it.

## Example

```javascript
htmx.config.logAll = true;
// or, equivalently:
htmx.logAll();
```

```html
<meta name="htmx-config" content='{"logAll":true}'>
```

To silence everything, including errors and warnings, replace the logger entirely:

```javascript
htmx.logNone();                         // installs a no-op logger
htmx.logger = (level, msg, ctx) => {};  // same effect, explicit
```

See `htmx.logger` for the full pluggable-logger API.
