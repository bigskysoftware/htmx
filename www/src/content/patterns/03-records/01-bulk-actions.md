---
includeMockServer: true
title: "Bulk Actions"
description: Perform actions on multiple records
icon: "icon-[mdi--checkbox-multiple-marked]"
---

<script>
var _dataStore = (() => {
  const data = {
    "joe@smith.org": { name: "Joe Smith", status: "Active" },
    "angie@macdowell.org": { name: "Angie MacDowell", status: "Active" },
    "fuqua@tarkenton.org": { name: "Fuqua Tarkenton", status: "Active" },
    "kim@yee.org": { name: "Kim Yee", status: "Inactive" },
  };

  return {
    all() { return data; },
    activate(emails) {
      let n = 0;
      for (const e of emails) { if (data[e] && data[e].status !== "Active") { data[e].status = "Active"; n++; } }
      return n;
    },
    deactivate(emails) {
      let n = 0;
      for (const e of emails) { if (data[e] && data[e].status !== "Inactive") { data[e].status = "Inactive"; n++; } }
      return n;
    },
    remove(emails) {
      let n = 0;
      for (const e of emails) { if (data[e]) { delete data[e]; n++; } }
      return n;
    },
  };
})();

function renderList(message) {
  const contacts = _dataStore.all();
  return `<form hx-target:inherited="this" hx-swap="outerHTML">
  <div id="action-bar" class="hidden items-center gap-2 px-3 py-2.5 mb-3 rounded-md bg-neutral-50 dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800">
    <span class="text-xs font-medium text-neutral-500 dark:text-neutral-400 mr-1">With selected:</span>
    <button hx-post="/activate" class="px-2.5 py-1 text-xs font-medium rounded cursor-pointer border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-[0.98] transition">Activate</button>
    <button hx-post="/deactivate" class="px-2.5 py-1 text-xs font-medium rounded cursor-pointer border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-[0.98] transition">Deactivate</button>
    <button hx-post="/delete" class="px-2.5 py-1 text-xs font-medium rounded cursor-pointer border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 active:scale-[0.98] transition">Delete</button>
  </div>
  <table class="w-full border-collapse">
    <thead>
      <tr>
        <th class="w-10 px-3 py-2 text-center border-b-2 border-neutral-100 dark:border-neutral-850">
          <input type="checkbox" class="size-4 cursor-pointer accent-neutral-800 dark:accent-neutral-300"
                 _="on change set checked to my.checked then for cb in <input[name='selected']/> in closest <form/> set cb.checked to checked then send checkChange to closest <form/>">
        </th>
        <th class="text-left px-3 py-2 text-neutral-450 dark:text-neutral-400 font-semibold text-xs uppercase tracking-wide border-b-2 border-neutral-100 dark:border-neutral-850">Name</th>
        <th class="text-left px-3 py-2 text-neutral-450 dark:text-neutral-400 font-semibold text-xs uppercase tracking-wide border-b-2 border-neutral-100 dark:border-neutral-850">Email</th>
        <th class="text-left px-3 py-2 text-neutral-450 dark:text-neutral-400 font-semibold text-xs uppercase tracking-wide border-b-2 border-neutral-100 dark:border-neutral-850">Status</th>
      </tr>
    </thead>
    <tbody class="[&>tr:last-child>td]:border-b-0"
           _="on change from <input[name='selected']/> or checkChange
              if (<input[name='selected']:checked/> in closest <form/>).length > 0
                remove .hidden from #action-bar then add .flex to #action-bar
              else
                add .hidden to #action-bar then remove .flex from #action-bar
              end">
      ${Object.entries(contacts).map(([email, c], i) => `
      <tr class="starting:opacity-0 transition-opacity duration-300 ease-out cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900 has-[input:checked]:bg-neutral-50 dark:has-[input:checked]:bg-neutral-900" style="transition-delay:${i * 60}ms"
          _="on click if event.target.tagName !== 'INPUT' then toggle @checked on the <input[name='selected']/> in me then send change to the <input[name='selected']/> in me">
        <td class="px-3 py-2.5 border-b border-neutral-100 dark:border-neutral-850 text-sm text-center">
          <input type="checkbox" name="selected" value="${email}" class="size-4 cursor-pointer accent-neutral-800 dark:accent-neutral-300">
        </td>
        <td class="px-3 py-2.5 border-b border-neutral-100 dark:border-neutral-850 text-sm text-neutral-600 dark:text-neutral-300">${c.name}</td>
        <td class="px-3 py-2.5 border-b border-neutral-100 dark:border-neutral-850 text-sm text-neutral-600 dark:text-neutral-300">${email}</td>
        <td class="px-3 py-2.5 border-b border-neutral-100 dark:border-neutral-850 text-sm text-neutral-600 dark:text-neutral-300">
          <span class="text-xs font-medium px-2 py-0.5 rounded-full ${c.status === "Active" ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"}">${c.status}</span>
        </td>
      </tr>`).join("")}
    </tbody>
  </table>
  ${message ? `<output class="block mt-3 px-3 py-2 rounded-md bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-700 dark:text-neutral-300">${message}</output>` : ""}
</form>`;
}

