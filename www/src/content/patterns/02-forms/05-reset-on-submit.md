---
title: "Reset on Submit"
description: Clear form inputs after submission
icon: "icon-[mdi--eraser]"
---

<script>
var _replyIndex = 0;

server.get("/demo", () => {
  const inputCls = "flex-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-900 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none";
  const btnCls = "px-4 py-2 text-sm font-semibold rounded-lg text-white bg-neutral-800 dark:text-neutral-900 dark:bg-neutral-200 cursor-pointer interact:bg-neutral-700 dark:interact:bg-neutral-300 active:scale-[0.98] transition";
  return `
<div class="flex flex-col h-[300px]">
  <div id="messages" class="flex-1 overflow-y-auto space-y-3 pb-3 pr-3 scrollbar-subtle"></div>
  <form class="flex gap-2 shrink-0 mt-3"
        hx-post="/chat" hx-target="#messages" hx-swap="beforeend"
        hx-on:htmx:after:request="this.reset()"
        hx-on:htmx:after:swap="document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight">
    <input type="text" name="message" placeholder="Send a message…" required autocomplete="off"
           class="${inputCls}">
    <button class="${btnCls}">Send</button>
  </form>
</div>`;
});

server.post("/chat", (req) => {
  const replies = [
    "have you tried just returning HTML",
    "look, just use a form. forms have been working since 1993",
    "you're mass producing artisanal web apps now. welcome to the club",
    "hypermedia is how the web was meant to work. we just forgot for a bit",
    "the browser already knows how to do this. we just had to get out of its way",
  ];
  const msg = req.params["message"];
  if (!msg) return;
  const reply = replies[_replyIndex++ % replies.length];
  return `
    <div class="starting:opacity-0 starting:translate-y-1 transition duration-300 ease-out flex justify-end">
      <div class="rounded-lg rounded-br-sm bg-blue-600 dark:bg-blue-500 px-3.5 py-2 text-sm text-white max-w-[75%]">${msg}</div>
    </div>
    <div class="starting:opacity-0 starting:translate-y-1 flex" style="transition:opacity 300ms ease-out 400ms,transform 300ms ease-out 400ms">
      <div class="rounded-lg rounded-bl-sm bg-neutral-100 dark:bg-neutral-900 px-3.5 py-2 text-sm text-neutral-700 dark:text-neutral-300 max-w-[75%]">${reply}</div>
    </div>`;
});

server.start("/demo");
</script>

<div id="demo-content" class="not-prose demo-container min-h-[380px]"></div>

## Basic usage

On the client, wrap your inputs in a `<form>` and use [`hx-on`](/reference/attributes/hx-on) to reset it after each successful request.

```html
<form hx-post="/chat"
      hx-target="#messages"
      hx-swap="beforeend"
      hx-on:htmx:after:request="this.reset()">
    <input type="text" name="message">
    <button>Send</button>
</form>
<div id="messages"></div>
```

- [`hx-post`](/reference/attributes/hx-post) submits the form to `/chat`.
- [`hx-target`](/reference/attributes/hx-target) points at the `#messages` container.
- [`hx-swap`](/reference/attributes/hx-swap)=[`"beforeend"`](/reference/attributes/hx-swap#beforeend) appends each new message to the bottom.
- [`hx-on:htmx:after:request`](/reference/attributes/hx-on) listens for the [`htmx:after:request`](/reference/events/htmx-after-request) event and calls `this.reset()` to clear the form.

On the server, respond with the new message:

```html
<div class="message user">Hello!</div>
<div class="message bot">Hi there! How can I help?</div>
```

## Notes

### Without a form element

The `reset()` method is only available on `<form>` elements. For standalone inputs, select the element and clear its value directly:

```html
<input id="chat-input" type="text" name="message">
<button hx-post="/chat"
        hx-target="#messages"
        hx-swap="beforeend"
        hx-include="#chat-input"
        hx-on:htmx:after:request="document.getElementById('chat-input').value = ''">
    Send
</button>
```

- [`hx-include`](/reference/attributes/hx-include) tells the button which input to include in the request, since it is outside the button element.
