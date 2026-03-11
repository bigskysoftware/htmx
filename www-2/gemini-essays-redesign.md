# Redesign the /essays page for the htmx website

## Your Task

Redesign the `/essays` index page for the htmx website. The page currently works but feels like a flat list of links without visual hierarchy or personality. Your job is to create a more compelling, well-structured page that properly guides the reader's attention while maintaining the htmx brand's distinctive voice (irreverent, technical, confident).

**Your output should be pure HTML with Tailwind CSS classes** — the same format as the rendered page below. Don't worry about Astro components, MDX, or any framework abstractions. Just give me redesigned HTML that I can preview and then port back into our component system myself.

---

## CSS / Design System

Below is the full Tailwind CSS v4 configuration for this site. This defines all the custom colors, fonts, utilities, and variants you should use.

**Key things to know:**
- `interact:` is a custom variant that combines `hover:` (media-gated), `focus-visible:`, and `:active`. Use `interact:` instead of `hover:` for all interactive states.
- `font-chicago` is a retro bitmap font (ChicagoFLF) used for all headings and nav links. It gives the site its personality.
- `font-sans` is Inter, `font-mono` is JetBrains Mono.
- The neutral palette has very fine gradations (neutral-10, 25, 50, 75, 100, 150, 200... up to 950). Use these precisely.
- `prose-htmx` is a custom prose color theme. The content area is wrapped in `prose prose-htmx prose-sm sm:prose-base dark:prose-invert`.
- `not-prose` class opts out of prose styling for custom sections.
- Never use `transition-all`, always use `transition`.

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
    --color-blue-400: oklch(0.7262 0.111 251.08);
    --color-blue-500: oklch(0.6393 0.1445 257.27);
    --color-blue-600: oklch(0.5693 0.1653 261.81); /* htmx brand blue */
    --color-blue-700: oklch(0.505 0.1698 264.24);
    --color-blue-800: oklch(0.4421 0.1412 265.64);
    --color-blue-900: oklch(0.3934 0.1075 265.08);
    --color-blue-950: oklch(0.2936 0.068 267.21);
}

