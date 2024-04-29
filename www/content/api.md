+++
title = "Javascript API"
+++

While it is not a focus of the library, htmx does provide a small API of helper methods, intended mainly for [extension development](@/extensions/_index.md) or for working with [events](@/events.md).

The [hyperscript](https://hyperscript.org) project is intended to provide more extensive scripting support
for htmx-based applications.

### Method - `htmx.addClass()` {#addClass}

This method adds a class to the given element.

##### Parameters

* `elt` - the element to add the class to
* `class` - the class to add

or

* `elt` - the element to add the class to
* `class` - the class to add
* `delay` - delay (in milliseconds ) before class is added

##### Example

```js
  // add the class 'myClass' to the element with the id 'demo'
  htmx.addClass(htmx.find('#demo'), 'myClass');

  // add the class 'myClass' to the element with the id 'demo' after 1 second
  htmx.addClass(htmx.find('#demo'), 'myClass', 1000);
```

### Method - `htmx.ajax()` {#ajax}

Issues an htmx-style AJAX request. This method returns a Promise, so a callback can be executed after the content has been inserted into the DOM.

##### Parameters

* `verb` - 'GET', 'POST', etc.
* `path` - the URL path to make the AJAX
* `element` - the element to target (defaults to the `body`)

or

* `verb` - 'GET', 'POST', etc.
* `path` - the URL path to make the AJAX
* `selector` - a selector for the target

or

* `verb` - 'GET', 'POST', etc.
* `path` - the URL path to make the AJAX
* `context` - a context object that contains any of the following
    * `source` - the source element of the request
    * `event` - an event that "triggered" the request
    * `handler` - a callback that will handle the response HTML
    * `target` - the target to swap the response into
    * `swap` - how the response will be swapped in relative to the target
    * `values` - values to submit with the request
    * `headers` - headers to submit with the request
    * `select` - allows you to select the content you want swapped from a response

##### Example

```js
    // issue a GET to /example and put the response HTML into #myDiv
    htmx.ajax('GET', '/example', '#myDiv')

    // issue a GET to /example and replace #myDiv with the response
    htmx.ajax('GET', '/example', {target:'#myDiv', swap:'outerHTML'})

    // execute some code after the content has been inserted into the DOM
    htmx.ajax('GET', '/example', '#myDiv').then(() => {
      // this code will be executed after the 'htmx:afterOnLoad' event,
      // and before the 'htmx:xhr:loadend' event
      console.log('Content inserted successfully!');
    });

```

### Method - `htmx.closest()` {#closest}

Finds the closest matching element in the given elements parentage, inclusive of the element

##### Parameters

* `elt` - the element to find the selector from
* `selector` - the selector to find

##### Example

```js
  // find the closest enclosing div of the element with the id 'demo'
  htmx.closest(htmx.find('#demo'), 'div');
```

### Property - `htmx.config` {#config}

A property holding the configuration htmx uses at runtime.

Note that using a [meta tag](@/docs.md#config) is the preferred mechanism for setting these properties.

##### Properties

* `attributesToSettle:["class", "style", "width", "height"]` - array of strings: the attributes to settle during the settling phase
* `refreshOnHistoryMiss:false` - boolean: if set to `true` htmx will issue a full page refresh on history misses rather than use an AJAX request
* `defaultSettleDelay:20` - int: the default delay between completing the content swap and settling attributes
* `defaultSwapDelay:0` - int: the default delay between receiving a response from the server and doing the swap
* `defaultSwapStyle:'innerHTML'` - string: the default swap style to use if [`hx-swap`](@/attributes/hx-swap.md) is omitted
* `historyCacheSize:10` - int: the number of pages to keep in `localStorage` for history support
* `historyEnabled:true` - boolean: whether or not to use history
* `includeIndicatorStyles:true` - boolean: if true, htmx will inject a small amount of CSS into the page to make indicators invisible unless the `htmx-indicator` class is present
* `indicatorClass:'htmx-indicator'` - string: the class to place on indicators when a request is in flight
* `requestClass:'htmx-request'` - string: the class to place on triggering elements when a request is in flight
* `addedClass:'htmx-added'` - string: the class to temporarily place on elements that htmx has added to the DOM
* `settlingClass:'htmx-settling'` - string: the class to place on target elements when htmx is in the settling phase
* `swappingClass:'htmx-swapping'` - string: the class to place on target elements when htmx is in the swapping phase
* `allowEval:true` - boolean: allows the use of eval-like functionality in htmx, to enable `hx-vars`, trigger conditions & script tag evaluation.  Can be set to `false` for CSP compatibility.
* `allowScriptTags:true` - boolean: allows script tags to be evaluated in new content
* `inlineScriptNonce:''` - string: the [nonce](https://developer.mozilla.org/docs/Web/HTML/Global_attributes/nonce) to add to inline scripts
* `useTemplateFragments:false` - boolean: use HTML template tags for parsing content from the server.  This allows you to use Out of Band content when returning things like table rows, but it is *not* IE11 compatible.
* `withCredentials:false` - boolean: allow cross-site Access-Control requests using credentials such as cookies, authorization headers or TLS client certificates
* `timeout:0` - int: the number of milliseconds a request can take before automatically being terminated
* `wsReconnectDelay:'full-jitter'` - string/function: the default implementation of `getWebSocketReconnectDelay` for reconnecting after unexpected connection loss by the event code `Abnormal Closure`, `Service Restart` or `Try Again Later`
* `wsBinaryType:'blob'` - string: the [the type of binary data](https://developer.mozilla.org/docs/Web/API/WebSocket/binaryType) being received over the WebSocket connection
* `disableSelector:"[hx-disable], [data-hx-disable]"` - array of strings: htmx will not process elements with this attribute on it or a parent
* `scrollBehavior:'smooth'` - string: the behavior for a boosted link on page transitions. The allowed values are `auto` and `smooth`. Smooth will smoothscroll to the top of the page while auto will behave like a vanilla link.
* `defaultFocusScroll:false` - boolean: if the focused element should be scrolled into view, can be overridden using the [focus-scroll](@/attributes/hx-swap.md#focus-scroll) swap modifier
* `getCacheBusterParam:false` - boolean: if set to true htmx will append the target element to the `GET` request in the format `org.htmx.cache-buster=targetElementId`
* `globalViewTransitions:false` - boolean: if set to `true`, htmx will use the [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API) API when swapping in new content.
* `methodsThatUseUrlParams:["get"]` - array of strings: htmx will format requests with these methods by encoding their parameters in the URL, not the request body
* `selfRequestsOnly:false` - boolean: if set to `true` will only allow AJAX requests to the same domain as the current document
* `ignoreTitle:false` - boolean: if set to `true` htmx will not update the title of the document when a `title` tag is found in new content
* `scrollIntoViewOnBoost:true` - boolean: whether or not the target of a boosted element is scrolled into the viewport. If `hx-target` is omitted on a boosted element, the target defaults to `body`, causing the page to scroll to the top.
* `triggerSpecsCache:null` - object: the cache to store evaluated trigger specifications into, improving parsing performance at the cost of more memory usage. You may define a simple object to use a never-clearing cache, or implement your own system using a [proxy object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Proxy) |

##### Example

```js
  // update the history cache size to 30
  htmx.config.historyCacheSize = 30;
```

### Property - `htmx.createEventSource` {#createEventSource}

A property used to create new [Server Sent Event](@/docs.md#sse) sources.  This can be updated
to provide custom SSE setup.

##### Value

* `func(url)` - a function that takes a URL string and returns a new `EventSource`

##### Example

```js
  // override SSE event sources to not use credentials
  htmx.createEventSource = function(url) {
    return new EventSource(url, {withCredentials:false});
  };
```

### Property - `htmx.createWebSocket` {#createWebSocket}

A property used to create new [WebSocket](@/docs.md#websockets).  This can be updated
to provide custom WebSocket setup.

##### Value

* `func(url)` - a function that takes a URL string and returns a new `WebSocket`

##### Example

```js
  // override WebSocket to use a specific protocol
  htmx.createWebSocket = function(url) {
    return new WebSocket(url, ['wss']);
  };
```

### Method - `htmx.defineExtension()` {#defineExtension}

Defines a new htmx [extension](@/extensions/_index.md).

##### Parameters

* `name` - the extension name
* `ext` - the extension definition

##### Example

```js
  // defines a silly extension that just logs the name of all events triggered
  htmx.defineExtension("silly", {
    onEvent : function(name, evt) {
      console.log("Event " + name + " was triggered!")
    }
  });
```

### Method - `htmx.find()` {#find}

Finds an element matching the selector

##### Parameters

* `selector` - the selector to match

or

* `elt` - the root element to find the matching element in, inclusive
* `selector` - the selector to match

##### Example

```js
    // find div with id my-div
    var div = htmx.find("#my-div")

    // find div with id another-div within that div
    var anotherDiv = htmx.find(div, "#another-div")
```

### Method - `htmx.findAll()` {#findAll}

Finds all elements matching the selector

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

### Method - `htmx.logAll()` {#logAll}

Log all htmx events, useful for debugging.

##### Example

```js
    htmx.logAll();
```

### Method - `htmx.logNone()` {#logNone}

Log no htmx events, call this to turn off the debugger if you previously enabled it.

##### Example

```js
    htmx.logNone();
```

### Property - `htmx.logger` {#logger}

The logger htmx uses to log with

##### Value

* `func(elt, eventName, detail)` - a function that takes an element, eventName and event detail and logs it

##### Example

```js
    htmx.logger = function(elt, event, data) {
        if(console) {
            console.log("INFO:", event, elt, data);
        }
    }
```

### Method - `htmx.off()` {#off}

Removes an event listener from an element

##### Parameters

* `eventName` - the event name to remove the listener from
* `listener` - the listener to remove

or

* `target` - the element to remove the listener from
* `eventName` - the event name to remove the listener from
* `listener` - the listener to remove

##### Example

```js
    // remove this click listener from the body
    htmx.off("click", myEventListener);

    // remove this click listener from the given div
    htmx.off("#my-div", "click", myEventListener)
```

### Method - `htmx.on()` {#on}

Adds an event listener to an element

##### Parameters

* `eventName` - the event name to add the listener for
* `listener` - the listener to add

or

* `target` - the element to add the listener to
* `eventName` - the event name to add the listener for
* `listener` - the listener to add

##### Example

```js
    // add a click listener to the body
    var myEventListener = htmx.on("click", function(evt){ console.log(evt); });

    // add a click listener to the given div
    var myEventListener = htmx.on("#my-div", "click", function(evt){ console.log(evt); });
```

### Method - `htmx.onLoad()` {#onLoad}

Adds a callback for the `htmx:load` event. This can be used to process new content, for example
initializing the content with a javascript library

##### Parameters

* `callback(elt)` - the callback to call on newly loaded content

##### Example

```js
    htmx.onLoad(function(elt){
        MyLibrary.init(elt);
    })
```

### Method - `htmx.parseInterval()` {#parseInterval}

Parses an interval string consistent with the way htmx does.  Useful for plugins that have timing-related attributes.

Caution: Accepts an int followed by either `s` or `ms`. All other values use `parseFloat`

##### Parameters

* `str` - timing string

##### Example

```js
    // returns 3000
    var milliseconds = htmx.parseInterval("3s");

    // returns 3 - Caution
    var milliseconds = htmx.parseInterval("3m");
```

### Method - `htmx.process()` {#process}

Processes new content, enabling htmx behavior.  This can be useful if you have content that is added to the DOM
outside of the normal htmx request cycle but still want htmx attributes to work.

##### Parameters

* `elt` - element to process

##### Example

```js
  document.body.innerHTML = "<div hx-get='/example'>Get it!</div>"
  // process the newly added content
  htmx.process(document.body);
```

### Method - `htmx.remove()` {#remove}

Removes an element from the DOM

##### Parameters

* `elt` - element to remove

or

* `elt` - element to remove
* `delay` - delay (in milliseconds ) before element is removed

##### Example

```js
  // removes my-div from the DOM
  htmx.remove(htmx.find("#my-div"));

  // removes my-div from the DOM after a delay of 2 seconds
  htmx.remove(htmx.find("#my-div"), 2000);
```

### Method - `htmx.removeClass()` {#removeClass}

Removes a class from the given element

##### Parameters

* `elt` - element to remove the class from
* `class` - the class to remove

or

* `elt` - element to remove the class from
* `class` - the class to remove
* `delay` - delay (in milliseconds ) before class is removed

##### Example

```js
  // removes .myClass from my-div
  htmx.removeClass(htmx.find("#my-div"), "myClass");

  // removes .myClass from my-div after 6 seconds
  htmx.removeClass(htmx.find("#my-div"), "myClass", 6000);
```

### Method - `htmx.removeExtension()` {#removeExtension}

Removes the given extension from htmx

##### Parameters

* `name` - the name of the extension to remove

##### Example

```js
  htmx.removeExtension("my-extension");
```

### Method - `htmx.takeClass()` {#takeClass}

Takes the given class from its siblings, so that among its siblings, only the given element will have the class.

##### Parameters

* `elt` - the element that will take the class
* `class` - the class to take

##### Example

```js
  // takes the selected class from tab2's siblings
  htmx.takeClass(htmx.find("#tab2"), "selected");
```

### Method - `htmx.toggleClass()` {#toggleClass}

Toggles the given class on an element

##### Parameters

* `elt` - the element to toggle the class on
* `class` - the class to toggle

##### Example

```js
  // toggles the selected class on tab2
  htmx.toggleClass(htmx.find("#tab2"), "selected");
```

### Method - `htmx.trigger()` {#trigger}

Triggers a given event on an element

##### Parameters

* `elt` - the element to trigger the event on
* `name` - the name of the event to trigger
* `detail` - details for the event

##### Example

```js
  // triggers the myEvent event on #tab2 with the answer 42
  htmx.trigger("#tab2", "myEvent", {answer:42});
```

### Method - `htmx.values()` {#values}

Returns the input values that would resolve for a given element via the htmx value resolution mechanism

##### Parameters

* `elt` - the element to resolve values on
* `request type` - the request type (e.g. `get` or `post`)  non-GET's will include the enclosing form of the element.
   Defaults to `post`

##### Example

```js
  // gets the values associated with this form
  var values = htmx.values(htmx.find("#myForm"));
```
