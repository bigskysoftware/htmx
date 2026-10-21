---
name: htmx-guidance
description: Use when writing HTML with htmx, building htmx-powered pages, or answering questions about htmx patterns and best practices. Covers htmx 4 attributes, events, swap strategies, and common UI patterns.
---

# htmx 4 Guidance

htmx allows any HTML element to issue HTTP requests and swap the response into the DOM.
The server returns **HTML fragments**, not JSON. This is the fundamental model.

htmx 4 uses the `fetch()` API (not XMLHttpRequest like htmx 2).

## Core Rules

- Keep htmx interactions simple: a request returns HTML that is inserted into the DOM.
- Server endpoints must return HTML fragments, not JSON.
- Use the `:inherited` modifier for attributes on a parent element that children must inherit.
- Add loading indicators for requests that may take time with `hx-indicator` and an `htmx-indicator` element.
- Use `hx-status:422` for validation error handling when the server returns error HTML.
- Use morph swaps when preserving form/input state matters; use `innerHTML` or `outerHTML` for clean replacement.
- Prefer `<hx-partial>` tags over `hx-swap-oob` for explicit multi-region updates.
- GET and DELETE do not include enclosing form data; use `hx-include="closest form"` when needed.
- When showing a pattern, include the HTML and describe what the server endpoint should return.
- Suggest extensions only when they fit the interaction being implemented.

## References

| Change | Read |
| --- | --- |
| Requests, methods, triggers, polling, filters | [`references/requests-and-triggers.md`](references/requests-and-triggers.md) |
| Targets, selectors, swap strategies, swap modifiers | [`references/targets-and-swaps.md`](references/targets-and-swaps.md) |
| Attribute inheritance, htmx configuration, HCON | [`references/inheritance-and-config.md`](references/inheritance-and-config.md) |
| Lifecycle events, request context, HTTP headers | [`references/events-and-headers.md`](references/events-and-headers.md) |
| `hx-status`, OOB, `<hx-partial>`, event-driven refresh | [`references/status-and-multi-region.md`](references/status-and-multi-region.md) |
| `innerMorph`, `outerMorph`, morph skip behavior | [`references/morphing.md`](references/morphing.md) |
| Other attributes, parameters, JavaScript API | [`references/attributes-and-api.md`](references/attributes-and-api.md) |
| Search, lazy load, pagination, tabs, forms, indicators | [`references/patterns.md`](references/patterns.md) |
| Built-in/shipped extensions and registration names | [`references/extensions.md`](references/extensions.md) |
| Migrating or comparing htmx 2 and htmx 4 | [`references/htmx2-to-htmx4.md`](references/htmx2-to-htmx4.md) |

Read only the references required by the change.
