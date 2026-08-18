---
title: "HX-Trigger"
description: "Triggers client-side events with `htmx.trigger()`"
---

The `HX-Trigger` response header triggers client-side events after the swap has completed.

## Basic Usage

Send a single event:

```http
HX-Trigger: myEvent
```

By default, the event is dispatched on the element that made the request and bubbles. Use [`from:body`](/reference/attributes/hx-trigger#from) when listening elsewhere.

Listen from markup with [`hx-on`](/reference/attributes/hx-on):

```html
<div hx-on="myEvent from:body -> this.classList.add('updated')"></div>
```

Send multiple events:

```http
HX-Trigger: event1, event2
```

## Event Detail

Send event detail with a JSON object:

```http
HX-Trigger: {"notification":"Hello World"}
```

Scalar values are available on `detail.value`:

```html
<div hx-on="notification from:body -> alert(value)"></div>
```

You can also listen from JavaScript:

```javascript
document.body.addEventListener("notification", (evt) => {
    alert(evt.detail.value); // "Hello World"
});
```

Send multiple detail fields with a nested object:

```http
HX-Trigger: {"notification":{"level":"info", "message":"Saved"}}
```

Each nested property is copied onto the event detail:

```html
<div hx-on="notification from:body -> this.dataset.level = level; this.textContent = message"></div>
```

Send multiple events with detail by adding properties to the top-level JSON object:

```http
HX-Trigger: {"notification":"Saved", "refreshList":true}
```

```html
<div hx-on="notification from:body -> this.textContent = value;
            refreshList from:body -> this.dataset.refresh = value"></div>
```

## Targeting Other Elements

Trigger an event on another element with `target`:

```http
HX-Trigger: {"notification":{"target":"#notifications", "message":"Saved"}}
```

The `target` value is resolved as a selector. The event is dispatched on that element instead of the source element.

```html
<div id="notifications" hx-on="notification -> this.textContent = message"></div>
```

This can update client-owned state while the response swaps normal HTML elsewhere:

```http
HX-Trigger: {"cartUpdated":{"target":"#cart", "count":3}}
```

```html
<div id="cart" data-count="0" hx-on="cartUpdated -> data.count = count">
    Cart (<span :text="data.count"></span>)
</div>
```

_This example uses the [`hx-live`](/extensions/hx-live) extension._

## Notes

Response headers are not processed on 3xx response codes. Return a 2xx status when using this header.

In htmx 2, there were three variants: `HX-Trigger`, `HX-Trigger-After-Swap`, and `HX-Trigger-After-Settle`. In htmx 4, these were consolidated into a single `HX-Trigger` header that fires after the swap completes.

## See Also

- [`htmx.trigger()`](/reference/methods/htmx-trigger)
