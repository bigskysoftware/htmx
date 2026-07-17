---
title: "hx-boost"
description: "Converts links and forms to AJAX"
---

The `hx-boost` attribute makes links and forms use AJAX.

Without JavaScript, they retain their normal browser behavior through [progressive enhancement](https://en.wikipedia.org/wiki/Progressive_enhancement).

## Syntax

| Element | Request | Trigger | History | Target | Swap |
|---|---|---|---|---|---|
| `<a>` | `GET` to `href` | `click` | Push URL | `<body>` | [`outerSync`](/reference/attributes/hx-swap#outersync) |
| `<form>` | `GET` or `POST` to `action` | `submit` | No push | `<body>` | [`outerSync`](/reference/attributes/hx-swap#outersync) |

Override target, swap, and history behavior with their corresponding attributes. Boosted links always use `click`.

Boost several links from a parent:

```html
<div hx-boost:inherited="true">
  <a href="/page1">Page 1</a>
  <a href="/page2">Page 2</a>
</div>
```

Each link sends `GET`, pushes its URL, and swaps the response into `<body>` with `outerSync`.

`outerSync` replaces body children and syncs body attributes without replacing the `<body>` element.

Boost a form directly:

```html
<form hx-boost="true" action="/example" method="post">
  <input name="email" type="email">
  <button>Submit</button>
</form>
```

The form sends `POST` and swaps the response into `<body>` without pushing a URL. Add [`hx-push-url`](/reference/attributes/hx-push-url) to create a history entry.

## Advanced Syntax

You can configure boost behavior using a config string that sets swap, target, and other options directly
on the `hx-boost` attribute. Use `hx-boost:inherited` to pass that config down to all boosted descendants.

```html
<!-- outerSync + select + target: pull #main from the full-page response and swap it in place,
     syncing #main's attributes (class, data-*, etc.) at the same time -->
<body hx-boost:inherited="swap:outerSync select:#main target:#main">
  <nav>
    <!-- These links inherit the boost config above -->
    <a href="/page1">Go To Page 1</a>
    <a href="/page2">Go To Page 2</a>

    <!-- Nested override: descendants of this div use a different boost config -->
    <div hx-boost:inherited="swap:'innerHTML strip' target:#sidebar">
      <a href="/sidebar">Sidebar</a>

      <!-- Per-element override: this link uses its own config, ignoring all inherited -->
      <a href="/modal" hx-boost="swap:beforeend target:#modals">Open Modal</a>

      <!-- Disable boost for this link -->
      <a href="/external" hx-boost="false">External</a>
    </div>
  </nav>

  <!-- Non-boosted htmx elements are unaffected by hx-boost:inherited -->
  <div hx-get="/data" hx-trigger="load">Loading...</div>

  <div id="main"></div>
  <div id="sidebar"></div>
  <div id="modals"></div>
</body>
```

The key advantage is that boost config only applies to boosted elements (links and forms), unlike inherited
`hx-*` attributes which would affect all descendant htmx elements.

### Priority Order

Boost config **overrides** explicit `hx-*` attributes on the element:

1. Boost config (highest priority)
2. Explicit `hx-*` attributes
3. Default values (lowest priority)

This allows you to:
- Set base defaults with `hx-target`, `hx-swap` on elements
- Override them with `hx-boost:inherited` at any level
- Use `hx-boost="true"` or `hx-boost="false"` to enable/disable

Supported modifiers:

- `swap:STYLE` - Swap strategy (`outerSync`, `innerHTML`, `outerHTML`, etc.)
- `target:SELECTOR` - Target element selector
- `select:SELECTOR` - Content selection from response (works with `outerSync`; use `innerHTML strip` instead of `innerHTML` + `select` when targeting a non-body element)

## Anchor Boosting

Anchors are boosted when they navigate to the same origin in the current window:

```html
<a href="/example">Same-origin link</a>
<a href="/example" target="_self">Same-origin link targeting this window</a>
```

These anchors are not boosted:

```html
<a href="https://other-domain.com/example">Different origin</a>
<a href="#section">Local anchor</a>
<a href="/report.pdf" download>Browser download</a>
<a href="/example" target="_blank">New window or tab</a>
```

## Notes

* All requests are done via AJAX, so keep that in mind when doing things like redirects
* To find out if the request results from a boosted anchor or form, look for
  [`HX-Boosted`](/reference/headers/HX-Boosted) in the request header
* Selectively disable boost on child elements with `hx-boost="false"`
* Disable the replacement of elements via boost, and their children, with
  [`hx-preserve="true"`](/reference/attributes/hx-preserve)
