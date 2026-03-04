---
title: "htmx.process()"
description: "Process htmx attributes on element"
---

# **`htmx.process()`**

Processes htmx attributes on the specified element and its descendants, initializing htmx functionality.

## Syntax

```javascript
htmx.process(element)
```

## Parameters

- `element` - DOM element to process

## Usage

Use when dynamically adding HTML with htmx attributes to the page:

```javascript
// Add new content to the page
const newContent = document.createElement('div');
newContent.innerHTML = '<button hx-get="/api/data">Load</button>';
document.body.appendChild(newContent);

// Process htmx attributes on the new content
htmx.process(newContent);
```

## Notes

* Automatically called by htmx after swaps
* Useful when manually inserting HTML with htmx attributes
* Processes the element and all descendants
* Triggers `htmx:before:process` event before processing
* Initializes event listeners for hx-get, hx-post, etc.
* Sets up boosted links and forms
* Processes hx-on attributes
