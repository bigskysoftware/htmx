+++
title = "Javascript API"
description = """\
  This documentation describes the JavaScript API for htmx 4.x, including methods and properties for configuring \
  behavior, working with AJAX requests, event handling, and DOM manipulation. The API provides helper functions \
  primarily intended for extension development and event management."""
+++

<aside class="under-construction">
  <strong>🚧 Pardon our dust 🚧</strong>
  <p>These docs are being updated for htmx 4.0. See <a href="/migration-guide-htmx-4#javascript-api-changes">the migration guide</a> for changes from htmx 2.x.</p>
</aside>

While it is not a focus of the library, htmx does provide a small API of helper methods, intended mainly for [extension development](https://htmx.org/extensions) or for working with [events](@/events.md).

The [hyperscript](https://hyperscript.org) project is intended to provide more extensive scripting support for htmx-based applications.

## Core Methods

### Method - `htmx.ajax()` {#ajax}

Issues an htmx-style AJAX request. This method returns a Promise, so a callback can be executed after the content has been inserted into the DOM.

##### Parameters

* `verb` - 'GET', 'POST', etc.
* `path` - the URL path to make the AJAX request
* `element` - the element to target (defaults to the `body`)

or

* `verb` - 'GET', 'POST', etc.
* `path` - the URL path to make the AJAX request
* `selector` - a selector for the target

or

* `verb` - 'GET', 'POST', etc.
* `path` - the URL path to make the AJAX request
* `context` - a context object that contains any of the following:
    * `source` - the source element of the request
    * `event` - an event that "triggered" the request
    * `handler` - a callback that will handle the response HTML
    * `target` - the target to swap the response into
    * `swap` - how the response will be swapped in relative to the target
    * `values` - values to submit with the request
    * `headers` - headers to submit with the request
    * `select` - allows you to select the content you want swapped from a response
    * `selectOOB` - allows you to select content for out-of-band swaps from a response

##### Example

```js
// issue a GET to /example and put the response HTML into #myDiv
htmx.ajax('GET', '/example', '#myDiv')

// issue a GET to /example and replace #myDiv with the response
htmx.ajax('GET', '/example', {target:'#myDiv', swap:'outerHTML'})

// execute some code after the content has been inserted into the DOM
htmx.ajax('GET', '/example', '#myDiv').then(() => {
  console.log('Content inserted successfully!');
});
```

### Method - `htmx.find()` {#find}

Finds an element matching the selector. Supports extended CSS selectors like `next`, `previous`, `closest`, etc.

##### Parameters

* `selector` - the selector to match

or

* `elt` - the root element to find the matching element in, inclusive
* `selector` - the selector to match

##### Example

```js
// find div with id my-div
var div = htmx.find("#my-div")

// find next div after the current element
var nextDiv = htmx.find(div, "next div")

// find closest parent form
var form = htmx.find(div, "closest form")
```

### Method - `htmx.findAll()` {#findAll}

Finds all elements matching the selector. Supports extended CSS selectors.

##### Parameters

* `selector` - the selector to match

or

* `elt` - the root element to find the matching elements in, inclusive
* `selector` - the selector to match

##### Example

```js
// find all divs
var allDivs = htmx.findAll("div")

// find all paragraphs within a given div
var allParagraphsInMyDiv = htmx.findAll(htmx.find("#my-div"), "p")
```

### Method - `htmx.on()` {#on}

Adds an event listener to an element or the document.

##### Parameters

* `eventName` - the event name to add the listener for
* `listener` - the listener to add

or

* `target` - the element to add the listener to
* `eventName` - the event name to add the listener for
* `listener` - the listener to add

##### Example

```js
// add a click listener to the document
htmx.on("click", function(evt){ console.log(evt); });

// add a click listener to the given div
htmx.on("#my-div", "click", function(evt){ console.log(evt); });

// listen for htmx events
htmx.on("htmx:after:swap", function(evt){
  console.log("Content swapped!", evt.detail);
});
```

### Method - `htmx.onLoad()` {#onLoad}

Adds a callback for the `htmx:after:init` event. This can be used to process new content, for example initializing the content with a javascript library.

##### Parameters

* `callback(elt)` - the callback to call on newly loaded content

##### Example

```js
htmx.onLoad(function(elt){
    MyLibrary.init(elt);
})
```

### Method - `htmx.process()` {#process}

Processes new content, enabling htmx behavior. This can be useful if you have content that is added to the DOM outside of the normal htmx request cycle but still want htmx attributes to work.

##### Parameters

* `elt` - element to process

##### Example

```js
document.body.innerHTML = "<div hx-get='/example'>Get it!</div>"
// process the newly added content
htmx.process(document.body);
```

### Method - `htmx.swap()` {#swap}

Performs swapping of HTML content into the DOM.

##### Parameters

* `target` - the HTML element or string selector of swap target
* `content` - string representation of content to be swapped
* `swapSpec` - swapping specification object with properties:
  * `swapStyle` (required) - swapping style (`innerHTML`, `outerHTML`, `beforebegin` etc)
  * `transition` (bool) - whether to use view transitions for swap
  * `ignoreTitle` (bool) - disables page title updates
  * `scroll`, `show` - specifies scroll handling after swap

##### Example

```js
// swap #output element inner HTML with div element with "Swapped!" text
htmx.swap("#output", "<div>Swapped!</div>", {swapStyle: 'innerHTML'});
```

### Method - `htmx.takeClass()` {#takeClass}

Takes the given class from its siblings (or elements within a container), so that among them, only the given element will have the class.

##### Parameters

* `elt` - the element that will take the class
* `class` - the class to take
* `container` - (optional) the container to search within (defaults to element's parent)

##### Example

```js
// takes the selected class from tab2's siblings
htmx.takeClass(htmx.find("#tab2"), "selected");

// takes the active class from all buttons in the container
htmx.takeClass(htmx.find("#tab2"), "active", htmx.find("#button-group"));
```

### Method - `htmx.trigger()` {#trigger}

Triggers a given event on an element.

##### Parameters

* `elt` - the element to trigger the event on
* `name` - the name of the event to trigger
* `detail` - details for the event

##### Example

```js
// triggers the myEvent event on #tab2 with the answer 42
htmx.trigger("#tab2", "myEvent", {answer:42});
```

## Utility Methods

### Method - `htmx.forEvent()` {#forEvent}

Returns a promise that resolves when the specified event fires. Useful for waiting for specific htmx lifecycle events.

##### Parameters

* `eventName` - the event name to wait for
* `timeout` - (optional) timeout in milliseconds (default: no timeout)

##### Example

```js
// wait for a swap to complete
await htmx.forEvent("htmx:after:swap");
console.log("Swap completed!");

// wait for event with timeout
await htmx.forEvent("htmx:after:swap", 5000);
```

### Method - `htmx.timeout()` {#timeout}

Returns a promise that resolves after the specified time.

##### Parameters

* `ms` - time in milliseconds to wait

##### Example

```js
// wait for 1 second
await htmx.timeout(1000);
console.log("1 second has passed");
```

### Method - `htmx.parseInterval()` {#parseInterval}

Parses an interval string consistent with the way htmx does. Useful for extensions that have timing-related attributes.

##### Parameters

* `str` - timing string (e.g., "100ms", "2s")

##### Example

```js
// returns 3000
var milliseconds = htmx.parseInterval("3s");

// returns 500
var milliseconds = htmx.parseInterval("500ms");
```

## Extension Methods

### Method - `htmx.registerExtension()` {#registerExtension}

Registers a new htmx [extension](https://htmx.org/extensions).

##### Parameters

* `name` - the extension name
* `ext` - the extension definition

##### Example

```js
// defines a simple extension that logs events
htmx.registerExtension("event-logger", {
  init: (api) => {
    // Store API reference if needed
  },
  
  htmx_before_request: (elt, detail) => {
    console.log("Request starting on", elt);
  },
  
  htmx_after_swap: (elt, detail) => {
    console.log("Content swapped!");
  }
});
```

## Configuration

### Property - `htmx.config` {#config}

A property holding the configuration htmx uses at runtime.

Note that using a [meta tag](@/docs.md#configuring-htmx) is the preferred mechanism for setting these properties.

##### Properties

* `logAll` - boolean: if true, htmx will log all events for debugging (default: `false`)
* `prefix` - string: custom prefix for htmx attributes (default: `""`)
* `transitions` - boolean: whether to use view transitions when swapping (default: `false`)
* `history` - boolean: whether to enable history support (default: `true`)
* `historyReload` - boolean: if true, do full reload on history navigation (default: `false`)
* `mode` - string: the fetch mode for AJAX requests (default: `'same-origin'`)
* `defaultSwap` - string: default swap style (default: `'innerHTML'`)
* `indicatorClass` - string: class for indicators (default: `'htmx-indicator'`)
* `requestClass` - string: class for triggering elements during request (default: `'htmx-request'`)
* `includeIndicatorCSS` - boolean: inject indicator CSS (default: `true`)
* `defaultTimeout` - number: default request timeout in ms (default: `60000`)
* `inlineScriptNonce` - string: nonce to add to inline scripts (default: `''`)
* `inlineStyleNonce` - string: nonce to add to inline styles (default: `''`)
* `extensions` - string: comma-separated list of extensions to load (default: `''`)
* `sse` - object: SSE/streaming configuration properties:
  * `reconnect` - boolean: whether to reconnect on disconnect (default: `false`)
  * `reconnectMaxAttempts` - number (default: `10`)
  * `reconnectDelay` - number in ms (default: `500`)
  * `reconnectMaxDelay` - number in ms (default: `60000`)
  * `reconnectJitter` - number: jitter factor for reconnect delay (default: `0.3`)
  * `pauseInBackground` - boolean (default: `false`)
* `morphIgnore` - array: attribute names to ignore when morphing (default: `["data-htmx-powered"]`)
* `noSwap` - array: HTTP status codes that should not trigger a swap (default: `[204, 304]`)
* `implicitInheritance` - boolean: inherit attributes automatically without `:inherited` (default: `false`)
* `metaCharacter` - string: custom character for attribute modifiers instead of `:` (default: `undefined`)
* `version` - string: the version of the current htmx library

##### Example

```js
// enable debug logging
htmx.config.logAll = true;

// change default swap to outerHTML
htmx.config.defaultSwap = 'outerHTML';

// set custom attribute prefix
htmx.config.prefix = 'data-hx-';

// configure SSE streams
htmx.config.streams = {
  reconnect: true,
  reconnectMaxAttempts: 10,
  reconnectDelay: 1000
};
```

## Deprecated / Removed Methods

The following methods from htmx 2.x have been removed in htmx 4.x. Use the native browser equivalents:

* `htmx.addClass()` - use `element.classList.add()`
* `htmx.removeClass()` - use `element.classList.remove()`
* `htmx.toggleClass()` - use `element.classList.toggle()`
* `htmx.closest()` - use `element.closest()`
* `htmx.remove()` - use `element.remove()`
* `htmx.logAll()` - set `htmx.config.logAll = true`
* `htmx.logNone()` - set `htmx.config.logAll = false`
* `htmx.logger` - use browser DevTools
* `htmx.off()` - use `removeEventListener()`
* `htmx.removeExtension()` - extensions are event-based, no removal needed
* `htmx.values()` - access FormData directly
* `htmx.createEventSource` - removed (SSE is built-in)
* `htmx.createWebSocket` - removed (use extensions)

See the [migration guide](/migration-guide-htmx-4#javascript-api-changes) for more details on migrating from htmx 2.x to 4.x.