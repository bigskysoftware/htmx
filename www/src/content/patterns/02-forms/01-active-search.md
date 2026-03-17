---
title: Active Search
description: Filter search results as you type
icon: "icon-[mdi--magnify]"
---

<script>
server.get("/demo", () => searchUI());

server.post(/\/search.*/, (req) => {
  const search = req.params["search"] || "";
  return resultsUI(findContacts(search));
});

function searchUI() {
  return `
<div>
  <span class="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-3 block">Search Contacts</span>
  <div class="relative">
    <input type="search"
           name="search" placeholder="Begin typing to search..."
           class="w-full px-3 py-2 [&::-webkit-search-cancel-button]:hidden border border-neutral-200 dark:border-neutral-700 rounded-md text-sm bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 outline-none transition-colors focus:border-neutral-400 dark:focus:border-neutral-500 focus:ring-2 focus:ring-neutral-400/15 dark:focus:ring-neutral-500/20 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
           hx-post="/search"
           hx-trigger="input changed delay:200ms, keyup[key=='Enter'], load"
           hx-target="#search-results"
           hx-swap="innerHTML"
           hx-indicator="#search-spinner">
    <span id="search-spinner" class="absolute right-3.5 top-1/2 -translate-y-1/2 size-3.5 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-700 dark:border-t-neutral-300 rounded-full animate-spin [animation-duration:0.5s] opacity-0 [&.htmx-request]:opacity-100 text-neutral-700 dark:text-neutral-300 transition-opacity duration-200"></span>
  </div>
  <table class="w-full border-collapse mt-3">
    <thead>
      <tr>
        <th class="text-left px-3 py-2 text-neutral-450 dark:text-neutral-400 font-semibold text-xs uppercase tracking-wide sticky top-0 bg-white dark:bg-neutral-930 z-10 shadow-[inset_0_-1px_0_var(--color-neutral-100)] dark:shadow-[inset_0_-1px_0_var(--color-neutral-850)]">First Name</th>
        <th class="text-left px-3 py-2 text-neutral-450 dark:text-neutral-400 font-semibold text-xs uppercase tracking-wide sticky top-0 bg-white dark:bg-neutral-930 z-10 shadow-[inset_0_-1px_0_var(--color-neutral-100)] dark:shadow-[inset_0_-1px_0_var(--color-neutral-850)]">Last Name</th>
        <th class="text-left px-3 py-2 text-neutral-450 dark:text-neutral-400 font-semibold text-xs uppercase tracking-wide sticky top-0 bg-white dark:bg-neutral-930 z-10 shadow-[inset_0_-1px_0_var(--color-neutral-100)] dark:shadow-[inset_0_-1px_0_var(--color-neutral-850)]">Email</th>
      </tr>
    </thead>
    <tbody id="search-results" class="[&>tr:last-child>td]:border-b-0">
    </tbody>
  </table>
</div>`;
}

function resultsUI(contacts) {
  return contacts.map((c) =>
    `<tr class="starting:opacity-0 transition-opacity duration-150 ease-out"><td class="px-3 py-2.5 border-b border-neutral-100 dark:border-neutral-850 text-sm text-neutral-600 dark:text-neutral-300">${c.first}</td><td class="px-3 py-2.5 border-b border-neutral-100 dark:border-neutral-850 text-sm text-neutral-600 dark:text-neutral-300">${c.last}</td><td class="px-3 py-2.5 border-b border-neutral-100 dark:border-neutral-850 text-sm text-neutral-600 dark:text-neutral-300">${c.email}</td></tr>`
  ).join("\n");
}

function findContacts(str) {
  const contacts = [
    { first: "Venus",     last: "Grimes",    email: "venus.grimes@example.com" },
    { first: "Fletcher",  last: "Owen",      email: "fletcher.owen@example.com" },
    { first: "William",   last: "Hale",      email: "william.hale@example.com" },
    { first: "TaShya",    last: "Cash",      email: "tashya.cash@example.com" },
    { first: "Jakeem",    last: "Walker",    email: "jakeem.walker@example.com" },
    { first: "Malcolm",   last: "Trujillo",  email: "malcolm.trujillo@example.com" },
    { first: "Wynne",     last: "Rice",      email: "wynne.rice@example.com" },
  ];
  const s = str.toLowerCase();
  return contacts.filter((c) =>
    c.first.toLowerCase().includes(s) ||
    c.last.toLowerCase().includes(s) ||
    c.email.toLowerCase().includes(s)
  );
}

server.start("/demo");
</script>

<div id="demo-content" class="not-prose demo-container min-h-[482px]"></div>

## Basic usage

On the client, create a search input that targets a results container.

```html
<input type="search" name="search"
       hx-post="/search"
       hx-trigger="input changed delay:200ms, keyup[key=='Enter'], load"
       hx-target="#results"
       hx-indicator=".htmx-indicator">

<tbody id="results"></tbody>
```

- [`hx-post`](/reference/attributes/hx-post) sends the input value to `/search`.
- [`hx-trigger`](/reference/attributes/hx-trigger) combines three triggers:
  - [`input`](https://developer.mozilla.org/en-US/docs/Web/API/Element/input_event) [`changed`](/reference/attributes/hx-trigger#changed) [`delay:200ms`](/reference/attributes/hx-trigger#delay) debounces keystrokes and ignores keys that don't change the value (e.g. arrows).
  - `keyup[key=='Enter']` sends immediately on Enter, using an [event filter](/reference/attributes/hx-trigger#event-filters).
  - [`load`](/reference/attributes/hx-trigger#load) populates the table on page load.
- [`hx-target`](/reference/attributes/hx-target) puts the response into the `#results` tbody.
- [`hx-indicator`](/reference/attributes/hx-indicator) shows a loading indicator while the request is in flight.

On the server, respond with matching table rows:

```html
<tr>
  <td>Venus</td>
  <td>Grimes</td>
  <td>venus.grimes@example.com</td>
</tr>
<tr>
  <td>Fletcher</td>
  <td>Owen</td>
  <td>fletcher.owen@example.com</td>
</tr>
```

## Notes

### Indicators

The [`htmx-indicator`](/reference/attributes/hx-indicator) class hides an element by default and shows it while a request is in flight:

```html
<span class="htmx-indicator">Searching...</span>
```
