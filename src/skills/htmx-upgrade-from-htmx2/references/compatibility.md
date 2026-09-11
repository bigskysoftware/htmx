# Compatibility Options

## Compatibility Options

For large codebases where a full migration isn't practical all at once, there are two options to
ease the transition:

**Config flags** -- add to your htmx config meta tag to restore htmx 2 defaults:

```html
<meta name="htmx-config" content='{
    "implicitInheritance": true,
    "noSwap": [204, 304, "4xx", "5xx"]
}'>
```

- `implicitInheritance: true` restores automatic attribute inheritance (skipping Step 3)
- `noSwap: [204, 304, "4xx", "5xx"]` restores htmx 2's 4xx/5xx no-swap behavior (skipping Step 13)

**Compatibility extension** -- `htmx-2-compat.js` fires old event names alongside new ones and
handles old attribute names:

```html
<script src="/path/to/htmx.js"></script>
<script src="/path/to/ext/htmx-2-compat.js"></script>
```

These are bridges for incremental migration, not long-term solutions.
