# TODOs

* Are we gonna support a morph swap out of the box?
* Are we going to support CSS transitions? (at least a simple version, wait on transition events?)
  * We could say just use morph
* Support `hx-action="js:..."` and `js:` or `javascript:` broadly
  * Allow users to turn off eval
* Need to make 203 - No Content not do the main swap once swapping settles down (lol)
* quirks.js implementation
  * Move deprecated features into quirks.js?
    * out of band swaps?
    * out of band selects?
  * ~~revert to `innerHTML` swap~~
  * ~~revert to htmx 2.0 attribute resolution~~
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
  * Headers: request & response
      * Michael has thoughts on request headers
* I think we need to add the `htmx-request` to the element making the request as well as the indicators
* Current `__resolveSwapEventTarget` logic is wrong: we should instead capture the parent hierarchy before swap and always
  dispatch the event on the element and, if it is disconnected, dispatch it again on the first connected parent
* Add a `:merge` option for things like `hx-indicator`, where you want to merge in parent attribute values?
  * hx-disable needs it too
* Server Actions (Christian)
* head tag merging support?  or keep as extension?
* Need to make response code handling configurable (telroshan)
* Request security configuration (disallow cross-site requests by default)
* Handling `<script>` tags: should we avoid hoisting all inserted script tags?
* Make attribute prefix configurable via `htmx.config.prefix` defaults to `hx-`
* ~~Optimistic response support (would be easy now)~~
* ~~Preload support?~~
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
