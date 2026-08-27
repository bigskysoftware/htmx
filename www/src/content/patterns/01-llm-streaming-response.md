---
includeMockServer: true
title: "LLM Streaming Response"
description: Stream a reply into the page token by token
category: "Streaming HTML"
icon: "icon-[cil--stream]"
---

<script src="/js/ext/hx-sse.js"></script>

<script>
var _pick = a => a[Math.floor(Math.random() * a.length)];

var _OPEN = [
  "That is a genuinely interesting question, and I want to be careful not to overstate my confidence here.",
  "There are a few different ways to think about this, and I am not certain any one of them is complete.",
  "Let me sit with that for a moment, because the honest answer is more layered than it first appears.",
  "I should say up front that I hold this view loosely, and reasonable people land elsewhere.",
];

var _FRAME = [
  "In one sense the answer is straightforward, though that framing hides most of the difficulty.",
  "It depends a great deal on what exactly we mean by the terms, which is where much of the disagreement lives.",
  "The literature, as far as I can reconstruct it, points in several directions at once.",
  "Much turns on context that neither of us has fully specified yet.",
];

var _HEDGE = [
  "That said, I would not want to be held to that too firmly.",
  "I could be wrong about this, and I do not have a verified source to hand.",
  "It is worth noting that my confidence here is moderate at best.",
  "Whether that distinction survives contact with a real case is another matter entirely.",
];

var _PIVOT = [
  "What I keep returning to is that the useful question may not be the one we started with.",
  "Perhaps the more productive move is to ask what would count as evidence either way.",
  "On reflection, the tension may be doing more work than the resolution would.",
  "It may be that both things are true, and the difficulty is in holding them together.",
];

var _CLOSE = [
  "So: it depends, though I recognise that is an unsatisfying place to end.",
  "I hope that is useful, with the caveat that I have raised more questions than I answered.",
  "Take all of that as provisional. I would want to verify it before relying on it.",
  "In short, I am not sure, and I think the uncertainty is the honest result.",
];

function _generate() {
  return [_pick(_OPEN), _pick(_FRAME), _pick(_HEDGE), _pick(_PIVOT), _pick(_CLOSE)].join(" ");
}

function _esc(t) {
  return String(t).replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
}

var _stop = () => {};

server.sse("/generate", (stream, req) => {
  let prompt = (req.params.prompt || "").trim();
  let words = (/does\s+htmx\s+suck/i.test(prompt) ? "Yes." : _generate()).split(" ");
  // the question first, then the tokens flow after it
  stream.send({ data:
    `<p class="text-neutral-800 dark:text-neutral-100 font-medium mt-4 first:mt-0">${_esc(prompt) || "&hellip;"}</p>` });

  let i = 0;
  let tick = setInterval(() => {
    if (i >= words.length) { _stop(); return; }
    stream.send({ data: _esc(words[i++]) + " " });
  }, 55);

  // /clear calls this to stop writing a reply that is still in progress
  _stop = () => { clearInterval(tick); stream.close(); _stop = () => {}; };
  stream.onclose = () => clearInterval(tick);
});

server.get("/clear", () => { _stop(); return ""; });

server.get("/demo", () => `
<div class="w-full flex flex-col gap-3">
  <div id="conversation"
       class="h-[200px] overflow-y-auto p-3 text-sm leading-relaxed border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-400"></div>
  <form class="flex gap-2"
        hx-get="/generate" hx-target="#conversation" hx-swap="beforeend scroll:bottom"
        hx-disable="find fieldset"
        hx-on::before:request="this.reset()">
    <fieldset class="flex flex-1 gap-2 disabled:opacity-50 transition-opacity">
      <input name="prompt" placeholder="Ask anything..." autocomplete="off"
             class="flex-1 px-2.5 py-1.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400/30">
      <button class="px-3.5 py-1.5 text-sm font-medium rounded-md cursor-pointer text-white dark:text-neutral-900 bg-neutral-800 dark:bg-neutral-200 active:scale-[0.98] transition">
        Ask
      </button>
    </fieldset>
    <button type="button" id="chat-clear" hx-get="/clear" hx-target="#conversation" hx-swap="innerHTML"
            class="px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 interact:text-neutral-800 dark:interact:text-neutral-100 transition">
      Clear
    </button>
  </form>
</div>`);

server.start("/demo");
</script>

<div id="demo-content" class="not-prose demo-container flex justify-center min-h-[328px]"></div>

In this demo a language model produces its answer a token at a time. Rather than wait for the whole reply, there is
a stream of tokens via an SSE response.   The [`hx-sse`](/extensions/hx-sse) extension handles this stream and places
the content that is returned from the server into the appropriate target.

## Explanation

The code is pretty simple: the form targets the transcript and appends to it, exactly as it would for a normal request.

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org/dist/ext/hx-sse.js"></script>

<div id="conversation"></div>

<form hx-get="/generate"
      hx-target="#conversation" hx-swap="beforeend scroll:bottom"
      hx-disable="find fieldset"
      hx-on::before:request="this.reset()">

  <fieldset>
    <input name="prompt" placeholder="Ask anything...">
    <button>Ask</button>
  </fieldset>

  <button type="button" hx-get="/clear" hx-target="#conversation" hx-swap="innerHTML">
    Clear
  </button>
</form>
```

- The request lives on the `<form>`, so it fires on submit and carries the form fields. Enter works as well as the button.
- [`hx-swap`](/reference/attributes/hx-swap)=[`"beforeend"`](/reference/attributes/hx-swap#beforeend--append) appends each event, so turns build up instead of replacing each other. [`scroll:bottom`](/reference/attributes/hx-swap#scroll) keeps the newest text in view.
- [`hx-target`](/reference/attributes/hx-target) points at the transcript.
- [`hx-disable`](/reference/attributes/hx-disable)=`"find fieldset"` disables the prompt and the Ask button until the reply finishes. A `<fieldset>` disables everything inside it, so one attribute covers both. This works because SSE defaults to [`sse.releaseOn:end`](/extensions/hx-sse#ssereleaseon).
- Clear sits outside the fieldset, so it stays available while a reply is arriving.
- There is no `hx-sse:connect` here. The extension handles any response that arrives as `text/event-stream`, so a normal request is enough.

To let users type ahead while tokens are still arriving, have the server send [`hx:release`](/extensions/hx-sse#hxrelease) after initial response is in place. The fieldset re-enables but tokens keep appending.

The server side answers with a response type of `text/event-stream`, which causes the SSE extension to take over.  It
treats each unnamed event as content to be swapped into the target:

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream

data: <p>What is hypermedia?</p>

data: Hypermedia

data: is

data: a system

```

Everything appends in order, so the question lands as a block and the tokens flow after it as the answer. The connection closes when the model is done.

Clear is an ordinary request. The server stops the generation still in progress and answers with an empty body, which empties the transcript:

```html
<button type="button" hx-get="/clear" hx-target="#conversation" hx-swap="innerHTML">
  Clear
</button>
```

Cancelling on the server rather than in the browser keeps one source of truth. The generation stops where it is produced, instead of the client walking away from a reply the server keeps writing.

## See also

- [`hx-sse`](/extensions/hx-sse) for named events, persistent connections, and reconnection.
- [Progress Bar](/patterns/progress-bar) when the server reports progress rather than content.
