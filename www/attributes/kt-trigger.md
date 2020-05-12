---
layout: layout.njk
title: </> kutty - kt-trigger
---

## `kt-target`

The `kt-trigger` attribute allows you to specify what triggers an AJAX request.  A trigger
value can be one of the following:

* An event name (e.g. "click") followed by a set of event modifiers
* A polling definition of the form `every <timing declaration>`
* An SSE event declaration of the form `sse:<event name>`

### Standard Events

A standard event, such as `click` can be specified as the trigger like so:

```html
<div kt-get="/clicked" kt-trigger="click">Click Me</div>
```

Standard events can also have modifiers that change how they behave.  The modifiers are:

* `once` - the event will only trigger once (e.g. the first click)
* `changed` - the event will only change if the value of the element has changed
* `delay:<timing declaration>` - a delay will occur before an event triggers a request.  If the event
is seen again it will reset the delay.
* `swap:<timing declaration>` - delay the time between when a request finishes and a swap occurs.  This can
be used to synchronize with CSS transitions (e.g. fade out) before elements are removed from the DOM.
* `settle:<timing declaration>` - delay the time between when swap finishes and the DOM settles.  This can
be used to synchronize with CSS transitions (e.g. fade out) after elements are added to the DOM.

Here is an example of a search box that searches on `keyup`, but only if the search value has changed
and the user hasn't typed anything new for 1 second:

```html
<input name="q" 
       kt-get="/search" kt-trigger="keyup changed delay:1s"
       kt-target="#search-results"/>
```

The response from the `/register` url will be appended to the `div` with the id `response-div`.

There are two special events that are non-standard that kutty supports:

* `load` - triggered on load (useful for lazy-loading something)
* `reveal` - triggered when an element is scrolled into the viewport (also useful for lazy-loading)

### Polling

By using the syntax `every <timing declaration>` you can have an element poll periodically:

```html
<div kt-get="/latest_updates" kt-trigger="every 1s">
  Nothing Yet!
</div>
```

This example will issue a `GET` to the `/latest_updates` URL every second and swap the results into
the innerHTML of this div.

### SSE Events

If a parent node has declared an SSE source with the [`sse-src`](/attributes/sse-src) attribute,
an element can register to be triggered by a specific SSE event using the syntax `sse:<event name>`.

Here is an example:

```html
  <div kt-sse-src="/event_stream">
    <div kt-get="/chatroom" kt-trigger="sse:chatter">
      ...
    </div>
  </div>
```

This example establishes an SSE connection to the `event_stream` end point which then triggers
a `GET` to the `/chatroom` url whenever the `chatter` event is seen.

### Notes

* `kt-trigger` is not inherited