+++
title = "HX-Trigger Response Headers"
+++

These response headers can be used to trigger client side actions on the target element within a response to htmx.  You
can trigger a single event or as many uniquely named events as you would like.

The headers are:

* `HX-Trigger` - trigger events as soon as the response is received.
* `HX-Trigger-After-Settle` - trigger events after the [settling step](@/docs.md#request-operations).
* `HX-Trigger-After-Swap` - trigger events after the [swap step](@/docs.md#request-operations).

To trigger a single event with no additional details you can simply send the event name in a header like so:

`HX-Trigger: myEvent`

This will trigger `myEvent` on the triggering element and will bubble up to the body.  As an example you could
listen for this event like this:

```javascript
document.body.addEventListener("myEvent", function(evt){
    alert("myEvent was triggered!");
})
```

... or like this, if you're trying to trigger some element without using JS code:

```html
<!-- Since it bubbles up to the <body>, we must use the `from:body` modifier below -->
<div hx-trigger="myEvent from:body" hx-get="/example"></div>
```

If you want to pass details along with the event, you can move to JSON for the value of the trigger:

`HX-Trigger: {"showMessage":"Here Is A Message"}`

To handle this event you would write the following code:

```javascript
document.body.addEventListener("showMessage", function(evt){
    alert(evt.detail.value);
})
```

Note that the value of the message was put into the `detail.value` slot.  If you wish to pass multiple pieces of data
you can use a nested JSON object on the right hand side of the JSON object:

`HX-Trigger: {"showMessage":{"level" : "info", "message" : "Here Is A Message"}}`

And handle this event like so:

```javascript
document.body.addEventListener("showMessage", function(evt){
   if(evt.detail.level === "info"){
     alert(evt.detail.message);   
   }
})
```

Each property of the JSON object on the right hand side will be copied onto the details object for the event.

### Multiple Triggers

If you wish to invoke multiple events, you can simply add additional properties to the top level JSON
object:

`HX-Trigger: {"event1":"A message", "event2":"Another message"}`

You may also trigger multiple events with no additional details by sending event names separated by commas, like so:

`HX-Trigger: event1, event2`

Using events gives you a lot of flexibility to add functionality to normal htmx responses.
