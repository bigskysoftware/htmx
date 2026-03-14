---
title: "Reset on Submit"
description: Clear form inputs after submission
icon: "icon-[mdi--eraser]"
---

<div id="demo-content" class="not-prose demo-container"></div>

This example resets form inputs after submission using [`hx-on`](/reference/attributes/hx-on),
so users can fire off multiple requests without manually clearing the previous value.

The inline script listens for the [`afterRequest`](/events.md#htmx:after:request) event and calls
`this.reset()` when the response has a 20x status code:

```html
<form hx-post="/note"
      hx-target="#notes"
      hx-swap="afterbegin"
      hx-on::after-request="if(event.detail.successful) this.reset()">
    <label>Add a note</label>
    <input type="text" name="note-text" placeholder="blank canvas">
    <button class="btn">Add</button>
</form>
<ul id="notes"><!-- Response will go here --></ul>
```

The `reset()` method is only available on `<form>` elements.
For standalone inputs, you can select the element and clear its value directly.
The following is functionally equivalent:

```html
<div>
    <label>Add a note</label>
    <input id="note-input" type="text" name="note-text" placeholder="blank canvas">
</div>
<button class="btn primary"
        hx-post="/note"
        hx-target="#notes"
        hx-swap="afterbegin"
        hx-include="#note-input"
        hx-on::after-request="if(event.detail.successful)
            document.getElementById('note-input').value = ''">
    Add
</button>
<ul id="notes"><!-- Response will go here --></ul>
```

<style>
#demo-content form {
  display: flex;
  gap: 0.5rem;
  align-items: end;
  margin-bottom: 1rem;
}
#demo-content label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #404040;
}
:is(.dark) #demo-content label {
  color: #a3a3a3;
}
#demo-content input[type="text"] {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d4d4d4;
  border-radius: 0.375rem;
  font-size: 0.925rem;
  outline: none;
  background: #fff;
  color: #171717;
  transition: border-color 0.15s;
}
#demo-content input[type="text"]:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}
:is(.dark) #demo-content input[type="text"] {
  background: #262626;
  border-color: #525252;
  color: #e5e5e5;
}
:is(.dark) #demo-content input[type="text"]:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
}
#demo-content button {
  padding: 0.5rem 1rem;
  font-size: 0.925rem;
  font-weight: 600;
  border: none;
  border-radius: 0.375rem;
  background: #3b82f6;
  color: #fff;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s;
}
#demo-content button:hover {
  background: #2563eb;
}
:is(.dark) #demo-content button {
  background: #2563eb;
}
:is(.dark) #demo-content button:hover {
  background: #3b82f6;
}
#demo-content ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
#demo-content li {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #e5e5e5;
  font-size: 0.925rem;
  color: #262626;
}
#demo-content li:first-child {
  border-top: 1px solid #e5e5e5;
}
:is(.dark) #demo-content li {
  border-bottom-color: #404040;
  color: #e5e5e5;
}
:is(.dark) #demo-content li:first-child {
  border-top-color: #404040;
}
</style>

<script>
server.get("/demo", (req) => formTemplate());

server.post("/note", (req) => {
  const note = req.params["note-text"];
  if (note) {
    return `<li>${note}</li>`;
  }
});

const formTemplate = () => `
<form hx-post="/note" hx-target="#notes" hx-swap="afterbegin"
      hx-on::after-request="if(event.detail.successful) this.reset()">
  <div>
    <label>Add a note</label>
    <input type="text" name="note-text" placeholder="blank canvas">
  </div>
  <button>Add</button>
</form>
<ul id="notes"></ul>`;

server.start("/demo");
</script>
