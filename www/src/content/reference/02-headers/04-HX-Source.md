---
title: "HX-Source"
description: "Identifies the element that triggered the request"
---

The `HX-Source` request header contains the element that triggered the request. Format is `tag#id` like `button#submit`.

Elements without an ID use only the tag name like `div` or `form`.

## Example

Check which element triggered the request.

```python
source = request.headers.get('HX-Source')
if source == 'button#submit-btn':
    # Handle button submission
    return handle_button_submit()
```
