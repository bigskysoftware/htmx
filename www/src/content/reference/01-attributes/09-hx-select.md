---
title: "hx-select"
description: "Controls which response part is inserted"
---

The `hx-select` attribute selects response content to swap.

Set it to a CSS selector matched against the response:

```html
<button hx-get="/info" hx-target="#result" hx-select="#info-detail">
  Get Info
</button>

<div id="result">
  <!-- Selected content goes here -->
</div>
```

The server can return a full page:

```html
<header>This is ignored</header>

<!-- This... -->
<section id="info-detail">
  <h2>Details</h2>
  <p>Only this section is selected.</p>
</section>
<!-- ...is selected -->

<footer>This is also ignored</footer>
```

htmx swaps only the matching element into `#result`:

```html
<div id="result">
  <!-- Only the selected element is inserted -->
  <section id="info-detail">
    <h2>Details</h2>
    <p>Only this section is selected.</p>
  </section>
</div>
```

## See Also

- [`hx-target`](/reference/attributes/hx-target)
- [`hx-swap`](/reference/attributes/hx-swap)
- [`HX-Reselect`](/reference/headers/HX-Reselect)
