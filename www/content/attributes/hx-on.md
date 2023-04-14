+++
title = "hx-on"
+++

The `hx-on` attribute allows you to embed scripts inline to respond to events directly on an element; similar to the [`onevent` properties](https://developer.mozilla.org/en-US/docs/Web/Events/Event_handlers#using_onevent_properties) found in HTML, such as `onClick`.

`hx-on` improves upon `onevent` by enabling the handling of any event for enhanced [Locality of Behaviour (LoB)](/essays/locality-of-behaviour/). This also enables you to handle any htmx event.

The value is an event name, followed by a colon `:`, followed by the script:

```html
<div hx-on="click: alert('Clicked!')">Click</div>
```

All htmx events can be captured, too!

```html
<button hx-get="/info" hx-on="htmx:beforeRequest: alert('Making a request!')">
    Get Info!
</button>
```

### Symbols

Like `onevent`, two symbols are made available to event handler scripts:

* `this` - The element on which the `hx-on` attribute is defined
* `event` - The event that triggered the handler

### Multiple Handlers

Multiple handlers can be defined by putting them on new lines:

```html
<button hx-get="/info" hx-on="htmx:beforeRequest: alert('Making a request!')
                              htmx:afterRequest: alert('Done making a request!')">
    Get Info!
</button>
```

### Notes

* `hx-on` is _not_ inherited, however due to 
  [event bubbling](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#event_bubbling_and_capture), 
  `hx-on` attributes on parent elements will typically be triggered by events on child elements
