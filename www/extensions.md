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
    handleSwap : function(swapStyle, target, fragment) {return null;},
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