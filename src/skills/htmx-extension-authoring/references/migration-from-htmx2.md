# Migrating htmx 2 Extensions to htmx 4

## Migrating from htmx 2.x Extensions

| htmx 2.x | htmx 4 | Notes |
|-----------|---------|-------|
| `htmx.defineExtension()` | `htmx.registerExtension()` | Different function name |
| `onEvent(name, evt)` | Specific hooks (`htmx_before_request`, etc.) | Use underscored hook names |
| `transformResponse(text, xhr, elt)` | `htmx_after_request` | Modify `detail.ctx.text` |
| `handleSwap(style, target, fragment)` | `handle_swap(style, target, fragment, swapSpec)` | Extra `swapSpec` param, return truthy |
| `encodeParameters(xhr, params, elt)` | `htmx_before_request` | Modify the final `detail.ctx.request.body` and `.headers` |
| `getSelectors()` | `htmx_after_init` | Check `api.attributeValue(elt, "attr")` instead |
| `isInlineSwap(swapStyle)` | Not needed | Move logic into `handle_swap` |
