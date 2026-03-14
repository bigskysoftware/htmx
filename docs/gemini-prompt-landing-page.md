# htmx 4.0 Landing Page Redesign

## Your Task

I need help iterating on the hero section and overall layout of the htmx 4.0 landing page. Below is everything you need: the design spec, our custom CSS (the only non-standard Tailwind stuff), and the current rendered page HTML.

This is a Tailwind CSS v4 project with Astro. You know Tailwind — I'm only including our CUSTOM extensions (custom colors, fonts, utilities, variants) so you understand what's non-standard.

**Output: just the HTML for the `<main>` content area.** Don't include the header, site footer, or any CSS/JS framework code. Use Tailwind utility classes. For our custom utilities that Tailwind can't generate (like `text-shadow-3d-*`, `shadow-3d-*`), use inline `style` attributes with the actual CSS.

Dark mode uses `@media (prefers-color-scheme: dark)` — use `dark:` Tailwind prefix throughout.

---

## Design Spec

# Task: Redesign the htmx 4.0 Landing Page

You are helping redesign the landing page for htmx 4.0 (beta launching today). Your job is to produce a single, complete, static HTML page that I can then integrate into our Astro codebase.

## What You're Building

A landing page that sells htmx to developers — especially React/Svelte/Vue developers — in 5 seconds. No long prose. Scannable. Visual. The personality of htmx (confident, self-deprecating Montana humor, meme-friendly) must come through.

## Output Requirements

- A single HTML file with Tailwind CSS v4 classes (using our design system variables below)
- Include `<style>` blocks for any custom CSS needed
- Dark mode support via `@media (prefers-color-scheme: dark)` — NO class-based dark mode
- Responsive (mobile-first)
- Use the exact color/font variables from our theme
- Do NOT include the header or footer — I already have those. Just produce the `<main>` content between them.
- Use placeholder values where dynamic data would go (e.g. `{BUNDLE_SIZE}`, `{DISCORD_MEMBERS}`, `{EXTENSION_COUNT}`) — I'll wire these up in Astro

## Page Sections (in order)

### Section 1: Hero

**Headline:** "Wait, HTML can do that!?"
- Use `font-chicago` (our heading font)
- Large: `text-5xl sm:text-6xl md:text-7xl`
- "that!?" should be in brand blue (`text-blue-600 dark:text-blue-350`) with italic and 3D text shadow

**Code + Visual Explainer** (immediately below headline — this IS the proof):
- **Left side:** A clean htmx code snippet. Use this example:
```html
<button hx-post="/clicked"
        hx-target="#result"
        hx-swap="innerHTML">
    Click Me
</button>
```
- Style it like our code blocks: monospace, border, rounded-lg, macOS-style dots header (three small gray circles), dark background for dark mode
- **Right side:** A static visual showing what happens: User clicks → AJAX POST to /clicked → Server returns HTML → HTML swaps into #result. This should feel like a simplified diagram/flow — arrows, labeled steps. Use the retro aesthetic. NOT a generic flowchart — make it feel like it belongs on this site. Think pixelated, Chicago font labels, maybe subtle scan-line effects.
- On mobile, stack vertically (code on top, visual below)

**Tagline:** "build modern UIs with the simplicity of hypertext"
- `text-xl sm:text-2xl`, muted color (`text-neutral-650 dark:text-neutral-350`)
- Centered, below the code/visual block

**CTA Row** (centered):
- **"Start Here" button:**
  - `bg-linear-to-b from-blue-600 to-blue-700` (dark: `from-blue-500 to-blue-600`)
  - White text, `font-chicago text-sm`
  - `shadow-3d-blue-900` (3D box shadow — see custom utility below)
  - `rounded-lg`, `h-11 px-8`
  - Links to `/docs/get-started/installation`
- **CDN one-liner** (next to button):
  - Inline code showing: `<script src="https://unpkg.com/htmx.org@4/dist/htmx.min.js"></script>`
  - Copy button (clipboard icon, on click copies the script tag)
  - Muted gear icon after the copy button — NOT clickable, with a tooltip on hover saying "coming soon"
  - Tooltip style: use CSS `before:` pseudo-element approach:
    ```
    before:content-["Coming_soon"] before:absolute before:right-full before:top-1/2
    before:-translate-y-1/2 before:mr-2 before:px-2 before:py-1 before:text-xs
    before:font-semibold before:text-white before:bg-neutral-900
    dark:before:bg-neutral-100 dark:before:text-neutral-900 before:rounded
    before:whitespace-nowrap before:opacity-0 before:pointer-events-none
    hover:before:opacity-100 before:transition
    ```

### Section 2: Stats Strip

A horizontal row of stats. Big numbers, small labels. Clean and devastating.

| Number | Label | Notes |
|--------|-------|-------|
| `{BUNDLE_SIZE}` | min.gz'd | e.g. "~10k". Will be auto-calculated at build time |
| 0ms | build time | The flex. No build step. |
| 0 | dependencies | |
| `{EXTENSION_COUNT}` | extensions | Links to /docs/extensions |

Style options (try the one that looks best):
- **Option A:** Horizontal grid with large numbers (`text-4xl sm:text-5xl font-chicago font-bold`) and small labels below (`text-sm text-neutral-500`)
- **Option B:** Flowing sentence: "{BUNDLE_SIZE} gzipped. Zero dependencies. Zero build step. {EXTENSION_COUNT} extensions and counting."

Use subtle separators between stats (a thin line or dot). The extensions stat should be a link to `/docs/extensions`.

### Section 3: Four Questions (the reframe)

The classic htmx motivation, but visual. Strikethrough/reveal treatment:

```
~~Why should only <a> & <form> make HTTP requests?~~     → Any element.
~~Why should only click & submit trigger them?~~          → Any event.
~~Why should only GET & POST be available?~~              → Any HTTP method.
~~Why should you only replace the entire screen?~~        → Any part of the page.
```

**Visual treatment:**
- Left side: the old constraint in a muted, struck-through style (`line-through`, `text-neutral-400 dark:text-neutral-600`)
- Right side: the htmx answer in bold, brand blue (`text-blue-600 dark:text-blue-350 font-bold`)
- An arrow or visual separator between constraint and answer
- Each row should breathe — enough spacing to be scannable

**Closer:** "By removing these constraints, htmx completes HTML as a hypertext."

**CRITICAL:** This must NOT look like a generic SaaS comparison table. It should feel native to the retro-HTML aesthetic. Think of it as HTML itself telling you what it can do now. Consider using `<del>` and `<ins>` semantically. The Chicago font for the answers. Maybe a subtle code-block feel for the constraints.

### Section 4: Discord Community

