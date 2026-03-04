# htmx 4.0 Brand Guide

## 1. The Persona
*   **Archetype:** **The Retro-Futurist Rebel.**
*   **Voice:** **"The IKEA Manual for Hackers."** Concise, imperative, code-first.
*   **Keywords:** Hypertext, Stability, Locality of Behavior, Retro-Modern, High-Power.

## 2. Visual Identity
*   **Primary Palette:**
    *   **Classic Blue:** `oklch(0.505 0.1698 264.24)` (matches the classic htmx logo).
    *   **Electric Blue (Dark Mode):** `oklch(0.7262 0.111 251.08)` (Glowing accent).
    *   **Deep Space (Dark Bg):** `oklch(18.1% 0 0)` (Neutral-920). *Deep, perspective-rich grey.*
    *   **Paper White (Light Bg):** `oklch(99.5% 0 0)` (Neutral-25).
*   **Typography:**
    *   **Headings:** `ChicagoFLF` (Pixelated, bold, nostalgic).
    *   **Body:** `Inter` (Clean, modern sans-serif).
    *   **Code:** `JetBrains Mono` (Ligatures allowed).

## 3. UI Principles
*   **Atmosphere:** **"The Grid."**
    *   Use the `SynthwaveEffect` for deep, infinite perspective backgrounds.
    *   **No Noise/Grit.** Keep it clean and digital, not dirty.
*   **Radius:** **Consistent Micro-Rounding.**
    *   All Elements: Very slight rounding (`2px` to `4px`). Never completely sharp, never bubbly.
*   **Depth:** **Glass & Glow.**
    *   Use `backdrop-blur` for sticky elements.
    *   Use colored drop-shadows (Blue) for active states.

## 4. Component Patterns
*   **Omni-Header:** Combined Navigation + Breadcrumbs.
*   **Smart Terminal:**
    *   **Client:** Light, Rendered -> Source.
    *   **Server:** Dark, Polyglot Code.
*   **Buttons:**
    *   Solid fills, distinct borders. "Mechanical" click states.

---

## 5. Hero Section Specification: "The Pulse"

**Concept:** A visualization of the **Hypertext Transfer Protocol** as a physical exchange of energy between two retro-computing terminals.

### Animations (The "Jolts")
1.  **AJAX Request:** Blue Energy packet travels Client -> Server.
2.  **SSE Stream:** Steady, pulsating Blue connection.

---

## 6. Implementation Philosophy (The "No-Build" Mindset)

1.  **Native HTML & CSS:** Use Tailwind for state (`peer-checked`, `group-hover`).
2.  **_hyperscript:** For interactions CSS can't handle.
3.  **Vanilla JS:** Avoid.
# Theme Implementation Guide (v4.0)

This document outlines the technical implementation of the htmx 4.0 "Retro-Futurist" design system.

## 1. Core Layout (`NewLayout.astro`)

The new layout replaces the stacked header approach with a unified **Omni-Header** and a **Context Sidebar**.

### Key Features:
*   **Omni-Header:** Merges global navigation and breadcrumbs. It adapts based on the `section` prop.
*   **Context Sidebar:** Only appears when inside a content section (Docs, Reference, etc.).
*   **Three-Column Grid:** Sidebar (Left) - Content (Center) - ToC (Right).
*   **Background:** Fixed `SynthwaveEffect` layer for perspective depth.

### Usage:
```astro
---
import NewLayout from '../layouts/NewLayout.astro';
---
<NewLayout title="Page Title" section="docs">
  <!-- Content -->
</NewLayout>
```

## 2. Color System

We use a specific subset of the Tailwind/OKLCH palette.

*   **Light Mode Surface:** `bg-neutral-25` (Paper White)
*   **Dark Mode Surface:** `bg-neutral-920` (Deep CRT Grey) - *Not black.*
*   **Primary Brand:** `text-blue-700` (Light) / `text-blue-400` (Dark)
*   **Interactive:** `bg-blue-50` (Light) / `bg-blue-900/20` (Dark)

## 3. Typography Hierarchy

*   **Display:** `ChicagoFLF`
    *   Used for: H1-H6, Navigation Links, Buttons, UI Labels.
    *   *Why?* It provides the "Retro" soul.
*   **Body:** `Inter`
    *   Used for: Long-form text, documentation paragraphs.
    *   *Why?* Max readability.
*   **Code:** `JetBrains Mono`
    *   Used for: Code blocks, path names.

## 4. Component: Smart Terminal

A replacement for standard code blocks that emphasizes the Client/Server relationship.

*   **Client Window:** White/Light Grey background. Shows rendered HTML. Hover reveals source.
*   **Server Window:** Dark/Black background. Shows backend code. Includes a "Language Switcher" (Radio Hack) to toggle Python/Node/Go.

## 5. Visual Effects

*   **Perspective Grid:** A subtle `SynthwaveEffect` component fixed in the background.
*   **Glassmorphism:** Headers and sidebars use `backdrop-blur-md` and `bg-opacity-80` to float above the grid.
*   **Glows:** Subtle blue drop-shadows on active elements (Logo, Links).

## 6. Migration Checklist

To migrate the rest of the site:
1.  [ ] Replace `Layout.astro` imports with `NewLayout.astro`.
2.  [ ] Pass the correct `section="..."` prop to each page.
3.  [ ] Update Markdown/MDX content to use `class="font-chicago"` for custom headers if needed (though global CSS handles H1-H6).
4.  [ ] Replace raw code blocks with `<SmartTerminal>` components (future task).
