---
name: htmx-debugging
description: Use when diagnosing htmx issues, troubleshooting requests that aren't firing, swaps that aren't happening, events that aren't triggering, or any unexpected htmx behavior.
argument-hint: "[description of the problem]"
---

# htmx 4 Debugging Guide

## Quick Diagnostic Checklist

Work through these in order -- most issues fall in the first few:

1. **Is htmx loaded?** Check for `htmx` global in console, verify script tag
2. **Is the element processed?** Check `element._htmx` property exists
3. **What htmx version?** Check `htmx.config.version` -- htmx 4 API is very different from htmx 2
4. **Is the trigger correct?** Defaults: `click` for most, `change` for inputs/selects/textareas, `submit` for forms
5. **Is the target correct?** Verify the CSS selector matches an existing element
6. **Does the server return HTML?** Not JSON -- check Content-Type and response body
7. **Check the response status** -- htmx 4 swaps ALL responses except 204 and 304 by default
8. **Is inheritance set up?** htmx 4 requires `:inherited` modifier on parent attributes
9. **For extensions:** Is the extension approved in `<meta name="htmx-config" content='{"extensions":"..."}'>`?

## Enable Debug Logging

The single most useful debugging step:

```html
<meta name="htmx-config" content='{"logAll": true}'>
```

or in the console:

```js
htmx.config.logAll = true;
```

This logs every htmx event to the console.

## Event Monitoring Snippet

Paste this in the console to monitor the request/swap lifecycle:

```js
['htmx:config:request', 'htmx:before:request', 'htmx:after:request',
 'htmx:before:swap', 'htmx:after:swap', 'htmx:error', 'htmx:finally:request']
.forEach(evt => document.body.addEventListener(evt, e => {
    console.log(evt, e.detail?.ctx?.request?.action, e.detail?.ctx?.response?.status, e.detail);
}));
```

To monitor what events a specific element is firing:

```js
monitorEvents(htmx.find("#theElement"));
```

## Common Issues and Solutions

### Request Not Firing

**Check the trigger:**
- Is the event actually happening? Use `monitorEvents()` on the element
- Default triggers differ by element type -- an `<input>` won't fire on `click`
- If using `hx-trigger="load"`, was the element in the DOM before htmx initialized?

**Check synchronization:**
- `hx-sync` may be dropping or queuing the request
- Check for `hx-sync="closest form"` or similar that might block it

**Check confirmation:**
- `hx-confirm` blocks until confirmed -- including `js:` async confirmation
- An `htmx:confirm` event listener calling `preventDefault()` without calling `issueRequest()` will block forever

**Check for `hx-ignore`:**
- A parent element with `hx-ignore` disables htmx for all children

**Dynamic content:**
- Elements added to the DOM after page load need `htmx.process(element)` to initialize htmx behavior
- Or use `htmx.onLoad()` to set up a callback for new content

### Swap Not Happening

**Check response status:**
- `204` and `304` do NOT swap by default (controlled by `htmx.config.noSwap`)
- In htmx 4, 4xx and 5xx responses DO swap by default (unlike htmx 2!)
- If you need htmx 2 behavior: `htmx.config.noSwap = [204, 304, '4xx', '5xx']`

**Check the target:**
- Does the `hx-target` CSS selector match an existing element?
- Use browser devtools to run `document.querySelector("your-selector")` to verify

**Check `hx-swap`:**
- `hx-swap="none"` explicitly prevents swapping
- `hx-swap="delete"` deletes the target regardless of response

**Check `hx-select`:**
- If set, only matching elements from the response are used
- If nothing matches, nothing gets swapped

**Check event listeners:**
- An `htmx:before:swap` listener calling `preventDefault()` will cancel the swap

### Wrong Content Being Swapped

**Check selectors:**
- `hx-select` might be matching the wrong element in the response
- `hx-target` might point to the wrong element

**Check for OOB/partial interference:**
- `hx-swap-oob` in the response swaps content by ID independently
- `<hx-partial>` tags in the response swap into their own targets
- In htmx 4, OOB swaps happen AFTER the main content swap (changed from htmx 2)

**Check response headers:**
- `HX-Retarget`, `HX-Reswap`, `HX-Reselect` override client-side attributes
- `hx-status:XXX` attributes can change target/swap based on status code

### Extension Not Working

