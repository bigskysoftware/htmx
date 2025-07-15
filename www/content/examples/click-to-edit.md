+++
title = "Click to Edit"
template = "demo.html"
+++

The click to edit pattern provides a way to offer inline editing of all or part of a record without a page refresh.

* This pattern starts with a UI that shows the details of a contact.  The div has a button that will get the editing UI for the contact from `/contact/1/edit`

```html
<div hx-target="this" hx-swap="outerHTML">
    <div><label>First Name</label>: Joe</div>
    <div><label>Last Name</label>: Blow</div>
    <div><label>Email</label>: joe@blow.com</div>
    <button hx-get="/contact/1/edit" class="btn primary">
    Click To Edit
    </button>
</div>
```

* This returns a form that can be used to edit the contact

```html
<form hx-put="/contact/1" hx-target="this" hx-swap="outerHTML">
  <div>
    <label>First Name</label>
    <input type="text" name="firstName" value="Joe">
  </div>
  <div class="form-group">
    <label>Last Name</label>
    <input type="text" name="lastName" value="Blow">
  </div>
  <div class="form-group">
    <label>Email Address</label>
    <input type="email" name="email" value="joe@blow.com">
  </div>
  <button class="btn">Submit</button>
  <button class="btn" hx-get="/contact/1">Cancel</button>
</form>
```

* The form issues a `PUT` back to `/contact/1`, following the usual REST-ful pattern.

{{ demoenv() }}

<script>
    //=========================================================================
    // Fake Server Side Code
    //=========================================================================

    // data
    var contact = {
        "firstName" : "Joe",
        "lastName" : "Blow",
        "email" : "joe@blow.com"
    };

    // routes
    init("/contact/1", function(request){
        return displayTemplate(contact);
    });

    onGet("/contact/1/edit", function(request){
        return formTemplate(contact);
    });

    onPut("/contact/1", function (req, params) {
        contact.firstName = params['firstName'];
        contact.lastName = params['lastName'];
        contact.email = params['email'];
        return displayTemplate(contact);
    });

    // templates
    function formTemplate(contact) {
return `<form hx-put="/contact/1" hx-target="this" hx-swap="outerHTML">
  <div>
    <label for="firstName">First Name</label>
    <input autofocus type="text" id="firstName" name="firstName" value="${contact.firstName}">
  </div>
  <div class="form-group">
    <label for="lastName">Last Name</label>
    <input type="text" id="lastName" name="lastName" value="${contact.lastName}">
  </div>
  <div class="form-group">
    <label for="email">Email Address</label>
    <input type="email" id="email" name="email" value="${contact.email}">
  </div>
  <button class="btn primary" type="submit">Submit</button>
  <button class="btn danger" hx-get="/contact/1">Cancel</button>
</form>`
    }

    function displayTemplate(contact) {
        return `<div hx-target="this" hx-swap="outerHTML">
    <div><label>First Name</label>: ${contact.firstName}</div>
    <div><label>Last Name</label>: ${contact.lastName}</div>
    <div><label>Email Address</label>: ${contact.email}</div>
    <button hx-get="/contact/1/edit" class="btn primary">
    Click To Edit
    </button>
</div>`;
    }
</script>
