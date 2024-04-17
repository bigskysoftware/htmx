+++
title = "Documentation"
[extra]
custom_classes = "wide-content"
+++
<div class="row">
<div class="2 col nav">

**Contents**

<div id="contents">

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
* [websockets & SSE](#websockets-and-sse)
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
* [caching](#caching)
* [security](#security)
* [configuring](#config)

</div>

</div>
<div class="10 col">

## htmx in a Nutshell {#introduction}

htmx is a library that allows you to access modern browser features directly from HTML, rather than using
javascript.

To understand htmx, first lets take a look at an anchor tag:

```html
<a href="/blog">Blog</a>
```

This anchor tag tells a browser:

> "When a user clicks on this link, issue an HTTP GET request to '/blog' and load the response content
>  into the browser window".

With that in mind, consider the following bit of HTML:

```html
<button hx-post="/clicked"
    hx-trigger="click"
    hx-target="#parent-div"
    hx-swap="outerHTML"
>
    Click Me!
</button>
```

This tells htmx:

> "When a user clicks on this button, issue an HTTP POST request to '/clicked' and use the content from the response
>  to replace the element with the id `parent-div` in the DOM"

htmx extends and generalizes the core idea of HTML as a hypertext, opening up many more possibilities directly
within the language:

* Now any element, not just anchors and forms, can issue an HTTP request
* Now any event, not just clicks or form submissions, can trigger requests
* Now any [HTTP verb](https://en.wikipedia.org/wiki/HTTP_Verbs), not just `GET` and `POST`, can be used
* Now any element, not just the entire window, can be the target for update by the request

Note that when you are using htmx, on the server side you typically respond with *HTML*, not *JSON*.  This keeps you firmly
within the [original web programming model](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm),
using [Hypertext As The Engine Of Application State](https://en.wikipedia.org/wiki/HATEOAS)
without even needing to really understand that concept.

It's worth mentioning that, if you prefer, you can use the [`data-`](https://html.spec.whatwg.org/multipage/dom.html#attr-data-*) prefix when using htmx:

```html
<a data-hx-post="/click">Click Me!</a>
```

## Installing

Htmx is a dependency-free, browser-oriented javascript library. This means that using it is as simple as adding a `<script>`
tag to your document head.  No need for complicated build steps or systems.

If you are migrating to htmx from intercooler.js, please see the [migration guide](@/migration-guide.md).

### Via A CDN (e.g. unpkg.com)

The fastest way to get going with htmx is to load it via a CDN. You can simply add this to your head tag
and get going:

```html
<script src="https://unpkg.com/htmx.org@1.9.12" integrity="sha384-ujb1lZYygJmzgSwoxRggbCHcjc0rB2XoQrxeTUQyRjrOnlCoYta87iKBWq3EsdM2" crossorigin="anonymous"></script>
```

Unminified version is also available

```html
<script src="https://unpkg.com/htmx.org@1.9.12/dist/htmx.js" integrity="sha384-qbtR4rS9RrUMECUWDWM2+YGgN3U4V4ZncZ0BvUcg9FGct0jqXz3PUdVpU1p0yrXS" crossorigin="anonymous"></script>
```

While the CDN approach is extremely simple, you may want to consider [not using CDNs in production](https://blog.wesleyac.com/posts/why-not-javascript-cdn).

### Download a copy

The next easiest way to install htmx is to simply copy it into your project.

Download `htmx.min.js` [from unpkg.com](https://unpkg.com/htmx.org/dist/htmx.min.js) and add it to the appropriate directory in your project
and include it where necessary with a `<script>` tag:

```html
<script src="/path/to/htmx.min.js"></script>
```

You can also add extensions this way, by downloading them from the `ext/` directory.

### npm

For npm-style build systems, you can install htmx via [npm](https://www.npmjs.com/):

```sh
npm install htmx.org
```

After installing, you’ll need to use appropriate tooling to use `node_modules/htmx.org/dist/htmx.js` (or `.min.js`).
For example, you might bundle htmx with some extensions and project-specific code.

### Webpack

If you are using webpack to manage your javascript:

* Install `htmx` via your favourite package manager (like npm or yarn)
* Add the import to your `index.js`

```js
import 'htmx.org';
```

If you want to use the global `htmx` variable (recommended), you need to inject it to the window scope:

* Create a custom JS file
* Import this file to your `index.js` (below the import from step 2)

```js
import 'path/to/my_custom.js';
```

* Then add this code to the file:

```js
window.htmx = require('htmx.org');
```

* Finally, rebuild your bundle

## AJAX

The core of htmx is a set of attributes that allow you to issue AJAX requests directly from HTML:

| Attribute | Description |
|-----------|-------------|
| [hx-get](@/attributes/hx-get.md) | Issues a `GET` request to the given URL|
| [hx-post](@/attributes/hx-post.md) | Issues a `POST` request to the given URL
| [hx-put](@/attributes/hx-put.md) | Issues a `PUT` request to the given URL
| [hx-patch](@/attributes/hx-patch.md) | Issues a `PATCH` request to the given URL
| [hx-delete](@/attributes/hx-delete.md) | Issues a `DELETE` request to the given URL

Each of these attributes takes a URL to issue an AJAX request to.  The element will issue a request of the specified
type to the given URL when the element is [triggered](#triggers):

```html
<div hx-put="/messages">
    Put To Messages
</div>
```

This tells the browser:

> When a user clicks on this div, issue a PUT request to the URL /messages and load the response into the div

### Triggering Requests {#triggers}

By default, AJAX requests are triggered by the "natural" event of an element:

* `input`, `textarea` & `select` are triggered on the `change` event
* `form` is triggered on the `submit` event
* everything else is triggered by the `click` event

If you want different behavior you can use the [hx-trigger](@/attributes/hx-trigger.md)
attribute to specify which event will cause the request.

Here is a `div` that posts to `/mouse_entered` when a mouse enters it:

```html
<div hx-post="/mouse_entered" hx-trigger="mouseenter">
    [Here Mouse, Mouse!]
</div>
```

#### Trigger Modifiers

A trigger can also have a few additional modifiers that change its behavior.  For example, if you want a request to only
 happen once, you can use the `once` modifier for the trigger:

```html
<div hx-post="/mouse_entered" hx-trigger="mouseenter once">
    [Here Mouse, Mouse!]
</div>
```

Other modifiers you can use for triggers are:

* `changed` - only issue a request if the value of the element has changed
*  `delay:<time interval>` - wait the given amount of time (e.g. `1s`) before
issuing the request.  If the event triggers again, the countdown is reset.
*  `throttle:<time interval>` - wait the given amount of time (e.g. `1s`) before
issuing the request.  Unlike `delay` if a new event occurs before the time limit is hit the event will be discarded,
so the request will trigger at the end of the time period.
*  `from:<CSS Selector>` - listen for the event on a different element.  This can be used for things like keyboard shortcuts.

You can use these attributes to implement many common UX patterns, such as [Active Search](@/examples/active-search.md):

```html
<input type="text" name="q"
    hx-get="/trigger_delay"
    hx-trigger="keyup changed delay:500ms"
    hx-target="#search-results"
    placeholder="Search..."
>
<div id="search-results"></div>
```

This input will issue a request 500 milliseconds after a key up event if the input has been changed and inserts the results
into the `div` with the id `search-results`.

Multiple triggers can be specified in the [hx-trigger](@/attributes/hx-trigger.md) attribute, separated by commas.

#### Trigger Filters

You may also apply trigger filters by using square brackets after the event name, enclosing a javascript expression that
will be evaluated.  If the expression evaluates to `true` the event will trigger, otherwise it will not.

Here is an example that triggers only on a Control-Click of the element

```html
<div hx-get="/clicked" hx-trigger="click[ctrlKey]">
    Control Click Me
</div>
```

Properties like `ctrlKey` will be resolved against the triggering event first, then the global scope.  The
`this` symbol will be set to the current element.

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

If you want to stop polling from a server response you can respond with the HTTP response code [`286`](https://en.wikipedia.org/wiki/86_(term))
and the element will cancel the polling.

#### Load Polling {#load_polling}

Another technique that can be used to achieve polling in htmx is "load polling", where an element specifies
a `load` trigger along with a delay, and replaces itself with the response:

```html
<div hx-get="/messages"
    hx-trigger="load delay:1s"
    hx-swap="outerHTML"
>
</div>
```

If the `/messages` end point keeps returning a div set up this way, it will keep "polling" back to the URL every
second.

Load polling can be useful in situations where a poll has an end point at which point the polling terminates, such as
when you are showing the user a [progress bar](@/examples/progress-bar.md).

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
    <img class="htmx-indicator" src="/spinner.gif">
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
    <img id="indicator" class="htmx-indicator" src="/spinner.gif"/>
</div>
```

Here we call out the indicator explicitly by id.  Note that we could have placed the class on the parent `div` as well
and had the same effect.

You can also add the [the `disabled` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/disabled) to
elements for the duration of a request by using the [hx-disabled-elt](@/attributes/hx-disabled-elt.md) attribute.

### Targets

If you want the response to be loaded into a different element other than the one that made the request, you can
use the [hx-target](@/attributes/hx-target.md) attribute, which takes a CSS selector.  Looking back at our Live Search example:

```html
<input type="text" name="q"
    hx-get="/trigger_delay"
    hx-trigger="keyup delay:500ms changed"
    hx-target="#search-results"
    placeholder="Search..."
>
<div id="search-results"></div>
```

You can see that the results from the search are going to be loaded into `div#search-results`, rather than into the
input tag.


#### Extended CSS Selectors {#extended-css-selectors}

`hx-target`, and most attributes that take a CSS selector, support an "extended" CSS syntax:

* You can use the `this` keyword, which indicates that the element that the `hx-target` attribute is on is the target
* The `closest <CSS selector>` syntax will find the [closest](https://developer.mozilla.org/docs/Web/API/Element/closest)
  ancestor element or itself, that matches the given CSS selector.
  (e.g. `closest tr` will target the closest table row to the element)
* The `next <CSS selector>` syntax will find the next element in the DOM matching the given CSS selector.
* The `previous <CSS selector>` syntax will find the previous element in the DOM the given CSS selector.
* `find <CSS selector>` which will find the first child descendant element that matches the given CSS selector.
  (e.g `find tr` would target the first child descendant row to the element)

In addition, a CSS selector may be wrapped in `<` and `/>` characters, mimicking the
[query literal](https://hyperscript.org/expressions/query-reference/) syntax of hyperscript.

Relative targets like this can be useful for creating flexible user interfaces without peppering your DOM with loads
of `id` attributes.


### Swapping {#swapping}

htmx offers a few different ways to swap the HTML returned into the DOM.  By default, the content replaces the
`innerHTML` of the target element.  You can modify this by using the [hx-swap](@/attributes/hx-swap.md) attribute
with any of the following values:

| Name | Description
|------|-------------
| `innerHTML` | the default, puts the content inside the target element
| `outerHTML` | replaces the entire target element with the returned content
| `afterbegin` | prepends the content before the first child inside the target
| `beforebegin` | prepends the content before the target in the targets parent element
| `beforeend` | appends the content after the last child inside the target
| `afterend` | appends the content after the target in the targets parent element
| `delete` | deletes the target element regardless of the response
| `none` | does not append content from response ([Out of Band Swaps](#oob_swaps) and [Response Headers](#response-headers) will still be processed)

#### Morph Swaps {#morphing}

In addition to the standard swap mechanisms above, htmx also supports _morphing_ swaps, via extensions.  Morphing swaps
attempt to _merge_ new content into the existing DOM, rather than simply replacing it.  They often do a better job
preserving things like focus, video state, etc. by mutating existing nodes in-place during the swap operation, at the
cost of more CPU.

The following extensions are available for morph-style swaps:

* [Idiomorph](https://github.com/bigskysoftware/idiomorph#htmx) - A morphing algorithm created by the htmx developers.
* [Morphdom Swap](@/extensions/morphdom-swap.md) - Based on the [morphdom](https://github.com/patrick-steele-idem/morphdom),
  the original DOM morphing library.
* [Alpine-morph](@/extensions/alpine-morph.md) - Based on the [alpine morph](https://alpinejs.dev/plugins/morph) plugin, plays
  well with alpine.js

#### View Transitions {#view-transitions}

The new, experimental [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
gives developers a way to create an animated transition between different DOM states.  It is still in active development
and is not available in all browsers, but htmx provides a way to work with this new API that falls back to the non-transition
mechanism if the API is not available in a given browser.

You can experiment with this new API using the following approaches:

* Set the `htmx.config.globalViewTransitions` config variable to `true` to use transitions for all swaps
* Use the `transition:true` option in the `hx-swap` attribute
* If an element swap is going to be transitioned due to either of the above configurations, you may catch the
  `htmx:beforeTransition` event and call `preventDefault()` on it to cancel the transition.

View Transitions can be configured using CSS, as outlined in [the Chrome documentation for the feature](https://developer.chrome.com/docs/web-platform/view-transitions/#simple-customization).

You can see a view transition example on the [Animation Examples](/examples/animations#view-transitions) page.

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
| `swap`        | The swap delay to use (e.g. `100ms`) between when old content is cleared and the new content is inserted |
| `settle`      | The settle delay to use (e.g. `100ms`) between when new content is inserted and when it is settled       |
| `ignoreTitle` | If set to `true`, any title found in the new content will be ignored and not update the document title   |
| `scroll`      | `top` or `bottom`, will scroll the target element to its top or bottom                                   |
| `show`        | `top` or `bottom`, will scroll the target elements top or bottom into view                               |

All swap modifiers appear after the swap style is specified, and are colon-separated.

See the [hx-swap](@/attributes/hx-swap.md) documentation for more details on these options.

### Synchronization {#synchronization}

Often you want to coordinate the requests between two elements.  For example, you may want a request from one element
to supersede the request of another element, or to wait until the other elements request has finished.

htmx offers a [`hx-sync`](@/attributes/hx-sync.md) attribute to help you accomplish this.

Consider a race condition between a form submission and an individual input's validation request in this HTML:

```html
<form hx-post="/store">
    <input id="title" name="title" type="text"
        hx-post="/validate"
        hx-trigger="change"
    >
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
        hx-sync="closest form:abort"
    >
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

You can see the [Animation Examples](@/examples/animations.md) for more details and live demonstrations.

#### Details

To understand how CSS transitions actually work in htmx, you must understand the underlying swap & settle model that htmx uses.

When new content is received from a server, before the content is swapped in, the existing
content of the page is examined for elements that match by the `id` attribute.  If a match
is found for an element in the new content, the attributes of the old content are copied
onto the new element before the swap occurs.  The new content is then swapped in, but with the
*old* attribute values.  Finally, the new attribute values are swapped in, after a "settle" delay
(20ms by default).  A little crazy, but this is what allows CSS transitions to work without any javascript by
the developer.

### Out of Band Swaps {#oob_swaps}

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

You can also pick out pieces of content for an out-of-band swap by using the [hx-select-oob](@/attributes/hx-select-oob.md)
attribute, which takes a list of element IDs to pick out and swap.

#### Preserving Content During A Swap

If there is content that you wish to be preserved across swaps (e.g. a video player that you wish to remain playing
even if a swap occurs) you can use the [hx-preserve](@/attributes/hx-preserve.md)
attribute on the elements you wish to be preserved.

### Parameters

By default, an element that causes a request will include its value if it has one.  If the element is a form it
will include the values of all inputs within it.

As with HTML forms, the `name` attribute of the input is used as the parameter name in the request that htmx sends.

Additionally, if the element causes a non-`GET` request, the values of all the inputs of the nearest enclosing form
will be included.

If you wish to include the values of other elements, you can use the [hx-include](@/attributes/hx-include.md) attribute
with a CSS selector of all the elements whose values you want to include in the request.

If you wish to filter out some parameters you can use the [hx-params](@/attributes/hx-params.md) attribute.

Finally, if you want to programmatically modify the parameters, you can use the [htmx:configRequest](@/events.md#htmx:configRequest)
event.

#### File Upload {#files}

If you wish to upload files via an htmx request, you can set the [hx-encoding](@/attributes/hx-encoding.md) attribute to
`multipart/form-data`.  This will use a `FormData` object to submit the request, which will properly include the file
in the request.

Note that depending on your server-side technology, you may have to handle requests with this type of body content very
differently.

Note that htmx fires a `htmx:xhr:progress` event periodically based on the standard `progress` event during upload,
which you can hook into to show the progress of the upload.

See the [examples section](@/examples/_index.md) for more advanced form patterns, including [progress bars](@/examples/file-upload.md) and [error handling](@/examples/file-upload-input.md).

#### Extra Values

You can include extra values in a request using the [hx-vals](@/attributes/hx-vals.md) (name-expression pairs in JSON format) and
[hx-vars](@/attributes/hx-vars.md) attributes (comma-separated name-expression pairs that are dynamically computed).

### Confirming Requests {#confirming}

Often you will want to confirm an action before issuing a request.  htmx supports the [`hx-confirm`](@/attributes/hx-confirm.md)
attribute, which allows you to confirm an action using a simple javascript dialog:

```html
<button hx-delete="/account" hx-confirm="Are you sure you wish to delete your account?">
    Delete My Account
</button>
```

Using events you can implement more sophisticated confirmation dialogs.  The [confirm example](@/examples/confirm.md)
shows how to use [sweetalert2](https://sweetalert2.github.io/) library for confirmation of htmx actions.

## Attribute Inheritance {#inheritance}

Most attributes in htmx are inherited: they apply to the element they are on as well as any children elements.  This
allows you to "hoist" attributes up the DOM to avoid code duplication.  Consider the following htmx:

```html
<button hx-delete="/account" hx-confirm="Are you sure?">
    Delete My Account
</button>
<button hx-put="/account" hx-confirm="Are you sure?">
    Update My Account
</button>
```

Here we have a duplicate `hx-confirm` attribute.  We can hoist this attribute to a parent element:

```html
<div hx-confirm="Are you sure?">
    <button hx-delete="/account">
        Delete My Account
    </button>
    <button hx-put="/account">
        Update My Account
    </button>
</div>
```

This `hx-confirm` attribute will now apply to all htmx-powered elements within it.

Sometimes you wish to undo this inheritance.  Consider if we had a cancel button to this group, but didn't want it to
be confirmed.  We could add an `unset` directive on it like so:

```html
<div hx-confirm="Are you sure?">
    <button hx-delete="/account">
        Delete My Account
    </button>
    <button hx-put="/account">
        Update My Account
    </button>
    <button hx-confirm="unset" hx-get="/">
        Cancel
    </button>
</div>
```

The top two buttons would then show a confirm dialog, but the bottom cancel button would not.

Automatic inheritance can be disabled using the [`hx-disinherit`](@/attributes/hx-disinherit.md) attribute.

## Boosting

Htmx supports "boosting" regular HTML anchors and forms with the [hx-boost](@/attributes/hx-boost.md) attribute.  This
attribute will convert all anchor tags and forms into AJAX requests that, by default, target the body of the page.

Here is an example:

```html
<div hx-boost="true">
    <a href="/blog">Blog</a>
</div>
```

The anchor tag in this div will issue an AJAX `GET` request to `/blog` and swap the response into the `body` tag.

### Progressive Enhancement {#progressive_enhancement}

A feature of `hx-boost` is that it degrades gracefully if javascript is not enabled: the links and forms continue
to work, they simply don't use ajax requests.  This is known as
[Progressive Enhancement](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement), and it allows
a wider audience to use your sites functionality.

Other htmx patterns can be adapted to achieve progressive enhancement as well, but they will require more thought.

Consider the [active search](@/examples/active-search.md) example.  As it is written, it will not degrade gracefully:
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

## Web Sockets & SSE {#websockets-and-sse}

htmx has experimental support for declarative use of both
[WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)
and  [Server Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events).

<div style="border: 1px solid whitesmoke; background-color: #e4f0ff; padding: 8px; border-radius: 8px">

**Note:** In htmx 2.0, these features will be migrated to extensions.  These new extensions are already available in
htmx 1.7+ and, if you are writing new code, you are encouraged to use the extensions instead.  All new feature work for
both SSE and web sockets will be done in the extensions.

Please visit the [SSE extension](@/extensions/server-sent-events.md) and [WebSocket extension](@/extensions/web-sockets.md)
pages to learn more about the new extensions.

</div>

### WebSockets

If you wish to establish a `WebSocket` connection in htmx, you use the [hx-ws](@/attributes/hx-ws.md) attribute:

```html
<div hx-ws="connect:wss:/chatroom">
    <div id="chat_room">
        ...
    </div>
    <form hx-ws="send:submit">
        <input name="chat_message">
    </form>
</div>
```

The `connect` declaration established the connection, and the `send` declaration tells the form to submit values to the socket on `submit`.

More details can be found on the [hx-ws attribute page](@/attributes/hx-ws.md)

### Server Sent Events {#sse}

[Server Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) are a way for servers to send events to browsers.  It provides a higher-level mechanism for communication between the
server and the browser than websockets.

If you want an element to respond to a Server Sent Event via htmx, you need to do two things:

1. Define an SSE source.  To do this, add a [hx-sse](@/attributes/hx-sse.md) attribute on a parent element with
a `connect:<url>` declaration that specifies the URL from which Server Sent Events will be received.

2. Define elements that are descendents of this element that are triggered by server sent events using the
`hx-trigger="sse:<event_name>"` syntax

Here is an example:

```html
<body hx-sse="connect:/news_updates">
    <div hx-trigger="sse:new_news" hx-get="/news"></div>
</body>
```

Depending on your implementation, this may be more efficient than the polling example above since the server would
notify the div if there was new news to get, rather than the steady requests that a poll causes.

## History Support {#history}

Htmx provides a simple mechanism for interacting with the [browser history API](https://developer.mozilla.org/en-US/docs/Web/API/History_API):

If you want a given element to push its request URL into the browser navigation bar and add the current state of the page
to the browser's history, include the [hx-push-url](@/attributes/hx-push-url.md) attribute:

```html
<a hx-get="/blog" hx-push-url="true">Blog</a>
```

When a user clicks on this link, htmx will snapshot the current DOM and store it before it makes a request to /blog.
It then does the swap and pushes a new location onto the history stack.

When a user hits the back button, htmx will retrieve the old content from storage and swap it back into the target,
simulating "going back" to the previous state.  If the location is not found in the cache, htmx will make an ajax
request to the given URL, with the header `HX-History-Restore-Request` set to true, and expects back the HTML needed
for the entire page.  Alternatively, if the `htmx.config.refreshOnHistoryMiss` config variable is set to true, it will
issue a hard browser refresh.

**NOTE:** If you push a URL into the history, you **must** be able to navigate to that URL and get a full page back!
A user could copy and paste the URL into an email, or new tab.  Additionally, htmx will need the entire page when restoring
history if the page is not in the history cache.

### Specifying History Snapshot Element

By default, htmx will use the `body` to take and restore the history snapshot from.  This is usually the right thing, but
if you want to use a narrower element for snapshotting you can use the [hx-history-elt](@/attributes/hx-history-elt.md)
attribute to specify a different one.

Careful: this element will need to be on all pages or restoring from history won't work reliably.

### Undoing DOM Mutations By 3rd Party Libraries

If you are using a 3rd party library and want to use the htmx history feature, you will need to clean up the DOM before
a snapshot is taken.  Let's consider the [Tom Select](https://tom-select.js.org/) library, which makes select elements
a much richer user experience.  Let's set up TomSelect to turn any input element with the `.tomselect` class into a rich
select element.

First we need to initialize elements that have the class in new content:

```javascript
htmx.onLoad(function (target) {
    // find all elements in the new content that should be
    // an editor and init w/ quill
    var editors = target.querySelectorAll(".tomselect")
            .forEach(elt => new TomSelect(elt))
});
```

This will create a rich selector for all input elements that have the `.tomselect` class on it.  However, it mutates
the DOM and we don't want that mutation saved to the history cache, since TomSelect will be reinitialized when the
history content is loaded back into the screen.

To deal with this, we need to catch the `htmx:beforeHistorySave` event and clean out the TomSelect mutations by calling
`destroy()` on them:

```javascript
htmx.on('htmx:beforeHistorySave', function() {
    // find all TomSelect elements
    document.querySelectorAll('.tomSelect')
            .forEach(elt => elt.tomselect.destroy()) // and call destroy() on them
})
```

This will revert the DOM to the original HTML, thus allowing for a clean snapshot.

### Disabling History Snapshots

History snapshotting can be disabled for a URL by setting the [hx-history](@/attributes/hx-history.md) attribute to `false`
on any element in the current document, or any html fragment loaded into the current document by htmx. This can be used
to prevent sensitive data entering the localStorage cache, which can be important for shared-use / public computers.
History navigation will work as expected, but on restoration the URL will be requested from the server instead of the
local history cache.

## Requests &amp; Responses {#requests}

Htmx expects responses to the AJAX requests it makes to be HTML, typically HTML fragments (although a full HTML
document, matched with a [hx-select](@/attributes/hx-select.md) tag can be useful too).  Htmx will then swap the returned
HTML into the document at the target specified and with the swap strategy specified.

Sometimes you might want to do nothing in the swap, but still perhaps trigger a client side event ([see below](#response-headers)).
For this situation you can return a `204 - No Content` response code, and htmx will ignore the content of the response.

In the event of an error response from the server (e.g. a 404 or a 501), htmx will trigger the [`htmx:responseError`](@/events.md#htmx:responseError)
event, which you can handle.

In the event of a connection error, the `htmx:sendError` event will be triggered.

### CORS

When using htmx in a cross origin context, remember to configure your web
server to set Access-Control headers in order for htmx headers to be visible
on the client side.

- [Access-Control-Allow-Headers (for request headers)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers)
- [Access-Control-Expose-Headers (for response headers)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers)

[See all the request and response headers that htmx implements.](@/reference.md#request_headers)

### Request Headers

htmx includes a number of useful headers in requests:

| Header | Description |
|--------|-------------|
| `HX-Boosted` | indicates that the request is via an element using [hx-boost](@/attributes/hx-boost.md)
| `HX-Current-URL` | the current URL of the browser
| `HX-History-Restore-Request` | "true" if the request is for history restoration after a miss in the local history cache
| `HX-Prompt` | the user response to an [hx-prompt](@/attributes/hx-prompt.md)
| `HX-Request` | always "true"
| `HX-Target` | the `id` of the target element if it exists
| `HX-Trigger-Name` | the `name` of the triggered element if it exists
| `HX-Trigger` | the `id` of the triggered element if it exists

### Response Headers

htmx supports some htmx-specific response headers:

* [`HX-Location`](@/headers/hx-location.md) - allows you to do a client-side redirect that does not do a full page reload
* [`HX-Push-Url`](@/headers/hx-push-url.md) - pushes a new url into the history stack
* `HX-Redirect` - can be used to do a client-side redirect to a new location
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
 
### Request Order of Operations {#request-operations}

The order of operations in a htmx request are:

* The element is triggered and begins a request
  * Values are gathered for the request
  * The `htmx-request` class is applied to the appropriate elements
  * The request is then issued asynchronously via AJAX
    * Upon getting a response the target element is marked with the `htmx-swapping` class
    * An optional swap delay is applied (see the [hx-swap](@/attributes/hx-swap.md) attribute)
    * The actual content swap is done
        * the `htmx-swapping` class is removed from the target
        * the `htmx-added` class is added to each new piece of content
        * the `htmx-settling` class is applied to the target
        * A settle delay is done (default: 20ms)
        * The DOM is settled
        * the `htmx-settling` class is removed from the target
        * the `htmx-added` class is removed from each new piece of content

You can use the `htmx-swapping` and `htmx-settling` classes to create
[CSS transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions) between pages.

## Validation

Htmx integrates with the [HTML5 Validation API](https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation)
and will not issue a request for a form if a validatable input is invalid.  This is true for both AJAX requests as well as
WebSocket sends.

Htmx fires events around validation that can be used to hook in custom validation and error handling:

* `htmx:validation:validate` - called before an elements `checkValidity()` method is called.  May be used to add in
   custom validation logic
* `htmx:validation:failed` - called when `checkValidity()` returns false, indicating an invalid input
* `htmx:validation:halted` - called when a request is not issued due to validation errors.  Specific errors may be found
  in the `event.detail.errors` object

Non-form elements do not validate before they make requests by default, but you can enable validation by setting
the [`hx-validate`](@/attributes/hx-validate.md) attribute to "true".

### Validation Example

Here is an example of an input that uses the [`hx-on`](/attributes/hx-on) attribute to catch the 
`htmx:validation:validate` event and require that the input have the value `foo`:

```html
<form id="example-form" hx-post="/test">
    <input name="example"
           onkeyup="this.setCustomValidity('') // reset the validation on keyup"
           hx-on:htmx:validation:validate="if(this.value != 'foo') {
                    this.setCustomValidity('Please enter the value foo') // set the validation error
                    htmx.find('#foo-form').reportValidity()              // report the issue
                }">
</form>
```

Note that all client side validations must be re-done on the server side, as they can always be bypassed.

## Animations

Htmx allows you to use [CSS transitions](#css_transitions)
in many situations using only HTML and CSS.

Please see the [Animation Guide](@/examples/animations.md) for more details on the options available.

## Extensions

Htmx has an extension mechanism that allows you to customize the libraries' behavior.
Extensions [are defined in javascript](@/extensions/_index.md#defining) and then used via
the [`hx-ext`](@/attributes/hx-ext.md) attribute:

```html
<div hx-ext="debug">
    <button hx-post="/example">This button used the debug extension</button>
    <button hx-post="/example" hx-ext="ignore:debug">This button does not</button>
</div>
```

If you are interested in adding your own extension to htmx, please [see the extension docs](@/extensions/_index.md)

### Included Extensions

Htmx includes some extensions that are tested against the htmx code base.  Here are a few:

| Extension | Description
|-----------|-------------
| [`json-enc`](@/extensions/json-enc.md) | use JSON encoding in the body of requests, rather than the default `x-www-form-urlencoded`
| [`morphdom-swap`](@/extensions/morphdom-swap.md) | an extension for using the [morphdom](https://github.com/patrick-steele-idem/morphdom) library as the swapping mechanism in htmx.
| [`alpine-morph`](@/extensions/alpine-morph.md) | an extension for using the [Alpine.js morph](https://alpinejs.dev/plugins/morph) plugin as the swapping mechanism in htmx.
| [`client-side-templates`](@/extensions/client-side-templates.md) | support for client side template processing of JSON responses
| [`path-deps`](@/extensions/path-deps.md) | an extension for expressing path-based dependencies [similar to intercoolerjs](http://intercoolerjs.org/docs.html#dependencies)
| [`class-tools`](@/extensions/class-tools.md) | an extension for manipulating timed addition and removal of classes on HTML elements
| [`multi-swap`](@/extensions/multi-swap.md) | allows to swap multiple elements with different swap methods
| [`response-targets`](@/extensions/response-targets.md) | allows to swap elements for responses with HTTP codes beyond `200`

See the [extensions page](@/extensions/_index.md#included) for a complete list.

## Events & Logging {#events}

Htmx has an extensive [events mechanism](@/reference.md#events), which doubles as the logging system.

If you want to register for a given htmx event you can use

```js
document.body.addEventListener('htmx:load', function(evt) {
    myJavascriptLib.init(evt.detail.elt);
});
```

or, if you would prefer, you can use the following htmx helper:

```javascript
htmx.on("htmx:load", function(evt) {
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

### Event Naming {#event_naming}

Note that all events are fired with two different names

* Camel Case
* Kebab Case

So, for example, you can listen for `htmx:afterSwap` or for `htmx:after-swap`.  This facilitates interoperability
with other libraries.  [Alpine.js](https://github.com/alpinejs/alpine/), for example, requires kebab case.

### Logging

If you set a logger at `htmx.logger`, every event will be logged.  This can be very useful for troubleshooting:

```javascript
htmx.logger = function(elt, event, data) {
    if(console) {
        console.log(event, elt, data);
    }
}
```

## Debugging

Declarative and event driven programming with htmx (or any other declarative language) can be a wonderful and highly productive
activity, but one disadvantage when compared with imperative approaches is that it can be trickier to debug.

Figuring out why something *isn't* happening, for example, can be difficult if you don't know the tricks.

Well, here are the tricks:

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

Finally, push come shove, you might want to just debug `htmx.js` by loading up the unminimized version.  It's
about 2500 lines of javascript, so not an insurmountable amount of code.  You would most likely want to set a break
point in the `issueAjaxRequest()` and `handleAjaxResponse()` methods to see what's going on.

And always feel free to jump on the [Discord](https://htmx.org/discord) if you need help.

### Creating Demos

Sometimes, in order to demonstrate a bug or clarify a usage, it is nice to be able to use a javascript snippet
site like [jsfiddle](https://jsfiddle.net/).  To facilitate easy demo creation, htmx hosts a demo script
site that will install:

* htmx
* hyperscript
* a request mocking library

Simply add the following script tag to your demo/fiddle/whatever:

```html
<script src="https://demo.htmx.org"></script>
```

This helper allows you to add mock responses by adding `template` tags with a `url` attribute to indicate which URL.
The response for that url will be the innerHTML of the template, making it easy to construct mock responses. You can
add a delay to the response with a `delay` attribute, which should be an integer indicating the number of milliseconds
to delay

You may embed simple expressions in the template with the `${}` syntax.

Note that this should only be used for demos and is in no way guaranteed to work for long periods of time
as it will always be grabbing the latest versions htmx and hyperscript!

#### Demo Example

Here is an example of the code in action:

```html
<!-- load demo environment -->
<script src="https://demo.htmx.org"></script>

<!-- post to /foo -->
<button hx-post="/foo" hx-target="#result">
    Count Up
</button>
<output id="result"></output>

<!-- respond to /foo with some dynamic content in a template tag -->
<script>
    globalInt = 0;
</script>
<template url="/foo" delay="500"> <!-- note the url and delay attributes -->
    ${globalInt++}
</template>

```

## Scripting {#scripting}

While htmx encourages a hypermedia approach to building web applications, it offers many options for client scripting. Scripting is included in the REST-ful description of web architecture, see: [Code-On-Demand](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm#sec_5_1_7). As much as is feasible, we recommend a [hypermedia-friendly](/essays/hypermedia-friendly-scripting) approach to scripting in your web application:

* [Respect HATEOAS](/essays/hypermedia-friendly-scripting#prime_directive)
* [Use events to communicate between components](/essays/hypermedia-friendly-scripting#events)
* [Use islands to isolate non-hypermedia components from the rest of your application](/essays/hypermedia-friendly-scripting#islands)
* [Consider inline scripting](/essays/hypermedia-friendly-scripting#inline)

The primary integration point between htmx and scripting solutions is the [events](#events) that htmx sends and can
respond to.  See the SortableJS example in the [3rd Party Javascript](#3rd-party) section for a good template for
integrating a JavaScript library with htmx via events.

Scripting solutions that pair well with htmx include:

* [VanillaJS](http://vanilla-js.com/) - Simply using the built-in abilities of JavaScript to hook in event handlers to
  respond to the events htmx emits can work very well for scripting.  This is an extremely lightweight and increasingly
  popular approach.
* [AlpineJS](https://alpinejs.dev/) - Alpine.js provides a rich set of tools for creating sophisticated front end scripts,
  including reactive programming support, while still remaining extremely lightweight.  Alpine encourages the "inline scripting"
  approach that we feel pairs well with htmx.
* [jQuery](https://jquery.com/) - Despite its age and reputation in some circles, jQuery pairs very well with htmx, particularly
  in older code-bases that already have a lot of jQuery in them.
* [hyperscript](https://hyperscript.org) - Hyperscript is an experimental front-end scripting language created by the same
  team that created htmx.  It is designed to embed well in HTML and both respond to and create events, and pairs very well
  with htmx.

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
[Locality of Behaviour (LoB)](/essays/locality-of-behaviour).  Unfortunately, HTML only allows `on*` attributes for a fixed
number of [specific DOM events](https://www.w3schools.com/tags/ref_eventattributes.asp) (e.g. `onclick`) and 
doesn't provide a generalized mechanism for responding to arbitrary events on elements.

In order to address this shortcoming, htmx offers [`hx-on*`](/attributes/hx-on) attributes.  These attributes allow
you to respond to any event in a manner that preserves the LoB of the standard `on*` properties.

If we wanted to respond to the `click` event using an `hx-on` attribute, we would write this:

```html
<button hx-on:click="alert('You clicked me!')">
    Click Me!
</button>
```

So, the string `hx-on`, followed by a colon (or a dash), then by the name of the event.

For a `click` event, of course, we would recommend sticking with the standard `onclick` attribute.  However, consider an 
htmx-powered button that wishes to add a parameter to a request using the `htmx:config-request` event.  This would not 
be possible using a standard `on*` property, but it can be done using the `hx-on:htmx:config-request` attribute:

```html
<button hx-post="/example"
        hx-on:htmx:config-request="event.detail.parameters.example = 'Hello Scripting!'">
    Post Me!
</button>
```

Here the `example` parameter is added to the `POST` request before it is issued, with the value 'Hello Scripting!'.

The `hx-on*` attributes are a very simple mechanism for generalized embedded scripting.  It is _not_ a replacement for more
fully developed front-end scripting solutions such as AlpineJS or hyperscript.  It can, however, augment a VanillaJS-based
approach to scripting in your htmx-powered application.

Note that HTML attributes are *case insensitive*.  This means that, unfortunately, events that rely on capitalization/
camel casing, cannot be responded to.  If you need to support camel case events we recommend using a more fully
functional scripting solution such as AlpineJS or hyperscript.  htmx dispatches all its events in both camelCase and in
kebab-case for this very reason.

### 3rd Party Javascript {#3rd-party}

Htmx integrates fairly well with third party libraries.  If the library fires events on the DOM, you can use those events to
trigger requests from htmx.

A good example of this is the [SortableJS demo](@/examples/sortable.md):

```html
<form class="sortable" hx-post="/items" hx-trigger="end">
    <div class="htmx-indicator">Updating...</div>
    <div><input type='hidden' name='item' value='1'/>Item 1</div>
    <div><input type='hidden' name='item' value='2'/>Item 2</div>
    <div><input type='hidden' name='item' value='2'/>Item 3</div>
</form>
```

With Sortable, as with most javascript libraries, you need to initialize content at some point.

In jquery you might do this like so:

```javascript
$(document).ready(function() {
    var sortables = document.body.querySelectorAll(".sortable");
    for (var i = 0; i < sortables.length; i++) {
        var sortable = sortables[i];
        new Sortable(sortable, {
            animation: 150,
            ghostClass: 'blue-background-class'
        });
    }
});
```

In htmx, you would instead use the `htmx.onLoad` function, and you would select only from the newly loaded content,
rather than the entire document:

```js
htmx.onLoad(function(content) {
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

If javascript adds content to the DOM that has htmx attributes on it, you need to make sure that this content
is initialized with the `htmx.process()` function.

For example, if you were to fetch some data and put it into a div using the `fetch` API, and that HTML had
htmx attributes in it, you would need to add a call to `htmx.process()` like this:

```js
let myDiv = document.getElementById('my-div')
fetch('http://example.com/movies.json')
    .then(response => response.text())
    .then(data => { myDiv.innerHTML = data; htmx.process(myDiv); } );
```

Some 3rd party libraries create content from HTML template elements. For instance, Alpine JS uses the `x-if`
attribute on templates to add content conditionally. Such templates are not initially part of the DOM and,
if they contain htmx attributes, will need a call to `htmx.process()` after they are loaded. The following
example uses Alpine's `$watch` function to look for a change of value that would trigger conditional content:

```html
<div x-data="{show_new: false}"
    x-init="$watch('show_new', value => {
        if (show_new) {
            htmx.process(document.querySelector('#new_content'))
        }
    })">
    <button @click = "show_new = !show_new">Toggle New Content</button>
    <template x-if="show_new">
        <div id="new_content">
            <a hx-get="/server/newstuff" href="#">New Clickable</a>
        </div>
    </template>
</div>
```

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
rather than being based just on the response URL.

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

#### `hx-disable`

The first tool htmx provides to help further secure your application is the [`hx-disable`](/attributes/hx-disable) 
attribute.  This attribute will prevent processing of all htmx attributes on a given element, and on all elements within
it.  So, for example, if you were including raw HTML content in a template (again, this is not recommended!) then you 
could place a div around the content with the `hx-disable` attribute on it:

```html
<div hx-disable>
    <%= raw(user_content) %>
</div>
```

And htmx will not process any htmx-related attributes or features found in that content.  This attribute cannot be
disabled by injecting further content: if an `hx-disable` attribute is found anywhere in the parent hierarchy of an
element, it will not be processed by htmx.

#### `hx-history`

Another security consideration is htmx history cache.  You may have pages that have sensitive data that you do not
want stored in the users `localStorage` cache.  You can omit a given page from the history cache by including the 
[`hx-history`](/attributes/hx-history) attribute anywhere on the page, and setting its value to `false`.  

#### Configuration Options

htmx also provides configuration options related to security:

* `htmx.config.selfRequestsOnly` - if set to `true`, only requests to the same domain as the current document will be allowed
* `htmx.config.allowScriptTags` - htmx will process `<script>` tags found in new content it loads.  If you wish to disable 
   this behavior you can set this configuration variable to `false`
* `htmx.config.historyCacheSize` - can be set to `0` to avoid storing any HTML in the `localStorage` cache
* `htmx.config.allowEval` - can be set to `false` to disable all features of htmx that rely on eval:
  * event filters
  * `hx-on:` attributes
  * `hx-vals` with the `js:` prefix
  * `hx-headers` with the `js:` prefix

Note that all features removed by disabling `eval()` can be reimplemented using your own custom javascript and the
htmx event model.

#### Events

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

A full discussion of CSPs is beyond the scope of this document, but the [MDN Article](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) provide a good jumping off point
for exploring this topic.

## Configuring htmx {#config}

Htmx has some configuration options that can be accessed either programmatically or declaratively.  They are
listed below:

<div class="info-table">

| Config Variable                       | Info                                                                                                                                                                       |
|---------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `htmx.config.historyEnabled`          | defaults to `true`, really only useful for testing                                                                                                                         |
| `htmx.config.historyCacheSize`        | defaults to 10                                                                                                                                                             |
| `htmx.config.refreshOnHistoryMiss`    | defaults to `false`, if set to `true` htmx will issue a full page refresh on history misses rather than use an AJAX request                                                |
| `htmx.config.defaultSwapStyle`        | defaults to `innerHTML`                                                                                                                                                    |
| `htmx.config.defaultSwapDelay`        | defaults to 0                                                                                                                                                              |
| `htmx.config.defaultSettleDelay`      | defaults to 20                                                                                                                                                             |
| `htmx.config.includeIndicatorStyles`  | defaults to `true` (determines if the indicator styles are loaded)                                                                                                         |
| `htmx.config.indicatorClass`          | defaults to `htmx-indicator`                                                                                                                                               |
| `htmx.config.requestClass`            | defaults to `htmx-request`                                                                                                                                                 |
| `htmx.config.addedClass`              | defaults to `htmx-added`                                                                                                                                                   |
| `htmx.config.settlingClass`           | defaults to `htmx-settling`                                                                                                                                                |
| `htmx.config.swappingClass`           | defaults to `htmx-swapping`                                                                                                                                                |
| `htmx.config.allowEval`               | defaults to `true`, can be used to disable htmx's use of eval for certain features (e.g. trigger filters)                                                                  |
| `htmx.config.allowScriptTags`         | defaults to `true`, determines if htmx will process script tags found in new content                                                                                       |
| `htmx.config.inlineScriptNonce`       | defaults to `''`, meaning that no nonce will be added to inline scripts                                                                                                    |
| `htmx.config.attributesToSettle`      | defaults to `["class", "style", "width", "height"]`, the attributes to settle during the settling phase                                                                    |
| `htmx.config.useTemplateFragments`    | defaults to `false`, HTML template tags for parsing content from the server (not IE11 compatible!)                                                                         |
| `htmx.config.wsReconnectDelay`        | defaults to `full-jitter`                                                                                                                                                  |
| `htmx.config.wsBinaryType`            | defaults to `blob`, the [the type of binary data](https://developer.mozilla.org/docs/Web/API/WebSocket/binaryType) being received over the WebSocket connection            |
| `htmx.config.disableSelector`         | defaults to `[hx-disable], [data-hx-disable]`, htmx will not process elements with this attribute on it or a parent                                                        |
| `htmx.config.withCredentials`         | defaults to `false`, allow cross-site Access-Control requests using credentials such as cookies, authorization headers or TLS client certificates                          |
| `htmx.config.timeout`                 | defaults to 0, the number of milliseconds a request can take before automatically being terminated                                                                         |
| `htmx.config.scrollBehavior`          | defaults to 'smooth', the behavior for a boosted link on page transitions. The allowed values are `auto` and `smooth`. Smooth will smoothscroll to the top of the page while auto will behave like a vanilla link.      |
| `htmx.config.defaultFocusScroll`      | if the focused element should be scrolled into view, defaults to false and can be overridden using the [focus-scroll](@/attributes/hx-swap.md#focus-scroll) swap modifier. |
| `htmx.config.getCacheBusterParam`     | defaults to false, if set to true htmx will include a cache-busting parameter in `GET` requests to avoid caching partial responses by the browser                          |
| `htmx.config.globalViewTransitions`   | if set to `true`, htmx will use the [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API) API when swapping in new content.             |
| `htmx.config.methodsThatUseUrlParams` | defaults to `["get"]`, htmx will format requests with these methods by encoding their parameters in the URL, not the request body                                          |
| `htmx.config.selfRequestsOnly`        | defaults to `false`, if set to `true` will only allow AJAX requests to the same domain as the current document                                                             |
| `htmx.config.ignoreTitle`             | defaults to `false`, if set to `true` htmx will not update the title of the document when a `title` tag is found in new content                                            |
| `htmx.config.scrollIntoViewOnBoost`   | defaults to `true`, whether or not the target of a boosted element is scrolled into the viewport. If `hx-target` is omitted on a boosted element, the target defaults to `body`, causing the page to scroll to the top. |
| `htmx.config.triggerSpecsCache`       | defaults to `null`, the cache to store evaluated trigger specifications into, improving parsing performance at the cost of more memory usage. You may define a simple object to use a never-clearing cache, or implement your own system using a [proxy object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Proxy) |

</div>

You can set them directly in javascript, or you can use a `meta` tag:

```html
<meta name="htmx-config" content='{"defaultSwapStyle":"outerHTML"}'>
```

## Conclusion

And that's it!

Have fun with htmx! You can accomplish [quite a bit](@/examples/_index.md) without writing a lot of code!

</div>
</div>
