---
title: "htmx.process()"
description: "Process htmx attributes on element"
---

Processes htmx attributes on the specified element and its descendants, initializing htmx functionality.

## Syntax

```javascript
htmx.process(element)
htmx.process(element, force)
```

## Parameters

- `element` - DOM element to process
- `force` - (optional) when `true`, cleans up and resets existing htmx state before processing. Use after manually mutating hx attributes on an already-initialized element

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

Use `force` after manually mutating hx attributes on an already-initialized element:

```javascript
const btn = document.querySelector('#my-btn');
btn.setAttribute('hx-trigger', 'keyup');
htmx.process(btn, true);
```

## Notes

* Automatically called by htmx after swaps
* Useful when manually inserting HTML with htmx attributes
* Processes the element and all descendants
* Triggers [`htmx:before:process`](/reference/events/htmx-before-process) event before processing
* Initializes event listeners for [`hx-get`](/reference/attributes/hx-get), [`hx-post`](/reference/attributes/hx-post), etc.
* Sets up boosted links and forms
* Processes [`hx-on`](/reference/attributes/hx-on) attributes
* When `force` is `true`, triggers [`htmx:before:cleanup`](/reference/events/htmx-before-cleanup) before reinitializing
