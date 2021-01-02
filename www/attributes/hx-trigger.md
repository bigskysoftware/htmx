---
layout: layout.njk
title: </> htmx - hx-trigger
---

## `hx-trigger`

The `hx-trigger` attribute allows you to specify what triggers an AJAX request.  A trigger
value can be one of the following:

* An event name (e.g. "click" or "my-custom-event") followed by an event filter and a set of event modifiers
* A polling definition of the form `every <timing declaration>`
* A comma-separated list of such events

### Standard Events

A standard event, such as `click` can be specified as the trigger like so:

```html
<div hx-get="/clicked" hx-trigger="click">Click Me</div>
```

#### Standard Event Filters

Events can be filtered by enclosing a boolean javascript expression in square brackets after the event name.  If
this expression evaluates to `true` the event will be triggered, otherwise it will be ignored.

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
<div hx-get="/clicked" hx-trigger="click[ctrlKey&&shfitKey]">Control-Shift Click Me</div>
```

Note that all symbols used in the expression will be resolved first against the triggering event, and then next
against the global namespace, so `myEvent[foo]` will first look for a property named `foo` on the event, then look
for a global symbol with the name `foo`

#### Standard Event Modifiers

Standard events can also have modifiers that change how they behave.  The modifiers are:

* `once` - the event will only trigger once (e.g. the first click)
* `changed` - the event will only change if the value of the element has changed
* `delay:<timing declaration>` - a delay will occur before an event triggers a request.  If the event
is seen again it will reset the delay.
* `throttle:<timing declaration>` - a throttle will occur before an event triggers a request.  If the event
is seen again before the delay completes it is ignored, the element will trigger at the end of the delay.
* `from:<CSS selector>` - allows the event that triggers a request to come from another element in the document (e.g. listening to a key event on the body, to support hot keys)

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
* `revealed` - triggered when an element is scrolled into the viewport (also useful for lazy-loading)

### Polling

By using the syntax `every <timing declaration>` you can have an element poll periodically:

```html
<div hx-get="/latest_updates" hx-trigger="every 1s">
  Nothing Yet!
</div>
```

This example will issue a `GET` to the `/latest_updates` URL every second and swap the results into
the innerHTML of this div.

### Multiple Triggers

Multiple triggers can be provided, seprarated by commas.  Each trigger gets its own options.
```html
  <div hx-get="/news" hx-trigger="load, click delay:1s"></div>
```
This example will load `/news` immediate on the page load, and then again with a delay of one second after each click.

### Notes

* `hx-trigger` is not inherited
