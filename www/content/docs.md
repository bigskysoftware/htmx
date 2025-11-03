+++
title = "Documentation"
[extra]
+++

<aside class="under-construction">
  <strong>🚧 Pardon our dust 🚧</strong>
  <p>These docs are NOT up to date with the htmx 4.0 changes and are in flux! See <a href="/changes-in-4/">changes in htmx 4.0</a> </p>
</aside>

<details id="contents">
<summary><strong>Contents</strong></summary>

* [introduction](#introduction)
* [installing](#installing)
* [ajax](#ajax)
  * [triggers](#triggers)
    * [trigger modifiers](#trigger-modifiers)
    * [trigger filters](#trigger-filters)
    * [special events](#special-events)
    * [polling](#polling)
    * [load polling](#load_polling)
  * [indicators](#indicators)
  * [targets](#targets)
  * [swapping](#swapping)
  * [synchronization](#synchronization)
  * [css transitions](#css_transitions)
  * [out of band swaps](#oob_swaps)
  * [parameters](#parameters)
  * [confirming](#confirming)
* [inheritance](#inheritance)
* [boosting](#boosting)
* [SSE](#)
* [WebSockets](#)
* [history](#history)
* [requests & responses](#requests)
* [validation](#validation)
* [animations](#animations)
* [extensions](#extensions)
* [events & logging](#events)
* [debugging](#debugging)
* [scripting](#scripting)
  * [hx-on attribute](#hx-on)
* [3rd party integration](#3rd-party)
  * [Web Components](#web-components)
* [caching](#caching)
* [security](#security)
* [configuring](#config)

</details>


## htmx in a Nutshell {#introduction}

htmx is a library that allows you to access modern browser features directly from HTML, rather than using
javascript.

To understand htmx, first let's take a look at the two main _hypermedia controls_, or interactive elements
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

> "When a user clicks on this link, issue an HTTP GET request to '/blog' and load the response content
>  into the browser window".

The form tag tells a browser:

> "When a user submits this form, issue an HTTP POST request to '/register' and load the response content
>  into the browser window".

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

This is called [transclusion](https://en.wikipedia.org/wiki/Transclusion), where a document is included inside another
document.

With these ideas in mind, consider the following bit of htmx-powered HTML:

```html
<button hx-post="/clicked"
    hx-trigger="click"
    hx-target="#parent-div"
    hx-swap="outerHTML">
    Click Me!
</button>
```

Given these attribute, htmx will enable the following behavior:

> "When a user clicks on this button, issue an HTTP POST request to '/clicked' and use the content from the response
>  to replace the element with the id `parent-div` in the DOM"

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

If you are migrating to htmx 4.x from [htmx 2.x](https://v1.htmx.org), please see the [htmx 2.x migration guide](@/migration-guide-htmx-2.md).

## Installing

htmx is a dependency-free, browser-oriented javascript library. This means that using it is as simple as adding a `<script>`
tag to your document head.  

There is no need for a build system to use htmx.

### Via A CDN (e.g. jsDelivr)

The fastest way to get going with htmx is to load it via a CDN. You can simply add this to
your head tag and get going:

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-alpha1/dist/htmx.min.js" integrity="sha384-/" crossorigin="anonymous"></script>
```

An unminified version is also available as well:

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-alpha1/dist/htmx.js" integrity="" crossorigin="anonymous"></script>
```

While the CDN approach is extremely simple, you may want to consider
[not using CDNs in production](https://blog.wesleyac.com/posts/why-not-javascript-cdn).

### Download a copy

The next easiest way to install htmx is to simply copy it into your project, an option called [vendoring](@/essays/vendoring.md).

Download `htmx.min.js` [from jsDelivr](https://cdn.jsdelivr.net/npm/htmx.org@4.0.0-alpha1/dist/htmx.min.js) and add it to the appropriate directory in your project
and include it where necessary with a `<script>` tag:

```html
<script src="/path/to/htmx.min.js"></script>
```

### npm

For npm-style build systems, you can install htmx via [npm](https://www.npmjs.com/):

```sh
npm install htmx.org@4.0.0-alpha1
```

After installing, you’ll need to use appropriate tooling to use `node_modules/htmx.org/dist/htmx.js` (or `.min.js`).
For example, you might bundle htmx with some extensions and project-specific code.

## AJAX

<details class="migration-note">
<summary>htmx 2.0 to 4.0 Changes</summary>

<p>htmx 4.0 uses the <code>fetch()</code> API instead of XMLHttpRequest. This enables built-in streaming response support and simplifies the implementation of htmx, but does create some significant changes between the two versions.</p>

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

Because it is so common to specify a method and action together, htmx provides five attributes that allow
you to specify both in the same single attribute.

| Attribute                              | Description                                |
|----------------------------------------|--------------------------------------------|
| [hx-get](@/attributes/hx-get.md)       | Issues a `GET` request to the given URL    |
| [hx-post](@/attributes/hx-post.md)     | Issues a `POST` request to the given URL   |
| [hx-put](@/attributes/hx-put.md)       | Issues a `PUT` request to the given URL    |
| [hx-patch](@/attributes/hx-patch.md)   | Issues a `PATCH` request to the given URL  |
| [hx-delete](@/attributes/hx-delete.md) | Issues a `DELETE` request to the given URL |

These attributes are typically used in place of `hx-method` and `hx-action`.

Here is the example above redone using `hx-post`:

```html
<button hx-post="/messages">
    Post To Messages
</button>
```

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

A trigger can also have a few additional modifiers that change its behavior.  For example, if you want a request to only
 happen once, you can use the `once` modifier for the trigger:

```html
<div hx-post="/mouse_entered" hx-trigger="mouseenter once">
    Mouse Trap
</div>
```

Other modifiers you can use for triggers are:

* `changed` - only issue a request if the value of the element has changed
*  `delay:<time interval>` - wait the given amount of time (e.g. `1s`) before
issuing the request.  If the event triggers again, the countdown is reset.
*  `throttle:<time interval>` - wait the given amount of time (e.g. `1s`) before
issuing the request.  Unlike `delay` if a new event occurs before the time limit is hit the event will be discarded,
so the request will trigger at the end of the time period.
*  `from:<CSS Selector>` - listen for the event on a different element.  This can be used for things like keyboard shortcuts. Note that this CSS selector is not re-evaluated if the page changes.

You can use these attributes to implement many common UX patterns, such as [Active Search](@/patterns/active-search.md):

```html
<input type="text" name="q"
       hx-get="/search"
       hx-trigger="keyup changed delay:500ms"
       hx-target="#search-results"
       placeholder="Search...">
<div id="search-results"></div>
```

This input will issue a request 500 milliseconds after a key up event if the input has been changed and inserts the results
into the `div` with the id `search-results`.

Multiple triggers can be specified in the [hx-trigger](@/attributes/hx-trigger.md) attribute, separated by commas.

#### Trigger Filters

You may also apply trigger filters by using square brackets after the event name, enclosing a javascript expression that
will be evaluated.  

If the expression evaluates to `true` the event will trigger, otherwise it will not.

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

You can also use custom events to trigger requests if you have an advanced use case.

#### Polling

If you want an element to poll the given URL rather than wait for an event, you can use the `every` syntax
with the [`hx-trigger`](@/attributes/hx-trigger.md) attribute:

```html
<div hx-get="/news" hx-trigger="every 2s"></div>
```

This tells htmx

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

The `htmx-indicator` class is defined so that the opacity of any element with this class is 0 by default, making it invisible
but present in the DOM.

When htmx issues a request, it will put a `htmx-request` class onto an element (either the requesting element or
another element, if specified).  The `htmx-request` class will cause a child element with the `htmx-indicator` class
on it to transition to an opacity of 1, showing the indicator.

```html
<button hx-get="/click">
    Click Me!
    <img class="htmx-indicator" src="/spinner.gif" alt="Loading...">
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

Here we call out the indicator explicitly by id.  Note that we could have placed the class on the parent `div` as well
and had the same effect.

You can also add the [`disabled` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/disabled) to
elements for the duration of a request by using the [hx-disable](@/attributes/hx-disable.md) attribute.

### Targets

If you want the response to be loaded into a different element other than the one that made the request, you can
use the [hx-target](@/attributes/hx-target.md) attribute, which takes a CSS selector.  

Looking back at our Live Search example:

```html
<input type="text" name="q"
    hx-get="/trigger_delay"
    hx-trigger="keyup delay:500ms changed"
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

<details class="migration-note">
<summary>htmx 2.0 to 4.0 Changes</summary>

<!--
ADD: New swap terminology (before, after, prepend, append) alongside classic names
ADD: innerMorph and outerMorph swap styles are now built-in
ADD: hx-status:XXX pattern for status-code conditional swapping
REWRITE: Morph section to reflect built-in support
REWRITE: View transitions config key (htmx.config.transitions not viewTransitions)
-->

**New Features:**
- **Modern swap terminology:** You can now use `before` (beforebegin), `after` (afterend), `prepend` (afterbegin), and `append` (beforeend). Both old and new names work.
- **Built-in morphing:** `innerMorph` and `outerMorph` swap styles are now available without extensions.
- **Status-code swapping:** Use `hx-status:XXX` attributes for conditional swapping based on HTTP status codes (e.g., `hx-status:404="none"`).

</details>

htmx offers a few different ways to swap the HTML returned into the DOM.  By default, the content replaces the
the target element, which is called an `outerHTML` swap.

You can modify this by using the [hx-swap](@/attributes/hx-swap.md) attribute with any of the following values:

| Name | Description
|------|-------------
| `outerHTML` | the default, replaces the entire target element with the returned content
| `innerHTML` | puts the content inside the target element
| `beforebegin` (or `before`) | prepends the content before the target in the target's parent element
| `afterbegin` (or `prepend`) | prepends the content before the first child inside the target
| `beforeend` (or `append`) | appends the content after the last child inside the target
| `afterend` (or `after`) | appends the content after the target in the target's parent element
| `delete` | deletes the target element regardless of the response
| `none` | does not append content from response ([Out of Band Swaps](#oob_swaps) and [Response Headers](#response-headers) will still be processed)
| `innerMorph` | morphs the children of the target element, preserving as much of the existing DOM as possible
| `outerMorph` | morphs the target element itself, preserving as much of the existing DOM as possible

#### Morph Swaps {#morphing}

In addition to the standard swap mechanisms above, htmx also supports _morphing_ swaps, via extensions.  Morphing swaps
attempt to _merge_ new content into the existing DOM, rather than simply replacing it.  They often do a better job
preserving things like focus, video state, etc. by mutating existing nodes in-place during the swap operation, at the
cost of more CPU.

<aside class="under-construction">
  <strong>🚧 Pardon our dust 🚧</strong>
  <p>are we going to have a morph swap out of the box</p>
</aside>

#### View Transitions {#view-transitions}

The [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
gives developers a way to create an animated transition between different DOM states.  

By default, htmx uses the viewTransition() API when swapping in content.

View Transitions can be configured using CSS, as outlined in [the Chrome documentation for the feature](https://developer.chrome.com/docs/web-platform/view-transitions/#simple-customization).

<aside class="under-construction">
  <strong>🚧 Pardon our dust 🚧</strong>
  <p>more docs on this</p>
</aside>

You can see a view transition example on the [Animation Patterns](/patterns/animations#view-transitions) page.

#### Swap Options

The [hx-swap](@/attributes/hx-swap.md) attribute supports many options for tuning the swapping behavior of htmx.  For
example, by default htmx will swap in the title of a title tag found anywhere in the new content.  You can turn this
behavior off by setting the `ignoreTitle` modifier to true:

```html
    <button hx-post="/like" hx-swap="outerHTML ignoreTitle:true">Like</button>
```

The modifiers available on `hx-swap` are:

| Option        | Description                                                                                              |
|---------------|----------------------------------------------------------------------------------------------------------|
| `transition`  | `true` or `false`, whether to use the view transition API for this swap                                  |
| `ignoreTitle` | If set to `true`, any title found in the new content will be ignored and not update the document title   |
| `scroll`      | `top` or `bottom`, will scroll the target element to its top or bottom                                   |
| `show`        | `top` or `bottom`, will scroll the target element's top or bottom into view                               |

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

Using `hx-sync="closest form:abort"` on the input will watch for requests on the form and abort the input's request if
a form request is present or starts while the input request is in flight:

```html
<form hx-post="/store">
    <input id="title" name="title" type="text"
        hx-post="/validate"
        hx-trigger="change"
        hx-sync="closest form:abort">
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
javascript.  Consider this HTML content:

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

The `<partial>` tag (internally represented as `<template partial>`) allows you to include multiple targeted content
fragments in a single server response. This provides a cleaner, more explicit alternative to
[out-of-band swaps](#oob_swaps) when you want to update multiple parts of the page from one request.

#### Basic Usage

A `<partial>` tag wraps content that should be swapped into a specific target on the page:

```html
<partial hx-target="#messages" hx-swap="beforeend">
  <div>New message content</div>
</partial>

<partial hx-target="#notifications" hx-swap="innerHTML">
  <span class="badge">5</span>
</partial>
```

Each `<partial>` specifies:
- `hx-target` - A CSS selector identifying where to place the content (required)
- `hx-swap` - (optional) The swap strategy to use (defaults to `innerHTML`)

The content inside the `<partial>` tag will be extracted and swapped into the specified target using the specified swap method.

#### Comparison with Out-of-Band Swaps

Both partials and out-of-band swaps allow updating multiple targets from a single response, but they differ in approach:

- **Out-of-band swaps** rely on matching `id` attributes between the response and existing DOM elements
- **Partial tags** explicitly specify their target via `hx-target`, providing more control and clarity

Use partials when you want explicit control over targeting, and out-of-band swaps when you have a consistent `id` scheme.

### Out of Band Swaps {#oob_swaps}

<aside class="under-construction">
  <strong>🚧 Pardon our dust 🚧</strong>
</aside>

If you want to swap content from a response directly into the DOM by using the `id` attribute you can use the
[hx-swap-oob](@/attributes/hx-swap-oob.md) attribute in the *response* html:

```html
<div id="message" hx-swap-oob="true">Swap me directly!</div>
Additional Content
```

In this response, `div#message` would be swapped directly into the matching DOM element, while the additional content
would be swapped into the target in the normal manner.

You can use this technique to "piggy-back" updates on other requests.

#### Troublesome Tables

Table elements can be problematic when combined with out of band swaps, because, by the HTML spec, many can't stand on
their own in the DOM (e.g. `<tr>` or `<td>`).

To avoid this issue you can use a `template` tag to encapsulate these elements:

```html
<template>
  <tr id="message" hx-swap-oob="true"><td>Joe</td><td>Smith</td></tr>
</template>
```

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

<details class="migration-note">
<summary>htmx 2.0 to 4.0 Changes</summary>

<!--
REMOVE: hx-params attribute (removed in v4)
ADD: Note to use htmx:config:request event instead for filtering parameters
KEEP: hx-include, hx-vals remain unchanged
-->

**Removed:** `hx-params` attribute has been removed.

**Migration:** Use the `htmx:config:request` event to filter or modify parameters instead:
```javascript
document.body.addEventListener('htmx:config:request', function(evt) {
  // Modify evt.detail.ctx.request.body (FormData object)
});
```

</details>

By default, an element that causes a request will include its value if it has one.  If the element is a form it
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

See the [patterns section](@/patterns/_index.md) for more advanced form patterns, including [progress bars](@/patterns/file-upload.md) and [error handling](@/patterns/file-upload-input.md).

### Confirming Requests {#confirming}

<details class="migration-note">
<summary>htmx 2.0 to 4.0 Changes</summary>

<!--
REMOVE: hx-prompt attribute (removed in v4)
ADD: Note to use hx-confirm with js: prefix for prompts
KEEP: hx-confirm with basic string works the same
-->

**Removed:** `hx-prompt` attribute has been removed.

**Migration:** Use `hx-confirm` with the `js:` prefix for custom prompts:
```html
<button hx-confirm="js:prompt('Enter value')">Submit</button>
```

</details>

Often you will want to confirm an action before issuing a request.  htmx supports the [`hx-confirm`](@/attributes/hx-confirm.md)
attribute, which allows you to confirm an action using a simple javascript dialog:

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

<!--
REWRITE: Emphasize explicit vs implicit inheritance (already noted above)
ADD: Document :append modifier for appending to inherited values
ADD: Document :inherited:append combination
REMOVE: References to hx-disinherit and hx-inherit (removed in v4)
-->

**Breaking Change:** Inheritance is now **explicit** using the `:inherited` modifier.

**In htmx 2.x**, attributes automatically inherited from parent elements.

**In htmx 4.x**, you must use `hx-attribute:inherited="value"` to inherit from parents.

**New feature:** Use `:append` modifier to append values to inherited values:
```html
<div hx-include:inherited=".parent">
  <button hx-include:append=".child">
    <!-- Effective hx-include=".parent,.child" -->
  </button>
</div>
```

</details>

Unlike htmx 2, in htmx 4 attribute inheritance is _explicit_, rather than _implicit_.

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

A feature of `hx-boost` is that it degrades gracefully if javascript is not enabled: the links and forms continue
to work, they simply don't use ajax requests.  

This is known as
[Progressive Enhancement](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement), and it allows
a wider audience to use your site's functionality.

Other htmx patterns can be adapted to achieve progressive enhancement as well, but they will require more thought.

Consider the [active search](@/patterns/active-search.md) example.  As it is written, it will not degrade gracefully:
someone who does not have javascript enabled will not be able to use this feature. This is done for simplicity’s sake,
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

With this in place, javascript-enabled clients would still get the nice active-search UX, but non-javascript enabled
clients would be able to hit the enter key and still search.  Even better, you could add a "Search" button as well.
You would then need to update the form with an `hx-post` that mirrored the `action` attribute, or perhaps use `hx-boost`
on it.

You would need to check on the server side for the `HX-Request` header to differentiate between an htmx-driven and a
regular request, to determine exactly what to render to the client.

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

<details class="migration-note">
<summary>htmx 2.0 to 4.0 Changes</summary>

<!--
ADD: SSE (Server-Sent Events) is now built into core htmx
REMOVE: No longer requires hx-sse extension
ADD: Document hx-stream attribute for configuration
ADD: Support for POST/PUT/PATCH/DELETE (not just GET)
ADD: Automatic reconnection with exponential backoff
-->

**Major Change:** Server-Sent Events (SSE) are now **built-in** to htmx core.

**In htmx 2.x**, SSE required the `hx-sse` extension.

**In htmx 4.x**:
- SSE is built-in, no extension needed
- Any htmx request automatically handles SSE when server responds with `Content-Type: text/event-stream`
- Supports all HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Configure with `hx-stream` attribute (modes: `once`, `continuous`)
- Automatic reconnection with exponential backoff in `continuous` mode
- Page Visibility API integration (pause when tab hidden)

**No migration needed** if using standard htmx attributes - just remove the extension!

</details>

htmx 4 has built-in support for Streaming Responses Server-Sent Events (SSE).

Use the typical `hx-get`, `hx-post`, `hx-put`, `hx-patch`, or `hx-delete` attributes. When the server responds with `Content-Type: text/event-stream` instead of `Content-Type: text/html`, htmx automatically handles the stream. 

Each SSE message with a `data:` line (and no `event:` line) is processed like a regular htmx response, respecting `hx-target`, `hx-select`, and `hx-swap` attributes.

Like [fetch-event-source](https://github.com/Azure/fetch-event-source), htmx's custom SSE implementation supports request bodies, custom headers, and all HTTP methods (not just GET), and Page Visibility API integration (using the `pauseHidden` modifier).

### Basic Usage

```html
<button hx-get="/stream" hx-target="#llm-output" hx-swap="innerHTML">
    Stream LLM Response
</button>

<div id="llm-output"></div>
```

The server sends SSE messages with `data:` lines:
```
data: H

data: He

// ...

data: Hello partner!

```

Each message replaces the target element's content. The stream processes until the connection closes, then stops. No reconnection occurs by default.

### Stream Modes

The `hx-stream` attribute controls reconnection behavior. The default mode is `once`, so it doesn't need to be specified.

- `once` (default): Process stream until connection closes. No reconnection.
- `continuous`: Reconnect automatically if connection drops. Retries with exponential backoff.

```html
<body hx-get="/updates" hx-stream="continuous" hx-trigger="load">
    ...
</body>
```

**Note:** `hx-stream="continuous"` is primarily intended for use with `<htmx-action type="partial">` to enable real-time updates to multiple parts of the page via a permanently open SSE connection.

### Partial Updates

Use `<htmx-action type="partial">` tags to update multiple targets from a single stream, similar to `hx-swap-oob`.

```html
<button hx-get="/activity" hx-stream="continuous">
    Start Activity Stream
</button>

<div id="metrics">0</div>
<div id="status">Idle</div>
```

Server sends multiple partials in one message:

```
data: <htmx-action type="partial" hx-target="#metrics">42</htmx-action>

data: <htmx-action type="partial" hx-target="#status">Active</htmx-action>

```

### Custom Events

SSE `event:` lines trigger custom DOM events. When an `event:` line is present, htmx fires that event instead of performing a normal swap. Use this for lightweight updates without swapping DOM elements.

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

Global stream config in `htmx.config.streams`:

```html
<meta name="htmx:config" content='{
  "streams": {
    "mode": "once",
    "maxRetries": 3,
    "initialDelay": 500,
    "maxDelay": 30000,
    "pauseHidden": false
  }
}'>
```

- `mode`: `'once'` or `'continuous'`
- `maxRetries`: Maximum reconnection attempts (default: `Infinity`)
- `initialDelay`: First reconnect delay in ms (default: `500`)
- `maxDelay`: Max backoff delay in ms (default: `30000`)
- `pauseHidden`: Pause stream when page is hidden (default: `false`). Uses the Page Visibility API to pause the stream when the browser window is minimized or the tab is in the background.


You can override these settings per-element using the `hx-stream` attribute:
```html
<button hx-get="/stream"
        hx-stream="continuous maxRetries:10 initialDelay:1s pauseHidden:true">
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

Web Sockets are supported via and extensions.  Please see the [WebSocket extension](/extensions/ws)
page to learn more.

## History Support {#history}

<details class="migration-note">
<summary>htmx 2.0 to 4.0 Changes</summary>

<!--
REWRITE: History no longer uses localStorage
ADD: Full page requests are now issued for history restoration
REMOVE: hx-history attribute (removed)
REMOVE: hx-history-elt attribute (removed)
REWRITE: Config options - historyRestoreAsHxRequest and related options may need updating
-->

**Major Change:** History no longer uses `localStorage` for caching.

**In htmx 2.x**, history snapshots were stored in localStorage.

**In htmx 4.x**, htmx issues a full page request when the user navigates back/forward. The server receives an `HX-History-Restore-Request` header and should return the full page HTML.

**Removed attributes:**
- `hx-history` (no longer needed)
- `hx-history-elt` (no longer needed)

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

Additionally, htmx will need the entire page when restoring history if the page.

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

### CORS

<aside class="under-construction">
  <strong>🚧 Pardon our dust 🚧</strong>
  <p>update for fetch()</p>
</aside>

When using htmx in a cross origin context, remember to configure your web
server to set Access-Control headers in order for htmx headers to be visible
on the client side.

- [Access-Control-Allow-Headers (for request headers)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers)
- [Access-Control-Expose-Headers (for response headers)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers)

[See all the request and response headers that htmx implements.](@/reference.md#request_headers)

### Request Headers

htmx includes a number of useful headers in requests:

<aside class="under-construction">
  <strong>🚧 Pardon our dust 🚧</strong>
  <p>which are we going to keep?</p>
</aside>

| Header                       | Description                                                                                          |
|------------------------------|------------------------------------------------------------------------------------------------------|
| `HX-Boosted`                 | indicates that the request is via an element using [hx-boost](@/attributes/hx-boost.md)              |
| `HX-History-Restore-Request` | "true" if the request is for history restoration after a miss in the local history cache             |
| `HX-Request`                 | always "true" except on history restore requests if `htmx.config.historyRestoreAsHxRequest' disabled |

### Response Headers

<aside class="under-construction">
  <strong>🚧 Pardon our dust 🚧</strong>
  <p>which are we going to keep?</p>
</aside>

htmx supports some htmx-specific response headers:

* [`HX-Location`](@/headers/hx-location.md) - allows you to do a client-side redirect that does not do a full page reload
* [`HX-Push-Url`](@/headers/hx-push-url.md) - pushes a new url into the history stack
* [`HX-Redirect`](@/headers/hx-redirect.md) - can be used to do a client-side redirect to a new location
* `HX-Refresh` - if set to "true" the client-side will do a full refresh of the page
* [`HX-Replace-Url`](@/headers/hx-replace-url.md) - replaces the current URL in the location bar
* `HX-Reswap` - allows you to specify how the response will be swapped. See [hx-swap](@/attributes/hx-swap.md) for possible values
* `HX-Retarget` - a CSS selector that updates the target of the content update to a different element on the page
* `HX-Reselect` - a CSS selector that allows you to choose which part of the response is used to be swapped in. Overrides an existing [`hx-select`](@/attributes/hx-select.md) on the triggering element
* [`HX-Trigger`](@/headers/hx-trigger.md) - allows you to trigger client-side events
* [`HX-Trigger-After-Settle`](@/headers/hx-trigger.md) - allows you to trigger client-side events after the settle step
* [`HX-Trigger-After-Swap`](@/headers/hx-trigger.md) - allows you to trigger client-side events after the swap step

For more on the `HX-Trigger` headers, see [`HX-Trigger` Response Headers](@/headers/hx-trigger.md).

Submitting a form via htmx has the benefit of no longer needing the [Post/Redirect/Get Pattern](https://en.wikipedia.org/wiki/Post/Redirect/Get).
After successfully processing a POST request on the server, you don't need to return a [HTTP 302 (Redirect)](https://en.wikipedia.org/wiki/HTTP_302). You can directly return the new HTML fragment.

Also, the response headers above are not provided to htmx for processing with 3xx Redirect response codes like [HTTP 302 (Redirect)](https://en.wikipedia.org/wiki/HTTP_302). Instead, the browser will intercept the redirection internally and return the headers and response from the redirected URL. Where possible use alternative response codes like 200 to allow returning of these response headers.

### Request Order of Operations {#request-operations}

The order of operations in a htmx request are:

<aside class="under-construction">
  <strong>🚧 Pardon our dust 🚧</strong>
  <p>redo</p>
</aside>

You can use the `htmx-swapping` and `htmx-settling` classes to create
[CSS transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions) between pages.

## Validation

Htmx integrates with the [HTML5 Validation API](https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation)
and will not issue a request for a form if a validatable input is invalid.  

Non-form elements do not validate before they make requests by default, but you can enable validation by setting
the [`hx-validate`](@/attributes/hx-validate.md) attribute to "true".

## Animations

Htmx allows you to use [CSS transitions](#css_transitions)
in many situations using only HTML and CSS.

Please see the [Animation Guide](@/patterns/animations.md) for more details on the options available.

## Extensions

<details class="migration-note">
<summary>htmx 2.0 to 4.0 Changes</summary>

<!--
REMOVE: hx-ext attribute (no longer needed for globally registered extensions)
REWRITE: Extension API is now event-based
ADD: Extensions register globally via htmx.config.extensions
ADD: Extensions use defineExtension with event handlers
-->

**Major Change:** Extensions are now globally registered and event-based.

**In htmx 2.x**, extensions required `hx-ext="extension-name"` on elements.

**In htmx 4.x**, extensions:
1. Register globally in `htmx.config.extensions` meta tag
2. Use `htmx.defineExtension()` with event handler functions
3. Listen to htmx events (no special extension API)

**Removed:** `hx-ext` attribute is no longer needed for globally registered extensions.

**Example:**
```html
<meta name="htmx:config" content='{"extensions": "my-extension"}'>
```

```javascript
htmx.defineExtension('my-extension', {
  'htmx_before_request': function(elt, detail) {
    // Handle event
  }
});
```

</details>

<aside class="under-construction">
  <strong>🚧 Pardon our dust 🚧</strong>
  <p>is this true?</p>
</aside>

In htmx 4, extensions are just libraries that hook into the standard events and use the public API.  There is no longer
a need for an explicit extension API.

### Core Extensions

htmx supports a few core extensions, which are supported by the htmx development team:

* [head-support](/extensions/head-support) - support for merging head tag information (styles, etc.) in htmx requests
* [idiomorph](/extensions/idiomorph) - supports the `morph` swap strategy using idiomorph
* [response-targets](/extensions/response-targets) - allows you to target elements based on HTTP response codes (e.g. `404`)
* [ws](/extensions/ws) - support for [Web Sockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)

You can see all available extensions on the [Extensions](/extensions) page.

### Creating Extensions

If you are interested in adding your own extension to htmx, please [see the extension docs](/extensions/building).

## Events & Logging {#events}

<details class="migration-note">
<summary>htmx 2.0 to 4.0 Changes</summary>

<!--
REWRITE: Event naming convention changed to htmx:phase:action
ADD: Comprehensive event name mapping table
ADD: New events introduced in v4
REMOVE: Old event names no longer fire
-->

**Breaking Change:** Event naming convention changed to `htmx:phase:action` (colon-separated).

**Examples of changed event names:**
- `htmx:afterRequest` → `htmx:after:request`
- `htmx:beforeSwap` → `htmx:before:swap`
- `htmx:configRequest` → `htmx:config:request`
- `htmx:load` → `htmx:after:init` (for element initialization)

**New events in v4:**
- `htmx:after:cleanup`
- `htmx:finally:request` (fires after request completes, success or failure)

See the full event mapping in the [Changes in htmx 4.0](/changes-in-4#event-changes) document.

**Note:** All events now provide a consistent `ctx` object with request/response information.

</details>

Htmx has an extensive [events mechanism](@/reference.md#events), which doubles as the logging system.

If you want to register for a given htmx event you can use

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

You can handle the [`htmx:configRequest`](@/events.md#htmx:configRequest) event in order to modify an AJAX request before it is issued:

```javascript
document.body.addEventListener('htmx:configRequest', function(evt) {
    evt.detail.parameters['auth_token'] = getAuthToken(); // add a new parameter into the request
    evt.detail.headers['Authentication-Token'] = getAuthToken(); // add a new header into the request
});
```

Here we add a parameter and header to the request before it is sent.

### Modifying Swapping Behavior With Events {#modifying_swapping_behavior_with_events}

You can handle the [`htmx:beforeSwap`](@/events.md#htmx:beforeSwap) event in order to modify the swap behavior of htmx:

```javascript
document.body.addEventListener('htmx:beforeSwap', function(evt) {
    if(evt.detail.xhr.status === 404){
        // alert the user when a 404 occurs (maybe use a nicer mechanism than alert())
        alert("Error: Could Not Find Resource");
    } else if(evt.detail.xhr.status === 422){
        // allow 422 responses to swap as we are using this as a signal that
        // a form was submitted with bad data and want to rerender with the
        // errors
        //
        // set isError to false to avoid error logging in console
        evt.detail.shouldSwap = true;
        evt.detail.isError = false;
    } else if(evt.detail.xhr.status === 418){
        // if the response code 418 (I'm a teapot) is returned, retarget the
        // content of the response to the element with the id `teapot`
        evt.detail.shouldSwap = true;
        evt.detail.target = htmx.find("#teapot");
    }
});
```

Here we handle a few [400-level error response codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#client_error_responses)
that would normally not do a swap in htmx.

## Debugging

Declarative and event driven programming with htmx (or any other declarative language) can be a wonderful and highly productive
activity, but one disadvantage when compared with imperative approaches is that it can be trickier to debug.

Figuring out why something *isn't* happening, for example, can be difficult if you don't know the tricks.

Here are somt tips:

The first debugging tool you can use is the `htmx.logAll()` method.  This will log every event that htmx triggers and
will allow you to see exactly what the library is doing.

```javascript
htmx.logAll();
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

<aside class="under-construction">
  <strong>🚧 Pardon our dust 🚧</strong>
  <p>finalize methods</p>
</aside>

You would most likely want to set a break point in the  methods to see what's going on.

And always feel free to jump on the [Discord](https://htmx.org/discord) if you need help.

## Scripting {#scripting}

<details class="migration-note">
<summary>htmx 2.0 to 4.0 Changes</summary>

<!--
ADD: New unified scripting API for hx-on handlers
ADD: Helper methods like timeout(), forEvent(), find(), findAll()
ADD: All public htmx methods available in hx-on handlers
ADD: 'this' keyword refers to the element in JavaScript contexts
KEEP: hx-on:* attributes work the same way
-->

**New Feature:** Unified scripting API for `hx-on` handlers.

**In htmx 4.x**, all `hx-on:*` handlers have access to:
- **Helper methods**: `timeout()`, `forEvent()`, `find()`, `findAll()`, `parseInterval()`, `trigger()`, `waitATick()`
- **htmx API methods**: All public htmx methods like `ajax()`, `swap()`, `process()`
- **Special symbols**:
  - `this` - the element with the `hx-on` attribute
  - `event` - the event object
  - `ctx` - request context (in request-related events)

**Example:**
```html
<button hx-on:click="await timeout(100); console.log(this)">
  Click me
</button>
```

See [Scripting API](#htmx-scripting-api) section below for all available methods.

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
and provide some nice quality of life improvements over the standard javascript API.

If you want to respond to the `click` event using an `hx-on` attribute, we would write this:

```html
<button hx-on:click="alert('You clicked me!')">
    Click Me!
</button>
```

So, the string `hx-on`, followed by a colon (or a dash), then by the name of the event.

#### <a name="htmx-scripting-api"></a>[The Scripting API](#htmx-scripting-api)

htmx provides some top level helper methods in `hx-on` handlers that make async scripting more enjoyable:

| function    | description                                                                                |
|-------------|--------------------------------------------------------------------------------------------|
| `timeout()` | allows you to wait for a given amount of time (e.g. `await timeout(100)` before continuing |


#### <a name="htmx-scripting-examples"></a>[Scripting Examples](#htmx-scripting-examples)

Here is an example that adds a parameter to an htmx request

<aside class="under-construction">
  <strong>🚧 Pardon our dust 🚧</strong>
  <p>verify symbols</p>
</aside>

```html
<button hx-post="/example"
        hx-on:htmx:config:request="ctx.parameters.example = 'Hello Scripting!'">
    Post Me!
</button>
```

Here the `example` parameter is added to the `POST` request before it is issued, with the value 'Hello Scripting!'.

Another use case is to [reset user input](@/patterns/reset-user-input.md) on successful requests using the `htmx:after:swap`
event:

```html
<button hx-post="/example"
        hx-on:htmx:after:request="find('#form').reset()">
    Post Me!
</button>
```

### 3rd Party Javascript {#3rd-party}

Htmx integrates well with third party libraries.  

If the library fires events on the DOM, you can use those events to trigger requests from htmx.

A good example of this is the [SortableJS demo](@/patterns/sortable.md):

```html
<form class="sortable" hx-post="/items" hx-trigger="end">
    <div class="htmx-indicator">Updating...</div>
    <div><input type='hidden' name='item' value='1'/>Item 1</div>
    <div><input type='hidden' name='item' value='2'/>Item 2</div>
    <div><input type='hidden' name='item' value='2'/>Item 3</div>
</form>
```

With Sortable, as with most javascript libraries, you need to initialize content at some point.

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

#### Web Components {#web-components}

Please see the [Web Components Pattern](@/patterns/web-components.md) page for examples on how to integrate htmx
with web components.

## Caching

htmx works with standard [HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
mechanisms out of the box.

If your server adds the
[`Last-Modified`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Last-Modified)
HTTP response header to the response for a given URL, the browser will automatically add the
[`If-Modified-Since`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since)
request HTTP header to the next requests to the same URL. Be mindful that if
your server can render different content for the same URL depending on some other
headers, you need to use the [`Vary`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching#vary)
response HTTP header. For example, if your server renders the full HTML when the
`HX-Request` header is missing or `false`, and it renders a fragment of that HTML
when `HX-Request: true`, you need to add `Vary: HX-Request`. That causes the cache to be
keyed based on a composite of the response URL and the `HX-Request` request header —
rather than being based just on the response URL. Always disable `htmx.config.historyRestoreAsHxRequest`
so that these history full HTML requests are not cached with partial fragment responses.

<aside class="under-construction">
  <strong>🚧 Pardon our dust 🚧</strong>
  <p>verify if still needed</p>
</aside>

If you are unable (or unwilling) to use the `Vary` header, you can alternatively set the configuration parameter
`getCacheBusterParam` to `true`.  If this configuration variable is set, htmx will include a cache-busting parameter
in `GET` requests that it makes, which will prevent browsers from caching htmx-based and non-htmx based responses
in the same cache slot.

htmx also works with [`ETag`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag)
as expected.  Be mindful that if your server can render different content for the same
URL (for example, depending on the value of the `HX-Request` header), the server needs
to generate a different `ETag` for each content.

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

#### Configuration Options

htmx also provides configuration options related to security:

* `htmx.config.selfRequestsOnly` - if set to `true`, only requests to the same domain as the current document will be allowed
* `htmx.config.allowScriptTags` - htmx will process `<script>` tags found in new content it loads.  If you wish to disable
   this behavior you can set this configuration variable to `false`
* `htmx.config.allowEval` - can be set to `false` to disable all features of htmx that rely on eval:
  * event filters
  * `hx-on:` attributes
  * `hx-vals` with the `js:` prefix
  * `hx-headers` with the `js:` prefix

Note that all features removed by disabling `eval()` can be reimplemented using your own custom javascript and the
htmx event model.

#### Events

<aside class="under-construction">
  <strong>🚧 Pardon our dust 🚧</strong>
  <p>rewrite</p>
</aside>

If you want to allow requests to some domains beyond the current host, but not leave things totally open, you can
use the `htmx:validateUrl` event.  This event will have the request URL available in the `detail.url` slot, as well
as a `sameHost` property.

You can inspect these values and, if the request is not valid, invoke `preventDefault()` on the event to prevent the
request from being issued.

```javascript
document.body.addEventListener('htmx:validateUrl', function (evt) {
  // only allow requests to the current server as well as myserver.com
  if (!evt.detail.sameHost && evt.detail.url.hostname !== "myserver.com") {
    evt.preventDefault();
  }
});
```

### CSP Options

Browsers also provide tools for further securing your web application.  The most powerful tool available is a
[Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP).  Using a CSP you can tell the
browser to, for example, not issue requests to non-origin hosts, to not evaluate inline script tags, etc.

Here is an example CSP in a `meta` tag:

```html
    <meta http-equiv="Content-Security-Policy" content="default-src 'self';">
```

This tells the browser "Only allow connections to the original (source) domain".  This would be redundant with the
`htmx.config.selfRequestsOnly`, but a layered approach to security is warranted and, in fact, ideal, when dealing
with application security.

A full discussion of CSPs is beyond the scope of this document, but the [MDN Article](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) provides a good jumping-off point
for exploring this topic.

### CSRF Prevention

<aside class="under-construction">
  <strong>🚧 Pardon our dust 🚧</strong>
  <p>verify</p>
</aside>

The assignment and checking of CSRF tokens are typically backend responsibilities, but `htmx` can support returning the CSRF token automatically with every request using the `hx-headers` attribute. The attribute needs to be added to the element issuing the request or one of its ancestor elements. This makes the `html` and `body` elements effective global vehicles for adding the CSRF token to the `HTTP` request header, as illustrated below. 

Note: `hx-boost` does not update the `<html>` or `<body>` tags; if using this feature with `hx-boost`, make sure to include the CSRF token on an element that _will_ get replaced. Many web frameworks support automatically inserting the CSRF token as a hidden input in HTML forms. This is encouraged whenever possible.

```html
<html lang="en" hx-headers='{"X-CSRF-TOKEN": "CSRF_TOKEN_INSERTED_HERE"}'>
    :
</html>
```

```html
    <body hx-headers='{"X-CSRF-TOKEN": "CSRF_TOKEN_INSERTED_HERE"}'>
        :
    </body>
```

The above elements are usually unique in an HTML document and should be easy to locate within templates. 


## Configuring htmx {#config}

Htmx has configuration options that can be accessed either programmatically or declaratively.  

They are listed below:

<div class="info-table">

<aside class="under-construction">
  <strong>🚧 Pardon our dust 🚧</strong>
  <p>need to clean up</p>
</aside>

| Config Variable                        | Info                                                                                                                                                                                                                                                                                                                                                                                                                                  |
|----------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `htmx.config.defaultSwapStyle`         | defaults to `outerHTML`                                                                                                                                                                                                                                                                                                                                                                                                               |
| `htmx.config.includeIndicatorStyles`   | defaults to `true` (determines if the indicator styles are loaded)                                                                                                                                                                                                                                                                                                                                                                    |
| `htmx.config.indicatorClass`           | defaults to `htmx-indicator`                                                                                                                                                                                                                                                                                                                                                                                                          |
| `htmx.config.requestClass`             | defaults to `htmx-request`                                                                                                                                                                                                                                                                                                                                                                                                            |
| `htmx.config.addedClass`               | defaults to `htmx-added`                                                                                                                                                                                                                                                                                                                                                                                                              |
| `htmx.config.settlingClass`            | defaults to `htmx-settling`                                                                                                                                                                                                                                                                                                                                                                                                           |
| `htmx.config.swappingClass`            | defaults to `htmx-swapping`                                                                                                                                                                                                                                                                                                                                                                                                           |
| `htmx.config.allowEval`                | defaults to `true`, can be used to disable htmx's use of eval for certain features (e.g. trigger filters)                                                                                                                                                                                                                                                                                                                             |
| `htmx.config.allowScriptTags`          | defaults to `true`, determines if htmx will process script tags found in new content                                                                                                                                                                                                                                                                                                                                                  |
| `htmx.config.inlineScriptNonce`        | defaults to `''`, meaning that no nonce will be added to inline scripts                                                                                                                                                                                                                                                                                                                                                               |
| `htmx.config.attributesToSettle`       | defaults to `["class", "style", "width", "height"]`, the attributes to settle during the settling phase                                                                                                                                                                                                                                                                                                                               |
| `htmx.config.inlineStyleNonce`         | defaults to `''`, meaning that no nonce will be added to inline styles                                                                                                                                                                                                                                                                                                                                                                |
| `htmx.config.useTemplateFragments`     | defaults to `false`, HTML template tags for parsing content from the server (not IE11 compatible!)                                                                                                                                                                                                                                                                                                                                    |
| `htmx.config.wsReconnectDelay`         | defaults to `full-jitter`                                                                                                                                                                                                                                                                                                                                                                                                             |
| `htmx.config.wsBinaryType`             | defaults to `blob`, the [type of binary data](https://developer.mozilla.org/docs/Web/API/WebSocket/binaryType) being received over the WebSocket connection                                                                                                                                                                                                                                                                           |
| `htmx.config.disableSelector`          | defaults to `[hx-disable], [data-hx-disable]`, htmx will not process elements with this attribute on it or a parent                                                                                                                                                                                                                                                                                                                   |
| `htmx.config.withCredentials`          | defaults to `false`, allow cross-site Access-Control requests using credentials such as cookies, authorization headers or TLS client certificates                                                                                                                                                                                                                                                                                     |
| `htmx.config.timeout`                  | defaults to 0, the number of milliseconds a request can take before automatically being terminated                                                                                                                                                                                                                                                                                                                                    |
| `htmx.config.scrollBehavior`           | defaults to 'instant', the scroll behavior when using the [show](@/attributes/hx-swap.md#scrolling-scroll-show) modifier with `hx-swap`. The allowed values are `instant` (scrolling should happen instantly in a single jump), `smooth` (scrolling should animate smoothly) and `auto` (scroll behavior is determined by the computed value of [scroll-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-behavior)). |
| `htmx.config.defaultFocusScroll`       | if the focused element should be scrolled into view, defaults to false and can be overridden using the [focus-scroll](@/attributes/hx-swap.md#focus-scroll) swap modifier.                                                                                                                                                                                                                                                            |
| `htmx.config.getCacheBusterParam`      | defaults to false, if set to true htmx will append the target element to the `GET` request in the format `org.htmx.cache-buster=targetElementId`                                                                                                                                                                                                                                                                                      |
| `htmx.config.globalViewTransitions`    | if set to `true`, htmx will use the [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API) API when swapping in new content.                                                                                                                                                                                                                                                                        |
| `htmx.config.methodsThatUseUrlParams`  | defaults to `["get", "delete"]`, htmx will format requests with these methods by encoding their parameters in the URL, not the request body                                                                                                                                                                                                                                                                                           |
| `htmx.config.selfRequestsOnly`         | defaults to `true`, whether to only allow AJAX requests to the same domain as the current document                                                                                                                                                                                                                                                                                                                                    |
| `htmx.config.ignoreTitle`              | defaults to `false`, if set to `true` htmx will not update the title of the document when a `title` tag is found in new content                                                                                                                                                                                                                                                                                                       |
| `htmx.config.scrollIntoViewOnBoost`    | defaults to `true`, whether or not the target of a boosted element is scrolled into the viewport. If `hx-target` is omitted on a boosted element, the target defaults to `body`, causing the page to scroll to the top.                                                                                                                                                                                                               |
| `htmx.config.triggerSpecsCache`        | defaults to `null`, the cache to store evaluated trigger specifications into, improving parsing performance at the cost of more memory usage. You may define a simple object to use a never-clearing cache, or implement your own system using a [proxy object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Proxy)                                                                                     |
| `htmx.config.responseHandling`         | the default [Response Handling](@/docs.md#response-handling) behavior for response status codes can be configured here to either swap or error                                                                                                                                                                                                                                                                                        |
| `htmx.config.allowNestedOobSwaps`      | defaults to `true`, whether to process OOB swaps on elements that are nested within the main response element. See [Nested OOB Swaps](@/attributes/hx-swap-oob.md#nested-oob-swaps).                                                                                                                                                                                                                                                  |
| `htmx.config.historyRestoreAsHxRequest`| defaults to `true`, Whether to treat history cache miss full page reload requests as a "HX-Request" by returning this response header. This should always be disabled when using HX-Request header to optionally return partial responses                                                                                                                                                                                             |
</div>

You can set them directly in javascript, or you can use a `meta` tag:

```html
<meta name="htmx-config" content='{"defaultSwapStyle":"outerHTML"}'>
```

## Conclusion

And that's it!

Have fun with htmx! 

You can accomplish [quite a bit](@/patterns/_index.md) without writing a lot of code!
