---
title: "hx-encoding"
description: "Sets request encoding type"
---

The `hx-encoding` attribute changes request encoding.

Requests use `application/x-www-form-urlencoded` by default. Use `multipart/form-data` for file uploads.

## Syntax

```html
<form hx-post="/upload" hx-encoding="multipart/form-data">
    <input type="file" name="file">
    <button type="submit">Upload</button>
</form>
```

The value of this attribute should be `multipart/form-data`.

The `hx-encoding` tag may be placed on parent elements.
