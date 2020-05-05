---
layout: layout.njk
title: HTMx - HTML Extensions
---
<div class="row">
<div class="2 col nav">

**Contents** 
<svg onclick="document.getElementById('contents').classList.toggle('show')" class="hamburger" viewBox="0 0 100 80" width="25" height="25" style="margin-bottom:-5px">
<rect width="100" height="20" style="fill:rgb(52, 101, 164)" rx="10"></rect>
<rect y="30" width="100" height="20" style="fill:rgb(52, 101, 164)" rx="10"></rect>
<rect y="60" width="100" height="20" style="fill:rgb(52, 101, 164)" rx="10"></rect>
</svg>

<div id="contents" class="collapse">

* [introduction](#introduction)
* [installing](#installing)
* [ajax](#ajax)
  * [triggers](#triggers)
    * [special events](#special-events)
    * [polling](#polling)
    * [SSE](#sse)
  * [targets](#targets)
  * [indicators](#indicators)
  * [swapping](#swapping)
  * [forms](#forms)
* [history](#history)
* [requests & responses](#requests)
* [misc](#misc)
* [events & logging](#events)

</div>
</div>
<div class="10 col">

## <a name="introduction"></a>[HTMx in a Nutshell](#introduction)

HTMx is a set of attributes that allow you to access modern browser features directly from HTML, rather than using
javascript.  

To understand how HTMx works, first lets take a look at an anchor tag:

``` html
  <a href="/blog">Blog</a>
```

This anchor tag tells a browser:

> "When a user clicks on this link, issue an HTTP GET request to '/blog' and load the response content 
>  into the browser window".

With that in mind, consider the following HTMx code:

``` html
  <div hx-post="/clicked">Click Me!</div>
```

This tells a browser:

> "When a user clicks on this div, issue an HTTP POST request to '/clicked' and load the response content into the inner 
> html of this element"

So the difference is that with HTMx:

* Any element can issue a HTTP request
* The HTTP request is done via AJAX
* Different HTTP verbs can used
* The response replaces the content of the element, rather than the entire page

HTMx expects responses to the AJAX calls that it makes to be *HTML* rather than *JSON*, as is more typical with AJAX 
requests.

If you prefer it, you can use the `data-` prefix when using HTMx:

``` html
  <a data-hx-post="/click">Click Me!</a>
```

## <a name="installing"></a> [Installing](#installing)

HTMx is a dependency-free javascript library.  

It can be used via [NPM](https://www.npmjs.com/) as "`htmx.org`" or downloaded or included 
from [unpkg](https://unpkg.com/browse/htmx.org/):

``` html
    <script src="https://unpkg.com/htmx.org@0.0.1"></script>
```

## <a name="ajax"></a> [AJAX](#ajax)

One of the primary features HTMx provides are attributes to allow you to issue AJAX requests directly from HTML:

* [hx-get](/attributes/hx-get) - Issues a `GET` request to the given URL
* [hx-post](/attributes/hx-post) - Issues a `POST` request to the given URL
* [hx-put](/attributes/hx-put) - Issues a `PUT` request to the given URL (see [details](#htmx-request-details))
* [hx-patch](/attributes/hx-patch) - Issues a `PATCH` request to the given URL  (see [details](#htmx-request-details))
* [hx-delete](/attributes/hx-delete) - Issues a `GET` request to the given URL (see [details](#htmx-request-details))

Each of these attributes takes a URL to issue an AJAX request to.  The element will issue a request of the specified
type to the given URL when the element is [triggered](#triggers):

```html
  <div hx-put="/messages">Put To Messages</div>
```

This tells the browser:

> When a user clicks on this div, PUT to the URL /messages and load the response into the div

### <a name="triggers"></a> [Triggering Requests](#triggers)

By default AJAX requests are triggered by the "natural" event of an element:

* `input`, `textarea` & `select`: the `change` event
* `form`: the `submit` event
* everything else: the `click` event

If you don't want the request to happen on the default event, you can use the [hx-trigger](/attributes/hx-trigger)
attribute to specify the event of interest.  Here is a `div` that posts to `/mouse_entered`
when a mouse enters it:

```html
   <div hx-post="/mouse_entered" hx-trigger="mouseenter">
      [Here Mouse, Mouse!]
   </div>
```

If you want a request to only happen once, you can use the [hx-trigger-once](/attributes/hx-trigger-once) attribute:

```html
   <div hx-post="/mouse_entered" hx-trigger="mouseenter" 
        hx-trigger-once="true">
     [Here Mouse, Mouse!]
   </div>
```

There are two additional modifiers you can use for trigger:

* [hx-trigger-changed-only](/attributes/hx-trigger-changed-only) - when set to `true` the element will only issue a
request if its value has changed
*  [hx-trigger-delay](/attributes/hx-trigger-delay) - tells HTMx to wait the given amount of time (e.g. `1s`) before
issuing the request.  If the event triggers again, the countdown is reset.

You can use these two attributes to implement a common UX pattern, [Live Search](/demo/live-search):

```html
   <input type="text" name="q" 
          hx-get="/trigger_delay" 
          hx-trigger="keyup" 
          hx-target="#search-results" 
          hx-trigger-delay="500ms" placeholder="Search..."/>
    <div id="search-results"></div>
```

This input will issue a request 500 milliseconds after a key up event if the input has been changed and puts the results
into the `div#search-results`.

#### <a name="special-events"></a> [Special Events](#special-events)

HTMx provides a few special events for use in [hx-trigger](/attributes/hx-trigger):

* `load` - fires once when the element is first loaded
* `revealed` - fires once when an element first scrolls into the viewport

You can also use custom events to trigger requests if you have an advanced use case.

#### <a name="polling"></a> [Polling](#polling)

If you want an element to poll the given URL rather than wait for an event, you can use the `every` syntax:

```html
  <div hx-get="/news" trigger="every 2s"></div>
```

This tells HTMx

> Every 2 seconds, issue a GET to /news and load the response into the div

#### <a name="sse"></a> [Server Sent Events](#sse)

[Server Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) are
a way for servers to send events to browsers.  It provides a higher-level mechanism for communication between the
server and the browser than websockets.

If you want an element to respond to a Server Sent Event via HTMx, you need to do two things:

1. Define an SSE source.  To do this, add a [hx-sse-src](/attributes/hx-sse-src) attribute on a parent element
that specifies the URL from which Server Sent Events will be received.

2. Specify the Server Sent Event that will trigger the element, with the prefix `sse:`

Here is an example:

```html
    <body hx-sse-src="/sse_messages">
        <div trigger="sse:new_news" hx-get="/news"></div>
    </body>
```

Depending on your implementation, this may be more efficient than the polling example above since the server would
notify the div if there was new news to get, rather than the steady requests that a poll causes.

### <a name="indicators"></a> [Request Indicators](#indicators)

When an AJAX request is issued it is often good to let the user know that something is happening, since the browser
will not give them any feedback.  You can accomplish this in HTMx by using the [hx-indicator](/attributes/hx-indicator)
attribute, the `hx-show-indicator` class and some CSS.

By default the `hx-show-indicator` class will be put on the element issuing the request.  This can be used to show a
spinner gif, for example:

```html
  <style>
    .indicator { display: none }
    .hx-show-indicator .indicator { display: inline }
  </style>
  <button hx-get="/click">
      Click Me!
     <img class="indicator" src="/spinner.gif"/>
  </button>
```

If you want the `hx-show-indicator` class added to a different element, you can use the [hx-indicator](/attributes/hx-indicator)
attribute with a CSS selector to do so:

```html
  <style>
    .indicator { display: none }
    .hx-show-indicator .indicator { display: inline }
  </style>
  <div id="parent-div">
      <button hx-get="/click" hx-indicator="#parent-div">
        Click Me!
      </button>
      <img class="indicator" src="/spinner.gif"/>  
  </div>
```
### <a name="targets"></a> [Targets](#targets)

If you want the response to be loaded into a different element other than the one that made the request, you can
use the  [hx-target](/attributes/hx-target) attribute, which takes a CSS selector.  Looking back at our Live Search example:

```html
   <input type="text" name="q" 
          hx-get="/trigger_delay" 
          hx-trigger="keyup" 
          hx-target="#search-results" 
          hx-trigger-delay="500ms" placeholder="Search..."/>
    <div id="search-results"></div>
```

You can see that the results from the search are going to be loaded into `div#search-results`, rather than into the
input tag.

### <a name="swapping"></a> [Swapping](#swapping)

HTMx offers a few different ways to swap the HTML returned into the DOM.  By default, the content replaces the
`innerHTML` of the target element.  You can modify this by using the [hx-swap](/attributes/hx-swap) attribute 
with any of the following values:

* `innerHTML` - the default, puts the content inside the target element
* `outerHTML` - replaces the entire target element with the returned content
* `prepend` - prepends the content before the first child inside the target
* `prependBefore` - prepends the content before the target in the targets parent element
* `append` - appends the content after the last child inside the target
* `appendAfter` - appends the content after the target in the targets parent element

#### Out of Band Swaps

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

### <a name="forms"></a> [Forms & Input Values](#forms)

By default, an element will include its value if it has one.  Additionally, if the element is in a form, all values
in the form will be included in the request.

If you wish to include the values of other elements, you can use the [hx-include](/attributes/hx-include) attribute
with a CSS selector of all the elements whose values you want to include in the request.

Finally, if you want to programatically modify the arguments, you can use the [values.hx](/events/values.hx) event to
do so.

## <a name="history"></a> [History Support](#history)

HTMx provides a simple mechanism for interacting with the [browser history API](https://developer.mozilla.org/en-US/docs/Web/API/History_API):

If you want a given element to push its request into the browser navigation bar and add the current state of the page
to the browser's history, include the [hx-push](/attributes/hx-push) attribute:

```html
    <a hx-get="/Blog" hx-push="true">Blog</a>
```
  
When a user clicks on this link, HTMx will snapshot the current DOM and store it before it makes a request to /blog. 
It then does the swap and pushes a new location onto the history stack.

When a user hits the back button, HTMx will retrieve the old content from storage and swap it back into the target,
 simulating "going back" to the previous state.

### Specifying History Snapshot Element

By default, HTMx will use the `body` to take and restore the history snapshop from.  This is usually the right thing, but
if you want to use a narrower element for snapshotting you can use the [hx-history-element](/attributes/hx-history-element)
attribute to specify a different one.  

Careful: this element will need to be on all pages or restoring from history won't work reliably.

## <a name="requests">[Requests &amp; Responses](#requests)

### Request Headers

HTMx includes a number of useful headers in requests:

* `X-HX-Request` - will be set to "true"
* `X-HX-Trigger-Id` - will be set to the id of the element that triggered the request
* `X-HX-Trigger-Name` - will be set to the name of the element that triggered the request
* `X-HX-Target-Id` - will be set to the id of the target element
* `X-HX-Current-URL` - will be set to the URL of the browser
* `X-HX-Prompt` - will be set to the value entered by the user when prompted via [hx-prompt](/attributes/hx-prompt)
* `X-HX-Event-Target` - the id of the original target of the event that triggered the request
* `X-HX-Active-Element` - the id of the current active element
* `X-HX-Active-Element-Value` - the value of the current active element

### Response Headers

HTMx supports two special response headers:

* `X-HX-Trigger` - can be used to trigger client side events, see the [documentation](/events/x-hx-trigger) for examples.
* `X-HX-Push` - can be used to push a new URL into the browsers address bar

### Request Order of Operations

The order of operations in a HTMx request are:

* The element is triggered and begins a request
  * Values are gathered for the request
  * The `hx-show-indicator` class is applied to the appropriate elements
  * The request is then issued asynchronously via AJAX
    * Upon getting a response the target element is marked with the `hx-swapping` class
    * An optional swap delay is done (default: no delay)
    * The actual content swap is done
        * A settle delay  is done (default: 100ms)
        * The DOM is settled


## Miscellaneous Attributes

### Class Swapping

### Timed Removal

### Boosting

## <a name="events"></a> [Events & Logging](#events)

</div>
</div>