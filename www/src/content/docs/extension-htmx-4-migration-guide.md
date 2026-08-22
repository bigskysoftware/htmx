---
title: "Migrating Extensions to htmx 4"
description: "How to port a custom htmx 2.x extension to the 4.0 hook API."
---

If you maintain a custom extension written for htmx 2.x, the extension API has changed substantially. 

## From Callbacks to Hooks

htmx 4 replaces the callback-based extension API with event-based hooks. 

Extensions register handlers for lifecycle events instead of implementing callback methods.

The simplest migration: rename `defineExtension` to `registerExtension` and map your callbacks to hooks.

```javascript
// htmx 2.x
htmx.defineExtension('my-ext', {
    onEvent: function(name, evt) {
        if (name === 'htmx:beforeRequest') { /* ... */ }
    }
});

// htmx 4
htmx.registerExtension('my-ext', {
    htmx_before_request: (elt, detail) => { /* ... */ }
});
```

## What Changed

### No `hx-ext` attribute

Extensions load by including the script. No attribute needed:

```html
<script src="/path/to/htmx.js"></script>
<script src="/path/to/ext/my-extension.js"></script>
```

Restrict which extensions can load:

```html
<meta name="htmx-config" content='{"extensions": "sse, ws"}'>
```

### Event hooks replace callbacks

Instead of a single `onEvent` callback that switches on event names, each event gets its own hook method. Hook names use underscores where events use colons:

| htmx 2.x event | htmx 4 hook |
|---|---|
| `htmx:configRequest` | `htmx_config_request` |
| `htmx:beforeRequest` | `htmx_before_request` |
| `htmx:afterRequest` | `htmx_after_request` |
| `htmx:beforeSwap` | `htmx_before_swap` |
| `htmx:afterSwap` | `htmx_after_swap` |

All hooks receive `(elt, detail)`. Return `false` to cancel.

### `handle_swap` is special

Unlike other hooks, `handle_swap` is called directly with positional parameters (no `htmx_` prefix, no detail object):

```javascript
handle_swap: (swapStyle, target, fragment, swapSpec) => {
    if (swapStyle === 'my-swap') {
        target.appendChild(fragment);
        return true;
    }
    return false;
}
```

### Detail object replaces event properties

All hooks receive `detail.ctx` with full request/response context:

- `detail.ctx.request.body` (FormData in `htmx_config_request`)
- `detail.ctx.request.headers` (plain mutable object)
- `detail.ctx.response.status`
- `detail.ctx.text` (response body, modifiable in `htmx_after_request`)
- `detail.ctx.target`

### OOB swap stripping

OOB swaps automatically strip the wrapper element for non-outer swap styles. Name custom swap styles starting with "outer" (e.g., `outerMorph`) to preserve the wrapper.

## Callback Migration Map

### `init`

```javascript
// htmx 2.x
init: function(api) {
    return null;
}

// htmx 4
init: (internalAPI) => {
    api = internalAPI;
}
```

Store the `internalAPI` reference for use in other hooks. No return value needed.

### `getSelectors`

Removed. Use `htmx_after_init` to check for attributes:

```javascript
// htmx 2.x
getSelectors: function() {
    return ['[my-custom-attr]'];
},
onEvent: function(name, evt) {
    if (name === 'htmx:afterProcessNode') {
        initializeCustomBehavior(evt.target);
    }
}

// htmx 4
htmx_after_init: (elt) => {
    if (api.attributeValue(elt, 'my-custom-attr')) {
        initializeCustomBehavior(elt);
    }
}
```

### `onEvent`

Replace with individual hooks:

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

### `transformResponse`

Removed. Modify `detail.ctx.text` in `htmx_after_request`:

```javascript
// htmx 2.x
transformResponse: function(text, xhr, elt) {
    var tpl = htmx.closest(elt, '[mustache-template]');
    if (tpl) {
        var data = JSON.parse(text);
        var template = htmx.find('#' + tpl.getAttribute('mustache-template'));
        return Mustache.render(template.innerHTML, data);
    }
    return text;
}

// htmx 4
htmx_after_request: (elt, detail) => {
    var tpl = elt.closest('[mustache-template]');
    if (tpl) {
        var data = JSON.parse(detail.ctx.text);
        var template = document.querySelector('#' + tpl.getAttribute('mustache-template'));
        detail.ctx.text = Mustache.render(template.innerHTML, data);
    }
}
```

Event flow: response received, `ctx.text` set, `htmx:after:request` fires, `ctx.text` consumed into fragment, `htmx:before:swap`.

### `encodeParameters`

Removed. Modify the final `detail.ctx.request.body` in `htmx_before_request`:

```javascript
// htmx 2.x
onEvent: function(name, evt) {
    if (name === 'htmx:configRequest') {
        evt.detail.headers['Content-Type'] = 'application/json';
    }
},
encodeParameters: function(xhr, parameters, elt) {
    var object = {};
    parameters.forEach(function(value, key) {
        if (Object.hasOwn(object, key)) {
            if (!Array.isArray(object[key])) object[key] = [object[key]];
            object[key].push(value);
        } else {
            object[key] = value;
        }
    });
    return JSON.stringify(object);
}

// htmx 4
htmx_before_request: (elt, detail) => {
    detail.ctx.request.headers['Content-Type'] = 'application/json';
    var object = {};
    detail.ctx.request.body.forEach(function(value, key) {
        if (Object.hasOwn(object, key)) {
            if (!Array.isArray(object[key])) object[key] = [object[key]];
            object[key].push(value);
        } else {
            object[key] = value;
        }
    });
    detail.ctx.request.body = JSON.stringify(object);
}
```

`ctx.request.body` is `FormData` in `htmx_config_request`. After that hook, GET and DELETE values move into the URL, non-multipart bodies become `URLSearchParams`, and multipart bodies remain `FormData`. In `htmx_before_request`, replace the final body with any valid `BodyInit`.

### `isInlineSwap` and `handleSwap`

Both replaced by `handle_swap`:

```javascript
// htmx 2.x
isInlineSwap: function(swapStyle) {
    return swapStyle === 'morphdom';
},
handleSwap: function(swapStyle, target, fragment) {
    if (swapStyle === 'morphdom') {
        morphdom(target, fragment.firstElementChild || fragment.firstChild);
        return [target];
    }
}

// htmx 4
handle_swap: (swapStyle, target, fragment) => {
    if (swapStyle === 'morphdom') {
        morphdom(target, fragment.firstElementChild || fragment.firstChild);
        return true;
    }
    return false;
}
```

Return truthy if handled, falsy otherwise. Can return an array of elements for settle tracking.

## Removed Callbacks

| htmx 2.x callback                       | htmx 4 replacement                                            |
|-----------------------------------------|---------------------------------------------------------------|
| `getSelectors()`                        | `htmx_after_init` hook                                        |
| `onEvent(name, evt)`                    | Individual `htmx_*` hooks                                     |
| `transformResponse(text, xhr, elt)`     | `htmx_after_request` hook (modify `detail.ctx.text`)          |
| `encodeParameters(xhr, params, elt)`    | `htmx_before_request` hook (modify final `detail.ctx.request.body`) |
| `isInlineSwap(swapStyle)`               | `handle_swap` or name swap style with "outer" prefix          |
| `handleSwap(style, target, frag, info)` | `handle_swap(style, target, frag, spec)`                      |

