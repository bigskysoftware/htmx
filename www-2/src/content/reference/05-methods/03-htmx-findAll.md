---
title: "htmx.findAll()"
description: "Find all matching elements"
---

# **`htmx.findAll()`**

The `htmx.findAll()` function finds all elements matching a CSS selector.

## Syntax

```javascript
// Find from document
htmx.findAll(selector)

// Find within element
htmx.findAll(element, selector)
```

## Parameters

- `selector` - CSS selector string
- `element` - Optional element to search within

## Example

```javascript
// Find all buttons from document
let buttons = htmx.findAll('button');

// Find all inputs within form
let form = htmx.find('#myForm');
let inputs = htmx.findAll(form, 'input');
```

## Return Value

Returns an array of matching elements (empty array if no matches).
