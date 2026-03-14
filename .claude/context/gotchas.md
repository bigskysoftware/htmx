# Gotchas

Non-obvious behaviors that cause subtle bugs. Read this before working on htmx versioning, the demo system, or morph navigation.

## htmx.js versioning

The website uses the htmx version from `/src/htmx.js`, NOT from npm. Files under `/www/public/js/` are build artifacts, never edit them directly. When htmx event names or APIs change upstream, grep for the old names across the content and public JS files to find everything that needs updating.

## Demo system (pattern pages)

Pattern pages use a service worker to mock a server. Look at any pattern `.md` file to understand how routes are registered and demos are rendered.

## Morph Navigation

The site uses morph-based navigation. This can cause specific interactive elements to work on a normal page load, but break on a morph page navigation.