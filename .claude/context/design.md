# Design Guide

## Brand Identity

Retro-modern. Blends 1980s Macintosh nostalgia with clean contemporary web design. Playful, technically credible, approachable. Never corporate, never generic.

Voice: conversational, witty, slightly irreverent.

## Styling Approach

Use Tailwind utility classes for everything. Do not add page-specific or component-specific styles to `input.css`. Keep `input.css` clutter-free: it only defines theme tokens (colors, fonts, spacing), prose overrides, and custom utilities that are truly global.

Component styles live in their `.astro` files using Tailwind classes (e.g. `Card.astro`, `FinderLink.astro`). Using `<style>` blocks is a last resort, only when server-side rendering requires generating complex styles.

For Tailwind v4 class reference, read: https://raw.githubusercontent.com/seanodell/llms_txts/refs/heads/main/tailwindcss_4_llms_full.txt

## Rules

- Read `input.css` before making design decisions. It's the source of truth for tokens and utilities.
- Use `transition` not `transition-all`. It includes duration (150ms) and easing. No `duration-*` or `ease-*` needed.
- Use `interact:` not `hover:`. See `input.css`.
- Semantic HTML first. Visible focus states. WCAG 2.1 AA contrast.
- Dark mode is not an afterthought. Test both modes.
- No heavy JS for things CSS/HTML can handle.
