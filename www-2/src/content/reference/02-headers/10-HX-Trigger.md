---
title: "HX-Trigger"
description: "Trigger client-side events from the server"
---

Trigger client-side events when content is swapped.

Send a single event:

```http
HX-Trigger: myEvent
```

Send multiple events:

```http
HX-Trigger: event1, event2
```

Send event with detail:

```http
HX-Trigger: {"showMessage":"Hello World"}
```

Handle the event:

```javascript
document.body.addEventListener("showMessage", (evt) => {
    alert(evt.detail.value); // "Hello World"
});
```

Use `hx-trigger` to respond to server-triggered events:

```html
<div hx-trigger="showMessage from:body" hx-get="/message"></div>
```
