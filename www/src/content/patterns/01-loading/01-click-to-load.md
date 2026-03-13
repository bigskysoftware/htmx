---
title: "Click to Load"
description: Load more items when you click a button
icon: "icon-[mdi--cursor-pointer]"
---

Place a button in the last row of your table:

```html
<tr>
  <td>
    <button hx-get="/contacts/?page=2"
            hx-swap="outerHTML"
            hx-target="closest tr">
      Load More
    </button>
  </td>
</tr>
```

- [`hx-get`](/reference/attributes/hx-get) fetches the next page.
- [`hx-swap`](/reference/attributes/hx-swap)=[`"outerHTML"`](/reference/attributes/hx-swap#outerhtml) swaps it in by replacing the entire element.
- [`hx-target`](/reference/attributes/hx-target)=[`"closest tr"`](/docs/features/extended-selectors#closest-selector) targets the row the button sits in.

The server responds with new rows and a fresh button pointing to the next page. Each click extends the list. No client-side state needed.

When there are no more pages, omit the button.

<script>
const contacts = [
    { name: "Joe Smith", email: "joe@smith.org" },
    { name: "Angie MacDowell", email: "angie@macdowell.org" },
    { name: "Fuqua Tarkenton", email: "fuqua@tarkenton.org" },
    { name: "Kim Yee", email: "kim@yee.org" },
    { name: "Alan Partridge", email: "alan@partridge.co.uk" },
    { name: "Dana Scully", email: "dana@fbi.gov" },
];

const tr = "starting:opacity-0 starting:translate-y-1 transition-all duration-300 ease-out";
const th = "text-left px-3 py-2 text-neutral-450 dark:text-neutral-400 font-semibold text-xs uppercase tracking-wide border-b border-neutral-200 dark:border-neutral-750";
const td = "px-3 py-2.5 border-b border-neutral-100 dark:border-neutral-850 text-sm text-neutral-600 dark:text-neutral-300";
const btn = "w-full flex items-center justify-center gap-1.5 mt-2 px-3 py-2.5 text-[0.8125rem] font-medium text-neutral-500 dark:text-neutral-500 bg-transparent border-none rounded-md cursor-pointer transition-all hover:bg-neutral-75 dark:hover:bg-neutral-875 hover:text-neutral-700 dark:hover:text-neutral-200 active:scale-[0.99]";

server.get("/demo", () => `
<table class="w-full border-collapse">
    <thead><tr><th class="${th}">Name</th><th class="${th}">Email</th></tr></thead>
    <tbody class="[&>tr:last-child>td]:border-b-0">${rows(0)}</tbody>
</table>`);

server.get(/\/contacts.*/, (req) => rows(parseInt(req.params.page)));

function rows(page) {
    const start = page * 2;
    const slice = contacts.slice(start, start + 2);
    let html = slice.map((c, i) =>
        `<tr class="${tr}" style="transition-delay:${i * 80}ms"><td class="${td}">${c.name}</td><td class="${td}">${c.email}</td></tr>`
    ).join("\n");

    if (start + 2 < contacts.length) {
        html += `
    <tr><td colspan="2" class="p-0">
        <button class="${btn}"
                hx-get="/contacts/?page=${page + 1}"
                hx-swap="outerHTML"
                hx-target="closest tr">
            Load More &#8595;
        </button>
    </td></tr>`;
    }
    return html;
}

server.start("/demo");
</script>
