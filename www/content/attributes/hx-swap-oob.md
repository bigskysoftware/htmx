+++
title = "hx-swap-oob"
description = """\
  The hx-swap-oob attribute in htmx allows you to specify that some content in a response should be swapped into the \
  DOM somewhere other than the target, that is 'out-of-band'. This allows you to piggyback updates to other elements \
  on a response."""
+++

The `hx-swap-oob` attribute allows you to specify that some content in a response should be
swapped into the DOM somewhere other than the target, that is "Out of Band".  This allows you to piggyback updates to other element updates on a response.

Consider the following response HTML:

```html
<div>
 ...
</div>
<div id="alerts" hx-swap-oob="true">
    Saved!
</div>

```

The first div will be swapped into the target the usual manner.  The second div, however, will be swapped in as a replacement for the element with the id `alerts`, and will not end up in the target.

The value of the `hx-swap-oob` can be:

* `true`
* any valid basic [`hx-swap`](@/attributes/hx-swap.md) strategy (innerHTML, outerHTML, beforebegin, etc)
* any valid basic [`hx-swap`](@/attributes/hx-swap.md) strategy, followed by a colon, followed by a CSS selector
* any valid complex [`hx-swap`](@/attributes/hx-swap.md) value including modifiers like `target:` to set the target of the swap

If the value is `true` or `outerHTML` (which are equivalent) the element will be swapped inline.

If a swap strategy is given, that swap strategy will be used and the encapsulating tag pair will be stripped for all strategies other than `outerHTML`. You can now use `strip:true` modifier to enable tag stripping for `outerHTML` or `strip:false` to disable it for the other strategies.

If a selector is given, all elements matched by that selector will be swapped.  If not, the element on the page with an ID matching that of the oob element will be swapped instead.

If you include any [`hx-swap`](@/attributes/hx-swap.md) modifers (e.g. `innerHTML swap:1s` to delay the swap) then you need to also use `target:<Selector>` if you want to target something other than the oob elements ID instead of using the basic colon followed by a selector. So `innerHTML:#foo` with a delay becomes `innerHTML swap:1s target:#foo`.

You can include `strip:true` as a modifer to allow you to override the `outerHTML` swap strategy to remove the encapsulating tag pair and allow you to swap in just the inner nodes of the oob element instead

You can include `strip:false` as a modifer to allow you to override an inner swap strategy like `innerHTML` or `beforeend` to keep the encapsulating tag pair and swap in the whole oob element instead of just its inner contents.

### Using alternate swap strategies

As mentioned previously when using swap strategies other than `true` or `outerHTML` the encapsulating tags are stripped by default, as such you need to excapsulate the returned data with the correct tags for the context.

When trying to insert a `<tr>` in a table that uses `<tbody>`:
```html
<tbody hx-swap-oob="beforeend target:#table tbody">
	<tr>
		...
	</tr>
</tbody>
```

A "plain" table:
```html
<table hx-swap-oob="beforeend target:#table2">
	<tr>
		...
	</tr>
</table>
```

A `<li>` may be encapsulated in `<ul>`, `<ol>`, `<div>` or `<span>`, for example:
```html
<ul hx-swap-oob="beforeend target:#list1">
	<li>...</li>
</ul>
```

A `<p>` can be encapsulated in `<div>` or `<span>`:
```html
<span hx-swap-oob="beforeend target:#text">
	<p>...</p>
</span>
```

You can also now use `template` tag as this should work for nearly any tag type:
```html
<template hx-swap-oob="beforeend target:#table tbody">
	<tr>
		...
	</tr>
</template>
```

Another new option is the `strip:true` swap modifier that allows you to replace an element with multiple nodes:
```html
<div id="foo" hx-swap-oob="outerHTML strip:true">
	<div id="foo2">
		Replace original
	</div>
    <div>
        And add something more
    </div>
</div>
```

### Troublesome Tables and lists

Note that you can use a `template` tag to encapsulate types of elements that, by the HTML spec, can't stand on their own in the
DOM (`<tr>`, `<td>`, `<th>`, `<thead>`, `<tbody>`, `<tfoot>`, `<colgroup>`, `<caption>`, `<col>` & `<li>`).

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

Some element types, like SVG, use a specific XML namespace for their child elements. This prevents internal elements from working correctly when swapped in, unless they are encapsulated within a `svg` tag. To modify the internal contents of an existing SVG, you can use both `template` and `svg` tags to encapsulate the elements, allowing them to get the correct namespace applied.

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

By default, any element with `hx-swap-oob=` attribute anywhere in the response is processed for oob swap behavior, including when an element is nested within the main response element.
This can be problematic when using [template fragments](https://htmx.org/essays/template-fragments/) where a fragment may be reused as an oob-swap target and also as part of a bigger fragment. When the bigger fragment is the main response the inner fragment will still be processed as an oob swap, removing it from the dom.

This behavior can be changed by setting the config `htmx.config.allowNestedOobSwaps` to `false`. If this config option is `false`, OOB swaps are only processed when the element is *adjacent to* the main response element, OOB swaps elsewhere will be ignored and oob-swap-related attributes stripped.

## Notes

* `hx-swap-oob` is not inherited
