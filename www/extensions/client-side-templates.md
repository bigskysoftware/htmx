---
layout: layout.njk
title: </> htmx - high power tools for html
---

## The `client-side-templates` Extension

This extension supports transforming a JSON request response into HTML via a client-side template before it is
swapped into the DOM.  Currently three client-side templating engines are supported:

* [mustache](https://github.com/janl/mustache.js)
* [handlebars](https://handlebarsjs.com/)
* [nunjucks](https://mozilla.github.io/nunjucks/)

When you add this extension on an element, any element below it in the DOM can use one of three attributes named
`<template-engine>-template` (e.g. `mustache-template`) with a template ID, and the extension will resolve and render
the template the standard way for that template engine:

* `mustache` - looks a mustache &lt;script> tag up by ID for the template content
* `handlebars` - looks in the `Handlebars.partials` collection fot a template with that name
* `nunjucks` - resolves the template by name via `nunjucks.render(<template-name>)

The AJAX response body will be parsed as JSON and passed into the template rendering.

### Usage

```html
<div hx-ext="client-side-templates">
  <button hx-get="/some_json" 
          mustache-template="my-mustache-template">
     Handle with mustache
  </button>
  <button hx-get="/some_json" 
          handlebars-template="my-handlebars-template">
     Handle with handlebars
  </button>
  <button hx-get="/some_json" 
          nunjucks-template="my-nunjucks-template">
     Handle with nunjucks
  </button>
</div>
```

### Source

<https://unpkg.com/htmx.org/dist/ext/client-side-templates.js>
