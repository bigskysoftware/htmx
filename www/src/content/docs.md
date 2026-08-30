---
title: "Documentation"
description: "From installation to advanced usage."
nav: docs-nav.html
---

## htmx in a Nutshell

htmx extends HTML's built-in concept of [hypermedia controls](https://dl.acm.org/doi/fullHtml/10.1145/3648188.3675127).

To understand htmx, let's take a look at the two most widely known such controls: `<a>` (anchors, aka "links") & `<form>`s.

Here is a basic, boring anchor tag:

```html
<a href="/blog">Blog</a>
```

If you get past how pedestrian this link is, it's actually a pretty amazing little bit of technology: when a user clicks
on this link in a browser, the browser will issue an HTTP `GET` request to `/blog`. The browser then loads the HTML response
returned by the server into the browser's window.

Forms are a bit more complicated:

```html
<form method="post" action="/register">
    <label>Email: <input type="email"></label>
    <button type="submit">Submit</button>
</form>
```

When a user submits this form (by, say, clicking on the "Submit" button) a browser will issue an HTTP `POST` request to
`/register`. Again, the browser will load the HTML response to this request into the browser window.

The common pattern here is that the user performs an action, say, a click, and the browser issues an HTTP request to
a server and then loads the response HTML into the browser's window.

### How htmx Extends This Idea

The core idea of htmx is to use a few custom attributes to _generalize_ this idea:

* Any element can issue an HTTP request
* Any event can trigger that request
* The response HTML can be placed anywhere in the DOM

This small extension turns out to dramatically boost the expressiveness of HTML.

Here is a sample htmx-powered button:

```html
<button hx-post="/clicked"
        hx-trigger="click"
        hx-target="#output"
        hx-swap="outerHTML">
    Click Me
</button>
<output id="output"></output>
```

The htmx attributes start with `hx-`.  Let's go through each one:

* `hx-post="/clicked"` - this button should issue a POST request to the `/clicked` relative URL
* `hx-trigger="click"` - it should issue the request when the button is clicked
* `hx-target="#output"` - it should target the element with the id `output` with the HTML in the response to this request
* `hx-swap="outerHTML"` - it should replace the element entirely with that html

These four attributes let you specify how and when this button should issue a request and where in the DOM the resulting
HTML should be placed.

One thing to note: the `hx-trigger` here is redundant.  If it was omitted htmx would use the default trigger event
which, in the case of buttons, is a click.

One important thing to understand is that htmx expects _HTML_ from the server.  In this case the server would
return a _partial_ bit of HTML, say a `<div>`, to replace the target element (```<output id="output">```).  What htmx does _not_ expect is JSON.

