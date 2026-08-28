---
title: "HX-Target"
description: "Identifies element that will receive response"
---

The `HX-Target` request header identifies the element that will receive the response.

This header is only included when a target is specified.

Format: `<tag>#<id>` (e.g. `div#results`) or just `<tag>` for elements without an ID.

## Syntax

The header is included as follows:

```http
HX-Target: div#results
```


Return different content for different targets:

```python
target = request.headers.get('HX-Target')
if target == 'div#sidebar':
    return render_template('sidebar_content.html')
```

## See Also

- [`hx-target`](/reference/attributes/hx-target)
- [`HX-Retarget`](/reference/headers/HX-Retarget)
