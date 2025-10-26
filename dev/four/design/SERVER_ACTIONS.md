# Server Actions

Server actions are actions sent from a server to the client.  They can be sent via normal responses or via SSE

They use the `server-action` tag name:

```html
<server-action type="...">
    ... action content ...
</server-action>
```

Server actions can take a few different forms, reflected in the `type` attribute:

* `type='events'` - The body will be parsed as JSON and events will be triggered
  ```html
     <server-event type="events">
        [{"type":"myEvent", "target":"foo", "data": {"asdf":10}}, ... ]
     </server-event>
  ```
* `type='javascript'` - The body will be evaluated as javascript
  ```html
     <server-event type="javascript">
        console.log("A server event occurred")
     </server-event>
  ```
* `type='set'` - The body will be split on `=` with the rhs parsed as JSON and assigned to the lhs:
  ```html
     <server-event type="set">
        foo.bar.zed=10
     </server-event>
  ```
