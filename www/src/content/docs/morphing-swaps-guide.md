---
title: "Morphing Guide"
description: "How morph swaps work, when to use them, and how to control them."
---

## DOM Morphing

DOM Morphing is a technique where existing DOM elements are "morphed" to match new content.   A morph walks the old DOM 
and edits it into the shape of a new one, which allows nodes that are unchanged to (usually) retain their identity.

This can be very nice from a users perspective: Things like focus, text selection, scroll position and video
playback can continue uninterrupted as new content is merged into the DOM.  For developers, any state a script or web 
component put on the element can be preserved.

The authors of htmx created a morphing algorithm called [idiomorph](https://github.com/bigskysoftware/idiomorph), which
included an extension that  was recommended in htmx 2 if people wanted to have a morphing swap.  Other morphing algorithms
were also available: [Morphdom](#TODO) and [Alpine's Morph](#TODO)

In htmx 4, the idiomorph algorithm has been integrated into htmx, allowing you to specify the `innerMorph` and `outerMorph`
swap strategies without including any extensions.

## Using Morph Swaps

To use morphing in htmx 4, all you need to do is specify it via `hx-swap`:

```html
<div id="status" hx-get="/status" hx-trigger="every 5s" hx-swap="innerMorph">
  <h2>Build: passing</h2>
  <input name="note" placeholder="Add a note">
</div>
```

Here, any changes to the content of the `div` will be morphed in, and not disrupt
the user if the input has focus.

In htmx, the non-morphing swaps also do a pretty good job of maintaining things like input focus.  And
you have tools like  [`hx-preserve`](/reference/attributes/hx-preserve) if you want to ensure a particular
element survives swaps cleanly.  So morphing isn't always needed, but it can be a useful tool in many cases.

## The Swap Styles

The two [`hx-swap`](/reference/attributes/hx-swap) morphing styles are:

| Style | What it does |
|---|---|
| [`innerMorph`](/reference/attributes/hx-swap#innermorph) | Morphs the children of the target. The target element itself is untouched. |
| [`outerMorph`](/reference/attributes/hx-swap#outermorph) | Morphs the target element and its children. |

```html
<div id="content" hx-get="/refresh" hx-swap="innerMorph">
  ...
</div>
```

These are akin to the `innerHTML` and `outerHTML` swaps.

## The Idiomorph Algorithm

The Idiomorph algorithm works roughly like so:

- It builds a map of every `id` that appears in both the old content and the new content
- It then builds up a set of all `id`s found *within* nodes (that is, children)
- It then tries to rebuild the old content in the shape of the new content with the minimum number of moves necessary

From a practical perspective, you are going to want to put `id` attributes on elements that you want to remain stable.  An element that has the same `id` will remain in the new DOM.  Elements that don't 
have an `id` but have elements with stable `id` attributes within them will also typically remain stable.

Idiomorph makes it such that you don't need to go overboard with `id`s, but you will still want to mark important elements with `id`s to get stable morphing behavior.

## Excluding Elements

Some times you may wish to skip elements while morphing.  For this there are two attributes:

- [`hx-morph-skip`](/reference/attributes/hx-morph-skip) - freeze the element. Attributes and children are both left alone.
- [`hx-morph-skip-children`](/reference/attributes/hx-morph-skip-children) - morph the attributes, leave the children alone.

```html
<custom-widget hx-morph-skip>...</custom-widget>

<div hx-morph-skip-children class="chart">...</div>
```

You can also extend the global selectors:

```javascript
htmx.config.morphSkip         = '[hx-morph-skip], custom-widget, .frozen';
htmx.config.morphSkipChildren = '[hx-morph-skip-children], lit-component, .sortable';
```

This lets you opt out of morphing for third party widgets, web components, etc.

## Input Values and Focus

Morph can be very useful for replacing or updating forms for dynamic validation.

Morph swaps automatically preserve the value of the currently focused input or textarea, even when the server
returns a different value. This prevents stale responses from overwriting what the user is typing.

For unfocused inputs, htmx preserves the user's value unless the `value` attribute changes between old and new content.
This differs from idiomorph's default behavior, which resets the `.value` property to match the `value` attribute on every morph.
To preserve all input values, have your server return inputs without changing the `value` attribute, or add `'value'` to `htmx.config.morphIgnore`.

## Configuring

Two more configuration knobs you have when tuning morphing behavior are:

- [`htmx.config.morphIgnore`](/reference/config/htmx-config-morphIgnore),
a list of attribute name prefixes htmx never touches. Defaults to
`["data-htmx-powered"]`.
- [`htmx.config.morphScanLimit`](/reference/config/htmx-config-morphScanLimit),
default `10`. How far htmx looks ahead through siblings before it gives up on a
positional (non-id) match.  Lower is faster, but will miss more matches.

## See Also

- [`hx-swap`](/reference/attributes/hx-swap)
- [`hx-preserve`](/reference/attributes/hx-preserve)
- [`hx-morph-skip`](/reference/attributes/hx-morph-skip)
- [`hx-morph-skip-children`](/reference/attributes/hx-morph-skip-children)
- [`htmx.config.morphSkip`](/reference/config/htmx-config-morphSkip)
- [`htmx.config.morphSkipChildren`](/reference/config/htmx-config-morphSkipChildren)
