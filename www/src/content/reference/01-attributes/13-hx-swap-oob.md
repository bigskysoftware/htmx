---
title: "hx-swap-oob"
description: "Marks response elements to swap into page by ID"
---

The `hx-swap-oob` attribute swaps response content outside the main target.

Use it to update other elements from the same response.

## Syntax

```html
<div id="alerts" hx-swap-oob="true">
    Alert message
</div>
```

Consider the following response HTML:

```html
<div>
 ...
</div>
<div id="alerts" hx-swap-oob="true">
    Saved!
</div>

```

The first `<div>` swaps into the main target.

The second replaces the existing `#alerts` element outside that target.

The value of the `hx-swap-oob` can be:

* `true`
* any valid [`hx-swap`](/reference/attributes/hx-swap) value
* any valid [`hx-swap`](/reference/attributes/hx-swap) value, followed by a colon, followed by a CSS selector

If the value is `true` or `outerHTML` (which are equivalent) the element will be swapped inline.

If a swap value is given, that swap strategy will be used and the encapsulating tag pair will be stripped for all
strategies other than `outerHTML`.

If a selector is given, all elements matched by that selector will be swapped. If not, the element with an ID matching
the new content will be swapped.

### Using alternate swap strategies

Swap strategies other than `true` or `outerHTML` strip the wrapper. Use a wrapper valid for the target context.

When trying to insert a `<tr>` in a table that uses `<tbody>`:

```html
<tbody hx-swap-oob="beforeend:#table tbody">
	<tr>
		...
	</tr>
</tbody>
```

A "plain" table:

```html
<table hx-swap-oob="beforeend:#table2">
	<tr>
		...
	</tr>
</table>
```

A `<li>` may be encapsulated in `<ul>`, `<ol>`, `<div>` or `<span>`, for example:

```html
<ul hx-swap-oob="beforeend:#list1">
	<li>...</li>
</ul>
```

A `<p>` can be encapsulated in `<div>` or `<span>`:

```html
<span hx-swap-oob="beforeend:#text">
	<p>...</p>
</strong>
```

### Troublesome Tables and lists

Use `<template>` to wrap elements that cannot stand alone in HTML:

`<tr>`, `<td>`, `<th>`, `<thead>`, `<tbody>`, `<tfoot>`, `<colgroup>`, `<caption>`, `<col>`, and `<li>`.

Here is an example with an out-of-band swap of a table row being encapsulated in this way:

```html
<div>
    ...
</div>
<template>
    <tr id="row" hx-swap-oob="true">
        ...
    </tr>
</template>
```

Note that these template tags will be removed from the final content of the page.

### Slippery SVGs

SVG children require the SVG namespace.

Wrap them in `<template><svg>` so the browser applies the correct namespace.

Here is an example with an out-of-band swap of svg elements being encapsulated in this way:

```html
<div>
    ...
</div>
<template><svg>
    <circle hx-swap-oob="true" id="circle1" r="35" cx="50" cy="50" fill="red" /> 
</svg></template>
<template><svg hx-swap-oob="beforebegin:#circle1">
    <circle id="circle2" r="45" cx="50" cy="50" fill="blue" /> 
</svg></template>
```

This will replace circle1 inline and then insert circle2 before circle1.

Note that these `template` and `svg` wrapping tags will be removed from the final content of the page.

## Nested OOB Swaps

By default, htmx processes every `hx-swap-oob` element in the response, including elements nested inside main content.

This can remove nested [template fragments](https://htmx.org/essays/template-fragments/) that should remain in the main swap.

Set `htmx.config.allowNestedOobSwaps` to `false` to process only OOB elements adjacent to main content.

Nested OOB attributes are stripped without swapping.

## Empty Response Behaviour

A response containing only OOB elements still performs an empty main swap.

Use this to remove the main target while updating other elements.

```html
<!-- Server returns this to remove the form and update the list -->
<div id="item-list" hx-swap-oob="beforeend">
    <li>New item</li>
</div>
<!-- no main content = form gets swapped with empty fragment, removing it -->
```

If you want to prevent the empty main swap, use the [`swapEmpty`](/reference/attributes/hx-swap#swapempty) modifier:

```html
<form hx-post="/submit" hx-swap="outerHTML swapEmpty:false">
```

Or set the global default via [`htmx.config.defaultSwapEmpty`](/reference/config/htmx-config-defaultSwapEmpty).

[`<hx-partial>`](/reference/tags/hx-partial) uses the opposite default. Partial-only responses skip the empty main swap.

A partial-only response explicitly routes targeted updates, so htmx assumes no main swap is needed. Set `swapEmpty:true` to run it.

## See Also

- [`<hx-partial>`](/reference/tags/hx-partial), an alternative for multi-target updates with explicit control over targeting and swap strategy
