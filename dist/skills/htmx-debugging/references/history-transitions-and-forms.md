# History, Transitions, and Form Data

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
- Check `hx-vals` syntax: it takes HCON (`key:value, other:2`), which also accepts JSON. Use the `js:` prefix for dynamic values
