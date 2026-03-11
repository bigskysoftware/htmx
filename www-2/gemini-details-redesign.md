Redesign the <details>/<summary> CSS for prose content pages on the htmx website. Output ONLY the replacement CSS block (the :where(details)... rule) using Tailwind's @apply syntax. It goes inside the .prose
{
} section of www-2/src/assets/css/input.css.

     Site Design Language

     - Fonts: ChicagoFLF (headings, font-chicago), Inter (body, font-sans), JetBrains Mono (code, font-mono)
     - Colors: Custom neutral OKLCH palette (neutral-25 through neutral-950), htmx blue (blue-50 through blue-950). Light bg: neutral-25, dark bg: neutral-920
     - Card pattern: rounded-[3px] border border-neutral-200 dark:border-neutral-850 bg-white dark:bg-neutral-950
     - Inline code: text-neutral-900 dark:text-neutral-100 font-semibold bg-neutral-100 dark:bg-neutral-850 px-1.5 py-0.5 rounded
     - Code blocks: border border-neutral-200 dark:border-neutral-850 rounded-[4px] bg-white dark:bg-neutral-950 shadow-xs with code { text-xs leading-5 p-4 pr-12 }. The <pre> padding is forced to 0 !important
by a
global rule — code's own p-4 provides the padding.
- Blockquote borders: Light neutral-200, dark neutral-850 (from prose-htmx theme tokens)
- Interaction: Custom interact: variant (combines @media (hover: hover) { &:hover }, &:focus-visible, &:active). No sticky hover on mobile.
- Transitions: Always use transition (never transition-all). Default 150ms duration, don't set explicit durations.
- Personality: Retro-modern, confident, clean. Not corporate. Understated, not flashy.
- Framework: Tailwind CSS v4 with @apply in input.css. Uses @tailwindcss/typography plugin and @iconify/tailwind4 for icons.

     What Needs Redesigning

     The <details>/<summary> elements inside .prose content. These appear in documentation pages. The styling lives in www-2/src/assets/css/input.css inside the .prose { } block, scoped with
     :where(details):not(:where([class~="not-prose"], [class~="not-prose"] *)).

     Design Requirements

     - "Out of the way" — details are secondary/collapsible content. They should NOT compete with primary content. When closed, blend into prose flow. When open, show scope clearly but subtly.
     - Three variants: default (neutral), .warning (yellow accent, used for "Changes in htmx 4.0" migration notices), .info (blue accent, not yet used but define it)
     - Summary needs: rotating chevron/indicator, hover state (subtle bg change using interact: variant, NOT underline), bold/semibold text
     - Content area needs: proper spacing, code blocks inside should look clean (code blocks already have their own rounded-[4px] border shadow-xs styling from the prose pre rule)
     - Must handle: <p>, <strong>, <pre>/<code> blocks, <ul>/<ol> inside the details
     - Dark mode support required (use dark: prefix)
     - No list-none on summary — it triggers a Safari VoiceOver regression. Use explicit &::-webkit-details-marker, &::marker { @apply hidden; } instead.
     - No transition-all — always use transition per project convention.

     Variants In Use

     Default — installation page, collapsible "Other options" with alternative code snippets:
     <details>
     <summary>Other options</summary>

     **Unminified (for debugging):**
     ```html
     <script defer src="..."></script>

     ES Module (minified):
     <script type="module" src="..."></script>
     Warning — migration notices at top of documentation pages:
     <details class="warning">
     <summary>Changes in htmx 4.0</summary>

     htmx 4.0 changed event names significantly when compared with htmx 2.0, making them much more standardized.

     See the full event mapping in the [Changes in htmx 4.0](/migration-guide-htmx-4#event-changes) document.

     **Note:** All events now provide a consistent `ctx` object with request/response information.

     </details>

     The warning variant appears at the very top of doc pages (line 6, right after frontmatter), before any prose content. It needs to be clearly visible even when closed — it's a notice, not secondary content.
     Default variant is the opposite — truly secondary/optional content mid-page.

     What Has Been Tried and Rejected

     1. Full card border (rounded-[3px] border border-neutral-200 overflow-hidden with bg-filled summary header and border-b separator when open). Rejected: too heavy/prominent, competes with surrounding prose
     content. Makes details feel like a primary UI element when they should be secondary.
     2. Left-line only (pl-4 border-l-2 border-l-transparent, becoming visible on open). Rejected: looks terrible. The transparent-to-visible border creates an awkward indentation. The summary text sits
indented
for no apparent visual reason when closed. Doesn't look intentional — looks broken.

     Surrounding CSS Context

     The details block sits inside .prose { } alongside these sibling rules:

     /* Inline code - remove backticks */
     :where(:not(pre) > code):not(:where([class~="not-prose"], [class~="not-prose"] *)) {
         @apply text-neutral-900 dark:text-neutral-100 font-semibold bg-neutral-100 dark:bg-neutral-850 px-1.5 py-0.5 rounded;
         &::before, &::after { content: none; }
     }

     /* Code blocks - macOS window style */
     :where(pre):not(:where([class~="not-prose"], [class~="not-prose"] *)) {
         @apply relative border border-neutral-200 dark:border-neutral-850 rounded-[4px] bg-white dark:bg-neutral-950 shadow-xs overflow-y-hidden;
         code {
             @apply block overflow-x-auto text-xs leading-5 whitespace-pre p-4 pr-12 mask-l-from-97% mask-r-from-95%;
         }
     }

     Constraints

     - Must use @apply with Tailwind utilities
     - Must use the :where(details):not(:where([class~="not-prose"], [class~="not-prose"] *)) selector
     - Use interact: for hover/focus states (not bare hover:)
     - Use dark: for dark mode
     - Keep the CSS concise — no over-engineering
     - The HTML cannot be changed — only CSS. The content is authored in Markdown, so the <details> and <summary> tags are written directly in .md files with no wrapper divs or extra markup available.