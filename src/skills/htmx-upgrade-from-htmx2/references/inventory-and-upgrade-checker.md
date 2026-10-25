# Inventory and Upgrade Checker

## Instructions for Claude

When helping with an htmx 2 -> 4 upgrade:

1. Search the codebase for all htmx usage: `hx-` attributes, `data-hx-` attributes, `htmx:` event
   listeners, `htmx.` API calls, and server-side `HX-` header handling
2. Identify the scope: how many files, how complex the usage
3. Work through the steps below in order, making changes file by file
4. Run the shipped `upgrade-check` tool first (Step 0) to build the worklist
5. Pay special attention to the hx-disable/hx-ignore rename order (Step 1)
6. For attribute inheritance (Step 3), use codebase analysis to find likely-inherited attributes
   rather than blindly adding `:inherited` everywhere -- see the detailed instructions in that step
7. Check server-side code for header handling changes (often in middleware or base controllers)
8. Check for custom extensions -- these need a full rewrite

## Step 0: Run the Shipped Upgrade Checker

htmx 4 ships a command-line checker. Run it first to scope the work. It prints clickable `file:line`
references with a suggested fix for each hit.

```bash
npx htmx.org@4.0.0 upgrade-check -- ./path/to/project

# add file extensions the scanner does not know
npx htmx.org@4.0.0 upgrade-check --ext .vue ./path/to/project
```

Pin the version to the htmx 4 release you are moving to.

By default it scans `.html`, `.php`, `.js`, `.ts`, `.jinja`, `.jinja2`, `.j2`, `.erb` and `.hbs`.

It flags removed attributes, old event names, inheritance patterns and extension changes. It does not
rewrite anything, so work through the steps below with its output as the worklist.
