---
layout: layout.njk
title: </> kutty - high power tools for html
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
    * [SSE](#sse)
  * [targets](#targets)
  * [indicators](#indicators)
  * [swapping](#swapping)
  * [parameters](#parameters)
* [history](#history)
* [requests & responses](#requests)
* [misc](#misc)
* [events & logging](#events)
* [configuring](#config)

</div>

</div>
<div class="10 col">

## <a name="introduction"></a>[Kutty in a Nutshell](#introduction)

Kutty is a library that allows you to access modern browser features directly from HTML, rather than using
javascript.  

To understand kutty, first lets take a look at an anchor tag:

``` html
  <a href="/blog">Blog</a>
```

This anchor tag tells a browser:

> "When a user clicks on this link, issue an HTTP GET request to '/blog' and load the response content 
>  into the browser window".

With that in mind, consider the following bit of HTML:

``` html
  <div kt-post="/clicked"
       kt-trigger="click"
       kt-target="#parent-div"
       kt-swap="outerHTML">
    Click Me!
  </div>
```

This tells kutty:

> "When a user clicks on this div, issue an HTTP POST request to '/clicked' and use the content from the response
>  to replace the element with the id `parent-div` in the DOM"

Kutty extends and generalizes the core idea of HTML as a hypertext, opening up many more possibilities directly 
within the language: 

* Now any element, not just anchors and forms, can issue a HTTP request
* Now any event, not just clicks or form submissions, can trigger requests
* Now any [HTTP verb](https://en.wikipedia.org/wiki/HTTP_Verbs), not just `GET` and `POST`, can be used
* Now any element, not just the entire window, can be the target for update by the request

Note that when you are using kutty, on the server side you respond with *HTML*, not *JSON*.  This keeps you firmly
within the [original web programming model]((https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm)), 
using [Hypertext As The Engine Of Application State](https://en.wikipedia.org/wiki/HATEOAS)
without even needing to really understand that concept.

It's worth mentioning that, if you prefer, you can use the `data-` prefix when using kutty:

``` html
  <a data-kt-post="/click">Click Me!</a>
```

## <a name="installing"></a> [Installing](#installing)

Kutty is a dependency-free javascript library.  

It can be used via [NPM](https://www.npmjs.com/) as "`kutty.org`" or downloaded or included from 
[unpkg](https://unpkg.com/browse/kutty.org/) or your other favorite NPM-based CDN:

``` html
    <script src="https://unpkg.com/kutty.org@0.0.1"></script>
```

## <a name="ajax"></a> [AJAX](#ajax)

The core feature of kutty is a set of attributes that allow you to issue AJAX requests directly from HTML:

* [kt-get](/attributes/kt-get) - Issues a `GET` request to the given URL
* [kt-post](/attributes/kt-post) - Issues a `POST` request to the given URL
* [kt-put](/attributes/kt-put) - Issues a `PUT` request to the given URL (see [details](#kutty-request-details))
* [kt-patch](/attributes/kt-patch) - Issues a `PATCH` request to the given URL  (see [details](#kutty-request-details))
* [kt-delete](/attributes/kt-delete) - Issues a `GET` request to the given URL (see [details](#kutty-request-details))

Each of these attributes takes a URL to issue an AJAX request to.  The element will issue a request of the specified
type to the given URL when the element is [triggered](#triggers):

```html
  <div kt-put="/messages">
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

If you want different behavior you can use the [kt-trigger](/attributes/kt-trigger)
attribute to specify which event will cause the request.  

Here is a `div` that posts to `/mouse_entered` when a mouse enters it:

```html
   <div kt-post="/mouse_entered" kt-trigger="mouseenter">
      [Here Mouse, Mouse!]
   </div>
```

If you want a request to only happen once, you can use the `once` modifier for the trigger:

```html
   <div kt-post="/mouse_entered" kt-trigger="mouseenter once"">
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
          kt-get="/trigger_delay" 
          kt-trigger="keyup changed delay:500ms" 
          kt-target="#search-results" 
          placeholder="Search..."/>
    <div id="search-results"></div>
```

This input will issue a request 500 milliseconds after a key up event if the input has been changed and inserts the results
into the `div` with the id `search-results`.

#### <a name="special-events"></a> [Special Events](#special-events)

kutty provides a few special events for use in [kt-trigger](/attributes/kt-trigger):

* `load` - fires once when the element is first loaded
* `revealed` - fires once when an element first scrolls into the viewport

You can also use custom events to trigger requests if you have an advanced use case.

#### <a name="polling"></a> [Polling](#polling)

If you want an element to poll the given URL rather than wait for an event, you can use the `every` syntax
with the [`kt-trigger`](/attributes/kt-trigger/) attribute:

```html
  <div kt-get="/news" trigger="every 2s">
  </div>
```

This tells kutty

> Every 2 seconds, issue a GET to /news and load the response into the div

If you want to stop polling from a server response you can respond with the HTTP response code [`286`](https://en.wikipedia.org/wiki/86_(term))
and the element will cancel the polling.

#### <a name="load_polling"></a> [Load Polling](#load_polling)

Another technique that can be used to achieve polling in kutty is "load polling", where an element specifies
an `load` trigger along with a delay, and replaces itself with the response:

```html
<div kt-get="/messages" 
     kt-trigger="load delay:1s"
     kt-swap="outerHTML">
     
</div>
```

If the `/messages` end point keeps returning a div set up this way, it will keep "polling" back to the URL every
second.

Load polling can be useful in situations where a poll has an end point at which point the polling terminates, such as 
when you are showing the user a [progress bar](/examples/progress-bar).

#### <a name="sse"></a> [Server Sent Events](#sse)

[Server Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) are
a way for servers to send events to browsers.  It provides a higher-level mechanism for communication between the
server and the browser than websockets.

If you want an element to respond to a Server Sent Event via kutty, you need to do two things:

1. Define an SSE source.  To do this, add a [kt-sse-src](/attributes/kt-sse-src) attribute on a parent element
that specifies the URL from which Server Sent Events will be received.

2. Specify the Server Sent Event that will trigger the element, with the prefix `sse:`

Here is an example:

```html
    <body kt-sse-src="/sse_messages">
        <div trigger="sse:new_news" kt-get="/news"></div>
    </body>
```

Depending on your implementation, this may be more efficient than the polling example above since the server would
notify the div if there was new news to get, rather than the steady requests that a poll causes.

### <a name="indicators"></a> [Request Indicators](#indicators)

When an AJAX request is issued it is often good to let the user know that something is happening since the browser
will not give them any feedback.  You can accomplish this in kutty by using `kutty-indicator` class.

The `kutty-indicator` class is defined so that the opacity of any element with this class is 0 by default, making it invisible
but present in the DOM.  

When kutty issues a request, it will put a `kutty-request` class onto an element (either the requesting element or
another element, if specified).  The `kutty-request` class will cause a child element with the `kutty-indicator` class
on it to transition to an opacity of 1, showing the indicator.

```html
  <button kt-get="/click">
      Click Me!
     <img class="kutty-indicator" src="/spinner.gif"/>
  </button>
```

Here we have a button.  When it is clicked the `kutty-request` class will be added to it, which will reveal the spinner
gif element.  (I like [SVG spinners](http://samherbert.net/svg-loaders/) these days.)

While the `kutty-indicator` class uses opacity to hide and show the progress indicator, if you would prefer another mechanism
you can create your own CSS transition like so:

```css
    .kutty-indicator{
        display:none;
    }
    .kutty-request .my-indicator{
        display:inline;
    }
    .kutty-request.my-indicator{
        display:inline;
    }
```

If you want the `kutty-request` class added to a different element, you can use the [kt-indicator](/attributes/kt-indicator)
attribute with a CSS selector to do so:

```html
  <div>
      <button kt-get="/click" kt-indicator="#indicator">
        Click Me!
      </button>
      <img id="indicator" class="kutty-indicator" src="/spinner.gif"/>  
  </div>
```

Here we call out the indicator explicitly by id.  Note that we could have placed the class on the parent `div` as well
and had the same effect.

### <a name="targets"></a> [Targets](#targets)

If you want the response to be loaded into a different element other than the one that made the request, you can
use the  [kt-target](/attributes/kt-target) attribute, which takes a CSS selector.  Looking back at our Live Search example:

```html
   <input type="text" name="q" 
          kt-get="/trigger_delay" 
          kt-trigger="keyup delay:500ms changed" 
          kt-target="#search-results"
          placeholder="Search..."/>
    <div id="search-results"></div>
```

You can see that the results from the search are going to be loaded into `div#search-results`, rather than into the
input tag.

### <a name="swapping"></a> [Swapping](#swapping)

kutty offers a few different ways to swap the HTML returned into the DOM.  By default, the content replaces the
`innerHTML` of the target element.  You can modify this by using the [kt-swap](/attributes/kt-swap) attribute 
with any of the following values:

* `innerHTML` - the default, puts the content inside the target element
* `outerHTML` - replaces the entire target element with the returned content
* `afterbegin` - prepends the content before the first child inside the target
* `beforebegin` - prepends the content before the target in the targets parent element
* `beforeend` - appends the content after the last child inside the target
* `afterend` - appends the content after the target in the targets parent element

#### <a name="oob_swaps"></a>[Out of Band Swaps](#oob_swaps)

If you want to swap content from a response directly into the DOM by using the `id` attribute you can use the
[kt-swap-oob](/attributes/kt-swap-oob) attribute in the *response* html:

```html
  <div id="message" kt-swap-oob="true">Swap me directly!</div>
  Additional Content
```

In this response, `div#message` would be swapped directly into the matching DOM element, while the additional content
would be swapped into the target in the normal manner.

You can use this technique to "piggy-back" updates on other requests.  

Note that out of band elements must be in the top level of the response, and not children of the top level elements.

#### Selecting Content To Swap

If you want to select a subset of the response HTML to swap into the target, you can use the [kt-select](/attributes/kt-select)
attribute, which takes a CSS selector and selects the matching elements from the response.

### <a name="parameters"></a> [Parameters](#parameters)

By default, an element that causes a request will include its value if it has one.  If the element is a form it
will include the values of all inputs within it.

Additionally, if the element causes a non-`GET` request, the values of all the inputs of the nearest enclosing form
will be included.

If you wish to include the values of other elements, you can use the [kt-include](/attributes/kt-include) attribute
with a CSS selector of all the elements whose values you want to include in the request.

If you wish to filter out some parameters you can use the [kt-params](/attributes/kt-params) attribute.

Finally, if you want to programatically modify the parameters, you can use the [configRequest.kutty](/events#configRequest.kutty) 
event.

## <a name="history"></a> [History Support](#history)

Kutty provides a simple mechanism for interacting with the [browser history API](https://developer.mozilla.org/en-US/docs/Web/API/History_API):

If you want a given element to push its request URL into the browser navigation bar and add the current state of the page
to the browser's history, include the [kt-push](/attributes/kt-push) attribute:

```html
    <a kt-get="/blog" kt-push="true">Blog</a>
```
  
When a user clicks on this link, kutty will snapshot the current DOM and store it before it makes a request to /blog. 
It then does the swap and pushes a new location onto the history stack.

When a user hits the back button, kutty will retrieve the old content from storage and swap it back into the target,
 simulating "going back" to the previous state.

### Specifying History Snapshot Element

By default, kutty will use the `body` to take and restore the history snapshop from.  This is usually the right thing, but
if you want to use a narrower element for snapshotting you can use the [kt-history-element](/attributes/kt-history-element)
attribute to specify a different one.  

Careful: this element will need to be on all pages or restoring from history won't work reliably.

## <a name="requests">[Requests &amp; Responses](#requests)

Kutty expects responses to the AJAX requests it makes to be HTML, typically HTML fragments (although a full HTML 
document, matched with a [kt-select](/attributes/kt-select) tag can be useful too).  Kutty will then swap the returned
HTML into the document at the target specified and with the swap strategy specified.

Sometimes you might want to do nothing in the swap, but still perhaps trigger a client side event ([see below](#response-headers)).
For this situation you can return a `204 - No Content` response code, and kutty will ignore the content of the response.

In the event of an error response from the server (e.g. a 404 or a 501), kutty will trigger the [`responseError.kutty`](/events#responseError.kutty)
event, which you can handle.  

In the event of a connection error, the `sendError.kutty` event will be triggered.

### <a name="request-header"></a> [Request Headers](#request-headers)

kutty includes a number of useful headers in requests:

* `X-KT-Request` - will be set to "true"
* `X-KT-Trigger` - will be set to the id of the element that triggered the request
* `X-KT-Trigger-Name` - will be set to the name of the element that triggered the request
* `X-KT-Target` - will be set to the id of the target element
* `X-KT-Current-URL` - will be set to the URL of the browser
* `X-KT-Prompt` - will be set to the value entered by the user when prompted via [kt-prompt](/attributes/kt-prompt)
* `X-KT-Event-Target` - the id of the original target of the event that triggered the request
* `X-KT-Active-Element` - the id of the current active element
* `X-KT-Active-Element-Name` - the name of the current active element
* `X-KT-Active-Element-Value` - the value of the current active element

### <a name="response-header"></a> [Response Headers](#response-headers)

kutty supports two special response headers:

* `X-KT-Trigger` - can be used to trigger client side events, see the [documentation](/headers/x-kt-trigger) for examples.
* `X-KT-Push` - can be used to push a new URL into the browsers address bar

### Request Order of Operations

The order of operations in a kutty request are:

* The element is triggered and begins a request
  * Values are gathered for the request
  * The `kutty-request` class is applied to the appropriate elements
  * The request is then issued asynchronously via AJAX
    * Upon getting a response the target element is marked with the `kutty-swapping` class
    * An optional swap delay is applied (see the [kt-swap-delay](/attributes/kt-swap-delay) attribute)
    * The actual content swap is done
        * the `kutty-swapping` class is removed from the target
        * the `kutty-settling` class is applied to the target
        * A settle delay  is done (default: 100ms)
        * The DOM is settled
        * the `kutty-settling` class is removed from the target

You can use the `kutty-swapping` and `kutty-settling` classes to create 
[CSS transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions) between pages.

## Miscellaneous Attributes

In addition to the core AJAX functionality, kutty also has a few other tricks up its sleeve that help you build
nice interfaces without javascript.

### Class Swapping

Kutty supports an attribute, [kt-classes](/attributes/kt-classes) that allows you to add, remove and toggle classes after 
a delay.  This can be used to create CSS transition effects.

Here are some examples:

```html
<!-- adds the class "foo" after 100ms -->
<div kt-classes="add foo"/> 

<!-- removes the class "bar" after 1s -->
<div kt-classes="remove bar:1s"/> 

<!-- removes the class "bar" after 1s
     then adds the class "foo" 1s after that -->
<div kt-classes="remove bar:1s, add foo:1s"/> 

<!-- removes the class "bar" and adds 
     class "foo" after 1s  -->
<div kt-classes="remove bar:1s & add foo:1s"/> 

<!-- toggles the class "foo" every 1s -->
<div kt-classes="toggle foo:1s"/>
```

Full documentation is available [on the documentation page.](/attributes/kt-classes)

### Boosting

Kutty supports "boosting" regular HTML anchors and forms with the [kt-boost](/attributes/kt-boost) attribute.  This
attribute will convert all anchor tags and forms into AJAX requests that, by default, target the body of the page.

This functionality is somewhat similar to [Turbolinks](https://github.com/turbolinks/turbolinks).

## <a name="events"></a> [Events & Logging](#events)

Kutty has an extensive events mechanism, which doubles as the logging system.  

If you want to register for a given kutty event you can use the following javascript:

```javascript
  kutty.on("load.kutty", function(evt) {
        myJavascriptLib.init(evt.details.elt);  
  });
```

This event is fired every time an element is loaded into the DOM by kutty, and is effectively the load event.  In
fact this is so common, you can use the helper function:

```javascript
  kutty.onLoad(function(target) {
        myJavascriptLib.init(target);  
  });
```
This does the same thing as the first example, but is a little cleaner.  

The full set of events can be seen [on the reference page](/reference#events).

### Logging

If you set a logger at `kutty.logger`, every event will be logged.  This can be very useful for troubleshooting:

```javascript
    kutty.logger = function(elt, event, data) {
        if(console) {
            console.log(event, elt, data);
        }
    }
```

Kutty can also send errors to a URL that is specified with the [kt-error-url](/attributes/kt-error-url) attributes. This can be useful for debugging client-side issues.

Kutty includes a helper method:

```javascript
  kutty.logAll();
```

if you want to log everything while developing.

## <a name="config"></a>[Configuring kutty](#config)

Kutty allows you to configure a few defaults:

*  `kutty.config.historyEnabled` - defaults to `true`, really only useful for testing
*  `kutty.config.historyCacheSize` - defaults to 10
*  `kutty.config.defaultSwapStyle` - defaults to `innerHTML`
*  `kutty.config.defaultSwapDelay` - defaults to 0
*  `kutty.config.defaultSettleDelay` - defaults to 100

You can set them directly in javascript, or you can use a `meta` tag:

```html
    <meta name="kutty-config" content='{"defaultSwapStyle":"outerHTML"}'>
```

### Conclusion

And that's it!  Have fun with kutty: you can accomplish [quite a bit](/examples) without a lot of code.

</div>
</div>
