---
layout: demo_layout.njk
---

## Delete Row

This example shows how to implement a delete button that removes a table row upon completion.

Each row has a button with a `hx-delete` attribute containing the url on which to issue a DELETE request to delete the row from the server.
This request should respond with empty content.

```html
<tr>
  <td>Angie MacDowell</td>
  <td>angie@macdowell.org</td>
  <td>Active</td>
  <td>
    <button class="btn btn-danger" hx-delete="/contact/1">
      Delete
    </button>
  </td>
</tr>
```

In order to tell where to put this empty content, the table body has an `hx-target` attribute set to `closest tr` . This will target the row containing the button which triggred the action, replacing it by... nothing.

It also has a `hx-swap` attribute set to `outerHTML 1s` in order to replace the row itself, with a 1 second delay allowing for a CSS3 transition to fade the row out.
During this one second delay, the class "kutty-swapping" is added to `tr` element about to be replaced.

Finally, the body also has a `hx-confirm` attribute so that a confirmation popup is shown before triggering the action for real.

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
  <tbody hx-confirm="Are you sure?" hx-target="closest tr" hx-swap="outerHTML swap:1s">
    ...
  </tbody>
</table>
```

{% include demo_ui.html.liquid %}

<script>
    //=========================================================================
    // Fake Server Side Code
    //=========================================================================

    // data
    var contacts = [
      {
        name: "Joe Smith",
        email: "joe@smith.org",
        status: "Active",
      },
      {
        name: "Angie MacDowell",
        email: "angie@macdowell.org",
        status: "Active",
      },
      {
        name: "Fuqua Tarkenton",
        email: "fuqua@tarkenton.org",
        status: "Active",
      },
      {
        name: "Kim Yee",
        email: "kim@yee.org",
        status: "Inactive",
      },
    ];

    // routes
    init("/demo", function(request, params){
      return tableTemplate(contacts);
    });

    onDelete(/\/contact\/\d+/, function(request, params){
      return "";
    });

    // templates
    function rowTemplate(contact, i) {
      return `<tr>
      <td>${contact["name"]}</td>
      <td>${contact["email"]}</td>
      <td>${contact["status"]}</td>
      <td>
        <button class="btn btn-danger" hx-delete="/contact/${i}">
          Delete
        </button>
      </td>
    </tr>`;
    }

    function tableTemplate(contacts) {
      var rows = "";

      for (var i = 0; i < contacts.length; i++) {
        rows += rowTemplate(contacts[i], i, "");
      }

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
  <tbody hx-confirm="Are you sure?" hx-target="closest tr" hx-swap="outerHTML swap:1s">
    ${rows}
  </tbody>
</table>`;
    }

</script>


