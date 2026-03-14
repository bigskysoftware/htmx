# htmx 4.0 Landing Page — Design Spec

## Goal

Redesign the htmx landing page to sell htmx to developers (especially React/Svelte/etc users) in 5 seconds. No long prose. Scannable. Visual. The htmx personality — confident, self-deprecating, Montana-specific humor, meme-heavy — must come through.

## Primary Audience

Developers who've heard of htmx and are checking it out. Especially framework developers (React, Svelte, Vue, etc.) who are curious about a simpler approach. Secondary: existing htmx 2.x users who need a path to v4.

## Page Structure (top to bottom)

### 1. Construction Banner (fixed, top of every page)
- Yellow construction-tape border styling
- "🚧 htmx 4.0 is under construction. Read changes →"
- Links to the what's-new/migration page
- Already built in Header.astro, just commented out — uncomment it

### 2. Hero Section (the 5-second sell)
**Headline:** "Wait, HTML can do that!?"
- Existing Chicago font, 3D text shadow on "that!?"

**Code Example + Visual Explainer** (immediately below headline):
- Left side: a short, clean htmx code snippet showing a real interaction (e.g. a button with hx-post, hx-swap)
- Right side: a static visual diagram showing what happens — click → AJAX request → HTML response → swap. Like a simplified sequence diagram or comic-strip-style flow, rendered in the site's retro aesthetic
- This is static for now, designed to become interactive later
- The code + visual IS the proof of the headline claim

**Tagline:** "build modern UIs with the simplicity of hypertext"

**CTA Row:**
- "Start Here" button (existing blue gradient button style, links to /docs/get-started/installation)
- Inline CDN `<script>` one-liner with copy button: `<script src="https://unpkg.com/htmx.org@4/dist/htmx.min.js"></script>`
- Muted gear icon next to the CDN line — on hover shows a tooltip saying "coming soon" (reuse existing Shiki tooltip styles from code blocks). This is a hook for the CDN Generator modal we'll build later.

### 3. Stats Strip (the gut punch)
A clean horizontal row of 3-4 big numbers with small labels:
- **~Xk** min.gz'd (auto-calculated from actual dist file at build time — NOT hardcoded)
- **0ms** build time
- **0** dependencies
- **9** extensions (links to /docs/extensions)

Big numbers, small labels. Devastating to anyone maintaining a webpack config. The extension count should also be auto-calculated if possible (count files in the extensions docs collection).

Format: open to either a horizontal stat grid OR a flowing tagline ("10k gzipped. Zero dependencies. Zero build step. Nine extensions and counting.") — whichever looks best visually. Try both.

### 4. Four Questions (the reframe)
The classic htmx motivation, but made visual:

- ~~Why should only `<a>` & `<form>` make HTTP requests?~~ → **Any element.**
- ~~Why should only click & submit trigger them?~~ → **Any event.**
- ~~Why should only GET & POST be available?~~ → **Any HTTP method.**
- ~~Why should you only replace the entire screen?~~ → **Any part of the page.**

Visual treatment: strikethrough/reveal style. Show the old constraint crossed out (muted, `<del>` style), then the htmx answer bold/highlighted next to it. The visual of crossing out limitations is the message.

Closer line: "By removing these constraints, htmx completes HTML as a hypertext."

This needs careful execution to not look like a cheesy SaaS pricing page. It should feel native to the retro-HTML aesthetic. Think of it as HTML itself telling you what it can do now.

### 5. Discord Community Section
- Build-time fetch of live member count from Discord widget API (`/api/guilds/{SERVER_ID}/widget.json`)
- Display: "Join X developers on Discord" with a join button
- Brief pitch in Carson's voice — something about the community being helpful and weird
- Discord icon

### 6. Book Callout (Hypermedia Systems)
- Small card/callout — not a full section
- Book cover image, title, one-line description
- Links to https://hypermedia.systems
- Compact — just enough to say "there's a book" and move on

### 7. Sponsors (existing, unchanged)
- Platinum + silver tiers with logo grids
- "Sponsor htmx" button with heart icon
- Keep exactly as-is

### 8. Footer (existing, unchanged)
- "htmx is the successor to intercooler.js" line
- "ʕ •ᴥ•ʔ made in montana"
- The existing site footer with links, community, resources, haiku

## Design System Reference

### Fonts
- **Body text:** Inter (Google Fonts) — `font-sans`
- **Headings, buttons, UI labels:** ChicagoFLF (local retro Mac font) — `font-chicago`
- **Code:** JetBrains Mono (Google Fonts) — `font-mono`

### Colors (OKLCH)
- **Brand blue:** oklch(0.5693 0.1653 261.81) — `blue-600`
- **Dark mode blue:** oklch(0.7729 0.0925 249.30) — `blue-350`
- **Light mode background:** oklch(99.5% 0 0) — `neutral-25`
- **Dark mode background:** oklch(18.1% 0 0) — `neutral-920`
- **Light mode text:** oklch(37.1% 0 0) — `neutral-700`
- **Dark mode text:** oklch(87% 0 0) — `neutral-300`
- Full neutral scale from `neutral-10` (99.8%) to `neutral-950` (14.5%)
- Full blue scale from `blue-50` to `blue-950`

### Component Patterns
- **Cards:** `bg-neutral-25 dark:bg-neutral-910 border border-neutral-200 dark:border-neutral-800` with variant-based border-radius
- **Buttons (primary):** Blue gradient (`from-blue-600 to-blue-700`), white text, Chicago font, 3D box shadow (`shadow-3d-blue-900`), rounded-lg, active press effect
- **Interactive states:** Custom `interact:` variant that combines hover (only on hover-capable devices), focus-visible, and active states
- **Code blocks:** macOS window style with border, rounded-lg, monospace
- **Dark mode:** Automatic via `prefers-color-scheme` media query — no toggle, no class-based switching

### Custom Utilities
- `text-shadow-3d-*` — 3D text shadow effect (used on hero "that!?")
- `shadow-3d-*` — 3D box shadow effect (used on buttons)
- `scan-lines` — CRT monitor scan line effect
- `interact:` — custom variant for hover/focus/active states
- `scrollbar-subtle` — thin custom scrollbar

### Vibe / Personality
- Retro Mac aesthetic (Chicago font, construction tape, scan lines)
- Confident but self-deprecating humor
- Montana-specific references
- Meme-friendly (the site has an entire /memes page)
- Easter eggs hidden throughout
- NOT a generic SaaS/framework landing page — this should feel distinctly htmx
- The haiku in the footer: "javascript fatigue: / longing for a hypertext / already in hand"
