---
title: "Bulk Actions"
description: Perform actions on multiple records
icon: "icon-[mdi--checkbox-multiple-marked]"
---
Wrap a table in a form with checkboxes, then POST the checked values for bulk update:

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
      <tbody id="tbody">
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

The server bulk-updates statuses based on checkbox values and responds with a
toast message. The `<output>` element announces the result for accessibility. For
general-purpose messages outside a form, use an ARIA live region instead, e.g.
`<p id="toast" aria-live="polite"></p>`.

```css
#toast.htmx-settling {
  opacity: 100;
}

#toast {
  background: #E1F0DA;
  opacity: 0;
  transition: opacity 3s ease-out;
}
```

Because HTML form inputs manage their own state, we don't need to re-render the
table -- checked rows stay checked.

<style>
#demo-content table { width: 100%; border-collapse: collapse; }
#demo-content th { font-weight: 600; font-size: 0.8125rem; color: #737373; text-align: left; padding: 0.5rem 0.75rem; border-bottom: 2px solid #e5e5e5; }
:is(.dark) #demo-content th { color: #a3a3a3; border-bottom-color: #404040; }
#demo-content td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #e5e5e5; }
:is(.dark) #demo-content td { border-bottom-color: #404040; }
#demo-content td:last-child { text-align: center; }
#demo-content th:last-child { text-align: center; }
#demo-content input[type="checkbox"] { width: 1rem; height: 1rem; cursor: pointer; }
#demo-content #toast.htmx-settling { opacity: 100; }
#demo-content #toast { background: #dcfce7; opacity: 0; transition: opacity 3s ease-out; padding: 0.5rem 0.75rem; border-radius: 0.25rem; margin-top: 0.5rem; display: block; }
:is(.dark) #demo-content #toast { background: #14532d; color: #bbf7d0; }
#demo-content input[type="submit"] { margin-top: 0.75rem; }
</style>

<script>
    const dataStore = (() => {
      const data = {
        "joe@smith.org": {name: 'Joe Smith', status: 'Active'},
        "angie@macdowell.org": {name: 'Angie MacDowell', status: 'Active'},
        "fuqua@tarkenton.org": {name: 'Fuqua Tarkenton', status: 'Active'},
        "kim@yee.org": {name: 'Kim Yee', status: 'Inactive'},
      };

      return {
        all() {
          return data;
        },

        activate(email) {
          if (data[email].status === 'Active') {
            return 0;
          } else {
            data[email].status = 'Active';
            return 1;
          }
        },

        deactivate(email) {
          if (data[email].status === 'Inactive') {
            return 0;
          } else {
            data[email].status = 'Inactive';
            return 1;
          }
        },
      };
    })();

    server.get("/demo", function(req) {
        return displayUI(dataStore.all());
    });

    server.post("/users", function(req) {
      const actives = {};
      let activated = 0;
      let deactivated = 0;

      for (const param of Object.keys(req.params)) {
        const nameEmail = param.split(':');
        if (nameEmail[0] === 'active') {
          actives[nameEmail[1]] = true;
        }
      }

      for (const email of Object.keys(dataStore.all())) {
        if (actives[email]) {
          activated += dataStore.activate(email);
        } else {
          deactivated += dataStore.deactivate(email);
        }
      }

      return `Activated ${activated} and deactivated ${deactivated} users`;
    });

    function displayUI(contacts) {
      return `<h3>Select Rows And Activate Or Deactivate Below</h3>
               <form
                id="checked-contacts"
                hx-post="/users"
                hx-swap="innerHTML settle:3s"
                hx-target="#toast"
              >
                <table>
                  <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Active</th>
                  </tr>
                  </thead>
                  <tbody id="tbody">
                    ${displayTable(contacts)}
                  </tbody>
                </table>
                <input type="submit" value="Bulk Update" class="btn primary">
                <output id="toast"></output>
              </form>
              <br>`;
    }

    function displayTable(contacts) {
      let txt = "";

      for (const email of Object.keys(contacts)) {
        txt += `
<tr>
  <td>${contacts[email].name}</td>
  <td>${email}</td>
  <td>
    <input
      type="checkbox"
      name="active:${email}"
      ${contacts[email].status === 'Active' ? 'checked' : ''}>
  </td>
</tr>
`;
      }

      return txt;
    }

server.start("/demo");
</script>
