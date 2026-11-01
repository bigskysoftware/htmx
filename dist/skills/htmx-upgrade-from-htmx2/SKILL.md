---
name: htmx-upgrade-from-htmx2
description: Use when migrating an existing codebase from htmx 2.x to htmx 4.x. Builds a migration worklist, applies changes in dependency-safe order, preserves observable behavior, and validates client/server integration points. Do not use for greenfield htmx 4 implementation.
---

# Upgrade htmx 2 to htmx 4

Treat the upgrade as a codebase migration, not a search-and-replace task.

Build the worklist before editing, preserve observable behavior, and migrate in an order that avoids ambiguous intermediate states.

## Migration Invariants

- Inventory all htmx usage before changing code: `hx-*`, `data-hx-*`, `htmx:` events, `htmx.` API calls, server-side `HX-*` handling, and custom extensions.
- Run the shipped `upgrade-check` tool first when available and pin it to the target htmx 4 release.
- Migrate the htmx 2 meaning of `hx-disable` to `hx-ignore` **before** renaming `hx-disabled-elt` to `hx-disable`.
- Do not add `:inherited` mechanically. Add it only where descendants actually depend on a parent attribute.
- Treat custom extensions as rewrites, not mechanical renames.
- Inspect both browser-side usage and server-side `HX-*` header handling.
- Preserve existing request, validation, history, swap, and error behavior unless the migration intentionally changes it.
- Use compatibility flags or `htmx-2-compat.js` only as temporary migration bridges.

## Migration Order

1. Inventory usage and run the upgrade checker.
2. Rename or remove changed attributes.
3. Resolve explicit attribute inheritance.
4. Update event names and event-detail access.
5. Update configuration and server-side headers.
6. Update JavaScript API calls and extensions.
7. Resolve GET/DELETE form-data changes.
8. Resolve OOB/partial ordering changes.
9. Resolve 4xx/5xx swap behavior.
10. Remove temporary compatibility behavior after native htmx 4 behavior is verified.

Do not skip ahead when an earlier step changes the meaning of syntax used by a later step.

## Validation Gate

Before declaring the migration complete:

- Search again for removed htmx 2 attributes, event names, APIs, and headers.
- Verify inherited attributes only where descendants require them.
- Exercise GET, POST, PUT/PATCH, and DELETE flows that use htmx.
- Exercise validation and non-2xx responses.
- Exercise OOB/partial updates and history/navigation behavior where used.
- Verify custom extensions load and behave correctly.
- Verify server-side branching on `HX-*` headers.
- Remove compatibility flags or extensions that are no longer required.

## References

| Migration area | Read |
| --- | --- |
| Build scope and run `upgrade-check` | [`references/inventory-and-upgrade-checker.md`](references/inventory-and-upgrade-checker.md) |
| Attributes, removed attributes, inheritance, `data-hx-*` | [`references/attributes-and-inheritance.md`](references/attributes-and-inheritance.md) |
| Event names and `event.detail.ctx` migration | [`references/events-and-event-data.md`](references/events-and-event-data.md) |
| Configuration and `HX-*` request/response headers | [`references/configuration-and-headers.md`](references/configuration-and-headers.md) |
| JavaScript API calls and custom extensions | [`references/javascript-api-and-extensions.md`](references/javascript-api-and-extensions.md) |
| GET/DELETE form data, OOB ordering, response swapping | [`references/runtime-behavior.md`](references/runtime-behavior.md) |
| Incremental migration bridges | [`references/compatibility.md`](references/compatibility.md) |

Read only the references required by the current migration step.
