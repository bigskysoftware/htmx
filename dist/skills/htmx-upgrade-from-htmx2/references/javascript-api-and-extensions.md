# JavaScript API and Extensions

## Step 9: Update JavaScript API Calls

| htmx 2                       | htmx 4                             |
|------------------------------|------------------------------------|
| `htmx.defineExtension(...)`  | `htmx.registerExtension(...)`      |
| `htmx.addClass(elt, cls)`    | `elt.classList.add(cls)`           |
| `htmx.removeClass(elt, cls)` | `elt.classList.remove(cls)`        |
| `htmx.toggleClass(elt, cls)` | `elt.classList.toggle(cls)`        |
| `htmx.closest(elt, sel)`     | `elt.closest(sel)`                 |
| `htmx.remove(elt)`           | `elt.remove()`                     |
| `htmx.off(elt, evt, fn)`     | `elt.removeEventListener(evt, fn)` |
| `htmx.values(elt)`           | `new FormData(elt)`                |

## Step 10: Update Extensions

Extensions need a full rewrite for htmx 4. The API changed from callback-based to event-based:

```js
// htmx 2
htmx.defineExtension('my-ext', {
    onEvent: function (name, evt) {
        if (name === 'htmx:configRequest') { /* ... */ }
    },
    transformResponse: function (text, xhr, elt) { /* ... */ }
});

// htmx 4
htmx.registerExtension('my-ext', {
    init(api) { /* receive internal API */ },
    htmx_config_request(elt, detail) {
        // detail.ctx has request context
    },
    htmx_after_request(elt, detail) {
        // detail.ctx.text has response text
    }
});
```

To restrict which extensions can load, use the `extensions` config as a whitelist. It takes the
registration name passed to `registerExtension()`, which is not always the file name. `hx-sse.js`
registers as `sse`, `hx-preload.js` as `preload`, `htmx-2-compat.js` as `compat`:

```html
<meta name="htmx-config" content='{"extensions": "my-ext"}'>
```