1. Is the extension script loaded AFTER htmx.js?
2. Is the extension name listed in the `extensions` config? Check `<meta name="htmx-config" content='{"extensions": "ext-name"}'>`
3. Does the extension name match exactly (case-sensitive)?
4. Check console for registration errors
5. htmx 4 extensions use `htmx.registerExtension()` not `htmx.defineExtension()` -- make sure you have an htmx 4 compatible extension

### Inheritance Not Working

The #1 gotcha in htmx 4:

```html
<!-- WRONG: children won't inherit this -->
<div hx-target="#output">
  <button hx-get="/a">A</button>
</div>

<!-- RIGHT: use :inherited modifier -->
<div hx-target:inherited="#output">
  <button hx-get="/a">A</button>
</div>
```

- htmx 4 requires `:inherited` modifier by default
- Set `htmx.config.implicitInheritance = true` to get htmx 2 behavior
- Check that it's on the PARENT, not the child

### History/URL Issues

- `hx-push-url` and `hx-replace-url` require the URL to return a full page when accessed directly
- History restoration in htmx 4 does a full page request (no localStorage/sessionStorage cache)
- Set `htmx.config.history = "reload"` to do hard browser reloads on back/forward
- `hx-status` attributes with `push:false` can prevent URL updates on errors

### CSS Transitions Not Working

- CSS transitions rely on element ID stability across swaps -- keep `id` attributes consistent
- `htmx-swapping` class is applied before swap, `htmx-settling` after
- For View Transitions API: enable with `htmx.config.transitions = true` or `hx-swap="... transition:true"`
- Morphing (`innerMorph`/`outerMorph`) preserves animations better than `innerHTML`/`outerHTML`

### Form Data Not Included

- `GET` and `DELETE` requests do NOT include enclosing form data by default in htmx 4
- Fix: add `hx-include="closest form"` to include form values
- Non-GET/DELETE requests (POST, PUT, PATCH) DO include enclosing form values automatically
- Check `hx-vals` syntax: must be valid JSON, use `js:` prefix for dynamic values

### htmx 2 Code Not Working in htmx 4

Quick compatibility fixes:
1. Add `htmx.config.implicitInheritance = true` (restores automatic inheritance)
2. Add `htmx.config.noSwap = [204, 304, '4xx', '5xx']` (restores htmx 2 swap behavior)
3. Replace `hx-ext="name"` with `<script src="ext.js">` + `<meta name="htmx-config" content='{"extensions":"name"}'>`
4. Update event names: `htmx:beforeRequest` → `htmx:before:request`, `htmx:afterSwap` → `htmx:after:swap`, etc.
5. Replace `hx-disabled-elt` → `hx-disable`
6. Replace `hx-disable` (old meaning of ignoring) → `hx-ignore`
7. Replace `hx-vars` → `hx-vals` with `js:` prefix
8. Replace `hx-prompt` → `hx-confirm` with `js:` prefix
9. Or load the `htmx-2-compat` extension for gradual migration

## Browser DevTools Techniques

### Network Tab
- Filter by Fetch/XHR requests
- Look for `HX-Request: true` in request headers to confirm htmx is making the request
- Check response headers for `HX-Trigger`, `HX-Retarget`, `HX-Reswap`
- Check response body -- should be HTML, not JSON

### Elements Panel
- Inspect element and check for `_htmx` property (indicates htmx processed it)
- Look for `htmx-request` class during active requests
- Look for `htmx-swapping` / `htmx-settling` classes during swaps

### Console
- `htmx.config.logAll = true` -- log everything
- `htmx.find("#selector")` -- test extended CSS selectors
- `htmx.trigger(elt, "eventName")` -- manually fire events

## Instructions for Claude

When helping users debug htmx issues:

1. **Ask about the htmx version first** -- htmx 2 vs 4 is the most common source of confusion
2. **Suggest `logAll = true`** as the first step and ask for console output
3. **Check for `:inherited` modifier** when inheritance problems are reported
4. **Check the Network tab** -- verify the request is being made and inspect the response
5. **Check the response body** -- it should be HTML, not JSON
6. **Look for typos** in attribute names (e.g. `hx-triger` instead of `hx-trigger`)
7. **Check `hx-status` attributes** that might override swap behavior for specific status codes
8. **Verify the server** returns appropriate status codes (200 for success, 422 for validation errors, 204 for no-content)