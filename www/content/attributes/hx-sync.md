+++
title = "hx-sync"
description = "The hx-sync attribute in htmx allows you to synchronize AJAX requests between multiple elements."
+++

The `hx-sync` attribute allows you to synchronize AJAX requests between multiple elements.

The `hx-sync` attribute consists of a CSS selector to indicate the element to synchronize on, followed optionally
by a colon and then by an optional syncing strategy.  The available strategies are:

* `drop` - drop (ignore) this request if an existing request is in flight (the default)
* `abort` - drop (ignore) this request if an existing request is in flight, and, if that is not the case, 
            *abort* this request if another request occurs while it is still in flight
* `replace` - abort the current request, if any, and replace it with this request
* `queue` - place this request in the request queue associated with the given element

The `queue` modifier can take an additional argument indicating exactly how to queue:

* `queue first` - queue the first request to show up while a request is in flight
* `queue last` - queue the last request to show up while a request is in flight
* `queue all` - queue all requests that show up while a request is in flight

## Notes

* `hx-sync` is inherited and can be placed on a parent element

This example resolves a race condition between a form's submit request and an individual input's validation request. Normally, without using `hx-sync`, filling out the input and immediately submitting the form triggers two parallel requests to `/validate` and `/store`. Using `hx-sync="closest form:abort"` on the input will watch for requests on the form and abort the input's request if a form request is present or starts while the input request is in flight.

```html
<form hx-post="/store">
    <input id="title" name="title" type="text" 
        hx-post="/validate" 
        hx-trigger="change"
        hx-sync="closest form:abort">
    <button type="submit">Submit</button>
</form>
```

If you'd rather prioritize the validation request over the submit request, you can use the `drop` strategy. This example will prioritize the validation request over the submit request so that if a validation request is in flight, the form cannot be submitted.

```html
<form hx-post="/store">
    <input id="title" name="title" type="text" 
        hx-post="/validate" 
        hx-trigger="change"
        hx-sync="closest form:drop"
    >
    <button type="submit">Submit</button>
</form>
```

When dealing with forms that contain many inputs, you can prioritize the submit request over all input validation requests using the hx-sync `replace` strategy on the form tag. This will cancel any in-flight validation requests and issue only the `hx-post="/store"` request. If you'd rather abort the submit request and prioritize any existing validation requests you can use the `hx-sync="this:abort"` strategy on the form tag.

```html
<form hx-post="/store" hx-sync="this:replace">
    <input id="title" name="title" type="text" hx-post="/validate" hx-trigger="change" />
    <button type="submit">Submit</button>
</form>
```

When implementing active search functionality the hx-trigger attribute's `delay` modifier can be used to debounce the user's input and avoid making multiple requests while the user types. However, once a request is made, if the user begins typing again a new request will begin even if the previous one has not finished processing. This example will cancel any in-flight requests and use only the last request. In cases where the search input is contained within the target, then using `hx-sync` like this also helps reduce the chances that the input will be replaced while the user is still typing.

```html
<input type="search" 
    hx-get="/search" 
    hx-trigger="keyup changed delay:500ms, search" 
    hx-target="#search-results"
    hx-sync="this:replace">
```
