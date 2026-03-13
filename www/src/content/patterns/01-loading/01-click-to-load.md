---
title: "Click to Load"
description: Load more items on demand
icon: "icon-[mdi--cursor-pointer]"
---

Place a button in the last row of your table. Use [`hx-get`](/reference/attributes/hx-get) to fetch the next page, [`hx-target`](/reference/attributes/hx-target) to target the row it sits in, and [`hx-swap`](/reference/attributes/hx-swap) to replace it entirely:

```html
<tr id="load-more">
  <td colspan="2">
    <button hx-get="/contacts/?page=2"
            hx-target="#load-more"
            hx-swap="outerHTML">
      Load More
    </button>
  </td>
</tr>
```

The server responds with new rows **and a new button** pointing to the next page:

```html
<tr>
  <td>Kim Yee</td>
  <td>kim@yee.org</td>
</tr>
<tr id="load-more">
  <td colspan="2">
    <button hx-get="/contacts/?page=3"
            hx-target="#load-more"
            hx-swap="outerHTML">
      Load More
    </button>
  </td>
</tr>
```

Each click extends the list and produces a fresh button. No client-side state needed. When there are no more pages, omit the button.

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
    <tr id="load-more"><td colspan="2" class="p-0">
        <button class="${btn}"
                hx-get="/contacts/?page=${page + 1}"
                hx-target="#load-more"
                hx-swap="outerHTML">
            Load More &#8595;
        </button>
    </td></tr>`;
    }
    return html;
}

server.start("/demo");
</script>
