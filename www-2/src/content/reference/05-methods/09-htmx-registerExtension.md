---
title: "htmx.registerExtension()"
description: "Register htmx extension"
---

# **`htmx.registerExtension()`**

Registers an htmx extension. Alias for `htmx.defineExtension()`.

## Syntax

```javascript
htmx.registerExtension(name, extension)
```

## Parameters

- `name` - String name for the extension
- `extension` - Extension object with hook methods

## Usage

```javascript
htmx.registerExtension('my-ext', {
  init: function(api) {
    // Called when extension is registered
  },
  onEvent: function(name, evt) {
    // Called for htmx events
  }
});
```

## Extension Methods

Extensions can implement these hook methods:

- `init(api)` - Called when extension registers
- `onEvent(name, evt)` - Called for htmx events
- `transformResponse(text, xhr, elt)` - Modify response before processing
- `isInlineSwap(swapStyle)` - Return true if custom swap style should be processed
- `handleSwap(swapStyle, target, fragment, settleInfo)` - Handle custom swap styles
- `encodeParameters(xhr, parameters, elt)` - Modify request parameters

## Notes

* Same as `htmx.defineExtension()` - both names work
* Extension must be in `htmx.config.extensions` list to load (unless list is empty)
* Extensions are only registered once (duplicate registrations ignored)
* `init` method receives internal API for advanced integrations
