+++
title = "Extended CSS Syntax"
+++

The following `hx` attributes supports the extended CSS syntax.

* [`hx-include`](@/attributes/hx-include.md)
* [`hx-indicator`](@/attributes/hx-indicator.md)
* [`hx-swap`](@/attributes/hx-swap.md) (within the `show` modifier)
* [`hx-swap-oob`](@/attributes/hx-swap-oob.md) (within the `show` modifier)
* [`hx-sync`](@/attributes/hx-sync.md)
* [`hx-target`](@/attributes/hx-target.md)
* [`hx-trigger`](@/attributes/hx-trigger.md) (within the `from` modifier)

In addition, a CSS selector may be wrapped in `<` and `/>` characters, mimicking the
[query literal](https://hyperscript.org/expressions/query-reference/) syntax of hyperscript.


### `window` {#window}

>**NOTE:** This only applies to `hx-trigger` attribute.

Listen for events to be triggered on the window.

```html
<a hx-get="/search" hx-trigger="myevent from:window">Click</a>
```

### `document` {#document}

>**NOTE:** This only applies to `hx-trigger` attribute.

Listen for events to be triggered on the document.

```html
<a hx-get="/search" hx-trigger="myevent from:document">Click</a>
```

### `this` {#this}

>**NOTE:** This only applies to `hx-target`, `hx-sync`, `hx-indicator`, `hx-include` attributes.

Uses the element itself.

```html
<div hx-get="/search" hx-target="this"></div>
```

### `closest <CSS selector>` {#closest}

Finds the [closest](https://developer.mozilla.org/docs/Web/API/Element/closest) ancestor element or itself, matching the given CSS selector.

```html
<div class="search-wrapper">
  <a hx-get="/search" hx-target="closest .search-wrapper">Search</a>
</div>
```

### `find <CSS selector>` {#find}

Finds the first child element that matches the given CSS selector.

```html
<form hx-get="/search" hx-trigger="click from:find button">
  <button type="button">Search</button>
  <button type="button">Does nothing</button>
</form>
```

### `previous <CSS selector>` {#previous}

Finds the first element whose position is preceding the element that defines the CSS selector and that matches the given CSS selector.

```html
<div>not the target</div>
<div>the target</div>
<a hx-get="/search" hx-target="previous div">Search</a>
```

### `next <CSS selector>` {#next}

Finds the first element whose position is following the element that defines the CSS selector and that matches the given CSS selector.

```html
<a hx-get="/search" hx-target="next div">Search</a>
<div>the target</div>
<div>not the target</div>
```
