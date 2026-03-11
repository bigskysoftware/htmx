---
title: "Hypermedia Controls"
description: "Understand the request-response cycle from trigger to swap"
---

htmx extends HTML with attributes that control how requests are made and how responses update the page.

## Making Requests

Add `hx-get` to an element. It makes an AJAX request when clicked.

**Your HTML:**
```html
<button hx-get="/messages">
    Load Messages
</button>
```

**What the server returns:**
```html
<div>You have 3 new messages</div>
```

**What the user sees:**
```html
<button hx-get="/messages">
    <div>You have 3 new messages</div>
</button>
```

The response replaced the button's content. No JavaScript required.

### How It Works

| Step                  | What Happens                     |
|-----------------------|----------------------------------|
| 1. User clicks button | htmx intercepts the click        |
| 2. htmx makes request | Sends GET request to `/messages` |
| 3. Server responds    | Returns HTML (not JSON)          |
| 4. htmx updates page  | Swaps HTML into the button       |

### HTTP Methods

Use different attributes for different operations:

```html
<button hx-get="/users">Load Users</button>
<button hx-post="/users">Create User</button>
<button hx-put="/users/1">Update User</button>
<button hx-patch="/users/1">Patch User</button>
<button hx-delete="/users/1">Delete User</button>
```

Each attribute combines the URL and HTTP method.

### Common Patterns

**Load data on click:**
```html
<button hx-get="/profile">View Profile</button>
```

**Submit a form:**
```html
<form hx-post="/contact">
    <input name="email" type="email">
    <button type="submit">Send</button>
</form>
```

Form submits via AJAX instead of full page reload.

**Delete an item:**
```html
<button hx-delete="/items/5">Delete Item</button>
```

### What Gets Sent

htmx sends standard HTTP requests:

**Request to server:**
```
GET /messages HTTP/1.1
HX-Request: true
HX-Target: button
```

htmx adds custom headers so your server knows it's an htmx request.

**Server response:**
```html
HTTP/1.1 200 OK
Content-Type: text/html

<div>You have 3 new messages</div>
```

Just HTML. No JSON parsing needed.

## Triggers

By default, requests are triggered by the "natural" event of an element:

* `input`, `textarea` & `select` are triggered on the `change` event
* `form` is triggered on the `submit` event
* everything else is triggered by the `click` event

If you want different behavior you can use the [hx-trigger](/reference/attributes/hx-trigger)
attribute to specify which event will cause the request.

Here is a `div` that posts to `/mouse_entered` when a mouse enters it:

```html
<div hx-post="/mouse_entered" hx-trigger="mouseenter">
    Mouse Trap
</div>
```

### Trigger Modifiers

A trigger can also have additional modifiers that change its behavior. For example, if you want a request to only
happen once, you can use the `once` modifier for the trigger:

```html
<div hx-post="/mouse_entered" hx-trigger="mouseenter once">
    Mouse Trap
</div>
```

Other modifiers you can use for triggers are:

* `changed` - only issue a request if the value of the element has changed
* `delay:<time interval>` - wait the given amount of time (e.g. `1s`) before
  issuing the request. If the event triggers again, the countdown is reset.
* `throttle:<time interval>` - wait the given amount of time (e.g. `1s`) before
  issuing the request. Unlike `delay` if a new event occurs before the time limit is hit the event will be discarded,
  so the request will trigger at the end of the time period.
* `from:<CSS Selector>` - listen for the event on a different element. This can be used for things like keyboard
  shortcuts. Note that this CSS selector is not re-evaluated if the page changes.

Multiple triggers can be specified in the [hx-trigger](/reference/attributes/hx-trigger) attribute, separated by commas.

You can use these features to implement many common UX patterns, such as [Active Search](/patterns/active-search):

```html
<input type="text"
       name="q"
       placeholder="Search..."
       hx-get="/search"
       hx-trigger="input delay:500ms, keyup[key=='Enter']"
       hx-target="#search-results">
<div id="search-results"></div>
```

