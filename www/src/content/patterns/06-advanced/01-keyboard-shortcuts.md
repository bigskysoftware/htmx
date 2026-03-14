---
title: "Keyboard Shortcuts"
description: Bind keyboard shortcuts to interactive elements
icon: "icon-[mdi--keyboard]"
---

<div id="demo-content" class="not-prose demo-container"></div>

This example binds a global keyboard shortcut to a button that loads content from the server:

```html
<button class="btn primary"
        hx-trigger="click, keyup[altKey&&shiftKey&&key=='D'] from:body"
        hx-post="/doit">
  Do It! (Alt-Shift-D)
</button>
```

The button responds to both `click` and the `keyup` event for Alt-Shift-D.
The `from:body` modifier makes the shortcut global — the listener is on the `<body>`, not the button itself.

Try the demo below by clicking the button or pressing Alt-Shift-D.

For details on key event properties, see
[Keyboard Events on javascript.info](https://javascript.info/keyboard-events).

<style>
  #demo-content button {
    font-size: 1rem;
    padding: 0.75rem 1.5rem;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
  }
  #demo-content button:hover {
    background: #1d4ed8;
  }
  :is(.dark) #demo-content button {
    background: #3b82f6;
  }
  :is(.dark) #demo-content button:hover {
    background: #2563eb;
  }
  #demo-content .shortcut-result {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: #dcfce7;
    color: #166534;
    border-radius: 0.375rem;
    font-weight: 600;
  }
  :is(.dark) #demo-content .shortcut-result {
    background: #166534;
    color: #bbf7d0;
  }
</style>

<script>
  server.get("/init", (req) =>
    `<button hx-trigger="click, keyup[altKey&&shiftKey&&key=='D'] from:body"
             hx-post="/doit">
       Do It! (Alt-Shift-D)
     </button>`
  );

  server.post("/doit", (req) =>
    `<span class="shortcut-result">Done!</span>`
  );

  server.start("/init");
</script>
