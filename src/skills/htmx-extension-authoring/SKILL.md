---
name: htmx-extension-authoring
description: Use when creating, modifying, or debugging htmx 4 extensions. Covers the event-based extension API, internal API, lifecycle hooks, and distribution patterns.
argument-hint: "[description of extension behavior]"
---

# htmx 4 Extension Authoring

htmx 4 extensions register globally with `htmx.registerExtension()` and typically activate behavior through custom attributes.

## Core Rules

- Wrap extension code in an IIFE: `(() => { ... })()`.
- Use `htmx.registerExtension()` for htmx 4 extensions.
- Store the internal API received by `init` in a closure only when the extension needs it.
- Use `api.attributeValue()` to read extension attributes and return early when the attribute is absent.
- Clean up listeners, timers, and per-element state in `htmx_before_cleanup`.
- Store per-element state on `elt._htmx`.
- Store per-request state on `detail.ctx`.
- Use `hx-` for custom attribute names.
- Name extension files `hx-{name}.js`.
- Prefer specific lifecycle hooks over generic event dispatch logic.
- Return `false` or set `detail.cancelled = true` when intentionally cancelling supported hooks.
- Use `handle_swap` only when defining a real custom swap strategy.
- Keep extensions self-contained and load them after htmx.
- Debug extension lifecycle with `htmx.config.logAll = true` when needed.

## References

| Change | Read |
| --- | --- |
| Create a new extension or configure loading | [`references/boilerplate-and-loading.md`](references/boilerplate-and-loading.md) |
| Choose lifecycle hooks or cancel behavior | [`references/event-hooks.md`](references/event-hooks.md) |
| Use htmx internals | [`references/internal-api.md`](references/internal-api.md) |
| Read or modify request/response state | [`references/request-context.md`](references/request-context.md) |
| Implement a custom `hx-swap` strategy | [`references/custom-swaps.md`](references/custom-swaps.md) |
| Follow real extension implementation patterns | [`references/examples.md`](references/examples.md) |
| Migrate an htmx 2 extension | [`references/migration-from-htmx2.md`](references/migration-from-htmx2.md) |
| Package, name, or distribute an extension | [`references/distribution.md`](references/distribution.md) |

Read only the references required by the change.
