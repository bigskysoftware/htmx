+++
title = "Inline Validation"
template = "demo.html"
+++

This example shows how to do inline field validation, in this case of an email address.  To do this
we need to create a form with an input that `POST`s back to the server with the value to be validated
and updates the DOM with the validation results.

We start with this form:

```html
<h3>Signup Form</h3>
<form hx-post="/contact">
  <div hx-target="this" hx-swap="outerHTML">
    <label>Email Address</label>
    <input name="email" hx-post="/contact/email" hx-indicator="#ind">
    <img id="ind" src="/img/bars.svg" class="htmx-indicator"/>
  </div>
  <div class="form-group">
    <label>First Name</label>
    <input type="text" class="form-control" name="firstName">
  </div>
  <div class="form-group">
    <label>Last Name</label>
    <input type="text" class="form-control" name="lastName">
  </div>
  <button class="btn btn-default">Submit</button>
</form>
```
Note that the first div in the form has set itself as the target of the request and specified the `outerHTML`
swap strategy, so it will be replaced entirely by the response.  The input then specifies that it will
`POST` to `/contact/email` for validation, when the `changed` event occurs (this is the default for inputs).
It also specifies an indicator for the request.

When a request occurs, it will return a partial to replace the outer div.  It might look like this:

```html
<div hx-target="this" hx-swap="outerHTML" class="error">
  <label>Email Address</label>
  <input name="email" hx-post="/contact/email" hx-indicator="#ind" value="test@foo.com">
  <img id="ind" src="/img/bars.svg" class="htmx-indicator"/>
  <div class='error-message'>That email is already taken.  Please enter another email.</div>
</div>
```

Note that this div is annotated with the `error` class and includes an error message element.

This form can be lightly styled with this CSS:

```css
  .error-message {
    color:red;
  }
  .error input {
      box-shadow: 0 0 3px #CC0000;
   }
  .valid input {
      box-shadow: 0 0 3px #36cc00;
   }
```

To give better visual feedback.

Below is a working demo of this example.  The only email that will be accepted is `test@test.com`.

<style>
  .error-message {
    color:red;
  }
  .error input {
      box-shadow: 0 0 3px #CC0000;
   }
  .valid input {
      box-shadow: 0 0 3px #36cc00;
   }
</style>

{{ demoenv() }}

<script>

    //=========================================================================
    // Fake Server Side Code
    //=========================================================================

    // routes
    init("/demo", function(request, params){
      return demoTemplate();
    });

    onPost("/contact", function(request, params){
      return formTemplate();
    });

    onPost(/\/contact\/email.*/, function(request, params){
        var email = params['email'];
        if(!/\S+@\S+\.\S+/.test(email)) {
          return emailInputTemplate(email, "Please enter a valid email address");
        } else if(email != "test@test.com") {
          return emailInputTemplate(email, "That email is already taken.  Please enter another email.");
        } else {
          return emailInputTemplate(email);
        }
     });

    // templates
    function demoTemplate() {

        return `<h3>Signup Form</h3><p>Enter an email into the input below and on tab out it will be validated.  Only "test@test.com" will pass.</p> ` + formTemplate();
    }

    function formTemplate() {
      return `<form hx-post="/contact">
  <div hx-target="this" hx-swap="outerHTML">
    <label for="email">Email Address</label>
    <input name="email" id="email" hx-post="/contact/email" hx-indicator="#ind">
    <img id="ind" src="/img/bars.svg" class="htmx-indicator"/>
  </div>
  <div class="form-group">
    <label for="firstName">First Name</label>
    <input type="text" class="form-control" name="firstName" id="firstName">
  </div>
  <div class="form-group">
    <label for="lastName">Last Name</label>
    <input type="text" class="form-control" name="lastName" id="lastName">
  </div>
  <button type='submit' class="btn btn-default" disabled>Submit</button>
</form>`;
    }

        function emailInputTemplate(val, errorMsg) {
            return `<div hx-target="this" hx-swap="outerHTML" class="${errorMsg ? "error" : "valid"}">
  <label>Email Address</label>
  <input name="email" hx-post="/contact/email" hx-indicator="#ind" value="${val}" aria-invalid="${!!errorMsg}">
  <img id="ind" src="/img/bars.svg" class="htmx-indicator"/>
  ${errorMsg ? (`<div class='error-message' >${errorMsg}</div>`) : ""}
</div>`;
        }
</script>
