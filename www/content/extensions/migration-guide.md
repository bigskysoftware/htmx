+++
title = "Extension Migration Guide (htmx 2.x → 4.x)"
+++

This guide helps you migrate extensions from htmx 2.x to htmx 4.x.

## Overview of Changes

htmx 4 replaces the callback-based extension API with an event-based hook
system. Instead of implementing specific callback methods, extensions now
register handlers for lifecycle events.

## Callback Migration Map

### `init(api)`

**htmx 2.x:**

```javascript
init: function(api) {
    // Initialize extension
    return null;
}
```

**htmx 4:**

```javascript
init: ((internalAPI) => {
    // Store API reference for later use
    api = internalAPI;
});
```

**Notes:**

- Still called `init` but receives different API object
- Store the `internalAPI` reference to use in other hooks
- No longer returns a value

---

### `getSelectors()`

**htmx 2.x:**

```javascript
getSelectors: function() {
    return ['.my-selector', '[my-attr]'];
}
```

**htmx 4:**

- **No direct equivalent**
- Use `htmx_after_init` or `htmx_after_process` to find elements
- Use `api.attributeValue()` to check for attributes

**Migration approach:**

```javascript
htmx_after_init: ((elt) => {
    // Check if element has your attribute
    let value = api.attributeValue(elt, "hx-my-attr");
    if (value) {
        // Initialize for this element
    }
});
```

**Real-world example:**

```javascript
// htmx 2.x - Custom extension
getSelectors: function() {
    return ['[my-custom-attr]', '[data-my-custom-attr]'];
},

onEvent: function(name, evt) {
    if (name === 'htmx:afterProcessNode') {
        initializeCustomBehavior(evt.target);
    }
}

// htmx 4 - No getSelectors needed
htmx_after_init: (elt) => {
    // Check for custom attribute
    if (api.attributeValue(elt, 'my-custom-attr')) {
        initializeCustomBehavior(elt);
    }
}
```

**Notes:**

- `getSelectors()` was used to tell htmx which elements to process
- In htmx 4, all elements are processed and you check attributes in hooks
- This is more flexible as you can check any condition, not just selectors
- Note: SSE is now built into htmx 4 core, no extension needed

---

### `onEvent(name, evt)`

**htmx 2.x:**

```javascript
onEvent: function(name, evt) {
    if (name === "htmx:beforeRequest") {
        // Handle event
    }
    return true; // Continue
}
```

**htmx 4:**

- Replace with specific event hooks
- Event names use underscores instead of colons
- Each event has its own hook method

**Migration approach:**

```javascript
htmx_before_request: (elt, detail) => {
    // Handle before request
    return true; // or false to cancel
},

htmx_after_swap: (elt, detail) => {
    // Handle after swap
}
```

**Real-world examples:**

_Debug extension (logs all events):_

```javascript
// htmx 2.x
onEvent: function(name, evt) {
    console.debug(name, evt);
}

// htmx 4 - Need to implement each hook individually
htmx_before_request: (elt, detail) => console.debug('htmx:before:request', detail),
htmx_after_request: (elt, detail) => console.debug('htmx:after:request', detail),
// ... etc for each event you want to log
```

_Response-targets extension (handles non-200 responses):_

```javascript
// htmx 2.x
onEvent: function(name, evt) {
    if (name === 'htmx:beforeSwap' && evt.detail.xhr.status !== 200) {
        var target = getRespCodeTarget(evt.detail.requestConfig.elt, evt.detail.xhr.status);
        if (target) {
            evt.detail.shouldSwap = true;
            evt.detail.target = target;
        }
    }
}

// htmx 4
htmx_before_swap: (elt, detail) => {
    if (detail.ctx.response.status !== 200) {
        var target = getRespCodeTarget(elt, detail.ctx.response.status);
        if (target) {
            detail.ctx.target = target;
        }
    }
}
```

**Common event mappings:**

