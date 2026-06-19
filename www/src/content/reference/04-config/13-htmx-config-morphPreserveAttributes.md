---
title: "htmx.config.morphPreserveAttributes"
description: "Attribute names morph preserves on any element"
---

The `htmx.config.morphPreserveAttributes` option preserves matching attribute names on any element during morph.

**Default:** `null`

**Always preserved (built-in, cannot disable):**

- `data-htmx-powered` (htmx's internal marker)
- `hx-preserve` and its modifiers (`hx-preserve:children`, `hx-preserve:attributes`, plus configured prefix variants like `data-hx-preserve*`)

## Example

```javascript
htmx.config.morphPreserveAttributes = "data-state-*, aria-(label|hidden), style";
```

```html
<meta name="htmx-config" content="morphPreserveAttributes: 'data-state-*, aria-(label|hidden), style'">
```

## Accepted forms

Either a comma- or whitespace-separated string, or an array. The string form is the ergonomic choice for meta tags.

```javascript
htmx.config.morphPreserveAttributes = ["data-state", "data-keep-*"];
```

## Pattern syntax

| Pattern | Matches |
|---|---|
| `"data-state"` | exact name `data-state` (and only that) |
| `"data-*"` | any name starting with `data-` |
| `"*-id"` | any name ending with `-id` |
| `"data-*-foo"` | any name starting with `data-` and ending with `-foo` |
| `"aria-(label\|hidden)"` | exactly `aria-label` or `aria-hidden` |

Plain strings are **exact match** by default. Use `*` for wildcards (anywhere in the pattern). Use `(a|b)` for alternation.

Regex special characters (`.`, `+`, `?`, `^`, `$`, `{`, `}`, `[`, `]`, `\`) are treated literally, not as regex operators.

A `RegExp` object also works (JavaScript-only, can't go in a meta tag):

```javascript
htmx.config.morphPreserveAttributes = [/^x-[0-9]+$/];
```

## Use cases

Preserve client-side state attributes set by JS:
```javascript
htmx.config.morphPreserveAttributes = "data-state-*, data-client-*";
```

Avoid CSP violations from `style` attribute copying:
```javascript
htmx.config.morphPreserveAttributes = "style";
```

For per-element scoping (preserve `state` only on `<lit-component>`, not on every element), use the [`hx-preserve:attributes`](/reference/attributes/hx-preserve) attribute on the element itself, not the global config.

## See also

- [`morphPreserve`](/reference/config/htmx-config-morphPreserve), preserve the whole element
- [`morphPreserveChildrenOf`](/reference/config/htmx-config-morphPreserveChildrenOf), preserve the children list
- [`hx-preserve`](/reference/attributes/hx-preserve), per-element preservation
