+++
title = "hx-swap-oob"
description = """\
  The hx-swap-oob attribute in htmx allows you to specify that some content in a response should be swapped into the \
  DOM somewhere other than the target, that is 'out-of-band'. This allows you to piggyback updates to other elements \
  on a response."""
+++

The `hx-swap-oob` attribute allows you to specify that some content in a response should be
swapped into the DOM somewhere other than the target, that is "Out of Band". This allows you to update multiple elements on a page with a single request.

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

### Syntax Options

The value of the `hx-swap-oob` attribute can be:

* `true` - Uses the default `outerHTML` swap strategy with ID-based targeting
* Any valid basic [`hx-swap`](@/attributes/hx-swap.md) strategy (innerHTML, outerHTML, beforebegin, etc)
* Any valid basic [`hx-swap`](@/attributes/hx-swap.md) strategy, followed by a colon, followed by a target CSS selector
* Any valid complex [`hx-swap`](@/attributes/hx-swap.md) value including modifiers like `target:` to set the target of the swap

### Behavior Details

If the value is `true` or `outerHTML` (which are equivalent) the element will be swapped inline.

If a different swap strategy than `true`/`outerHTML` is supplied the encapsulating tag pair will be stripped so only the inner contents of the element will be used. You can now use `strip:true` modifier to enable tag stripping for `outerHTML` or `strip:false` to disable it for the other strategies when required.

If a selector is given, all elements matched by that selector will be swapped.  If not, the element on the page with an ID matching that of the oob element will be swapped instead.

### Modifers

The following modifers from [`hx-swap`](@/attributes/hx-swap.md) can now be included after the swap strategy sperated by spaces:

* `transition:` - Wrap the oob swap in its own [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API) 
* `swap:`/`settle:` - Delay the swap or settle time for the oob swap and make its settle independant from the main swap
* `scroll:`/`show:`/`focus-scroll:` - Control the scrolling behaviour of the oob swap
* `strip:` - Override the stripping or not of the oob elements encapsulating tag pair
* `target:` - Set a custom CSS selector to use as the target

Before modifers were supported the swap strategy value could not contain spaces and the target selector was placed after a colon like `innerHTML:#status`. Now when the swap value contains a space it is parsed as swap modifers and you have to be explicit and use the `target:<selector>` modifier like `innerHTML swap:1s target:#status`.

### Using alternate swap strategies

Here are some examples of the various swap strategies:

```html
<!-- Basic usage with ID targeting -->
<div id="notifications" hx-swap-oob="true">New notification!</div>

<!-- Using innerHTML with explicit selector -->
<div hx-swap-oob="innerHTML:#status">Processing complete</div>

<!-- With timing modifier -->
<div hx-swap-oob="innerHTML swap:1s target:#status">Processing complete</div>

<!-- With scrolling -->
<div hx-swap-oob="beforeend scroll:bottom target:#log">New log entry</div>

<!-- With transition effect -->
<div id="animated-element" hx-swap-oob="outerHTML transition:true">Updated content</div>
```

### Proper Element Encapsulation

As mentioned previously when using swap strategies other than `true` or `outerHTML` the encapsulating tags are stripped by default, however you still need to excapsulate the returned data with the correct tags for the content so it can be parsed as valid html.

When trying to insert a `<tr>` in a table that uses `<tbody>`:
```html
<tbody hx-swap-oob="beforeend:#table tbody">
	<tr>...</tr>
</tbody>
```

A "plain" table:
```html
<table hx-swap-oob="beforeend target:#table2">
	<tr>...</tr>
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

You can also now use `template` tag as a universal tag that can encapsulate all tag types:
```html
<template hx-swap-oob="beforeend target:#table tbody">
	<tr>...</tr>
</template>
```

### Overriding Element Encapsulation 

Another new option is the `strip:true` swap modifier that allows you to replace an element with multiple nodes:
```html
<div id="foo" hx-swap-oob="outerHTML strip:true">
	<div id="foo2">Replace original</div>
    <div>And add something more</div>
</div>
```

You can also use `strip:false` to allow you to place the oob element itself in various locations
```html
<!-- insert after #username -->
<div hx-swap-oob="afterend strip:false target:#username">
	User Name is already taken!
</div>
```

### Troublesome Tables and lists

Note that you can use a `template` tag to encapsulate types of elements that, by the HTML spec, can not be placed adjacent to other normal tags in the DOM (`<tr>`, `<td>`, `<th>`, `<thead>`, `<tbody>`, `<tfoot>`, `<colgroup>`, `<caption>`, `<col>` & `<li>`).

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
When the main content node tag is one of the restricted ones you may also need to wrap the oob nodes.

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
