---
title: "Bulk Actions"
description: Perform actions on multiple records
icon: "icon-[mdi--checkbox-multiple-marked]"
soon: true
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
    activate(email) {
      if (data[email].status === "Active") return 0;
      data[email].status = "Active";
      return 1;
    },
    deactivate(email) {
      if (data[email].status === "Inactive") return 0;
      data[email].status = "Inactive";
      return 1;
    },
  };
})();

server.get("/demo", () => {
  const contacts = _dataStore.all();
  return `<form id="checked-contacts"
      hx-post="/users"
      hx-swap="innerHTML settle:3s"
      hx-target="#toast">
  <table class="w-full border-collapse">
    <thead>
      <tr>
        <th class="text-left px-3 py-2 text-neutral-450 dark:text-neutral-400 font-semibold text-xs uppercase tracking-wide border-b-2 border-neutral-100 dark:border-neutral-850">Name</th>
        <th class="text-left px-3 py-2 text-neutral-450 dark:text-neutral-400 font-semibold text-xs uppercase tracking-wide border-b-2 border-neutral-100 dark:border-neutral-850">Email</th>
        <th class="text-left px-3 py-2 text-neutral-450 dark:text-neutral-400 font-semibold text-xs uppercase tracking-wide border-b-2 border-neutral-100 dark:border-neutral-850 text-center">Active</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(contacts).map(([email, c], i) => `
      <tr class="starting:opacity-0 transition-opacity duration-300 ease-out" style="transition-delay:${i * 60}ms">
        <td class="px-3 py-2.5 border-b border-neutral-100 dark:border-neutral-850 text-sm text-neutral-600 dark:text-neutral-300">${c.name}</td>
        <td class="px-3 py-2.5 border-b border-neutral-100 dark:border-neutral-850 text-sm text-neutral-600 dark:text-neutral-300">${email}</td>
        <td class="px-3 py-2.5 border-b border-neutral-100 dark:border-neutral-850 text-sm text-neutral-600 dark:text-neutral-300 text-center">
          <input type="checkbox" name="active:${email}" class="size-4 cursor-pointer accent-neutral-800 dark:accent-neutral-300" ${c.status === "Active" ? "checked" : ""}>
        </td>
      </tr>`).join("")}
    </tbody>
  </table>
  <button type="submit" class="mt-3 px-4 py-2 text-sm font-medium text-white bg-neutral-800 dark:bg-neutral-200 dark:text-neutral-900 rounded-md cursor-pointer transition hover:bg-neutral-700 dark:hover:bg-neutral-300 active:scale-[0.98]">Bulk Update</button>
  <output id="toast" class="block mt-3 px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-700 dark:text-neutral-300 opacity-0 transition-opacity duration-[3s] ease-out"></output>
</form>`;
});

server.post("/users", (req) => {
  const actives = {};
  let activated = 0;
  let deactivated = 0;

  for (const param of Object.keys(req.params)) {
    const parts = param.split(":");
    if (parts[0] === "active") actives[parts[1]] = true;
  }

  for (const email of Object.keys(_dataStore.all())) {
    if (actives[email]) {
      activated += _dataStore.activate(email);
    } else {
      deactivated += _dataStore.deactivate(email);
    }
  }

  return `Activated ${activated} and deactivated ${deactivated} users`;
});

server.start("/demo");
</script>

<div id="demo-content" class="not-prose demo-container min-h-[340px]"></div>

## Basic usage

On the client, wrap a table in a `<form>` with checkboxes for each row.

```html
<form id="checked-contacts"
      hx-post="/users"
      hx-swap="innerHTML settle:3s"
      hx-target="#toast">
    <table>
      <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Active</th>
      </tr>
      </thead>
      <tbody>
        <tr>
          <td>Joe Smith</td>
          <td>joe@smith.org</td>
          <td><input type="checkbox" name="active:joe@smith.org"></td>
        </tr>
        ...
      </tbody>
    </table>
    <input type="submit" value="Bulk Update" class="btn primary">
    <output id="toast"></output>
</form>
```

- [`hx-post`](/reference/attributes/hx-post) sends all checked values to `/users`.
- [`hx-swap`](/reference/attributes/hx-swap)=`"innerHTML settle:3s"` swaps the toast content, then fades it out after 3 seconds via the `htmx-settling` class.
- [`hx-target`](/reference/attributes/hx-target)=`"#toast"` directs the response into the toast element.

On the server, bulk-update statuses based on which checkboxes were checked and respond with a message.

```html
Activated 2 and deactivated 1 users
```

The `<output>` element announces the result for screen readers. For general-purpose messages outside a form, use an ARIA live region instead, e.g. `<p id="toast" aria-live="polite"></p>`.

## Notes

### No re-render needed

Because HTML form inputs manage their own state, the table does not need to be re-rendered after the POST. Checked rows stay checked.

### Toast fade-out

The toast uses `htmx-settling` to control opacity. When htmx swaps in the response, it adds `htmx-settling` (opacity 100), then removes it after the settle time (3s), triggering the CSS transition back to opacity 0.

<style>
#demo-content #toast.htmx-settling { opacity: 1; }
</style>
