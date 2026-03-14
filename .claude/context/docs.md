# Documentation Writing Conventions

Rules for writing content in `/www/src/content/` (patterns, docs, reference pages).

## Prose style

- Do not use em dashes. Use `:` or `(...)` instead.
- Keep sentences short and direct.
- Show, don't tell. Use code examples and visual timelines over long explanations.
- Use `...` for irrelevant attribute values in HTML snippets (e.g. `hx-get="..."`) to keep focus on the attribute being documented.

## Page structure (patterns)

TO BE DETERMINED. Should look for ways to standardize them.

## Page structure (reference attributes)

- Brief intro, then `## Examples` with quick code snippets
- Each value/modifier gets its own heading (linkable via anchors, like `hx-swap` and `hx-trigger` pages do)
- Link attribute values and event names to their own reference pages or MDN
- `## Notes` at the bottom for edge cases

## Links

- Link htmx attributes/events to their reference pages whenever possible (e.g. `/reference/attributes/hx-swap`)
- Link external concepts to established resources (e.g. MDN, web.dev)
- Reference page URLs are case-sensitive (e.g. `/reference/headers/HX-Trigger` not `/reference/headers/hx-trigger`)
