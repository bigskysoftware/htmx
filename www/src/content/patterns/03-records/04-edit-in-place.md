---
title: "Edit in Place"
description: Update a record without page refresh
icon: "icon-[material-symbols--edit]"
soon: true
---

<script>
var _user = { name: "Joe Smith", email: "joe@smith.org" };

function viewHTML() {
    return `
<div id="user-view" class="p-5 border border-neutral-200 dark:border-neutral-800 rounded-lg max-w-sm">
    <div class="mb-3">
        <span class="block text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-1">Name</span>
        <span class="text-sm font-medium text-neutral-800 dark:text-neutral-100">${_user.name}</span>
    </div>
    <div class="mb-4">
        <span class="block text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-1">Email</span>
        <span class="text-sm font-medium text-neutral-800 dark:text-neutral-100">${_user.email}</span>
    </div>
    <button class="px-3.5 py-1.5 text-sm font-medium rounded-md cursor-pointer border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 interact:bg-neutral-50 dark:interact:bg-neutral-850 active:scale-[0.98] transition" hx-get="/users/1/edit" hx-target="#user-view" hx-swap="outerHTML">Edit</button>
</div>`;
}

server.get("/users/1", () => viewHTML());

server.get("/users/1/edit", () => `
<form id="user-view" class="p-5 border border-neutral-200 dark:border-neutral-800 rounded-lg max-w-sm" hx-put="/users/1" hx-target="this" hx-swap="outerHTML">
    <div class="mb-3">
        <label class="block text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-1">Name
            <input class="mt-1 w-full px-2.5 py-1.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400/30 focus:border-neutral-400 dark:focus:border-neutral-500" name="name" value="${_user.name}" autofocus>
        </label>
    </div>
    <div class="mb-4">
        <label class="block text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-1">Email
            <input class="mt-1 w-full px-2.5 py-1.5 text-sm border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400/30 focus:border-neutral-400 dark:focus:border-neutral-500" name="email" value="${_user.email}" type="email">
        </label>
    </div>
    <div class="flex gap-2">
        <button class="px-3.5 py-1.5 text-sm font-medium rounded-md cursor-pointer text-white dark:text-neutral-900 bg-neutral-800 dark:bg-neutral-200 interact:bg-neutral-700 dark:interact:bg-neutral-300 active:scale-[0.98] transition" type="submit">Save</button>
        <button class="px-3.5 py-1.5 text-sm font-medium rounded-md cursor-pointer bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 interact:bg-neutral-200 dark:interact:bg-neutral-700 active:scale-[0.98] transition" type="button" hx-get="/users/1">Cancel</button>
    </div>
</form>`);

server.put("/users/1", (req) => {
    _user.name = req.params.name;
    _user.email = req.params.email;
    return viewHTML();
});

server.start("/users/1");
</script>

<div id="demo-content" class="not-prose demo-container flex justify-center"></div>

## Basic usage

On the client, display the current values with a button that fetches the edit form.

```html
<div hx-target="this" hx-swap="outerHTML">
    <p>Name: Joe Smith</p>
    <p>Email: joe@smith.org</p>
    <button hx-get="/users/1/edit">Edit</button>
</div>
```

- [`hx-target`](/reference/attributes/hx-target)=[`"this"`](/reference/attributes/hx-target#this) sets the target to the `<div>` itself.
- [`hx-swap`](/reference/attributes/hx-swap)=[`"outerHTML"`](/reference/attributes/hx-swap#outerhtml) replaces the entire `<div>` with the response.
- [`hx-get`](/reference/attributes/hx-get) on the button requests the edit form.

On the server, respond with a form pre-filled with the current values.

```html
<form hx-put="/users/1" hx-target="this" hx-swap="outerHTML">
    <label>Name <input name="name" value="Joe Smith"></label>
    <label>Email <input name="email" value="joe@smith.org"></label>
    <button type="submit">Save</button>
    <button type="button" hx-get="/users/1">Cancel</button>
</form>
```

- [`hx-put`](/reference/attributes/hx-put) submits the form as a `PUT` request.
- **Save** submits the form, and the server responds with the updated view mode HTML.
- **Cancel** re-fetches the view mode without saving.

## Notes

### REST conventions

The endpoints follow standard REST conventions:

- `GET /users/1`: retrieve the view
- `GET /users/1/edit`: retrieve the edit form
- `PUT /users/1`: update the resource

The URL represents the resource, and the HTTP method indicates the action.
