---
name: htmx-debugging
description: Use when diagnosing htmx issues, troubleshooting requests that aren't firing, swaps that aren't happening, events that aren't triggering, or any unexpected htmx behavior.
argument-hint: "[description of the problem]"
---

# htmx 4 Debugging

Debug htmx from the request lifecycle outward. Confirm the version and observable browser behavior before changing application code.

## Diagnostic Order

1. Confirm htmx is loaded and check `htmx.version`.
2. Confirm the element was processed by htmx.
3. Verify the trigger and synchronization behavior.
4. Verify the target selector.
5. Inspect the Network request and response.
6. Confirm the server returns HTML, not JSON.
7. Check response status and `hx-status` behavior.
8. Check explicit inheritance with `:inherited`.
9. Check extension registration and load order when extensions are involved.

## Core Rules

- Use `htmx.config.logAll = true` when lifecycle visibility is needed.
- Inspect the Network tab before guessing at server or swap behavior.
- htmx 4 swaps all response statuses except 204 and 304 by default.
- GET and DELETE do not automatically include enclosing form values.
- Parent attributes are not inherited unless `:inherited` is used or implicit inheritance is enabled.
- Response headers such as `HX-Retarget`, `HX-Reswap`, and `HX-Reselect` can override client-side behavior.
- Dynamic DOM added outside htmx processing may require `htmx.process(element)`.
- Do not assume htmx 2 examples are valid in htmx 4.

## References

| Problem | Read |
| --- | --- |
| Need full lifecycle logging or event tracing | [`references/logging-and-events.md`](references/logging-and-events.md) |
| Request does not fire | [`references/request-not-firing.md`](references/request-not-firing.md) |
| Swap missing or wrong content | [`references/swap-problems.md`](references/swap-problems.md) |
| Extension or inheritance issue | [`references/extensions-and-inheritance.md`](references/extensions-and-inheritance.md) |
| History, transitions, or form data issue | [`references/history-transitions-and-forms.md`](references/history-transitions-and-forms.md) |
| htmx 2 code behaves differently in htmx 4 | [`references/migration-from-htmx2.md`](references/migration-from-htmx2.md) |
| Browser inspection techniques | [`references/browser-devtools.md`](references/browser-devtools.md) |

Read only the references required by the problem.
