---
layout: layout.njk
title: </> htmx - high power tools for html
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

### <a name="closest"></a> Method -  [`htmx.closest()`](#closest)

Finds the closest matching element in the given elements parentage, inclusive

##### Parameters

* `elt` - the element to find the selector in
* `class` - the selector to find

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




| [`htmx.find(selector)` `htmx.find(elt, selector)`](/api#find)  | Finds a single element matching the selector
| [`htmx.findAll(selector)` `htmx.findAll(elt, selector)`](/api#find)  | Finds all elements matching a given selector
| [`htmx.logAll()`](/api#logAll)  | Installs a logger that will log all htmx events
| [`htmx.logger`](/api#logger)  | A property set to the current logger (default is `null`)
| [`htmx.on(elt, event, listener)`](/api#on)  | Creates an event listener on the given element, returning it
| [`htmx.onLoad(function(elt))`](/api#onLoad)  | Adds a callback handler for the `htmx:load` event
| [`htmx.parseInterval`](/api#parseInterval)  | Parses an interval declaration into a millisecond value
| [`htmx.process(elt)`](/api#process)  | Processes the given element and its children, hooking up any htmx behavior
| [`htmx.remove(elt)`](/api#remove)  | Removes the given element
| [`htmx.removeClass(elt, class)`](/api#removeClass)  | Removes a class from the given element
| [`htmx.removeExtension(name)`](/api#removeExtension)  | Removes an htmx [extension](/extensions)
| [`htmx.takeClass(elt, class)`](/api#takeClass)  | Takes a class from other elements for the given element
| [`htmx.toggleClass(elt, class)`](/api#toggleClass)  | Toggles a class from the given element
| [`htmx.trigger(elt, event, detail)`](/api#trigger)  | Triggers an event on an element
