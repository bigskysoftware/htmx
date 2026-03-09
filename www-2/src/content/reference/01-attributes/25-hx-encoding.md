---
title: "hx-encoding"
description: "Set request encoding type"
---

The `hx-encoding` attribute allows you to switch the request encoding from the usual `application/x-www-form-urlencoded`
encoding to `multipart/form-data`, usually to support file uploads in an ajax request.

## Syntax

```html
<form hx-post="/upload" hx-encoding="multipart/form-data">
    <input type="file" name="file">
    <button type="submit">Upload</button>
</form>
```

The value of this attribute should be `multipart/form-data`.

The `hx-encoding` tag may be placed on parent elements.
