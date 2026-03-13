---
title: "Delete in Place"
description: Remove a record without page refresh
icon: "icon-[material-symbols--delete]"
---
This example shows how to implement a delete button that removes a table row in place.

The table body uses [`hx-confirm`](/reference/attributes/hx-confirm) to prompt before deleting,
[`hx-target`](/reference/attributes/hx-target) to target the `closest tr`, and
[`hx-swap`](/reference/attributes/hx-swap) to swap the entire row out. All three are inherited by
every button in the body:

```html
<table class="table delete-row-example">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Status</th>
      <th></th>
    </tr>
  </thead>
  <tbody hx-confirm:inherited="Are you sure?" hx-target:inherited="closest tr" hx-swap:inherited="outerHTML">
    ...
  </tbody>
</table>
```

A simple CSS transition fades the row out during the swap delay:

```css
tr.htmx-swapping td {
  opacity: 0;
  transition: opacity 1s ease-out;
}
```

Each row has a [`hx-delete`](/reference/attributes/hx-delete) button. The server responds with
`200` and an empty body, so the row is replaced with nothing:

```html
<tr>
  <td>Angie MacDowell</td>
  <td>angie@macdowell.org</td>
  <td>Active</td>
  <td>
    <button class="btn danger" hx-delete="/contact/1">
      Delete
    </button>
  </td>
</tr>
```

<style>
#demo-content table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #d1d5db;
  font-size: 0.95rem;
}

#demo-content th,
#demo-content td {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  text-align: left;
}

#demo-content th {
  background: #f3f4f6;
  font-weight: 600;
}

#demo-content .btn.danger {
  padding: 0.3rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: #fff;
  background: #dc2626;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
}

#demo-content .btn.danger:hover {
  background: #b91c1c;
}

tr.htmx-swapping td {
  opacity: 0;
  transition: opacity 1s ease-out;
}

/* Dark mode */
:is(.dark) #demo-content table {
  border-color: #374151;
}

:is(.dark) #demo-content th,
:is(.dark) #demo-content td {
  border-color: #374151;
}

:is(.dark) #demo-content th {
  background: #1f2937;
}

:is(.dark) #demo-content .btn.danger {
  background: #ef4444;
}

:is(.dark) #demo-content .btn.danger:hover {
  background: #dc2626;
}
</style>

<script>
    const contacts = [
      { name: "Joe Smith",         email: "joe@smith.org",         status: "Active"   },
      { name: "Angie MacDowell",   email: "angie@macdowell.org",   status: "Active"   },
      { name: "Fuqua Tarkenton",   email: "fuqua@tarkenton.org",   status: "Active"   },
      { name: "Kim Yee",           email: "kim@yee.org",           status: "Inactive" },
    ];

    server.get("/demo", () => tableTemplate(contacts));

    server.delete(/\/contact\/\d+/, () => "");

    const rowTemplate = (contact, i) => `<tr>
      <td>${contact.name}</td>
      <td>${contact.email}</td>
      <td>${contact.status}</td>
      <td>
        <button class="btn danger" hx-delete="/contact/${i}">
          Delete
        </button>
      </td>
    </tr>`;

    const tableTemplate = (contacts) => {
      const rows = contacts.map((c, i) => rowTemplate(c, i)).join("");
      return `
<table class="table delete-row-example">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Status</th>
      <th></th>
    </tr>
  </thead>
  <tbody hx-confirm:inherited="Are you sure?" hx-target:inherited="closest tr" hx-swap:inherited="outerHTML">
    ${rows}
  </tbody>
</table>`;
    };

    server.start("/demo");
</script>
