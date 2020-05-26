---
layout: layout.njk
title: </> htmx - high power tools for html
---

## htmx Extensions

Htmx has an extension mechanism for defining and using extensions to the default behavior in a simple and obvious manner.

There is a registry of officially supported (i.e. tested) extensions [here](/official-extensions).

## <a name="defining"></a>[Defining an Extensions](#defining)

To define an extension you need to call the `htmx.defineExtension()` function:

```html
<script>
  htmx.defineExtension('my-ext', {
    onEvent : function(name, evt) {
        console.log("Fired event: " + name, evt);
    }
  })
</script>
```

Extensions should have names that are dash separated like above and that are reasonably short and descriptive.

Extensions can override the following default extension fields:

```javascript
{
    onEvent : function(name, evt) {return true;},
    transformResponse : function(text, xhr, elt) {return text;},
    handleSwap : function(swapStyle, target, fragment) {return false;},
    encodeParameters : function(xhr, parameters, elt) {return null;}
}
```

## <a name="using"></a>[Using An Extension](#using)

To use an extension you use the [hx-ext](/attributes/hx-ext) attribute.  To use our extension defined above you
would say:

```html
  <button hx-post="/example" hx-ext="my-ext">This Button Uses My Extension</button>
```

Note that the `hx-ext` tag may be placed on parent elements if you want a plugin to apply to an entire swath of the dom,
and on the `body` tag for it to apply to all htmx requests.

## <a name="list"></a> [Extensions Reference](#list)

The following extensions that are tested and distributed with htmx:

<div class="info-table">

| Extension | Description
|-----------|-------------
| [`json-enc`](/extensions/json-enc) | use JSON encoding in the body of requests, rather than the default `x-www-form-urlencoded`
| [`morphdom-swap`](/extensions/morphdom-swap) | an extension for using the [morphdom](https://github.com/patrick-steele-idem/morphdom) library as the swapping mechanism in htmx.
| [`client-side-templates`](/extensions/client-side-templates) | support for client side template processing of JSON responses
| [`debug`](/extensions/debug) | an extension for debugging of a particular element using htmx
| [`path-deps`](/extensions/path-deps) | an extension for expressing path-based dependencies [similar to intercoolerjs](http://intercoolerjs.org/docs.html#dependencies)
| [`class-tools`](/extensions/class-tools) | an extension for manipulating timed addition and removal of classes on HTML elements

</div>