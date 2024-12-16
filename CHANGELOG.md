# Changelog

## [2.0.4] - 2024-12-13

* Calling `htmx.ajax` with no target or source now defaults to body (previously did nothing)
* Nested [shadow root](https://github.com/bigskysoftware/htmx/commit/5ab508f6523a37890932176f7dc54be9f7a281ff) fix
* The `htmx:trigger` event now properly fires on the synthetic `load` event
* The synthetic `load` event will not be re-called when an element is reinitialized via `htmx.process()`
* Boosted `<form>` tags that issue a `GET` with no or empty `action` attributes will properly replace all existing query 
  parameters
* Events that are triggered on htmx-powered elements located outside a form, but that refer to a form via the`form` 
  attribute, now properly cancel the submission of the referred-to form
* Extension Updates
  * `preload` extension was 
    [completely reworked](https://github.com/bigskysoftware/htmx-extensions/commit/fb68dfb48063505d2d7420d717c24ac9a8dae244) 
    by @marisst to be compatible with `hx-boost`, not cause side effect, etc. Thank you!
  * `response-targets` was updated to not use deprecated methods
  * A [small fix](https://github.com/bigskysoftware/htmx-extensions/commit/e87e1c3d0bf728b4e43861c7459f3f937883eb99) to
    `ws` to avoid an error when closing in some cases
  * The `head-support` extension was updated to work with the `sse` extension

## [2.0.3] - 2024-10-03
* Added support for the experimental `moveBefore()` functionality in [Chrome Canary](https://www.google.com/chrome/canary/), 
  see the [demo page](/examples/move-before) for more information.
* Fixed `revealed` event when a resize reveals an element
* Enabled `hx-preserve` in oob-swaps
* Better degredation of `hx-boost` on forms with query parameters in their `action`
* Improved shadowRoot support
* Many smaller bug fixes
* Moved the core extension documentation back to <https://htmx.org/extensions>

## [2.0.2] - 2024-08-12
* no longer boost forms of type `dialog`
* properly trigger the `htmx:trigger` event when an event is delayed or throttled
* file upload is now fixed
* empty templates that are not used for oob swaps are no longer removed from the DOM
* request indicators are not removed when a full page redirect or refresh occurs
* elements that have been disabled for a request are properly re-enabled before snapshotting for history
* you can now trigger events on other elements using the `HX-Trigger` response header
* The `.d.ts` file should now work properly

## [2.0.1] - 2024-07-12

* Make the `/dist/htmx.esm.js` file the `main` file in `package.json` to make installing htmx smoother
* Update `htmx.d.ts` & include it in the distribution
* A fix to avoid removing text-only templates on htmx cleanup
* A fix for outerHTML swapping of the `body` tag
* Many docs fixes

## [2.0.0] - 2024-06-17

* Removed extensions and moved to their own repos linked off of <https://extensions.htmx.org>
* The website now supports dark mode! (Thanks [@pokonski](https://github.com/pokonski)!)
* The older, deprecated [SSE & WS](https://v1.htmx.org/docs/#websockets-and-sse) attributes were removed
* Better support for [Web Components & Shadow DOM](https://htmx.org/examples/web-components/)
* HTTP `DELETE` requests now use parameters, rather than form encoded bodies, for their payload (This is in accordance w/ the spec.)
* Module support was split into different files:
* We now provide specific files in `/dist` for the various JavaScript module styles:
  * ESM Modules: `/dist/htmx.esm.js`
  * AMD Modules: `/dist/htmx.amd.js`
  * CJS Modules: `/dist/htmx.cjs.js`
  * The `/dist/htmx.js` file continues to be browser-loadable
* The `hx-on` attribute, with its special syntax, has been removed in favor of the less-hacky `hx-on:` syntax.
* See the [Upgrade Guide](https://htmx.org/migration-guide-htmx-1/) for more details on upgrade steps
* The `selectAndSwap()` internal API method was replaced with the public (and much better) [`swap()`](/api/#swap) method

## [1.9.12] - 2024-04-17

* [IE Fixes](https://github.com/bigskysoftware/htmx/commit/e64238dba3113c2eabe26b1e9e9ba7fe29ba3010)

## [1.9.11] - 2024-03-15

* Fix for new issue w/ web sockets & SSE on iOS 17.4 (thanks apple!)
* Fix for double script execution issue when using template parsing
* Fix TypeScript types file
* Fix SSE Ext: reinstantiate EventSource listeners upon reconnection logic (#2272)
    
## [1.9.10] - 2023-12-21

* `hx-on*` attributes now support the form `hx-on-`, with a trailing dash, to better support template systems (such as EJS)
  that do not like double colons in HTML attributes.
* Added an `htmx.config.triggerSpecsCache` configuration property that can be set to an object to cache the trigger spec parsing
* Added a `path-params.js` extension for populating request paths with variable values
* Many smaller bug fixes & improvements

## [1.9.9] - 2023-11-21

* Allow CSS selectors with whitespace in attributes like `hx-target` by using parens or curly-braces
* Properly allow users to override the `Content-Type` request header
* Added the `select` option to `htmx.ajax()`
* Fixed a race condition in readystate detection that lead to htmx not being initialized in some scenarios with 3rd
  party script loaders
* Fixed a bug that caused relative resources to resolve against the wrong base URL when a new URL is pushed
* Fixed a UI issue that could cause indicators to briefly flash

## [1.9.8] - 2023-11-06

* Fixed a few npm & build related issues

## [1.9.7] - 2023-11-03

* Fixed a bug where a button associated with a form that is swapped out of the DOM caused errors
* The `hx-target-error` attribute was added to the `response-targets` extension, allowing you to capture all 400 & 500
  responses with a single attribute
* `hx-on` now properly supports multiple listeners
* The `hx-confirm` prompt is now passed into custom confirmation handlers
* `next` and `previous` are now valid _extended CSS_ symbols in htmx
* The `htmx:beforeHistoryUpdate` event was added
* Properly ignore the `dialog` formmethod on buttons when resolving the HTTP method to use
* Added a `htmx.config.scrollIntoViewOnBoost` option that may be set to `false` to disable scrolling the top of the
  body into view for boosted elements

## [1.9.6] - 2023-09-22

* IE support has been restored (thank you @telroshan!)
* Introduced the `hx-disabled-elt` attribute to allow specifying elements to disable during a request
* You can now explicitly decide to ignore `title` tags found in new content via the `ignoreTitle` option in `hx-swap` and the `htmx.config.ignoreTitle` configuration variable.
* `hx-swap` modifiers may be used without explicitly specifying the swap mechanism
* Arrays are now supported in the `client-side-templates` extension
* XSLT support in the `client-side-templates` extension
* Support `preventDefault()` in extension event handling
* Allow the `HX-Refresh` header to apply even after an `HX-Redirect` has occurred
* the `formaction` and `formmethod` attributes on buttons are now properly respected
* `hx-on` can now handle events with dots in their name
* `htmx.ajax()` now always returns a Promise
* Handle leading `style` tag parsing more effectively

## [1.9.5] - 2023-08-25

* Web sockets now properly pass the target id in the HEADERS struct
* A very rare loading state bug was fixed (see https://github.com/bigskysoftware/htmx/commit/93bd81b6d003bb7bc445f10192bdb8089fa3495d)
* `hx-on` will not evaluate if `allowEval` is set to false
* You can disable the interpretation of script tags with the new `htmx.config.allowScriptTags` config variable
* You can now disable htmx-based requests to non-origin hosts via the `htmx.config.selfRequestsOnly` config variable
* The [Security](https://htmx.org/docs#security) section has been expanded to help developers better understand how to
  properly secure their htmx-based applications.

## [1.9.4] - 2023-07-25

* This is a bug-fix release for the most part, w/a heavy dose of @telroshan
* The `HX-Trigger` response header now supports comma separated event names
* Submit buttons that use the `form` attribute now work correctly
* The `changed` modifier now uses the triggering element, rather than the element the `hx-trigger` is defined on
* `hx-disable` is now handled dynamically so it can be added and removed
* IE11 compatibility restored! (maybe, hard to test)
* Fixed bug with `hx-on` event handler cleanup
* Many smaller bug fixes, typo fixes and general improvements

## [1.9.3] - 2023-07-14

* The `hx-on` attribute has been deprecated (sorry) in favor of `hx-on:<event name>` attributes.  See [`hx-on`](/attributes/hx-on) for more information.
* We now have functioning CI using GitHub actions!
* You can now configure if a type of HTTP request uses the body for parameters or not.  In particular, the `DELETE` _should_ use
  query parameters, according to the spec.  htmx has used the body, instead.  To avoid breaking code we are keeping this undefined
  behavior for now, but allowing people to fix it for their use cases by updating the `htmx.config.methodsThatUseUrlParams` config
  option.  Thank you to Alex and Vincent for their feedback and work on this issue!
* The `this` symbol is now available in event filter expressions, and refers to the element the `hx-trigger` is on
* Fix bug where the `htmx:afterSettle` event was raised multiple times with oob swaps occurred
* A large number of accessibility fixes were made in the docs (Thank you Denis & crew!)
* Fixed bug w/ WebSocket extension initialization caused by "naked" `hx-trigger` feature
* The `HX-Reselect` HTTP response header has been added to change the selection from the returned content
* Many other smaller bug fixes

## [1.9.2] - 2023-04-28

* Fixed bug w/ `hx-on` not properly de-initializing

## [1.9.1] - 2023-04-27

* Fixed a bug with the new naked triggers that prevented boosted elements with explicit `hx-trigger`'s from functioning
  properly
* Added code to play well with other libraries that also use the `window.onpopstate` Daily reminder: <https://htmx.org/img/memes/javascripthistory.png>

## [1.9.0] - 2023-04-11

* Support for generalized inline event handling via the new [`hx-on`](/attributes/hx-on) attribute, which addresses
  the shortcoming of limited [`onevent` properties](https://developer.mozilla.org/en-US/docs/Web/Events/Event_handlers#using_onevent_properties) attributes in HTML.
* Support for [view transitions](/docs#view-transitions), based on the experimental [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
  currently available in Chrome 111+ and coming to other browsers soon.
* Support for "naked" [`hx-trigger`](/attributes/hx-trigger) attributes, where an `hx-trigger` is present on an element
  that does not have an `hx-get`, etc. defined on it.  Instead, it will trigger the new `htmx:triggered` event, which can
  be responded to via your [preferred scripting solution](/docs#scripting).
* A memory leak fix by [@croxton](https://github.com/bigskysoftware/htmx/commit/8cd3a480a7388877628ce8b9b8e50cd5df48bb81)
* The htmx website has been migrated from 11ty to [zola](https://www.getzola.org/) by [@danieljsummers](https://github.com/danieljsummers), cutting
  way down on the number of "development" javascript dependencies
* Many other smaller bug fixes

## [1.8.6] - 2023-03-02

* ESM support!
* Sass has been vanquished from the htmx.org website, which should set us up for some good progress going forward
* Fixed a bug where the `changed` modifier on `keyup` did not work properly if an input was tabbed into
* Many other smaller bug fixes and doc fixes

## [1.8.5] - 2023-01-17

* Support a new optional cache-busting configuration option, `getCacheBusterParam`, to allow browsers to disambiguate
  between `GET` requests from htmx and from the raw browser
* Support new `hx-history='false'` attribute, to prevent sensitive data from being stored in the history cache. (Thank you @croxton!)
* Extensive new event-oriented features are available in the [Web Socket](/extensions/web-sockets/) extension (Thank you @Renerick!)
* A bug fix for when a form contains multiple empty input values with the same name (Thank you @bluekeyes!)
* A bug fix around inputs that throw exceptions when calling `setSelectionRange()` (Thank you @gone!)
* A bug fix to pass through the proper event for the `htmx:configRequest` event
* A bug fix/improvement for the `preload` extension
* Many other small bug fixes 

## [1.8.4] - 2022-11-05

* Fix the _exact same_ regression in `revealed` logic as in 1.8.2 

## [1.8.3] - 2022-11-04

* A new [`htmx:confirm` event](/events#htmx:confirm) was added that allows for asynchronous confirmation dialogs to 
  be integrated into htmx requests
* The new [head-support](/extensions/head-support) extension allows for more elaborate head tag merging than standard htmx
  supports.  This functionality may be integrated into htmx 2.0, depending on feedback.
* The new [multi-swap](/extensions/multi-swap) provides more elaborate swapping of multiple elements on a screen using
  a custom swap strategy
* Many doc fixes (thank you to everyone who contributed!)

## [1.8.2] - 2022-10-12

* Fix regression in `revealed` logic

## [1.8.1] - 2022-10-11

* We now keep a count of outstanding requests for an indicator, so more than one overlapping request can share the same
  indicator without issues
* We now track the attribute state of an element and re-initialize it if `htmx.process()` is called on the element and
  the attributes have changed
* [Idiomorph](https://github.com/bigskysoftware/idiomorph) is now available for all your morph-swapping needs
* The `unset` directive now works properly for `hx-vals` and `hx-vars`
* The title of the page is now properly set on a history cache miss
* The new [`hx-validate`](https://htmx.org/attributes/hx-validate) attribute will force elements to validate before a request, even if
  they are not within a form being submitted
* Many smaller bug and docs fixes

## [1.8.0] - 2022-7-12

* **NOTE**: This release involved some changes to touchy code (e.g. history support) so please test thoroughly and let
  us know if you see any issues
* Boosted forms now will automatically push URLs into history as with links.  The [response URL](https://caniuse.com/mdn-api_xmlhttprequest_responseurl) 
  detection API support is good enough that we feel comfortable making this the default now. 
  * If you do not want this behavior you can add `hx-push-url='false'` to your boosted forms
* The [`hx-replace-url`](https://htmx.org/attributes/hx-replace-url) attribute was introduced, allowing you to replace
  the current URL in history (to complement `hx-push-url`)
* Bug fix - if htmx is included in a page more than once, we do not process elements multiple times
* Bug fix - When localStorage is not available we do not attempt to save history in it
* [Bug fix](https://github.com/bigskysoftware/htmx/issues/908) - `hx-boost` respects the `enctype` attribute
* `m` is now a valid timing modifier (e.g. `hx-trigger="every 2m"`)
* `next` and `previous` are now valid extended query selector modifiers, e.g. `hx-target="next div"` will target the
  next div from the current element
* Bug fix - `hx-boost` will boost anchor tags with a `_self` target
* The `load` event now properly supports event filters
* The websocket extension has had many improvements: (A huge thank you to Denis Palashevskii, our newest committer on the project!)
  * Implement proper `hx-trigger` support
  * Expose trigger handling API to extensions
  * Implement safe message sending with sending queue
  * Fix `ws-send` attributes connecting in new elements
  * Fix OOB swapping of multiple elements in response
* The `HX-Location` response header now implements client-side redirects entirely within htmx
* The `HX-Reswap` response header allows you to change the swap behavior of htmx
* The new [`hx-select-oob`](https://htmx.org/attributes/hx-select-oob) attribute selects one or more elements from a server response to swap in via an out of band swap
* The new [`hx-replace-url`](https://htmx.org/attributes/hx-replace-url) attribute can be used to replace the current URL in the location 
  bar (very similar to `hx-push-url` but no new history entry is created).  The corresponding `HX-Replace-Url` response header can be used as well.
* htmx now properly handles anchors in both boosted links, as well as in `hx-get`, etc. attributes

## [1.7.0] - 2022-02-22

* The new [`hx-sync`](https://htmx.org/attributes/hx-sync) attribute allows you to synchronize multiple element requests on a single
  element using various strategies (e.g. replace)
  * You can also now abort an element making a request by sending it the `htmx:abort` event
* [Server Sent Events](/extensions/server-sent-events) and [Web Sockets](/extensions/web-sockets) are now available as 
  extensions, in addition to the normal core support.  In htmx 2.0, the current `hx-sse` and `hx-ws` attributes will be
  moved entirely out to these new extensions.  By moving these features to extensions we will be able to add functionality 
  to both of them without compromising the core file size of htmx.  You are encouraged to move over to the new 
  extensions, but `hx-sse` and `hx-ws` will continue to work indefinitely in htmx 1.x.
* You can now mask out [attribute inheritance](/docs#inheritance) via the [`hx-disinherit`](https://htmx.org/attributes/hx-disinherit) attribute.
* The `HX-Push` header can now have the `false` value, which will prevent a history snapshot from occurring.
* Many new extensions, with a big thanks to all the contributors!
    * A new [`alpine-morph`](/extensions/alpine-morph) allows you to use Alpine's swapping engine, which preserves Alpine
    * A [restored](/extensions/restored) extension was added that will trigger a `restore` event on all elements in the DOM
      on history restoration.
    * A [loading-states](/extensions/loading-states) extension was added that allows you to easily manage loading states
      while a request is in flight, including disabling elements, and adding and removing CSS classes. 
* The `this` symbol now resolves properly for the [`hx-include`](https://htmx.org/attributes/hx-include) and [`hx-indicator`](https://htmx.org/attributes/hx-indicator)
  attributes
* When an object is included via the [`hx-vals`](https://htmx.org/attributes/hx-vals) attribute, it will be converted to JSON (rather 
  than rendering as the string `[Object object]"`)
* You can now pass a swap style in to the `htmx.ajax()` function call.
* Poll events now contain a `target` attribute, allowing you to filter a poll on the element that is polling.
* Two new Out Of Band-related events were added: `htmx:oobBeforeSwap` & `htmx:oobAfterSwap`

## [1.6.1] - 2021-11-22

* A new `HX-Retarget` header allows you to change the default target of returned content
* The `htmx:beforeSwap` event now includes another configurable property: `detail.isError` which can
  be used to indicate if a given response should be treated as an error or not
* The `htmx:afterRequest` event has two new detail properties: `success` and `failed`, allowing you to write 
  trigger filters in htmx or hyperscript:
  ```applescript
    on htmx:afterRequest[failed]
      set #myCheckbox's checked to true
  ```
* Fixed the `from:` option in [`hx-trigger`](https://htmx.org/attributes/hx-trigger) to support `closest <CSS selector>` 
  and `find <CSS selector>` forms
* Don't boost anchor tags with an explicit `target` set
* Don't cancel all events on boosted elements, only the events that naturally trigger them (click for anchors, submit
  for forms)
* Persist revealed state in the DOM so that on history navigation, revealed elements are not re-requested
* Process all [`hx-ext`](https://htmx.org/attributes/hx-ext) attributes, even if no other htmx attribute is on the element
* Snapshot the current URL on load so that history support works properly after a page refresh occurs
* Many, many documentation updates (thank you to all the contributors!)


## [1.6.0] - 2021-10-01

* Completely reworked `<script>` tag support that now supports the `<script src="...'/>` form
* You can now use the value `unset` to clear a property that would normally be inherited (e.g. hx-confirm)
* The `htmx-added` class is added to new content before a swap and removed after the settle phase, which allows you
  more flexibility in writing CSS transitions for added content (rather than relying on the target, as with `htmx-settling`)
* The `htmx:beforeSwap` event has been updated to allow you to [configure swapping](https://htmx.org/docs/#modifying_swapping_behavior_with_events)
  behavior
* Improved `<title>` extraction support
* You can listen to events on the `window` object using the `from:` modifier in `hx-trigger`
* The `root` option of the `intersect` event was fixed
* Boosted forms respect the `enctype` declaration
* The `HX-Boosted` header will be sent on requests from boosted elements
* Promises are not returned from the main ajax function unless it is an api call (i.e. `htmx.ajax`)

## [1.5.0] - 2021-7-12

* Support tracking of button clicked during a form submission
* Conditional polling via the [hx-trigger](https://htmx.org/attributes/hx-trigger) attribute
* `document` is now a valid pseudo-selector on the [hx-trigger](https://htmx.org/attributes/hx-trigger) `from:` argument, allowing you
  to listen for events on the document.
* Added the [hx-request](https://htmx.org/attributes/hx-request) attribute, allowing you to configure the following aspects of the request
    * `timeout` - the timeout of the request
    * `credentials` - if the request will send credentials
    * `noHeaders` - strips all headers from the request
* Along with the above attribute, you can configure the default values for each of these via the corresponding `htmx.config`
  properties (e.g. `htmx.config.timeout`)
* Both the `scroll` and `show` options on [hx-swap](https://htmx.org/attributes/hx-swap) now support extended syntax for selecting the
  element to scroll or to show, including the pseudo-selectors `window:top` and `window:bottom`.

## [1.4.1] - 2021-6-1

* typo fix

## [1.4.0] - 2021-5-25

* Added the `queue` option to the [hx-trigger](https://htmx.org/attributes/hx-trigger) attribute, allowing you to specify how events
  should be queued when they are received with a request in flight
* The `htmx.config.useTemplateFragments` option was added, allowing you to use HTML template tags for parsing content
  from the server.  This allows you to use Out of Band content when returning things like table rows, but it is not
  IE11 compatible.
* The `defaultSettleDelay` was dropped to 20ms from 100ms
* Introduced a new synthetic event, [intersect](https://htmx.org/docs#pecial-events) that allows you to trigger when an item is scrolled into view
  as specified by the `IntersectionObserver` API
* Fixed timing issue that caused exceptions in the `reveal` logic when scrolling at incredible speeds - <https://github.com/bigskysoftware/htmx/issues/463>
* Fixed bug causing SVG titles to be incorrectly used as page title - <https://github.com/bigskysoftware/htmx/issues/459>
* Boosted forms that issue a GET will now push the URL by default - <https://github.com/bigskysoftware/htmx/issues/485>
* Better dispatch of request events when an element is removed from the DOM
* Fixed a bug causing `hx-prompt` to fail
* The `htmx.config.withCredentials` option was added, to send credentials with ajax requests (default is `false`)
* The `throttle` option on `hx-trigger` does not delay the initial request any longer
* The `meta` key is ignored on boosted links
* `<script>` tags are now evaluated in the global scope
* `hx-swap` now supports the `none` option
* Safari text selection bug - <https://github.com/bigskysoftware/htmx/issues/438>
  
## [1.3.3] - 2021-4-5

* Added the [`hx-disabled`](https://htmx.org/docs#security) attribute to allow htmx to be turned off for parts of the DOM
* SSE now uses a full-jitter exponential backoff algorithm on reconnection, using the `htmx.config.wsReconnectDelay`
  setting

## [1.3.2] - 2021-3-9

* Bug fixes

## [1.3.1] - 2021-3-9

* IE11 fixes

## [1.3.0] - 2021-3-6

* Support a `target` modifier on `hx-trigger` to filter based on the element targeted by an event.  This allows
  lazy binding to that target selector.
* Events are no longer consumed by the first element that might handle them, unless the `consume` keyword is
  added to the `hx-trigger` specification
* Added the `htmx:beforeSend` event, fired just before an ajax request begins
* SSE swaps are properly settled
* Fixed bug that was improperly cancelling all clicks on anchors
* `htmx.ajax()` now returns a promise

## [1.2.1] - 2021-2-19

* Fixed an issue with the history cache, where the cache was getting blown out after the first navigation backwards
* Added the `htmx.config.refreshOnHistoryMiss` option, allowing users to trigger a full page refresh on history cache miss
  rather than issuing an AJAX request

## [1.2.0] - 2021-2-13

### New Features

* `hx-vars` has been deprecated in favor of `hx-vals`
* `hx-vals` now supports a `javascript:` prefix to achieve the behavior that `hx-vars` provided
* The new `hx-headers` attribute allows you to add headers to a request via an attribute.  Like `hx-vals` it supports
  JSON or javascript via the `javascript:` prefix
* `hx-include` will now include all inputs under an element, even if that element is not a form tag
* The [preload extension](https://htmx.org/extensions/preload/) now offers a `preload-images="true"` attribute that will aggressively load images in preloaded content
* On requests driven by a history cache miss, the new `HX-History-Restore-Request` header is included so that the server
  can differentiate between history requests and normal requests 

### Improvements & Bug fixes

* Improved handling of precedence of input values to favor the enclosing form (see [here](https://github.com/bigskysoftware/htmx/commit/a10e43d619dc340aa324d37772c06a69a2f47ec9))
* Moved event filtering logic *after* `preventDefault` so filtering still allows events to be properly handled
* No longer trigger after swap events on elements that have been removed via an `outerHTML` swap
* Properly remove event handlers added to other elements when an element is removed from the DOM
* Handle the `scroll:` modifier in `hx-swap` properly when an `outerHTML` swap occurs
* Lots of docs fixes

## [1.1.0] - 2021-1-6

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
