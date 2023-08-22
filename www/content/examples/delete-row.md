+++
title = "Delete Row"
template = "demo.html"
+++

This example shows how to implement a delete button that removes a table row upon completion.  First let's look at the
table body:

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

The table body has a [`hx-confirm`](@/attributes/hx-confirm.md) attribute to confirm the delete action.  It also
set the target to be the `closest tr` that is, the closest table row, for all the buttons ([`hx-target`](@/attributes/hx-target.md)
is inherited from parents in the DOM.)  The swap specification in [`hx-swap`](@/attributes/hx-swap.md) says to swap the
entire target out and to wait 1 second after receiving a response.  This last bit is so that we can use the following
CSS:

```css
tr.htmx-swapping td {
  opacity: 0;
  transition: opacity 1s ease-out;
}
```

To fade the row out before it is swapped/removed.

Each row has a button with a [`hx-delete`](@/attributes/hx-delete.md) attribute containing the url on which to issue a `DELETE`
request to delete the row from the server. This request responds with a `200` status code and empty content, indicating that the
row should be replaced with nothing.

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

<style>
tr.htmx-swapping td {
  opacity: 0;
  transition: opacity 1s ease-out;
}
</style>

{{ demoenv() }}

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
