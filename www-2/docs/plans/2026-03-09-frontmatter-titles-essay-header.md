# Frontmatter-Driven Titles & Essay Header Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Render page titles from frontmatter `title:` field in the layout (not in markdown content) for all collections, and add an editorial-style metadata header for essays showing author (linked), dates, and tags.

**Architecture:** ContentLayout renders `<h1>` from `frontmatter.title` for all detail pages. A new `EssayHeader.astro` component renders the metadata block (author, dates, tags) below the title, only for the `essays` collection. All `# Title` first lines are removed from markdown files. Author URLs come from `team.yaml` (new `url` field).

**Tech Stack:** Astro components, Tailwind CSS v4, team.yaml content collection

---

### Task 1: Add `url` field to team.yaml

**Files:**
- Modify: `www-2/src/content/team.yaml`
- Modify: `www-2/src/content.config.ts` (add `url` to schema)

**Step 1: Add `url` field to team.yaml entries**

Add a `url` field to team members who are essay authors. Carson Gross's URL is `https://www.cs.montana.edu/users/grug/` (already used in his `content` field on the about page).

```yaml
- name: Carson Gross
  image: /src/assets/img/team/grug.png
  github: bigskysoftware
  url: https://www.cs.montana.edu/users/grug/
  content: |
    An <a href="https://www.cs.montana.edu/users/grug/" target="_blank" rel="noopener noreferrer" class="font-semibold text-blue-600 dark:text-blue-400 hover:underline underline-offset-4 transition">academic</a> with no real-world coding experience.
```

