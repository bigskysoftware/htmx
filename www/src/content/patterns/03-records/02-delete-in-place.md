---
title: "Delete in Place"
description: Remove a record without page refresh
icon: "icon-[material-symbols--delete]"
soon: true
---

<script>
server.get("/demo", () => {
  const contacts = [
    { name: "Joe Smith",       email: "joe@smith.org",       status: "Active" },
    { name: "Angie MacDowell", email: "angie@macdowell.org", status: "Active" },
    { name: "Fuqua Tarkenton", email: "fuqua@tarkenton.org", status: "Active" },
    { name: "Kim Yee",         email: "kim@yee.org",         status: "Inactive" },
  ];
  return ` class="w-full border-collapse">
  <thead>
    <tr>
      <th class="text-left px-3 py-2 text-neutral-450 dark:text-neutral-400 font-semibold text-xs uppercase tracking-wide">Name</th>
      <th class="text-left px-3 py-2 text-neutral-450 dark:text-neutral-400 font-semibold text-xs uppercase tracking-wide">Email</th>
      <th class="text-left px-3 py-2 text-neutral-450 dark:text-neutral-400 font-semibold text-xs uppercase tracking-wide">Status</th>
      <th class="text-left px-3 py-2 text-neutral-450 dark:text-neutral-400 font-semibold text-xs uppercase tracking-wide"></th>
    </tr>
  </thead>
  <tbody hx-confirm:inherited="Are you sure?" hx-target:inherited="closest tr" hx-swap:inherited="outerHTML swap:500ms"
         class="[&>tr:last-child>td]:border-b-0">
    ${contacts.map((c, i) => rowTemplate(c, i)).join("")}
  </tbody>
</table>`;
});

server.delete(/\/contact\/\d+/, () => "");

function rowTemplate(contact, i) {
  return `<tr class="starting:opacity-0 transition-opacity duration-300 ease-out">
      <td class="px-3 py-2.5 border-b border-neutral-100 dark:border-neutral-850 text-sm text-neutral-600 dark:text-neutral-300">${contact.name}</td>
      <td class="px-3 py-2.5 border-b border-neutral-100 dark:border-neutral-850 text-sm text-neutral-600 dark:text-neutral-300">${contact.email}</td>
      <td class="px-3 py-2.5 border-b border-neutral-100 dark:border-neutral-850 text-sm text-neutral-600 dark:text-neutral-300">${contact.status}</td>
      <td class="px-3 py-2.5 border-b border-neutral-100 dark:border-neutral-850 text-sm text-neutral-600 dark:text-neutral-300 text-right">
        <button class="px-2.5 py-1 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 rounded cursor-pointer transition-colors" hx-delete="/contact/${i}">Delete</button>
      </td>
    </tr>`;
}

server.start("/demo");
</script>

<div id="demo-content" class="not-prose demo-container min-h-[280px]"></div>

## Basic usage

On the client, set up the table body with inherited attributes so every delete button shares the same behavior.

```html
<tbody hx-confirm:inherited="Are you sure?"
       hx-target:inherited="closest tr"
       hx-swap:inherited="outerHTML swap:500ms">
  <tr>
    <td>Angie MacDowell</td>
    <td>angie@macdowell.org</td>
    <td>Active</td>
    <td>
      <button hx-delete="/contact/1">Delete</button>
    </td>
  </tr>
  ...
</tbody>
```

- [`hx-confirm`](/reference/attributes/hx-confirm) prompts the user before sending the request. The `:inherited` modifier lets every button in the body inherit it.
- [`hx-target`](/reference/attributes/hx-target)=`"closest tr"` targets the row containing the button.
- [`hx-swap`](/reference/attributes/hx-swap)=`"outerHTML swap:500ms"` replaces the entire row after a 500ms swap delay, giving the fade-out transition time to play.
- [`hx-delete`](/reference/attributes/hx-delete) sends a DELETE request to the server.

On the server, respond with an empty body and a `200` status. The row is replaced with nothing (it just disappears).

## Notes

### Fade-out animation

During the swap delay, htmx adds the `htmx-swapping` class to the target row. Use it to trigger a CSS opacity transition so the row fades out before it's removed.

```css
tr.htmx-swapping td {
  opacity: 0;
  transition: opacity 500ms ease-out;
}
```

<style>
tr.htmx-swapping td { opacity: 0; transition: opacity 500ms ease-out; }
</style>
