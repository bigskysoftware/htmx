---
title: "HCON"
description: "htmx Configuration Object Notation, the mini config language for structured HTML attributes."
---

HCON (htmx Configuration Object Notation) is htmx's mini config language for structured HTML attributes.

```html
<meta name="htmx-config" content="transitions defaultTimeout:5000 sse.reconnect:true">
```

The equivalent JSON form works too:

```html
<meta name="htmx-config" content='{"transitions":true,"defaultTimeout":5000,"sse":{"reconnect":true}}'>
```

HCON drops the outer braces and accepts flag-style booleans, dotted paths, flexible quoting, and space-separated pairs.

You encounter HCON any time htmx reads a structured attribute:

- `hx-swap` modifiers: `innerHTML swap:200ms settle:100ms`
- `hx-trigger` modifiers: `click delay:500ms throttle:1s`
- `hx-config`: `credentials:"include" timeout:5000`
- `hx-vals` / `hx-headers`: `token:"abc" retry:3`
- `<meta name="htmx-config">`
- `HX-Location` response header

---

## Syntax

### Key-value pairs

Pairs are separated by spaces or commas. Both are equivalent.

```
key:value key2:value2
key:value, key2:value2
```

### Value types

| Input | Parsed as |
|---|---|
| `true` / `false` | boolean |
| `42`, `0.5` | number |
| `"quoted string"` | string (double quotes) |
| `'quoted string'` | string (single quotes) |
| `bare-word` | string |
| *(no value)* | `true` |

```html
<!-- booleans -->
<button hx-get="/api" hx-config="validate">          <!-- validate: true -->
<button hx-get="/api" hx-config="validate:false">    <!-- validate: false -->

<!-- numbers -->
<button hx-get="/api" hx-config="timeout:5000">

<!-- strings, quotes needed when value contains spaces or special chars -->
<button hx-get="/api" hx-config='credentials:"include"'>
<button hx-get="/api" hx-config="cache:'no-cache'">
```

### Dot-notation for nested keys

Use `.` to set nested object properties:

```html
<meta name="htmx-config" content="sse.reconnect:true sse.reconnectDelay:1000">
```

This produces `{ sse: { reconnect: true, reconnectDelay: 1000 } }`.

### JSON fallback

Any value starting with `{` is parsed as JSON instead of HCON. This lets you compose config server-side and inject it directly:

```html
<!-- server renders this -->
<meta name="htmx-config" content='{"defaultSwap":"outerHTML","transitions":true}'>

<!-- or on an element -->
<button hx-get="/api" hx-config='{"credentials":"include","timeout":5000}'>
```

JSON and HCON are not mixed, the entire string is one or the other.

### Escaping commas and special characters

Wrap values in quotes when they contain commas, spaces, or HCON delimiters.

```html
<!-- comma ends the trigger spec -->
<input hx-trigger="keyup from:.a, .b">

<!-- quoted, comma is part of the value -->
<input hx-trigger='keyup from:".a, .b"'>

<!-- space ends the bare value -->
<button hx-vals="message:hello world">

<!-- quoted, the whole phrase is the value -->
<button hx-vals='message:"hello world"'>
```

For selector values, use single quotes, double quotes, or the `<.../>` form. Choose a form that does not conflict with the HTML attribute quotes:

```html
<input hx-trigger="keyup from:'.a, .b'">
<input hx-trigger='keyup from:".a, .b"'>
<input hx-trigger="keyup from:<.a, .b/>">
```

---

## Where HCON is used

### `hx-swap` modifiers

The swap style comes first (not HCON), then modifiers are parsed as HCON:

```html
<div hx-get="/update" hx-swap="innerHTML swap:200ms settle:100ms scroll:top">
<div hx-get="/update" hx-swap="outerHTML transition:true ignoreTitle:true">
```

The full JSON form is also accepted. When using JSON, omitting `"style"` falls back to `config.defaultSwap` as expected; including it overrides the style:

