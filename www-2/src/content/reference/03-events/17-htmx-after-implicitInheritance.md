---
title: "htmx:after:implicitInheritance"
description: "After implicit inheritance is applied"
---

The `htmx:after:implicitInheritance` event is an internal event fired when htmx handles implicit attribute inheritance from parent to child elements.

## When It Fires

When `htmx.config.implicitInheritance` is enabled and attributes are inherited from parent elements.

## Event Detail

- `elt` - Child element receiving inherited attributes
- `parent` - Parent element providing the attributes

## Example

```javascript
htmx.on('htmx:after:implicitInheritance', (evt) => {
  console.log('Inherited from:', evt.detail.parent, 'to:', evt.detail.elt);
});
```

This is primarily an internal event for debugging inheritance behavior.
