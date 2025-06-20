+++
title = "htmx 1.x Compatibility Extension"
+++

The `htmx-1-compat` extension allows you to almost seamlessly upgrade from htmx 1.x to htmx 2.

## Installing

The fastest way to install `htmx-1-compat` is to load it via a CDN. Remember to always include the core htmx library before the extension and enable the extension.
```HTML
<head>
    <script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.5/dist/htmx.min.js" integrity="sha384-HGfztofotfshcF7+8n44JQL2oJmowVChPTg48S+jvZoztPfvwD79OC/LTtG6dMp+" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/htmx-ext-htmx-1-compat@2.0.0" integrity="sha384-lcvVWaNjF5zPPUeeWmC0OkJ2MLqoWLlkAabuGm+EuMSTfGo5WRyHrNaAp0cJr9Pg" crossorigin="anonymous"></script>
</head>
<body hx-ext="htmx-1-compat">
...
```
An unminified version is also available at https://cdn.jsdelivr.net/npm/htmx-ext-htmx-1-compat/dist/htmx-1-compat.js.

While the CDN approach is simple, you may want to consider [not using CDNs in production](https://blog.wesleyac.com/posts/why-not-javascript-cdn). The next easiest way to install `htmx-1-compat` is to simply copy it into your project. Download the extension from `https://cdn.jsdelivr.net/npm/htmx-ext-htmx-1-compat`, add it to the appropriate directory in your project and include it where necessary with a `<script>` tag.

For npm-style build systems, you can install `htmx-1-compat` via [npm](https://www.npmjs.com/):
```shell
npm install htmx-ext-htmx-1-compat
```
After installing, you'll need to use appropriate tooling to bundle `node_modules/htmx-ext-htmx-1-compat/dist/htmx-1-compat.js` (or `.min.js`). For example, you might bundle the extension with htmx core from `node_modules/htmx.org/dist/htmx.js` and project-specific code.

If you are using a bundler to manage your javascript (e.g. Webpack, Rollup):
- Install `htmx.org` and `htmx-ext-htmx-1-compat` via npm
- Import both packages to your `index.js`
```JS
import `htmx.org`;
import `htmx-ext-htmx-1-compat`; 
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
