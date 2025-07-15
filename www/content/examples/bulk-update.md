+++
title = "Bulk Update"
template = "demo.html"
+++

This demo shows how to implement a common pattern where rows are selected and then bulk updated.  This is
accomplished by putting a form around a table, with checkboxes in the table, and then including the checked
values in the form submission (`POST` request):

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

The server will bulk-update the statuses based on the values of the checkboxes.
We respond with a small toast message about the update to inform the user, and
use an `<output>` element to politely announce the update for accessibility. Note
that the `<output>` element is appropriate for announcing the result of an action
in a specific form, but if you need to announce general-purpose messages that are
not connected to a form it would make sense to use an ARIA live region, eg
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

The cool thing is that, because HTML form inputs already manage their own state,
we don't need to re-render any part of the users table. The active users are
already checked and the inactive ones unchecked!

You can see a working example of this code below.

<style scoped="">
#toast.htmx-settling {
  opacity: 100;
}

#toast {
  background: #E1F0DA;
  opacity: 0;
  transition: opacity 3s ease-out;
}
</style>

{{ demoenv() }}

<script>
    //=========================================================================
    // Fake Server Side Code
    //=========================================================================

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

    // routes
    init("/demo", function(request){
        return displayUI(dataStore.all());
    });

    /*
    Params look like:
    {"active:joe@smith.org":"on","active:angie@macdowell.org":"on","active:fuqua@tarkenton.org":"on"}
    */
    onPost("/users", function (req, params) {
      const actives = {};
      let activated = 0;
      let deactivated = 0;

      // Build a set of active users for efficient lookup
      for (const param of Object.keys(params)) {
        const nameEmail = param.split(':');
        if (nameEmail[0] === 'active') {
          actives[nameEmail[1]] = true;
        }
      }

      // Activate or deactivate users based on the lookup
      for (const email of Object.keys(dataStore.all())) {
        if (actives[email]) {
          activated += dataStore.activate(email);
        } else {
          deactivated += dataStore.deactivate(email);
        }
      }

      return `Activated ${activated} and deactivated ${deactivated} users`;
    });

    // templates
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
      var txt = "";

      for (email of Object.keys(contacts)) {
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
</script>
