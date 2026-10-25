# Extensions and Inheritance

### Extension Not Working

1. Is the extension script loaded AFTER htmx.js?
2. If you set the `extensions` whitelist, is the extension name in it? An unset whitelist allows every extension
3. Does the name match exactly? It is case-sensitive, and the registration name is not always the file name.
   `hx-sse.js` registers as `sse`, `hx-preload.js` as `preload`, `htmx-2-compat.js` as `compat`
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
