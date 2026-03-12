---
title: "Synchronization"
description: "Coordinate requests between multiple elements"
keywords: ["sync", "race condition", "abort", "queue", "debounce", "throttle"]
---

Often you want to coordinate the requests between two elements. For example, you may want a request from one element
to supersede the request of another element, or to wait until the other element's request has finished.

htmx offers a [`hx-sync`](/reference/attributes/hx-sync) attribute to help you accomplish this.

Consider a race condition between a form submission and an individual input's validation request in this HTML:

```html
<form hx-post="/store">
    <input id="title" name="title" type="text"
           hx-post="/validate"
           hx-trigger="change">
    <button type="submit">Submit</button>
</form>
```

Without using `hx-sync`, filling out the input and immediately submitting the form triggers two parallel requests to
`/validate` and `/store`.

Using `hx-sync="closest form"` on the input and `hx-sync="this:replace"` on the form will watch for requests from the
form
and abort an input's in flight request:

```html
<form hx-post="/store" hx-sync="this:replace">
    <input id="title" name="title" type="text"
           hx-post="/validate"
           hx-trigger="change"
           hx-sync="closest form">
    <button type="submit">Submit</button>
</form>
```

This resolves the synchronization between the two elements in a declarative way.

htmx also supports a programmatic way to cancel requests: you can send the [`htmx:abort`](/reference/events/htmx-abort) event to an element to
cancel any in-flight requests:

```html
<button id="request-button" hx-post="/example">
    Issue Request
</button>
<button onclick="htmx.trigger('#request-button', 'htmx:abort')">
    Cancel Request
</button>
```

More examples and details can be found on the [`hx-sync` attribute page.](/reference/attributes/hx-sync)
