---
title: "HCON — htmx Configuration Object Notation"
description: "The lightweight config format used throughout htmx attributes"
---

HCON (htmx Configuration Object Notation) is the mini config language that htmx uses to parse structured values out of HTML attributes. It is designed to feel natural in attribute values — no outer braces required, flexible quoting, flag-style booleans — while still accepting plain JSON when you need it.

You encounter HCON any time htmx reads a structured attribute:

- `hx-swap` modifiers — `innerHTML swap:200ms settle:100ms`
- `hx-trigger` modifiers — `click delay:500ms throttle:1s`
- `hx-config` — `credentials:"include" timeout:5000`
- `hx-vals` / `hx-headers` — `token:"abc" retry:3`
- The `<meta name="htmx-config">` tag
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
| `42`, `500` | integer |
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

<!-- strings — quotes needed when value contains spaces or special chars -->
<button hx-get="/api" hx-config='credentials:"include"'>
<button hx-get="/api" hx-config="mode:'cors'">
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

JSON and HCON are not mixed — the entire string is one or the other.

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
<button hx-get="https://api.example.com/data" hx-config='credentials:"include" mode:"cors"'>
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

## Limitations

- **No arrays** — HCON has no array literal syntax. Use JSON (`[...]`) or the JSON fallback (`{...}`) when you need arrays.
- **No nesting beyond dot-notation** — `a.b.c:value` works; `a:{b:{c:value}}` does not (use JSON for that).
- **Integer values only** — bare numbers are parsed as integers via `parseInt`. Floats must be quoted: `threshold:"0.5"`.
- **No expressions** — values are literals only. For dynamic values use `js:` prefix on the attribute (e.g. `hx-vals="js:{token: getToken()}"`).
- **Prototype safety** — keys `__proto__`, `constructor`, and `prototype` are silently ignored.
- **Mixed JSON+HCON** — a string starting with `{` is always JSON; you cannot mix the two syntaxes in one attribute value.
