---
title: "Infinite Scroll"
description: Load content when you scroll to bottom
icon: "icon-[mdi--arrow-expand-down]"
---

<script>
server.get("/demo", () => `
<div class="relative">
  <div class="max-h-[300px] overflow-y-auto mask-b-from-60%">
    <table class="w-full border-collapse">
      <thead><tr><th class="text-left px-3 py-2 text-neutral-450 dark:text-neutral-400 font-semibold text-xs uppercase tracking-wide sticky top-0 bg-white dark:bg-neutral-930 z-10 shadow-[inset_0_-1px_0_var(--color-neutral-100)] dark:shadow-[inset_0_-1px_0_var(--color-neutral-850)]">Name</th><th class="text-left px-3 py-2 text-neutral-450 dark:text-neutral-400 font-semibold text-xs uppercase tracking-wide sticky top-0 bg-white dark:bg-neutral-930 z-10 shadow-[inset_0_-1px_0_var(--color-neutral-850)]">Email</th></tr></thead>
      <tbody class="[&>tr:last-child>td]:border-b-0">${rows(0)}</tbody>
    </table>
  </div>
  <div class="absolute -bottom-2 inset-x-0 flex justify-center pointer-events-none">
    <span class="text-[0.6875rem] text-neutral-600 dark:text-neutral-400 flex items-center gap-1">Scroll to load more <span class="translate-y-px">&darr;</span></span>
  </div>
</div>`);

server.get(/\/contacts.*/, (req) => rows(parseInt(req.params.page)));

function rows(page) {
    const PAGE_SIZE = 3;
    const start = page * PAGE_SIZE;
    let html = Array.from({ length: PAGE_SIZE }, (_, i) => {
        const n = start + i;
        return `<tr class="starting:opacity-0 transition-opacity duration-300 ease-out"><td class="px-3 py-2.5 border-b border-neutral-100 dark:border-neutral-850 text-sm text-neutral-600 dark:text-neutral-300">Agent Smith</td><td class="px-3 py-2.5 border-b border-neutral-100 dark:border-neutral-850 text-sm text-neutral-600 dark:text-neutral-300">agent${n}@smith.org</td></tr>`;
    }).join("\n");

    html += `
    <tr class="starting:opacity-0 transition-opacity duration-300 ease-out" hx-get="/contacts?page=${page + 1}"
        hx-trigger="intersect once"
        hx-swap="outerHTML">
        <td colspan="2" class="px-3 py-2.5 text-center text-[0.8125rem] italic text-neutral-400 dark:text-neutral-600 border-b border-neutral-100 dark:border-neutral-850">Loading more...</td>
    </tr>`;
    return html;
}

server.start("/demo");
</script>

<div id="demo-content" class="not-prose demo-container min-h-[380px]"></div>

## Basic usage

On the client, put a placeholder row at the end of your table.

```html
<tr hx-get="/contacts?page=2"
    hx-swap="outerHTML"
    hx-trigger="revealed">
  <td>Loading more...</td>
</tr>
```

- [`hx-get`](/reference/attributes/hx-get) requests `/contacts?page=2`.
- [`hx-swap`](/reference/attributes/hx-swap)=[`"outerHTML"`](/reference/attributes/hx-swap#outerhtml) sets the strategy to replace the target.
- [`hx-trigger`](/reference/attributes/hx-trigger)=[`"revealed"`](/reference/attributes/hx-trigger#revealed) fires when the element scrolls into view. Use [`intersect`](/reference/attributes/hx-trigger#intersect) [`once`](/reference/attributes/hx-trigger#once) instead if your container has `overflow-y: scroll`.

On the server, respond with the next rows plus a fresh placeholder pointing to `?page=3`:

```html
<tr><td>Agent Smith</td><td>agent10@smith.org</td></tr>
<tr><td>Agent Smith</td><td>agent11@smith.org</td></tr>
<tr><td>Agent Smith</td><td>agent12@smith.org</td></tr>

<!-- When there are no more pages, just omit this row -->
<tr hx-get="/contacts?page=3"
    hx-swap="outerHTML"
    hx-trigger="revealed">
  <td>Loading more...</td>
</tr>
```

Because [`outerHTML`](/reference/attributes/hx-swap#outerhtml) replaces the old placeholder, the new one takes its place, creating a self-extending chain.
