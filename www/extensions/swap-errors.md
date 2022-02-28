---
layout: layout.njk
title: </> htmx - high power tools for html
---

## The `swap-errors` Extension

The `swap-errors` extension allows swapping response when HTTP Error code is returned.
It's nice way to deal with errors server-side instead of [client-side](/docs#modifying_swapping_behavior_with_events) and gives appropriate HTTP status code.
It works adding the header `HX-Swap-Errors` in the response.

### Usage

You may combine it with `hx-swap-oob`, in html forms.

```html
<form hx-ext="swap-errors" hx-post="/form">
  <input type="text" />/>
  <input type="submit" />
</form>
<div id="errors"></div>
```

Some HTTP Response with 400 code and `HX-Swap-Errors` header.

```html
<div id="errors" hx-swap-oob="true">There was a 400 error !!!</div>
```

### Source

<https://unpkg.com/htmx.org/dist/ext/swap-errors.js>
