---
title: "Click to Load"
description: Load more items when you click a button
icon: "icon-[mdi--cursor-pointer]"
---

<script>

server.get("/demo", () => `
<div class="overflow-y-auto">
  <div class="flex flex-col gap-4" id="comments">
    ${items(0)}
  </div>
</div>`);

server.get(/\/comments.*/, (req) => items(parseInt(req.params.page)));

function items(page) {
    const comments = [
        { author: "1cg", time: "2h ago", text: "daily reminder that the browser is the framework" },
        { author: "S4RF", time: "3h ago", text: "In 1997 I would have shipped this with a Perl script and a cronjob" },
        { author: "uncle k2", time: "5h ago", text: "I am begging a front end dev to look at an element in the browser DOM inspector one (1) single time." },
        { author: "gnut", time: "8h ago", text: "oh heyyy!! pretty cool experiment. A lot of IDE's hate it though, thinks they are invalid CSS properties." },
        { author: "wyrmisis", time: "12h ago", text: "Sir, another React Dev Tool has hit the browser." },
        { author: "M379KL", time: "1d ago", text: "Build step for CSS was nuts to first realize they were doing. JavaScript required for CSS also nuts." },
        { author: "fizzy", time: "1d ago", text: "I made this meme for a different conversation but in case the need ever arises for an anti-joke, here ya go" },
        { author: "Reiss", time: "2d ago", text: "this was everybody in europe 23 years ago" },
        { author: "pavlos", time: "2d ago", text: "Real" },
    ];
    const PAGE_SIZE = 3;
    const start = page * PAGE_SIZE;
    const slice = comments.slice(start, start + PAGE_SIZE);
    let html = slice.map((c, i) => `
    <div class="starting:opacity-0 starting:translate-y-1 transition duration-300 ease-out flex gap-3" style="transition-delay:${i * 80}ms">
      <div class="size-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 shrink-0">
        ${c.author.split(' ').map(w => w[0]).join('')}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-baseline gap-2 mb-0.5">
          <span class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">${c.author}</span>
          <span class="text-xs text-neutral-600 dark:text-neutral-400">${c.time}</span>
        </div>
        <p class="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">${c.text}</p>
      </div>
    </div>`).join("\n");

    if (start + PAGE_SIZE < comments.length) {
        html += `
    <button class="w-full flex items-center justify-center gap-2.5 py-2 text-[0.8125rem] font-medium bg-transparent rounded-md cursor-pointer transition hover:bg-neutral-75 dark:hover:bg-neutral-850 hover:text-neutral-700 dark:hover:text-neutral-200 active:scale-[0.98] starting:opacity-0 starting:translate-y-1 transition duration-300 ease-out"
            hx-get="/comments/?page=${page + 1}"
            hx-swap="outerHTML"
            hx-target="this">
        Show more comments <span class="translate-y-px">&#8595;</span>
    </button>`;
    }
    return html;
}

server.start("/demo");
</script>

<div id="demo-content" class="not-prose demo-container min-h-[328px]"></div>

## Basic usage

On the client, put a button at the end of your list.

```html
<button hx-get="/comments?page=2"
        hx-swap="outerHTML"
        hx-target="this">
  Show more comments
</button>
```

When clicked, it extends the list (without any client-side state).

- [`hx-get`](/reference/attributes/hx-get) requests `/comments?page=2`.
- [`hx-swap`](/reference/attributes/hx-swap)=[`"outerHTML"`](/reference/attributes/hx-swap#outerhtml) sets the strategy to replace the target.
- [`hx-target`](/reference/attributes/hx-target)=[`"this"`](/reference/attributes/hx-target#this) sets the target to itself.

On the server, respond with the next items plus a button pointing to `?page=3`:

```html
<div class="comment">...</div>
<div class="comment">...</div>
<div class="comment">...</div>

<!-- When there are no more pages, just omit this button -->
<button hx-get="/comments/?page=3"
        hx-swap="outerHTML"
        hx-target="this">
  Show more comments
</button>
```

Because [`outerHTML`](/reference/attributes/hx-swap#outerhtml) replaces the old button, the new one takes its place.