This input will issue a request 500 milliseconds after an input event occurs, or the `enter` key is pressed and inserts
the results into the `div` with the id `search-results`.

### Trigger Filters

In the example above, you may have noticed the square brackets after the event name. This is called a "trigger filter".

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

### Special Events

htmx provides a few special events for use in [hx-trigger](/reference/attributes/hx-trigger):

* `load` - fires once when the element is first loaded
* `revealed` - fires once when an element first scrolls into the viewport
* `intersect` - fires once when an element first intersects the viewport. This supports two additional options:
    * `root:<selector>` - a CSS selector of the root element for intersection
    * `threshold:<float>` - a floating point number between 0.0 and 1.0, indicating what amount of intersection to fire
      the event on

You can also use custom events to trigger requests.

### Polling

Polling is a simple technique where a web page periodically issues a request to the server to see if any updates have
occurred. It is not very highly respected in many web development circles, but it is simple, can be relatively
resource-light because it does not maintain a constant network connection, and it tolerates network failures well

In htmx you can implement polling via the `every` syntax in the [`hx-trigger`](/reference/attributes/hx-trigger) attribute:

```html
<div hx-get="/news" hx-trigger="every 2s"></div>
```

This tells htmx:

> Every 2 seconds, issue a GET to /news and load the response into the div

### Load Polling

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

### Request Indicators

When an AJAX request is issued it is often good to let the user know that something is happening since the browser
will not give them any feedback. You can accomplish this in htmx by using `htmx-indicator` class.

The `htmx-indicator` class is defined so that the opacity of any element with this class is `0` by default, making it
invisible but present in the DOM.

When htmx issues a request, it will put a `htmx-request` class onto an element (either the requesting element or
another element, if specified). The `htmx-request` class will cause a child element with the `htmx-indicator` class
on it to transition to an opacity of `1`, showing the indicator.

```html
<button hx-get="/click">
    Click Me!
    <img class="htmx-indicator" src="/spinner.gif" alt="Loading...">
</button>
```

Here we have a button. When it is clicked the `htmx-request` class will be added to it, which will reveal the spinner
gif element.

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

If you want the `htmx-request` class added to a different element, you can use
the [hx-indicator](/reference/attributes/hx-indicator)
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
elements for the duration of a request by using the [hx-disable](/reference/attributes/hx-disable) attribute.

## Targets

By default, responses replace the element that made the request.

Change this with [`hx-target`](/reference/attributes/hx-target).

```html
<button hx-get="..."
        hx-target="#results">
  Load Results
</button>

<div id="results">
    <!-- Response goes here -->
</div>
```

The button makes the request.

The response loads into `#results`.

The button stays unchanged.

### Extended Selectors

Use [extended selectors](/docs/core-concepts/extended-selectors) to target elements flexibly.

Beyond standard CSS selectors, you can use:

