---
layout: layout.njk
title: </> htmx - high power tools for html
---

## htmx Extensions

Htmx provides an extension mechanism for defining and using extensions within htmx-based applications.

## <a name="using"></a>[Using Extensions](#using)

Using an extension involves two steps:
 
 * include the extension definition, which will add it to the `htmx` extension registry
 * reference the extension via  the [hx-ext](/attributes/hx-ext) attribute
 
Here is an example

```html
  <script src="https://unpkg.com/htmx.org@0.0.8/dist/ext/debug.js"></script>  
  <button hx-post="/example" hx-ext="debug">This Button Uses The Debug Extension</button>
```

This loads the debug extension off of the `unpkg` CDN and then adds the debug extension to the given button.  (This
will print out extensive logging for the button, for debugging purposes.)

Note that the `hx-ext` tag may be placed on parent elements if you want a plugin to apply to an entire part of the DOM,
and on the `body` tag for it to apply to all htmx requests.

**Tip:** To use multiple extensions on one element, separate them with a comma:

```html
  <button hx-post="/example" hx-ext="debug, json-enc">This Button Uses Two Extensions</button>
```

## <a name="ignore"></a> [Ignoring Extensions](#ignoring)

By default, extensions are applied to the DOM node where it is invoked, along with all child elements inside of that parent node.
If you need to disable an extension somewhere within the DOM tree, you can use the `ignore:` keyword to stop it from being used.

```html
<div hx-ext="debug">
  <button hx-post="/example">This button used the debug extension</button>
  <button hx-post="/example" hx-ext="ignore:debug">This button does not</button>
</div>
```

## <a name="included"></a> [Included Extensions](#included)

htmx includes a set of extensions out of the box that address common developer needs.  These extensions are tested
against `htmx` in each distribution

### <a name='reference'></a> [Included Extensions List](#reference)

<div class="info-table">

| Extension | Description
|-----------|-------------
| [`json-enc`](/extensions/json-enc) | use JSON encoding in the body of requests, rather than the default `x-www-form-urlencoded`
| [`method-override`](/extensions/method-override) | use the `X-HTTP-Method-Override` header for non-`GET` and `POST` requests
| [`morphdom-swap`](/extensions/morphdom-swap) | an extension for using the [morphdom](https://github.com/patrick-steele-idem/morphdom) library as the swapping mechanism in htmx.
| [`client-side-templates`](/extensions/client-side-templates) | support for client side template processing of JSON responses
| [`debug`](/extensions/debug) | an extension for debugging of a particular element using htmx
| [`path-deps`](/extensions/path-deps) | an extension for expressing path-based dependencies [similar to intercoolerjs](http://intercoolerjs.org/docs.html#dependencies)
| [`class-tools`](/extensions/class-tools) | an extension for manipulating timed addition and removal of classes on HTML elements
| [`rails-method`](/extensions/rails-method) | includes the `_method` parameter in requests for rails compatibility
| [`remove-me`](/extensions/remove-me) | allows you to remove an element after a given amount of time
| [`include-vals`](/extensions/include-vals) | allows you to include additional values in a request
| [`ajax-header`](/extensions/ajax-header) | includes the commonly-used `X-Requested-With` header that identifies ajax requests in many backend frameworks

</div>

## <a name="defining"></a>[Defining an Extensions](#defining)

To define an extension you call the `htmx.defineExtension()` function:

```html
<script>
  htmx.defineExtension('my-ext', {
    onEvent : function(name, evt) {
        console.log("Fired event: " + name, evt);
    }
  })
</script>
```

Typically, this is done in a stand-alone javascript file, rather than in an inline `script` tag.

Extensions should have names that are dash separated and that are reasonably short and descriptive.

Extensions can override the following default extension points to add or change functionality:

```javascript
{
    onEvent : function(name, evt) {return true;},
    transformResponse : function(text, xhr, elt) {return text;},
    isInlineSwap : function(swapStyle) {return false;},
    handleSwap : function(swapStyle, target, fragment, settleInfo) {return false;},
    encodeParameters : function(xhr, parameters, elt) {return null;}
}
```