- Heading: something in Carson's voice, e.g. "come hang out" or "we're pretty friendly (mostly)"
- Live member count: "Join {DISCORD_MEMBERS} developers on Discord"
- A join button linking to `/discord` (styled like the primary button but maybe with Discord's color or a secondary style)
- Discord icon (`icon-[ic--baseline-discord]`)
- Brief, single-line description of the community vibe
- Card-style container: `bg-neutral-25 dark:bg-neutral-910 border border-neutral-200 dark:border-neutral-800 rounded-xl`

### Section 5: Book Callout (Hypermedia Systems)

Small, compact callout. Not a full-width section.

- Book cover image placeholder (I'll wire up the actual image)
- Title: "Hypermedia Systems"
- One-line description: "The book on building Hypermedia-Driven Applications"
- Link to https://hypermedia.systems
- Contained in a card component, compact, maybe with a subtle background treatment
- Should feel like a recommendation, not an ad

### Section 6: Sponsors (already built — just include a placeholder)

```html
<!-- Sponsors component goes here (already built) -->
<div id="sponsors-placeholder">
    <p>[ Existing Sponsors component — no changes needed ]</p>
</div>
```

### Section 7: Page Footer Note

```html
<footer class="text-center py-16">
    <p class="text-neutral-600 dark:text-neutral-400 font-chicago text-sm mb-4">
        htmx is the successor to <a href="http://intercoolerjs.org"
            class="text-blue-600 dark:text-blue-350 hover:underline hover:text-blue-700 dark:hover:text-blue-300">intercooler.js</a>
    </p>
    <p class="text-neutral-500 dark:text-neutral-500 text-sm">
        ʕ •ᴥ•ʔ made in montana
    </p>
</footer>
```

---

## Design System

### Fonts

```css
/* Body text */
--font-sans: 'Inter', sans-serif;
/* Headings, buttons, UI labels — retro Mac bitmap font */
--font-chicago: 'ChicagoFLF', sans-serif;
/* Code */
--font-mono: 'JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
```

Use `font-chicago` for: all headings, button labels, stat numbers, UI labels.
Use `font-sans` (Inter) for: body text, descriptions, paragraphs.
Use `font-mono` for: code snippets, CDN URLs, technical values.

### Colors

Brand blue (htmx logo color):
```
blue-600: oklch(0.5693 0.1653 261.81)  /* primary brand, light mode links/accents */
blue-350: oklch(0.7729 0.0925 249.30)  /* primary brand, dark mode links/accents */
blue-700: oklch(0.505 0.1698 264.24)   /* hover state, light mode */
blue-300: oklch(0.8196 0.0739 247.52)  /* hover state, dark mode */
```

Neutrals (OKLCH, achromatic):
```
neutral-10:  oklch(99.8% 0 0)   /* lightest bg tint */
neutral-25:  oklch(99.5% 0 0)   /* page background (light) */
neutral-50:  oklch(98.5% 0 0)
neutral-100: oklch(97% 0 0)
neutral-200: oklch(92.2% 0 0)   /* borders (light) */
neutral-300: oklch(87% 0 0)     /* body text (dark mode) */
neutral-400: oklch(70.8% 0 0)
neutral-500: oklch(55.6% 0 0)
neutral-600: oklch(43.9% 0 0)
neutral-650: oklch(40.5% 0 0)   /* tagline text (light) */
neutral-700: oklch(37.1% 0 0)   /* body text (light mode) */
neutral-800: oklch(26.9% 0 0)   /* borders (dark) */
neutral-850: oklch(23.7% 0 0)
neutral-900: oklch(20.5% 0 0)
neutral-910: oklch(19.3% 0 0)   /* card bg (dark) */
neutral-920: oklch(18.1% 0 0)   /* page background (dark) */
neutral-930: oklch(16.9% 0 0)
neutral-940: oklch(15.7% 0 0)
neutral-950: oklch(14.5% 0 0)
```

### Custom Tailwind Utilities

3D text shadow (used on hero "that!?"):
```css
/* Usage: text-shadow-3d-blue-900 */
text-shadow: 0 2px 0 color-mix(in srgb, <color> 95%, white),
             0 4px 0 color-mix(in srgb, <color> 95%, black);
```

3D box shadow (used on buttons):
```css
/* Usage: shadow-3d-blue-900 */
box-shadow: 0 calc(0.375cqh / 2) 0 color-mix(in srgb, <color> 95%, white),
            0 0.375cqh 0 color-mix(in srgb, <color> 95%, black);
```

Since you can't use our custom Tailwind plugins directly, implement these as inline styles or `<style>` blocks where needed.

### Interactive States

We use a custom `interact:` variant that combines hover (only on hover-capable devices), focus-visible, and active. In your HTML, use standard Tailwind hover/focus/active classes:
```
hover:... (wrap in @media (hover: hover) if you want to be precise)
focus-visible:...
active:...
```

### Component Patterns

**Card:**
```html
<div class="bg-neutral-25 dark:bg-neutral-910 border border-neutral-200 dark:border-neutral-800 rounded-lg">
    ...
</div>
```

**Primary Button:**
```html
<a href="..." class="inline-flex items-center justify-center h-11 px-8 bg-gradient-to-b from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white font-chicago text-sm rounded-lg border border-blue-500 dark:border-blue-500 transition"
   style="box-shadow: 0 2px 0 color-mix(in srgb, oklch(0.3934 0.1075 265.08) 95%, white), 0 4px 0 color-mix(in srgb, oklch(0.3934 0.1075 265.08) 95%, black);">
    Button Text
</a>
```

**Code Block (macOS style):**
```html
<div class="border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-950 overflow-hidden">
    <!-- macOS dots header -->
    <div class="flex gap-1.5 px-3 py-2 bg-neutral-50 dark:bg-neutral-920 border-b border-neutral-100 dark:border-neutral-900">
        <div class="size-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800"></div>
        <div class="size-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800"></div>
        <div class="size-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800"></div>
    </div>
    <!-- Code content -->
    <pre class="p-4 text-sm font-mono overflow-x-auto"><code>...</code></pre>
</div>
```

**Section spacing:** Sections use `py-16 sm:py-24` for vertical padding. Max content width is `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.

---

## Current Page HTML (for reference)

This is the current rendered body content. Your redesign replaces everything between the header and site footer:

```html
<!-- HERO (current - to be redesigned) -->
<section id="hero-section" class="group not-prose pt-8 pb-12 sm:pt-16 sm:pb-24 w-screen relative left-1/2 -ml-[50vw] overflow-hidden">
    <input type="checkbox" id="cdn-mode" class="sr-only">
    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style="transform: translateZ(0); isolation: isolate;">
        <!-- Hero Content -->
        <div class="text-center mb-12 sm:mb-16 transition">
            <h1 class="flex flex-col gap-6 text-5xl sm:text-6xl md:text-7xl font-bold font-chicago tracking-tight text-black dark:text-white">
                <span>Wait, HTML</span>
                <span>can do <span class="text-blue-600 dark:text-blue-350 italic" style="text-shadow: 0 2px 0 color-mix(in srgb, oklch(0.3934 0.1075 265.08) 95%, white), 0 4px 0 color-mix(in srgb, oklch(0.3934 0.1075 265.08) 95%, black);">that!?</span></span>
            </h1>
            <p class="mt-9 text-xl sm:text-2xl text-neutral-650 dark:text-neutral-350 max-w-2xl mx-auto">
                build modern UIs with the simplicity of hypertext
            </p>
            <div class="mt-9 flex justify-center items-center gap-9">
                <a href="/docs/get-started/installation"
                   class="inline-flex items-center justify-center h-11 px-8 bg-gradient-to-b text-white font-chicago text-sm rounded-lg from-blue-600 to-blue-700 border border-blue-500"
                   style="box-shadow: 0 2px 0 color-mix(in srgb, oklch(0.3934 0.1075 265.08) 95%, white), 0 4px 0 color-mix(in srgb, oklch(0.3934 0.1075 265.08) 95%, black);">
                    Start Here
                </a>
                <!-- CDN copy button was here but is commented out -->
            </div>
        </div>
    </div>
</section>

<!-- SPONSORS (current - keeping as-is) -->
<section id="sponsors-section" class="not-prose py-16 sm:py-24">
    <!-- ... sponsor logos grid ... -->
</section>

<!-- MINI FOOTER (current - keeping as-is) -->
<footer class="text-center py-16">
    <p class="text-neutral-600 dark:text-neutral-400 font-chicago text-sm mb-4">
        htmx is the successor to <a href="http://intercoolerjs.org" class="text-blue-600 dark:text-blue-350">intercooler.js</a>
    </p>
    <p class="text-neutral-500 text-sm">ʕ •ᴥ•ʔ made in montana</p>
</footer>
```

---

## Key Design Principles

1. **Retro Mac aesthetic** — Chicago bitmap font for headings, macOS-style code blocks with dots, construction tape styling, scan-line effects where appropriate
2. **Dark mode is first-class** — every element must look great in both modes. Use `dark:` variants throughout. Automatic via prefers-color-scheme.
3. **No prose** — everything should be scannable in seconds. Big numbers, short labels, visual treatments. If you're writing a paragraph, you're doing it wrong.
4. **The humor is the brand** — htmx is known for memes, haiku, and Carson Gross's voice. The page should feel human and slightly irreverent, NOT like a generic framework homepage.
5. **HTML-native thinking** — use semantic HTML (`<del>`, `<ins>`, `<code>`, `<kbd>`). This is a page about HTML being powerful — demonstrate that.
6. **Mobile-first responsive** — stack on mobile, expand on desktop. The hero code+visual should go from stacked to side-by-side.

## What NOT To Do

- Don't make it look like a Vercel/Next.js/generic SaaS landing page
- Don't use gradients everywhere or glassmorphism
- Don't write long explanatory paragraphs
- Don't use animations just for the sake of it
- Don't include a navbar or site footer — I have those
- Don't use any JavaScript frameworks — this is static HTML with Tailwind classes


---

## Custom CSS (input.css) — Our Design System Extensions

This is everything non-standard. Tailwind v4 base + these customizations = our full design system.

```css
@import "tailwindcss";

@plugin "@tailwindcss/typography";
@plugin "@iconify/tailwind4";

/* Local font */
@font-face {
    font-family: 'ChicagoFLF';
    src: url('/fonts/ChicagoFLF.ttf') format('truetype');
}

@theme {
    /* Body */
    --font-sans: 'Inter', sans-serif;
    /* Headings & Buttons */
    --font-chicago: 'ChicagoFLF', sans-serif;
    /* Code */
    --font-mono: 'JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', monospace;

    /* Gray tones */
    --color-neutral-10: oklch(99.8% 0 0);
    --color-neutral-25: oklch(99.5% 0 0);
    --color-neutral-50: oklch(98.5% 0 0);
    --color-neutral-75: oklch(97.8% 0 0);
    --color-neutral-100: oklch(97% 0 0);
    --color-neutral-150: oklch(95.6% 0 0);
    --color-neutral-200: oklch(92.2% 0 0);
    --color-neutral-300: oklch(87% 0 0);
    --color-neutral-350: oklch(80.9% 0 0);
    --color-neutral-400: oklch(70.8% 0 0);
    --color-neutral-450: oklch(62.9% 0 0);
    --color-neutral-500: oklch(55.6% 0 0);
    --color-neutral-550: oklch(49.7% 0 0);
    --color-neutral-600: oklch(43.9% 0 0);
    --color-neutral-650: oklch(40.5% 0 0);
    --color-neutral-700: oklch(37.1% 0 0);
    --color-neutral-750: oklch(32.0% 0 0);
    --color-neutral-800: oklch(26.9% 0 0);
    --color-neutral-850: oklch(23.7% 0 0);
    --color-neutral-875: oklch(22.1% 0 0);
    --color-neutral-900: oklch(20.5% 0 0);
    --color-neutral-910: oklch(19.3% 0 0);
    --color-neutral-920: oklch(18.1% 0 0); /* primary dark mode background */
    --color-neutral-930: oklch(16.9% 0 0);
    --color-neutral-940: oklch(15.7% 0 0);
    --color-neutral-950: oklch(14.5% 0 0);
    /* Blue that matches htmx logo */
    --color-blue-50: oklch(0.9714 0.0108 256.69);
    --color-blue-100: oklch(0.9375 0.0235 250.08);
    --color-blue-200: oklch(0.8908 0.043 249.39);
    --color-blue-300: oklch(0.8196 0.0739 247.52);
    --color-blue-350: oklch(0.7729 0.0925 249.30);
    --color-blue-400: oklch(0.7262 0.111 251.08);
    --color-blue-500: oklch(0.6393 0.1445 257.27);
    --color-blue-600: oklch(0.5693 0.1653 261.81); /* htmx brand blue */
    --color-blue-700: oklch(0.505 0.1698 264.24);
    --color-blue-800: oklch(0.4421 0.1412 265.64);
    --color-blue-900: oklch(0.3934 0.1075 265.08);
    --color-blue-950: oklch(0.2936 0.068 267.21);

    --radius-lg: 0.625rem;
}

@layer base {
    /* Body styles */
    body {
        overflow-x: hidden;

        color: var(--color-neutral-700);
        background-color: var(--color-neutral-25);

        @media (prefers-color-scheme: dark) {
            color-scheme: dark;
            color: var(--color-neutral-300);
            background-color: var(--color-neutral-920);
        }
    }

    button,
    a,
    [role="button"] {
        touch-action: manipulation;
    }

    /* Use Chicago font in headings */
    h1, h2, h3, h4, h5, h6 {
        font-family: var(--font-chicago), serif;
        letter-spacing: var(--tracking-tight);
    }

    /* Improve underlines in anchors */
    a, a * {
        text-decoration-thickness: 0.125em;
        text-underline-offset: 0.25em;
    }

    /* Astro/Shiki CSS Variables - Custom Theme */
    :root {
        --navigation-bar-height: 56px;

        @media (width >= 64rem) {
            --navigation-bar-height: 76px;
        }

        --header-height: var(--navigation-bar-height);

        /* Base colors - light mode */
        --astro-code-foreground: #1a1a1a;
        --astro-code-background: var(--color-white);

        /* HTML/Markup syntax */
        --astro-code-token-string-expression: #bca26c; /* HTML tags (yellow) */
        --astro-code-token-function: #5a5a5a; /* HTML attributes (neutral) */
        --astro-code-token-keyword: #6aab73; /* Attribute = signs (green) */
        --astro-code-token-string: #6aab73; /* Attribute values (green) */

        /* JavaScript/Logic syntax */
        --astro-code-token-constant: #ce8e6d; /* Keywords like function, async, export (orange) */
        --astro-code-token-parameter: #57a8f5; /* Functions/methods (blue) */
        --astro-code-token-punctuation: #c87dbb; /* Properties (purple) */

        /* Other */
        --astro-code-token-comment: #808080; /* Comments (gray) */
        --astro-code-token-link: #57a8f5; /* Links (blue) */
    }

    /* Dark mode overrides with media query */
    @media (prefers-color-scheme: dark) {
        :root {
            --astro-code-foreground: var(--color-neutral-350);
            --astro-code-background: var(--color-neutral-930);
            --astro-code-token-function: var(--color-neutral-350);
        }
    }
}

@utility scan-lines {
    mask-size: 100% max(1.5px, 0.02em);
    mask-image: linear-gradient(to bottom, transparent 0%, black 12.5%);

    @variant dark {
        mask-image: linear-gradient(to bottom, transparent 0%, black 17.5%);
    }
}

/* Override prose pre padding with high specificity */
.prose pre,
.prose :where(pre):not(:where([class~="not-prose"], [class~="not-prose"] *)) {
    padding: 0 !important;
}

/* Custom color theme for prose */
@utility prose-htmx {
    /* Light Mode */
    --tw-prose-body: var(--color-neutral-700);
    --tw-prose-headings: var(--color-neutral-900);
    --tw-prose-lead: var(--color-neutral-600);
    --tw-prose-links: var(--color-blue-600);
    --tw-prose-bold: var(--color-neutral-900);
    --tw-prose-counters: var(--color-neutral-500);
    --tw-prose-bullets: var(--color-neutral-300);
    --tw-prose-hr: var(--color-neutral-200);
    --tw-prose-quotes: var(--color-neutral-900);
    --tw-prose-quote-borders: var(--color-neutral-200);
    --tw-prose-captions: var(--color-neutral-500);
    --tw-prose-code: var(--color-neutral-900);
    --tw-prose-pre-code: var(--color-neutral-800);
    --tw-prose-pre-bg: var(--color-neutral-50);
    --tw-prose-th-borders: var(--color-neutral-300);
    --tw-prose-td-borders: var(--color-neutral-200);

    /* Dark Mode (for prose-invert) */
    --tw-prose-invert-body: var(--color-neutral-300);
    --tw-prose-invert-headings: var(--color-neutral-100);
    --tw-prose-invert-lead: var(--color-neutral-400);
    --tw-prose-invert-links: var(--color-blue-350);
    --tw-prose-invert-bold: var(--color-neutral-100);
    --tw-prose-invert-counters: var(--color-neutral-500);
    --tw-prose-invert-bullets: var(--color-neutral-700);
    --tw-prose-invert-hr: var(--color-neutral-850);
    --tw-prose-invert-quotes: var(--color-neutral-100);
    --tw-prose-invert-quote-borders: var(--color-neutral-850);
    --tw-prose-invert-captions: var(--color-neutral-500);
    --tw-prose-invert-code: var(--color-neutral-100);
    --tw-prose-invert-pre-code: var(--color-neutral-300);
    --tw-prose-invert-pre-bg: var(--color-neutral-900);
    --tw-prose-invert-th-borders: var(--color-neutral-800);
    --tw-prose-invert-td-borders: var(--color-neutral-850);
}

/* Prose CSS overrides */
.prose {
    @apply
    prose-a:no-underline!
    prose-a:interact:underline!
    prose-a:not-in-prose-headings:text-blue-700
    prose-a:not-in-prose-headings:dark:text-blue-350!
    prose-a:not-in-prose-headings:dark:interact:text-blue-300!
    prose-a:[[href^="#"]]:text-neutral-800
    prose-a:[[href^="#"]]:dark:text-neutral-100
    prose-h1:text-[2em]/12
    prose-img:rounded-lg
    prose-img:border prose-img:border-neutral-200 prose-img:dark:border-neutral-800;

    @apply
    prose-headings:scroll-pt-[calc(var(--header-height)+2rem)]
    prose-headings:scroll-mt-[calc(var(--header-height)+2rem)]
    [html:has(#sidebar)_&]:max-lg:prose-headings:scroll-pt-[calc(var(--header-height)+var(--sidebar-header-height)+2rem)]
    [html:has(#sidebar)_&]:max-lg:prose-headings:scroll-mt-[calc(var(--header-height)+var(--sidebar-header-height)+2rem)];

    /* Inline code - remove backticks */

    :where(:not(pre) > code):not(:where([class~="not-prose"], [class~="not-prose"] *)) {
        @apply text-neutral-900 dark:text-neutral-100 font-semibold bg-neutral-200/25 dark:bg-neutral-800/25 px-1.5 py-0.5 rounded;

        &::before, &::after {
            content: none;
        }
    }

    :where(a):not(:where([class~="not-prose"], [class~="not-prose"] *)) > code {
        color: inherit;
    }

    /* Code blocks - macOS window style */

    :where(pre):not(:where([class~="not-prose"], [class~="not-prose"] *)) {
        @apply relative border border-neutral-200 dark:border-neutral-850 rounded-lg bg-white dark:bg-neutral-950 overflow-y-hidden;

        code {
            @apply block overflow-x-auto text-xs leading-5 whitespace-pre p-4 pr-12 mask-l-from-97% mask-r-from-95%;
        }
    }

    /* Details/Summary - collapsible sections */

    :where(details):not(:where([class~="not-prose"], [class~="not-prose"] *)) {
        @apply my-6 py-0;

        summary {
            @apply flex w-full items-center cursor-pointer select-none text-sm
            px-3 py-2 -mx-3 rounded-[4px]
            text-neutral-600 dark:text-neutral-400
            interact:bg-neutral-75 dark:interact:bg-neutral-875
            interact:text-neutral-900 dark:interact:text-neutral-200
            transition;

            /* Robustly hide native markers */
            &::-webkit-details-marker {
                display: none;
            }
            &::marker {
                content: '';
            }

            /* Custom inline chevron */
            &::before {
                @apply content-[''] inline-block size-4 mr-1.5 shrink-0
                bg-current opacity-50 transition-transform;
                mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor'%3E%3Cpath fill-rule='evenodd' d='M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z'/%3E%3C/svg%3E");
            }
        }

        &[open] {
            @apply pb-4;
        }

        &[open] summary {
            @apply mb-4 text-neutral-900 dark:text-neutral-100;

            &::before {
                @apply rotate-90;
            }
        }

        /* Tighter prose spacing inside details, zero indentation */
        > :not(summary):nth-child(2) {
            @apply mt-0;
        }

        > :not(summary):last-child {
            @apply mb-0;
        }

        &.warning {
            @apply px-4 py-0 rounded-[4px] border border-yellow-200 dark:border-yellow-900/50 bg-yellow-50/30 dark:bg-yellow-900/10;

            summary {
                @apply text-yellow-800 dark:text-yellow-300
                interact:text-yellow-950 dark:interact:text-yellow-100;

                &::before {
                    @apply opacity-60;
                }
            }

            &[open] summary {
                @apply text-yellow-900 dark:text-yellow-200;
            }
        }

        &.info {
            @apply px-4 py-0 rounded-[4px] border border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-900/10;

            summary {
                @apply text-blue-800 dark:text-blue-300
                interact:text-blue-950 dark:interact:text-blue-100;

                &::before {
                    @apply opacity-60;
                }
            }

            &[open] summary {
                @apply text-blue-900 dark:text-blue-200;
            }
        }
    }
}

@utility prose-lg {
    /* Override h1 font size for prose-lg (with not-prose support) */
    & :where(h1):not(:where([class~="not-prose"], [class~="not-prose"] *)) {
        font-size: 2em;
    }
}

@utility text-shadow-3d-* {
    text-shadow: 0 2px 0 color-mix(in srgb, --value(--color-*) 95%, white),
    0 4px 0 color-mix(in srgb, --value(--color-*) 95%, black);
}

@utility shadow-3d-* {
    box-shadow: 0 calc(var(--shadow-depth, 0.375cqh) / 2) 0 color-mix(in srgb, --value(--color-*) 95%, white),
    0 var(--shadow-depth, 0.375cqh) 0 color-mix(in srgb, --value(--color-*) 95%, black);
}

@utility shadow-3d-depth-* {
    --shadow-depth: --value([length], integer);
}

/* Subtle scrollbar styling */
@utility scrollbar-subtle {
    /* Standard properties (Firefox, modern Chrome/Edge) */
    scrollbar-width: thin;
    scrollbar-color: var(--color-neutral-300) transparent;

    @media (prefers-color-scheme: dark) {
        scrollbar-color: var(--color-neutral-700) transparent;
    }

    /* WebKit (Chrome, Safari, Edge) - finer control */
    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background: var(--color-neutral-300);
        border-radius: 3px;

        &:hover {
            background: var(--color-neutral-400);
        }
    }

    @media (prefers-color-scheme: dark) {
        &::-webkit-scrollbar-thumb {
            background: var(--color-neutral-700);

            &:hover {
                background: var(--color-neutral-600);
            }
        }
    }
}

/* interact: variant - combines hover/focus-visible/active for interactive states
   Hover scoped to (hover: hover) to prevent sticky touch behavior on mobile.
   :active provides brief tap feedback on touch devices (requires touchstart listener in Head.astro) */
@custom-variant interact {
    @media (hover: hover) {
        &:hover {
            @slot;
        }
    }
    &:focus-visible {
        @slot;
    }

    &:active {
        @slot;
    }
}

```

Key things to know:
- `font-chicago` = ChicagoFLF, a retro Mac bitmap font. Used for ALL headings, buttons, stat numbers, UI labels.
- `font-sans` = Inter. Body text only.
- `font-mono` = JetBrains Mono. Code snippets.
- `interact:` = custom variant combining `@media(hover:hover){ &:hover }`, `&:focus-visible`, `&:active`. Use `hover:` / `focus-visible:` / `active:` in your output.
- `text-shadow-3d-blue-900` = 3D text shadow. For your output, use inline style: `style="text-shadow: 0 2px 0 color-mix(in srgb, oklch(0.3934 0.1075 265.08) 95%, white), 0 4px 0 color-mix(in srgb, oklch(0.3934 0.1075 265.08) 95%, black);"`
- `shadow-3d-blue-900` = 3D box shadow on buttons. Use inline style: `style="box-shadow: 0 2px 0 color-mix(in srgb, oklch(0.3934 0.1075 265.08) 95%, white), 0 4px 0 color-mix(in srgb, oklch(0.3934 0.1075 265.08) 95%, black);"`
- Colors use OKLCH. Custom neutrals go from `neutral-10` to `neutral-950`. Custom blues from `blue-50` to `blue-950`. `blue-350` is the dark-mode brand accent.
- `--header-height` = 56px mobile, 76px desktop. Body has `pt-(--header-height)`.
- Icons use Iconify classes like `icon-[mdi--github]`, `icon-[radix-icons--copy]`, `icon-[ic--baseline-discord]`.

---

## Current Rendered Page HTML

This is the current body content (header and site footer are separate and unchanged — shown here for context only). Your output replaces the `<main>` tag content.

```html
<div class="fixed inset-0 overflow-hidden pointer-events-none -z-10 grid-bg flex justify-center items-center starting:opacity-0 transition duration-500" aria-hidden="true">
  <!-- grid svg -->
</div>
<header role="banner" class="flex flex-col fixed inset-x-0 top-0 h-(--header-height) z-40 bg-neutral-10 dark:bg-neutral-920 border-b border-neutral-200 dark:border-neutral-850">
  <!-- Navigation -->
  <nav id="navigation" class="w-full h-(--navigation-bar-height) flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 lg:py-4 gap-4 lg:gap-12" aria-label="Primary Navigation">
    <div class="flex items-center gap-3">
      <!-- Slot for content before logo (e.g. sidebar toggle on content pages) -->
      <!-- Logo -->
      <a href="/" aria-label="HTMX Homepage" class="group/logo text-xl sm:text-[1.375rem] lg:text-2xl whitespace-nowrap font-mono tracking-tight font-extrabold inline-flex items-center text-neutral-900 dark:text-neutral-100 interact:text-blue-700 dark:interact:text-blue-300 shrink-0 sm:transition rounded-sm outline-hidden">
        <span aria-hidden="true">&lt;</span>
        <b class="relative text-blue-700 dark:text-blue-350 dark:group-interact/logo:text-blue-300 sm:transition" aria-hidden="true">
          <span class="group-interact/logo:opacity-0 sm:transition">/</span>
          <span class="absolute inset-0 opacity-0 group-interact/logo:opacity-100 sm:transition">-</span>
        </b>
        <span aria-hidden="true" class="relative">
          <span class="group-interact/logo:opacity-0 sm:transition">&gt;</span>
          <span class="absolute inset-0 opacity-0 group-interact/logo:opacity-100 sm:transition">-</span>
        </span>
        <span class="font-chicago ms-2 inline-block relative">
          <span class="group-interact/logo:opacity-0 sm:transition">
            htm<b class="text-blue-700 dark:text-blue-350 dark:group-interact/logo:text-blue-300 sm:transition">x</b>
          </span>
          <span class="absolute inset-0 opacity-0 group-interact/logo:opacity-100 group-interact/logo:underline sm:transition">
            hom<b class="text-blue-700 dark:text-blue-350 dark:group-interact/logo:text-blue-300 sm:transition">e</b>
          </span>
        </span>
      </a>
      <!-- Version Selector -->
      <div class="inline-flex items-center relative group/version">
        <select aria-label="Select htmx version" class="appearance-none bg-transparent pl-2 pr-5 py-1 text-xs font-chicago rounded-sm text-neutral-500 dark:text-neutral-450 interact:text-neutral-900 dark:interact:text-neutral-100 cursor-pointer outline-hidden sm:transition border border-transparent interact:border-neutral-200 dark:interact:border-neutral-800 translate-y-0.5" onchange="window.location.href = this.value">
          <option value="/" selected>v4</option>
          <option value="https://htmx.org">v2</option>
          <option value="https://v1.htmx.org">v1</option>
        </select>
        <i class="icon-[mdi--chevron-down] absolute right-1 top-1/2 -translate-y-1/2 text-xs text-neutral-400 dark:text-neutral-500 group-hover/version:text-neutral-600 dark:group-hover/version:text-neutral-400 pointer-events-none sm:transition" aria-hidden="true">
        </i>
      </div>
    </div>
    <!-- Desktop: Nav Links + Status Bar + Search + Social -->
    <div class="hidden lg:flex items-center justify-between flex-1 gap-4 xl:gap-6">
      <!-- Desktop: Nav Links -->
      <div aria-label="Main" class="hidden lg:flex items-center gap-4 xl:gap-6 flex-1" hx-preload:inherited="mouseenter">
        <ul class="flex gap-4 xl:gap-6 items-center justify-center xl:text-[1.075rem] font-chicago tracking-tight">
          <li>
            <a href="/docs" title="Read the complete documentation and tutorials" class="px-3 py-1 sm:transition interact:underline text-neutral-500 dark:text-neutral-450 interact:text-blue-700 dark:interact:text-blue-300 aria-[current=page]:text-neutral-900 dark:aria-[current=page]:text-neutral-100 aria-[current=page]:font-bold outline-hidden"> docs </a>
          </li>
          <li>
            <a href="/reference" title="Browse the full API reference" class="px-3 py-1 sm:transition interact:underline text-neutral-500 dark:text-neutral-450 interact:text-blue-700 dark:interact:text-blue-300 aria-[current=page]:text-neutral-900 dark:aria-[current=page]:text-neutral-100 aria-[current=page]:font-bold outline-hidden"> reference </a>
          </li>
          <li>
            <a href="/patterns" title="Common UI patterns with htmx" class="px-3 py-1 sm:transition interact:underline text-neutral-500 dark:text-neutral-450 interact:text-blue-700 dark:interact:text-blue-300 aria-[current=page]:text-neutral-900 dark:aria-[current=page]:text-neutral-100 aria-[current=page]:font-bold outline-hidden"> patterns </a>
          </li>
          <li>
            <a href="/essays" title="Read essays about htmx and hypermedia" class="px-3 py-1 sm:transition interact:underline text-neutral-500 dark:text-neutral-450 interact:text-blue-700 dark:interact:text-blue-300 aria-[current=page]:text-neutral-900 dark:aria-[current=page]:text-neutral-100 aria-[current=page]:font-bold outline-hidden"> essays </a>
          </li>
          <li>
            <a href="/about" title="About htmx, the team, and community" class="px-3 py-1 sm:transition interact:underline text-neutral-500 dark:text-neutral-450 interact:text-blue-700 dark:interact:text-blue-300 aria-[current=page]:text-neutral-900 dark:aria-[current=page]:text-neutral-100 aria-[current=page]:font-bold outline-hidden"> about </a>
          </li>
        </ul>
      </div>
      <!-- Desktop: Status Bar -->
      <div id="status-bar" aria-hidden="true" class="hidden 2xl:block flex-1 text-center text-xs xl:text-sm text-neutral-700 dark:text-neutral-300 translate-y-0.5 truncate min-w-0 max-w-xs">
      </div>
      <!-- Desktop: Search & Social -->
      <div class="flex items-center min-w-[200px]">
        <!-- Desktop: Search -->
        <div class="flex-1">
          <button type="button" class="relative group flex items-center min-h-[44px] min-w-[200px] w-full bg-white dark:bg-neutral-910
            border border-neutral-200 dark:border-neutral-800 rounded-md py-2 px-3 text-base font-sans text-neutral-400
            interact:bg-neutral-100 dark:interact:bg-neutral-800/50
            interact:border-neutral-400 dark:interact:border-neutral-600
            outline-hidden sm:transition cursor-pointer" aria-label="Open Search">
            <i class="icon-[ic--baseline-search] size-5 text-neutral-400 group-interact:text-neutral-600 dark:group-interact:text-neutral-200 sm:transition" aria-hidden="true">
            </i>
            <span class="text-sm mx-2 group-interact:text-neutral-600 dark:group-interact:text-neutral-200 sm:transition">Open Search</span>
            <kbd id="search-shortcut-hint" aria-hidden="true" class="ms-auto pe-1 font-chicago text-xs group-interact:text-neutral-600 dark:group-interact:text-neutral-200 sm:transition">Ctrl K</kbd>
          </button>
        </div>
        <!-- Divider -->
        <div class="h-6 w-px bg-neutral-200 dark:bg-neutral-800 ml-7.5 mr-5.5" role="separator">
        </div>
        <!-- Desktop: Discord -->
        <a href="/discord" aria-label="Join Discord" title="Join the Discord community" target="_blank" rel="noopener noreferrer" class="flex px-3 py-2 group sm:transition">
          <i class="icon-[ic--baseline-discord] size-5.5 scale-[1.1] text-neutral-600 dark:text-neutral-400 group-interact:text-black dark:group-interact:text-white sm:transition" aria-hidden="true">
          </i>
        </a>
        <!-- Desktop: Github -->
        <a href="https://github.com/bigskysoftware/htmx" aria-label="View Source on GitHub" title="View source code on GitHub" target="_blank" rel="noopener noreferrer" class="flex ml-3 px-3 py-2 group sm:transition">
          <i class="icon-[mdi--github] size-5.5 text-neutral-600 dark:text-neutral-400 group-interact:text-black dark:group-interact:text-white sm:transition" aria-hidden="true">
          </i>
        </a>
      </div>
    </div>
    <!-- Mobile: Search + Navigation -->
    <div class="lg:hidden flex items-center gap-4">
      <!-- Mobile: Search -->
      <button type="button" class="flex items-center justify-center size-10 text-neutral-600 dark:text-neutral-400 rounded-xs outline-hidden" aria-label="Search">
        <i class="icon-[ic--baseline-search] size-5 sm:size-6" aria-hidden="true">
        </i>
      </button>
      <!-- Mobile: Navigation -->
      <label class="flex items-center justify-center size-10 cursor-pointer rounded-xs outline-hidden" for="mobile-navigation-toggle" aria-label="Toggle Navigation Menu" role="button" tabindex="0">
        <input id="mobile-navigation-toggle" type="checkbox" class="sr-only">
          <i class="icon-[mdi--menu] [html:has(#mobile-navigation-toggle:checked)_&]:hidden size-5 sm:size-6 text-neutral-600 dark:text-neutral-400" aria-hidden="true">
          </i>
          <i class="icon-[mdi--close] hidden [html:has(#mobile-navigation-toggle:checked)_&]:block size-5 sm:size-6 text-neutral-600 dark:text-neutral-400" aria-hidden="true">
          </i>
        </label>
      </div>
    </nav>
  </header>
  <!-- Mobile: Navigation -->
  <nav id="mobile-navigation" aria-label="Mobile Navigation" class="lg:hidden z-50 opacity-0 top-(--header-height) fixed inset-0 h-screen bg-neutral-10 dark:bg-neutral-920 pointer-events-none select-none [html:has(#mobile-navigation-toggle:checked)_&]:opacity-100 [html:has(#mobile-navigation-toggle:checked)_&]:pointer-events-auto sm:transition duration-100 overflow-y-auto overscroll-contain">
    <div class="p-4 space-y-2">
      <a href="/docs" title="Read the complete documentation and tutorials" class="link-list-item group/link flex items-center gap-4 sm:gap-5 px-3 -mx-3 py-2.5 sm:py-2 no-underline rounded-md transition text-neutral-800 dark:text-neutral-200 interact:bg-blue-700 interact:text-white dark:interact:bg-blue-350 dark:interact:text-black !mx-0 font-chicago text-base gap-2 aria-[current=page]:bg-blue-700 aria-[current=page]:text-white dark:aria-[current=page]:bg-blue-350 dark:aria-[current=page]:text-black aria-[current=page]:font-bold"> docs </a>
      <a href="/reference" title="Browse the full API reference" class="link-list-item group/link flex items-center gap-4 sm:gap-5 px-3 -mx-3 py-2.5 sm:py-2 no-underline rounded-md transition text-neutral-800 dark:text-neutral-200 interact:bg-blue-700 interact:text-white dark:interact:bg-blue-350 dark:interact:text-black !mx-0 font-chicago text-base gap-2 aria-[current=page]:bg-blue-700 aria-[current=page]:text-white dark:aria-[current=page]:bg-blue-350 dark:aria-[current=page]:text-black aria-[current=page]:font-bold"> reference </a>
      <a href="/patterns" title="Common UI patterns with htmx" class="link-list-item group/link flex items-center gap-4 sm:gap-5 px-3 -mx-3 py-2.5 sm:py-2 no-underline rounded-md transition text-neutral-800 dark:text-neutral-200 interact:bg-blue-700 interact:text-white dark:interact:bg-blue-350 dark:interact:text-black !mx-0 font-chicago text-base gap-2 aria-[current=page]:bg-blue-700 aria-[current=page]:text-white dark:aria-[current=page]:bg-blue-350 dark:aria-[current=page]:text-black aria-[current=page]:font-bold"> patterns </a>
      <a href="/essays" title="Read essays about htmx and hypermedia" class="link-list-item group/link flex items-center gap-4 sm:gap-5 px-3 -mx-3 py-2.5 sm:py-2 no-underline rounded-md transition text-neutral-800 dark:text-neutral-200 interact:bg-blue-700 interact:text-white dark:interact:bg-blue-350 dark:interact:text-black !mx-0 font-chicago text-base gap-2 aria-[current=page]:bg-blue-700 aria-[current=page]:text-white dark:aria-[current=page]:bg-blue-350 dark:aria-[current=page]:text-black aria-[current=page]:font-bold"> essays </a>
      <a href="/about" title="About htmx, the team, and community" class="link-list-item group/link flex items-center gap-4 sm:gap-5 px-3 -mx-3 py-2.5 sm:py-2 no-underline rounded-md transition text-neutral-800 dark:text-neutral-200 interact:bg-blue-700 interact:text-white dark:interact:bg-blue-350 dark:interact:text-black !mx-0 font-chicago text-base gap-2 aria-[current=page]:bg-blue-700 aria-[current=page]:text-white dark:aria-[current=page]:bg-blue-350 dark:aria-[current=page]:text-black aria-[current=page]:font-bold"> about </a>
      <div class="h-px bg-neutral-200 dark:bg-neutral-800 my-4" role="separator">
      </div>
      <!-- Mobile (Drawer): Discord Button -->
      <a href="/discord" title="Join the Discord community" class="link-list-item group/link flex items-center gap-4 sm:gap-5 px-3 -mx-3 py-2.5 sm:py-2 no-underline rounded-md transition text-neutral-800 dark:text-neutral-200 interact:bg-blue-700 interact:text-white dark:interact:bg-blue-350 dark:interact:text-black !mx-0 font-chicago text-base gap-3">
        <i class="icon-[ic--baseline-discord] text-xl" aria-hidden="true">
        </i>
        Discord
      </a>
      <!-- Mobile (Drawer): Github Button -->
      <a href="https://github.com/bigskysoftware/htmx" target="_blank" rel="noopener noreferrer" title="View source code on GitHub" class="link-list-item group/link flex items-center gap-4 sm:gap-5 px-3 -mx-3 py-2.5 sm:py-2 no-underline rounded-md transition text-neutral-800 dark:text-neutral-200 interact:bg-blue-700 interact:text-white dark:interact:bg-blue-350 dark:interact:text-black !mx-0 font-chicago text-base gap-3">
        <i class="icon-[mdi--github] text-xl" aria-hidden="true">
        </i>
        GitHub
      </a>
    </div>
  </nav>
  <!-- <ConstructionBanner /> -->
  <main id="home-main-content" class="max-w-[65ch] mx-auto px-4 sm:px-8 mt-8 mb-8 sm:mt-20 sm:mb-16 min-w-0">
    <div class="prose prose-htmx prose-sm sm:prose-base dark:prose-invert">
      <div class="not-prose">
        <aside id="easter-eggs" class="hidden" aria-label="Easter egg content">
          <!-- Ads (?ads=true) -->
          <figure class="mb-12">
            <a href="https://swag.htmx.org">
              <!-- easter egg image -->
            </a>
          </figure>
          <figure class="mt-16">
            <a href="https://swag.htmx.org">
              <!-- easter egg image -->
            </a>
          </figure>
          <!-- Shut up warren (?wuw=true) -->
          <figure>
            <a href="https://swag.htmx.org/products/shut-up-warren-tee">
              <!-- easter egg image -->
            </a>
          </figure>
          <!-- katakana (?uwu=true) -->
          <figure>
            <a href="https://swag.htmx.org/products/htmx-katakana-shirt">
              <!-- easter egg image -->
            </a>
          </figure>
          <!-- horse (?horse=true) -->
          <figure>
            <a href="https://swag.htmx.org">
              <!-- easter egg image -->
            </a>
          </figure>
        </aside>
        <section id="hero-section" class="not-prose pt-8 pb-12 sm:pt-16 sm:pb-20 w-screen relative left-1/2 -ml-[50vw] overflow-hidden">
          <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style="transform: translateZ(0); isolation: isolate;">
            <!-- Headline -->
            <div class="text-center">
              <h1 class="flex flex-col gap-6 text-5xl sm:text-6xl md:text-7xl font-bold font-chicago tracking-tight text-black dark:text-white" style="transform: translateZ(0);">
                <span>Wait, HTML</span>
                <span>
                  can do
                  <span class="text-blue-600 dark:text-blue-350 italic text-shadow-3d-blue-900 dark:text-shadow-3d-blue-700">
                    that!?
                  </span>
                </span>
              </h1>
            </div>
            <!-- Tagline -->
            <p class="mt-9 text-xl sm:text-2xl text-neutral-650 dark:text-neutral-350 max-w-2xl mx-auto text-center">
              build modern UIs with the simplicity of hypertext
            </p>
            <!-- CTA + CDN -->
            <div class="mt-9 flex flex-col justify-center items-center gap-9">
              <!-- Start Here button -->
              <a href="/docs/get-started/installation" class="inline-flex items-center justify-center h-11 px-8 bg-linear-to-b text-white font-chicago text-sm shadow-3d-blue-900 dark:shadow-3d-blue-800 rounded-lg from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 interact:from-blue-500 interact:to-blue-600 dark:interact:from-blue-400 dark:interact:to-blue-500 border border-blue-500 dark:border-blue-500 dark:interact:border-blue-400 active:translate-y-[0.375cqh] active:shadow-3d-depth-[2px] transition">
                Start Here
              </a>
              <!-- CDN one-liner -->
              <div class="flex items-center gap-1.5 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 max-w-full overflow-hidden">
                <code class="text-xs sm:text-sm font-mono text-neutral-600 dark:text-neutral-400 truncate">
                  <span class="text-blue-600 dark:text-blue-400">&lt;script</span>
                  <span class="text-neutral-700 dark:text-neutral-300"> src=</span>
                  <span class="text-emerald-600 dark:text-emerald-400">"...htmx.min.js"</span>
                  <span class="text-blue-600 dark:text-blue-400">&gt;</span>
                </code>
                <!-- Copy button -->
                <button class="shrink-0 flex items-center justify-center size-7 rounded text-neutral-400 interact:text-neutral-700 dark:interact:text-neutral-200 interact:bg-neutral-100 dark:interact:bg-neutral-800 transition cursor-pointer outline-hidden" title="Copy CDN script tag" data-cdn-tag="">
                  <i class="icon-[radix-icons--copy] size-3.5" aria-hidden="true">
                  </i>
                </button>
              </div>
            </div>
          </div>
        </section>
        <section class="not-prose py-12 sm:py-16" aria-label="Key stats">
          <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-4 text-center">
              <div class="group flex flex-col items-center gap-1">
                <span class="text-2xl sm:text-3xl font-chicago font-bold text-neutral-900 dark:text-neutral-100 tracking-tight"> ~10k </span>
                <span class="text-sm font-chicago text-neutral-500 dark:text-neutral-450"> min.br&#39;d </span>
              </div>
              <div class="group flex flex-col items-center gap-1">
                <span class="text-2xl sm:text-3xl font-chicago font-bold text-neutral-900 dark:text-neutral-100 tracking-tight"> 0ms </span>
                <span class="text-sm font-chicago text-neutral-500 dark:text-neutral-450"> build time </span>
              </div>
              <div class="group flex flex-col items-center gap-1">
                <span class="text-2xl sm:text-3xl font-chicago font-bold text-neutral-900 dark:text-neutral-100 tracking-tight"> 0 </span>
                <span class="text-sm font-chicago text-neutral-500 dark:text-neutral-450"> dependencies </span>
              </div>
              <a href="/docs/extensions" class="group flex flex-col items-center gap-1 interact:scale-105 transition">
                <span class="text-2xl sm:text-3xl font-chicago font-bold text-neutral-900 dark:text-neutral-100 tracking-tight"> 10 </span>
                <span class="text-sm font-chicago text-neutral-500 dark:text-neutral-450 group-interact:text-blue-600 dark:group-interact:text-blue-350 group-interact:underline transition"> extensions </span>
              </a>
            </div>
          </div>
        </section>
        <section class="not-prose py-16 sm:py-24" aria-label="Why htmx">
          <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="space-y-4 sm:space-y-5">
              <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                <del class="flex-1 text-sm sm:text-base text-neutral-400 dark:text-neutral-600 leading-relaxed no-underline line-through decoration-neutral-300 dark:decoration-neutral-700 decoration-2"> Why should only &lt;a&gt; &amp; &lt;form&gt; make HTTP requests? </del>
                <span class="hidden sm:block text-neutral-300 dark:text-neutral-700 font-mono text-sm" aria-hidden="true">&rarr;</span>
                <ins class="text-lg sm:text-xl font-chicago font-bold text-blue-600 dark:text-blue-350 no-underline whitespace-nowrap"> Any element. </ins>
              </div>
              <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                <del class="flex-1 text-sm sm:text-base text-neutral-400 dark:text-neutral-600 leading-relaxed no-underline line-through decoration-neutral-300 dark:decoration-neutral-700 decoration-2"> Why should only click &amp; submit trigger them? </del>
                <span class="hidden sm:block text-neutral-300 dark:text-neutral-700 font-mono text-sm" aria-hidden="true">&rarr;</span>
                <ins class="text-lg sm:text-xl font-chicago font-bold text-blue-600 dark:text-blue-350 no-underline whitespace-nowrap"> Any event. </ins>
              </div>
              <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                <del class="flex-1 text-sm sm:text-base text-neutral-400 dark:text-neutral-600 leading-relaxed no-underline line-through decoration-neutral-300 dark:decoration-neutral-700 decoration-2"> Why should only GET &amp; POST be available? </del>
                <span class="hidden sm:block text-neutral-300 dark:text-neutral-700 font-mono text-sm" aria-hidden="true">&rarr;</span>
                <ins class="text-lg sm:text-xl font-chicago font-bold text-blue-600 dark:text-blue-350 no-underline whitespace-nowrap"> Any method. </ins>
              </div>
              <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                <del class="flex-1 text-sm sm:text-base text-neutral-400 dark:text-neutral-600 leading-relaxed no-underline line-through decoration-neutral-300 dark:decoration-neutral-700 decoration-2"> Why should you only replace the entire screen? </del>
                <span class="hidden sm:block text-neutral-300 dark:text-neutral-700 font-mono text-sm" aria-hidden="true">&rarr;</span>
                <ins class="text-lg sm:text-xl font-chicago font-bold text-blue-600 dark:text-blue-350 no-underline whitespace-nowrap"> Any target. </ins>
              </div>
            </div>
            <p class="mt-12 text-center text-neutral-600 dark:text-neutral-400 text-base sm:text-lg max-w-xl mx-auto">
              By removing these constraints, htmx completes HTML as a hypertext.
            </p>
          </div>
        </section>
        <section class="not-prose py-16 sm:py-24" aria-label="Community">
          <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="bg-neutral-25 dark:bg-neutral-910 border border-neutral-200 dark:border-neutral-800 rounded-xl p-8 sm:p-10 text-center">
              <i class="icon-[ic--baseline-discord] size-10 text-[#5865F2] mb-4" aria-hidden="true">
              </i>
              <h2 class="text-2xl sm:text-3xl font-chicago font-bold text-neutral-900 dark:text-neutral-100 mb-3">
                we're pretty friendly
              </h2>
              <p class="text-neutral-600 dark:text-neutral-400 mb-2 text-base">
                Join 1,400+ developers on Discord.
              </p>
              <p class="text-sm text-emerald-600 dark:text-emerald-400 mb-6">
                <span class="inline-block size-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" aria-hidden="true">
                </span> 1,454 online now
              </p>
              <a href="/discord" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center h-11 px-8 bg-[#5865F2] hover:bg-[#4752C4] active:bg-[#3C45A5] text-white font-chicago text-sm rounded-lg transition">
                Join the Discord
              </a>
            </div>
          </div>
        </section>
        <section class="not-prose py-8 sm:py-12" aria-label="Book">
          <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <a href="https://hypermedia.systems" target="_blank" rel="noopener noreferrer" class="group flex items-center gap-6 bg-neutral-25 dark:bg-neutral-910 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 sm:p-6 interact:border-neutral-300 dark:interact:border-neutral-700 transition">
              <!-- Book cover placeholder -->
              <div class="shrink-0 w-16 sm:w-20 aspect-[3/4] bg-neutral-100 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 rounded flex items-center justify-center overflow-hidden">
                <span class="text-xs font-chicago text-neutral-400 dark:text-neutral-600 text-center leading-tight px-1">
                  Hyper&shy;media Systems
                </span>
              </div>
              <div class="min-w-0">
                <h3 class="font-chicago font-bold text-neutral-900 dark:text-neutral-100 text-base sm:text-lg group-interact:text-blue-600 dark:group-interact:text-blue-350 transition">
                  Hypermedia Systems
                </h3>
                <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  The book on building Hypermedia-Driven Applications with htmx & more.
                </p>
                <span class="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-350 mt-2 group-interact:underline">
                  Read free online
                  <i class="icon-[radix-icons--arrow-right] size-3.5" aria-hidden="true">
                  </i>
                </span>
              </div>
            </a>
          </div>
        </section>
        <!-- SPONSORS SECTION (existing, unchanged) -->
        <footer class="text-center py-16">
          <p class="text-neutral-600 dark:text-neutral-400 font-chicago text-sm mb-4">
            <p>htmx is the successor to <a href="http://intercoolerjs.org" class="text-blue-600 dark:text-blue-350 interact:underline interact:text-blue-700 dark:interact:text-blue-300">intercooler.js</a>
          </p>
        </p>
        <p class="text-neutral-500 dark:text-neutral-500 text-sm">
          <p>ʕ •ᴥ•ʔ made in montana</p>
        </p>
      </footer>
    </div>
  </div>
</main>
<!-- SITE FOOTER (existing, unchanged) -->   $1</mark>" class="group/search">
```

---

## What I Need From You

Redesign the `<main>` content. The current hero feels right in structure (headline → tagline → button → CDN) but needs polish and better spacing. The sections below the hero (stats, motivation/four questions, Discord, book callout) need to feel cohesive and scannable.

Key constraints:
- Keep the hero order: headline → tagline → Start Here button → CDN one-liner
- The CDN component (copy button) works — keep its functionality, just style it better
- Stats should feel punchy but not oversized
- Four Questions (del/ins strikethrough treatment) should be visually interesting without being cheesy
- Discord section should feel inviting
- Book callout should be compact
- Everything must support dark mode (`dark:` prefix)
- Use `font-chicago` for headings/buttons/labels, `font-sans` for body text, `font-mono` for code
- Retro Mac aesthetic, NOT generic SaaS. Confident, slightly irreverent.
- Use placeholder tokens: `{BUNDLE_SIZE}`, `{DISCORD_MEMBERS}`, `{EXTENSION_COUNT}` where dynamic data goes
