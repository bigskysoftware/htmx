---
title: Active Validation
description: Validate form input as you type
icon: "icon-[mdi--check]"
---

Inline field validation lets you check user input as they type (or on blur) without a full form submission. The input `POST`s its value to the server, which returns a replacement fragment with validation feedback.

Here's the form. The email `<div>` targets itself with `hx-swap="outerHTML"`, so the server can replace it entirely with an error or success variant:

```html
<h3>Signup Form</h3>
<form hx-post="/contact">
    <div hx-target="this" hx-swap="outerHTML">
        <label>Email Address</label>
        <input name="email" hx-post="/contact/email" hx-indicator="#ind">
        <span id="ind" class="htmx-indicator">Checking...</span>
    </div>
    <div class="form-group">
        <label>First Name</label>
        <input type="text" name="firstName">
    </div>
    <div class="form-group">
        <label>Last Name</label>
        <input type="text" name="lastName">
    </div>
    <button class="btn primary">Submit</button>
</form>
```

The input `POST`s to `/contact/email` on the default `change` event. The `#ind` indicator shows while the request is in flight.

When validation fails, the server returns a replacement div annotated with an `error` class and an error message:

```html
<div hx-target="this" hx-swap="outerHTML" class="error">
    <label>Email Address</label>
    <input name="email" hx-post="/contact/email" value="test@foo.com">
    <span id="ind" class="htmx-indicator">Checking...</span>
    <div class='error-message'>That email is already taken. Please enter another email.</div>
</div>
```

Style the error and valid states with some CSS:

```css
#demo-content .error-message {
    color: #dc2626;
}
#demo-content .error input {
    box-shadow: 0 0 3px #dc2626;
}
#demo-content .valid input {
    box-shadow: 0 0 3px #16a34a;
}
```

Below is a working demo. The only accepted email is `test@test.com`.

<style>
  #demo-content form { display: flex; flex-direction: column; gap: 0.75rem; max-width: 24rem; }
  #demo-content label { display: block; font-weight: 600; margin-bottom: 0.25rem; font-size: 0.875rem; }
  #demo-content input { display: block; width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem; }
  :is(.dark) #demo-content input { background: #1a1a1a; border-color: #404040; color: #e5e5e5; }
  #demo-content button { align-self: flex-start; padding: 0.5rem 1.25rem; border: none; border-radius: 0.375rem; background: #2563eb; color: #fff; font-weight: 600; cursor: pointer; }
  #demo-content button:disabled { opacity: 0.5; cursor: not-allowed; }
  :is(.dark) #demo-content button { background: #3b82f6; }
  #demo-content .htmx-indicator { display: none; font-size: 0.75rem; color: #6b7280; font-style: italic; }
  #demo-content .htmx-request .htmx-indicator { display: inline; }
  #demo-content .error-message { color: #dc2626; font-size: 0.8rem; margin-top: 0.25rem; }
  :is(.dark) #demo-content .error-message { color: #f87171; }
  #demo-content .error input { box-shadow: 0 0 3px #dc2626; }
  :is(.dark) #demo-content .error input { box-shadow: 0 0 3px #f87171; }
  #demo-content .valid input { box-shadow: 0 0 3px #16a34a; }
  :is(.dark) #demo-content .valid input { box-shadow: 0 0 3px #4ade80; }
</style>

<script>
server.get("/demo", () => demoTemplate());

server.post("/contact", () => formTemplate());

server.post(/\/contact\/email.*/, (req) => {
  const email = req.params['email'];
  if (!/\S+@\S+\.\S+/.test(email)) {
    return emailInputTemplate(email, "Please enter a valid email address");
  } else if (email !== "test@test.com") {
    return emailInputTemplate(email, "That email is already taken. Please enter another email.");
  } else {
    return emailInputTemplate(email);
  }
});

const demoTemplate = () =>
  `<h3>Signup Form</h3>
   <p>Enter an email and tab out to validate. Only "test@test.com" will pass.</p>` +
  formTemplate();

const formTemplate = () =>
  `<form hx-post="/contact">
    <div hx-target="this" hx-swap="outerHTML">
      <label for="email">Email Address</label>
      <input name="email" id="email" hx-post="/contact/email" hx-indicator="#ind">
      <span id="ind" class="htmx-indicator">Checking...</span>
    </div>
    <div>
      <label for="firstName">First Name</label>
      <input type="text" name="firstName" id="firstName">
    </div>
    <div>
      <label for="lastName">Last Name</label>
      <input type="text" name="lastName" id="lastName">
    </div>
    <button type="submit" disabled>Submit</button>
  </form>`;

const emailInputTemplate = (val, errorMsg) =>
  `<div hx-target="this" hx-swap="outerHTML" class="${errorMsg ? 'error' : 'valid'}">
    <label for="email">Email Address</label>
    <input name="email" id="email" hx-post="/contact/email" hx-indicator="#ind" value="${val}" aria-invalid="${!!errorMsg}">
    <span id="ind" class="htmx-indicator">Checking...</span>
    ${errorMsg ? `<div class="error-message">${errorMsg}</div>` : ''}
  </div>`;

server.start("/demo");
</script>
