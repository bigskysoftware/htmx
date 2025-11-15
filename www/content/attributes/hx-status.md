+++
title = "hx-status"
+++

The `hx-status` attribute allows you to specify different swap behaviors based on the HTTP status code of the response.

This attribute uses a pattern matching syntax where you specify the status code(s) followed by the swap configuration.

## Syntax

```html
<button hx-post="/submit"
        hx-status:422="select:#errors"
        hx-status:500="select:#server-error">
  Submit
</button>
```

## Status Code Patterns

You can use specific status codes or wildcards:

```html
<button hx-get="/data"
        hx-status:404="select:#not-found"
        hx-status:50x="select:#server-error"
        hx-status:5xx="select:#fallback">
  Load Data
</button>
```

## Swap Configuration

The value can include:

* `select:` - CSS selector to pick content from response
* `swap:` - swap strategy (innerHTML, outerHTML, etc.)
* `target:` - target element for the swap

```html
<form hx-post="/save"
      hx-status:422="select:#validation-errors,swap:innerHTML,target:#errors"
      hx-status:200="select:#success-message">
  <!-- form fields -->
</form>
```

## Common Use Cases

### Validation Errors (422)

```html
<form hx-post="/register"
      hx-status:422="select:#errors,target:#error-container">
  <input name="email" type="email">
  <div id="error-container"></div>
  <button type="submit">Register</button>
</form>
```

### Not Found (404)

```html
<div hx-get="/user/123"
     hx-status:404="select:#user-not-found">
  Loading...
</div>
```

### Server Errors (5xx)

```html
<button hx-post="/process"
        hx-status:5xx="select:#server-error-message">
  Process
</button>
```

## Notes

* Status code patterns are evaluated in order of specificity (specific codes before wildcards)
* Without `hx-status`, htmx uses default behavior (swap on 2xx, error events on others)
* The `hx-status` attribute allows you to customize responses for specific status codes
* Can be combined with other `hx-` attributes

## See Also

* [Response Handling](@/docs.md#response-handling) in the docs
* [`hx-select`](@/attributes/hx-select.md)
* [`hx-target`](@/attributes/hx-target.md)