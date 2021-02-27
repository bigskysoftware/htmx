---
layout: layout.njk
title: </> htmx - Javascript API
---

## Javascript API

While it is not a focus of the library, htmx does provide a small API of helper methods, intended mainly for [extension development](/extensions) or for working with [events](/events).

The [hyperscript](https://hyperscript.org) project is intended to provide more extensive scripting support
for htmx-based applications.

### <a name="addClass"></a> Method -  [`htmx.addClass()`](#addClass)

This method adds a class to the given element.

##### Parameters

* `elt` - the element to add the class to
* `class` - the class to add

##### Example

```js
  // add the class 'myClass' to the element with the id 'demo'
  htmx.addClass(htmx.find('#demo'), 'myClass');
```

### <a name="ajax"></a> Method -  [`htmx.ajax()`](#ajax)

Issues an htmx-style AJAX request

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


##### Example

```js
    // issue a GET to /example and put the response HTML into #myDiv
    htmx.ajax('GET', '/example', '#myDiv')
```

### <a name="closest"></a> Method -  [`htmx.closest()`](#closest)

Finds the closest matching element in the given elements parentage, inclusive of the element

##### Parameters

* `elt` - the element to find the selector from
* `selector` - the selector to find

##### Example

```js
  // find the closest enclosing div of the element with the id 'demo'
  htmx.closest(htmx.find('#demo'), 'div');
```

### <a name="config"></a> Property -  [`htmx.config`](#config)

A property holding the configuration htmx uses at runtime.

Note that using a [meta tag](/docs/#config) is the preferred mechanism for setting these properties.

##### Properties

* `attributesToSettle:["class", "style", "width", "height"]` - array of strings: the attributes to settle during the settling phase
* `defaultSettleDelay:100` - int: the default delay between completing the content swap and settling attributes
* `defaultSwapDelay:0` - int: the default delay between receiving a response from the server and doing the swap
* `defaultSwapStyle:'innerHtml'` - string: the default swap style to use if [`hx-swap`](/attributes/hx-swap) is omitted
* `historyCacheSize:10` - int: the number of pages to keep in `localStorage` for history support
* `historyEnabled:true` - boolean: whether or not to use history
* `includeIndicatorStyles:true` - boolean: if true, htmx will inject a small amount of CSS into the page to make indicators invisible unless the `htmx-indicator` class is present
* `indicatorClass:'htmx-indicator'` - string: the class to place on indicators when a request is in flight
* `requestClass:'htmx-request'` - string: the class to place on triggering elements when a request is in flight
* `settlingClass:'htmx-settling'` - string: the class to place on target elements when htmx is in the settling phase
* `swappingClass:'htmx-swapping'` - string: the class to place on target elements when htmx is in the swapping phase
* `allowEval:true` - boolean: allows the use of eval-like functionality in htmx, to enable `hx-vars`, trigger conditions & script tag evaluation.  Can be set to `false` for CSP compatibility
* `wsReconnectDelay:full-jitter` - string/function: the default implementation of `getWebSocketReconnectDelay` for reconnecting after unexpected connection loss by the event code `Abnormal Closure`, `Service Restart` or `Try Again Later`

##### Example

```js
  // update the history cache size to 30
  htmx.config.historyCacheSize = 30;
```

### <a name="createEventSource"></a> Property -  [`htmx.createEventSource`](#createEventSource)

A property used to create new [Server Sent Event](/docs/#sse) sources.  This can be updated
to provide custom SSE setup.

##### Value

* `func(url)` - a function that takes a URL string and returns a new `EventSource`

##### Example

```js
  // override SSE event sources to not use credentials
  htmx.createEventSource = function(url) {
    return new EventSource(url, {withCredentials:false});
  });
```

### <a name="createWebSocket"></a> Property -  [`htmx.createWebSocket`](#createWebSocket)

A property used to create new [WebSocket](/docs/#websockets).  This can be updated
to provide custom WebSocket setup.

##### Value

* `func(url)` - a function that takes a URL string and returns a new `WebSocket`

##### Example

```js
  // override WebSocket to use a specific protocol
  htmx.createWebSocket = function(url) {
    return new WebSocket(url, ['wss']);;
  };
```

### <a name="defineExtension"></a> Method -  [`htmx.defineExtension()`](#defineExtension)

Defines a new htmx [extension](/extensions).

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

### <a name="find"></a> Method -  [`htmx.find()`](#find)

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

### <a name="findAll"></a> Method -  [`htmx.findAll()`](#findAll)

Finds all elements matching the selector

##### Parameters

* `selector` - the selector to match

or

* `elt` - the root element to find the matching elements in, inclusive
* `selector` - the selector to match

##### Example

```js
    // find all divs
    var allDivs = htmx.find("div")

    // find all paragraphs within a given div
    var allParagraphsInMyDiv = htmx.find(htmx.find("#my-div"), "p")
```

### <a name="logAll"></a> Method -  [`htmx.logAll()`](#logAll)

Log all htmx events, useful for debugging.

##### Example

```js
    htmx.logAll();
```

### <a name="logger"></a> Property -  [`htmx.logger`](#logger)

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

### <a name="off"></a> Method -  [`htmx.off()`](#off)

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
    var allParagraphsInMyDiv = htmx.off("#my-div", "click", myEventListener)
```

### <a name="on"></a> Method -  [`htmx.on()`](#on)

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

### <a name="onLoad"></a> Method -  [`htmx.onLoad()`](#onLoad)

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

### <a name="parseInterval"></a> Method -  [`htmx.parseInterval()`](#parseInterval)

Parses an interval string consistent with the way htmx does.  Useful for plugins that have timing-related attributes.

##### Parameters

* `str` - timing string

##### Example

```js
    // returns 3000
    var milliseconds = htmx.parseInterval("3s");
```

### <a name="process"></a> Method -  [`htmx.process()`](#process)

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

### <a name="remove"></a> Method -  [`htmx.remove()`](#remove)

Removes an element from the DOM

##### Parameters

* `elt` - element to remove

##### Example

```js
  // removes my-div from the DOM
  htmx.remove(htmx.find("#my-div"));
```

### <a name="removeClass"></a> Method -  [`htmx.removeClass()`](#removeClass)

Removes a class from the given element

##### Parameters

* `elt` - element to remove the class from
* `class` - the class to remove

##### Example

```js
  // removes .myClass from my-div
  htmx.removeClass(htmx.find("#my-div"), "myClass");
```

### <a name="removeExtension"></a> Method -  [`htmx.removeExtension()`](#removeExtension)

Removes the given extension from htmx

##### Parameters

* `name` - the name of the extension to remove

##### Example

```js
  htmx.removeExtension("my-extension");
```

### <a name="takeClass"></a> Method -  [`htmx.takeClass()`](#takeClass)

Takes the given class from its siblings, so that among its siblings, only the given element will have the class.

##### Parameters

* `elt` - the element that will take the class
* `class` - the class to take

##### Example

```js
  // takes the selected class from tab2's siblings
  htmx.takeClass(htmx.find("#tab2"), "selected");
```

### <a name="toggleClass"></a> Method -  [`htmx.toggleClass()`](#toggleClass)

Toggles the given class on an element

##### Parameters

* `elt` - the element to toggle the class on
* `class` - the class to toggle

##### Example

```js
  // toggles the selected class on tab2
  htmx.toggle(htmx.find("#tab2"), "selected");
```

### <a name="trigger"></a> Method -  [`htmx.trigger()`](#trigger)

Triggers a given event on an element

##### Parameters

* `elt` - the element to trigger the event on
* `name` - the name of the event to trigger
* `detail` - details for the event

##### Example

```js
  // triggers the myEvent event on #tab2 with the answer 42
  htmx.trigger(htmx.find("#tab2"), "myEvent", {answer:42});
```