For other team members without a personal URL, leave the field out (it's optional).

**Step 2: Add `url` to team schema in content.config.ts**

```typescript
schema: z.object({
    id: z.string(),
    name: z.string(),
    image: z.string(),
    github: z.string().optional(),
    url: z.string().url().optional(),  // <-- add this
    content: z.string(),
}).passthrough(),
```

**Step 3: Commit**

```bash
git add www-2/src/content/team.yaml www-2/src/content.config.ts
git commit -m "Add url field to team.yaml for author linking"
```

---

### Task 2: Create EssayHeader.astro component

**Files:**
- Create: `www-2/src/components/EssayHeader.astro`

**Step 1: Create the component**

The component receives the essay's frontmatter and renders:
- Author name(s) as links (looked up from team collection) or plain text if not found
- Created date (formatted as "Month Day, Year")
- Modified date (only shown if different from created date, as "Updated Month Day, Year")
- Tag pills linking back to essay index

```astro
---
import { getCollection } from 'astro:content';

interface Props {
    authors?: string[];
    created?: Date;
    modified?: Date;
    tags?: string[];
}

const { authors, created, modified, tags } = Astro.props;

// Look up author URLs from team.yaml
const team = await getCollection('team');
const authorInfo = (authors || []).map(name => {
    const member = team.find(m => m.data.name === name);
    return { name, url: member?.data.url };
});

// Tag display labels (matches EssayList.astro)
const tagLabels: Record<string, string> = {
    'foundations': 'Foundations',
    'why-hypermedia': 'Why Hypermedia',
    'case-studies': 'Case Studies',
    'guides': 'Guides',
    'simplicity': 'Simplicity',
    'meta': 'Meta',
};

const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

const showModified = modified && created &&
    modified.toDateString() !== created.toDateString();
---

<div class="not-prose mb-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500 dark:text-neutral-450">
    {/* Authors */}
    {authorInfo.length > 0 && (
        <span class="flex items-center gap-1">
            {authorInfo.map((author, i) => (
                <>
                    {i > 0 && <span>, </span>}
                    {author.url ? (
                        <a href={author.url}
                           target="_blank"
                           rel="noopener noreferrer"
                           class="font-medium text-neutral-700 dark:text-neutral-300 interact:text-blue-600 dark:interact:text-blue-400 transition underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-700 interact:decoration-blue-400">
                            {author.name}
                        </a>
                    ) : (
                        <span class="font-medium text-neutral-700 dark:text-neutral-300">{author.name}</span>
                    )}
                </>
            ))}
        </span>
    )}

    {/* Separator */}
    {authorInfo.length > 0 && created && (
        <span class="text-neutral-300 dark:text-neutral-700" aria-hidden="true">·</span>
    )}

    {/* Dates */}
    {created && (
        <time datetime={created.toISOString().slice(0, 10)}>
            {formatDate(created)}
        </time>
    )}
    {showModified && (
        <>
            <span class="text-neutral-300 dark:text-neutral-700" aria-hidden="true">·</span>
            <span>
                Updated <time datetime={modified.toISOString().slice(0, 10)}>{formatDate(modified)}</time>
            </span>
        </>
    )}

    {/* Tags */}
    {tags && tags.length > 0 && (
        <>
            <span class="text-neutral-300 dark:text-neutral-700" aria-hidden="true">·</span>
            <span class="flex items-center gap-1.5">
                {tags.map((tag, i) => (
                    <>
                        {i > 0 && <span class="text-neutral-300 dark:text-neutral-700" aria-hidden="true">·</span>}
                        <span class="text-xs">{tagLabels[tag] || tag}</span>
                    </>
                ))}
            </span>
        </>
    )}
</div>
```

Design notes:
- Uses `not-prose` to escape the prose typography styles
- Inline metadata on a single line with dot separators (editorial style)
- Author names are slightly emphasized with `font-medium` and link styling
- Dates use semantic `<time>` elements
- Tags are displayed as text with dot separators (consistent with EssayList)
- Modified date only shown when different from created date
- All colors use the project's neutral palette with dark mode support

**Step 2: Commit**

```bash
git add www-2/src/components/EssayHeader.astro
git commit -m "Add EssayHeader component for essay metadata display"
```

---

### Task 3: Modify ContentLayout to render title from frontmatter

**Files:**
- Modify: `www-2/src/layouts/ContentLayout.astro`

**Step 1: Add EssayHeader import and collection detection**

At the top of the frontmatter script, add:

```astro
import EssayHeader from '../components/EssayHeader.astro';
```

The `collection` variable already exists (line 31). Use it to detect essays:

```typescript
const isEssay = collection === 'essays';
```

**Step 2: Add `<h1>` and EssayHeader to the detail page section**

In the detail page branch (the `else` of the `isIndex` ternary, around line 96-160), replace the `{grouping && ...}` block with:

```astro
{/* Title from frontmatter */}
<h1 set:html={title} />

{/* Essay metadata */}
{isEssay && (
    <EssayHeader
        authors={file.frontmatter.authors}
        created={file.frontmatter.created}
        modified={file.frontmatter.modified}
        tags={file.frontmatter.tags}
    />
)}

{/* Section grouping label (for non-essay nested pages) */}
{!isEssay && grouping && (
    <p class="text-xs font-semibold uppercase tracking-widest text-neutral-550 dark:text-neutral-450 -mt-4 mb-6">
        {grouping.label}
    </p>
)}
```

Note: the grouping label moves AFTER the title and gets a negative top margin to tuck under the `<h1>`. For essays, grouping is not shown (essays are flat, no subcategories).

**Step 3: Commit**

```bash
git add www-2/src/layouts/ContentLayout.astro
git commit -m "Render page titles from frontmatter in ContentLayout"
```

---

### Task 4: Remove `# Title` lines from all markdown files

**Files:**
- Modify: ~170 markdown files across docs/, reference/, essays/ (1 file), and pages/about.mdx

**Step 1: Write and run a script to remove the first `# Title` line from markdown files**

The pattern to remove: the first line after the closing `---` that starts with `# ` (an H1 heading). Some files have a blank line before the `# Title`, some don't. Remove the `# Title` line and any extra blank line it leaves behind.

Use a targeted approach — only remove the `# ` line if it appears as the first content line (within the first 2 lines after frontmatter closing `---`).

```bash
# From www-2/src/content, for each markdown file:
# Find the line number of the second --- (end of frontmatter)
# Check if the next non-empty line starts with "# "
# If so, remove that line
```

A practical approach using a small script:

```bash
cd www-2
node -e "
const fs = require('fs');
const glob = require('glob');
const files = glob.sync('src/content/**/*.{md,mdx}');
let count = 0;
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  // Split on second --- (end of frontmatter)
  const match = content.match(/^(---\n[\s\S]*?\n---\n)\n*(#\s.+\n)\n*/);
  if (match) {
    const newContent = match[1] + '\n' + content.slice(match[0].length);
    fs.writeFileSync(f, newContent);
    count++;
    console.log('Fixed:', f);
  }
}
console.log('Total files modified:', count);
"
```

If glob isn't available, use a find-based approach or iterate manually.

**Step 2: Manually verify a few files**

Check that:
- `docs/01-get-started/01-installation.md` no longer has `# Installation` after frontmatter
- `reference/01-attributes/01-hx-get.md` no longer has `# hx-get` after frontmatter
- `reference/03-events/01-htmx-config-request.md` no longer has `# **\`htmx:config:request\`**`
- `essays/architectural-sympathy.md` no longer has `# Mechanical Sympathy...`
- Essay files without `# Title` (like `vendoring.md`) are unchanged

**Step 3: Build the site and verify no errors**

```bash
cd www-2 && npm run build
```

**Step 4: Commit**

```bash
git add -A www-2/src/content/
git commit -m "Remove H1 title lines from markdown files (now rendered from frontmatter)"
```

---

### Task 5: Visual verification and cleanup

**Step 1: Start dev server and check pages**

```bash
cd www-2 && npm run dev
```

Verify these pages:
- `/essays/vendoring` — should show title "Vendoring", author "Carson Gross" (linked), dates, tags
- `/essays/hypermedia-driven-applications` — should show title, author, created + modified dates
- `/docs/get-started/installation` — should show title "Installation" as `<h1>`, no metadata block
- `/reference/attributes/hx-get` — should show title "hx-get" as `<h1>`
- `/reference/events/htmx-config-request` — should show title as plain text (no bold/code formatting)
- `/reference/methods/htmx-ajax` — should show title as plain text

**Step 2: Fix any visual issues**

Potential issues to watch for:
- Double titles (if any markdown file still has `# Title` AND layout renders one)
- Prose styling on the `<h1>` — it's inside the `<article class="prose">` so it will inherit prose heading styles automatically
- Spacing between title, metadata block, and first content paragraph
- Dark mode colors on the metadata block

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "Fix visual issues from frontmatter title migration"
```
