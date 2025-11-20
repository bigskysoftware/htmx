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

## Configuration Options

The value uses htmx's configuration syntax to set request context properties:

* `swap:` - swap strategy (innerHTML, outerHTML, delete, none, etc.)
* `target:` - target element for the swap
* `select:` - CSS selector to pick content from response
* `push:` - push URL to history (true/false or a URL)
* `replace:` - replace URL in history (true/false or a URL)
* `transition:` - whether to use view transitions (true/false)

```html
<form hx-post="/save"
      hx-status:422="swap:innerHTML target:#errors select:#validation-errors"
      hx-status:500="swap:none push:false"
      hx-status:200="select:#success-message">
    <!-- form fields -->
</form>
```

## Common Use Cases

### Validation Errors (422)

```html
<form hx-post="/register"
      hx-status:422="select:#errors target:#error-container">
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
        hx-status:5xx="swap:innerHTML target:#error-display select:#server-error push:false">
    Process
</button>
```

### Preventing History Updates on Errors

```html
<button hx-get="/data"
        hx-push-url="true"
        hx-status:4xx="push:false"
        hx-status:5xx="push:false">
    Load Data
</button>
```

### Custom History URL on Success

```html
<form hx-post="/items"
      hx-status:201="push:/items/new">
    <!-- form fields -->
</form>
```

## Notes

* Status code patterns are evaluated in order of specificity (exact match → 2-digit wildcard → 1-digit wildcard)
* The configuration can set any request context property, not just swap behavior
* Values override any previous settings including response headers (HX-Retarget, HX-Reswap, etc.)
* Without `hx-status`, htmx uses default behavior (swap on 2xx, no swap on 204/304)
* Can be combined with other `hx-` attributes

## See Also

* [Response Handling](@/docs.md#response-handling) in the docs
* [`hx-select`](@/attributes/hx-select.md)
* [`hx-target`](@/attributes/hx-target.md)