server.get("/demo", () => renderList());

server.post("/activate", (req) => {
  const emails = [].concat(req.params.selected || []);
  const n = _dataStore.activate(emails);
  return renderList(`Activated ${n} user${n !== 1 ? "s" : ""}`);
});

server.post("/deactivate", (req) => {
  const emails = [].concat(req.params.selected || []);
  const n = _dataStore.deactivate(emails);
  return renderList(`Deactivated ${n} user${n !== 1 ? "s" : ""}`);
});

server.post("/delete", (req) => {
  const emails = [].concat(req.params.selected || []);
  const n = _dataStore.remove(emails);
  return renderList(`Deleted ${n} user${n !== 1 ? "s" : ""}`);
});

server.start("/demo");
</script>

<div id="demo-content" class="not-prose demo-container min-h-[340px]"></div>

## How it works

Wrap a table in a `<form>`. Each row has a checkbox, and an action bar appears when any are checked. Clicking a row toggles its checkbox.

```html
<form id="user-list" hx-target="#user-list" hx-swap="outerHTML">

    <div id="action-bar" class="hidden">
        <span>With selected:</span>
        <button hx-post="/activate">Activate</button>
        <button hx-post="/deactivate">Deactivate</button>
        <button hx-post="/delete">Delete</button>
    </div>

    <table>
        <thead>
        <tr>
            <th><input type="checkbox" class="select-all"></th>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
        </tr>
        </thead>
        <tbody>
        <tr>
            <td><input type="checkbox" name="selected" value="joe@smith.org"></td>
            <td>Joe Smith</td>
            <td>joe@smith.org</td>
            <td>Active</td>
        </tr>
        ...
        </tbody>
    </table>
</form>
```

- [`hx-target`](/reference/attributes/hx-target)=`"this"` and [`hx-swap`](/reference/attributes/hx-swap)=`"outerHTML"` on the form mean every action replaces the entire form with the server's response.
- Each action button uses [`hx-post`](/reference/attributes/hx-post) to a different endpoint. Only checked `name="selected"` values are submitted.
- Use [`hx-target:inherited`](/docs#attribute-inheritance) to avoid repeating target declarations on each action button.

### Clickable rows

Make the whole row a click target so users don't have to aim for the small checkbox:

```html
<tr _="on click
       if event.target.tagName !== 'INPUT'
         toggle @checked on the <input[name='selected']/> in me
         then send change to the <input[name='selected']/> in me">
    <td><input type="checkbox" name="selected" value="joe@smith.org"></td>
    ...
</tr>
```

The `if event.target.tagName !== 'INPUT'` guard prevents double-toggling when clicking directly on the checkbox. Highlighting the selected row is pure CSS:

```css
tr:has(input:checked) {
    background: var(--selected-bg);
}
```

### Conditional action bar

Show the action bar only when at least one checkbox is checked. With CSS `:has()`:

```css
.action-bar { display: none; }
form:has(input[name="selected"]:checked) .action-bar { display: flex; }
```

Or with hyperscript on the `<tbody>` (for browsers without `:has()` support):

```html
<tbody _="on change from <input[name='selected']/>
          if (<input[name='selected']:checked/> in closest <form/>).length > 0
            show #action-bar
          else
            hide #action-bar
          end">
```

### Select all

A checkbox in the header toggles all row checkboxes:

```html
<input type="checkbox"
       _="on change
          set checked to my.checked
          then for cb in <input[name='selected']/> in closest <form/>
            set cb.checked to checked
          then send checkChange to closest <form/>">
```

### Server response

The server processes the selected emails, performs the bulk action, and re-renders the full table. Selections are cleared and statuses reflect the update:

```html
<!-- POST /activate with selected=joe@smith.org&selected=kim@yee.org -->
<form hx-target:inherited="this" hx-swap="outerHTML">
    <!-- ...updated table rows... -->
    <output>Activated 1 user</output>
</form>
```
