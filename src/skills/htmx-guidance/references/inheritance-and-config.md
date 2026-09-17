# Inheritance and Configuration

## Attribute Inheritance (CRITICAL htmx 4 change)

**In htmx 4, inheritance is explicit by default.** Use the `:inherited` modifier on parent elements:

```html
<!-- WRONG in htmx 4: children won't inherit hx-target -->
<div hx-target="#output">
    <button hx-get="/a">A</button>
    <button hx-get="/b">B</button>
</div>

<!-- CORRECT: use :inherited modifier -->
<div hx-target:inherited="#output">
    <button hx-get="/a">A</button>
    <button hx-get="/b">B</button>
</div>
```

The `:append` modifier appends to inherited values:

```html

<div hx-include:inherited="[name='token']">
    <button hx-post="/save" hx-include:inherited:append="[name='extra']">Save</button>
</div>
```

To revert to implicit inheritance globally: set `htmx.config.implicitInheritance = true`.

## Configuration

Set via meta tag or JavaScript:

```html

<meta name="htmx-config" content='{"defaultSwap":"outerHTML"}'>
```

Key config values:

| Config                   | Default                      | Description                                                    |
|--------------------------|------------------------------|----------------------------------------------------------------|
| `defaultSwap`            | `innerHTML`                  | Default swap strategy                                          |
| `defaultTimeout`         | `60000`                      | Request timeout (ms)                                           |
| `defaultSettleDelay`     | `1`                          | Delay in ms between swap and settle                            |
| `defaultFocusScroll`     | `false`                      | Scroll focused elements into view after a swap                 |
| `noSwap`                 | `[204, 304]`                 | Status codes that skip swapping                                |
| `allowEmptySwapAfterOOB` | `false`                      | Run the main swap when the response holds only OOB or partial content |
| `implicitInheritance`    | `false`                      | Auto-inherit attributes from parents                           |
| `transitions`            | `false`                      | Enable View Transitions globally                               |
| `logAll`                 | `false`                      | Log every event to console (debugging)                         |
| `mode`                   | `same-origin`                | Fetch mode (`cors`, `no-cors`, `same-origin`)                  |
| `history`                | `true`                       | Enable history support (`true`, `false`, `"reload"`)           |
| `extensions`             | `""`                         | Whitelist of allowed extensions. Empty allows all              |
| `prefix`                 | `"data-hx-"`                 | Second attribute prefix, checked in addition to `hx-`          |
| `metaCharacter`          | unset, acts as `:`           | Character that introduces an attribute modifier                |
| `indicatorClass`         | `htmx-indicator`             | Class on elements that show during a request                   |
| `requestClass`           | `htmx-request`               | Class added while a request is in flight                       |
| `includeIndicatorCSS`    | `true`                       | Inject the default indicator stylesheet                        |
| `inlineScriptNonce`      | unset                        | Nonce added to scripts htmx inserts                            |
| `morphIgnore`            | `["data-htmx-powered"]`      | Attribute name prefixes to leave unchanged when morphing       |
| `morphScanLimit`         | `10`                         | Sibling scan limit during morphing                             |
| `morphSkip`              | `'[hx-morph-skip]'`          | CSS selector for elements to skip morphing entirely            |
| `morphSkipChildren`      | `'[hx-morph-skip-children]'` | CSS selector for elements whose children skip morphing         |

`prefix` is additive, not a replacement. `hx-get` and `data-hx-get` both work out of the box.

Config values use HCON, htmx's configuration object notation. HCON accepts JSON, but also a shorter form:

```html
<meta name="htmx-config" content="defaultSwap:outerHTML, logAll:true">
```