Because htmx works in terms of HTML it follows the [original web programming model](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm), using [Hypertext As The Engine Of Application State](https://en.wikipedia.org/wiki/HATEOAS) (HATEOAS).

This makes developing with htmx feel much more like traditional web development than most front-end libraries today.
## Installing htmx

htmx is a single JavaScript file with no dependencies. No build step is required to use it.

### Installing CDN

To install htmx as a vanilla JavaScript library via the jsdeliver CDN, add this in your `<head>` tag:

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__" integrity="__SRI_MIN__" crossorigin="anonymous"></script>
```
Or, if you wish the unminified version (perhaps for debug reasons) use:
```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/htmx.js" integrity="__SRI_FULL__" crossorigin="anonymous"></script>
```

#### ES Module

To install htmx as a JavaScript ES Module via the jsdeliver CDN, add this in your `<head>` tag:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/htmx.esm.min.js" integrity="__SRI_ESM_MIN__" crossorigin="anonymous"></script>
```

or, unminified:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/htmx.esm.js" integrity="__SRI_ESM__" crossorigin="anonymous"></script>
```

### Downloading/Vendoring htmx

While a CDN is convenient, you should consider [self-hosting in production](https://blog.wesleyac.com/posts/why-not-javascript-cdn).

1. Download <a download href="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/htmx.min.js">htmx.min.js</a>
2. Save it to your project (e.g., `/js/htmx.min.js`)
3. Add this in your `<head>` tag:

```html
<script src="/js/htmx.min.js"></script>
```

This is sometimes called "vendoring" htmx.

You can also download:

* <a download href="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/htmx.js">htmx.js</a> (unminified)
* <a download href="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/htmx.esm.min.js">htmx.esm.min.js</a> (ES module)
* <a download href="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/htmx.esm.js">htmx.esm.js</a> (ES module, unminified)

### Installing htmx via NPM

You can install htmx via the standard

```sh
npm install htmx.org@__VERSION__
```

```javascript
import 'htmx.org';
```

```javascript
import htmx from 'htmx.org';

// Now you can use htmx.ajax(), htmx.find(), etc.
```

### Installing htmx + the core extensions: htmax.js

htmx has many useful [extensions](/extensions) that add functionality to it.

If you want to install a distribution that ships with most of the useful extensions already installed so you 
don't have to think about it, you can use the [htmax.js](/docs/htmax) distribution.
## Migrating From htmx 2.x to 4.x

There are three major behavioral changes between htmx 2.x and 4.x:

* In htmx 2.0 attribute inheritance is _implicit_ by default while in 4.0 it is _explicit_ by default
    * To restore the 2.0 behavior, you can set the [`htmx.config.implicitInheritance`](/reference/config/htmx-config-implicitInheritance) setting to `true`
* In htmx 2.0, `400` and `500` response codes are _not_ swapped by default, whereas in htmx 4.0 these requests _will_ be
  swapped
    * To restore the 2.0 behavior, you can set the [`htmx.config.noSwap`](/reference/config/htmx-config-noSwap) setting to `[204, 304, '4xx', '5xx']`
* In htmx 2.0, history used a local cache snapshot for history navigation, while in 4.0 it issues a request to the
  server to get the full page to restore
  * htmx includes an [`hx-history-cache`](/extensions/hx-history-cache) extension if you wish to have a local cache.  This extension integrates
    with Alpine.js and hx-live seamlessly.

Event names were also standardized/rationalized.

### Upgrade Checker

To make upgrading easier, htmx 4 ships with a command-line upgrade tool that scans your templates and JS files for
htmx 2 code that needs updating.

It checks for the following:

* Removed attributes
* Old event names
* Attribute inheritance patterns
* Extension changes, etc.

You can run the upgrade checker via `npx`:

```bash
npx htmx.org@__VERSION__ upgrade-check -- ./path/to/project/root

npx htmx.org@__VERSION__ upgrade-check --ext .vue ./path/to/project/root
```

By default, the tool scans `.html`, `.php`, `.js`, `.ts`, `.jinja`, `.jinja2`, `.j2`, `.erb`, and `.hbs` files.  You
can add additional HTML-like file extensions via the `--ext` argument.

Output is `file:line` format, clickable in most editors.

For more details see [What's New in 4.0](/docs/whats-new-in-htmx-4)

Extension authors who need to port their extensions to htmx 4 can refer to  [Migrating Extensions to 4.0](/docs/extension-htmx-4-migration-guide)
## Issuing Requests & Handling Responses

The crux of htmx is issuing HTTP request in response to events and then placing the response HTML into the document.

The core attributes for driving this behavior are:

* [`hx-get`](/reference/attributes/hx-get) - issues an HTTP `GET`
* [`hx-post`](/reference/attributes/hx-post) - issues an HTTP `POST`
* [`hx-put`](/reference/attributes/hx-put) - issues an HTTP `PUT`
* [`hx-patch`](/reference/attributes/hx-patch) - issues an HTTP `PATCH`
* [`hx-delete`](/reference/attributes/hx-delete) - issues an HTTP `DELETE`
* [`hx-query`](/reference/attributes/hx-query) - issues an HTTP `QUERY`

These attributes can be placed on any element to tell that element to issue a request when triggered:

```html
<button hx-get="/info">
  Get Information
</button>
```

As of htmx 4.0, you can also use the following alternative attributes:

* [`hx-action`](/reference/attributes/hx-action) - The URL to issue a request to
* [`hx-method`](/reference/attributes/hx-method) - The HTTP Action to use

```html
<button hx-action="/info" hx-method="GET">
  Get Information
</button>
```

This is inspired by the syntax that forms use:

```html
<form action="/info" method="GET">
  <button>Get Information</button>
</form>
```

### Triggering Requests

By default, HTTP requests are triggered by the "natural" event of an element:

* `input`, `textarea` & `select` are triggered on the `change` event
* `form` is triggered on the `submit` event
* everything else is triggered by the `click` event

If you want different behavior you can use the [`hx-trigger`](/reference/attributes/hx-trigger)
attribute to specify which event will cause the request.

Here is a `div` that issues an HTTP `POST` to `/mouse_entered` when a mouse enters it:

```html
<div hx-post="/mouse_entered" hx-trigger="mouseenter">
    Mouse Trap
</div>
```

#### Trigger Modifiers

A trigger can also have additional modifiers that change its behavior.

For example, if you want a request to only happen once, you can use the `once` modifier for the trigger:

```html
<div hx-post="/mouse_entered" hx-trigger="mouseenter once">
    Mouse Trap
</div>
```

Other modifiers you can use for triggers are:

| Modifier                   | Description                                                                                                                                                                                                                 |
|----------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `changed`                  | only issue a request if the value of the element has changed                                                                                                                                                                |
| `delay:<time interval>`    | wait the given amount of time (e.g. `1s`) before issuing the request. If the event triggers again, the countdown is reset                                                                                                   |
| `throttle:<time interval>` | issue the first request immediately, then wait the given amount of time (e.g. `1s`) before issuing another. If more events occur during that period, the last one triggers a request at its end                             |
| `from:<selector>`          | listen for the event on a different element. Accepts CSS and [extended selectors](#targeting-with-extended-selectors), and is used for things like keyboard shortcuts. The selector is not re-evaluated if the page changes |
| `target:<selector>`        | only fire if `event.target` matches the given CSS selector. Useful when you listen on a container but only want events from certain children                                                                                |
| `prevent`                  | call `event.preventDefault()`                                                                                                                                                                                               |
| `stop`                     | call `event.stopPropagation()`. `consume` does the same thing                                                                                                                                                               |
| `halt`                     | shorthand for `prevent stop`                                                                                                                                                                                                |
| `capture`                  | listen during the capture phase, from the top down, rather than the bubble phase                                                                                                                                            |
| `passive`                  | tell the browser that the handler will not call `preventDefault()`, so the browser can scroll without waiting for your code                                                                                                 |

Note that a selector with whitespace in `from` or `target` needs parentheses, for example `from:(form input)`.

Multiple triggers can be specified by separating the triggers with a comma.

You can use triggers to implement many common UX patterns, such as [Active Search](/patterns/active-search):

```html
<input type="text"
       name="q"
       placeholder="Search..."
       hx-query="/search"
       hx-trigger="input delay:500ms, keyup[key=='Enter']"
       hx-target="#search-results">
<div id="search-results"></div>
```

This input will issue a `QUERY` request 500 milliseconds after an input event occurs or when the `enter` key is pressed.

The input inserts the resulting HTML into the `div` with the id `search-results`. (Response handling is discussed
[below](#handling-responses).)

#### Trigger Filters

In the example above, you may have noticed the square brackets after the `keyup` event name. This is a trigger filter.

Trigger filters allow you to place a filtering JavaScript expression after the event name that allows you to cancel
the trigger if conditions are not met.  To cancel the trigger, the expression should return `false`.

Here is an example that triggers only on a Shift-Click of the element

```html
<div hx-get="/shift_clicked" hx-trigger="click[shiftKey]">
    Shift Click Me
</div>
```

Properties like `shiftKey` will be resolved against the triggering event first, then against the global scope.

The `this` symbol will be set to the current element.

Note that trigger filters require the use of `eval()`, so they should not be used with a strict
[Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP).

#### Special Events

htmx provides a few special events for use in [`hx-trigger`](/reference/attributes/hx-trigger):

* `load` - fires once when the element is first loaded
* `revealed` - fires once when an element first scrolls into the viewport
* `intersect` - fires when an element enters the viewport. Add the `once` modifier to fire only once. This supports
  three additional options:
    * `root:<selector>` - a CSS selector of the root element for intersection
    * `rootMargin:<margin>` - a margin around the root element
    * `threshold:<float>` - a floating point number between 0.0 and 1.0, indicating what amount of intersection to fire
      the event on

You can also use custom events to trigger requests. Dispatch them with [`htmx.trigger()`](/reference/methods/htmx-trigger)
or from the server with the [`HX-Trigger`](/reference/headers/HX-Trigger) response header.

#### Polling

Polling is a simple technique where a web page periodically issues a request to the server to see if any updates have
occurred. It is a simple mechanism for getting updated content from a server. It does not require a permanent server
connection, and it tolerates network failures well.

In htmx you can implement polling via the `every` syntax in the [`hx-trigger`](/reference/attributes/hx-trigger) attribute:

```html
<div hx-get="/news" hx-trigger="every 2s"></div>
```

This tells htmx:

> Every 2 seconds, issue a GET to /news and load the response into the div

#### Load Polling

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
when you are showing the user a [progress bar](/patterns/progress-bar).

Polling is a simple, useful technique for many problems but isn't appropriate for more interactive situations. For these
situations, consider [streaming HTML](#streaming-html).

### Handling Responses

htmx expects the responses to the HTTP requests it makes to be HTML.  This is in contrast
with front-end frameworks like [React](https://react.dev/), which use JSON-formatted responses instead. 

Typically, htmx responses will be HTML fragments, that is small bits of HTML rather than a full document:

```html
<ul id="contacts">
  <li>Joe Blow</li>
  <li>Jane Doe</li>
</ul>
```

Htmx will then _swap_ this content into the document.  To do this it needs two things:

* A _target_ - where to place the content
* A _swap strategy_ - how to place the content

The two attributes that control this are [`hx-target`](/reference/attributes/hx-target) and [`hx-swap`](/reference/attributes/hx-swap).

#### Targeting Elements

By default, responses target the element that made the request. You can change this by using the 
[`hx-target`](/reference/attributes/hx-target) attribute, which takes a [CSS selector](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_selectors) that specifies
the element to target:

```html
<button hx-get="/info"
        hx-target="#output">
  
</button>
<output id="output">-</output>
```

##### Targeting With Extended Selectors

In addition to plain selectors, htmx has the notion of _extended_ selector syntax.  This syntax increases the expressiveness
of attributes like `hx-target`:

| Selector                  | Matches                                                | Example                            |
|---------------------------|--------------------------------------------------------|------------------------------------|
| `<CSS selector>`          | The same elements `querySelectorAll()` returns.        | `hx-target="#results"`             |
| `this`                    | The element itself (the default target)                | `hx-target="this"`                 |
| `closest <CSS selector>`  | The nearest ancestor that matches.                     | `hx-target="closest .card"`        |
| `find <CSS selector>`     | The first descendant that matches.                     | `hx-target="find .username"`       |
| `next`                    | The next sibling element.                              | `hx-target="next"`                 |
| `next <CSS selector>`     | The first match after this element in document order.  | `hx-target="next .results"`        |
| `previous`                | The previous sibling element.                          | `hx-target="previous"`             |
| `previous <CSS selector>` | The first match before this element in document order. | `hx-target="previous .results"`    |
| `body`                    | The document body.                                     | `hx-target="body"`                 |
| `document`                | The document.                                          | `hx-trigger="click from:document"` |
| `window`                  | The window.                                            | `hx-trigger="scroll from:window"`  |
| `host`                    | The shadow root host. Useful inside a web component.   | `hx-target="host"`                 |

Relative selectors are particularly useful for cleaning up your DOM:

```html
<button hx-get="/info"
        hx-target="next output">
  
</button>
<output>-</output>
```

Here we use the `next` relative selector to target the next `output` element without requiring an ID.  This technique
can be particularly useful when you have repeated content such as a table and want to avoid generating IDs to make
targets work out properly.

#### Configuring Swaps

The [`hx-swap`](/reference/attributes/hx-swap) attribute controls how the content is swapped into (or in place of) 
the target element.

The default swapping mechanism is `innerHTML`: htmx places the response content _inside_ the target element.  It
does not replace it.  This is in line with the way that HTML's native [iframes](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe) work.

Other swapping algorithms available are:

| Name                        | Description                                                                                                                               |
|-----------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| `innerHTML`                 | the default, puts the content inside the target element                                                                                   |
| `outerHTML`                 | replaces the entire target element with the returned content                                                                              |
| `outerSync`                 | morphs the target's attributes, then replaces its children. The target stays in the DOM                                                   |
| `before` (or `beforebegin`) | prepends the content before the target in the target's parent element                                                                     |
| `prepend` (or `afterbegin`) | prepends the content before the first child inside the target                                                                             |
| `append` (or `beforeend`)   | appends the content after the last child inside the target                                                                                |
| `after` (or `afterend`)     | appends the content after the target in the target's parent element                                                                       |
| `delete`                    | deletes the target element regardless of the response                                                                                     |
| `none`                      | does not append content from response ([Out-of-Band Swaps](#out-of-band-swaps) and [Response Headers](#response-headers) will still be processed) |
| `innerMorph`                | morphs the children of the target element, preserving as much of the existing DOM as possible                                             |
| `outerMorph`                | morphs the target element itself, preserving as much of the existing DOM as possible                                                      |
| `textContent`               | Set the target's text content (no HTML parsing)                                                                                           |

As an example, `afterend` inserts the response after the target, rather than inside it. This is how a
"load more" button appends new rows and then replaces itself:

```html
<tr id="row-20">
  <td>Row 20</td>
  <td>
    <button hx-get="/rows?page=2"
            hx-target="closest tr"
            hx-swap="outerHTML">
      Load More
    </button>
  </td>
</tr>
```

##### Preserving Content During Swaps

Some elements must survive a swap untouched, such as a playing video or a third party widget. Add
[`hx-preserve`](/reference/attributes/hx-preserve) to keep an element as it is when an ancestor is replaced:

```html
<div id="results">
  <video id="player" hx-preserve></video>
</div>
```

Preserved elements match by `id`. Give the element a stable `id`, and include the same `id` in the response.

##### Morphing Swaps

In htmx 4 there are now built-in `innerMorph` and `outerMorph` swaps.  Previously, morphing swaps were available
only via the [Idiomorph](https://github.com/bigskysoftware/idiomorph) extension.

Morph swaps merge new content into the existing DOM rather than simply replacing it, attempting to preserve existing
nodes in the DOM. 

Morphing rather than replacing content can do a better job preserving things like focus, video state, etc. by mutating 
existing nodes in-place during a swap operation.

See the [Morphing Guide](/docs/morphing-swaps-guide) for more information on using this technique.

#### Swap Options

The [`hx-swap`](/reference/attributes/hx-swap) attribute also supports options for tuning the swapping behavior of htmx. 

For example, by default htmx will swap in the title of any title tag found in the response content. 

You can turn this behavior off by setting the `ignoreTitle` modifier to true:

```html
<button hx-post="/like" hx-swap="outerHTML ignoreTitle:true">Like</button>
```

The modifiers available on `hx-swap` are:

| Option        | Description                                                                                          |
|---------------|------------------------------------------------------------------------------------------------------|
| `swap`        | A time interval (e.g., 100ms, 1s) to delay the swap operation                                        |
| `settle`      | A time interval to delay the settle phase, which runs after the swap. Defaults to `1ms`              |
| `transition`  | true or false, whether to use the view transition API for this swap                                  |
| `ignoreTitle` | If set to true, any title found in the new content will be ignored and not update the document title |
| `strip`       | true or false, whether to strip the outer element when swapping (unwrap the content)                 |
| `focusScroll` | true or false, whether to scroll focused elements into view                                          |
| `swapEmpty`   | true or false, whether to perform the main swap when the response body is empty (`false` skips it).  |
| `scroll`      | top or bottom, will scroll the target element to its top or bottom                                   |
| `show`        | top or bottom, will scroll the target element's top or bottom into view                              |
| `target`      | A selector to retarget the swap to a different element                                               |

All swap modifiers appear after the swap style.

See the [`hx-swap`](/reference/attributes/hx-swap) documentation for more details on these options.

#### Selecting Response Content

Sometimes you may want to only swap a sub-element within the content returned by the server. A common case is a server 
that can only render full pages, when you only need one part of that page.

The [`hx-select`](/reference/attributes/hx-select) attribute takes a plain CSS selector and extracts only that content for
swapping:

```html
<button hx-get="/info" hx-target="#result" hx-select="#info-detail">
  Get Info
</button>

<div id="result"></div>
```
#### Selecting "Out of Band" Content

If you want to make additional swaps from a larger piece of server content you can use the 
[`hx-select-oob`](/reference/attributes/hx-select-oob) attribute to do so:

```html
<button hx-get="/dashboard"
        hx-target="#main"
        hx-select="#main-content"
        hx-select-oob="#alert,#sidebar">
  Refresh
</button>
```

Here, in addition to filtering the main swap down to the element with the id `main`, htmx finds elements with the ids 
`alert` and `sidebar` in the response content and swaps each one over the element with the same `id` in the current page.
## Forms

Working with forms and inputs in htmx is natural if you are used to regular HTML.

### Input Values

By default, an element that causes a request will include its `value` if it has one. 

If the element is a `form` it will include the values of all `inputs` within it.

If an element issues a request that sends a body (that is, anything except `GET` and `DELETE`), the values of all
the `inputs` of the associated form will be included (typically this is the nearest enclosing form, but could be different if, for example,
the [`form` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/form) is used).

```html
<form>
  <input name="email" value="joe@example.com">
  <input name="plan" value="pro">
  <button hx-post="/signup">Sign Up</button>
</form>
```

The button issues a `POST` to `/signup` with `email=joe@example.com&plan=pro`.

#### Including Other Values

If you want to include the values of other elements in a request, you can use the [`hx-include`](/reference/attributes/hx-include) attribute.

The `hx-include` attribute takes an [extended CSS selector](#targeting-with-extended-selectors) and will include the values of all matching elements.

To send computed values (rather than values held in inputs) use the [`hx-vals`](/reference/attributes/hx-vals) attribute.

```html
<button hx-post="/save" hx-vals='{"draft": true}'>Save Draft</button>
```

You can use a `js:` prefix to compute the value dynamically when the request is made:

```html
<button hx-post="/save" hx-vals='js:{scrollY: window.scrollY}'>Save</button>
```

#### File Uploads

By default, htmx uses the standard [`application/x-www-form-urlencoded`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/form#enctype) format for submitting values to the server.

If you wish to upload files via an htmx request you can set the [`hx-encoding`](/reference/attributes/hx-encoding) attribute to
`multipart/form-data`.

This will use a `FormData` object to submit the request, which will properly include the file in the request.

Note that, depending on what you are using on the server side to process requests, you may have to handle requests with 
this body type very differently.

See [file upload pattern](/patterns/file-upload) for a complete example.

### Form Validation

htmx integrates with the [HTML5 Validation API](https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation)
and will not issue a request for a form if a validatable input is invalid.

Non-form elements do not validate before they make requests by default, but you can enable validation by setting
the [`hx-validate`](/reference/attributes/hx-validate) attribute on them to "true".
## Attribute Inheritance

<details class="warning">
<summary>Changes in htmx 4.0</summary>

In htmx 2.0 attribute inheritance was implicit by default: elements inherited the attributes on their parents, such
as [`hx-target`](/reference/attributes/hx-target). In htmx 4.0 attribute inheritance is now explicit by default, using the `:inherited` modifier.

</details>

Attribute inheritance allows you to "hoist" attributes up the DOM, in order to avoid code duplication.

Consider the following HTML:

```html
<button hx-delete="/account" hx-confirm="Are you sure?">
    Delete My Account
</button>
<button hx-put="/account" hx-confirm="Are you sure?">
    Update My Account
</button>
```

Here we have a duplicate [`hx-confirm`](/reference/attributes/hx-confirm) attribute.

We can hoist this attribute to a parent element using the `:inherited` modifier on the attribute:

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

### Adding To An Inherited Value

By default, an attribute on a child _overrides_ an inherited value for that attribute. You can use the `:append` modifier to append
the child value to the inherited value instead:

```html
<div hx-vals:inherited="tenant:acme">
    ...
    <button hx-post="/save" hx-vals:append="source:save-btn">Save</button>
</div>
```

If no ancestor provides a value, the append value is used on its own.

You can combine `:inherited` and `:append` on a element if you want child elements to inherit the new value.
## Multi-Target Updates

htmx requests normally update one target element. Sometimes you need to update multiple parts of the page at once.

For example, after submitting a form, you might want to update both the form itself and a notification counter 
elsewhere on the page.

htmx provides two mechanisms to update multiple targets from a single response:

* Out-of-Band Swaps
* Partial Tags (new in htmx 4)

### Out-of-Band Swaps

Out-of-Band (OOB) swaps allow you to swap a single element from the position that it is located in a response to 
another position in the DOM, based on the elements id.

To do this, you can add [`hx-swap-oob`](/reference/attributes/hx-swap-oob)`="true"` to an element in your response. 

When you do this, htmx will find the element already in the DOM with the same `id` in your page and swap it.

So, if this content was returned by the server in response to submitting a form:

```html
<div id="message" hx-swap-oob="true">
    Form submitted successfully!
</div>

<form id="my-form">
    <!-- Updated form content -->
</form>
```

Then the `form` element will be swapped into the DOM the normal way, according to the `hx-target` and `hx-swap` 
attributes, but the div will be swaped "out of band" and replace the element in the DOM with the id `message`, elsewhere
in the page.

#### Customizing OOB Swaps

You can control the swap style of an OOB swap by setting the value of `hx-swap-oob` to a valid swap strategy:

```html
<div id="notifications" hx-swap-oob="beforeend">
    <span>New notification</span>
</div>
```

This appends the content to `div#notifications` instead of replacing it.

#### Pure OOB Responses

htmx removes the OOB elements from the response before the main swap. If nothing is left, the main swap is skipped
and the main target keeps its content.

```html
<!-- Server returns only OOB content: the main target is left untouched -->
<div id="notifications" hx-swap-oob="true">
    <span class="badge">5</span>
</div>
```

Two settings change this. Set
[`htmx.config.allowEmptySwapAfterOOB`](/reference/config/htmx-config-allowEmptySwapAfterOOB) to `true` to run the
main swap anyway, everywhere:

```html
<meta name="htmx-config" content="allowEmptySwapAfterOOB:true">
```

Or set the `swapEmpty` modifier on one element, which wins over the config:

```html
<button hx-post="/submit" hx-swap="outerHTML swapEmpty:true">Submit</button>
```

Note that `<hx-partial>` elements always skip an empty main swap, and neither setting changes that. See
[Pure `<hx-partial>` Responses](#pure-hx-partial-responses).

### Partials (`<hx-partial>`)

The `hx-partial` tag is new in htmx 4, and it addresses issues that have come up in our experience with OOB swaps 
over the years.

To use the `hx-partial` tag, simply wrap content in it.

You can then use the normal htmx attributes to specify exactly how to swap that content 
into the DOM:

```html
<hx-partial hx-target="#messages" hx-swap="beforeend">
    <div class="message">New message content</div>
</hx-partial>

<hx-partial hx-target="#notifications">
    <span class="badge">5</span>
</hx-partial>

<form id="my-form">
    <!-- Main form content -->
</form>
```

`<hx-partial>` tags can have the following attributes:

* [`hx-target`](/reference/attributes/hx-target) - CSS selector for where to place content
* `id` - Shorthand alternative to `hx-target`. Targets the element with that ID (e.g. `<hx-partial id="messages">` targets `#messages`)
* [`hx-swap`](/reference/attributes/hx-swap) - Optional. Swap style (defaults to `innerHTML`)

Some server-side template languages remove tags they do not know. For these, use the equivalent `<template>` form:

```html
<template hx type="partial" hx-target="#messages" hx-swap="beforeend">
    <div class="message">New message content</div>
</template>
```

#### Pure `<hx-partial>` Responses

When a response contains only `<hx-partial>` elements and no main content, htmx does **not** perform the main swap: it
assumes you only want to do partial replacement with the response.

```html
<!-- Server returns only partials: the main target is left untouched -->
<hx-partial hx-target="#notifications">
    <span class="badge">5</span>
</hx-partial>
<hx-partial hx-target="#messages" hx-swap="beforeend">
    <div class="message">New message</div>
</hx-partial>
```

If you want the main target cleared, add `swapEmpty:true` to `hx-swap` on the triggering element:

```html
<button hx-post="/submit" hx-swap="outerHTML swapEmpty:true">Submit</button>
```

### OOB vs `<hx-partial>`

OOB swaps were designed for simple one-for-one replacements in the DOM.  They make sense when you have one element
that you want to replace directly with another single element.

Partials are more general but correspondingly more complicated.  They make sense when you want to replace arbitrary
content (not just content keyed by id) with any form of content.  Because the replacement content is _within_ the
`<hx-partial>` tag, it can be arbitrarily complex (e.g. multiple top level elements)

Both approaches can be used within a single response if desired.
## Synchronizing Requests

Often you want to coordinate the requests between two elements. For example, you may want a request from one element
to supersede the request of another element, or to wait until the other element's request has finished.

htmx offers a [`hx-sync`](/reference/attributes/hx-sync) attribute to help you accomplish this.

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

Using `hx-sync="closest form"` on the input and `hx-sync="this:replace"` on the form will watch for requests from the
form
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

### Aborting A Request

htmx also supports a programmatic way to cancel requests: you can send the [`htmx:abort`](/reference/events/htmx-abort) event to an element to
cancel any in-flight requests:

```html
<button id="request-button" hx-post="/example">
    Issue Request
</button>
<button onclick="htmx.trigger('#request-button', 'htmx:abort')">
    Cancel Request
</button>
```

More examples and details can be found on the [`hx-sync` attribute page.](/reference/attributes/hx-sync)
## Request Indicators

When an HTTP request is issued by htmx it is often good to let the user know that something is happening. 

You can accomplish this in htmx by using the special `htmx-indicator` class.

The `htmx-indicator` class is defined by htmx such that the opacity of any element with this class is `0` by default, 
making it invisible but present in the DOM.

When htmx issues a request, it will add a `htmx-request` class onto an element (either the requesting element or
another element, if specified). 

The `htmx-request` class will cause a child element with the `htmx-indicator` class on it to transition to an opacity of 
`1` which shows the indicator.

```html
<button hx-get="/click">
    Click Me!
    <img class="htmx-indicator" src="/spinner.gif" alt="Loading...">
</button>
```

When this button makes a request the `htmx-request` class will be added to it.

This will reveal the spinner GIF element inside of it.

### Custom Request Indicator CSS

The `htmx-indicator` class uses opacity to hide and show the progress indicator but if you would prefer another
mechanism you can create your own CSS transition like so:

```css
.htmx-indicator {
    display: none;
}

.htmx-request .htmx-indicator {
    display: inline;
}

.htmx-request.htmx-indicator {
    display: inline;
}
```

### Targeting A Specific Indicator

If you want the `htmx-request` class added to a different element, you can use the 
[`hx-indicator`](/reference/attributes/hx-indicator) attribute with an extended CSS selector to do so:

```html
<div>
    <button hx-get="/click" hx-indicator="#indicator">
        Click Me!
    </button>
    <img id="indicator" class="htmx-indicator" src="/spinner.gif" alt="Loading..."/>
</div>
```

### Disabling Elements

Another common need is to disable elements while a request is in flight to prevent the user from interacting with them.

You can add the [`disabled` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/disabled) to
elements for the duration of a request by using the [`hx-disable`](/reference/attributes/hx-disable) attribute:

```html
<button hx-post="/submit" hx-disable="this">Submit</button>
```

The value is an [extended selector](#targeting-with-extended-selectors), so you can disable other elements too. Here
the whole fieldset is disabled while the request is in flight:

```html
<fieldset>
  <input name="email">
  <button hx-post="/submit" hx-disable="closest fieldset">Submit</button>
</fieldset>
```
## User Confirmations

Often you will want to confirm an action before issuing a request. htmx supports the [`hx-confirm`](/reference/attributes/hx-confirm)
attribute, which allows you to confirm an action using a simple javascript dialog:

```html
<button hx-delete="/account" hx-confirm="Are you sure you wish to delete your account?">
    Delete My Account
</button>
```

`hx-confirm` may also contain JavaScript by using the `js:` or `javascript:` prefix. In this case
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
## Swapping Animations

There are two different ways to animate elements when htmx swaps a response into the DOM:

* CSS Transitions
* View Transitions

Note that animations, while visually interesting, should never detract from usability and should generally be less than 
100 milliseconds in duration.

### CSS Transitions

[CSS Transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions) are a well
established mechanism for animating content in the DOM.

htmx will ensure that any content with a stable ID will have CSS transitions applied when a swap occurs, regardless
of what swapping approach you use.

So, if this original content:

```html
<div id="div1">Original Content</div>
```

is replaced with this new content:

```html
<div id="div1" class="red">New Content</div>
```

You can write a CSS transition between the two like so:

```css
.red {
    color: red;
    transition: all ease-in 100ms;
}
```

### View Transitions

A newer animation technique is the [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API),
which gives developers a way to create a structured animated transition between different DOM states.

View Transitions are much more sophisticated (and complicated!) than CSS transitions but give you much more control
over the animation.

htmx supports view transitions via the following:

- Setting `htmx.config.transitions` to `true` globally will enable view transitions for all swaps
- Per-swap via the `hx-swap` attribute `transition` option: `hx-swap="outerHTML transition:true"`
- For boosted elements via the transition option: `hx-boost="transition:true"`

Note that the default view transition is a [250 millisecond cross-fade](https://drafts.csswg.org/css-view-transitions-1/#ua-styles)
which, in our opinion, is a very bad default for swapping, so you will want to override this if you use view transitions
with htmx.
## Link & Form Boosting

In htmx you can "boos" regular HTML anchors and forms using the [`hx-boost`](/reference/attributes/hx-boost) attribute. 

This attribute will convert anchor tags and forms into `fecth()`-based requests that, by default, target the body of 
the page.

Here is an example:

```html
<div hx-boost:inherited="true">
    <a href="/blog">Blog</a>
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
</div>
```

The anchor tags in this `div` will issue an AJAX `GET` request to `/blog` and swap the response into the `body` tag.

Note that `hx-boost` is using the `inherited` modifier here.

### Advantages & Disadvantages of Boosting

Boosting is a feature that has been part of htmx since it was called [intercooler](https://intercoolerjs.org).  In
the olden days there were big advantages to it:

* It eliminated the [Flash of Unstyled Content (FOUC)](https://en.wikipedia.org/wiki/Flash_of_unstyled_content)
* It enabled CSS transitions between pages
* It removed the need to reparse CSS/JS between pages
* It allowed the preservation of elements with the `hx-preserve` 

Over time, browsers have gotten better at inter-page transitions, eliminating the FOUC via [paint holding](https://developer.chrome.com/blog/paint-holding)
and making View Transitions work for full-page navigation.

This has reduced the advantages of boosting.  There is still a performance benefit to boosting, and it is still the
only way to use CSS transitions & element preservation on navigation, however.

A disadvantage that people sometimes run into (which is one of the reasons it is faster) is that boosted elements
to not reset the JavaScript environment.  With normal navigation, the browser completely resets the JavaScript environment.

When boosting you have to be careful to not redefine things on accident, which can lead to JavaScript errors.

Generally, boosting is controversial in the htmx community.  Some people [love it](https://dev.to/yawaramin/why-hx-boost-is-actually-the-most-important-feature-of-htmx-3nc0), some people discourage it.

For what it's worth, we use boosting in this documentation website.

### Boosting & Progressive Enhancement

A nice feature of `hx-boost` is that it degrades gracefully if JavaScript is not enabled: the links and forms continue
to work, they simply don't use ajax requests.

This is known as
[Progressive Enhancement](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement), and it allows
a wider audience to use your site's functionality.

Other htmx patterns can be adapted to achieve progressive enhancement as well, but they will require more thought.

Consider the [active search](/patterns/active-search) example. As it is written, it will not degrade gracefully:
someone who does not have javascript enabled will not be able to use this feature. This is done for simplicity's sake,
to keep the example as brief as possible.

However, you could wrap the htmx-enhanced input in a form element:

```html
<form action="/search" method="POST">
    <input class="form-control" type="search"
           name="search" placeholder="Begin typing to search users..."
           hx-query="/search"
           hx-trigger="keyup changed delay:500ms, search"
           hx-target="#search-results"
           hx-indicator=".htmx-indicator">
</form>
```

With this in place, javascript-enabled clients would still get the nice active-search UX, but non-javascript enabled
clients would be able to hit the enter key and still search. 

Even better, you could add a "Search" button as well. You would then need to update the form with an 
[`hx-post`](/reference/attributes/hx-post) that mirrored the `action` attribute, or perhaps use `hx-boost`
on it.

You would need to check on the server side for the [`HX-Request`](/reference/headers/HX-Request) header to differentiate between an htmx-driven and a
regular request, to determine exactly what to render to the client.

Other patterns can be adapted similarly to achieve the progressive enhancement needs of your application.

As you can see, this requires more thought and more work. It also rules some functionality entirely out of bounds.
These tradeoffs must be made by you, the developer, with respect to your projects goals and audience.

#### Accessibility

[Accessibility](https://developer.mozilla.org/en-US/docs/Learn/Accessibility/What_is_accessibility) is a concept
closely related to progressive enhancement. Using progressive enhancement techniques such as `hx-boost` will make your
htmx application more accessible to a wide array of users.

htmx-based applications are very similar to normal, non-`fetch()` driven web applications because htmx is HTML-oriented.

As such, the normal HTML accessibility recommendations apply. For example:

* Use semantic HTML as much as possible (i.e. the right tags for the right things)
* Ensure focus state is clearly visible
* Associate text labels with all form fields
* Maximize the readability of your application with appropriate fonts, contrast, etc.
## Browser History Support

<details class="warning">
<summary>Changes in htmx 4.0</summary>

History support in htmx 4.0 has changed significantly. We no longer snapshot the DOM and keep a copy in sessionStorage.

Instead, we issue a full page request every time someone navigates to a history element. This is much less error-prone
and foolproof. It also eliminates security concerns regarding keeping history state in accessible storage

This change makes history restoration much more reliable and reduces client-side complexity.

</details>

Htmx provides a simple mechanism for interacting with
the [browser history API](https://developer.mozilla.org/en-US/docs/Web/API/History_API):

If you want a given element to push its request URL into the browser navigation bar and add the current state of the
page
to the browser's history, include the [`hx-push-url`](/reference/attributes/hx-push-url) attribute:

```html
<a hx-get="/blog" hx-push-url="true">Blog</a>
```

When a user clicks on this link, htmx will push a new location onto the history stack.

When a user hits the back button, htmx will retrieve the old content from the original URL and swap it back into the
body,
simulating "going back" to the previous state.

**NOTE:** If you push a URL into the history, you **must** be able to navigate to that URL and get a full page back!
A user could copy and paste the URL into an email, or new tab.

### Replacing The Current URL

If you want to chante the URL without updating history use the [`hx-replace-url`](/reference/attributes/hx-replace-url) 
attribute instead:

```html
<a hx-get="/account" hx-replace-url="true">My Account</a>
```

### History Response Headers

The server can override either attribute for a single response with the
[`HX-Push-Url`](/reference/headers/HX-Push-Url) and [`HX-Replace-Url`](/reference/headers/HX-Replace-Url) response
headers.

### Restoring Only Part Of The Page

By default htmx replaces the whole `body` when a user navigates back or forward.

If you wish for history to be restored only within a specific element you can use the
[`hx-history-elt`](/reference/attributes/hx-history-elt) attribute:

```html
<body>
    <nav><!-- never replaced --></nav>

    <main hx-history-elt>
        <h1>Page 1</h1>
    </main>
</body>
```

On a history navigation htmx requests the URL, selects the `hx-history-elt` element out of the response, and swaps
it over the current one, leaving the rest of the page untouched.

### Configuring History

The [`htmx.config.history`](/reference/config/htmx-config-history) setting allow you to specify how history works:

| Value      | Behavior                                                          |
|------------|-------------------------------------------------------------------|
| `true`     | the default. htmx requests the URL and swaps the response         |
| `"reload"` | htmx does a full page reload instead of a request                 |
| `false`    | htmx does not handle history at all. The browser behaves normally |

If you want the htmx 2.x behavior of restoring history from a local snapshot instead of a full server request, use the
[`hx-history-cache`](/extensions/hx-history-cache) extension.
## Advanced Request & Response Techniques

The out-of-the-box request & response behavior of htmx is often sufficient for people, but some times you may
want to do more advanced HTTP handling.  This section documents how to do so.

### HTTP Response Code Handling

By default, htmx will swap all responses it receives into the DOM except for responses with the [HTTP response codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status)
`204` or `304`.

If you respond with a `204 - No Content` response code, and htmx will ignore the content of the response and not swap
anything, even if the response has a body.

If the response code is `400` or `500`, htmx will trigger an [`htmx:response:error`](/reference/events/htmx-response-error) event.

#### Configuring Response Code Handling

You can customize this behavior using the [`hx-status`](/reference/attributes/hx-status) attribute, which takes
a response code pattern after a colon:

htmx tests the exact code first, then the two-digit wildcard (e.g. `50x`), then the one-digit wildcard (e.g. `5xx`).

Here is an example:

```html
<form hx-post="/submit"
      hx-target="#result"
      hx-status:422="target:#validation-errors"
      hx-status:5xx="target:#server-error"
      hx-status:503="swap:none">
    <input name="email">
    <button type="submit">Submit</button>
</form>

<div id="result"></div>
<div id="validation-errors"></div>
<div id="server-error"></div>
```

This tells htmx:

- Successful responses (2xx) swap into `#result` (default behavior)
- `422` responses swap into `#validation-errors`
- `503` responses do not swap at all
- `5xx` all other 500 responses swap into `#server-error`

You can also use the [`htmx.config.noSwap`](/reference/config/htmx-config-noSwap) configuration for global configuration
of response code handling.  

For example, to revert to the htmx 2.0 behavior of not swapping on `4xx` and `5xx` response codes you can add the
following configuration:

```html
<meta name="htmx-config" content='{"noSwap": [204, 304, "4xx", "5xx"]}'>
```
### Request Headers

htmx includes headers in the requests it makes:

| Header                                                  | Description                                                                                     |
|---------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| [`HX-Boosted`](/reference/headers/HX-Boosted)           | indicates that the request is via an element using [`hx-boost`](/reference/attributes/hx-boost) |
| [`HX-Current-URL`](/reference/headers/HX-Current-URL)   | the current URL of the browser                                                                  |
| [`HX-Request`](/reference/headers/HX-Request)           | always "true"                                                                                   |
| [`HX-Request-Type`](/reference/headers/HX-Request-Type) | `"partial"` for targeted swaps, `"full"` for body-level or `hx-select` requests                 |
| [`HX-Source`](/reference/headers/HX-Source)             | the source element in `tag#id` format (e.g. `button#submit`)                                    |
| [`HX-Target`](/reference/headers/HX-Target)             | the target element in `tag#id` format (e.g. `div#results`)                                      |

htmx also sends [`HX-History-Restore-Request`](/reference/headers/HX-History-Restore-Request) when it refetches a page
after a miss in the history cache. See [Browser History Support](#browser-history-support) for more info.

#### Adding Your Own Headers

To add headers to a request, use the [`hx-headers`](/reference/attributes/hx-headers) attribute.

```html
<div hx-get="/data" hx-headers='{"X-Widget-Id": "42"}'>Get Data</div>
```

You can use a `js:` prefix to compute the headers when the request is made.

```html
<div hx-get="/data" hx-headers='js:{"X-Scroll": window.scrollY}'>Get Data</div>
```

Here is an example that sends a [CSRF](https://en.wikipedia.org/wiki/Cross-site_request_forgery) token on every htmx request.

```html
<body hx-headers:inherited='js:{"X-CSRF-Token": getCsrfToken()}'>
  ...
</body>
```

If you want to set headers programmatically, use the [`htmx:config:request`](/reference/events/htmx-config-request) event.

### Response Headers

htmx supports the following response headers:

| Header                                           | Description                                                                                                                                                                        |
|--------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [`HX-Location`](/reference/headers/HX-Location)            | allows you to do a client-side redirect that does not do a full page reload                                                                                                        |
| [`HX-Push-Url`](/reference/headers/HX-Push-Url)            | pushes a new url into the history stack                                                                                                                                            |
| [`HX-Redirect`](/reference/headers/HX-Redirect)            | can be used to do a client-side redirect to a new location                                                                                                                         |
| [`HX-Refresh`](/reference/headers/HX-Refresh)                                     | if set to "true" the client-side will do a full refresh of the page                                                                                                                |
| [`HX-Replace-Url`](/reference/headers/HX-Replace-Url)      | replaces the current URL in the location bar                                                                                                                                       |
| [`HX-Reswap`](/reference/headers/HX-Reswap)                                      | allows you to specify how the response will be swapped. See [`hx-swap`](/reference/attributes/hx-swap) for possible values                                                                     |
| [`HX-Retarget`](/reference/headers/HX-Retarget)                                    | a CSS selector that updates the target of the content update to a different element on the page                                                                                    |
| [`HX-Reselect`](/reference/headers/HX-Reselect)                                    | a CSS selector that allows you to choose which part of the response is used to be swapped in. Overrides an existing [`hx-select`](/reference/attributes/hx-select) on the triggering element |
| [`HX-Trigger`](/reference/headers/HX-Trigger)              | allows you to trigger client-side events                                                                                                                                           |

The [`HX-Trigger` Response Headers](/reference/headers/HX-Trigger) can be particularly useful, allowing you to trigger
client-side JavaScript code from the server.

### Per-Request Configuration With `hx-config`

The [`hx-config`](/reference/attributes/hx-config) attribute allows you to control fine-grained details of the 
request issued by htmx:

```html
<button hx-post="/api/users" hx-config="timeout:5s">Create User</button>
```

Most of `hx-config` options map directly onto the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit)
request options:

| Option        | Description                                                                                                                                                                            |
|---------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `timeout`     | aborts the request after this time. Accepts `500ms`, `5s`, `2m`, or a number of milliseconds. Defaults to [`htmx.config.defaultTimeout`](/reference/config/htmx-config-defaultTimeout) |
| `credentials` | `"omit"`, `"same-origin"` or `"include"`. Defaults to `"same-origin"`                                                                                                                  |
| `cache`       | a [fetch cache mode](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit#cache), such as `"no-cache"` or `"reload"`                                                            |
| `redirect`    | `"follow"`, `"error"` or `"manual"`                                                                                                                                                    |
| `referrer`    | a referrer URL, or `"no-referrer"`                                                                                                                                                     |
| `integrity`   | a [subresource integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) value                                                                            |
| `validate`    | `true` to validate the form before htmx sends the request. See [Form Validation](#form-validation)                                                                                     |


#### The `mode` Option Is _Not_ Available

`hx-config` does not allow the `mode` option for security reasons. 

htmx always resets `mode` to `htmx.config.mode`, which defaults to `"same-origin"`.

This stops an attacker who can inject an attribute from widening the scope of a request. 

See [Security Considerations](#security-considerations) for more info.
## Streaming HTML

For more interactive scenarios, where a server sends multiple updates to the DOM from a single request, htmx
provides various _streaming HTML_ extensions.

The streaming extensions provided by htmx use:

* [Server Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) (SSE)
* [Web Sockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
* Multi-Part Responses

### SSE

Server-Sent Events let one HTTP response stream multiple _events_ to the browser over a single connection.

The [`hx-sse`](/extensions/hx-sse) extension supports swapping content via these events.

Consider the following button:

```html
<button hx-post="/generate"
        hx-target="next output"
        hx-swap="append">
  Generate
</button>

<output></output>
```

With the htmx SSE extension installed, as unnamed events are received from the server the content in those events
will be appended to the output tag.  This allows for a natural, streaming mechanism for inserting content as it
becomes available into an element.

For more details, see the [`hx-sse`](/extensions/hx-sse) extension documentation.

### Web Sockets

In contrast with SSE, Web Sockets hold a connection open in both directions, so the server and the browser can both send
messages at any time.

The [`hx-ws`](/extensions/hx-ws) extension supports swapping content from these messages as well as sending messages
to the server from DOM elements.

Consider the following chat window:

```html
<div hx-ws:connect="/chat"
     hx-target="#messages"
     hx-swap="append">

  <div id="messages"></div>

  <form hx-ws:send>
    <input name="message">
    <button>Send</button>
  </form>

</div>
```

With the htmx Web Socket extension installed, the connection opens on load and every message the server sends is
appended to `#messages`.  The form sends its values back over the same connection as JSON, so no new request is
made.

For more details, see the [`hx-ws`](/extensions/hx-ws) extension documentation.

### Multi-Part

A [`multipart/mixed`](https://www.rfc-editor.org/rfc/rfc2046#section-5.1.3) response carries many _parts_ in one
body, with a delimiter chosen by the server:

```http
HTTP/1.1 200 OK
Content-Type: multipart/mixed; boundary=...

Hello
--...
Content-Type: text/html

, world!
```


The [`hx-multipart`](/extensions/hx-multipart) extension supports swapping the content of these parts into the DOM
as they arrive.

Consider the generate button we looked at in the SSE example:

```html
<button hx-post="/generate"
        hx-target="next output"
        hx-swap="append">
  Generate
</button>

<output></output>
```

With the htmx multi-part extension installed, if the server responds with a request of type `multipart/mixed;`, as parts 
are received from the server the content in those parts will be appended to the output tag.

For more details, see the [`hx-multipart`](/extensions/hx-multipart) extension documentation.

### Picking A Streaming Technology

Each streaming technology has strengths and weaknesses.

SSE is widely supported and is our default recommendation for streaming responses.

Web Sockets are the most complicated but support bi-directional communication.

Multi-part, despite being very old, is less widely supported by server side frameworks.  However, we feel it more 
naturally follows HTTP semantics.  We recommend it if you are a purist and are willing to do a bit of work on the
server side to make this style of response easy to work with.
## Client-Side Scripting

htmx encourages a hypermedia-based approach to building web applications, with requests to servers updating content
with response HTML.

However, for modern web applications it is often desirable to add client-side scripting to your website in order to
improve interactivity.

htmx offers various tools to help make this easier:

* A rich set of events that it triggers
* A scripting API against the `htmx` object
* `hx-on` attributes for basic inline scripting
* Support for Alpine.js for more advanced inline scripting
* The `hx-live` extension as a (new in htmx 4) DOM-oriented alternative to Alpine.js

### Events

Htmx has an [extensive set of events](/reference/events) that you can listen for to log or modify behaviors with:

```javascript
document.body.addEventListener('htmx:after:init', function (evt) {
    setUpElement(evt.detail.elt);
});
```

Here, we are using vanilla JavaScript to listen for an element being initialized by htmx and applying some additional
logic to it with our own custom `setUpElement()` function.

See [htmx Events Guide](/docs/htmx-events-guide) for more details on using htmx events effectively.

### The `htmx` Object API

The global `htmx` JavaScript object has the following methods available on it:

| Method                                                                          | Description                                                              |
|---------------------------------------------------------------------------------|--------------------------------------------------------------------------|
| [`htmx.ajax()`](/reference/methods/htmx-ajax)                                   | issues an htmx request from JavaScript                                   |
| [`htmx.find()`](/reference/methods/htmx-find)                                   | finds the first element that matches a CSS selector                      |
| [`htmx.findAll()`](/reference/methods/htmx-findAll)                             | finds all elements that match a CSS selector                             |
| [`htmx.process()`](/reference/methods/htmx-process)                             | initializes htmx attributes on an element and its descendants            |
| [`htmx.swap()`](/reference/methods/htmx-swap)                                   | runs the swap lifecycle without a request                                |
| [`htmx.initialize()`](/reference/methods/htmx-initialize)                       | initializes htmx manually, if the automatic startup is too early         |
| [`htmx.on()`](/reference/methods/htmx-on)                                       | adds an event listener                                                   |
| [`htmx.onLoad()`](/reference/methods/htmx-onLoad)                               | runs a callback when htmx processes new content                          |
| [`htmx.trigger()`](/reference/methods/htmx-trigger)                             | dispatches a custom event on an element                                  |
| [`htmx.registerExtension()`](/reference/methods/htmx-registerExtension)         | registers an htmx extension                                              |
| [`htmx.parseInterval()`](/reference/methods/htmx-parseInterval)                 | converts a time string such as `5s` to milliseconds                      |
| [`htmx.timeout()`](/reference/methods/htmx-timeout)                             | creates a promise that resolves after a time interval                    |

The `htmx` object also holds [`htmx.config`](/reference/config/htmx-config), which sets the global configuration.

See the [methods reference](/reference/methods) for the signature and examples of each method.

### The `hx-on:*` Attributes

You can embed JavaScript event handlers directly on elements by using the `hx-on:<event name>` syntax:

```html
<button hx-on:click="alert('You clicked me!'); await timeout(1000); console.log('done')">
    Click Me!
</button>
```

`hx-on` attributes have the following top level symbols available:

| Symbol        | Description                                                                                                     |
|---------------|-----------------------------------------------------------------------------------------------------------------|
| `this`        | the element that holds the `hx-on` attribute                                                                    |
| `event`       | the event that triggered the handler                                                                            |
| event details | every property of `event.detail` is in scope directly. For htmx events this includes `ctx`, the request context |
| htmx methods  | every method of the [`htmx` object](#the-htmx-object-api) is in scope without the `htmx.` prefix (e.g. `find()` |

Note that this feature requires `eval()` and thus may not work if you have a strict CSP.

### Alpine.js Support

[Alpine.js](https://alpinejs.dev/) is a very popular JavaScript library that adds significant expressivity to inline
scripting:

* Event handlers with [`x-on`](https://alpinejs.dev/directives/on)
* Reactive state with [`x-data`](https://alpinejs.dev/directives/data)
* Conditional content with [`x-show`](https://alpinejs.dev/directives/show) and [`x-if`](https://alpinejs.dev/directives/if)
* Two-way form binding with [`x-model`](https://alpinejs.dev/directives/model)
* Helpers such as `$refs`, `$store`, `$dispatch` and `$watch`

Alpine is a very popular library among htmx developers.  Out of the box the two technologies play together very well, but there
is an [`hx-alpine-compat`](/extensions/hx-alpine-compat) extension that smooths over some corner cases when integrating the two libraries.

### `hx-live`

`hx-live`, new in htmx 4, is our own take on DOM-oriented, reactive scripting for the web.  It is inspired by
Alpine, [jQuery](https://jquery.org) and [hyperscript](https://hyperscript.org).

`hx-live` provides a jQuery-like `q()` selector function that allows you to select one or many elements and update/mutate 
them as a group.  This function is made available at the top level in `hx-on:` attributes, and supports relative
selectors.

```html
<input placeholder="Enter your name" type="text">
<button hx-on:click="this.text = 'Hello, ' + q('previous input').value"></button>
```

When you click this button it will update its text based on the value of the preceding input.

hx-live also supports DOM-based reactivity:

```html
<input placeholder="Enter your name" type="text">
<p :text="'Hello, ' + q('previous input').value"></p>
```

In this case, the paragraph will update as you enter text into the input.

For more details, see the [`hx-live` Programmers Guide](/docs/hx-live-guide) and the [`hx-live` extension reference](/extensions/hx-live).

### Other 3rd Party JavaScript

htmx is designed to integrate well with most third party JavaScript libraries.

If the library fires events on the DOM, you can use those events to trigger requests from htmx.

A good example of this is the [SortableJS demo](/patterns/drag-to-reorder):

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

### Hyperscript

The experimental [hyperscript](https://hyperscript.org) scripting language is a sister project of htmx and integrates
seamlessly with it.

Definitely not for everyone, but a pretty fun little language:

```html
  <button _="on click add .highlight to <p/> in me">
```
## Web Components

Note that htmx doesn't automatically initialize content inside web components: you must manually initialize it by 
calling [`htmx.process`](/reference/methods/htmx-process) in the `connectedCallback()` method:

```javascript
customElements.define('my-counter', class extends HTMLElement {
    connectedCallback() {
        const shadow = this.attachShadow({mode: 'open'})
        shadow.innerHTML = `
          <button hx-post="/increment" hx-target="#count">+1</button>
          <div id="count">0</div>
        `
        htmx.process(shadow) // Initialize htmx for this shadow DOM
    }
})

```

Note that this is true regardless of whether or not the component uses a Shadow DOM.

### Targeting Elements Outside Shadow DOM

If you are using the Shadow DOM in a component, selectors like [`hx-target`](/reference/attributes/hx-target) will
only see elements inside that same Shadow DOM.

To break out of a components Shadow DOM and target the Web Component itself you can use `host` as the target:

```html
<!-- Inside a Web Component -->
<button hx-get="..." hx-target="host">
  ...
</button>
```

To break out of the shadow DOM and target an element in the broader DOM, you can use the `global` keyword,
followed by a space and the selector:

```html
<!-- Inside a Web Component -->
<button hx-get="..." hx-target="global #target">
  ...
</button>
```
## Extensions

htmx supports extensions to augment its core hypermedia infrastructure.

The following extensions ship with htmx:

| Extension                                                  | Category       | Description                                         |
|------------------------------------------------------------|----------------|-----------------------------------------------------|
| [`hx-multipart`](/extensions/hx-multipart)                 | Streaming HTML | Stream HTML with `multipart/mixed`                  |
| [`hx-sse`](/extensions/hx-sse)                             | Streaming HTML | Stream HTML with `text/event-stream` (SSE)          |
| [`hx-ws`](/extensions/hx-ws)                               | Streaming HTML | Stream HTML and send data over WebSockets           |
| [`hx-browser-indicator`](/extensions/hx-browser-indicator) | UX             | Show tab's spinner with `hx-browser-indicator`      |
| [`hx-live`](/extensions/hx-live)                           | UX             | Our own DOM-based reactive scripting solution       |
| [`hx-pending`](/extensions/hx-pending)                     | UX             | Show custom content during requests                 |
| [`hx-prompt`](/extensions/hx-prompt)                       | UX             | Prompt before requests with `hx-prompt='Reason?'`   |
| [`hx-preload`](/extensions/hx-preload)                     | Performance    | Preload on hover with `hx-preload='mouseover'`      |
| [`hx-history-cache`](/extensions/hx-history-cache)         | Performance    | Restore back/forward pages from `sessionStorage`    |
| [`hx-ptag`](/extensions/hx-ptag)                           | Performance    | Skip unchanged polls with `HX-PTag: "v42"`          |
| [`hx-download`](/extensions/hx-download)                   | Swaps          | Download files with `hx-swap='download'`            |
| [`hx-head`](/extensions/hx-head)                           | Swaps          | Merge `<head>` tags with `hx-head='merge'`          |
| [`hx-targets`](/extensions/hx-targets)                     | Swaps          | Target many elements with `hx-targets='.selector'`  |
| [`hx-upsert`](/extensions/hx-upsert)                       | Swaps          | Update or insert elements with `hx-swap='upsert'`   |
| [`htmx-2-compat`](/extensions/htmx-2-compat)               | Compatibility  | Restore htmx 2.x defaults and event names on htmx 4 |
| [`hx-alpine-compat`](/extensions/hx-alpine-compat)         | Compatibility  | Run htmx alongside Alpine.js without conflicts      |
| [`hx-csp`](/extensions/hx-csp)                             | Security       | Make htmx work under strict Content Security Policy |

Note that many these extensions are come pre-bundled into [`htmax.js`](/docs/htmax) as a single file.

### Using Extensions

To install an extension, include the extension script after htmx is included.

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/htmx.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/htmx.org@__VERSION__/dist/ext/hx-sse.js"></script>
```

Or with a bundler:

```javascript
import 'htmx.org';
import 'htmx.org/dist/ext/hx-sse';
```

### Building Extensions

If you wish to build your own htmx extension, see [htmx Extension Authoring Guide](/docs/extension-authoring-guide).

## Security Considerations

htmx allows you to define logic directly in your DOM. This has a number of advantages, the largest being
[Locality of Behavior](/essays/locality-of-behaviour), which makes your system easier to understand and
maintain.

A concern with this approach, however, is security: since htmx increases the expressiveness of HTML, if a malicious
user is able to inject HTML into your application, they can leverage this expressiveness of htmx to malicious
ends.

### Rule 1: Escape All User Content

The first rule of HTML-based web development has always been: *do not trust input from the user*. You should escape all
3rd party, untrusted content that is injected into your site. This is to prevent, among other issues,
[XSS attacks](https://en.wikipedia.org/wiki/Cross-site_scripting).

There is extensive documentation on XSS and how to prevent it on the
excellent [OWASP Website](https://owasp.org/www-community/attacks/xss/),
including
a [Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).

The good news is that this is a very old and well understood topic, and the vast majority of server-side templating
languages
support [automatic escaping](https://docs.djangoproject.com/en/4.2/ref/templates/language/#automatic-html-escaping) of
content to prevent just such an issue.

That being said, there are times people choose to inject HTML more dangerously, often via some sort of `raw()`
mechanism in their templating language. This can be done for good reasons, but if the content being injected is coming
from a 3rd party then it _must_ be scrubbed, including removing attributes starting with `hx-` and `data-hx`, as well as
inline `<script>` tags, etc.

If you are injecting raw HTML and doing your own escaping, a best practice is to *whitelist* the attributes and tags you
allow, rather than to blacklist the ones you disallow.

### htmx Security Tools

Of course, bugs happen and developers are not perfect, so it is good to have a layered approach to security for
your web application, and htmx provides tools to help secure your application as well.

Let's take a look at them.

#### `hx-ignore`

The first tool htmx provides to help further secure your application is the [`hx-ignore`](/reference/attributes/hx-ignore)
attribute. This attribute will prevent processing of all htmx attributes on a given element, and on all elements within
it. So, for example, if you were including raw HTML content in a template (again, this is not recommended!) then you
could place a div around the content with the `hx-ignore` attribute on it:

```html
<div hx-ignore>
    <%= raw(user_content) %>
</div>
```

And htmx will not process any htmx-related attributes or features found in that content. This attribute cannot be
disabled by injecting further content: if an `hx-ignore` attribute is found anywhere in the parent hierarchy of an
element, it will not be processed by htmx.

### CSP Options

Browsers also provide tools for further securing your web application. The most powerful tool available is a
[Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP). Using a CSP you can tell the
browser to, for example, not issue requests to non-origin hosts, to not evaluate inline script tags, etc.

CSP can be set via an HTTP header or a `<meta>` tag. HTTP headers are preferred, `<meta>` tags
do not enforce all directives and scripts that appear before the `<meta>` tag in the document are
not covered by it:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-<nonce>'
```

A full discussion of CSPs is beyond the scope of this document, but
the [MDN Article](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) provides a good jumping-off point
for exploring this topic.

#### Controlling Cross-Origin Requests

htmx defaults [`htmx.config.mode`](/reference/config/htmx-config-mode) to `"same-origin"`, which causes the
browser to reject any cross-origin fetch, even if an attacker injects an `hx-get` pointing elsewhere.

This setting is enforced for markup: any `mode` value in a per-element `hx-config` attribute is ignored and reset to the global config value. Injected markup like `hx-config='{"mode":"cors"}'` cannot widen request scope.

If your application legitimately needs CORS (e.g. an API on a different subdomain):

1. Set the mode globally:
   ```javascript
   htmx.config.mode = "cors";
   ```
2. Lock down reachable origins with `connect-src`:
   ```html
   <meta http-equiv="Content-Security-Policy"
         content="connect-src 'self' https://api.example.com">
   ```

With both in place, htmx can reach your API but injected target URLs to other origins are blocked by CSP.

#### hx-csp Extension

For sites using CSP script nonces, the [`hx-csp` extension](/extensions/hx-csp) provides deep integration:

- Gates all htmx attribute processing behind a per-request nonce, blocking injected htmx attributes
- Automatically creates a `'htmx'` [Trusted Types](https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API) policy so only htmx can write HTML into DOM sinks
- Replaces `new Function()` eval with nonce-based script injection when `safeEval:true` is set, removing the need for `unsafe-eval`

See the [hx-csp extension docs](/extensions/hx-csp) for full setup instructions.

#### htmx & Eval

htmx uses `new Function()` for some optional features:

* Event filters
* The [`hx-on`](/reference/attributes/hx-on) attribute
* Attribute values starting with `js:` or `javascript:`

All of these are optional. If you don't use them you can omit `unsafe-eval` from your CSP entirely.

If you do use these features, the [`hx-csp` extension](/extensions/hx-csp) with `safeEval:true` replaces
`new Function()` with nonce-based script injection, enabling them without `unsafe-eval`.

#### CSP & Inline Styles

htmx injects its indicator CSS using [Constructable Stylesheets](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/CSSStyleSheet) (`document.adoptedStyleSheets`), which are not subject to `style-src` CSP restrictions.

The one area to be aware of is morph swaps when used alongside JS frameworks like Alpine that set `style` attributes via JavaScript. During morph, htmx reconciles attributes between the old and new element, including any `style` value. Under a strict `style-src` policy without `'unsafe-inline'`, this `setAttribute("style", ...)` call will produce a CSP violation.

Add `"style"` to [`morphIgnore`](/reference/config/htmx-config-morphIgnore) to skip it:

```html
<meta name="htmx-config" content='{"morphIgnore":["data-htmx-powered","style"]}'>
```

Class-based CSS transitions continue to work normally.

### CSRF Prevention

The assignment and checking of CSRF tokens are typically backend responsibilities, but `htmx` can support returning the
CSRF token automatically with every request using the [`hx-headers`](/reference/attributes/hx-headers) attribute. The attribute needs to be added to the
element issuing the request or one of its ancestor elements. This makes the `html` and `body` elements effective
global vehicles for adding the CSRF token to the `HTTP` request header, as illustrated below.

```html
<html lang="en" hx-headers:inherited='{"X-CSRF-TOKEN": "CSRF_TOKEN_INSERTED_HERE"}'>
:
</html>
```

The above elements are usually unique in an HTML document and should be easy to locate within templates.
## Caching

htmx works with standard [HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
mechanisms out of the box.

If your server adds the
[`Last-Modified`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Last-Modified)
HTTP response header to the response for a given URL, the browser will automatically add the
[`If-Modified-Since`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since)
request HTTP header to the next requests to the same URL.

For polling use cases where you want the server to skip responses when content hasn't changed, see 
the [`ptag` extension](/extensions/hx-ptag).

Be mindful that if your server can render different content for the same URL depending on some other
headers, you need to use the [`Vary`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching#vary)
response HTTP header.

For example, if your server renders the full HTML when the [`HX-Request`](/reference/headers/HX-Request) header is missing or `false`, and it renders a
fragment of that HTML when `HX-Request: true`, you need to add `Vary: HX-Request`. That causes the cache to be keyed
based on a composite of the response URL and the `HX-Request` request header rather than being based just on the
response URL.
## Debugging

Declarative and event driven programming with htmx (or any other declarative language) can be a wonderful and highly
productive activity, but one disadvantage when compared with imperative approaches is that it can be trickier to debug.

Figuring out why something *isn't* happening, for example, can be difficult if you don't know the tricks.

Here are some tips:

Errors and warnings flow to `console.error` / `console.warn` by default. To also see every event htmx dispatches, set `htmx.config.logAll = true`:

```javascript
htmx.config.logAll = true;
```

Observability tools (Sentry, DataDog RUM, LogRocket, etc.) capture `console.*` automatically, so htmx logs flow into your existing pipeline without any extra setup.

Of course, that won't tell you why htmx *isn't* doing something. You might also not know *what* events a DOM
element is firing to use as a trigger. To address this, you can use the
[`monitorEvents()`](https://developers.google.com/web/updates/2015/05/quickly-monitor-events-from-the-console-panel)
method available in the browser console:

```javascript
monitorEvents(htmx.find("#theElement"));
```

This will spit out all events that are occurring on the element with the id `theElement` to the console, and allow you
to see exactly what is going on with it.

Note that this *only* works from the console, you cannot embed it in a script tag on your page.

Finally, push come shove, you might want to just debug `htmx.js` by loading up the unminimized version.

You would most likely want to set a break point in the methods to see what's going on.

And always feel free to jump on the [Discord](https://htmx.org/discord) if you need help.
## Editor Support

While htmx is simple enough that editor support is not necessary to use it, see [Editor Support](/docs/editor-support)
for information on tooling available in your preferred editor.
## Configuration

Htmx has configuration options that can be accessed either programmatically or declaratively.

They are listed below:

<div class="info-table">

| Config Variable                      | Info                                                                                                                                                                                                                                                           |
|--------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `htmx.config.logAll`                 | defaults to `false`, if set to `true` htmx will log all events to the console for debugging                                                                                                                                                                    |
| `htmx.config.prefix`                 | defaults to `"data-hx-"`, a secondary attribute prefix recognised alongside the always-active `hx-` prefix (e.g. `data-hx-get` works by default). Set to `""` to disable. **Must be set via meta tag**, setting this after page load will not apply correctly. |
| `htmx.config.transitions`            | defaults to `false`, whether to use view transitions when swapping content (if browser supports it)                                                                                                                                                            |
| `htmx.config.history`                | defaults to `true`, whether to enable history support. Set to `"reload"` to do a full page reload on history navigation instead of an AJAX request                                                                                                             |
| `htmx.config.mode`                   | defaults to `'same-origin'`, the fetch mode for AJAX requests. Can be `'cors'`, `'no-cors'`, or `'same-origin'`                                                                                                                                                |
| `htmx.config.defaultSwap`            | defaults to `innerHTML`                                                                                                                                                                                                                                        |
| `htmx.config.indicatorClass`         | defaults to `htmx-indicator`                                                                                                                                                                                                                                   |
| `htmx.config.requestClass`           | defaults to `htmx-request`                                                                                                                                                                                                                                     |
| `htmx.config.includeIndicatorCSS`    | defaults to `true` (determines if the indicator styles are loaded)                                                                                                                                                                                             |
| `htmx.config.defaultTimeout`         | defaults to `60000` (60 seconds), the number of milliseconds a request can take before automatically being terminated                                                                                                                                          |
| `htmx.config.inlineScriptNonce`      | defaults to unset, meaning that no nonce will be added to inline scripts                                                                                                                                                                                        |
| `htmx.config.extensions`             | defaults to `''`, a comma-separated list of extension names to load (e.g., `'preload,pending'`)                                                                                                                                                                |
| `htmx.config.morphIgnore`            | defaults to `["data-htmx-powered"]`, array of attribute name prefixes to preserve when morphing elements                                                                                                                                                       |
| `htmx.config.morphScanLimit`         | limits the number of nodes scanned during morphing                                                                                                                                                                                                             |
| `htmx.config.morphSkip`              | defaults to `'[hx-morph-skip]'`, CSS selector for elements to completely skip during morphing (they stay frozen)                                                                                                                                               |
| `htmx.config.morphSkipChildren`      | defaults to `'[hx-morph-skip-children]'`, CSS selector for elements whose attributes update but children are preserved during morphing                                                                                                                         |
| `htmx.config.noSwap`                 | defaults to `[204, 304]`, array of HTTP status codes that should not trigger a swap                                                                                                                                                                            |
| `htmx.config.allowEmptySwapAfterOOB` | defaults to `false`, whether the main swap still runs when a response contained only out-of-band elements                                                                                                                                                      |
| `htmx.config.implicitInheritance`    | defaults to `false`, if set to `true` attributes will be inherited from parent elements automatically without requiring the `:inherited` modifier                                                                                                              |
| `htmx.config.defaultFocusScroll`     | defaults to `false`, whether to scroll focused elements into view after swap                                                                                                                                                                                   |
| `htmx.config.defaultSettleDelay`     | defaults to `1` (ms), delay between swap and settle phases                                                                                                                                                                                                     |
| `htmx.config.metaCharacter`          | defaults to `undefined`, allows you to use a custom character instead of `:` for attribute modifiers (e.g., `-` to use `hx-get-inherited` instead of `hx-get:inherited`)                                                                                       |

</div>

You can set most options directly in JavaScript, or you can use a `meta` tag (accepts [HCON](/docs/hcon-guide) or JSON):

> **Note:** Some options are read only once during initialisation and must be set via the `meta` tag to take effect. These include `prefix`, `extensions`, and `metaCharacter`.

```html
<meta name="htmx-config" content='{"defaultSwap":"innerHTML"}'>
```

## Conclusion

And that's it!

Have fun with htmx!

You can accomplish [quite a bit](/patterns) without writing a lot of code!
