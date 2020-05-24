---
layout: layout.njk
title: </> htmx - hx-trigger
---

## `hx-trigger`

The `hx-trigger` attribute allows you to specify what triggers an AJAX request.  A trigger
value can be one of the following:

* An event name (e.g. "click" or "my-custom-event") followed by a set of event modifiers
* A polling definition of the form `every <timing declaration>`
* An SSE event declaration of the form `sse:<event name>`
* A comma-separated list of such events

### Standard Events

A standard event, such as `click` can be specified as the trigger like so:

```html
<div hx-get="/clicked" hx-trigger="click">Click Me</div>
```

Standard events can also have modifiers that change how they behave.  The modifiers are:

* `once` - the event will only trigger once (e.g. the first click)
* `changed` - the event will only change if the value of the element has changed
* `delay:<timing declaration>` - a delay will occur before an event triggers a request.  If the event
is seen again it will reset the delay.

Here is an example of a search box that searches on `keyup`, but only if the search value has changed
and the user hasn't typed anything new for 1 second:

```html
<input name="q" 
       hx-get="/search" hx-trigger="keyup changed delay:1s"
       hx-target="#search-results"/>
```

The response from the `/register` url will be appended to the `div` with the id `response-div`.

There are two special events that are non-standard that htmx supports:

* `load` - triggered on load (useful for lazy-loading something)
* `reveal` - triggered when an element is scrolled into the viewport (also useful for lazy-loading)

### Polling

By using the syntax `every <timing declaration>` you can have an element poll periodically:

```html
<div hx-get="/latest_updates" hx-trigger="every 1s">
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
  <div hx-sse-src="/event_stream">
    <div hx-get="/chatroom" hx-trigger="sse:chatter">
      ...
    </div>
  </div>
```

This example establishes an SSE connection to the `event_stream` end point which then triggers
a `GET` to the `/chatroom` url whenever the `chatter` event is seen.

### Multiple Triggers

Multiple triggers can be provided, seprarated by commas.  Each trigger gets its own options.
```html
  <div hx-get="/news" hx-trigger="load, click delay:1s"></div>
```
This example will load `/news` immediate on the page load, and then again with a delay of one second after each click.

### Notes

* `hx-trigger` is not inherited
