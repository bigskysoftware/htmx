+++
title = "hx-on"
+++

The `hx-on` attribute allows you to directly embed scripts inline to respond to events on an element.  Similar to the [`onevent` properties](https://developer.mozilla.org/en-US/docs/Web/Events/Event_handlers#using_onevent_properties)
found in HTML, such as `onClick`.

`hx-on` improves on `onevent` by enabling the element to handle any event. Additionally, this enables you to respond to any htmx event  in a convenient manner for [Locality of Behavior (LoB)](/essays/locality-of-behavior).

The value is an event name, followed by a colon `:`, followed by the script:

```html
<button hx-on="click: alert('Clicked!')">Click</button>
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
