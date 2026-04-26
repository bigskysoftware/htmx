---
title: "hx-history-elt"
description: "Mark the element to swap on history restore"
---

The `hx-history-elt` attribute marks the element that htmx should swap when restoring a page from
history (back/forward navigation). Only this element is replaced — the rest of the page is left
untouched.

When a history restore request is made, htmx sends a `GET` request with the
[`HX-History-Restore-Request`](/reference/headers/HX-History-Restore-Request) header. The server
should return a full page response; htmx selects the `hx-history-elt` element from it and swaps it
into the matching element in the current page.

## Syntax

```html
<main hx-history-elt>
    <!-- only this element is replaced on back/forward navigation -->
</main>
```

## Example

```html
<body>
    <nav><!-- never replaced --></nav>

    <main hx-history-elt>
        <h1>Page 1</h1>
        <button hx-get="/page2" hx-target="[hx-history-elt]" hx-push-url="/page2">
            Go to Page 2
        </button>
    </main>
</body>
```

The server should detect `HX-History-Restore-Request` and return a full page containing a matching
`hx-history-elt` element:

```
if request.headers["HX-History-Restore-Request"]:
    return render_full_page()   # includes <main hx-history-elt>...</main>
else:
    return render_fragment()    # just the inner content
```

## Notes

* Only one `hx-history-elt` element should exist in the page at a time
* If no `hx-history-elt` is present, htmx falls back to swapping `<body>`
* The server response must include a `hx-history-elt` element for the select to work; if it is
  missing, htmx falls back to a full body swap
* In htmx 2, history was cached in localStorage. In htmx 4, caching has moved to the
  [`hx-history-cache`](/docs/extensions/history-cache) extension — `hx-history-elt` works with
  both the core re-fetch behavior and the extension's cache restore
