+++
title = "Building htmx Extensions"
+++

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
    init: function(api) {return null;},
    getSelectors: function() {return null;},
    onEvent : function(name, evt) {return true;},
    transformResponse : function(text, xhr, elt) {return text;},
    isInlineSwap : function(swapStyle) {return false;},
    handleSwap : function(swapStyle, target, fragment, settleInfo) {return false;},
    encodeParameters : function(xhr, parameters, elt) {return null;}
}
```
