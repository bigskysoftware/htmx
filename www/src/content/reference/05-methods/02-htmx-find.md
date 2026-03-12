---
title: "htmx.find()"
description: "Find first matching element"
---

The `htmx.find()` function finds the first element matching a CSS selector.

## Syntax

```javascript
// Find from document
htmx.find(selector)

// Find within element
htmx.find(element, selector)
```

## Parameters

- `selector` - CSS selector string
- `element` - Optional element to search within

## Example

```javascript
// Find from document
let button = htmx.find('#myButton');

// Find within specific element
let container = htmx.find('#container');
let input = htmx.find(container, 'input[type="text"]');
```

## Return Value

Returns the first matching element, or `null` if no match found.
