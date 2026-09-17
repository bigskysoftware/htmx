# Common Patterns

## Common Patterns

### Active Search

```html
<input type="text" name="q"
       hx-get="/search"
       hx-trigger="input changed delay:500ms, keyup[key=='Enter']"
       hx-target="#search-results"
       hx-indicator="#spinner">
<span id="spinner" class="htmx-indicator">Searching...</span>
<div id="search-results"></div>
```

### Lazy Loading

```html

<div hx-get="/lazy-content" hx-trigger="load" hx-swap="outerHTML">
    Loading...
</div>
```

### Infinite Scroll

```html

<tr hx-get="/page/3" hx-trigger="revealed" hx-swap="afterend">
    <!-- last row of current page -->
</tr>
```

### Click to Load More

```html

<button hx-get="/page/2" hx-target="#results" hx-swap="beforeend">
    Load More
</button>
```

### Edit in Place

```html

<div hx-get="/contact/1/edit" hx-trigger="click" hx-swap="outerHTML">
    <p>Click to edit</p>
</div>
```

Server returns an edit form. Form submits via hx-post and returns the display view.

### Tabs

```html

<div role="tablist" hx-target:inherited="#tab-content">
    <button role="tab" hx-get="/tab/1" class="active">Tab 1</button>
    <button role="tab" hx-get="/tab/2">Tab 2</button>
</div>
<div id="tab-content">...</div>
```

### Form Validation

```html

<form hx-post="/register"
      hx-target="#result"
      hx-status:422="target:#errors">
    <input name="email" type="email">
    <div id="errors"></div>
    <div id="result"></div>
    <button type="submit">Register</button>
</form>
```

Server returns 422 with error HTML, target becomes the element with the errors id, or 200 with success HTML target is
the element with the id `result`.

### Loading Indicators

```html

<button hx-get="/slow" hx-indicator="#loading">
    Load
    <img id="loading" class="htmx-indicator" src="/spinner.gif" alt="Loading...">
</button>
```

The `htmx-indicator` class hides the element by default (opacity: 0). When a request is in flight, `htmx-request` class
is added, making indicators visible.

To avoid flashing the spinner on fast requests, add a `transition-delay` (the second time value) to the indicator's CSS:

```css
.htmx-request .htmx-indicator { transition: opacity 200ms ease-in 200ms; }
```

If the request finishes before the delay elapses, the spinner never appears

### Disabling Elements During Request

```html

<form hx-post="/save" hx-disable="find button, find input">
    <input name="data">
    <button type="submit">Save</button>
</form>
```
