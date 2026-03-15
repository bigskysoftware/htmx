---
title: "HX-History-Restore-Request"
description: "Indicates history navigation (back/forward)"
---

The `HX-History-Restore-Request` request header is set to `true` when the user navigates back or forward in history.

htmx restores the previous state without a full page reload. Use this to skip side effects during history restoration.

## Example

Skip analytics for restored pages.

```python
if request.headers.get('HX-History-Restore-Request'):
    # Don't log analytics or run side effects
    return render_content()
else:
    log_page_view()
    return render_content()
```
