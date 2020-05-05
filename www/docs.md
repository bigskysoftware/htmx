---
layout: layout.njk
title: HTMx - HTML Extensions
---
<div class="row">
<div class="2 col nav">

**Contents**

* [introduction](#introduction)
* [installing](#installing)
* [ajax](#ajax)
  * [triggers](#triggers)
    * [special events](#special-events)
    * [polling](#polling)
    * [SSE](#sse)
  * [targets](#targets)
  * [forms](#forms)
  * [swapping](#swapping)
* [history](#history)
* [requests & responses](#requests)
* [misc](#misc)
* [events & logging](#events)

</div>
<div class="10 col">

## <a name="introduction"></a>[HTMx in a Nutshell](#introduction)
HTMx is a set of attributes in HTML that allow you to access modern browser features directly
from the browser.  To understand how HTMx works, first lets take a look at an anchor tag:

``` html
  <a href="/blog">Blog</a>
```

This anchor tag tells a browser:
targest
> "When a user clicks on this link, issue an HTTP GET request to '/blog' and load the response content 
>  into the browser window".

Now consider some HTMx code:

``` html
  <a hx-post="/click">Click Me!</a>
```

This tells a browser:

> "When a user clicks on this link, issue an HTTP GET request to '/blog' and load the response content into the inner 
> html of this element"

So the difference is that with HTMx:

* A different HTTP action is used
* The request is done via AJAX
* The response replaces the content of the element, rather than the entire page

HTMx expects responses to the AJAX calls that it makes to be *HTML* rather than *JSON*, as is more typical with AJAX 
requests.

If you would prefer, you can use the `data-` prefix when using HTMx:

``` html
  <a data-hx-post="/click">Click Me!</a>
```

## <a name="installing"></a> [Installing](#installing)

Intercooler is a dependency-free library, written in javascript.  

It can be loaded via NPM as "`htmx.org`" or included from [unpkg](https://unpkg.com/browse/htmx.org/):

``` html
    <script src="https://unpkg.com/htmx.org@0.0.1"></script>
```

## <a name="ajax"></a> [AJAX](#ajax)

HTMx provides attributes to allow you to issue AJAX requests directly from HTML.  The main attributes are:

* [hx-get](/attributes/hx-get) - Issues a `GET` request to the given URL
* [hx-post](/attributes/hx-post) - Issues a `POST` request to the given URL
* [hx-put](/attributes/hx-put) - Issues a `PUT` request to the given URL (see [details](#htmx-request-details))
* [hx-patch](/attributes/hx-patch) - Issues a `PATCH` request to the given URL  (see [details](#htmx-request-details))
* [hx-delete](/attributes/hx-delete) - Issues a `GET` request to the given URL (see [details](#htmx-request-details))

Each of these attributes takes a URL to issue an AJAX request to.  The element will issue a request of the specified
type to the given URL when the element is triggered.

### <a name="triggers"></a> [Triggering Requests](#triggers)

By default, elements issue a request on the "natural" event:

* `input`, `textarea` & `select`: the `change` event
* `form`: the `submit` event
* everything else: the `click` event

You might not want to use the default event.  In this case you can use the [hx-trigger](/attributes/hx-trigger)
attribute to specify the event you want the element to respond to.  Here is a `div` that posts to `/mouse_entered`
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

If the element is an input, and you only want the request to happen when the value changes, you can use the
[hx-trigger-changed-only](/attributes/hx-trigger-changed-only) attribute.

This can be paired with the [hx-trigger-delay](/attributes/hx-trigger-delay) attribute to implement a common UX
pattern, [Live Search](/demo/live-search):

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

You can see that the results from the search are going to be loaded into `div#search-results`.

### <a name="forms"></a> [Forms & Input Values](#forms)

By default, an element will include its value if it has one.  Additionally, if the element is in a form, all values
in the form will be included in the response.

If you wish to include the values of other elements, you can use the [hx-include](/attributes/hx-include) attribute
with a CSS selector of all the elements whose values you want to include in the request.

Finally, if you want to programatically modify the arguments, you can use the [values.hx](/events/values.hx) event to
do so.

### <a name="swapping"></a> [Swapping](#swapping)

HTMx offers a few different ways to swap the HTML returned into the DOM.  By default, the content replaces the
`innerHTML` of the target element.  You can modify this by using the [hx-swap](/attributes/hx-swap) attribute 
with any of the following values:

* `innerHTML` - the default, puts the content inside the target element
* `outerHTML` - replaces the target element with the returned content
* `prepend` - prepends the content before the first child inside the target
* `prependBefore` - prepends the content before the target in the targets parent element
* `append` - appends the content after the last child inside the target
* `appendAfter` - appends the content after the target in the targets parent element
* `merge` - attempts to merge the response content into the target, reusing matching elements in the existing DOM

#### Out of Band Swaps

If you want to swap content from a response directly into the DOM by using the `id` attribute you can use the
[hx-swap-directly](/attributes/hx-swap-directly) attribute in the *response* html:

```html
  <div id="message" hx-swap-directly="true">Swap me directly!</div>
  Additional Content
```

In this response, `div#message` would be swapped directly into the matching DOM element, while the additional content
would be swapped into the target in the normal manner.

You can use this technique to "piggy-back" updates on other requests.  

If you want the out of band content merged you can use the value `merge` for this attribute.

#### Selecting Content To Swap

If you want to select a subset of the response HTML to swap into the target, you can use the [hx-select](/attributes/hx-select)
attribute, which takes a CSS selector and selects the matching elements from the response.

## <a name="history"></a> [History Support](#history)

HTMx provides a simple mechanism for interacting with the [browser history API](https://developer.mozilla.org/en-US/docs/Web/API/History_API):

If you want a given element to push its request into the browser navigation bar and add the current state of the page
to the browsers history, include the [hx-push](/attributes/hx-push) attribute:

```html
    <a hx-get="/Blog" hx-push="true">Blog</a>
```
  
When a user clicks on this link, HTMx will snapshot the current DOM and store it before it makes a request to /blog. 
It then does the swap and pushes a new location onto the history stack.

When a user hits the back button, HTMx will retrieve the old content from storage and swap it back into the target,
 simulating "going back" to the previous state.

### Specifying History Snapshot Element

By default, HTMx will use the `body` to take and restore the history snapshop from.  This is usually good enough but
if you want to use a narrower element for snapshotting you can use the [hx-history-element](/attributes/hx-history-element)
attribute to specify a different one.  Careful: this element will need to be on all pages or restoring from history
won't work reliably.

## <a name="requests">[Requests & Responses](#requests)

## Miscellaneous Attributes

### Class Swapping

### Timed Removal

### Boosting

## <a name="events"></a> [Events & Logging](#events)

</div>
</div>