---
title: "Click to Load"
description: Load more items when you click a button
icon: "icon-[mdi--cursor-pointer]"
---

Place a button at the end of your list that loads the next page:

```html
<button hx-get="/comments/?page=2"
        hx-swap="outerHTML"
        hx-target="this">
  Show more comments
</button>
```

- [`hx-get`](/reference/attributes/hx-get) fetches the next page.
- [`hx-swap`](/reference/attributes/hx-swap)=[`"outerHTML"`](/reference/attributes/hx-swap#outerhtml) replaces the button itself with the new content.

The server responds with more items and a fresh button pointing to the next page. Each click extends the list. No client-side state needed.

When there are no more pages, omit the button.

<script>
const comments = [
    { author: "1cg", time: "2h ago", text: "daily reminder that the browser is the framework" },
    { author: "S3RF", time: "3h ago", text: "In 1997 I would have shipped this with a Perl script and a cronjob" },
    { author: "uncle j1", time: "5h ago", text: "I am begging a front end dev to look at an element in the browser DOM inspector one (1) single time." },
    { author: "gnat", time: "8h ago", text: "oh heyyy!! pretty cool experiment. A lot of IDE's hate it though, thinks they are invalid CSS properties." },
    { author: "wyrmisis", time: "12h ago", text: "Sir, another React Dev Tool has hit the browser." },
    { author: "N278JM", time: "1d ago", text: "Build step for CSS was nuts to first realize they were doing. JavaScript required for CSS also nuts." },
    { author: "bubbles", time: "1d ago", text: "I made this meme for a different conversation but in case the need ever arises for an anti-joke, here ya go" },
    { author: "Riess", time: "2d ago", text: "this was everybody in europe 23 years ago" },
    { author: "petros", time: "2d ago", text: "Real" },
];

const PAGE_SIZE = 3;
const fade = "starting:opacity-0 starting:translate-y-1 transition-all duration-300 ease-out";
const avatar = "size-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 shrink-0";
const btn = "w-full flex items-center justify-center gap-1.5 py-2.5 text-[0.8125rem] font-medium text-neutral-600 dark:text-neutral-400 bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-md cursor-pointer transition-all hover:bg-neutral-50 dark:hover:bg-neutral-875 hover:text-neutral-700 dark:hover:text-neutral-200 active:scale-[0.99]";

server.get("/demo", () => `
<div class="max-h-[300px] overflow-y-auto">
  <div class="flex flex-col gap-4" id="comments">
    ${items(0)}
  </div>
</div>`);

server.get(/\/comments.*/, (req) => items(parseInt(req.params.page)));

function items(page) {
    const start = page * PAGE_SIZE;
    const slice = comments.slice(start, start + PAGE_SIZE);
    let html = slice.map((c, i) => `
    <div class="${fade} flex gap-3" style="transition-delay:${i * 80}ms">
      <div class="${avatar}">${c.author.split(' ').map(w => w[0]).join('')}</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-baseline gap-2 mb-0.5">
          <span class="text-sm font-semibold text-neutral-800 dark:text-neutral-200">${c.author}</span>
          <span class="text-xs text-neutral-400 dark:text-neutral-500">${c.time}</span>
        </div>
        <p class="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">${c.text}</p>
      </div>
    </div>`).join("\n");

    if (start + PAGE_SIZE < comments.length) {
        html += `
    <button class="${btn} ${fade}" style="transition-delay:${slice.length * 80}ms"
            hx-get="/comments/?page=${page + 1}"
            hx-swap="outerHTML"
            hx-target="this">
        Show more comments &#8595;
    </button>`;
    }
    return html;
}

server.start("/demo");
</script>