```html
<!-- modifiers only, style = config.defaultSwap -->
<div hx-swap='{"swap":"200ms","settle":"100ms"}'>

<!-- explicit style -->
<div hx-swap='{"style":"outerHTML","swap":"200ms"}'>
```

Available swap modifiers: `swap`, `settle`, `scroll`, `show`, `scrollTarget`, `showTarget`,
`transition`, `strip`, `ignoreTitle`, `focusScroll`, `target`.

### `hx-trigger` modifiers

The event name comes first, then modifiers:

```html
<input hx-get="/search" hx-trigger="keyup delay:300ms">
<button hx-post="/save" hx-trigger="click throttle:1s">
<div hx-get="/poll" hx-trigger="every 2s">
<form hx-post="/submit" hx-trigger="submit once">
```

Available trigger modifiers: `delay`, `throttle`, `from`, `target`, `consume`, `changed`, `once`.

### `hx-config`

Merges into the request context before the request is issued. Useful for per-element fetch options:

```html
<button hx-get="/slow" hx-config="timeout:30000">
<button hx-get="/api/data" hx-config='credentials:"include" cache:"no-cache"'>
```

### `<meta name="htmx-config">`

Sets global `htmx.config` values. Accepts HCON or JSON:

```html
<!-- HCON -->
<meta name="htmx-config" content="defaultSwap:outerHTML transitions:true">

<!-- JSON -->
<meta name="htmx-config" content='{"defaultSwap":"outerHTML","transitions":true}'>

<!-- nested via dot notation -->
<meta name="htmx-config" content="sse.reconnect:true sse.reconnectMaxAttempts:5">
```

### `HX-Location` response header

The server can return HCON or JSON in this header:

```
HX-Location: /new-page
HX-Location: path:"/new-page" push:"true"
HX-Location: {"path":"/new-page","push":"true"}
```

---

## Attribute inheritance and `:append`

HCON itself is a parsing format. The `:append` composition feature lives one level up, in htmx's attribute inheritance system. When you use `:append` on an attribute name, htmx merges the child value with the inherited parent value by concatenating them (stripping `{}`):

```html
<div hx-headers:inherited='{"X-Tenant": "acme"}'>
  <button hx-get="/api"
          hx-headers:append='{"X-Request-ID": "123"}'>
    <!-- sends both headers -->
  </button>
</div>
```

This works for any attribute that accepts HCON/JSON, including `hx-vals` and `hx-headers`.

---

## Notes and limitations

- **Use JSON literals for primitive types.** `count:42` becomes a number, `enabled:true` becomes a boolean, and `name:bob` stays a string.
- **Quote values for grouping, not type control.** Quotes preserve spaces, commas, and delimiters. Quoted numeric and boolean values still parse as numbers and booleans.
- **Write durations naturally.** `200ms`, `2s`, and `1m` stay strings in HCON; htmx converts them where durations are expected.
- **Quote dotted keys to keep them literal.** `"a.b":1` produces `{"a.b": 1}`. Bare `a.b:1` produces `{a: {b: 1}}`.
- **Group spaces and commas.** Use single quotes, double quotes, or `<.../>`.
- **Use JSON for arrays.** HCON has no array literal syntax, so use JSON fallback, such as `{"items":[1,2,3]}`.
- **Use dot-notation for nested objects.** `a.b.c:value` works; `a:{b:{c:value}}` does not.
- **Use `js:` for expressions.** HCON values are literals, so write `hx-vals="js:{token: getToken()}"` for dynamic values.
- **Avoid prototype keys.** `__proto__`, `constructor`, and `prototype` are ignored.
- **Choose JSON or HCON.** A string starting with `{` is JSON; the two syntaxes cannot be mixed.

## See also

- [`hx-swap`](/reference/attributes/hx-swap)
- [`hx-trigger`](/reference/attributes/hx-trigger)
- [`hx-vals`](/reference/attributes/hx-vals)
- [`hx-config`](/reference/attributes/hx-config)

