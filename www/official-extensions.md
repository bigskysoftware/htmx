---
layout: layout.njk
title: </> htmx - high power tools for html
---

## Official Extensions

The following extensions are tested against htmx and thus are considered officially supported.

### <a name="debug">[`debug`](#debug)

#### Description

This extension includes log all htmx events for the element it is on with the `"DEBUG:"` prefix.

#### Usage

```html
<button hx-ext="debug">Debug Me...</button>
```

#### Source

```javascript
htmx.defineExtension('debug', {
    onEvent : function(name, evt) {
        if(console.debug){
            console.debug(name, evt);
        } else if(console) {
            console.log("DEBUG:", name, evt);
        } else {
            throw "NO CONSOLE SUPPORTED"
        }
    }
});
```

### <a name="rails-method">[`rails-method`](#rails-method)

#### Description

This extension includes the rails `_method` parameter in non-`GET` or `POST` requests.

#### Usage

```html
<body hx-ext="rails-method">
 ...
</body>
```

#### Source

```javascript
htmx.defineExtension('rails-method', {
    onEvent : function(name, evt) {
        if(name === "configRequest.htmx"){
            var methodOverride = evt.detail.headers['X-HTTP-Method-Override'];
            if(methodOverride){
                evt.detail.parameters['_method'] = methodOverride;
            }
        }
    }
});
```

### <a name="morphdom-swap">[`morphdom-swap`](#morphdom-swap)

#### Description

This extension allows you to use the [morphdom](https://github.com/patrick-steele-idem/morphdom) library as the
swapping mechanism in htmx.

#### Usage

```html
<header>
  <script src="lib/morphdom-umd.js"></script> <!-- include the morphdom library -->
</header>
<body hx-ext="morphdom-swap">
   <button hx-swap="morphdom">This button will be swapped with morphdom!</button>
</body>
```

#### Source

```javascript
htmx.defineExtension('morphdom-swap', {
    handleSwap : function(swapStyle, target, fragment) {
        if (swapStyle === 'morphdom') {
            morphdom(target, fragment.outerHTML);
            return []; // no settle phase when using morphdom!
        }
    }
});
```

### <a name="json-enc">[`json-enc`](#json-enc)

#### Description

This extension encodes parameters in JSON format instead of url format.

#### Usage

```html
<div hx-post='/test' hx-ext='json-enc'>click me</div>
```

#### Source

```javascript
htmx.defineExtension('json-enc', {
    encodeParameters : function(xhr, parameters, elt) {
        xhr.requestHeaders['Content-Type'] = 'application/json';
        xhr.overrideMimeType('text/json');
        return (JSON.stringify(parameters));
    }
});

```

### <a name="client-side-templates">[`client-side-templates`](#client-side-templates)

#### Description

This extension supports transforming a JSON request response into HTML via a client-side template before it is
swapped into the DOM.  Currently three client-side templating engines are supported:

* [mustache](https://github.com/janl/mustache.js)
* [handlebars](https://handlebarsjs.com/)
* [nunjucks](https://mozilla.github.io/nunjucks/)

When you add this extension on an element, any element below it in the DOM can use one of three attributes named
`<template-engine>-temlpate` (e.g. `mustache-template`) with a template ID, and the extension will resolve and render
the template the standard way for that template engine:

* `mustache` - looks a mustache &lt;script> tag up by ID for the template content
* `handlebars` - looks in the `Handlebars.partials` collection fot a template with that name
* `nunjucks` - resolves the template by name via `nunjucks.render(<template-name>)

The AJAX response body will be parsed as JSON and passed into the template rendering.

#### Usage

```html
<div hx-ext='client-side-template'>
  <button mustache-template="my-mustache-template">Handle with mustache</button>
  <button handlebars-template="my-handlebars-template">Handle with handlebars</button>
  <button nunjucks-template="my-nunjucks-template">Handle with nunjucks</button>
</div>
```

#### Source

<https://unpkg.com/htmx.org/ext/client-side-templates.js>
