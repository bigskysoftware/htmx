---
title: "hx-pending"
description: "Shows custom content during requests"
---

The `hx-pending` attribute shows custom content while a request is in flight.

**Note:** This is an extension attribute. See the [hx-pending extension](/extensions/hx-pending) for installation and full documentation.

## Syntax

```html
<button hx-post="/action" hx-pending="#loading-template">Submit</button>
```

The value is a CSS selector pointing to the content to show during the request.

## Example

```html
<template id="sending">
    <li class="pending">Sending...</li>
</template>

<form hx-post="/message" hx-target="#messages" hx-swap="beforeend" hx-pending="#sending">
    <input name="body">
    <button>Send</button>
</form>
```

## See Also

* [hx-pending extension](/extensions/hx-pending)
