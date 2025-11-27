+++
title = "Documentation"
[extra]
table_of_contents = true
+++

## htmx in a Nutshell {#introduction}

htmx is a library that allows you to access modern browser features directly from HTML, rather than using
JavaScript.

To understand the htmx approach, first let's take a look at the two main _hypermedia controls_, or interactive elements
of HTML, the [anchor tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a) and the 
[form tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form):

```html
<a href="/blog">Blog</a>

<form method="post" action="/register">
    <label>Email: <input type="email"></label>
    <button type="submit">Submit</button>
</form>
```

The anchor tag tells a browser:

> When a user clicks on this link, issue an HTTP GET request to '/blog' and load the response content
>  into the browser window

The form tag tells a browser:

> When a user submits this form, issue an HTTP POST request to '/register' and load the response content
>  into the browser window

Both these elements support a [`target`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form#target)
attribute that allows you to place the response in an [`iframe`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe)
rather than replacing the entire page:

```html
<form method="post" action="/register" target="iframe1">
    <label>Email: <input type="email"></label>
    <button type="submit">Submit</button>
</form>
<iframe name="iframe1">
  <!-- The response will be placed here-->
</iframe>
```

This is called [transclusion](https://en.wikipedia.org/wiki/Transclusion), where on HTML document is included inside 
another document.

With these ideas in mind, consider the following bit of htmx-powered HTML:

```html
<button hx-post="/clicked"
    hx-trigger="click"
    hx-target="#ouput-elt"
    hx-swap="outerHTML">
    Click Me!
</button>
<output id="output-elt">
</output>
```

Given these attribute, htmx will enable the following behavior:

> When a user clicks on this button, issue an HTTP POST request to '/clicked' and use the content from the response
>  to replace the element with the id `output-elt` in the DOM

htmx [generalizes the idea of hypermedia controls](https://dl.acm.org/doi/pdf/10.1145/3648188.3675127) in HTML, which means that 
any element can issue an any [HTTP verb](https://en.wikipedia.org/wiki/HTTP_Verbs) HTTP request in response to any 
[event](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Events), and the response content can
be place anywhere in the page.

Like in the case of the link and form examples above, htmx expects the server to responds with HTML, not *JSON*.  

In this manner, htmx follows the [original web programming model](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm)
of the web, using [Hypertext As The Engine Of Application State](https://en.wikipedia.org/wiki/HATEOAS).

## 2.x to 4.x Migration Guide

[Version 2](https://v2.htmx.org) (and [Version 1](https://v1.htmx.org)) of htmx are still supported, but the latest 
version of htmx is 4.x.

If you are migrating to htmx 4.x from [htmx 2.x](https://v2.htmx.org), please see the [htmx 4.x migration guide](@/migration-guide-htmx-4.md).

## Installing

htmx is a dependency-free, browser-oriented javascript library. 

This means that using it can be as simple as adding a `<script>` tag to your document `<head>` tag.  

There is no need for a build system to use htmx.

### Via A CDN (e.g. jsDelivr)

The fastest way to get going with htmx is to load it via a CDN. 

Just add this to your head tag and you can get going:

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-alpha4/dist/htmx.min.js" integrity="sha384-PDdj2nduKy1q0jypHdCWFooDDtqv/oZIRlt2KvIJ6i1OHNnAJ5vCYA1Gl6SLNtsv" crossorigin="anonymous"></script>
```

An unminified version is also available as well:

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-alpha4/dist/htmx.js" integrity="sha384-Grwu/gZN5kl/g7YEfzPcip4HXH4dPYr/+bSUFhUWTeJkeR7oMNaHVhVCxrKQ5r58" crossorigin="anonymous"></script>
```

While this CDN-based approach is quick and easy, you may want to consider [not using CDNs in production](https://blog.wesleyac.com/posts/why-not-javascript-cdn).

### Download a copy

The next easiest way to install htmx is to copy it into your project, an option called [vendoring](@/essays/vendoring.md).

Download `htmx.min.js` <a download href="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-alpha4/dist/htmx.min.js">from jsDelivr</a> 
and hen add it to the appropriate directory in your project and include it where necessary with a `<script>` tag:

```html
<script src="/path/to/htmx.min.js"></script>
```

### npm

For npm-style build systems, you can install htmx via [npm](https://www.npmjs.com/):

```sh
npm install htmx.org@4.0.0-alpha4
```

After installing, you’ll need to use appropriate tooling to use `node_modules/htmx.org/dist/htmx.js` (or `.min.js`).
For example, you might bundle htmx with some extensions and project-specific code.

### Module Imports

When using htmx with module bundlers, you can import it as an ES module:

```javascript
import htmx from 'htmx.org';
```

This makes `htmx` available both as a module import and globally as `window.htmx`. Extensions can be imported alongside htmx and will auto-register:

```javascript
import htmx from 'htmx.org';
import 'htmx.org/dist/ext/preload';
```

## AJAX

<details class="migration-note">
<summary>htmx 2.0 to 4.0 Changes</summary>

htmx 4.0 uses the <code>fetch()</code> API instead of XMLHttpRequest. This enables built-in streaming response support 
and simplifies the implementation of htmx, but does create some significant changes between the two versions.

</details>

At the core of htmx are two attributes that allow you to issue fetch()-based AJAX requests directly from HTML:

| Attribute                              | Description                                                                                             |
|----------------------------------------|---------------------------------------------------------------------------------------------------------|
| [hx-action](@/attributes/hx-action.md) | Specifies a URL to issue the request to                                                                 |
| [hx-method](@/attributes/hx-method.md) | Specifies the [HTTP Method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods) to use |

These attributes can be used like so:

```html
<button hx-method="post" hx-action="/messages">
    Post To Messages
</button>
```
This tells the browser:

> When a user clicks on this button, issue a POST request to the URL /messages and load the response into the button

If no method is specified, the default `GET` method will be used.

Because it is so common to specify a method & action together, htmx provides five attributes that allow
you to specify both in the same single attribute.

| Attribute                              | Description                                |
|----------------------------------------|--------------------------------------------|
| [hx-get](@/attributes/hx-get.md)       | Issues a `GET` request to the given URL    |
| [hx-post](@/attributes/hx-post.md)     | Issues a `POST` request to the given URL   |
| [hx-put](@/attributes/hx-put.md)       | Issues a `PUT` request to the given URL    |
| [hx-patch](@/attributes/hx-patch.md)   | Issues a `PATCH` request to the given URL  |
| [hx-delete](@/attributes/hx-delete.md) | Issues a `DELETE` request to the given URL |

These attributes are typically used in place of `hx-method` & `hx-action`.

Here is the example above redone using `hx-post`:

```html
<button hx-post="/messages">
    Post To Messages
</button>
```

### Configuring Requests

You can configure requests that an element makes via the `hx-config` attribute.  This attribute is specified using
JSON, and supports the following options:

| Property      | Type    | Description                                              | Example       |
|---------------|---------|----------------------------------------------------------|---------------|
| `timeout`     | number  | Request timeout in milliseconds                          | 5000          |
| `credentials` | string  | Fetch credentials mode: "omit", "same-origin", "include" | "include"     |
| `mode`        | string  | Fetch mode: "cors", "no-cors", "same-origin"             | "cors"        |
| `cache`       | string  | Fetch cache mode: "default", "no-cache", "reload", etc.  | "no-cache"    |
| `redirect`    | string  | Fetch redirect mode: "follow", "error", "manual"         | "follow"      |
| `referrer`    | string  | Referrer URL or "no-referrer"                            | "no-referrer" |
| `integrity`   | string  | Subresource integrity value                              | "sha384-..."  |
| `validate`    | boolean | Whether to validate form before submission               | true          |

For example, if you wish to set the timeout for a request to a different value than the default, you could write
the following HTML:

Setting Request Timeout

```html

<button hx-get="/slow-endpoint"
        hx-config='{"timeout": 10000}'>
Load (10s timeout)
</button>
```
#### Merging Config Information

Sometimes it is useful to merge configuration information with a parent configuration, rather than replacing it.  The
hx-config attribute offers a syntax for doing so:

Merging Configuration with + Prefix

You can merge configuration objects into nested properties using the + prefix:

```html
<button hx-get="/data"
        hx-config='{"+headers": {"X-Custom": "value"}}'>
  Load with Custom Header
</button>
```

By prefixing the property name with a `+`, the information will be merged into an existing value from a parent, rather
than replacing it.

#### Overriding Configuration With The `htmx:config:request` Event

You can control almost every aspect of a request via the `htmx:config:request` event.  This event offers a "request 
context" object that holds information regarding the request that is going to be sent:

```js
{
    sourceElement,  // The element that triggered the request
    sourceEvent,    // The event that triggered the request
    target,         // The swap target element
    select,         // hx-select value
    selectOOB,      // hx-select-oob value
    swap,           // hx-swap value
    push,           // hx-push-url value
    replace,        // hx-replace-url value
    transition,     // Whether to use view transitions
    request:
    {
        validate,     // Whether to validate the form
        action,       // Request URL
        method,       // HTTP method
        headers,      // Request headers object
        body,         // Request body (FormData)
        credentials,  // Fetch credentials mode
        mode,         // Fetch mode
        cache,        // Fetch cache mode
        timeout,      // Timeout in milliseconds
        // ... any other fetch options
    }
}
```

Note that calling `evt.preventDefault()` in this event will cancel the request.

### Triggering Requests {#triggers}

By default, requests are triggered by the "natural" event of an element:

* `input`, `textarea` & `select` are triggered on the `change` event
* `form` is triggered on the `submit` event
* everything else is triggered by the `click` event

If you want different behavior you can use the [hx-trigger](@/attributes/hx-trigger.md)
attribute to specify which event will cause the request.

Here is a `div` that posts to `/mouse_entered` when a mouse enters it:

```html
<div hx-post="/mouse_entered" hx-trigger="mouseenter">
    Mouse Trap
</div>
```

#### Trigger Modifiers

A trigger can also have additional modifiers that change its behavior.  For example, if you want a request to only
 happen once, you can use the `once` modifier for the trigger:

```html
<div hx-post="/mouse_entered" hx-trigger="mouseenter once">
    Mouse Trap
</div>
```

Other modifiers you can use for triggers are:

* `changed` - only issue a request if the value of the element has changed
* `delay:<time interval>` - wait the given amount of time (e.g. `1s`) before
issuing the request.  If the event triggers again, the countdown is reset.
* `throttle:<time interval>` - wait the given amount of time (e.g. `1s`) before
issuing the request.  Unlike `delay` if a new event occurs before the time limit is hit the event will be discarded,
so the request will trigger at the end of the time period.
* `from:<CSS Selector>` - listen for the event on a different element.  This can be used for things like keyboard 
  shortcuts. Note that this CSS selector is not re-evaluated if the page changes.

Multiple triggers can be specified in the [hx-trigger](@/attributes/hx-trigger.md) attribute, separated by commas.

You can use these features to implement many common UX patterns, such as [Active Search](@/patterns/active-search.md):

```html
<input type="text" name="q"
       hx-get="/search"
       hx-trigger="input delay:500ms, keyup[key=='Enter']"
       hx-target="#search-results"
       placeholder="Search...">
<div id="search-results"></div>
```

This input will issue a request 500 milliseconds after an input event occurs, or the `enter` key is pressed and inserts
the results into the `div` with the id `search-results`.

#### Trigger Filters

In the example above, you may have noticed the square brackets after the event name.  This is called a "trigger filter".

Trigger filters allow you to place a filtering javascript expression after the event name that will prevent the trigger
if the filter does not return true.  

Here is an example that triggers only on a Shift-Click of the element

```html
<div hx-get="/shift_clicked" hx-trigger="click[shiftKey]">
    Shift Click Me
</div>
```

Properties like `shiftKey` will be resolved against the triggering event first, then against the global scope.  

The `this` symbol will be set to the current element.

#### Special Events

htmx provides a few special events for use in [hx-trigger](@/attributes/hx-trigger.md):

* `load` - fires once when the element is first loaded
* `revealed` - fires once when an element first scrolls into the viewport
* `intersect` - fires once when an element first intersects the viewport.  This supports two additional options:
    * `root:<selector>` - a CSS selector of the root element for intersection
    * `threshold:<float>` - a floating point number between 0.0 and 1.0, indicating what amount of intersection to fire the event on

You can also use custom events to trigger requests.

#### Polling

Polling is a simple technique where a web page periodically issues a request to the server to see if any updates have
occurred.  It is not very highly respected in many web development circles, but it is simple, can be relatively 
resource-light because it does not maintain a constant network connection, and it tolerates network failures well

In htmx you can implement polling via the `every` syntax in the [`hx-trigger`](@/attributes/hx-trigger.md) attribute:

```html
<div hx-get="/news" hx-trigger="every 2s"></div>
```

This tells htmx:

> Every 2 seconds, issue a GET to /news and load the response into the div

#### Load Polling {#load_polling}

Another technique that can be used to achieve polling in htmx is "load polling", where an element specifies
a `load` trigger along with a delay, and replaces itself with the response:

```html
<div hx-get="/messages"
    hx-trigger="load delay:1s"
    hx-swap="outerHTML">
</div>
```

If the `/messages` end point keeps returning a div set up this way, it will keep "polling" back to the URL every
second.

Load polling can be useful in situations where a poll has an end point at which point the polling terminates, such as
when you are showing the user a [progress bar](@/patterns/progress-bar.md).

### Request Indicators {#indicators}

When an AJAX request is issued it is often good to let the user know that something is happening since the browser
will not give them any feedback.  You can accomplish this in htmx by using `htmx-indicator` class.

The `htmx-indicator` class is defined so that the opacity of any element with this class is `0` by default, making it 
invisible but present in the DOM.

When htmx issues a request, it will put a `htmx-request` class onto an element (either the requesting element or
another element, if specified).  The `htmx-request` class will cause a child element with the `htmx-indicator` class
on it to transition to an opacity of `1`, showing the indicator.

```html
<button hx-get="/click">
    Click Me!
    <img class="htmx-indicator" src="/spinner.gif" alt="Loading...">
</button>
```

Here we have a button.  When it is clicked the `htmx-request` class will be added to it, which will reveal the spinner
gif element.

The `htmx-indicator` class uses opacity to hide and show the progress indicator but if you would prefer another 
mechanism you can create your own CSS transition like so:

```css
.htmx-indicator{
    display:none;
}
.htmx-request .htmx-indicator{
    display:inline;
}
.htmx-request.htmx-indicator{
    display:inline;
}
```

If you want the `htmx-request` class added to a different element, you can use the [hx-indicator](@/attributes/hx-indicator.md)
attribute with a CSS selector to do so:

```html
<div>
    <button hx-get="/click" hx-indicator="#indicator">
        Click Me!
    </button>
    <img id="indicator" class="htmx-indicator" src="/spinner.gif" alt="Loading..."/>
</div>
```

Here we call out the indicator explicitly by id.  

Note that we could have placed the class on the parent `div` as well and had the same effect.

You can also add the [`disabled` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/disabled) to
elements for the duration of a request by using the [hx-disable](@/attributes/hx-disable.md) attribute.

### Targets

If you want the response to be loaded into a different element other than the one that made the request, you can
use the [`hx-target`](@/attributes/hx-target.md) attribute, which takes a CSS selector.  

Looking back at our Live Search example:

```html
<input type="text" name="q"
       hx-get="/search"
       hx-trigger="input delay:500ms, keyup[key=='Enter']"
       hx-target="#search-results"
       placeholder="Search...">
<div id="search-results"></div>
```

You can see that the results from the search are going to be loaded into the element with 
the id `search-results`, rather than into the input tag itself.

#### Extended CSS Selectors {#extended-css-selectors}

`hx-target`, and most attributes that take a CSS selector, support an "extended" CSS syntax:

* You can use the `this` keyword, which indicates that the element that the `hx-target` attribute is on is the target
* The `closest <CSS selector>` syntax will find the [closest](https://developer.mozilla.org/docs/Web/API/Element/closest)
  ancestor element or itself, that matches the given CSS selector.
  (e.g. `closest tr` will target the closest table row to the element)
* The `next <CSS selector>` syntax will find the next element in the DOM matching the given CSS selector.
* The `previous <CSS selector>` syntax will find the previous element in the DOM matching the given CSS selector.
* `find <CSS selector>` which will find the first child descendant element that matches the given CSS selector.
  (e.g `find tr` would target the first child descendant row to the element)

In addition, a CSS selector may be wrapped in `<` and `/>` characters, mimicking the
[query literal](https://hyperscript.org/expressions/query-reference/) syntax of hyperscript.

Relative targets like this can be useful for creating flexible user interfaces without peppering your DOM with lots
of `id` attributes.

### Swapping {#swapping}

htmx offers many different ways to swap the HTML returned into the DOM.  By default, the content replaces the
[innerHTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML) of the target element, which is called 
an `innerHTML` swap.

This is similar to how the `target` attribute on links and forms works, placing the retrieved document within an iframe.

You can modify this by using the [hx-swap](@/attributes/hx-swap.md) attribute with any of the following values:

| Name                        | Description                                                                                                                               |
|-----------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| `outerHTML`                 | the default, replaces the entire target element with the returned content                                                                 |
| `innerHTML`                 | puts the content inside the target element                                                                                                |
| `beforebegin` (or `before`) | prepends the content before the target in the target's parent element                                                                     |
| `afterbegin` (or `prepend`) | prepends the content before the first child inside the target                                                                             |
| `beforeend` (or `append`)   | appends the content after the last child inside the target                                                                                |
| `afterend` (or `after`)     | appends the content after the target in the target's parent element                                                                       |
| `delete`                    | deletes the target element regardless of the response                                                                                     |
| `none`                      | does not append content from response ([Out of Band Swaps](#oob_swaps) and [Response Headers](#response-headers) will still be processed) |
| `innerMorph`                | morphs the children of the target element, preserving as much of the existing DOM as possible                                             |
| `outerMorph`                | morphs the target element itself, preserving as much of the existing DOM as possible                                                      |

#### Morph Swaps {#morphing}

In addition to the standard swap mechanisms above, htmx also supports _morphing_ swaps, via extensions.  Morphing swaps
attempt to _merge_ new content into the existing DOM, rather than simply replacing it.  They often do a better job
preserving things like focus, video state, etc. by mutating existing nodes in-place during the swap operation, at the
cost of more CPU.

Consider this HTML:

```html
<div id="video-elt">
    <h1>Title</h1>
    <iframe id="video" width="791" height="445" src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>
</div>
<button hx-get="/swap" 
        hx-target="#video-elt"
        hx-swap="outerMorph">
    Swap Header To Bottom
</button>
```

If the response content for this looks like this:

```html
<div id="video-elt">
    <iframe id="video" width="791" height="445" src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>
    <h1>Title</h1>
</div>
```
Then htmx will "morph" the existing content to the new structure.  Note that the `h1` element has moved below the 
video.  With the `outerHTML` swap this will cause the video to stop playing and reset.  However, the morphing algorithm
uses ID elements to intelligently mutate the DOM and preserve the existing video element, keeping the video playing
smoothly.

Note that a similar effect can be achieved with the `hx-preserve` attribute, discussed below.

#### View Transitions {#view-transitions}

The [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
gives developers a way to create an animated transition between different DOM states.  

<!-- TODO - is this going to be true? -->
By default, htmx uses the viewTransition() API when swapping in content.

#### Swap Options

The [hx-swap](@/attributes/hx-swap.md) attribute also supports options for tuning the swapping behavior of htmx.  For
example, by default htmx will swap in the title of a title tag found anywhere in the new content.  You can turn this
behavior off by setting the `ignoreTitle` modifier to true:

```html
    <button hx-post="/like" hx-swap="outerHTML ignoreTitle:true">Like</button>
```

The modifiers available on `hx-swap` are:

| Option       | Description                                                                                          |
|--------------|------------------------------------------------------------------------------------------------------|
| swap         | A time interval (e.g., 100ms, 1s) to delay the swap operation                                        |
| transition   | true or false, whether to use the view transition API for this swap                                  |
| ignoreTitle  | If set to true, any title found in the new content will be ignored and not update the document title |
| strip        | true or false, whether to strip the outer element when swapping (unwrap the content)                 |
| focus-scroll | true or false, whether to scroll focused elements into view                                          |
| scroll       | top or bottom, will scroll the target element to its top or bottom                                   |
| show         | top or bottom, will scroll the target element's top or bottom into view                              |
| target       | A selector to retarget the swap to a different element                                               |


All swap modifiers appear after the swap style is specified, and are colon-separated.

See the [hx-swap](@/attributes/hx-swap.md) documentation for more details on these options.

### Synchronization {#synchronization}

Often you want to coordinate the requests between two elements.  For example, you may want a request from one element
to supersede the request of another element, or to wait until the other element's request has finished.

htmx offers a [`hx-sync`](@/attributes/hx-sync.md) attribute to help you accomplish this.

Consider a race condition between a form submission and an individual input's validation request in this HTML:

```html
<form hx-post="/store">
    <input id="title" name="title" type="text"
        hx-post="/validate"
        hx-trigger="change">
    <button type="submit">Submit</button>
</form>
```

Without using `hx-sync`, filling out the input and immediately submitting the form triggers two parallel requests to
`/validate` and `/store`.

Using `hx-sync="closest form"` on the input and `hx-sync="this:replace"` on the form will watch for requests from the form 
and abort an input's in flight request:

```html
<form hx-post="/store" hx-sync="this:replace">
    <input id="title" name="title" type="text"
        hx-post="/validate"
        hx-trigger="change"
        hx-sync="closest form">
    <button type="submit">Submit</button>
</form>
```

This resolves the synchronization between the two elements in a declarative way.

htmx also supports a programmatic way to cancel requests: you can send the `htmx:abort` event to an element to
cancel any in-flight requests:

```html
<button id="request-button" hx-post="/example">
    Issue Request
</button>
<button onclick="htmx.trigger('#request-button', 'htmx:abort')">
    Cancel Request
</button>
```

More examples and details can be found on the [`hx-sync` attribute page.](@/attributes/hx-sync.md)

### CSS Transitions {#css_transitions}

htmx makes it easy to use [CSS Transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions) without
JavaScript.  Consider this HTML content:

```html
<div id="div1">Original Content</div>
```

Imagine this content is replaced by htmx via an ajax request with this new content:

```html
<div id="div1" class="red">New Content</div>
```

Note two things:

* The div has the *same* id in the original and in the new content
* The `red` class has been added to the new content

Given this situation, we can write a CSS transition from the old state to the new state:

```css
.red {
    color: red;
    transition: all ease-in 1s ;
}
```

When htmx swaps in this new content, it will do so in such a way that the CSS transition will apply to the new content,
giving you a nice, smooth transition to the new state.

So, in summary, all you need to do to use CSS transitions for an element is keep its `id` stable across requests!

### Partial Tags

The `<hx-partial>` tag (internally represented as `<template htmx-partial>`) allows you to include multiple targeted content
fragments in a single server response. This provides a cleaner, more explicit alternative to [out-of-band swaps](#oob_swaps) 
when you want to update multiple parts of the page from one request.

#### Basic Usage

A `<hx-partial>` tag wraps content that should be swapped into a specific target on the page:

```html
<hx-partial hx-target="#messages" hx-swap="beforeend">
  <div>New message content</div>
</hx-partial>

<hx-partial hx-target="#notifications" hx-swap="innerHTML">
  <span class="badge">5</span>
</hx-partial>
```

Each `<hx-partial>` specifies:
- `hx-target` - A CSS selector identifying where to place the content (required)
- `hx-swap` - (optional) The swap strategy to use (defaults to `innerHTML`)

The content inside the `<hx-partial>` tag will be extracted and swapped into the specified target using the specified swap method.

#### Comparison with Out-of-Band Swaps

Both partials and out-of-band swaps allow updating multiple targets from a single response, but they differ in approach:

- **Out-of-band swaps** rely on matching `id` attributes between the response and existing DOM elements
- **Partial tags** explicitly specify their target via `hx-target`, providing more control and clarity

Use partials when you want explicit control over targeting, and out-of-band swaps when you have a consistent `id` scheme.

### Out of Band Swaps {#oob_swaps}

<details class="migration-note">
<summary>htmx 2.0 to 4.0 Changes</summary>

In htmx 2.0, out of band swaps were the only way to send additional content with a response.  In htmx 4.0 the `<hx-partial>`
tag provides a more general, cleaner mechanism for swapping new content in to targets.  Although the older syntax for
more elaborate out-of-band swaps is still supported in htmx 4.0, we strongly recommend you only use out-of-band swaps
for direct id replacement, and use `<hx-partial>` for your other needs.

</details>

If you want to swap content from a response directly into the DOM by using the `id` attribute you can use the
[hx-swap-oob](@/attributes/hx-swap-oob.md) attribute in the *response* html:

```html
<div id="message" hx-swap-oob="true">Swap me directly!</div>
Additional Content
```

In this response, `div#message` would be swapped directly into the matching DOM element, while the additional content
would be swapped into the target in the normal manner.

You can use this technique to "piggy-back" updates on other requests.  

#### Selecting Content To Swap

If you want to select a subset of the response HTML to swap into the target, you can use the [hx-select](@/attributes/hx-select.md)
attribute, which takes a CSS selector and selects the matching elements from the response.

You can also pick out pieces of content for an out-of-band swap by using the [hx-select-oob](#)
attribute, which takes a list of element IDs to pick out and swap.

#### Preserving Content During A Swap

If there is content that you wish to be preserved across swaps (e.g. a video player that you wish to remain playing
even if a swap occurs) you can use the [hx-preserve](@/attributes/hx-preserve.md)
attribute on the elements you wish to be preserved.

### Parameters

By default, an element that causes a request will include its `value` if it has one.  If the element is a form it
will include the values of all inputs within it.

As with HTML forms, the `name` attribute of the input is used as the parameter name in the request that htmx sends.

Additionally, if the element causes a non-`GET` request, the values of all the inputs of the associated form will be
included (typically this is the nearest enclosing form, but could be different if e.g. `<button form="associated-form">` is used).

If you wish to include the values of other elements, you can use the [hx-include](@/attributes/hx-include.md) attribute
with a CSS selector of all the elements whose values you want to include in the request.

Finally, if you want to programmatically modify the parameters, you can use the [htmx:config:request](@/events.md#)
event.

#### File Upload {#files}

If you wish to upload files via an htmx request, you can set the [hx-encoding](@/attributes/hx-encoding.md) attribute to
`multipart/form-data`.  This will use a `FormData` object to submit the request, which will properly include the file
in the request.

Note that depending on your server-side technology, you may have to handle requests with this type of body content very
differently.

### Confirming Requests {#confirming}

Often you will want to confirm an action before issuing a request.  htmx supports the [`hx-confirm`](@/attributes/hx-confirm.md)
attribute, which allows you to confirm an action using a simple JavaScript dialog:

```html
<button hx-delete="/account" hx-confirm="Are you sure you wish to delete your account?">
    Delete My Account
</button>
```

`hx-confirm` may also contain JavaScript by using the `js:` or `javascript:` prefix.  In this case
the JavaScript will be evaluated and, if a promise is returned, it will wait until the promise
resolves with a `true` value to continue

```html
<script>
    async function swalConfirm() {
        let result = await Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        })
        return result.isConfirmed
    }
</script>
<button hx-delete="/account" hx-confirm="js:swalConfirm()">
    Delete My Account
</button>
```

## Attribute Inheritance {#inheritance}

<details class="migration-note">
<summary>htmx 2.0 to 4.0 Changes</summary>

In htmx 2.0 attribute inheritance was implicit by default: elements inherited the attributes on their parents, such
as hx-target.  In htmx 4.0 attribute inheritance is now explicit by default, using the `:inherited` modifier.

</details>

Inheritance allows you to "hoist" attributes up the DOM to avoid code duplication.  

Consider the following htmx:

```html
<button hx-delete="/account" hx-confirm="Are you sure?">
    Delete My Account
</button>
<button hx-put="/account" hx-confirm="Are you sure?">
    Update My Account
</button>
```

Here we have a duplicate `hx-confirm` attribute.  

We can hoist this attribute to a parent element using the `:inherited` modifier:

```html
<div hx-confirm:inherited="Are you sure?">
    <button hx-delete="/account">
        Delete My Account
    </button>
    <button hx-put="/account">
        Update My Account
    </button>
</div>
```

This `hx-confirm` attribute will now apply to all htmx-powered elements within it.

## Boosting

Htmx supports "boosting" regular HTML anchors and forms with the [hx-boost](@/attributes/hx-boost.md) attribute.  This
attribute will convert all anchor tags and forms into AJAX requests that, by default, target the body of the page.

Here is an example:

```html
<div hx-boost:inherited="true">
    <a href="/blog">Blog</a>
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
</div>
```

The anchor tags in this div will issue an AJAX `GET` request to `/blog` and swap the response into the `body` tag.

Note that `hx-boost` is using the `inherited` modifier here.

### Progressive Enhancement {#progressive_enhancement}

A nice feature of `hx-boost` is that it degrades gracefully if JavaScript is not enabled: the links and forms continue
to work, they simply don't use ajax requests.  

This is known as
[Progressive Enhancement](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement), and it allows
a wider audience to use your site's functionality.

Other htmx patterns can be adapted to achieve progressive enhancement as well, but they will require more thought.

Consider the [active search](@/patterns/active-search.md) example.  As it is written, it will not degrade gracefully:
someone who does not have JavaScript enabled will not be able to use this feature. This is done for simplicity’s sake,
to keep the example as brief as possible.

However, you could wrap the htmx-enhanced input in a form element:

```html
<form action="/search" method="POST">
    <input class="form-control" type="search"
        name="search" placeholder="Begin typing to search users..."
        hx-post="/search"
        hx-trigger="keyup changed delay:500ms, search"
        hx-target="#search-results"
        hx-indicator=".htmx-indicator">
</form>
```

With this in place, JavaScript-enabled clients would still get the nice active-search UX, but non-JavaScript enabled
clients would be able to hit the enter key and still search.  Even better, you could add a "Search" button as well.
You would then need to update the form with an `hx-post` that mirrored the `action` attribute, or perhaps use `hx-boost`
on it.

You would need to check on the server side for the `HX-Request` header to differentiate between an htmx-driven and a
regular request, and the `HX-Request-Type` header to determine whether to return a partial fragment or full page content.

Other patterns can be adapted similarly to achieve the progressive enhancement needs of your application.

As you can see, this requires more thought and more work.  It also rules some functionality entirely out of bounds.
These tradeoffs must be made by you, the developer, with respect to your projects goals and audience.

[Accessibility](https://developer.mozilla.org/en-US/docs/Learn/Accessibility/What_is_accessibility) is a concept
closely related to progressive enhancement.  Using progressive enhancement techniques such as `hx-boost` will make your
htmx application more accessible to a wide array of users.

htmx-based applications are very similar to normal, non-AJAX driven web applications because htmx is HTML-oriented.

As such, the normal HTML accessibility recommendations apply.  For example:

* Use semantic HTML as much as possible (i.e. the right tags for the right things)
* Ensure focus state is clearly visible
* Associate text labels with all form fields
* Maximize the readability of your application with appropriate fonts, contrast, etc.

## Streaming Responses

htmx 4 has built-in support for Streaming Responses Server-Sent Events (SSE).

The typical `hx-get`, `hx-post`, `hx-put`, `hx-patch`, or `hx-delete` attributes can trigger a streaming response. When 
the server responds with `Content-Type: text/event-stream` instead of `Content-Type: text/html`, htmx automatically 
handles the stream. 

Each SSE message with a `data:` line (and no `event:` line) is processed like a regular htmx response, respecting 
`hx-target`, `hx-select`, and `hx-swap` attributes.

Like [fetch-event-source](https://github.com/Azure/fetch-event-source), htmx's custom SSE implementation supports
request bodies, custom headers, and all HTTP methods (not just GET), and Page Visibility API
integration (using the `pauseInBackground` option).

### Basic Usage

```html
<button hx-get="/stream" hx-target="#stream-output" hx-swap="innerHTML">
    Stream Response
</button>

<div id="stream-output"></div>
```

The server sends SSE messages with `data:` lines:
```
data: H

data: He

// ...

data: Hello partner!

```

Each message replaces the target element's content. The stream processes until the connection closes, then stops. 
No reconnection occurs by default.

### Stream Reconnection

Stream reconnection behavior is controlled via `hx-config`. By default, reconnection is disabled (`reconnect: false`).

To enable automatic reconnection when the connection drops:

```html
<body hx-get="/updates" hx-config='{ "streams": { "reconnect": true } }' hx-trigger="load">
    ...
</body>
```

When enabled, htmx will reconnect automatically with exponential backoff.

**Note:** Reconnection is primarily intended for use with `<hx-partial>` to enable real-time
updates to multiple parts of the page via a permanently open SSE connection.

### Custom Events

SSE `event:` lines trigger custom DOM events. When an `event:` line is present, htmx fires that event instead of 
performing a normal swap. 

Use this for lightweight updates without swapping DOM elements.

```html
<button hx-get="/progress"
        hx-on:progress="find('#bar').style.width = event.detail.data + '%'">
    Start
</button>
```

Server sends custom events:

```
event: progress
data: 50

event: progress
data: 100

```

### Configuration

You can configure the global streaming config in `htmx.config.streams`:

```html
<meta name="htmx:config" content='{
  "streams": {
    "reconnect": false,
    "reconnectMaxAttempts": 10,
    "reconnectDelay": 500,
    "reconnectMaxDelay": 60000,
    "reconnectJitter": 0.3,
    "pauseInBackground": false
  }
}'>
```

- `reconnect`: Boolean to enable/disable reconnection (default: `false`)
- `reconnectMaxAttempts`: Maximum reconnection attempts (default: `10`)
- `reconnectDelay`: Initial reconnect delay in ms (default: `500`)
- `reconnectMaxDelay`: Max backoff delay in ms (default: `60000`)
- `reconnectJitter`: Jitter factor for randomizing delays (default: `0.3`)
- `pauseInBackground`: Pause stream when page is hidden (default: `false`). Uses the Page Visibility API to pause the stream when the browser window is minimized or the tab is in the background.


You can override these settings per-element using `hx-config`:
```html
<button hx-get="/stream"
        hx-config='{"streams": {"reconnect": true, "reconnectMaxAttempts": 10, "reconnectDelay": 1000, "pauseInBackground": true}}'>
    Start
</button>
```

### Events

- `htmx:before:sse:stream`: Fired before processing stream
- `htmx:before:sse:message`: Fired before each message swap. Cancel with `event.detail.message.cancelled = true`
- `htmx:after:sse:message`: Fired after each message swap
- `htmx:after:sse:stream`: Fired when stream ends
- `htmx:before:sse:reconnect`: Fired before reconnection attempt. Cancel with `event.detail.reconnect.cancelled = true`

## Web Sockets

Web Sockets are supported via an extensions.  Please see the [WebSocket extension](/extensions/ws)
page to learn more.

## History Support {#history}

<details class="migration-note">
<summary>htmx 2.0 to 4.0 Changes</summary>

History support in htmx 4.0 has changed significantly.  We no longer snapshot the DOM and keep a copy in sessionStorage.

Instead, we issue a full page request every time someone navigates to a history element.  This is much less error-prone
and foolproof.  It also eliminates security concerns regarding keeping history state in accessible storage

This change makes history restoration much more reliable and reduces client-side complexity.

</details>

Htmx provides a simple mechanism for interacting with the [browser history API](https://developer.mozilla.org/en-US/docs/Web/API/History_API):

If you want a given element to push its request URL into the browser navigation bar and add the current state of the page
to the browser's history, include the [hx-push-url](@/attributes/hx-push-url.md) attribute:

```html
<a hx-get="/blog" hx-push-url="true">Blog</a>
```

When a user clicks on this link, htmx will push a new location onto the history stack.

When a user hits the back button, htmx will retrieve the old content from the original URL and swap it back into the body,
simulating "going back" to the previous state.

**NOTE:** If you push a URL into the history, you **must** be able to navigate to that URL and get a full page back!
A user could copy and paste the URL into an email, or new tab.  


## Requests &amp; Responses {#requests}

Htmx expects responses to the AJAX requests it makes to be HTML, typically HTML fragments (although a full HTML
document, matched with a [hx-select](@/attributes/hx-select.md) tag can be useful too).  

Htmx will then swap the returned HTML into the document at the target specified and with the swap strategy specified.

Sometimes you might want to do nothing in the swap, but still perhaps trigger a client side event ([see below](#response-headers)).

For this situation, by default, you can return a `204 - No Content` response code, and htmx will ignore the content of
the response.

In the event of a connection error, the [`htmx:error`](@/events.md) event will be triggered.

### Configuring Response Handling {#response-handling}

By default, htmx will swap content for successful HTTP responses (2xx status codes) and will not swap content for error
responses (4xx, 5xx status codes). However, you can customize this behavior using the `hx-status:XXX` attribute pattern.

#### Status-Code Conditional Swapping

The `hx-status:XXX` attribute allows you to specify different swap behaviors based on the HTTP status code of the response.
This gives you fine-grained control over how different response statuses are handled.

```html
<button hx-get="/data"
        hx-status:404="none"
        hx-status:500="target:#error-container">
    Load Data
</button>
```

```html
<form hx-post="/submit"
      hx-target="#result"
      hx-status:422="target:#validation-errors"
      hx-status:500="target:#server-error"
      hx-status:503="none">
    <input name="email">
    <button type="submit">Submit</button>
</form>

<div id="result"></div>
<div id="validation-errors"></div>
<div id="server-error"></div>
```

In this example:
- Successful responses (2xx) swap into `#result` (default behavior)
- 422 responses swap into `#validation-errors`
- 500 responses swap into `#server-error`
- 503 responses don't swap at all

### Request Headers

htmx includes headers in the requests it makes:


| Header                       | Description                                                                                          |
|------------------------------|------------------------------------------------------------------------------------------------------|
| `HX-Boosted`                 | indicates that the request is via an element using [hx-boost](@/attributes/hx-boost.md)              |
| `HX-Current-URL`             | the current URL of the browser                                                                       |
| `HX-History-Restore-Request` | "true" if the request is for history restoration after a miss in the local history cache             |
| `HX-Request`                 | always "true" except on history restore requests if `htmx.config.historyRestoreAsHxRequest' disabled |
| `HX-Request-Type`            | "partial" for targeted swaps, "full" when targeting `body` or using `hx-select`                      |
| `HX-Source`                  | identifier of the triggering element in format `tag#id` (e.g., `button#submit`)                      |
| `HX-Target`                  | identifier of the target element in format `tag#id` (e.g., `div#results`)                            |

#### Request Type Header

The `HX-Request-Type` header indicates whether htmx is requesting a partial page update or full page content:

- **`partial`**: The request targets a specific element on the page (most common case)
- **`full`**: The request targets the entire `body` element (including via [hx-boost](@/attributes/hx-boost.md)) or uses `hx-select` to extract content

This allows servers to optimize responses by returning only the necessary HTML fragment for partial updates.

#### Source and Target Headers

The `HX-Source` and `HX-Target` headers identify elements using a simple format: `tag#id?name`

- **tag**: The element's tag name (e.g., `button`, `div`, `form`)
- **id**: The element's `id` attribute (empty if not present)
- **name**: The element's `name` attribute (empty if not present)

Delimiters (`#` and `?`) are always present for easy parsing.

Examples:
- `button#submit?send` - A button with `id="submit"` and `name="send"`
- `div#results?` - A div with `id="results"` and no name
- `form#?contact` - A form with no id and `name="contact"`
- `input#?email` - An input with no id and `name="email"`

### Response Headers

htmx supports htmx-specific response headers:

| Header                                               | Description                                                                                                                                                                            |
|------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [`HX-Location`](@/headers/hx-location.md)            | allows you to do a client-side redirect that does not do a full page reload                                                                                                            |
| [`HX-Push-Url`](@/headers/hx-push-url.md)            | pushes a new url into the history stack                                                                                                                                                |
| [`HX-Redirect`](@/headers/hx-redirect.md)            | can be used to do a client-side redirect to a new location                                                                                                                             |
| `HX-Refresh`                                         | if set to "true" the client-side will do a full refresh of the page                                                                                                                    |
| [`HX-Replace-Url`](@/headers/hx-replace-url.md)      | replaces the current URL in the location bar                                                                                                                                           |
| `HX-Reswap`                                          | allows you to specify how the response will be swapped. See [hx-swap](@/attributes/hx-swap.md) for possible values                                                                     |
| `HX-Retarget`                                        | a CSS selector that updates the target of the content update to a different element on the page                                                                                        |
| `HX-Reselect`                                        | a CSS selector that allows you to choose which part of the response is used to be swapped in. Overrides an existing [`hx-select`](@/attributes/hx-select.md) on the triggering element |
| [`HX-Trigger`](@/headers/hx-trigger.md)              | allows you to trigger client-side events                                                                                                                                               |
| [`HX-Trigger-After-Settle`](@/headers/hx-trigger.md) | allows you to trigger client-side events after the settle step                                                                                                                         |
| [`HX-Trigger-After-Swap`](@/headers/hx-trigger.md)   | allows you to trigger client-side events after the swap step                                                                                                                           |

For more on the `HX-Trigger` headers, see [`HX-Trigger` Response Headers](@/headers/hx-trigger.md).

Submitting a form via htmx has the benefit of no longer needing the [Post/Redirect/Get Pattern](https://en.wikipedia.org/wiki/Post/Redirect/Get).
After successfully processing a POST request on the server, you don't need to return a [HTTP 302 (Redirect)](https://en.wikipedia.org/wiki/HTTP_302). You can directly return the new HTML fragment.

Also, the response headers above are not provided to htmx for processing with 3xx Redirect response codes like [HTTP 302 (Redirect)](https://en.wikipedia.org/wiki/HTTP_302). Instead, the browser will intercept the redirection internally and return the headers and response from the redirected URL. Where possible use alternative response codes like 200 to allow returning of these response headers.

## Validation

Htmx integrates with the [HTML5 Validation API](https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation)
and will not issue a request for a form if a validatable input is invalid.  

Non-form elements do not validate before they make requests by default, but you can enable validation by setting
the [`hx-validate`](@/attributes/hx-validate.md) attribute to "true".


## Extensions

In htmx 4, extensions hook into standard events rather than callback extension points. They are lightweight with no performance penalty.

Extensions apply page-wide without requiring `hx-ext` on parent elements. They activate via custom attributes where needed.

To restrict which extensions can register, use an allow list:

```html
<meta name="htmx:config" content='{"extensions": "my-ext,another-ext"}'>
```

### Core Extensions

htmx supports a few core extensions, which are supported by the htmx development team:

* [head-support](/extensions/head-support) - support for merging head tag information (styles, etc.) in htmx requests
* [ws](/extensions/ws) - support for [Web Sockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)

You can see all available extensions on the [Extensions](/extensions) page.

### Creating Extensions

If you are interested in adding your own extension to htmx, please [see the extension docs](/extensions/building).

## Events & Logging {#events}

<details class="migration-note">
<summary>htmx 2.0 to 4.0 Changes</summary>

htmx 4.0 changed event names significantly when compared with htmx 2.0, making them much more standardized.

See the full event mapping in the [Changes in htmx 4.0](/migration-guide-htmx-4#event-changes) document.

**Note:** All events now provide a consistent `ctx` object with request/response information.

</details>

Htmx has an extensive [events mechanism](@/reference.md#events), which doubles as the logging system.

If you want to register for a given htmx event you can use:

```js
document.body.addEventListener('htmx:after:init', function(evt) {
    myJavascriptLib.init(evt.detail.elt);
});
```

or, if you would prefer, you can use the following htmx helper:

```javascript
htmx.on("htmx:after:init", function(evt) {
    myJavascriptLib.init(evt.detail.elt);
});
```

The `htmx:load` event is fired every time an element is loaded into the DOM by htmx, and is effectively the equivalent
 to the normal `load` event.

Some common uses for htmx events are:

### Initialize A 3rd Party Library With Events {#init_3rd_party_with_events}

Using the `htmx:load` event to initialize content is so common that htmx provides a helper function:

```javascript
htmx.onLoad(function(target) {
    myJavascriptLib.init(target);
});
```
This does the same thing as the first example, but is a little cleaner.

### Configure a Request With Events {#config_request_with_events}

You can handle the [`htmx:config:request`](@/events.md#htmx:config:request) event in order to modify an AJAX request before it is issued:

```javascript
document.body.addEventListener('htmx:config:request', function(evt) {
    evt.detail.ctx.request.parameters['auth_token'] = getAuthToken(); // add a new parameter into the request
    evt.detail.ctx.request.headers['Authentication-Token'] = getAuthToken(); // add a new header into the request
});
```

Here we add a parameter and header to the request before it is sent.

## Debugging

Declarative and event driven programming with htmx (or any other declarative language) can be a wonderful and highly productive
activity, but one disadvantage when compared with imperative approaches is that it can be trickier to debug.

Figuring out why something *isn't* happening, for example, can be difficult if you don't know the tricks.

Here are some tips:

The first debugging tool you can use is to set `htmx.config.logAll` to `true`.  This will log every event that htmx 
triggers and will allow you to see exactly what the library is doing.

```javascript
htmx.config.logAll = true;
```

Of course, that won't tell you why htmx *isn't* doing something.  You might also not know *what* events a DOM
element is firing to use as a trigger.  To address this, you can use the
[`monitorEvents()`](https://developers.google.com/web/updates/2015/05/quickly-monitor-events-from-the-console-panel) method available in the
browser console:

```javascript
monitorEvents(htmx.find("#theElement"));
```

This will spit out all events that are occurring on the element with the id `theElement` to the console, and allow you
to see exactly what is going on with it.

Note that this *only* works from the console, you cannot embed it in a script tag on your page.

Finally, push come shove, you might want to just debug `htmx.js` by loading up the unminimized version.

You would most likely want to set a break point in the  methods to see what's going on.

And always feel free to jump on the [Discord](https://htmx.org/discord) if you need help.

## Scripting {#scripting}

<details class="migration-note">
<summary>htmx 2.0 to 4.0 Changes</summary>

The htmx JavaScript API has changed in htmx 4.0.  

</details>

While htmx encourages a hypermedia approach to building web applications, it offers many options for client scripting. Scripting is included in the REST-ful description of web architecture, see: [Code-On-Demand](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_1_7). As much as is feasible, we recommend a [hypermedia-friendly](/essays/hypermedia-friendly-scripting) approach to scripting in your web application:

* [Respect HATEOAS](/essays/hypermedia-friendly-scripting#prime_directive)
* [Use events to communicate between components](/essays/hypermedia-friendly-scripting#events)
* [Use islands to isolate non-hypermedia components from the rest of your application](/essays/hypermedia-friendly-scripting#islands)
* [Consider inline scripting](/essays/hypermedia-friendly-scripting#inline)

The primary integration point between htmx and scripting solutions is the [events](#events) that htmx sends and can
respond to.  

See the SortableJS example in the [3rd Party Javascript](#3rd-party) section for a good template for
integrating a JavaScript library with htmx via events.

We have an entire chapter entitled ["Client-Side Scripting"](https://hypermedia.systems/client-side-scripting/) in [our
book](https://hypermedia.systems) that looks at how scripting can be integrated into your htmx-based application.

### <a name="hx-on"></a>[The `hx-on*` Attributes](#hx-on)

HTML allows the embedding of inline scripts via the [`onevent` properties](https://developer.mozilla.org/en-US/docs/Web/Events/Event_handlers#using_onevent_properties),
such as `onClick`:

```html
<button onclick="alert('You clicked me!')">
    Click Me!
</button>
```

This feature allows scripting logic to be co-located with the HTML elements the logic applies to, giving good
[Locality of Behaviour (LoB)](/essays/locality-of-behaviour).  

Unfortunately, HTML only allows `on*` attributes for a fixed
number of [specific DOM events](https://www.w3schools.com/tags/ref_eventattributes.asp) (e.g. `onclick`) and
doesn't provide a generalized mechanism for responding to arbitrary events on elements.

In order to address this shortcoming, htmx offers [`hx-on:*`](/attributes/hx-on) attributes.  

These attributes allow you to respond to any event in a manner that preserves the LoB of the standard `on*` properties,
and provide some nice quality of life improvements over the standard JavaScript API.

If you want to respond to the `click` event using an `hx-on` attribute, we would write this:

```html
<button hx-on:click="alert('You clicked me!')">
    Click Me!
</button>
```

So, the string `hx-on`, followed by a colon (or a dash), then by the name of the event.

#### <a name="htmx-scripting-api"></a>[The Scripting API](#htmx-scripting-api)

htmx provides some top level helper methods in `hx-on` handlers that make async scripting more enjoyable:

| function    | description                                                                                                                          |
|-------------|--------------------------------------------------------------------------------------------------------------------------------------|
| `find()`    | allows you to find content relative to the current element (e.g. `find('next div')` will find the next div after the current element |
| `findAll()` | allows you to find multiple elements relative to the current element                                                                 |
| `timeout()` | allows you to wait for a given amount of time (e.g. `await timeout(100)` before continuing                                           |


#### <a name="htmx-scripting-examples"></a>[Scripting Examples](#htmx-scripting-examples)

Here is an example that adds a parameter to an htmx request

{% construction_warning() %}
 <p>Need to verify symbols</p>
{% end %}

```html
<button hx-post="/example"
        hx-on:htmx:config:request="ctx.request.parameters.example = 'Hello Scripting!'">
    Post Me!
</button>
```

Here the `example` parameter is added to the `POST` request before it is issued, with the value 'Hello Scripting!'.

Another use case is to [reset user input](@/patterns/reset-on-submit.md) on successful requests using the `htmx:after:swap`
event:

```html
<button hx-post="/example"
        hx-on:htmx:after:request="find('closest form').reset()">
    Post Me!
</button>
```

### 3rd Party JavaScript {#3rd-party}

Htmx integrates well with third party libraries.  

If the library fires events on the DOM, you can use those events to trigger requests from htmx.

A good example of this is the [SortableJS demo](@/patterns/drag-to-reorder.md):

```html
<form class="sortable" hx-post="/items" hx-trigger="end">
    <div class="htmx-indicator">Updating...</div>
    <div><input type='hidden' name='item' value='1'/>Item 1</div>
    <div><input type='hidden' name='item' value='2'/>Item 2</div>
    <div><input type='hidden' name='item' value='2'/>Item 3</div>
</form>
```

With Sortable, as with most JavaScript libraries, you need to initialize content at some point.

In htmx, the cleanest way to do this is using the `htmx.onLoad()` method to register a callback.

This callback will be called whenever htmx inserts new content into the DOM, allowing you to initialize
any widgets in the new content.

```js
htmx.onLoad((content) => {
    var sortables = content.querySelectorAll(".sortable");
    for (var i = 0; i < sortables.length; i++) {
        var sortable = sortables[i];
        new Sortable(sortable, {
            animation: 150,
            ghostClass: 'blue-background-class'
        });
    }
})
```

This will ensure that as new content is added to the DOM by htmx, sortable elements are properly initialized.

### Web Components {#web-components}

htmx doesn't automatically scan inside web components' shadow DOM. You must manually initialize it.

After creating your shadow DOM, call [`htmx.process`](@/api.md#process):
```javascript
customElements.define('my-counter', class extends HTMLElement {
    connectedCallback() {
        const shadow = this.attachShadow({ mode: 'open' })
        shadow.innerHTML = `
          <button hx-post="/increment" hx-target="#count">+1</button>
          <div id="count">0</div>
        `
        htmx.process(shadow) // Initialize htmx for this shadow DOM
    }
})

```

#### Targeting Elements Outside Shadow DOM

Selectors like [`hx-target`](@/attributes/hx-target.md) only see elements inside the same shadow DOM. 

To break out:

1. Target the host element, using `host`:
   ```html
   <button hx-get="..." hx-target="host">
     ...
   </button>
   ```
2. Target elements in main document, using `global:<selector>`:
   ```html
   <button hx-get="..." hx-target="global:#target">
     ...
   </button>
   ```

#### Components Without Shadow DOM

Still call [`htmx.process`](@/api.md#process) on the component:
```javascript
customElements.define('simple-widget', class extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `Load`
    htmx.process(this)
  }
})
```

## Caching

htmx works with standard [HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
mechanisms out of the box.

If your server adds the
[`Last-Modified`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Last-Modified)
HTTP response header to the response for a given URL, the browser will automatically add the
[`If-Modified-Since`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since)
request HTTP header to the next requests to the same URL.

### ETag Support

htmx supports [`ETag`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag)-based caching on a per-element 
basis. When your server includes an `ETag` header in the response, htmx will store the ETag value and automatically 
include it in the [`If-None-Match`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-None-Match)
header for subsequent requests from that element. 

This allows your server to return a [`304 Not Modified`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/304) 
response when the content hasn't changed.

You can set an etag on an element initially by using the `hx-config` attribute:

```html
<div id="news" hx-get="/news" 
     hx-trigger="every 3s"
    hx-config='"etag":"1762656750"'>
    Latest News...
</div>
```

When this div issues a poll-based request it will submit an `If-None-Match` header and the server can respond with a
`304 Not Modified` if no new news is available.

Be mindful that if your server can render different content for the same URL depending on some other
headers, you need to use the [`Vary`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching#vary)
response HTTP header.

#### Vary Header for htmx Requests

When your server returns different content based on htmx request headers, use the `Vary` header to ensure proper caching:

**Basic Usage** - If your server renders different content for partial vs. full requests:

```
Vary: HX-Request-Type
```

This is the most common case and ensures caches distinguish between partial and full page responses.

**Advanced Usage** - If your responses also vary based on the target or source element:

```
Vary: HX-Request-Type, HX-Target
```

or

```
Vary: HX-Request-Type, HX-Source, HX-Target
```

For example, if your `/search` endpoint returns different HTML based on whether it's targeting a sidebar vs. main content area, include `HX-Target` in the `Vary` header.

**Note**: The `HX-Request` header (which is always "true" for htmx requests) is typically not needed in `Vary` headers since you would serve completely different content (full HTML page vs. fragment) based on its presence, which usually means different URLs or routing logic. 

## Security

htmx allows you to define logic directly in your DOM.  This has a number of advantages, the largest being
[Locality of Behavior](@/essays/locality-of-behaviour.md), which makes your system easier to understand and
maintain.

A concern with this approach, however, is security: since htmx increases the expressiveness of HTML, if a malicious
user is able to inject HTML into your application, they can leverage this expressiveness of htmx to malicious
ends.

### Rule 1: Escape All User Content

The first rule of HTML-based web development has always been: *do not trust input from the user*.  You should escape all
3rd party, untrusted content that is injected into your site.  This is to prevent, among other issues,
[XSS attacks](https://en.wikipedia.org/wiki/Cross-site_scripting).

There is extensive documentation on XSS and how to prevent it on the excellent [OWASP Website](https://owasp.org/www-community/attacks/xss/),
including a [Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).

The good news is that this is a very old and well understood topic, and the vast majority of server-side templating languages
support [automatic escaping](https://docs.djangoproject.com/en/4.2/ref/templates/language/#automatic-html-escaping) of
content to prevent just such an issue.

That being said, there are times people choose to inject HTML more dangerously, often via some sort of `raw()`
mechanism in their templating language.  This can be done for good reasons, but if the content being injected is coming
from a 3rd party then it _must_ be scrubbed, including removing attributes starting with `hx-` and `data-hx`, as well as
inline `<script>` tags, etc.

If you are injecting raw HTML and doing your own escaping, a best practice is to *whitelist* the attributes and tags you
allow, rather than to blacklist the ones you disallow.

### htmx Security Tools

Of course, bugs happen and developers are not perfect, so it is good to have a layered approach to security for
your web application, and htmx provides tools to help secure your application as well.

Let's take a look at them.

#### `hx-ignore`

The first tool htmx provides to help further secure your application is the [`hx-ignore`](/attributes/hx-ignore)
attribute.  This attribute will prevent processing of all htmx attributes on a given element, and on all elements within
it.  So, for example, if you were including raw HTML content in a template (again, this is not recommended!) then you
could place a div around the content with the `hx-ignore` attribute on it:

```html
<div hx-ignore>
    <%= raw(user_content) %>
</div>
```

And htmx will not process any htmx-related attributes or features found in that content.  This attribute cannot be
disabled by injecting further content: if an `hx-ignore` attribute is found anywhere in the parent hierarchy of an
element, it will not be processed by htmx.

### CSP Options

Browsers also provide tools for further securing your web application.  The most powerful tool available is a
[Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP).  Using a CSP you can tell the
browser to, for example, not issue requests to non-origin hosts, to not evaluate inline script tags, etc.

Here is an example CSP in a `meta` tag:

```html
    <meta http-equiv="Content-Security-Policy" content="default-src 'self';">
```

A full discussion of CSPs is beyond the scope of this document, but the [MDN Article](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) provides a good jumping-off point
for exploring this topic.

#### htmx & Eval

htmx uses eval for some functionality:

* Event filters
* The `hx-on` attribute
* Handling most attribute values that starts with `js:` or `javascript:`

All of these features can be replaced with standard event listeners and thus are not crucial to using htmx.

Thus you can disable `eval()` via a CSP and continue to use htmx.

### CSRF Prevention

The assignment and checking of CSRF tokens are typically backend responsibilities, but `htmx` can support returning the 
CSRF token automatically with every request using the `hx-headers` attribute. The attribute needs to be added to the
element issuing the request or one of its ancestor elements. This makes the `html` and `body` elements effective 
global vehicles for adding the CSRF token to the `HTTP` request header, as illustrated below. 

```html
<html lang="en" hx-headers='{"X-CSRF-TOKEN": "CSRF_TOKEN_INSERTED_HERE"}'>
    :
</html>
```

The above elements are usually unique in an HTML document and should be easy to locate within templates. 


## Configuring htmx

Htmx has configuration options that can be accessed either programmatically or declaratively.

They are listed below:

<div class="info-table">

| Config Variable                   | Info                                                                                                                                                                                                                                                                       |
|-----------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `htmx.config.logAll`              | defaults to `false`, if set to `true` htmx will log all events to the console for debugging                                                                                                                                                                                |
| `htmx.config.prefix`              | defaults to `""` (empty string), allows you to use a custom prefix for htmx attributes (e.g., `"data-hx-"` to use `data-hx-get` instead of `hx-get`)                                                                                                                       |
| `htmx.config.transitions`         | defaults to `true`, whether to use view transitions when swapping content (if browser supports it)                                                                                                                                                                         |
| `htmx.config.history`             | defaults to `true`, whether to enable history support (push/replace URL)                                                                                                                                                                                                   |
| `htmx.config.historyReload`       | defaults to `false`, if set to `true` htmx will do a full page reload on history navigation instead of an AJAX request                                                                                                                                                     |
| `htmx.config.mode`                | defaults to `'same-origin'`, the fetch mode for AJAX requests. Can be `'cors'`, `'no-cors'`, or `'same-origin'`                                                                                                                                                            |
| `htmx.config.defaultSwap`         | defaults to `innerHTML`                                                                                                                                                                                                                                                    |
| `htmx.config.indicatorClass`      | defaults to `htmx-indicator`                                                                                                                                                                                                                                               |
| `htmx.config.requestClass`        | defaults to `htmx-request`                                                                                                                                                                                                                                                 |
| `htmx.config.includeIndicatorCSS` | defaults to `true` (determines if the indicator styles are loaded)                                                                                                                                                                                                         |
| `htmx.config.defaultTimeout`      | defaults to `60000` (60 seconds), the number of milliseconds a request can take before automatically being terminated                                                                                                                                                      |
| `htmx.config.inlineScriptNonce`   | defaults to `''`, meaning that no nonce will be added to inline scripts                                                                                                                                                                                                    |
| `htmx.config.inlineStyleNonce`    | defaults to `''`, meaning that no nonce will be added to inline styles                                                                                                                                                                                                     |
| `htmx.config.extensions`          | defaults to `''`, a comma-separated list of extension names to load (e.g., `'preload,optimistic'`)                                                                                                                                                                         |
| `htmx.config.streams`             | configuration for Server-Sent Events (SSE) streams. An object with the following properties: `reconnect` (default: `false`), `reconnectMaxAttempts` (default: `10`), `reconnectDelay` (default: `500`ms), `reconnectMaxDelay` (default: `60000`ms), `reconnectJitter` (default: `0.3`), `pauseInBackground` (default: `false`) |
| `htmx.config.morphIgnore`         | defaults to `["data-htmx-powered"]`, array of attribute names to ignore when morphing elements                                                                                                                                                                             |
| `htmx.config.noSwap`              | defaults to `[204, 304]`, array of HTTP status codes that should not trigger a swap                                                                                                                                                                                        |
| `htmx.config.implicitInheritance` | defaults to `false`, if set to `true` attributes will be inherited from parent elements automatically without requiring the `:inherited` modifier                                                                                                                          |
| `htmx.config.metaCharacter`       | defaults to `undefined`, allows you to use a custom character instead of `:` for attribute modifiers (e.g., `-` to use `hx-get-inherited` instead of `hx-get:inherited`)                                                                                                   |
</div>

You can set them directly in JavaScript, or you can use a `meta` tag:

```html
<meta name="htmx:config" content='{"defaultSwap":"innerHTML"}'>
```

**Note:** The meta tag name has changed from `htmx-config` to `htmx:config` in htmx 4.

## Conclusion

And that's it!

Have fun with htmx! 

You can accomplish [quite a bit](@/patterns/_index.md) without writing a lot of code!
