# Status Handling and Multi-Region Updates

## Status-Based Response Handling (hx-status)

Handle different HTTP status codes with different swap behavior:

```html

<form hx-post="/register"
      hx-target="#result"
      hx-status:422="target:#errors select:#validation-errors"
      hx-status:5xx="swap:none">
    <input name="email" type="email">
    <div id="errors"></div>
    <div id="result"></div>
    <button type="submit">Register</button>
</form>
```

Supports wildcards: `hx-status:5xx`, `hx-status:50x`, `hx-status:404`.

Config options in the value: `swap:`, `target:`, `select:`, `push:`, `replace:`, `transition:`.

## Updating Multiple Page Regions

Three main approaches:

### 1. Expand the Target

Wrap both regions in a container and target it:

```html

<div id="page-section">
    <div id="table">...</div>
    <form hx-post="/contacts" hx-target="#page-section">...</form>
</div>
```

Server returns both the table and the form.

### 2. Out-of-Band Swaps

Server response includes extra elements with `hx-swap-oob`:

```html
<!-- Main response content (swapped into target normally) -->
<form>...</form>

<!-- This gets swapped into #contacts-table by ID -->
<tbody hx-swap-oob="beforeend:#contacts-table">
<tr>
    <td>New row</td>
</tr>
</tbody>
```

Note: in htmx 4, OOB swaps happen AFTER the main content swap.

### 3. Partial Tags

New in htmx 4, a more general version of OOB swaps

```html

<hx-partial hx-target="#messages" hx-swap="beforeend">
    <div>New message</div>
</hx-partial>

<hx-partial hx-target="#notifications" hx-swap="innerHTML">
    <span class="badge">5</span>
</hx-partial>
```

Each `<hx-partial>` specifies its own target and swap strategy. Preferred over OOB for explicit targeting.

### 4. Event-Driven Refresh

Server sends `HX-Trigger: newContact` header. Table listens for the event:

```html

<tbody id="contacts-table"
       hx-get="/contacts/table"
       hx-trigger="newContact from:body">
...
</tbody>
```
