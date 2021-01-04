# Changelog


## [1.1.0] - 2021-1-8

* Newly added [preload extension](https://htmx.org/extensions/preload/) allows you to preload resources for lower
  latency requests!
* Support the `ignore:` modifier for extensions
* Updated form variable order inclusion to include the enclosing form *last* so that, in the presence of multiple 
  values, the most relevant value is the most likely to be selected by the server
* Support for the [`htmx.ajax()`](https://dev.htmx.org/api/#ajax) javascript function, to issue an htmx-style ajax 
  request from javascript
* Removed the following htmx request headers for better cache behavior: `HX-Event-Target`, `HX-Active-Element`, 
  `HX-Active-Element-Name`, `HX-Active-Element-Value`
* Added the [`hx-preserve`](https://dev.htmx.org/attributes/hx-preserve) attribute, which allows 
  you to preserve elements across requests (for example, to keep a video element playing properly)
* The [path-deps](https://dev.htmx.org/extensions/path-deps/#refresh) now surfaces a small api
  for refreshing path dependencies manually in javascript
* Now support the `from:` clause on [`hx-trigger`](https://dev.htmx.org/attributes/hx-trigger) to
  allow an element to respond to events on other elements.
* Added the `htmx:beforeProcessNode` event, renamed the (previously undocumented) `htmx:processedNode` to `htmx:afterProcessNode`
* Added `closest` syntax support for the [`hx-indicator`](https://dev.htmx.org/attributes/hx-indicator) attribute
* Added `on load` support for the newest version of [hyperscript](https://hyperscript.org)
* Added the `htmx.config.allowEval` configuration value, for CSP compatibility
* Bug fixes & improvements 
  
## [1.0.2] - 2020-12-12

* Extend all API methods to take a string selector as well as an element
* Out of band swap elements need not be top level now
* [`hx-swap-oob`](https://htmx.org/attributes/hx-swap-oob) now can accept a CSS selector to retarget with

## [1.0.1] - 2020-12-04

* AJAX file upload now correctly fires events, allowing for [a proper progress bar](https://htmx.org/examples/file-upload)
* htmx api functions that expect an element now can accept a string selector instead:
   ```js
    htmx.on('#form', 'htmx:xhr:progress', function(evt) {
      htmx.find('#progress').setAttribute('value', evt.detail.loaded/evt.detail.total * 100)
    });
   ```
* htmx now properly handles the `multiple` attribute on `<select>` elements

## [1.0.0] - 2020-11-24

* Bumped the release version :)

## [0.4.1] - 2020-11-23

* Fixed bug with title tag support when title tag contained HTML entities
* Pass properties for the `loadstart`, `loadend`, `progress`, `abort` events through properly to the htmx equivalents

## [0.4.0] - 2020-11-16

* Now support the `HX-Redirect` and `HX-Refresh` response headers for redirecting client side and triggering a page refresh, respectively
* `hx-vars` now overrides input values
* `<title>` tags in responses will be used to update page titles
* All uses of `eval()` have been removed in favor of `Function`
* [`hx-vals`](https://htmx.org/attributes/hx-vals) is available as a safe alternative to `hx-vars`.  It uses `JSON.parse()` rather than evaluation, if you wish to safely pass user-provided values through to htmx.

## [0.3.0] - 2020-10-27

* `hx-trigger` parsing has been rewritten and now supports [trigger filters](https://htmx.org/docs/#trigger-filters) to filter
  events based on arbitrary javascript expressions
* htmx now supports two additional response headers `HX-Trigger-After-Swap` and `HX-Trigger-After-Settle` allowing
  an event to be triggered after a given life cycle event (instead of before the swap)
* The `requestConfig` is now passed out to events surrounding the AJAX life cycle
* htmx now evaluates `<script>` tags as javascript when no language is defined on them
* A new [`event-header`](https://htmx.org/extensions/event-header) extension, which will include a serialized JSON representation of the triggering event in requests
  
## [0.2.0] - 2020-9-30

* AJAX file upload [support](https://htmx.org/docs#files)
* The HTML validation API is [respected](https://htmx.org/docs#validation)

## [0.1.0] - 2020-9-18

* *BREAKING CHANGE*: The SSE attribute [`hx-sse`](https://htmx.org/attributes/hx-sse/) and the Web Sockets attribute [`hx-ws`](https://htmx.org/attributes/hx-ws) have changed syntax to now use colon separators: `hx-sse='connect:/chat swap:message'`
* The SSE attribute [`hx-sse`](https://htmx.org/attributes/hx-sse/) allows for swapping content directly on an event, in addition to triggering an htmx element,
with the new `swap:<event name>` syntax.
* [`hx-target`](https://htmx.org/attributes/hx-target) now supports a `find` syntax to find elements below the element by a CSS selector
* htmx plays better with deferred loading and many package managers
* All htmx events are dispatched in both camelCase as well as kebab-case, for better compatibility with AlpineJS and other frameworks.  (e.g. `htmx:afterOnLoad` will also be triggered as
`htmx:after-on-load`)
* [hypeerscript](https://hyperscript.org) is now initialized independently of htmx

## [0.0.8] - 2020-7-8

* The `view` modifier on `hx-swap` has been renamed to `show`: `hx-swap='innerHTML show:top'`

## [0.0.7] - 2020-6-30

* The [`hx-swap`](https://htmx.org/attributes/hx-swap) attribute now supports two new modifiers:
    * `scroll` - allows you to scroll the target to the `top` or `bottom`
    * `view` - allows you to scroll the `top` or `bottom` of the target into view
* The [`hx-push-url`](https://htmx.org/attributes/hx-push-url) attribute now can optionally take a URL to push, in addition to `true` and `false`
* Added the [`hx-vars`](https://htmx.org/attributes/hx-vars) attribute that allows you to dynamically add to the parameters that will be submitted with a request

## [0.0.6] - 2020-6-20

* Custom request/response headers no longer start with the `X-` prefix, which is no longer recommended
* empty verb attributes are now allowed and follow the anchor tag semantics (e.g. `<div hx-get></div>`)
* nunjuks inline rendering is now supported in the `client-side-templates` extension
* the new `ajax-header` extension includes the `X-Requested-With` header
* bad JSON is now handled more gracefully
* `hx-swap="none"` will cause no swap to take place <https://github.com/bigskysoftware/htmx/issues/89>
* `hx-trigger` now supports a `throttle` modifier <https://github.com/bigskysoftware/htmx/issues/88>
* the focused element is preserved if possible after a replacement
* perf improvements for large DOM trees with sparse `hx-` annotations

## [0.0.4] - 2020-5-24

* Extension mechanism added
* SSE support added
* WebSocket support added

## [0.0.3] - 2020-5-17

* Renamed to htmx
* A bug fix for the `hx-prompt` attribute
* A bug fix for multiple `hx-swap-oob` attributes
* Moved the default CSS indicator injection into its own sheet to avoid breaking
* Added the `htmx.config.includeIndicatorStyles` configuration option so people can opt out of injecting the indicator CSS


## [0.0.1] - 2020-5-15

* Initial release (originally named kutty)
