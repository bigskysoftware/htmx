+++
title = "Click to Edit"
template = "demo.html"
+++

<style type="text/tailwindcss">
/* macOS 9 Platinum Demo Window */
.demo-window {
  @apply mt-6 mb-8 mx-auto max-w-4xl;
  @apply bg-gradient-to-b from-[#e8e8e8] to-[#d0d0d0];
  @apply border border-[#999] rounded-[3px];
  @apply p-[6px];
  @apply shadow-[0_2px_6px_rgba(0,0,0,0.15)];
}

.demo-window-content {
  @apply bg-white border border-[rgba(0,0,0,0.25)];
  @apply shadow-[inset_1px_1px_3px_rgba(0,0,0,0.1)];
  @apply rounded-[2px];
  @apply p-8;
  @apply min-h-[250px];
  @apply flex items-center justify-center;
}

.demo-window h2 {
  @apply text-xs font-semibold mb-3 text-[#555] uppercase tracking-wider;
  @apply [text-shadow:0_1px_0_rgba(255,255,255,0.9)];
  @apply font-[family-name:'Lucida_Grande',Geneva,Verdana,sans-serif];
}
</style>

This pattern shows how to edit a record in place, without a page refresh.

It works by providing two modes that the user can switch between: **View Mode** & **Edit Mode**.

### 1. View Mode

In view mode, display the current value(s) with a way to switch to **Edit Mode** (e.g. a button / icon / etc.).

```html
<div hx-target:inherited="this">

    <p>Name: <span>{{ user.name }}</span></p>

    <!-- On click, switch to edit mode -->
    <button hx-get="/users/1/edit"
            hx-swap="outerHTML">
        Edit
    </button>

</div>
```
_The \<button\> `GET`s the edit form & replaces the parent `<div>` with it._


### 2. Edit Mode

In edit mode, show a form with **Save** & **Cancel** options.

```html
<!-- On submit, save changes & return to view mode -->
<form hx-put="/users/1"
      hx-target:inherited="this"
      hx-swap:inherited="outerHTML">

    <p>Name: <input name="name" value="{{ user.name }}" autofocus></p>

    <button type="submit">
        Save
    </button>

    <!-- On click, return to view mode (without saving) -->
    <button type="button" hx-get="/users/1">
        Cancel
    </button>

</form>
```
_The form `PUT`s the updated value to the server, which returns the updated view mode HTML to replace the form._

**Note:**

The endpoints follow REST conventions:
- `GET /users/1` - Retrieve the current view
- `GET /users/1/edit` - Retrieve the edit form
- `PUT /users/1` - Update the resource

The URL represents the resource (`/users/1`), and the HTTP method indicates the action.

{{ demo_environment() }}

<script>
const user = { name: "Joe Smith" };

init("/users/1", () => `
<div hx-target:inherited="this">
    <p>Name: <span>${user.name}</span></p>
    <button hx-get="/users/1/edit"
            hx-swap="outerHTML">
        Edit
    </button>
</div>`);

onGet("/users/1/edit", () => `
<form hx-put="/users/1"
      hx-target:inherited="this"
      hx-swap:inherited="outerHTML">
    <p>Name: <input name="name" value="${user.name}" autofocus></p>
    <button type="submit">
        Save
    </button>
    <button hx-get="/users/1">
        Cancel
    </button>
</form>`);

onPut("/users/1", (req, params) => {
    user.name = params.name;

    return `
<div hx-target:inherited="this"
     hx-swap:inherited="outerHTML">
    <p>Name: <span>${user.name}</span></p>
    <button hx-get="/users/1/edit">
        Edit
    </button>
</div>`});
</script>

<style type="text/tailwindcss">
#demo-content > div, #demo-content > form {
    @apply p-4 border border-neutral-300 rounded shadow max-w-md;
}
#demo-content p {
    @apply h-[34px]
}
#demo-content input {
    @apply px-2 py-0.5 border border-neutral-400 rounded shadow-inner;
}
</style>