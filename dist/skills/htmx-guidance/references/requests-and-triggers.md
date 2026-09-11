# Requests and Triggers

## Core Attributes

Issue requests with these attributes. Each takes a URL:

| Attribute   | Description    |
|-------------|----------------|
| `hx-get`    | GET request    |
| `hx-post`   | POST request   |
| `hx-put`    | PUT request    |
| `hx-patch`  | PATCH request  |
| `hx-delete` | DELETE request |
| `hx-query`  | QUERY request  |

### Default Triggers

- `input`, `textarea`, `select` trigger on `change`
- `form` triggers on `submit`
- Everything else triggers on `click`

Override with `hx-trigger`.

## hx-trigger

Specify what event triggers the request:

```html

<div hx-get="/data" hx-trigger="mouseenter">Hover me</div>
```

**Modifiers:**

| Modifier            | Description                                                                          |
|---------------------|--------------------------------------------------------------------------------------|
| `once`              | fire only once                                                                       |
| `changed`           | only fire if the value of the element changed                                        |
| `delay:<time>`      | debounce, e.g. `delay:500ms`. A new event resets the countdown                        |
| `throttle:<time>`   | throttle. The first event fires at once, later events wait for the cooldown           |
| `from:<selector>`   | listen on a different element. Accepts `document`, `window`, `closest`, `find`, `next`, `previous` |
| `target:<selector>` | only fire if `event.target` matches the selector                                      |
| `prevent`           | call `event.preventDefault()`                                                        |
| `stop`              | call `event.stopPropagation()`. `consume` is a synonym                                |
| `halt`              | shorthand for `prevent stop`                                                         |
| `capture`           | listen in the capture phase instead of the bubble phase                              |
| `passive`           | tell the browser the handler will not call `preventDefault()`                         |

A selector with whitespace needs parentheses: `from:(form input)`.

**Filters** (JavaScript expressions in brackets):

```html

<div hx-get="/data" hx-trigger="click[ctrlKey]">Ctrl+Click me</div>
```

**Special events:**

- `load` -- fires when element is loaded
- `revealed` -- fires when element scrolls into viewport
- `intersect` -- fires on intersection (options: `root:<sel>`, `threshold:<float>`)

**Polling:**

```html

<div hx-get="/updates" hx-trigger="every 2s">Poll</div>
```

**Multiple triggers** (comma-separated):

```html
<input hx-get="/search" hx-trigger="input changed delay:500ms, keyup[key=='Enter']"
       hx-target="#results">
```

**Triggering from HX-Trigger header** -- use `from:body`:

```html

<div hx-get="/table" hx-trigger="refreshTable from:body">...</div>
```
