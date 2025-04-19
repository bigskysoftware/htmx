+++
title = "Edit Row"
template = "demo.html"
+++

This example shows how to implement editable rows.  First let's look at the table body:

```html
<table class="table delete-row-example">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th></th>
    </tr>
  </thead>
  <tbody hx-target="closest tr" hx-swap="outerHTML">
    ...
  </tbody>
</table>
```

This will tell the requests from within the table to target the closest enclosing row that the request is triggered
on and to replace the entire row.

Here is the HTML for a row:

```html
<tr>
      <td>${contact.name}</td>
      <td>${contact.email}</td>
      <td>
        <button class="btn danger"
                hx-get="/contact/${contact.id}/edit"
                hx-trigger="edit"
                onClick="let editing = document.querySelector('.editing')
                         if(editing) {
                           Swal.fire({title: 'Already Editing',
                                      showCancelButton: true,
                                      confirmButtonText: 'Yep, Edit This Row!',
                                      text:'Hey!  You are already editing a row!  Do you want to cancel that edit and continue?'})
                           .then((result) => {
                                if(result.isConfirmed) {
                                   htmx.trigger(editing, 'cancel')
                                   htmx.trigger(this, 'edit')
                                }
                            })
                         } else {
                            htmx.trigger(this, 'edit')
                         }">
          Edit
        </button>
      </td>
    </tr>
```

Here we are getting a bit fancy and only allowing one row at a time to be edited, using some JavaScript.
We check to see if there is a row with the `.editing` class on it and confirm that the user wants to edit this row
and dismiss the other one.  If so, we send a cancel event to the other row so it will issue a request to go back to
its initial state.

We then trigger the `edit` event on the current element, which triggers the htmx request to get the editable version
of the row.

Note that if you didn't care if a user was editing multiple rows, you could omit the hyperscript and custom `hx-trigger`,
and just let the normal click handling work with htmx.  You could also implement mutual exclusivity by simply targeting the
entire table when the Edit button was clicked.  Here we wanted to show how to integrate htmx and JavaScript to solve
the problem and narrow down the server interactions a bit, plus we get to use a nice SweetAlert confirm dialog.

Finally, here is what the row looks like when the data is being edited:

```html
<tr hx-trigger='cancel' class='editing' hx-get="/contact/${contact.id}">
  <td><input autofocus name='name' value='${contact.name}'></td>
  <td><input name='email' value='${contact.email}'></td>
  <td>
    <button class="btn danger" hx-get="/contact/${contact.id}">
      Cancel
    </button>
    <button class="btn danger" hx-put="/contact/${contact.id}" hx-include="closest tr">
      Save
    </button>
  </td>
</tr>
```

Here we have a few things going on:  First off the row itself can respond to the `cancel` event, which will bring
back the read-only version of the row.  There is a cancel button that allows
cancelling the current edit.  Finally, there is a save button that issues a `PUT` to update the contact.  Note that
there is an [`hx-include`](@/attributes/hx-include.md) that includes all the inputs in the closest row.  Tables rows are
notoriously difficult to use with forms due to HTML constraints (you can't put a `form` directly inside a `tr`) so
this makes things a bit nicer to deal with.

{{ demoenv() }}

<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
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
        id: 0
      },
      {
        name: "Angie MacDowell",
        email: "angie@macdowell.org",
        status: "Active",
        id: 1
      },
      {
        name: "Fuqua Tarkenton",
        email: "fuqua@tarkenton.org",
        status: "Active",
        id: 2
      },
      {
        name: "Kim Yee",
        email: "kim@yee.org",
        status: "Inactive",
        id: 3
      },
    ];

    // routes
    init("/demo", function(request, params){
      return tableTemplate(contacts);
    });

    onGet(/\/contact\/\d+/, function(request, params){
      var id = parseInt(request.url.split("/")[2]); // get the contact
      var contact = contacts[id];
      console.log(request, id, contact)
      if(request.url.endsWith("/edit")) {
        return editTemplate(contacts[id])
      } else {
        return rowTemplate(contacts[id])
      }
    });

    onPut(/\/contact\/\d+/, function(request, params){
      var id = parseInt(request.url.split("/")[2]); // get the contact
      contact = contacts[id]
      contact.name = params['name'];
      contact.email = params['email'];
      return rowTemplate(contact);
    });

    // templates
    function rowTemplate(contact) {
      return `<tr>
      <td>${contact.name}</td>
      <td>${contact.email}</td>
      <td>
        <button class="btn danger"
                hx-get="/contact/${contact.id}/edit"
                hx-trigger="edit"
                onClick="let editing = document.querySelector('.editing')
                         if(editing) {
                           Swal.fire({title: 'Already Editing',
                                      showCancelButton: true,
                                      confirmButtonText: 'Yep, Edit This Row!',
                                      text:'Hey!  You are already editing a row!  Do you want to cancel that edit and continue?'})
                           .then((result) => {
                                if(result.isConfirmed) {
                                   htmx.trigger(editing, 'cancel')
                                   htmx.trigger(this, 'edit')
                                }
                            })
                         } else {
                            htmx.trigger(this, 'edit')
                         }">
          Edit
        </button>
      </td>
    </tr>`;
    }

    function editTemplate(contact) {
      return `<tr hx-trigger='cancel' class='editing' hx-get="/contact/${contact.id}">
      <td><input autofocus name='name' value='${contact.name}'</td>
      <td><input name='email' value='${contact.email}'</td>
      <td>
        <button class="btn danger" hx-get="/contact/${contact.id}">
          Cancel
        </button>
        <button class="btn danger" hx-put="/contact/${contact.id}" hx-include="closest tr">
          Save
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
      <th></th>
    </tr>
  </thead>
  <tbody hx-target="closest tr" hx-swap="outerHTML">
    ${rows}
  </tbody>
</table>`;
    }
</script>
