+++
title = "hx-history"
+++

Set the `hx-history` attribute to `false` on any element in the current document, or any html fragment loaded into the current document by htmx, to prevent sensitive data being saved to the localStorage cache when htmx takes a snapshot of the page state. 

History navigation will work as expected, but on restoration the URL will be requested from the server instead of the history cache.

Here is an example:

```html
<html>
<body>
<div hx-history="false">
 ...
</div>
</body>
</html>
```

## Notes

* `hx-history="false"` can be present *anywhere* in the document to embargo the current page state from the history cache (i.e. even outside the element specified for the history snapshot [hx-history-elt](@/attributes/hx-history-elt.md)).
