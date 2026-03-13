---
title: "Infinite Scroll"
description: Load content when you scroll to bottom
icon: "icon-[mdi--arrow-expand-down]"
---
Place a sentinel row at the bottom of your list:

```html
<tr hx-get="/contacts/?page=2"
    hx-swap="outerHTML"
    hx-trigger="revealed">
  <td>Loading more...</td>
</tr>
```

- [`hx-get`](/reference/attributes/hx-get) fetches the next page.
- [`hx-swap`](/reference/attributes/hx-swap)=[`"outerHTML"`](/reference/attributes/hx-swap#outerhtml) swaps it in by replacing the sentinel with new rows and a fresh sentinel.
- [`hx-trigger`](/reference/attributes/hx-trigger)=[`"revealed"`](/reference/attributes/hx-trigger#non-standard-events) fires when the element scrolls into view. Use `intersect once` instead if your container has `overflow-y: scroll`.

This creates a self-extending chain. No client-side state needed. When there are no more pages, omit the sentinel.

<script>
const PAGE_SIZE = 10;

const tr = "starting:opacity-0 starting:translate-y-1 transition-all duration-300 ease-out";
const th = "text-left px-3 py-2 text-neutral-450 dark:text-neutral-400 font-semibold text-xs uppercase tracking-wide border-b border-neutral-200 dark:border-neutral-750";
const td = "px-3 py-2.5 border-b border-neutral-100 dark:border-neutral-850 text-sm text-neutral-600 dark:text-neutral-300";
const sentinel = "px-3 py-2.5 text-center text-[0.8125rem] italic text-neutral-400 dark:text-neutral-600 border-b border-neutral-100 dark:border-neutral-850";

server.get("/demo", () => `
<div class="max-h-[300px] overflow-y-auto mask-b-from-80%">
<table class="w-full border-collapse">
    <thead><tr><th class="${th}">Name</th><th class="${th}">Email</th></tr></thead>
    <tbody class="[&>tr:last-child>td]:border-b-0">${rows(0)}</tbody>
</table>
</div>`);

server.get(/\/contacts.*/, (req) => rows(parseInt(req.params.page)));

function rows(page) {
    const start = page * PAGE_SIZE;
    let html = Array.from({ length: PAGE_SIZE }, (_, i) => {
        const n = start + i;
        return `<tr class="${tr}"><td class="${td}">Agent Smith</td><td class="${td}">agent${n}@smith.org</td></tr>`;
    }).join("\n");

    html += `
    <tr class="${tr}" hx-get="/contacts/?page=${page + 1}"
        hx-trigger="intersect once"
        hx-swap="outerHTML">
        <td colspan="2" class="${sentinel}">Loading more...</td>
    </tr>`;
    return html;
}

server.start("/demo");
</script>
