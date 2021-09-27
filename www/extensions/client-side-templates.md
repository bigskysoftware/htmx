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
* `handlebars` - looks in the `Handlebars.partials` collection for a template with that name
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

### Full HTML Example

To use the client side template, you will need to include htmx, the extension, and the rendering engine.
Here is an example of this setup for Mustache using 
a [`<template>` tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template).

If you wish to put a template into another file, you can use a directive such as
 `<script src="my-template" id="template-id" type="text/mustache">`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>JS Bin</title>
  <script src="https://unpkg.com/htmx.org@1.6.0"></script>
  <script src="https://unpkg.com/htmx.org@1.6.0/dist/ext/client-side-templates.js"></script>
  <script src="https://unpkg.com/mustache@latest"></script>
</head>
<body>
  <div hx-ext="client-side-templates">
    <button hx-get="https://jsonplaceholder.typicode.com/todos/1" 
            hx-swap="innerHTML"
            hx-target="#content"
            mustache-template="foo">
      Click Me
    </button>

    <p id="content">Start</p>
    
    <template id="foo">
      <p>{{userID}} and {{id}} and {{title}} and {{completed}}</p>
    </template>
  </div>
</body>
</html>
```

Here is a [jsbin](https://jsbin.com/qonutovico/edit?html,output) playground to try this out.

### CORS and REST/JSON

As a warning, many web services use CORS protection and/or other protection schemes to reject a
REST/JSON request from a web browser - for example, GitHub will issue a CORS error if you try to
use the above snippet to access public APIs. This can be frustrating, as a dedicated REST development
client may work fine, but the CORS error will appear when running JavaScript. This doesn't really
have anything to do with HTMX (as you'd have the same issues with any JavaScript code), but can be 
a frustrating surprise.

Unfortunately, the solution will vary depending on the provider of the web service. Depending on
what you are trying to do, you may find it easier to rely on your server-side framework to manage/proxy
these requests to 3rd parties services.