- `htmx:configRequest` → `htmx_config_request`
- `htmx:beforeRequest` → `htmx_before_request`
- `htmx:afterRequest` → `htmx_after_request`
- `htmx:beforeSwap` → `htmx_before_swap`
- `htmx:afterSwap` → `htmx_after_swap`
- `htmx:before:sse:message` → `htmx_before_sse_message`
- `htmx:after:sse:message` → `htmx_after_sse_message`

---

### `transformResponse(text, xhr, elt)`

**htmx 2.x:**

```javascript
transformResponse: function(text, xhr, elt) {
    // Transform response text
    return modifiedText;
}
```

**htmx 4:**

- Use `htmx_after_request` hook
- `ctx.text` is available and can be modified
- Transformation happens before swap

**Migration approach:**

```javascript
htmx_after_request: ((elt, detail) => {
    // Skip if SSE (ctx.text not set for SSE responses)
    if (!detail.ctx.text) return;

    // Transform the response text
    detail.ctx.text = transformText(detail.ctx.text);
});
```

**Real-world example (client-side-templates extension):**

```javascript
// htmx 2.x
transformResponse: function(text, xhr, elt) {
    var mustacheTemplate = htmx.closest(elt, '[mustache-template]');
    if (mustacheTemplate) {
        var data = JSON.parse(text);
        var templateId = mustacheTemplate.getAttribute('mustache-template');
        var template = htmx.find('#' + templateId);
        return Mustache.render(template.innerHTML, data);
    }
    return text;
}

// htmx 4
htmx_after_request: (elt, detail) => {
    // Skip if SSE (ctx.text not set for SSE responses)
    if (!detail.ctx.text) return;
    
    var mustacheTemplate = elt.closest('[mustache-template]');
    if (mustacheTemplate) {
        var data = JSON.parse(detail.ctx.text);
        var templateId = mustacheTemplate.getAttribute('mustache-template');
        var template = document.querySelector('#' + templateId);
        detail.ctx.text = Mustache.render(template.innerHTML, data);
    }
}
```

**Important Notes:**

- Event flow: Response received → `ctx.text` set → `htmx:after:request` fires →
  `ctx.text` consumed into fragment → `htmx:before:swap`
- `ctx.text` is available in `htmx_after_request` and can be modified directly
- For SSE responses, `ctx.text` is not set initially (check `ctx.isSSE`). SSE is
  now built into htmx 4 core

---

### `isInlineSwap(swapStyle)`

**htmx 2.x:**

```javascript
isInlineSwap: function(swapStyle) {
    return swapStyle === 'my-custom-swap';
}
```

**htmx 4:**

- **No direct equivalent**
- Not needed in new architecture
- Custom swap logic handled in `htmx_handle_swap`

**Important for OOB swaps:**

In htmx 2.x, `isInlineSwap` was used to prevent automatic stripping of wrapper elements for custom outer swap styles. In htmx 4, OOB swaps automatically strip the wrapper element for non-outer swap styles (those not starting with "outer"). 

If your custom swap style needs the wrapper element:

**Option 1:** Name your swap style starting with "outer" (e.g., `outerMorph`, `outerCustom`)

**Option 2:** Use `detail.unstripped` to access the original fragment:

```javascript
htmx_handle_swap: (target, detail) => {
    if (detail.swapSpec.style === 'my-outer-swap') {
        // For OOB swaps, use unstripped if available
        let frag = (detail.type === 'oob' && detail.unstripped) || detail.fragment;
        target.parentNode.replaceChild(frag.firstElementChild, target);
        return true;
    }
    return false;
}
```

**Notes:**
- `detail.unstripped` contains the original fragment before stripping (only set when stripping occurs)
- `detail.type` indicates if this is an 'oob', 'main', or 'partial' swap
- For main swaps, stripping doesn't occur automatically

---

### `handleSwap(swapStyle, target, fragment, settleInfo)`

**htmx 2.x:**

```javascript
handleSwap: function(swapStyle, target, fragment, settleInfo) {
    if (swapStyle === 'my-swap') {
        target.appendChild(fragment);
        return true; // Handled
    }
    return false; // Not handled
}
```

**htmx 4:**

