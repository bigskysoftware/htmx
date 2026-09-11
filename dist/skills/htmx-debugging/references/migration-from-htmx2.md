# htmx 2 to htmx 4 Debugging

### htmx 2 Code Not Working in htmx 4

Quick compatibility fixes:
1. Add `htmx.config.implicitInheritance = true` (restores automatic inheritance)
2. Add `htmx.config.noSwap = [204, 304, '4xx', '5xx']` (restores htmx 2 swap behavior)
3. Replace `hx-ext="name"` with `<script src="ext.js">`. The `extensions` config is an optional whitelist, not a requirement
4. Update event names: `htmx:beforeRequest` -> `htmx:before:request`, `htmx:afterSwap` -> `htmx:after:swap`, etc.
5. Replace `hx-disabled-elt` -> `hx-disable`
6. Replace `hx-disable` (old meaning of ignoring) -> `hx-ignore`
7. Replace `hx-vars` -> `hx-vals` with `js:` prefix
8. Load the `hx-prompt` extension to keep `hx-prompt` working
9. Or load the `htmx-2-compat` extension for gradual migration
