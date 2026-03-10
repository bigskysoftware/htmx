# Project Instructions

## Tailwind CSS Transitions

Never use `transition-all`. Always use `transition` instead, which transitions only the properties we need:

```css
/* GOOD - use this */
transition
transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events;

/* BAD - never use this */
transition-all
transition-property: all;
```

Do not manually set transition duration (e.g., `duration-300`). The default duration (150ms) is sufficient for most cases.

## Website Quality Review Team

After making changes to the website, dispatch the relevant review subagents (defined in `.claude/agents/`) before considering the work complete. Claude will automatically delegate to these subagents based on their descriptions.

### The 5 reviewers

| Subagent | Trigger |
|---|---|
| `information-architect` | Navigation, page structure, content placement, URLs, sidebar, cross-linking |
| `visual-designer` | Visual appearance — colors, typography, spacing, layout, components, responsiveness |
| `frontend-engineer` | Markup, components, CSS, JavaScript, performance, accessibility, Astro patterns |
| `technical-writer` | Documentation, API references, code examples, guides, content frontmatter |
| `editorial-voice` | Essays, landing page copy, introductions, any persuasive/explanatory prose |

### Rules

- Dispatch at least **2 relevant reviewers** per change, passing the list of changed files
- Dispatch **all 5** for significant changes (new pages, redesigns, major content additions)
- Always dispatch reviewers **in parallel** (single message, multiple Agent tool calls)
- After all agents return, **summarize their verdicts** to the user in a table
- If any reviewer **blocks**, resolve the issue and re-dispatch that reviewer before proceeding
- If reviewers have **conflicting suggestions**, present the conflict to the user for a decision