```javascript
htmx_handle_swap: ((target, detail) => {
    let { swapSpec, fragment } = detail;
    if (swapSpec.style === "my-swap") {
        target.appendChild(fragment);
        return true; // Handled
    }
    return false; // Not handled
});
```

**Real-world example (morphdom-swap extension):**

```javascript
// htmx 2.x
isInlineSwap: function(swapStyle) {
    return swapStyle === 'morphdom';
},

handleSwap: function(swapStyle, target, fragment) {
    if (swapStyle === 'morphdom') {
        if (fragment.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
            morphdom(target, fragment.firstElementChild || fragment.firstChild);
            return [target];
        } else {
            morphdom(target, fragment.outerHTML);
            return [target];
        }
    }
}

// htmx 4
htmx_handle_swap: (target, detail) => {
    if (detail.swapSpec.style === 'morphdom') {
        if (detail.fragment.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
            morphdom(target, detail.fragment.firstElementChild || detail.fragment.firstChild);
        } else {
            morphdom(target, detail.fragment.outerHTML);
        }
        return true;
    }
    return false;
}
```

**Notes:**

- Similar signature but receives `detail` object
- Access swap style via `detail.swapSpec.style`
- Fragment is in `detail.fragment`
- Return `true` if handled, `false` otherwise (not an array)

---

### `encodeParameters(xhr, parameters, elt)`

**htmx 2.x:**

```javascript
encodeParameters: function(xhr, parameters, elt) {
    // Encode parameters
    return JSON.stringify(parameters);
}
```

**htmx 4:**

- Use `htmx_config_request` or `htmx_before_request`
- Modify `detail.ctx.request.body` directly

**Migration approach:**

```javascript
htmx_config_request: ((elt, detail) => {
    // Convert FormData to JSON
    let data = Object.fromEntries(detail.ctx.request.body);
    detail.ctx.request.body = JSON.stringify(data);
    detail.ctx.request.headers["Content-Type"] = "application/json";
});
```

**Real-world example (json-enc extension):**

```javascript
// htmx 2.x
onEvent: function(name, evt) {
    if (name === 'htmx:configRequest') {
        evt.detail.headers['Content-Type'] = 'application/json';
    }
},

encodeParameters: function(xhr, parameters, elt) {
    const object = {};
    parameters.forEach(function(value, key) {
        if (Object.hasOwn(object, key)) {
            if (!Array.isArray(object[key])) {
                object[key] = [object[key]];
            }
            object[key].push(value);
        } else {
            object[key] = value;
        }
    });
    return JSON.stringify(object);
}

// htmx 4
htmx_config_request: (elt, detail) => {
    detail.ctx.request.headers['Content-Type'] = 'application/json';
    
    const object = {};
    detail.ctx.request.body.forEach(function(value, key) {
        if (Object.hasOwn(object, key)) {
            if (!Array.isArray(object[key])) {
                object[key] = [object[key]];
            }
            object[key].push(value);
        } else {
            object[key] = value;
        }
    });
    detail.ctx.request.body = JSON.stringify(object);
}
```

**Notes:**

- `ctx.request.body` is a FormData object in `htmx_config_request`
- Can be replaced with any value (string, JSON, URLSearchParams, etc.)
- Headers can be modified via `ctx.request.headers`
- For GET/DELETE requests, body is converted to query parameters and appended to
  URL after `htmx_config_request`
- For POST/PUT/PATCH, body is converted to URLSearchParams (unless multipart)
  after `htmx_config_request`

## Key Differences Summary

1. **Event-based hooks** instead of single `onEvent` callback
2. **Underscores** in hook names (not colons)
3. **Extension approval** required via meta tag
4. **Detail object** contains full context (`detail.ctx`)
5. **Internal API** provided via `init` hook
6. **No `getSelectors()`** - use element-level hooks instead
7. **Direct modification** of request/response via `detail.ctx`

## Additional Resources

- [Building htmx Extensions](/extensions/building) - Full htmx 4 extension
  documentation
- [Event Hooks Reference](/extensions/building#event-hooks) - Complete list of
  available hooks

---
