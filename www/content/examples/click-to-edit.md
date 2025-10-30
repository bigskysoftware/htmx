+++
title = "Click to Edit"
template = "demo.html"
+++

This pattern shows how to edit a record in place, without a page refresh. It works by providing two modes that the user can switch between:

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

    <p>Name: <input name="name" value="{{ user.name }}"></p>

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

### The REST-ful Pattern

This pattern follows REST conventions:
- `GET /users/1` - Retrieve the current view (**"View Mode"**)
- `GET /users/1/edit` - Retrieve the edit form (**"Edit Mode"**)
- `PUT /users/1` - Update the resource

The URL represents the resource (`/users/1`), and the HTTP method indicates the action.

{{ demoenv() }}

<script>
const user = { name: "Joe Smith" };

init("/users/1", () =>
    `<div hx-target:inherited="this">
        <p>Name: <span>${user.name}</span></p>
        <button hx-get="/users/1/edit"
                hx-swap="outerHTML">
            Edit
        </button>
    </div>`
);

onGet("/users/1/edit", () =>
    `<form hx-put="/users/1"
           hx-target:inherited="this"
           hx-swap:inherited="outerHTML">
        <p>Name: <input name="name" value="${user.name}"></p>
        <button type="submit">
            Save
        </button>
        <button type="button" hx-get="/users/1">
            Cancel
        </button>
    </form>`
);

onPut("/users/1", (req, params) => {
    user.name = params.name;
    return `<div hx-target:inherited="this"
                 hx-swap:inherited="outerHTML">
                <p>Name: <span>${user.name}</span></p>
                <button hx-get="/users/1/edit">
                    Edit
                </button>
            </div>`;
});
</script>
