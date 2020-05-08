---
layout: demo_layout.njk
---
<div class="demo" style="display: flex; flex-flow:column; height: 93%">
<div id="demo-header" style="flex: 0 1 auto;">
        
## Kutty Pattern: Click To Edit

The click to edit pattern provides a way to offer inline editing of all or part of a record without a page refresh.

* It starts with a div that shows the details of a contact.  The div has a button that will get the editing UI for the contact from `/contacts/1/edit`
* This returns a form that can be used to edit the contact
* The form issues a `PUT` back to `/contacts/1`, following the usual REST-ful pattern.

## Activity
<div id="demo-activity" class="row">
<div id="demo-timeline" class="3 col" style="vertical-align: top">
</div>
<div id="demo-current-request" class="9 col">
</div>
</div>

## Demo Canvas
<hr class="full-width"/>
</div>
<div id="demo-canvas" style="flex:1 1 auto;overflow: scroll;margin-right: calc(50% - 50vw);">
</div>
</div>

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
return `<form kt-put="/contact/1" kt-target="this" kt-swap="outerHTML">
  <div>
    <label>First Name</label>
    <input type="text" name="firstName" value="${contact.firstName}">
  </div>
  <div class="form-group">
    <label>Last Name</label>
    <input type="text" name="lastName" value="${contact.lastName}">
  </div>
  <div class="form-group">
    <label>Email address</label>
    <input type="email" name="email" value="${contact.email}">
  </div>
  <button class="btn">Submit</button>
  <button class="btn" kt-get="/contact/1">Cancel</button>
</form>`
    }

    function displayTemplate(contact) {
        return `<div kt-target="this" kt-swap="outerHTML">
    <div><label>First Name</label>: ${contact.firstName}</div>
    <div><label>Last Name</label>: ${contact.lastName}</div>
    <div><label>Email</label>: ${contact.email}</div>
    <button kt-get="/contact/1/edit" class="btn btn-primary">
    Click To Edit
    </button>
</div>`;
    }

</script>