@layer base {
    /* Body styles */
    body {
        overflow-x: hidden;

        color: var(--color-neutral-700);
        background-color: var(--color-neutral-25);

        @media (prefers-color-scheme: dark) {
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
            --astro-code-background: var(--color-neutral-950);
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
    --tw-prose-invert-links: var(--color-blue-400);
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
    prose-a:not-in-prose-headings:dark:text-blue-400!
    prose-a:[[href^="#"]]:text-neutral-800
    prose-a:[[href^="#"]]:dark:text-neutral-100
    prose-h1:text-[2em]
    ;

    @apply
    prose-headings:scroll-pt-[calc(var(--header-height)+2rem)]
    prose-headings:scroll-mt-[calc(var(--header-height)+2rem)]
    [html:has(#sidebar)_&]:max-lg:prose-headings:scroll-pt-[calc(var(--header-height)+var(--sidebar-header-height)+2rem)]
    [html:has(#sidebar)_&]:max-lg:prose-headings:scroll-mt-[calc(var(--header-height)+var(--sidebar-header-height)+2rem)];

    /* Inline code - remove backticks */

    :where(:not(pre) > code):not(:where([class~="not-prose"], [class~="not-prose"] *)) {
        @apply text-neutral-900 dark:text-neutral-100 font-semibold bg-neutral-100 dark:bg-neutral-850 px-1.5 py-0.5 rounded;

        &::before, &::after {
            content: none;
        }
    }

    /* Code blocks - macOS window style */

    :where(pre):not(:where([class~="not-prose"], [class~="not-prose"] *)) {
        @apply relative border border-neutral-200 dark:border-neutral-850 rounded-[4px] bg-white dark:bg-neutral-950 shadow-xs overflow-y-hidden;

        code {
            @apply block overflow-x-auto text-xs leading-5 whitespace-pre p-4 pr-12 mask-l-from-97% mask-r-from-95%;
        }
    }

    /* Details/Summary - collapsible sections */

    :where(details):not(:where([class~="not-prose"], [class~="not-prose"] *)) {
        @apply my-6 pl-4 border-l-2 border-l-transparent;

        &[open] {
            @apply border-l-neutral-200 dark:border-l-neutral-850;
        }

        summary {
            @apply relative py-2 pl-2 pr-8 text-sm font-semibold cursor-pointer select-none
            text-neutral-800 dark:text-neutral-200
            rounded-[3px]
            interact:bg-neutral-100/70 dark:interact:bg-neutral-850/50
            transition;

            &::-webkit-details-marker,
            &::marker {
                @apply hidden;
            }

            &::after {
                @apply content-['›'] absolute right-2 top-1/2 -translate-y-1/2
                text-sm font-bold text-neutral-400 dark:text-neutral-600
                transition-transform;
            }
        }

        &[open] summary::after {
            @apply rotate-90;
        }

        > :not(summary):nth-child(2) {
            @apply mt-3;
        }

        > :not(summary):last-child {
            @apply mb-1;
        }

        p, ul, ol, pre, blockquote {
            &:last-child {
                @apply mb-0;
            }
        }

        p + p {
            @apply mt-3;
        }

        &.warning {
            @apply border-l-yellow-500 dark:border-l-yellow-400;
        }

        &.info {
            @apply border-l-blue-600 dark:border-l-blue-400;
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

---

## Current Rendered HTML (complete page)

Below is the **full rendered HTML** of the current `/essays` page, including the header, grid background, content area, and footer. The search dialog has been removed for brevity. Scripts and styles have been removed — refer to the CSS section above for styling context.

The area you should redesign is **the content inside `<div class="index-content prose prose-htmx ...">` (starting around the `<h1>Essays</h1>`)** — everything between the breadcrumbs and the footer. The header, breadcrumbs, grid background, and footer should remain unchanged.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- removed for brevity -->
  </head>
  <body hx-boost:inherited="true" hx-swap:inherited="innerMorph" class="group/body pt-(--header-height) has-[#mobile-navigation-toggle:checked]:overflow-hidden has-[dialog[open]]:overflow-hidden">
    <header role="banner" class="flex flex-col fixed inset-x-0 top-0 h-(--header-height) z-40 bg-neutral-10 dark:bg-neutral-920 border-b border-neutral-200 dark:border-neutral-850">
      <!-- Construction Banner -->
      <!--<a href="/guides/migration/htmx-2-to-4"-->
      <!--   class="flex justify-center text-center px-4 py-1 text-xs sm:text-sm text-neutral-800 dark:text-neutral-900 bg-yellow-300 border-y-4 [border-image:repeating-linear-gradient(45deg,#000,#000_10px,#ffcc00_10px,#ffcc00_20px)_4] hover:bg-yellow-300 dark:hover:bg-yellow-400 transition group"-->
      <!--   title="htmx 4.0 changes and migration guide">-->
      <!--    <span>🚧 htmx 4.0 is under construction. <span class="font-bold no-underline group-hover:underline">Read changes-->
      <!--        →</span>
    </span>-->
    <!--</a>-->
    <!-- Navigation -->
    <nav id="navigation" class="w-full h-(--navigation-bar-height) flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 lg:py-4 gap-4 lg:gap-12" aria-label="Primary Navigation">
      <div class="flex items-center gap-3">
        <!-- Slot for content before logo (e.g. sidebar toggle on content pages) -->
        <!-- Logo -->
        <a href="/" aria-label="HTMX Homepage" class="group/logo text-xl sm:text-[1.375rem] lg:text-2xl whitespace-nowrap font-mono tracking-tight font-extrabold inline-flex items-center text-neutral-900 dark:text-neutral-100 interact:text-blue-700 dark:interact:text-blue-300 shrink-0 sm:transition rounded-sm outline-hidden">
          <span aria-hidden="true">&lt;</span>
          <b class="relative text-blue-700 dark:text-blue-400 sm:transition" aria-hidden="true">
            <span class="group-interact/logo:opacity-0 sm:transition">/</span>
            <span class="absolute inset-0 opacity-0 group-interact/logo:opacity-100 sm:transition">-</span>
          </b>
          <span aria-hidden="true" class="relative">
            <span class="group-interact/logo:opacity-0 sm:transition">&gt;</span>
            <span class="absolute inset-0 opacity-0 group-interact/logo:opacity-100 sm:transition">-</span>
          </span>
          <span class="font-chicago ms-2 inline-block relative">
            <span class="group-interact/logo:opacity-0 sm:transition">
              htm<b class="text-blue-700 dark:text-blue-400">x</b>
            </span>
            <span class="absolute inset-0 opacity-0 group-interact/logo:opacity-100 group-interact/logo:underline sm:transition">
              hom<b class="text-blue-700 dark:text-blue-400">e</b>
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
              <a href="/essays" title="Read essays about htmx and hypermedia" aria-current="page" class="px-3 py-1 sm:transition interact:underline text-neutral-500 dark:text-neutral-450 interact:text-blue-700 dark:interact:text-blue-300 aria-[current=page]:text-neutral-900 dark:aria-[current=page]:text-neutral-100 aria-[current=page]:font-bold outline-hidden"> essays </a>
            </li>
            <li>
              <a href="/about" title="About htmx, the team, and community" class="px-3 py-1 sm:transition interact:underline text-neutral-500 dark:text-neutral-450 interact:text-blue-700 dark:interact:text-blue-300 aria-[current=page]:text-neutral-900 dark:aria-[current=page]:text-neutral-100 aria-[current=page]:font-bold outline-hidden"> about </a>
            </li>
          </ul>
        </div>
        <!-- Desktop: Status Bar -->
        <div id="status-bar" aria-hidden="true" class="hidden 2xl:block flex-1 text-center text-xs xl:text-sm text-neutral-700 dark:text-neutral-300 translate-y-0.5 truncate min-w-0" _="on mouseenter from <[title]/> put event.target's @title into me
          on mouseleave from <[title]/> put '' into me">
        </div>
        <!-- Desktop: Search & Social -->
        <div class="flex items-center min-w-[200px]">
          <!-- Desktop: Search -->
          <div class="flex-1">
            <button type="button" class="relative group flex items-center min-h-[44px] min-w-[200px] w-full bg-white dark:bg-neutral-910
              border border-neutral-200 dark:border-neutral-800 rounded-[5px] py-2 px-3 text-base font-sans text-neutral-400
              interact:bg-neutral-100 dark:interact:bg-neutral-800/50
              interact:border-neutral-400 dark:interact:border-neutral-600
              outline-hidden sm:transition cursor-pointer" aria-label="Open Search" hx-preserve="true" _="on click
              showModal() from the first of <search-index > dialog/>
              end
              on keydown[key is 'k' and (metaKey or ctrlKey)] from window
              halt the event
              trigger click
              end">
              <i class="icon-[ic--baseline-search] size-5 text-neutral-400 group-interact:text-neutral-600 dark:group-interact:text-neutral-200 sm:transition" aria-hidden="true">
              </i>
              <span class="text-sm mx-2 group-interact:text-neutral-600 dark:group-interact:text-neutral-200 sm:transition">Open Search</span>
              <kbd id="search-shortcut-hint" aria-hidden="true" class="ms-auto pe-1 font-chicago text-xs group-interact:text-neutral-600 dark:group-interact:text-neutral-200 sm:transition" _="init if navigator.platform.toLowerCase() contains 'mac' put '⌘ K' into me">Ctrl K</kbd>
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
        <button type="button" class="flex items-center justify-center size-10 text-neutral-600 dark:text-neutral-400 rounded-xs outline-hidden" aria-label="Search" _="on click showModal() from the first of <search-index > dialog/>">
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
      <a href="/docs" title="Read the complete documentation and tutorials" class="flex items-center gap-2 px-3 py-2.5 text-base rounded-sm transition font-chicago text-neutral-700 dark:text-neutral-300 interact:bg-blue-700 dark:interact:bg-blue-600 interact:text-white aria-[current=page]:bg-blue-700 dark:aria-[current=page]:bg-blue-600 aria-[current=page]:text-white aria-[current=page]:font-bold" _="on click set #mobile-navigation-toggle.checked to false"> docs </a>
      <a href="/reference" title="Browse the full API reference" class="flex items-center gap-2 px-3 py-2.5 text-base rounded-sm transition font-chicago text-neutral-700 dark:text-neutral-300 interact:bg-blue-700 dark:interact:bg-blue-600 interact:text-white aria-[current=page]:bg-blue-700 dark:aria-[current=page]:bg-blue-600 aria-[current=page]:text-white aria-[current=page]:font-bold" _="on click set #mobile-navigation-toggle.checked to false"> reference </a>
      <a href="/patterns" title="Common UI patterns with htmx" class="flex items-center gap-2 px-3 py-2.5 text-base rounded-sm transition font-chicago text-neutral-700 dark:text-neutral-300 interact:bg-blue-700 dark:interact:bg-blue-600 interact:text-white aria-[current=page]:bg-blue-700 dark:aria-[current=page]:bg-blue-600 aria-[current=page]:text-white aria-[current=page]:font-bold" _="on click set #mobile-navigation-toggle.checked to false"> patterns </a>
      <a href="/essays" title="Read essays about htmx and hypermedia" aria-current="page" class="flex items-center gap-2 px-3 py-2.5 text-base rounded-sm transition font-chicago text-neutral-700 dark:text-neutral-300 interact:bg-blue-700 dark:interact:bg-blue-600 interact:text-white aria-[current=page]:bg-blue-700 dark:aria-[current=page]:bg-blue-600 aria-[current=page]:text-white aria-[current=page]:font-bold" _="on click set #mobile-navigation-toggle.checked to false"> essays </a>
      <a href="/about" title="About htmx, the team, and community" class="flex items-center gap-2 px-3 py-2.5 text-base rounded-sm transition font-chicago text-neutral-700 dark:text-neutral-300 interact:bg-blue-700 dark:interact:bg-blue-600 interact:text-white aria-[current=page]:bg-blue-700 dark:aria-[current=page]:bg-blue-600 aria-[current=page]:text-white aria-[current=page]:font-bold" _="on click set #mobile-navigation-toggle.checked to false"> about </a>
      <div class="h-px bg-neutral-200 dark:bg-neutral-800 my-4" role="separator">
      </div>
      <!-- Mobile (Drawer): Discord Button -->
      <a href="/discord" title="Join the Discord community" class="flex items-center gap-3 px-3 py-2.5 text-base rounded-sm transition font-chicago text-neutral-700 dark:text-neutral-300 interact:bg-blue-700 dark:interact:bg-blue-600 interact:text-white" _="on click set #mobile-navigation-toggle.checked to false">
        <i class="icon-[ic--baseline-discord] text-xl">
        </i>
        Discord
      </a>
      <!-- Mobile (Drawer): Github Button -->
      <a href="https://github.com/bigskysoftware/htmx" target="_blank" rel="noopener noreferrer" title="View source code on GitHub" class="flex items-center gap-3 px-3 py-2.5 text-base rounded-sm transition font-chicago text-neutral-700 dark:text-neutral-300 interact:bg-blue-700 interact:text-white" _="on click set #mobile-navigation-toggle.checked to false">
        <i class="icon-[mdi--github] text-xl">
        </i>
        GitHub
      </a>
    </div>
  </nav>
  <div class="fixed inset-0 pointer-events-none -z-10 perspective-[800px] starting:opacity-0 transition duration-500" aria-hidden="true" data-astro-cid-oz2goqlp>
    <div class="grid-plane absolute inset-0" data-astro-cid-oz2goqlp>
      <div class="grid-pattern-3d absolute" data-astro-cid-oz2goqlp>
      </div>
    </div>
  </div>
  <div id="content-wrapper" class="group/page" data-collection="essays" data-has-sidebar="false">
    <main id="main-content" class="flex-1">
      <div class="w-full mx-auto px-4 sm:px-6 lg:px-8 flex justify-center max-w-[1440px]">
        <!-- Main Content Area -->
        <div class="pt-8 sm:pt-12 flex-1 w-full relative starting:opacity-0 delay-150 transition max-w-4xl">
          <nav aria-label="Breadcrumb" class="mb-6">
            <a href="/" class="sm:hidden inline-flex items-center gap-1 -ml-1 py-1.5 pr-2 text-sm text-neutral-500 dark:text-neutral-450 transition interact:underline interact:text-blue-700 dark:interact:text-blue-300 rounded-sm">
              <i class="icon-[mdi--chevron-left] text-lg shrink-0" aria-hidden="true">
              </i>
              <span class="truncate max-w-[30ch]">Home</span>
            </a>
            <ol class="hidden sm:flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500 dark:text-neutral-450">
              <li class="flex items-center gap-3">
                <a href="/" class="transition interact:underline interact:text-blue-700 dark:interact:text-blue-300">Home</a>
              </li>
              <li class="flex items-center gap-3">
                <span class="text-neutral-300 dark:text-neutral-700 select-none" aria-hidden="true">/</span>
                <span class="font-bold text-neutral-700 dark:text-neutral-300 truncate max-w-[40ch]" aria-current="page">Essays</span>
              </li>
            </ol>
          </nav>
          <div class="index-content prose prose-htmx prose-sm sm:prose-base dark:prose-invert max-w-none relative z-0">
            <h1 id>Essays</h1>
            <p class="text-neutral-600 dark:text-neutral-400">Perspectives on htmx, hypermedia, and simpler web development.</p>
            <h2 class="not-prose font-sans text-xs font-medium uppercase tracking-widest text-neutral-550 dark:text-neutral-450 mt-8 mb-4">Most Recent</h2>
            <div class="not-prose mb-4">
              <a href="/essays/yes-and" class="group/feat flex flex-col no-underline rounded-lg px-5 py-5 sm:px-6 sm:py-6 -mx-2 sm:-mx-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 transition interact:bg-blue-700 dark:interact:bg-blue-600 interact:border-blue-700 dark:interact:border-blue-600">
                <span class="flex items-center gap-3 mb-3 sm:mb-4">
                  <span class="inline-block text-[9px] font-mono font-medium uppercase tracking-wider px-1.5 py-px rounded bg-blue-200/50 dark:bg-blue-700/50 text-blue-700 dark:text-blue-300 group-interact/feat:bg-white/20 group-interact/feat:text-white transition">Latest</span>
                  <span class="flex items-center gap-1.5 text-xs text-neutral-500 group-interact/feat:text-blue-200 transition">
                    <span>Carson Gross</span>
                    <span aria-hidden="true">&middot;</span>
                    <span class="font-mono tabular-nums">Feb 27, 2026</span>
                  </span>
                </span>
                <span class="block font-chicago text-xl sm:text-2xl leading-tight text-neutral-800 dark:text-neutral-100 transition group-interact/feat:text-white mb-2 sm:mb-3">Yes, and...</span>
                <span class="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed transition group-interact/feat:text-blue-100 max-w-[65ch] line-clamp-2">In this essay, Carson Gross discusses his advice to young people interested in computer science worried about the future given the advancements in AI.</span>
              </a>
            </div>
            <div class="not-prose">
              <div class="flex flex-col">
                <a href="/essays/paris-2024-olympics-htmx-network-automation" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                  <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Building Critical Infrastructure with htmx: Network Automation for the Paris 2024 Olympics </span>
                  <span class="shrink-0 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 group-interact/link:text-blue-200 transition">
                    <span>Rodolphe Trujillo</span>
                    <span aria-hidden="true">&middot;</span>
                    <span class="font-mono tabular-nums">Jan 16, 2026</span>
                  </span>
                </a>
                <a href="/essays/the-fetchening" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                  <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> The fetch()ening </span>
                  <span class="shrink-0 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 group-interact/link:text-blue-200 transition">
                    <span>Carson Gross</span>
                    <span aria-hidden="true">&middot;</span>
                    <span class="font-mono tabular-nums">Nov 1, 2025</span>
                  </span>
                </a>
                <a href="/essays/vendoring" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                  <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Vendoring </span>
                  <span class="shrink-0 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 group-interact/link:text-blue-200 transition">
                    <span>Carson Gross</span>
                    <span aria-hidden="true">&middot;</span>
                    <span class="font-mono tabular-nums">Jan 27, 2025</span>
                  </span>
                </a>
                <a href="/essays/alternatives" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                  <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Alternatives to htmx </span>
                  <span class="shrink-0 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 group-interact/link:text-blue-200 transition">
                    <span>Carson Gross</span>
                    <span aria-hidden="true">&middot;</span>
                    <span class="font-mono tabular-nums">Jan 12, 2025</span>
                  </span>
                </a>
                <a href="/essays/a-real-world-wasm-to-htmx-port" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                  <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> A Real World wasm to htmx Port </span>
                  <span class="shrink-0 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 group-interact/link:text-blue-200 transition">
                    <span>Joe Fioti</span>
                    <span aria-hidden="true">&middot;</span>
                    <span class="font-mono tabular-nums">Jan 10, 2025</span>
                  </span>
                </a>
              </div>
            </div>
            <div class="not-prose mt-4">
              <a href="/essays/all" class="group/all inline-flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 no-underline transition interact:underline interact:text-blue-700 dark:interact:text-blue-300">
                <p>Show all 44 essays <i class="icon-[mdi--arrow-right] size-3 translate-y-px transition group-interact/all:translate-x-0.5">
                </i>
              </p>
            </a>
          </div>
          <div class="not-prose grid grid-cols-1 sm:grid-cols-2 gap-x-8 mt-12">
            <div>
              <h2 class="font-sans text-xs font-medium uppercase tracking-widest text-neutral-550 dark:text-neutral-450 mb-4">Hypermedia and REST</h2>
              <div class="not-prose">
                <div class="flex flex-col">
                  <a href="/essays/hateoas" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> HATEOAS </span>
                  </a>
                  <a href="/essays/how-did-rest-come-to-mean-the-opposite-of-rest" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> How Did REST Come To Mean The Opposite of REST? </span>
                  </a>
                  <a href="/essays/two-approaches-to-decoupling" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Two Approaches To Decoupling </span>
                  </a>
                  <a href="/essays/hypermedia-clients" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Hypermedia Clients </span>
                  </a>
                  <a href="https://intercoolerjs.org/2016/05/08/hatoeas-is-for-humans.html" target="_blank" rel="noopener noreferrer" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> HATEOAS Is For Humans </span>
                    <span class="shrink-0 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 group-interact/link:text-blue-200 transition">
                      <span>Carson Gross</span>
                      <span aria-hidden="true">&middot;</span>
                      <span class="font-mono tabular-nums">2016-05-08</span>
                    </span>
                  </a>
                  <a href="https://intercoolerjs.org/2020/01/14/taking-html-seriously" target="_blank" rel="noopener noreferrer" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Taking HTML Seriously </span>
                    <span class="shrink-0 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 group-interact/link:text-blue-200 transition">
                      <span>Carson Gross</span>
                      <span aria-hidden="true">&middot;</span>
                      <span class="font-mono tabular-nums">2020-01-14</span>
                    </span>
                  </a>
                  <a href="/essays/right-click-view-source" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> The #ViewSource Affordance </span>
                  </a>
                </div>
              </div>
            </div>
            <div>
              <h2 class="font-sans text-xs font-medium uppercase tracking-widest text-neutral-550 dark:text-neutral-450 mb-4">Why Hypermedia?</h2>
              <div class="not-prose">
                <div class="flex flex-col">
                  <a href="/essays/hypermedia-on-whatever-youd-like" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Hypermedia On Whatever you&#39;d Like (HOWL) </span>
                  </a>
                  <a href="/essays/a-response-to-rich-harris" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> A Response To &quot;Have SPAs Ruined The Web&quot; </span>
                  </a>
                  <a href="/essays/when-to-use-hypermedia" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> When To Use Hypermedia? </span>
                  </a>
                  <a href="https://intercoolerjs.org/2016/02/17/api-churn-vs-security.html" target="_blank" rel="noopener noreferrer" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> The API Churn/Security Trade-off </span>
                    <span class="shrink-0 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 group-interact/link:text-blue-200 transition">
                      <span>Carson Gross</span>
                      <span aria-hidden="true">&middot;</span>
                      <span class="font-mono tabular-nums">2016-02-17</span>
                    </span>
                  </a>
                  <a href="/essays/does-hypermedia-scale" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Does Hypermedia Scale? </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div class="not-prose grid grid-cols-1 sm:grid-cols-2 gap-x-8 mt-12">
            <div>
              <h2 class="font-sans text-xs font-medium uppercase tracking-widest text-neutral-550 dark:text-neutral-450 mb-4">Real World</h2>
              <div class="not-prose">
                <div class="flex flex-col">
                  <a href="/essays/paris-2024-olympics-htmx-network-automation" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Building Critical Infrastructure with htmx: Network Automation for the Paris 2024 Olympics </span>
                  </a>
                  <a href="/essays/a-real-world-react-to-htmx-port" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> A Real World React to htmx Port </span>
                  </a>
                  <a href="/essays/another-real-world-react-to-htmx-port" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Another Real World React to htmx Port </span>
                  </a>
                  <a href="/essays/a-real-world-wasm-to-htmx-port" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> A Real World wasm to htmx Port </span>
                  </a>
                  <a href="/essays/a-real-world-nextjs-to-htmx-port" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Next.js to htmx — A Real World Example </span>
                  </a>
                  <a href="/essays/you-cant" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> You Can&#39;t Build Interactive Web Apps Except as Single Page Applications… And Other Myths </span>
                  </a>
                </div>
              </div>
            </div>
            <div>
              <h2 class="font-sans text-xs font-medium uppercase tracking-widest text-neutral-550 dark:text-neutral-450 mb-4">On The Other Hand…</h2>
              <div class="not-prose">
                <div class="flex flex-col">
                  <a href="/essays/htmx-sucks" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> htmx sucks </span>
                  </a>
                  <a href="/essays/why-gumroad-didnt-choose-htmx" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Why Gumroad Didn&#39;t Choose htmx </span>
                  </a>
                  <a href="https://chrisdone.com/posts/htmx-critique/" target="_blank" rel="noopener noreferrer" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> A Modest Critique of htmx </span>
                    <span class="shrink-0 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 group-interact/link:text-blue-200 transition">
                      <span>Chris Done</span>
                    </span>
                  </a>
                  <a href="https://news.ycombinator.com/item?id=41782080" target="_blank" rel="noopener noreferrer" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> A Modest Critique of htmx (Response) </span>
                  </a>
                  <a href="https://ajmoon.com/posts/mesh-i-tried-htmx-then-ditched-it" target="_blank" rel="noopener noreferrer" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> I tried HTMX, then ditched it </span>
                    <span class="shrink-0 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 group-interact/link:text-blue-200 transition">
                      <span>AJ Moon</span>
                    </span>
                  </a>
                  <a href="/essays/alternatives" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Alternatives </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div class="not-prose grid grid-cols-1 sm:grid-cols-2 gap-x-8 mt-12">
            <div>
              <h2 class="font-sans text-xs font-medium uppercase tracking-widest text-neutral-550 dark:text-neutral-450 mb-4">Building Hypermedia Apps</h2>
              <div class="not-prose">
                <div class="flex flex-col">
                  <a href="/essays/hypermedia-driven-applications" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Hypermedia-Driven Applications (HDAs) </span>
                  </a>
                  <a href="/essays/web-security-basics-with-htmx" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Web Security Basics (with htmx) </span>
                  </a>
                  <a href="/essays/hypermedia-friendly-scripting" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Hypermedia Friendly Scripting </span>
                  </a>
                  <a href="/essays/tips-for-SSR-HDA-apps" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> 10 Tips For Building SSR/HDA applications </span>
                  </a>
                  <a href="/essays/why-tend-not-to-use-content-negotiation" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Why I Tend Not To Use Content Negotiation </span>
                  </a>
                  <a href="/essays/template-fragments" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Template Fragments </span>
                  </a>
                  <a href="/essays/webcomponents-work-great" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Web Components Work Great with htmx </span>
                  </a>
                  <a href="/essays/view-transitions" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> View Transitions </span>
                  </a>
                  <a href="/essays/mvc" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Model/View/Controller </span>
                  </a>
                  <a href="https://github.com/1cg/html-json-speed-comparison" target="_blank" rel="noopener noreferrer" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Is Rendering JSON More Efficient Than Rendering HTML? </span>
                    <span class="shrink-0 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 group-interact/link:text-blue-200 transition">
                      <span>Carson Gross</span>
                    </span>
                  </a>
                  <a href="https://github.com/1cg/html-json-size-comparison" target="_blank" rel="noopener noreferrer" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Is JSON Smaller Than HTML? </span>
                    <span class="shrink-0 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 group-interact/link:text-blue-200 transition">
                      <span>Carson Gross</span>
                    </span>
                  </a>
                </div>
              </div>
            </div>
            <div>
              <h2 class="font-sans text-xs font-medium uppercase tracking-widest text-neutral-550 dark:text-neutral-450 mb-4">Complexity Very, Very Bad</h2>
              <div class="not-prose">
                <div class="flex flex-col">
                  <a href="https://grugbrain.dev" target="_blank" rel="noopener noreferrer" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> The Grug Brained Developer </span>
                    <span class="shrink-0 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 group-interact/link:text-blue-200 transition">
                      <span>Carson Gross</span>
                    </span>
                  </a>
                  <a href="/essays/codin-dirty" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Codin&#39; Dirty </span>
                  </a>
                  <a href="/essays/locality-of-behaviour" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Locality of Behavior (LoB) </span>
                  </a>
                  <a href="/essays/complexity-budget" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Complexity Budget </span>
                  </a>
                  <a href="/essays/no-build-step" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Why htmx Does Not Have a Build Step </span>
                  </a>
                  <a href="/essays/is-htmx-another-javascript-framework" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Is htmx Just Another JavaScript Framework? </span>
                  </a>
                  <a href="https://www.youtube.com/watch?v=javGxN-h9VQ" target="_blank" rel="noopener noreferrer" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> htmx Implementation Deep Dive </span>
                    <span class="shrink-0 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 group-interact/link:text-blue-200 transition">
                      <span>Carson Gross</span>
                    </span>
                  </a>
                  <a href="/essays/vendoring" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                    <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Vendoring </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <h2 class="not-prose font-sans text-xs font-medium uppercase tracking-widest text-neutral-550 dark:text-neutral-450 mt-12 mb-4">Hypermedia Research</h2>
          <div class="not-prose">
            <div class="flex flex-col">
              <a href="https://dl.acm.org/doi/pdf/10.1145/800197.806036" target="_blank" rel="noopener noreferrer" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> A File Structure For The Complex, The Changing and the Indeterminate </span>
                <span class="shrink-0 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 group-interact/link:text-blue-200 transition">
                  <span>Ted Nelson</span>
                  <span aria-hidden="true">&middot;</span>
                  <span class="font-mono tabular-nums">1965</span>
                </span>
              </a>
              <a href="https://www.youtube.com/watch?v=B6rKUf9DWRI" target="_blank" rel="noopener noreferrer" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> The Mother Of All Demos </span>
                <span class="shrink-0 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 group-interact/link:text-blue-200 transition">
                  <span>Doug Engelbart</span>
                  <span aria-hidden="true">&middot;</span>
                  <span class="font-mono tabular-nums">1968</span>
                </span>
              </a>
              <a href="http://info.cern.ch/hypertext/WWW/TheProject.html" target="_blank" rel="noopener noreferrer" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> The First Web Page </span>
                <span class="shrink-0 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 group-interact/link:text-blue-200 transition">
                  <span class="font-mono tabular-nums">1991</span>
                </span>
              </a>
              <a href="https://ics.uci.edu/~fielding/pubs/dissertation/top.htm" target="_blank" rel="noopener noreferrer" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Architectural Styles and the Design of Network-based Software Architectures </span>
                <span class="shrink-0 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 group-interact/link:text-blue-200 transition">
                  <span>Roy Fielding</span>
                  <span aria-hidden="true">&middot;</span>
                  <span class="font-mono tabular-nums">2000</span>
                </span>
              </a>
              <a href="https://web.archive.org/web/20240428215142/https://paul.luon.net/hypermedia/index.html" target="_blank" rel="noopener noreferrer" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> State of the Art Review on Hypermedia Issues and Applications </span>
                <span class="shrink-0 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 group-interact/link:text-blue-200 transition">
                  <span class="font-mono tabular-nums">2006</span>
                </span>
              </a>
              <a href="https://youtu.be/BZmfCjtv6cM" target="_blank" rel="noopener noreferrer" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> How Primer has changed the way we write JavaScript for the better at Facebook </span>
                <span class="shrink-0 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 group-interact/link:text-blue-200 transition">
                  <span>Makinde Adeagbo &amp; Tom Occhino</span>
                  <span aria-hidden="true">&middot;</span>
                  <span class="font-mono tabular-nums">2010</span>
                </span>
              </a>
              <a href="https://dl.acm.org/doi/pdf/10.1145/3648188.3675127" target="_blank" rel="noopener noreferrer" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Hypermedia Controls: Feral to Formal </span>
                <span class="shrink-0 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 group-interact/link:text-blue-200 transition">
                  <span>ACM HT&#39;24</span>
                  <span aria-hidden="true">&middot;</span>
                  <span class="font-mono tabular-nums">2024</span>
                </span>
              </a>
              <a href="https://hypermedia.cs.montana.edu/papers/preserving-restful.pdf" target="_blank" rel="noopener noreferrer" class="group/link flex items-center gap-3 px-3 py-2 -mx-3 rounded no-underline transition text-neutral-800 dark:text-neutral-200 interact:text-white interact:bg-blue-700 dark:interact:bg-blue-600">
                <span class="font-chicago text-sm leading-snug truncate min-w-0 flex-1"> Preserving REST-ful Visibility Of Rich Web Applications With Generalized Hypermedia Controls </span>
                <span class="shrink-0 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 group-interact/link:text-blue-200 transition">
                  <span>ACM SIGWEB Newsletter</span>
                  <span aria-hidden="true">&middot;</span>
                  <span class="font-mono tabular-nums">2024</span>
                </span>
              </a>
            </div>
          </div>
          <h2 class="not-prose font-sans text-xs font-medium uppercase tracking-widest text-neutral-550 dark:text-neutral-450 mt-12 mb-4">Memes</h2>
          <p>Memes now have <a href="/memes">their own page</a>.</p>
        </div>
      </div>
      <!-- Right Column (Table of Contents) -->
    </div>
  </main>
</div>
<footer class="text-sm border-t border-neutral-200 dark:border-neutral-850 bg-neutral-10 dark:bg-neutral-920 mt-16 sm:mt-24 py-12 sm:py-16 relative z-10">
  <div class="px-4 sm:px-6 lg:px-12 xl:px-8">
    <div class="mx-auto max-w-4xl">
      <!-- Navigation Sections + Haiku -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8 sm:gap-8 lg:gap-12">
        <div>
          <h2 class="tracking-wide uppercase text-neutral-900 dark:text-neutral-100 mb-4 sm:mb-6"> Links </h2>
          <ul class="space-y-3 font-chicago">
            <li>
              <a href="/docs" title="Go to <b>/docs</b>" class="text-neutral-500 dark:text-neutral-450 interact:text-blue-600 dark:interact:text-blue-300 interact:underline transition inline-flex items-center gap-3">  docs </a>
            </li>
            <li>
              <a href="/reference" title="Go to <b>/reference</b>" class="text-neutral-500 dark:text-neutral-450 interact:text-blue-600 dark:interact:text-blue-300 interact:underline transition inline-flex items-center gap-3">  reference </a>
            </li>
            <li>
              <a href="/patterns" title="Go to <b>/patterns</b>" class="text-neutral-500 dark:text-neutral-450 interact:text-blue-600 dark:interact:text-blue-300 interact:underline transition inline-flex items-center gap-3">  patterns </a>
            </li>
            <li>
              <a href="/essays" title="Go to <b>/essays</b>" class="text-neutral-500 dark:text-neutral-450 interact:text-blue-600 dark:interact:text-blue-300 interact:underline transition inline-flex items-center gap-3">  essays </a>
            </li>
            <li>
              <a href="/about" title="Go to <b>/about</b>" class="text-neutral-500 dark:text-neutral-450 interact:text-blue-600 dark:interact:text-blue-300 interact:underline transition inline-flex items-center gap-3">  about </a>
            </li>
          </ul>
        </div>
        <div>
          <h2 class="tracking-wide uppercase text-neutral-900 dark:text-neutral-100 mb-4 sm:mb-6"> Community </h2>
          <ul class="space-y-3 font-medium">
            <li>
              <a href="/discord" title="Go to <b>/discord</b>" class="text-neutral-500 dark:text-neutral-450 interact:text-blue-600 dark:interact:text-blue-300 interact:underline transition inline-flex items-center gap-3">
              <i class="icon-[ic--baseline-discord] text-base">
              </i> Discord </a>
            </li>
            <li>
              <a href="https://github.com/bigskysoftware/htmx" target="_blank" rel="noopener noreferrer" title="Go to <b>https://github.com/bigskysoftware/htmx</b>" class="text-neutral-500 dark:text-neutral-450 interact:text-blue-600 dark:interact:text-blue-300 interact:underline transition inline-flex items-center gap-3">
              <i class="icon-[mdi--github] text-base">
              </i> GitHub </a>
            </li>
            <li>
              <a href="https://x.com/htmx_org" target="_blank" rel="noopener noreferrer" title="Go to <b>https://x.com/htmx_org</b>" class="text-neutral-500 dark:text-neutral-450 interact:text-blue-600 dark:interact:text-blue-300 interact:underline transition inline-flex items-center gap-3">
              <i class="icon-[fa6-brands--x-twitter] text-base">
              </i> @htmx_org </a>
            </li>
            <li>
              <a href="https://www.reddit.com/r/htmx/" target="_blank" rel="noopener noreferrer" title="Go to <b>https://www.reddit.com/r/htmx/</b>" class="text-neutral-500 dark:text-neutral-450 interact:text-blue-600 dark:interact:text-blue-300 interact:underline transition inline-flex items-center gap-3">
              <i class="icon-[fa6-brands--reddit-alien] text-base">
              </i> Reddit </a>
            </li>
            <li>
              <a href="https://stackoverflow.com/questions/tagged/htmx" target="_blank" rel="noopener noreferrer" title="Go to <b>https://stackoverflow.com/questions/tagged/htmx</b>" class="text-neutral-500 dark:text-neutral-450 interact:text-blue-600 dark:interact:text-blue-300 interact:underline transition inline-flex items-center gap-3">
              <i class="icon-[simple-icons--stackoverflow] text-base">
              </i> Stack Overflow </a>
            </li>
          </ul>
        </div>
        <div>
          <h2 class="tracking-wide uppercase text-neutral-900 dark:text-neutral-100 mb-4 sm:mb-6"> Resources </h2>
          <ul class="space-y-3 font-medium">
            <li>
              <a href="/interviews" title="Go to <b>/interviews</b>" class="text-neutral-500 dark:text-neutral-450 interact:text-blue-600 dark:interact:text-blue-300 interact:underline transition inline-flex items-center gap-3">
              <i class="icon-[mdi--account-voice] text-base">
              </i> Interviews </a>
            </li>
            <li>
              <a href="/podcasts" title="Go to <b>/podcasts</b>" class="text-neutral-500 dark:text-neutral-450 interact:text-blue-600 dark:interact:text-blue-300 interact:underline transition inline-flex items-center gap-3">
              <i class="icon-[lucide--audio-lines] text-base">
              </i> Podcasts </a>
            </li>
            <li>
              <a href="/memes" title="Go to <b>/memes</b>" class="text-neutral-500 dark:text-neutral-450 interact:text-blue-600 dark:interact:text-blue-300 interact:underline transition inline-flex items-center gap-3">
              <i class="icon-[mdi--emoticon-cool-outline] text-base">
              </i> Memes </a>
            </li>
            <li>
              <a href="https://hypermedia.systems" target="_blank" rel="noopener noreferrer" title="Go to <b>https://hypermedia.systems</b>" class="text-neutral-500 dark:text-neutral-450 interact:text-blue-600 dark:interact:text-blue-300 interact:underline transition inline-flex items-center gap-3">
              <i class="icon-[mdi--book-open-page-variant] text-base">
              </i> Book </a>
            </li>
            <li>
              <a href="/rss.xml" title="Go to <b>/rss.xml</b>" class="text-neutral-500 dark:text-neutral-450 interact:text-blue-600 dark:interact:text-blue-300 interact:underline transition inline-flex items-center gap-3">
              <i class="icon-[mdi--rss] text-base">
              </i> RSS </a>
            </li>
          </ul>
        </div>
        <!-- Haiku -->
        <div>
          <h2 class="tracking-wide uppercase text-neutral-900 dark:text-neutral-100 mb-4 sm:mb-6">
            Haiku
          </h2>
          <p class="italic text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-loose">
            javascript fatigue:<br>longing for a hypertext<br>already in hand
          </p>
        </div>
      </div>
      <!-- Copyright -->
      <div class="flex gap-3 mt-12 sm:mt-16 text-neutral-500">
        <span class="flex items-center gap-1.5">
          &copy; 2026 <a href="https://bigsky.software" target="_blank" rel="noopener noreferrer" title="Go to Big Sky Software's website" class="group inline-flex items-center gap-1.5 interact:text-blue-600 dark:interact:text-blue-300 interact:underline sm:transition">
          <img src="/_astro/bss-bars._0FeMLgx_1DJEhI.webp" alt="Big Sky Software" loading="lazy" decoding="async" fetchpriority="auto" width="323" height="338" class="size-3 mx-1 group-interact:brightness-125">
          Big Sky Software
        </a>
      </span>
    </div>
  </div>
</div>
</footer>
  <!-- search dialog removed for brevity -->

```

---

## Essay Descriptions (not currently shown on the page)

Each essay has a `description` field that is NOT shown in the current rendered HTML above, but you should incorporate descriptions into your redesign for at least the featured/prominent essays. Here are descriptions for the key essays:

- **HATEOAS**: "In this essay, Carson Gross explores HATEOAS (Hypermedia as the Engine of Application State), explaining how it enables REST APIs through hypermedia responses and contrasting it with modern JSON-based APIs."
- **How Did REST Come To Mean The Opposite of REST?**: "A historical look at how Roy Fielding's architectural style for hypermedia was co-opted by JSON APIs."
- **Hypermedia-Driven Applications (HDAs)**: "A practical architecture for building modern web applications using hypermedia instead of heavy client-side state."
- **A Real World React to htmx Port**: "David Guillot at Contexte gave 'The Mother of All htmx Demos' at DjangoCon 2022. This real-world case study of replacing React with htmx in a SaaS product demonstrates significant improvements in code size, performance, and development team efficiency."
- **Building Critical Infrastructure with htmx: Network Automation for the Paris 2024 Olympics**: "Building critical, high-stakes software infrastructure with htmx and Python, and how the simplification induced by this approach is interesting for AI-assisted development."
- **htmx sucks**: "This article provides a critical analysis of htmx, explaining why the author believes it represents a problematic approach to modern web development."
- **Locality of Behavior (LoB)**: "Carson Gross explores the Locality of Behaviour principle, which emphasizes making the behavior of code units obvious on inspection to enhance maintainability."
- **Codin' Dirty**: "Carson Gross discusses an alternative approach to software development that challenges the principles outlined in 'Clean Code.'"
- **Yes, and...**: "Carson Gross discusses his advice to young people interested in computer science worried about the future given the advancements in AI."
- **You Can't Build Interactive Web Apps Except as Single Page Applications... And Other Myths**: "Debunking common objections to the hypermedia approach."

---

## What to Redesign

### Problems with the current design
1. **Flat visual hierarchy** — The featured card at top is the only visual differentiation. After that, every section looks identical: a tiny label + a flat list of links. No visual rhythm.
2. **No descriptions shown** — Essays have rich descriptions that could help readers decide what to read, but they're completely hidden.
3. **Topic sections are undifferentiated** — All 6 curated sections use identical styling. They blur together.
4. **No breathing room** — Sections stack tightly with only `mt-12` between them.
5. **"Real World" case studies deserve more prominence** — Paris Olympics, React-to-htmx ports are the strongest social proof but they're buried in the middle.
6. **No clear reading path** — A first-time visitor has no idea where to start.
7. **Memes line at bottom is orphaned** — Just dangles.

### Design Goals
1. **Clear visual hierarchy** — Guide the reader's eye: featured → essential reading → topic exploration → archive
2. **Show descriptions** — At least for featured/prominent essays
3. **Create distinct visual zones** — Each section should feel intentionally designed, not copy-pasted
4. **Personality** — The htmx brand is irreverent and self-aware. "On The Other Hand…" is self-critical/playful and could look different from "Real World"
5. **Mobile-first** — Must look great on mobile (single column) and desktop
6. **Stay within the design system** — Use existing colors, fonts, `interact:` pattern. Don't introduce new colors.
7. **No JavaScript** — Pure CSS/Tailwind. Static HTML.

### Ideas to Consider (not mandatory)
- A "Start Here" or "Essential Reading" section for newcomers with 3-4 cornerstone essays shown as cards with descriptions
- Case studies in a visually elevated container (tinted background, cards instead of flat links)
- The "On The Other Hand…" section with a distinct visual treatment (dashed border? different layout? a cheeky tagline?)
- The Research section as a chronological timeline-style list with dates prominent
- A punchy Memes link card at the bottom instead of a dangling text line
- More spacing between major sections

Also:
Keep all the same essay links and categorization (you can reorder/re-group but don't remove any essays). Use the exact same Tailwind classes and `interact:` variant from the design system.

Note:
In the Canvas, you can use <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script> and ```    <style type="text/tailwindcss">
      @theme {
        --color-clifford: #da373d;
      }
    </style>```