## Testing

* interval parsing
* scrolling/'revealed' event
* hx-swap-oob (verify, chrome coverage tool bad?)
* SSE stuff
* hx-trigger delay
* class operation parsing
* class toggling
* transition model for content swaps

## Feature Backlog

* `scroll:bottom` and `scroll:top` options in swap specification
* logrithmic back off on history cache size on QuotaExceededError
* `htmx-on="myEvent: ...""` attribute for handling custom events
* `htmx-requests` class on body
* local references (e.g. hx-get="#foo")
* focus recapture
* Move to weakmap for htmx node info?  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap
* Scroll handler use https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API if available?
* `path-deps` extension <https://github.com/bigskysoftware/htmx/issues/21>
* `hx-select` implies same `hx-target`? <https://github.com/bigskysoftware/htmx/issues/26>