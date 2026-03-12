---
title: "htmx.takeClass()"
description: "Move a class to a specific element"
---

The `htmx.takeClass()` function removes a class from all sibling elements and adds it to the target element.

## Syntax

```javascript
htmx.takeClass(element, className, container)
```

## Parameters

- `element` - Element to receive the class
- `className` - CSS class name to move
- `container` - Optional parent element to search within (defaults to element's parent)

## Example

```javascript
// Make tab active, removing from siblings
htmx.takeClass(document.getElementById('tab2'), 'active');

// Within specific container
let tabs = document.getElementById('tabs');
htmx.takeClass(tab, 'selected', tabs);
```

This is useful for implementing tab interfaces or exclusive selection patterns.
