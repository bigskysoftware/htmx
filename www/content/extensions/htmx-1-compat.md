+++
title = "htmx 1.x Compatibility Extension"
+++

The `htmx-1-compat` extension allows you to almost seamlessly upgrade from htmx 1.x to htmx 2.

## Install

```html

<script src="https://unpkg.com/htmx-ext-htmx-1-compat@2.0.0/htmx-1-compat.js"></script>
```

## What it covers

Htmx 2 introduced a few [breaking changes](https://v2-0v2-0.htmx.org/migration-guide-htmx-1/).

To make upgrading from htmx 1.x to htmx 2 easier, we're providing this extension that reverts most of those, so you're
able to benefit from the other changes without breaking your application.

### Obsolete attributes

- htmx 2 removed the deprecated [hx-ws](https://htmx.org/attributes/hx-ws/)
  and [hx-sse](https://htmx.org/attributes/hx-sse/) attributes, that this extension restores.
- htmx 2 removed the deprecated `hx-on` attribute in favor of the
  wildcard [`hx-on*` attribute](https://htmx.org/attributes/hx-on/), that this extension restores.

### Default Changes

- reverts [htmx.config.scrollBehavior](https://htmx.org/reference/#config) to 'smooth'.
- makes `DELETE` requests use a form-encoded body rather than URL parameters (htmx 2 uses URL parameters for `DELETE` as
  default as per [the spec](https://www.rfc-editor.org/rfc/rfc9110.html#name-delete)).
- allows cross-domain requests by default (htmx 2 now forbids it by default).

## What it does not cover

- IE11 support was dropped in htmx 2, and this extension cannot revert that. If you need IE11 support, please stay with
  htmx 1 that will continue being supported.
- htmx 2 introduced the breaking change that is the [swap method](https://v2-0v2-0.htmx.org/api/#swap) to the extensions
  API. If you were only using core extensions, then you shouldn't need any additional work. If you were using custom or
  community extensions, make sure that they were updated to work with htmx 2's API.
