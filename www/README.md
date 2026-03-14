# htmx Documentation Website

The htmx documentation site, built with [Astro](https://astro.build/) and [Tailwind CSS](https://tailwindcss.com/).

## Development

From the repo root:

```bash
npm run site    # or: npm run www
```

Or from this directory:

```bash
bun install
bun run dev
```

The dev server starts at `http://localhost:4321`. The `predev` script syncs `../dist/` into `public/js/` automatically.

## Building

```bash
bun run build
bun run preview   # preview the production build
```

## Testing

End-to-end tests use [Playwright](https://playwright.dev/):

```bash
bun run test          # headless
bun run test:headed   # with browser window
bun run test:ui       # interactive UI mode
```

## Structure

```
src/
  content/        # Markdown content (docs, reference, patterns)
  components/     # Astro components
  layouts/        # Page layouts
  pages/          # Route pages
  lib/            # Utilities and helpers
  assets/         # Images and static assets
public/
  js/             # htmx build artifacts (synced from ../dist/)
```
