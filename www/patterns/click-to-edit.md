---
layout: layout.njk
title: </> kutty - UX Patterns
---

## Implementing A Click To Edit UI

This pattern shows an inline click-to-edit UI for a contact. When you click the button below the current UI will
 be replaced with an editing UI, without a full browser refresh. You can then update the user information 
 or cancel the edit.

### Code

#### Display HTML

```html
  <div id="contact-div">
    <div><strong>First Name</strong>: Joe</div>
    <div><strong>Last Name</strong>: Smith</div>
    <div><strong>Email</strong>: joesmith@example.com</div>
    <button kt-target="#contact-div" kt-get="/contact/1/edit" class="btn btn-default">
      Click To Edit
    </button>
  </div>
```

#### Edit HTML

```html
    <form ic-put-to="/contact/1" ic-target="#contact-div">
      <div class="form-group">
        <label>First Name</label>
        <input type="text" class="form-control" name="firstName" value="${mockUser.firstName}">
      </div>
      <div class="form-group">
        <label>Last Name</label>
        <input type="text" class="form-control" name="lastName" value="${mockUser.lastName}">
      </div>
      <div class="form-group">
        <label>Email address</label>
        <input type="email" class="form-control" name="email" value="${mockUser.email}">
      </div>
      <button class="btn btn-default">Submit</button>
      <button ic-get-from="/contact/1" ic-target="#contact-div" class="btn btn-danger">Cancel</button>
    </form>';
```

### Explanation

The 'Click To Edit' button uses [kt-get](/attributes/kt-get) to issue a `GET` to `/contact/1/edit`, and targets the div 
surrounding the entire Contact UI using [kt-target](/attributes/kt-target).

The server returns a form that replaces the content of the div. The form uses the [kt-put](/attributes/kt-put) to issue a 
`PUT` to `/contact/1` and targets the same enclosing div.

The 'Cancel' button uses [kt-get](/attributes/kt-get)  to issue a `GET` to `/contact/1` and targets the same div. 

### Demo