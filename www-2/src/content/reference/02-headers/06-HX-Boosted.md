---
title: "HX-Boosted"
description: "Indicates a boosted navigation request"
---

# HX-Boosted

Set to `true` when the request comes from a boosted element via `hx-boost`.

Boosted elements are regular links and forms that htmx intercepts to enhance.

## Example

Detect boosted navigation.

```python
if request.headers.get('HX-Boosted') == 'true':
    # Boosted requests get the full layout
    return render_template('page.html')
else:
    # Regular htmx requests get a fragment
    return render_template('fragment.html')
```