* [`this`](/docs/core-concepts/extended-selectors#this) - target the element itself
* [`closest <selector>`](/docs/core-concepts/extended-selectors#closest-selector) - find the nearest ancestor
* [`find <selector>`](/docs/core-concepts/extended-selectors#find-selector) - find the first child
* [`next`](/docs/core-concepts/extended-selectors#next) - target the next sibling
* [`next <selector>`](/docs/core-concepts/extended-selectors#next-selector) - find next sibling matching `<selector>`
* [`previous`](/docs/core-concepts/extended-selectors#previous) - target the previous sibling
* [`previous <selector>`](/docs/core-concepts/extended-selectors#previous-selector) - find previous sibling matching `<selector>`
* And more...

See the full [extended selectors guide](/docs/core-concepts/extended-selectors) for all options and examples.

This keeps your HTML cleaner without requiring `id` attributes everywhere.

## Swaps

htmx offers many different ways to swap the HTML returned into the DOM. By default, the content replaces the
[innerHTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML) of the target element, which is called
an `innerHTML` swap.

This is similar to how the `target` attribute on links and forms works, placing the retrieved document within an iframe.

You can modify this by using the [hx-swap](/reference/attributes/hx-swap) attribute with any of the following values:

| Name                        | Description                                                                                                                               |
|-----------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| `innerHTML`                 | the default, puts the content inside the target element                                                                                   |
| `outerHTML`                 | replaces the entire target element with the returned content                                                                              |
| `beforebegin` (or `before`) | prepends the content before the target in the target's parent element                                                                     |
| `afterbegin` (or `prepend`) | prepends the content before the first child inside the target                                                                             |
| `beforeend` (or `append`)   | appends the content after the last child inside the target                                                                                |
| `afterend` (or `after`)     | appends the content after the target in the target's parent element                                                                       |
| `delete`                    | deletes the target element regardless of the response                                                                                     |
| `none`                      | does not append content from response ([Out of Band Swaps](#oob_swaps) and [Response Headers](#response-headers) will still be processed) |
| `innerMorph`                | morphs the children of the target element, preserving as much of the existing DOM as possible                                             |
| `outerMorph`                | morphs the target element itself, preserving as much of the existing DOM as possible                                                      |

### Morph Swaps

htmx includes built-in `innerMorph` and `outerMorph` swaps that merge new content into the existing DOM rather than
simply replacing it. They often do a better job preserving things like focus, video state, etc. by mutating existing
nodes in-place during the swap operation, at the cost of more CPU.

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

Then htmx will "morph" the existing content to the new structure. Note that the `h1` element has moved below the
video. With the `outerHTML` swap this will cause the video to stop playing and reset. However, the morphing algorithm
uses ID elements to intelligently mutate the DOM and preserve the existing video element, keeping the video playing
smoothly.

Note that a similar effect can be achieved with the `hx-preserve` attribute, discussed below.

#### Excluding Elements from Morphing

Exclude specific elements from morphing using config options:

- [`htmx.config.morphSkip`](/reference/javascript-api/htmx-config-morphskip) - Completely skip morphing specific elements (they stay frozen)
- [`htmx.config.morphSkipChildren`](/reference/javascript-api/htmx-config-morphskipchildren) - Update element attributes but preserve children

Useful for third-party widgets, custom web components, or active animations.

### View Transitions

The [View Transitions API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
gives developers a way to create an animated transition between different DOM states.

htmx supports view transitions via:
- Setting `htmx.config.transitions` to `true` globally
- Per-swap via `hx-swap` `transition` property: `hx-swap="outerHTML transition:true"`
- For boosted elements: `hx-boost="transition:true"`

### Swap Options

The [hx-swap](/reference/attributes/hx-swap) attribute also supports options for tuning the swapping behavior of htmx. For
example, by default htmx will swap in the title of a title tag found anywhere in the new content. You can turn this
behavior off by setting the `ignoreTitle` modifier to true:

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

See the [hx-swap](/reference/attributes/hx-swap) documentation for more details on these options.

## Parameters

By default, an element that causes a request will include its `value` if it has one. If the element is a form it
will include the values of all inputs within it.

As with HTML forms, the `name` attribute of the input is used as the parameter name in the request that htmx sends.

Additionally, if the element causes a non-`GET` request, the values of all the inputs of the associated form will be
included (typically this is the nearest enclosing form, but could be different if e.g. `<button form="associated-form">`
is used).

If you wish to include the values of other elements, you can use the [hx-include](/reference/attributes/hx-include) attribute
with a CSS selector of all the elements whose values you want to include in the request.

Finally, if you want to programmatically modify the parameters, you can use the [htmx:config:request](/reference/events/htmx-config-request)
event.

### File Upload

If you wish to upload files via an htmx request, you can set the [hx-encoding](/reference/attributes/hx-encoding) attribute to
`multipart/form-data`. This will use a `FormData` object to submit the request, which will properly include the file
in the request.

Note that depending on your server-side technology, you may have to handle requests with this type of body content very
differently.
