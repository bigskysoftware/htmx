---
layout: layout.njk
title: </> htmx - high power tools for html
---
<div class="row">
<div class="2 col nav">

**Contents** 

<div id="contents">

* [introduction](#introduction)
* [installing](#installing)
* [ajax](#ajax)
  * [triggers](#triggers)
    * [special events](#special-events)
    * [polling](#polling)
    * [load polling](#load_polling)
  * [targets](#targets)
  * [indicators](#indicators)
  * [swapping](#swapping)
  * [parameters](#parameters)
* [boosting](#boosting)
* [websockets & SSE](#websockets-and-sse)
* [history](#history)
* [requests & responses](#requests)
* [animations](#animations)
* [extensions](#extensions)
* [events & logging](#events)
* [configuring](#config)

</div>

</div>
<div class="10 col">

## <a name="introduction"></a>[Htmx in a Nutshell](#introduction)

Htmx is a library that allows you to access modern browser features directly from HTML, rather than using
javascript.  

To understand htmx, first lets take a look at an anchor tag:

``` html
  <a href="/blog">Blog</a>
```

This anchor tag tells a browser:

> "When a user clicks on this link, issue an HTTP GET request to '/blog' and load the response content 
>  into the browser window".

With that in mind, consider the following bit of HTML:

``` html
  <div hx-post="/clicked"
       hx-trigger="click"
       hx-target="#parent-div"
       hx-swap="outerHTML">
    Click Me!
  </div>
```

This tells htmx:

> "When a user clicks on this div, issue an HTTP POST request to '/clicked' and use the content from the response
>  to replace the element with the id `parent-div` in the DOM"

Htmx extends and generalizes the core idea of HTML as a hypertext, opening up many more possibilities directly 
within the language: 

* Now any element, not just anchors and forms, can issue an HTTP request
* Now any event, not just clicks or form submissions, can trigger requests
* Now any [HTTP verb](https://en.wikipedia.org/wiki/HTTP_Verbs), not just `GET` and `POST`, can be used
* Now any element, not just the entire window, can be the target for update by the request

Note that when you are using htmx, on the server side you respond with *HTML*, not *JSON*.  This keeps you firmly
within the [original web programming model]((https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm)), 
using [Hypertext As The Engine Of Application State](https://en.wikipedia.org/wiki/HATEOAS)
without even needing to really understand that concept.

It's worth mentioning that, if you prefer, you can use the `data-` prefix when using htmx:

``` html
  <a data-hx-post="/click">Click Me!</a>
```

## <a name="installing"></a> [Installing](#installing)

Htmx is a dependency-free javascript library.  

It can be used via [NPM](https://www.npmjs.com/) as "`htmx.org`" or downloaded or included from 
[unpkg](https://unpkg.com/browse/htmx.org/) or your other favorite NPM-based CDN:

``` html
    <script src="https://unpkg.com/htmx.org@0.0.4"></script>
```

## <a name="ajax"></a> [AJAX](#ajax)

The core of htmx is a set of attributes that allow you to issue AJAX requests directly from HTML:

| Attribute | Description |
|-----------|-------------|
| [hx-get](/attributes/hx-get) | Issues a `GET` request to the given URL|
| [hx-post](/attributes/hx-post) | Issues a `POST` request to the given URL
| [hx-put](/attributes/hx-put) | Issues a `PUT` request to the given URL
| [hx-patch](/attributes/hx-patch) | Issues a `PATCH` request to the given URL
| [hx-delete](/attributes/hx-delete) | Issues a `DELETE` request to the given URL


Since most browsers only support issuing `GET` and `POST`, a request with one of the other three methods will
actually be issued as a `POST`, with the `X-HTTP-Method-Override` header set to the desired method.

Each of these attributes takes a URL to issue an AJAX request to.  The element will issue a request of the specified
type to the given URL when the element is [triggered](#triggers):

```html
  <div hx-put="/messages">
    Put To Messages
  </div>
```

This tells the browser:

> When a user clicks on this div, issue a PUT request to the URL /messages and load the response into the div

### <a name="triggers"></a> [Triggering Requests](#triggers)

By default, AJAX requests are triggered by the "natural" event of an element:

* `input`, `textarea` & `select` are triggered on the `change` event
* `form` is triggered on the `submit` event
* everything else is triggered by the `click` event

If you want different behavior you can use the [hx-trigger](/attributes/hx-trigger)
attribute to specify which event will cause the request.  

Here is a `div` that posts to `/mouse_entered` when a mouse enters it:

```html
   <div hx-post="/mouse_entered" hx-trigger="mouseenter">
      [Here Mouse, Mouse!]
   </div>
```

If you want a request to only happen once, you can use the `once` modifier for the trigger:

```html
   <div hx-post="/mouse_entered" hx-trigger="mouseenter once"">
     [Here Mouse, Mouse!]
   </div>
```

There are few other modifiers you can use for trigger:

* `changed` - only issue a request if the value of the element has changed
*  `delay:<time interval>` - wait the given amount of time (e.g. `1s`) before
issuing the request.  If the event triggers again, the countdown is reset.

You can use these two attributes to implement a common UX pattern, [Active Search](/examples/active-search):

```html
   <input type="text" name="q" 
          hx-get="/trigger_delay" 
          hx-trigger="keyup changed delay:500ms" 
          hx-target="#search-results" 
          placeholder="Search..."/>
    <div id="search-results"></div>
```

This input will issue a request 500 milliseconds after a key up event if the input has been changed and inserts the results
into the `div` with the id `search-results`.

Multiple triggers can be specified in the [hx-trigger](/attributes/hx-trigger) attribute, separated by commas.

#### <a name="special-events"></a> [Special Events](#special-events)

htmx provides a few special events for use in [hx-trigger](/attributes/hx-trigger):

* `load` - fires once when the element is first loaded
* `revealed` - fires once when an element first scrolls into the viewport

You can also use custom events to trigger requests if you have an advanced use case.

#### <a name="polling"></a> [Polling](#polling)

If you want an element to poll the given URL rather than wait for an event, you can use the `every` syntax
with the [`hx-trigger`](/attributes/hx-trigger/) attribute:

```html
  <div hx-get="/news" trigger="every 2s">
  </div>
```

This tells htmx

> Every 2 seconds, issue a GET to /news and load the response into the div

If you want to stop polling from a server response you can respond with the HTTP response code [`286`](https://en.wikipedia.org/wiki/86_(term))
and the element will cancel the polling.

#### <a name="load_polling"></a> [Load Polling](#load_polling)

Another technique that can be used to achieve polling in htmx is "load polling", where an element specifies
an `load` trigger along with a delay, and replaces itself with the response:

```html
<div hx-get="/messages" 
     hx-trigger="load delay:1s"
     hx-swap="outerHTML">
     
</div>
```

If the `/messages` end point keeps returning a div set up this way, it will keep "polling" back to the URL every
second.

Load polling can be useful in situations where a poll has an end point at which point the polling terminates, such as 
when you are showing the user a [progress bar](/examples/progress-bar).

### <a name="indicators"></a> [Request Indicators](#indicators)

When an AJAX request is issued it is often good to let the user know that something is happening since the browser
will not give them any feedback.  You can accomplish this in htmx by using `htmx-indicator` class.

The `htmx-indicator` class is defined so that the opacity of any element with this class is 0 by default, making it invisible
but present in the DOM.  

When htmx issues a request, it will put a `htmx-request` class onto an element (either the requesting element or
another element, if specified).  The `htmx-request` class will cause a child element with the `htmx-indicator` class
on it to transition to an opacity of 1, showing the indicator.

```html
  <button hx-get="/click">
      Click Me!
     <img class="htmx-indicator" src="/spinner.gif"/>
  </button>
```

Here we have a button.  When it is clicked the `htmx-request` class will be added to it, which will reveal the spinner
gif element.  (I like [SVG spinners](http://samherbert.net/svg-loaders/) these days.)

While the `htmx-indicator` class uses opacity to hide and show the progress indicator, if you would prefer another mechanism
you can create your own CSS transition like so:

```css
    .htmx-indicator{
        display:none;
    }
    .htmx-request .my-indicator{
        display:inline;
    }
    .htmx-request.my-indicator{
        display:inline;
    }
```

If you want the `htmx-request` class added to a different element, you can use the [hx-indicator](/attributes/hx-indicator)
attribute with a CSS selector to do so:

```html
  <div>
      <button hx-get="/click" hx-indicator="#indicator">
        Click Me!
      </button>
      <img id="indicator" class="htmx-indicator" src="/spinner.gif"/>  
  </div>
```

Here we call out the indicator explicitly by id.  Note that we could have placed the class on the parent `div` as well
and had the same effect.

### <a name="targets"></a> [Targets](#targets)

If you want the response to be loaded into a different element other than the one that made the request, you can
use the  [hx-target](/attributes/hx-target) attribute, which takes a CSS selector.  Looking back at our Live Search example:

```html
   <input type="text" name="q" 
          hx-get="/trigger_delay" 
          hx-trigger="keyup delay:500ms changed" 
          hx-target="#search-results"
          placeholder="Search..."/>
    <div id="search-results"></div>
```

You can see that the results from the search are going to be loaded into `div#search-results`, rather than into the
input tag.

### <a name="swapping"></a> [Swapping](#swapping)

htmx offers a few different ways to swap the HTML returned into the DOM.  By default, the content replaces the
`innerHTML` of the target element.  You can modify this by using the [hx-swap](/attributes/hx-swap) attribute 
with any of the following values:

| Name | Description 
|------|-------------
| `innerHTML` | the default, puts the content inside the target element
| `outerHTML` | replaces the entire target element with the returned content
| `afterbegin` | prepends the content before the first child inside the target
| `beforebegin` | prepends the content before the target in the targets parent element
| `beforeend` | appends the content after the last child inside the target
| `afterend` | appends the content after the target in the targets parent element

#### <a name="oob_swaps"></a>[Out of Band Swaps](#oob_swaps)

If you want to swap content from a response directly into the DOM by using the `id` attribute you can use the
[hx-swap-oob](/attributes/hx-swap-oob) attribute in the *response* html:

```html
  <div id="message" hx-swap-oob="true">Swap me directly!</div>
  Additional Content
```

In this response, `div#message` would be swapped directly into the matching DOM element, while the additional content
would be swapped into the target in the normal manner.

You can use this technique to "piggy-back" updates on other requests.  

Note that out of band elements must be in the top level of the response, and not children of the top level elements.

#### Selecting Content To Swap

If you want to select a subset of the response HTML to swap into the target, you can use the [hx-select](/attributes/hx-select)
attribute, which takes a CSS selector and selects the matching elements from the response.

### <a name="parameters"></a> [Parameters](#parameters)

By default, an element that causes a request will include its value if it has one.  If the element is a form it
will include the values of all inputs within it.

Additionally, if the element causes a non-`GET` request, the values of all the inputs of the nearest enclosing form
will be included.

If you wish to include the values of other elements, you can use the [hx-include](/attributes/hx-include) attribute
with a CSS selector of all the elements whose values you want to include in the request.

If you wish to filter out some parameters you can use the [hx-params](/attributes/hx-params) attribute.

Finally, if you want to programatically modify the parameters, you can use the [configRequest.htmx](/events#configRequest.htmx) 
event.

## <a name="boosting"></a>[Boosting](#boosting)

Htmx supports "boosting" regular HTML anchors and forms with the [hx-boost](/attributes/hx-boost) attribute.  This
attribute will convert all anchor tags and forms into AJAX requests that, by default, target the body of the page.

Here is an example:

```html
<div hx-boost="true">
    <a href="/blog">Blog</a>
</div>
```

The anchor tag in this div will issue an AJAX `GET` request to `/blog` and swap the response into the `body` tag.

This functionality is somewhat similar to [Turbolinks](https://github.com/turbolinks/turbolinks) and allows you to use
htmx for [progressive enhancement](https://en.wikipedia.org/wiki/Progressive_enhancement).

### <a name="websockets-and-sse"></a> [Web Sockets & SSE](#websockets-and-sse)

Htmx has experimental support for declarative use of both 
[WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications) 
and  [Server Sent Events]((https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)).
  
These features are under active development, so please let us know if you are willing to experiment with them.

#### <a name="websockets">[WebSockets](#websockets)

If you wish to establish a `WebSocket` connection in htmx, you use the [hx-ws](/attributes/hx-ws) attribute:

```html
  <div hx-ws="connect wss:/chatroom">
    <div id="chat_room">
      ...
    </div>
    <form hx-ws="send:submit">
        <input name="chat_message">
    </form>
  </div>
```

The `source` delcaration established the connection, and the `send` declaration tells the form to submit values to the
socket on `submit`.

More details can be found on the [hx-ws attribute page](/attributes/hx-ws) 

#### <a name="sse"></a> [Server Sent Events](#sse)

[Server Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) are
a way for servers to send events to browsers.  It provides a higher-level mechanism for communication between the
server and the browser than websockets.

If you want an element to respond to a Server Sent Event via htmx, you need to do two things:

1. Define an SSE source.  To do this, add a [hx-sse](/attributes/hx-sse) attribute on a parent element with
a `connect <url>` declaration that specifies the URL from which Server Sent Events will be received.

2. Define elements that are descendents of this element that are triggered by server sent events using the 
`hx-trigger="sse:<event_name>"` syntax

Here is an example:

```html
    <body hx-sse="connect /news_updates">
        <div hx-trigger="sse:new_news" hx-get="/news"></div>
    </body>
```

Depending on your implementation, this may be more efficient than the polling example above since the server would
notify the div if there was new news to get, rather than the steady requests that a poll causes.

## <a name="history"></a> [History Support](#history)

Htmx provides a simple mechanism for interacting with the [browser history API](https://developer.mozilla.org/en-US/docs/Web/API/History_API):

If you want a given element to push its request URL into the browser navigation bar and add the current state of the page
to the browser's history, include the [hx-push-url](/attributes/hx-push-url) attribute:

```html
    <a hx-get="/blog" hx-push-url="true">Blog</a>
```
  
When a user clicks on this link, htmx will snapshot the current DOM and store it before it makes a request to /blog. 
It then does the swap and pushes a new location onto the history stack.

When a user hits the back button, htmx will retrieve the old content from storage and swap it back into the target,
 simulating "going back" to the previous state.

### Specifying History Snapshot Element

By default, htmx will use the `body` to take and restore the history snapshop from.  This is usually the right thing, but
if you want to use a narrower element for snapshotting you can use the [hx-history-elt](/attributes/hx-history-elt)
attribute to specify a different one.  

Careful: this element will need to be on all pages or restoring from history won't work reliably.

## <a name="requests">[Requests &amp; Responses](#requests)

Htmx expects responses to the AJAX requests it makes to be HTML, typically HTML fragments (although a full HTML 
document, matched with a [hx-select](/attributes/hx-select) tag can be useful too).  Htmx will then swap the returned
HTML into the document at the target specified and with the swap strategy specified.

Sometimes you might want to do nothing in the swap, but still perhaps trigger a client side event ([see below](#response-headers)).
For this situation you can return a `204 - No Content` response code, and htmx will ignore the content of the response.

In the event of an error response from the server (e.g. a 404 or a 501), htmx will trigger the [`responseError.htmx`](/events#responseError.htmx)
event, which you can handle.  

In the event of a connection error, the `sendError.htmx` event will be triggered.

### <a name="request-header"></a> [Request Headers](#request-headers)

htmx includes a number of useful headers in requests:

| Header | Description
|--------|--------------
| `X-HX-Request` | will be set to "true"
| `X-HX-Trigger` | will be set to the id of the element that triggered the request
| `X-HX-Trigger-Name` | will be set to the name of the element that triggered the request
| `X-HX-Target` | will be set to the id of the target element
| `X-HX-Current-URL` | will be set to the URL of the browser
| `X-HX-Prompt` | will be set to the value entered by the user when prompted via [hx-prompt](/attributes/hx-prompt)
| `X-HX-Event-Target` | the id of the original target of the event that triggered the request
| `X-HX-Active-Element` | the id of the current active element
| `X-HX-Active-Element-Name` | the name of the current active element
| `X-HX-Active-Element-Value` | the value of the current active element
| `X-HTTP-Method-Override` | the HTTP verb for non-`GET` and `POST` requests

### <a name="response-header"></a> [Response Headers](#response-headers)

htmx supports two special response headers:

* `X-HX-Trigger` - can be used to trigger client side events, see the [documentation](/headers/x-hx-trigger) for examples.
* `X-HX-Push` - can be used to push a new URL into the browsers address bar

### Request Order of Operations

The order of operations in a htmx request are:

* The element is triggered and begins a request
  * Values are gathered for the request
  * The `htmx-request` class is applied to the appropriate elements
  * The request is then issued asynchronously via AJAX
    * Upon getting a response the target element is marked with the `htmx-swapping` class
    * An optional swap delay is applied (see the [hx-swap-delay](/attributes/hx-swap-delay) attribute)
    * The actual content swap is done
        * the `htmx-swapping` class is removed from the target
        * the `htmx-settling` class is applied to the target
        * A settle delay  is done (default: 100ms)
        * The DOM is settled
        * the `htmx-settling` class is removed from the target

You can use the `htmx-swapping` and `htmx-settling` classes to create 
[CSS transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions) between pages.

## <a name="animations"></a> [Animations](#animations)

Htmx allows you to use [CSS transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions)
in many situations using only HTML and CSS.  

Please see the [Animation Guide](/examples/animations) for more details on the options available.

## <a name="extensions"></a> [Extensions](#extensions)

Htmx has an extension mechanism that allows you to customize the libraries' behavior.  Extensions [are
defined in javascript](/extensions#defining) and then used via the [`hx-ext`](/attributes/hx-ext) attribute:

```html
  <button hx-post="/example" hx-ext="debug">This button uses the debug extension</button>
```

If you are interested in adding your own extension to htmx, please [see the extension docs](/extensions)

### Official Extensions

Htmx offers some officially supported extensions that are tested against the htmx code base, including:

| Extension | Description
|-----------|-------------
| [`json-enc`](/extensions/json-enc) | use JSON encoding in the body of requests, rather than the default `x-www-form-urlencoded`
| [`morphdom-swap`](/extensions/morphdom-swap) | an extension for using the [morphdom](https://github.com/patrick-steele-idem/morphdom) library as the swapping mechanism in htmx.
| [`client-side-templates`](/extensions/client-side-templates) | support for client side template processing of JSON responses
| [`path-deps`](/extensions/path-deps) | an extension for expressing path-based dependencies [similar to intercoolerjs](http://intercoolerjs.org/docs.html#dependencies)
| [`class-tools`](/extensions/class-tools) | an extension for manipulating timed addition and removal of classes on HTML elements

See the [Extensions](/extensions#list) for a complete list.

## <a name="events"></a> [Events & Logging](#events)

Htmx has an extensive events mechanism, which doubles as the logging system.  

If you want to register for a given htmx event you can use the following javascript:

```javascript
  htmx.on("load.htmx", function(evt) {
        myJavascriptLib.init(evt.details.elt);  
  });
```

This event is fired every time an element is loaded into the DOM by htmx, and is effectively the load event.  In
fact this is so common, you can use the helper function:

```javascript
  htmx.onLoad(function(target) {
        myJavascriptLib.init(target);  
  });
```
This does the same thing as the first example, but is a little cleaner.  

The full set of events can be seen [on the reference page](/reference#events).

### Logging

If you set a logger at `htmx.logger`, every event will be logged.  This can be very useful for troubleshooting:

```javascript
    htmx.logger = function(elt, event, data) {
        if(console) {
            console.log(event, elt, data);
        }
    }
```

Htmx can also send errors to a URL that is specified with the [hx-error-url](/attributes/hx-error-url) attributes. This can be useful for debugging client-side issues.

Htmx includes a helper method:

```javascript
  htmx.logAll();
```

if you want to log everything while developing.

## <a name="config"></a>[Configuring htmx](#config)

Htmx allows you to configure a few defaults:

<div class="info-table">

| Config Variable | Info |
|-----------------|-------
|  `htmx.config.historyEnabled` | defaults to `true`, really only useful for testing
|  `htmx.config.historyCacheSize` | defaults to 10
|  `htmx.config.defaultSwapStyle` | defaults to `innerHTML`
|  `htmx.config.defaultSwapDelay` | defaults to 0
|  `htmx.config.defaultSettleDelay` | defaults to 100
|  `htmx.config.includeIndicatorStyles` | defaults to `true` (determines if the `htmx-indicator` default styles are loaded, must be set in a `meta` tag before the htmx js is included)

</div>

You can set them directly in javascript, or you can use a `meta` tag:

```html
    <meta name="htmx-config" content='{"defaultSwapStyle":"outerHTML"}'>
```

### Conclusion

And that's it!  Have fun with htmx: you can accomplish [quite a bit](/examples) without a lot of code.

</div>
</div>
