# Distribution Conventions

## Distribution Conventions

- **File naming:** `hx-{name}.js` (matches `src/ext/` convention)
- **Wrap in IIFE:** `(() => { ... })()` to avoid polluting global scope
- **Self-contained:** Extension file includes everything it needs
- **Load order:** Include after htmx.js, before any HTML that uses it
- **Naming:** Extension name should be lowercase, use hyphens (e.g. `my-extension`)
