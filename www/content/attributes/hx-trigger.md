+++
title = "hx-trigger"
description = """\
  The hx-trigger attribute in htmx allows you to specify what triggers an AJAX request. Supported triggers include \
  standard DOM events, custom events, polling intervals, and event modifiers. The hx-trigger attribute also allows \
  specifying event filtering, timing controls, event bubbling, and multiple trigger definitions for fine-grained \
  control over when and how requests are initiated."""
+++

The `hx-trigger` attribute allows you to specify what triggers an AJAX request.  A trigger
value can be one of the following:

* An event name (e.g. "click" or "my-custom-event") followed by an event filter and a set of event modifiers
* A polling definition of the form `every <timing declaration>`
* A comma-separated list of such events

### Standard Events

Standard events refer to [web API events](https://developer.mozilla.org/en-US/docs/Web/API/Element#events) (e.g. click, keydown, mouseup, load).

A standard event, such as `click` can be specified as the trigger like so:

```html
<div hx-get="/clicked" hx-trigger="click">Click Me</div>
```

#### Standard Event Filters

Events can be filtered by enclosing a boolean javascript expression in square brackets after the event name.  If
this expression evaluates to `true` the event will be triggered, otherwise it will be ignored. Standard event filters [require eval](@/docs.md#configuration-options).

```html
<div hx-get="/clicked" hx-trigger="click[ctrlKey]">Control Click Me</div>
```

This event will trigger if a click event is triggered with the `event.ctrlKey` property set to true.

Conditions can also refer to global functions or state

```html
<div hx-get="/clicked" hx-trigger="click[checkGlobalState()]">Control Click Me</div>
```

And can also be combined using the standard javascript syntax

```html
<div hx-get="/clicked" hx-trigger="click[ctrlKey&&shiftKey]">Control-Shift Click Me</div>
```

Note that all symbols used in the expression will be resolved first against the triggering event, and then next
against the global namespace, so `myEvent[foo]` will first look for a property named `foo` on the event, then look
for a global symbol with the name `foo`

#### Standard Event Modifiers

Standard events can also have modifiers that change how they behave.  The modifiers are:

* `once` - the event will only trigger once (e.g. the first click)
* `changed` - the event will only fire if the value of the element has changed. Please pay attention `change` is the name of the event and `changed` is the name of the modifier.
* `delay:<timing declaration>` - a delay will occur before an event triggers a request.  If the event
is seen again it will reset the delay.
* `throttle:<timing declaration>` - a throttle will occur after an event triggers a request. If the event
is seen again before the delay completes, it is ignored, the element will trigger at the end of the delay.
* `from:<Extended CSS selector>` - allows the event that triggers a request to come from another element in the document (e.g. listening to a key event on the body, to support hot keys)
  * A standard CSS selector resolves to all elements matching that selector. Thus, `from:input` would listen on every input on the page.
  * The CSS selector is only evaluated once and is not re-evaluated when the page changes. If you need to detect dynamically added elements use a [standard event filter](#standard-event-filters), for example `hx-trigger="click[event.target.matches('button')] from:body"` which would [catch](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Event_bubbling) click events from every button on the page.
  * The extended CSS selector here allows for the following non-standard CSS values:
    * `document` - listen for events on the document
    * `window` - listen for events on the window
    * `closest <CSS selector>` - finds the [closest](https://developer.mozilla.org/docs/Web/API/Element/closest) ancestor element or itself, matching the given css selector
    * `find <CSS selector>` - finds the closest child matching the given css selector
    * `next` resolves to [element.nextElementSibling](https://developer.mozilla.org/docs/Web/API/Element/nextElementSibling)
    * `next <CSS selector>` scans the DOM forward for the first element that matches the given CSS selector.
      (e.g. `next .error` will target the closest following sibling element with `error` class)
    * `previous` resolves to [element.previousElementSibling](https://developer.mozilla.org/docs/Web/API/Element/previousElementSibling)
    * `previous <CSS selector>` scans the DOM backwards for the first element that matches the given CSS selector.
      (e.g. `previous .error` will target the closest previous sibling with `error` class)
* `target:<CSS selector>` - allows you to filter via a CSS selector on the target of the event.  This can be useful when you want to listen for
triggers from elements that might not be in the DOM at the point of initialization, by, for example, listening on the body,
but with a target filter for a child element
* `consume` - if this option is included the event will not trigger any other htmx requests on parents (or on elements
  listening on parents)
* `queue:<queue option>` - determines how events are queued if an event occurs while a request for another event is in flight.  Options are:
  * `first` - queue the first event
  * `last` - queue the last event (default)
  * `all` - queue all events (issue a request for each event)
  * `none` - do not queue new events

Here is an example of a search box that searches on `input`, but only if the search value has changed
and the user hasn't typed anything new for 1 second:

```html
<input name="q"
       hx-get="/search" hx-trigger="input changed delay:1s"
       hx-target="#search-results"/>
```

The response from the `/search` url will be appended to the `div` with the id `search-results`.

### Non-standard Events

There are some additional non-standard events that htmx supports:

* `load` - triggered on load (useful for lazy-loading something)
* `revealed` - triggered when an element is scrolled into the viewport (also useful for lazy-loading). If you are using `overflow` in css like `overflow-y: scroll` you should use `intersect once` instead of `revealed`.
* `intersect` - fires once when an element first intersects the viewport.  This supports two additional options:
    * `root:<selector>` - a CSS selector of the root element for intersection
    * `threshold:<float>` - a floating point number between 0.0 and 1.0, indicating what amount of intersection to fire the event on

### Triggering via the `HX-Trigger` header

If you're trying to fire an event from <code>HX-Trigger</code> response  header, you will likely want to
use the `from:body` modifier.  E.g. if you send a header like this <code>HX-Trigger: my-custom-event</code>
with a response, an element would likely need to look like this:

```html
  <div hx-get="/example" hx-trigger="my-custom-event from:body">
    Triggered by HX-Trigger header...
  </div>
```

in order to fire.

This is because the header will likely trigger the event in a different DOM hierarchy than the element that you
wish to be triggered.  For a similar reason, you will often listen for hot keys from the body.

### Polling

By using the syntax `every <timing declaration>` you can have an element poll periodically:

```html
<div hx-get="/latest_updates" hx-trigger="every 1s">
  Nothing Yet!
</div>
```

This example will issue a `GET` to the `/latest_updates` URL every second and swap the results into
the innerHTML of this div.

If you want to add a filter to polling, it should be added *after* the poll declaration:

```html
<div hx-get="/latest_updates" hx-trigger="every 1s [someConditional]">
  Nothing Yet!
</div>
```

### Multiple Triggers

Multiple triggers can be provided, separated by commas.  Each trigger gets its own options.
```html
  <div hx-get="/news" hx-trigger="load, click delay:1s"></div>
```
This example will load `/news` immediately on page load, and then again with a delay of one second after each click.

### Via JavaScript

The AJAX request can be triggered via JavaScript [`htmx.trigger()`](@/api.md#trigger), too.

## Notes

* `hx-trigger` is not inherited
* `hx-trigger` can be used without an AJAX request, in which case it will only fire the `htmx:trigger` event
* In order to pass a CSS selector that contains whitespace (e.g. `form input`) to the `from`- or `target`-modifier, surround the selector in parentheses or curly brackets (e.g. `from:(form input)` or `from:closest (form input)`)
* A reset event in hx-trigger (e.g. hx-trigger="change, reset") might not work as intended, since HTMX builds its values and sends a request before the browser resets the form values. As a workaround, add a delay to let the browser reset the form before making the request (e.g. hx-trigger="change, reset delay:0.01s"). 
