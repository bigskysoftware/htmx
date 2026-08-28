---
title: "hx-history-elt"
description: "Marks element to swap on history restore"
---

The `hx-history-elt` attribute selects the element restored during history navigation.

The rest of the page remains unchanged.

By default, core htmx restores history with a `GET` containing
[`HX-History-Restore-Request`](/reference/headers/HX-History-Restore-Request). The server returns a
full page, and htmx selects its `hx-history-elt` element and swaps it into the current page.

Extensions can cancel this request and restore content another way. For example,
[`hx-history-cache`](/extensions/hx-history-cache) restores a saved DOM snapshot on a cache hit.

## Syntax

```html
<main hx-history-elt>
    <!-- only this element is replaced on back/forward navigation -->
</main>
```


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
  [`hx-history-cache`](/extensions/hx-history-cache) extension — `hx-history-elt` works with
  both the core re-fetch behavior and the extension's cache restore
