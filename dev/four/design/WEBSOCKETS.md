# Websockets

This is a design doc for the websocket support in htmx 4.

My (wrong) rough idea:

```html
<button hx-get="ws:/websocket">
    Send It...
</button>
```

clicking on this button looks to see if there is an established connection to `/websocket` and creates it if not, and
increments the reference count for that connection.

it then sends the `ctx` object up to the websocket end point as a JSON object.

when an element is removed from the DOM it decrements the reference count and if it hits zero disconnects

responses are streamed down via `<hx-partial>` responses.  Maybe we generate an id for the web socket request so we
can tie non-`<hx-partial>` requests back to a specific element making the request and do a normal swap

i have no idea if this is a good idea or not, it's just the first thing that comes to my mind, chrisitan also has thoughts