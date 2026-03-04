# HTMX Website Design Guidelines (www-2)

## Core Philosophy
- **Clean & Minimalist:** Focus on content and readability.
- **Slightly Retro/Mac:** Usage of 'Chicago' font for headings gives a distinct, subtle retro feel, complemented by macOS-style code blocks.
- **High Contrast:** Strict adherence to accessibility and contrast in both light and dark modes.
- **Neutral Dominant:** The interface is primarily neutral grays, with Blue as the primary action/accent color.

## Typography
- **Headings:** `ChicagoFLF` (font-chicago). distinct, retro sans-serif. Used for H1-H6 and buttons.
- **Body:** `Inter` (font-sans). Clean, modern sans-serif.
- **Code:** `JetBrains Mono`, `Menlo`, `Monaco` (font-mono).

## Color System
### Neutrals (Oklch)
- Extensive scale from `neutral-10` (almost white) to `neutral-950` (almost black).
- **Light Mode Background:** `neutral-25` (very light gray/off-white).
- **Dark Mode Background:** `neutral-920` (deep dark gray).
- **Body Text:** `neutral-700` (light) / `neutral-300` (dark).

### Accents
- **Primary Blue:** `blue-600` (light mode) / `blue-400` (dark mode). Used for links and primary actions.
- **Status Colors:**
  - Warning: Yellow
  - Info: Blue

## UI Components

### Cards & Surfaces
- **Light Mode:** White (`bg-white`) or very light gray (`bg-neutral-50`) with subtle borders (`border-neutral-200`).
- **Dark Mode:** Dark gray (`bg-neutral-900` or `bg-neutral-950`) with dark borders (`border-neutral-800` or `border-neutral-850`).
- **Shadows:** Subtle or none. `shadow-xs` used on code blocks.

### Interactive Elements
- **Links:** Underlined (`decoration-[0.125em]`, `underline-offset-[0.25em]`).
- **Hover/Focus:** Use the `interact` variant which combines hover (mouse), focus-visible (keyboard), and active (touch).
- **Buttons:** Often use `font-chicago`.

### Code Blocks
- macOS window style: Top border/header area, rounded corners, `shadow-xs`.
- **Inline Code:** `bg-neutral-100` (light) / `bg-neutral-850` (dark), `text-neutral-900`/`text-neutral-100`, no backticks.

## Layout
- **Spacing:** Generous spacing.
- **Container:** `max-w-[1536px]` generally, `max-w-prose` for text content.
- **Header Height:** `56px` (mobile) / `76px` (desktop).

## Specific Styling Rules
- **Prose:** Custom `prose` utility overrides standard typography plugin.
- **Details/Summary:** Custom styled with specific markers and borders (left border accent).