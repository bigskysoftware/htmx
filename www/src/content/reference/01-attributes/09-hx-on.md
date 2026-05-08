---
title: "hx-on"
description: "Handle events with inline scripts"
---

The `hx-on*` attributes allow you to embed scripts inline to respond to events directly on an element; similar to the
[`onevent` properties](https://developer.mozilla.org/en-US/docs/Web/Events/Event_handlers#using_onevent_properties)
found in HTML, such as `onClick`.

The `hx-on*` attributes improve upon `onevent` by enabling the handling of any arbitrary JavaScript event,
for enhanced [Locality of Behaviour (LoB)](/essays/locality-of-behaviour) even when dealing with non-standard DOM
events. For example, these
attributes allow you to handle [htmx events](/reference#events).

## Syntax

```html
<div hx-on:click="alert('Clicked!')">Click</div>
```

With `hx-on` attributes, you specify the event name as part of the attribute name, after a colon. So, for example, if
you want to respond to a `click` event, you would use the attribute `hx-on:click`:

```html

<div hx-on:click="alert('Clicked!')">Click</div>
```

Note that this syntax can be used to capture all htmx events, as well as most other custom events, in addition to the
standard DOM events.

One gotcha to note is that DOM attributes do not preserve case. This means, unfortunately, an attribute like
`hx-on:htmx:beforeRequest` **will not work**, because the DOM lowercases the attribute names. Fortunately, htmx supports
both camel case event names and also [kebab-case event names](/reference/events), so you can use
`hx-on:htmx:before:request` instead.

In order to make writing htmx-based event handlers a little easier, you can use the shorthand double-colon `hx-on::` for
htmx
events, and omit the "htmx" part:

```html
<!-- These two are equivalent -->
<button hx-get="/info" hx-on:htmx:before:request="alert('Making a request!')">
    Get Info!
</button>

<button hx-get="/info" hx-on::before:request="alert('Making a request!')">
    Get Info!
</button>

```

If you wish to handle multiple different events, you can simply add multiple attributes to an element:

```html

<button hx-get="/info"
        hx-on::before:request="alert('Making a request!')"
        hx-on::after:request="alert('Done making a request!')">
    Get Info!
</button>
```

Finally, in order to make this feature compatible with some templating languages (
e.g. [JSX](https://react.dev/learn/writing-markup-with-jsx)) that do not like having a colon (`:`)
in HTML attributes, you may use dashes in the place of colons for both the long form and the shorthand form:

```html
<!-- These two are equivalent -->
<button hx-get="/info" hx-on-htmx-before:request="alert('Making a request!')">
    Get Info!
</button>

<button hx-get="/info" hx-on--before:request="alert('Making a request!')">
    Get Info!
</button>

```

### Symbols

Like `onevent`, two symbols are made available to event handler scripts:

* `this` - The element on which the `hx-on` attribute is defined
* `event` - The event that triggered the handler

### Notes

* `hx-on` is _not_ inherited, however due to
  [event bubbling](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#event_bubbling_and_capture),
  `hx-on` attributes on parent elements will typically be triggered by events on child elements
