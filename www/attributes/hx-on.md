---
layout: layout.njk
title: </> htmx - hx-on
---

## `hx-on`

The `hx-on` attribute allows you embed JavaScript scripts to respond to events directly on an element.  It is 
very similar to the [`onevent` properties](https://developer.mozilla.org/en-US/docs/Web/Events/Event_handlers#using_onevent_properties)
found in HTML, such as `onClick`.

`hx-on` improves on the `onevent` handlers in that it can handle any events, not just a fixed number of specific
DOM events.  This allows you to respond to, for example, the many htmx-emitted events in a nice, embedded manner
that gives good [Locality of Behavior (LoB)](/essays/locality-of-behavior).  

The `hx-on` attribute's value is an event name, followed by a colon, followed by the event handler code:

```html
<div>
    <button hx-get="/info" hx-on="htmx:beforeRequest: alert('Making a request!')">
        Get Info!
    </button>
</div>
```

Here the event `hmtx:beforeRequest` is captured and shows an alert.  Note that it is not possible to respond to this
event using the `onevent` properties in normal HTML.

### Symbols

Following the conventions of the `onevent` properties, two symbols are available in the body of the event handler code:

* `this` - Set to the element on which the `hx-on` attribute is defined
* `event` - Set to the event that triggered the handler

### Multiple Handlers

Multiple handlers can be defined by putting them on new lines:

```html
<div>
    <button hx-get="/info" hx-on="htmx:beforeRequest: alert('Making a request!')
                                  htmx:afterRequest: alert('Done making a request!')">
        Get Info!
    </button>
</div>
```

### Notes

* `hx-on` is _not_ inherited, however due to 
  [event bubbling](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#event_bubbling_and_capture), 
  `hx-on` attributes on parent elements will typically be triggered by events on child elements
