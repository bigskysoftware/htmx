## Attribute Audit

| Attribute       | owner | Status                                                      | Description                                                                                           |
|-----------------|-------|-------------------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| hx-get          | 1cg   | ✅                                                           | issues a GET to the specified URL                                                                     |
| hx-post         | 1cg   | ✅                                                           | issues a POST to the specified URL                                                                    |
| hx-put          | 1cg   | ✅                                                           | issues a PUT to the specified URL                                                                     |
| hx-patch        | 1cg   | ✅                                                           | issues a PATCH to the specified URL                                                                   |
| hx-delete       | 1cg   | ✅                                                           | issues a DELETE to the specified URL                                                                  |
| hx-push-url     | mwest | ✅                                                           | push a URL into the browser location bar to create history                                            |
| hx-swap-oob     |       | ✅                                                           | mark element to swap in from a response (out of band)                                                 |
| hx-target       | 1cg   | ✅ multi-target?                                             | specifies the target element to be swapped                                                            |
| hx-trigger      | 1cg   | ✅ (still needs testing)                                     | specifies the event that triggers the request                                                         |
| hx-preserve     |       | ✅                                                           | specifies elements to keep unchanged between requests                                                 |
| hx-replace-url  | mwest | ✅                                                           | replace the URL in the browser location bar                                                           |
| hx-validate     | 1cg   | ✅                                                           | force elements to validate themselves before a request                                                |
| hx-boost        | 1cg   | ✅                                                           | add progressive enhancement for links and forms                                                       |
| hx-confirm      |       | ✅                                                           | shows a confirm() dialog before issuing a request                                                     |
| hx-swap         | 1cg   | basic ✅ (still needs work on modifiers, focus, scroll, etc) | controls how content will swap in (outerHTML, beforeend, afterend, …)                                 |
| hx-on*          | 1cg   | ✅                                                           | handle events with inline scripts on elements                                                         |
| hx-sync         | 1cg   | ✅                                                           | control how requests made by different elements are synchronized                                      |
| hx-indicator    |       | ✅                                                           | the element to put the hthx-request class on during the request                                       |
| hx-disabled-elt |       | ✅ (rename to `hx-disable` lol)                              | adds the disabled attribute to the specified elements while a request is in flight                    |
| hx-include      | 1cg   | ✅                                                           | include additional data in requests                                                                   |
| hx-encoding     |       | ✅                                                           | changes the request encoding type                                                                     |
| hx-headers      |       | ✅                                                           | adds to the headers that will be submitted with the request                                           |
| hx-select       | mwest | yes                                                         | select content to swap in from a response                                                             |
| hx-select-oob   | mwest | yes                                                         | select content to swap in from a response, somewhere other than the target (out of band)              |
| hx-vals         |       | ✅                                                           | add values to submit with the request (JSON format)                                                   |
| hx-request      |       | yes (convert to `hx-config`, see below)                     | configures various aspects of the request                                                             |
| hx-prompt       |       | ❌                                                           | shows a prompt() before submitting a request                                                          |
| hx-disable      |       | ❌ ✅ (replaced with hx-ignore)                               | disables htmx processing for the given node and any children nodes                                    |
| hx-disinherit   |       | ❌                                                           | control and disable automatic attribute inheritance for child nodes                                   |
| hx-ext          | mwest | ❌ need to think about new ext model                         | extensions to use for this element                                                                    |
| hx-history      |       | ❌                                                           | prevent sensitive data being saved to the history cache                                               |
| hx-history-elt  |       | ❌                                                           | the element to snapshot and restore during history navigation                                         |
| hx-inherit      |       | ❌                                                           | control and enable automatic attribute inheritance for child nodes if it has been disabled by default |
| hx-params       |       | ❌                                                           | filters the parameters that will be submitted with a request                                          |
| hx-vars         |       | ❌                                                           | adds values dynamically to the parameters to submit with the request (deprecated, please use hx-vals) |

# TODOs

* Support `hx-action="js:..."` and `js:` or `javascript:` broadly
  * Allow users to turn off eval
* quirks.js implementation
  * Move deprecated features into quirks.js?
    * out of band selects
  * revert to `innerHTML` swap
  * rever to htmx 2.0 attribute resolution
  * mode to log elements that should marked as `:inherited` 
* An "upgrade report" tool for htmx 2.0 applications
  * Produces a report of all elements that need to be
    * Marked as `:inherited`
    * Need to have their swap strategy adjusted (all of them?)
    * Use of no-longer supported events
    * Use of old htmx API calls (???)
    * Collect results into `localStorage` as a JSON array, w/path -> element id (or just outer HTML if no id)
    * Display results via HTML
* Audits
  * Event audit
  * JavaScript API audit
  * Configuration options audit
* Maybe add a `:merge` option for things like `hx-indicator`, where you want to merge in parent attribute values?
  * hx-disable needs it too
* Server Actions (Christian)
* Would like to create a new attribute, `hx-config`, which allows a user to override any request config value
  * Consider making `__createRequestConfig` return a pure string-value object, with all non-string setup done in `handleTriggerEvent`, making
    `handleTriggerEvent` the new `htmx.ajax`
  * Would like to organize the `cfg` object better, maybe split request and response stuff into two props, maybe add in `elt` and `evt`?
* head tag merging support?
* Headers: request & response
    * Michael has thoughts on request headers
* Need to make response code handling configurable
* Request security configuration (disallow cross-site requests by default)
* Handling `<script>` tags: should we avoid hoisting all inserted script tags?
* Make prefix configurable via `htmx.config.prefix` defaults to `hx-`
* Optimistic response support (would be easy now)
* Preload support?
* ~~Add in extended selectors (1cg)~~
* ~~Add in custom events like revealed, etc~~ (needs review)
* ~~Add `<partial>` support for SSE & out of band swaps~~
* ~~Add history support~~
  * ~~full refresh every time (no local stuff, htmx has taught us our lesson)~~
* ~~Add explicit inheritances support~~
* ~~Create test infrastructure~~
* ~~Decide how we are going to distinguish public from private API~~
* ~~When should we `preventDefault()` on a triggering event?~~
* ~~trigger modifiers~~
