---
title: "Keyboard Shortcuts"
description: Bind keyboard shortcuts to interactive elements
icon: "icon-[mdi--keyboard]"
soon: true
---

<script>
server.get("/init", () => `
<div class="flex items-center gap-4">
  <button class="px-4 py-2 text-sm font-medium rounded-md cursor-pointer text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-850 hover:text-neutral-800 dark:hover:text-neutral-100 active:scale-[0.98] transition"
          hx-trigger="click, keyup[altKey&&shiftKey&&key=='D'] from:body"
          hx-post="/doit"
          hx-target="#result">
    Do It! (Alt+Shift+D)
  </button>
  <span id="result"></span>
</div>`);

server.post("/doit", () =>
  `<span class="inline-block px-3 py-1.5 rounded-md text-sm font-semibold bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 starting:opacity-0 transition-opacity duration-300">Done!</span>`
);

server.start("/init");
</script>

<div id="demo-content" class="not-prose demo-container flex justify-center"></div>

## Basic usage

On the client, add a keyboard event to `hx-trigger` alongside `click`.

```html
<button hx-trigger="click, keyup[altKey&&shiftKey&&key=='D'] from:body"
        hx-post="/doit">
  Do It! (Alt+Shift+D)
</button>
```

- [`hx-trigger`](/reference/attributes/hx-trigger) accepts multiple events separated by commas.
- `keyup[altKey&&shiftKey&&key=='D']` uses an [event filter](/reference/attributes/hx-trigger#event-filters) to match only the Alt+Shift+D combination.
- [`from:body`](/reference/attributes/hx-trigger#from) makes the shortcut global: the listener is on the `<body>`, not the button itself.

On the server, respond with the result content:

```html
<span>Done!</span>
```

## Notes

### Keyboard event properties

The filter expression inside `[...]` has access to the raw [KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent) properties: `key`, `code`, `altKey`, `ctrlKey`, `shiftKey`, and `metaKey`. Combine them with `&&` and `||` to match any shortcut.

For details on key values, see [Keyboard Events on javascript.info](https://javascript.info/keyboard-events).
