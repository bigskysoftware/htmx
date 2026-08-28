---
title: "hx-sync"
description: "Synchronizes requests between elements"
---

The `hx-sync` attribute coordinates concurrent requests between elements.

## Syntax

Set a synchronization element and strategy:

```html
<input hx-post="/validate" hx-sync="closest form:abort">
```

```text
SELECTOR:STRATEGY
```

The selector identifies the shared request queue. The strategy controls competing requests.

| Strategy | Behavior |
|---|---|
| `drop` | Ignores new request while another is running. Default. |
| `abort` | Drops this request if another is running; aborts it if another starts. |
| `replace` | Aborts running request and starts new request. |
| `queue` | Queues new request. |

Choose which requests `queue` keeps:

| Queue | Behavior |
|---|---|
| `queue first` | Keeps first waiting request. |
| `queue last` | Keeps last waiting request. |
| `queue all` | Keeps every waiting request. |

## Prioritize Form Submission

Without `hx-sync`, validation and submission can run in parallel and race.

Abort field validation when form submission starts:

```html
<form hx-post="/store">
  <input name="title"
         hx-post="/validate"
         hx-trigger="change"
         hx-sync="closest form:abort">
  <button type="submit">Submit</button>
</form>
```

The input watches the form's request queue. Form submission aborts any running validation request.

## Prioritize Validation

Drop form submission while validation is running:

```html
<form hx-post="/store">
  <input name="title"
         hx-post="/validate"
         hx-trigger="change"
         hx-sync="closest form:drop">
  <button type="submit">Submit</button>
</form>
```

## Replace Validation Requests

Put `replace` on the form to cancel running validation before submission:

```html
<form hx-post="/store" hx-sync:inherited="this:replace">
  <input name="title" hx-post="/validate" hx-trigger="change">
  <button type="submit">Submit</button>
</form>
```

Use `hx-sync="this:abort"` instead to keep running validation and abort submission.

## Keep Latest Search

Combine [`delay`](/reference/attributes/hx-trigger#delaytime) with `replace`:

```html
<input type="search"
       hx-get="/search"
       hx-trigger="keyup changed delay:500ms, search"
       hx-target="#search-results"
       hx-sync="this:replace">
```

`delay` waits for typing to pause. `replace` cancels any older search request.

When the input is inside the target, this also reduces the chance that an older response replaces it while the user is typing.

## See Also

- [`hx-trigger`](/reference/attributes/hx-trigger)
