# Content Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all missing and incomplete reference pages identified in the March 2026 content audit, and create a deferred backlog for standalone/migration guide pages.

**Architecture:** Each task fetches the official source page from `https://four.htmx.org/`, extracts the relevant content, then writes/updates the local markdown file using our simplified docs structure. No code changes — pure content work. Tasks are grouped so parallel agents can each fetch a batch of related pages together.

**Tech Stack:** Markdown/MDX, Astro content collections, `www-2/src/content/`

**Golden rule:** Never write content from memory. Always fetch the source page first.

---

## Chunk 1: Bucket 1 — Config fixes

### Task 1: Fix `htmx.config` page (factual errors)

**Files:**
- Modify: `www-2/src/content/reference/04-config/01-htmx-config.md`

**Sources to fetch:**
- https://four.htmx.org/reference/#config
- https://four.htmx.org/api/#config

- [ ] **Step 1: Fetch the official config reference**

  Fetch both source URLs above. Note the official list of config keys, their defaults, and any notes.

- [ ] **Step 2: Fix the known errors in `01-htmx-config.md`**

  Issues to fix (verified against audit):
  - `transitions` default is `false`, not `true`
  - `historyReload` is not an official config key — remove it
  - `sse` nested config block is not in the official config table — remove it
  - Add any missing official keys not yet listed

- [ ] **Step 3: Commit**

  ```bash
  git add www-2/src/content/reference/04-config/01-htmx-config.md
  git commit -m "fix: correct htmx.config defaults and remove non-official keys"
  ```

---

### Task 2: Create 6 missing config pages

**Files to create:**
- `www-2/src/content/reference/04-config/20-htmx-config-defaultFocusScroll.md`
- `www-2/src/content/reference/04-config/21-htmx-config-defaultSettleDelay.md`
- `www-2/src/content/reference/04-config/22-htmx-config-inlineScriptNonce.md`
- `www-2/src/content/reference/04-config/23-htmx-config-inlineStyleNonce.md`
- `www-2/src/content/reference/04-config/24-htmx-config-morphScanLimit.md`
- `www-2/src/content/reference/04-config/25-htmx-config-metaCharacter.md`

**Sources to fetch:**
- https://four.htmx.org/reference/#config

- [ ] **Step 1: Fetch the config reference and locate all 6 keys**

  Find the description and defaults for each key in the official source.

- [ ] **Step 2: Create each file following the existing config page pattern**

  Match the format of existing pages (e.g., `09-htmx-config-logAll.md`). Each file needs:
  - frontmatter: `title`, `description`
  - One-sentence description of what the config key does
  - Default value
  - Example showing how to set it
  - Link to `htmx.config` page if relevant

- [ ] **Step 3: Commit**

  ```bash
  git add www-2/src/content/reference/04-config/20-*.md \
          www-2/src/content/reference/04-config/21-*.md \
          www-2/src/content/reference/04-config/22-*.md \
          www-2/src/content/reference/04-config/23-*.md \
          www-2/src/content/reference/04-config/24-*.md \
          www-2/src/content/reference/04-config/25-*.md
  git commit -m "docs: add 6 missing config reference pages"
  ```

---

## Chunk 2: Bucket 1 — Missing stubs

### Task 3: Create 3 missing event pages

**Files to create:**
- `www-2/src/content/reference/03-events/34-htmx-before-response.md`
- `www-2/src/content/reference/03-events/35-htmx-before-settle.md`
- `www-2/src/content/reference/03-events/36-htmx-after-settle.md`

**Sources to fetch:**
- https://four.htmx.org/events/

- [ ] **Step 1: Fetch the events reference and locate all 3 events**

  Find the event descriptions, `detail` properties, and any notes.

- [ ] **Step 2: Create each file following the existing event page pattern**

  Match the format of existing pages (e.g., `02-htmx-before-request.md`). Each file needs:
  - frontmatter: `title`, `description`
  - When it fires
  - Event detail properties
  - Example usage

- [ ] **Step 3: Commit**

  ```bash
  git add www-2/src/content/reference/03-events/34-*.md \
          www-2/src/content/reference/03-events/35-*.md \
          www-2/src/content/reference/03-events/36-*.md
  git commit -m "docs: add missing htmx:before-response, htmx:before-settle, htmx:after-settle events"
  ```

---

### Task 4: Create missing `htmx.swap()` method page

**Files to create:**
- `www-2/src/content/reference/05-methods/13-htmx-swap.md`

**Sources to fetch:**
- https://four.htmx.org/api/#swap

- [ ] **Step 1: Fetch the API reference and locate the `htmx.swap()` entry**

- [ ] **Step 2: Create the file following the existing method page pattern**

  Match the format of existing pages (e.g., `01-htmx-ajax.md`).

- [ ] **Step 3: Commit**

  ```bash
  git add www-2/src/content/reference/05-methods/13-htmx-swap.md
  git commit -m "docs: add missing htmx.swap() method page"
  ```

---

### Task 5: Create deprecated HX-Push header page

**Files to create:**
- `www-2/src/content/reference/02-headers/18-HX-Push.md`

**Sources to fetch:**
- https://four.htmx.org/headers/hx-push/

- [ ] **Step 1: Fetch the deprecated header page**

- [ ] **Step 2: Create a short deprecation notice page**

  Should note this header was replaced by [HX-Push-Url](/reference/headers/hx-push-url), match the format of other header pages.

- [ ] **Step 3: Commit**

  ```bash
  git add www-2/src/content/reference/02-headers/18-HX-Push.md
  git commit -m "docs: add deprecated HX-Push header page"
  ```

---

## Chunk 3: Bucket 2 — Attribute page fixes

### Task 6: Fix `hx-swap` attribute page

**Files:**
- Modify: `www-2/src/content/reference/01-attributes/03-hx-swap.md`

**Sources to fetch:**
- https://four.htmx.org/attributes/hx-swap/

- [ ] **Step 1: Fetch the official hx-swap page**

- [ ] **Step 2: Identify and add missing content**

  Known gaps:
  - `textContent` swap method
  - `settle` modifier (and default settle-delay note)
  - `strip` modifier
  - `upsert` swap method
  - Fix reference: current page says `defaultSwapStyle`, should be `defaultSwap`

- [ ] **Step 3: Commit**

  ```bash
  git add www-2/src/content/reference/01-attributes/03-hx-swap.md
  git commit -m "docs: add missing hx-swap methods and modifiers"
  ```

---

### Task 7: Fix `hx-target` attribute page

**Files:**
- Modify: `www-2/src/content/reference/01-attributes/04-hx-target.md`

**Sources to fetch:**
- https://four.htmx.org/attributes/hx-target/

- [ ] **Step 1: Fetch the official hx-target page**

- [ ] **Step 2: Add missing content**

  Known gaps:
  - `findAll <selector>` — targets all matching descendants
  - Note that `closest` can match the element itself (not just ancestors)

- [ ] **Step 3: Commit**

  ```bash
  git add www-2/src/content/reference/01-attributes/04-hx-target.md
  git commit -m "docs: add findAll and closest-self note to hx-target"
  ```

---

### Task 8: Fix `hx-vals` attribute page

**Files:**
- Modify: `www-2/src/content/reference/01-attributes/32-hx-vals.md`

**Sources to fetch:**
- https://four.htmx.org/attributes/hx-vals/

- [ ] **Step 1: Fetch the official hx-vals page**

- [ ] **Step 2: Add missing content**

  Known gaps:
  - `hx-include` comparison — when to use each
  - `:append` modifier behavior (child replaces parent value unless `:append` is used)
  - Inheritance override rules
  - XSS warning for `js:` / `javascript:` prefix

- [ ] **Step 3: Commit**

  ```bash
  git add www-2/src/content/reference/01-attributes/32-hx-vals.md
  git commit -m "docs: add :append, inheritance, and XSS warning to hx-vals"
  ```

---

## Chunk 4: Bucket 2 — Header page fixes

### Task 9: Fix `HX-Location` header page

**Files:**
- Modify: `www-2/src/content/reference/02-headers/11-HX-Location.md`

**Sources to fetch:**
- https://four.htmx.org/headers/hx-location/

- [ ] **Step 1: Fetch the official HX-Location page**

- [ ] **Step 2: Add missing content**

  Known gaps:
  - Full ajax-context options: `event`, `handler`, `values`, `headers`, `select`
  - Default target is `document.body` when not specified
  - 3xx caveat: "Response headers are not processed on 3xx response codes"

- [ ] **Step 3: Commit**

  ```bash
  git add www-2/src/content/reference/02-headers/11-HX-Location.md
  git commit -m "docs: add ajax-context options, default target, and 3xx caveat to HX-Location"
  ```

---

### Task 10: Fix `HX-Redirect` header page

**Files:**
- Modify: `www-2/src/content/reference/02-headers/12-HX-Redirect.md`

**Sources to fetch:**
- https://four.htmx.org/headers/hx-redirect/

- [ ] **Step 1: Fetch the official HX-Redirect page**

- [ ] **Step 2: Add missing content**

  Known gaps:
  - Guidance: use when redirecting to non-htmx endpoints or pages with different head/script content
  - 3xx caveat: response headers not processed on 3xx responses

- [ ] **Step 3: Commit**

  ```bash
  git add www-2/src/content/reference/02-headers/12-HX-Redirect.md
  git commit -m "docs: add non-htmx-endpoint guidance and 3xx caveat to HX-Redirect"
  ```

---

## Chunk 5: Bucket 2 — Event and method fixes

### Task 11: Fix `htmx:confirm` event page

**Files:**
- Modify: `www-2/src/content/reference/03-events/09-htmx-confirm.md`

**Sources to fetch:**
- https://four.htmx.org/events/#htmx:confirm

- [ ] **Step 1: Fetch the official htmx:confirm event docs**

- [ ] **Step 2: Add missing content**

  Known gaps:
  - Event fires on *every* request trigger, not only elements with `hx-confirm`
  - `dropRequest()` callback is available alongside `issueRequest()`
  - Must call either `issueRequest()` or `dropRequest()`

- [ ] **Step 3: Commit**

  ```bash
  git add www-2/src/content/reference/03-events/09-htmx-confirm.md
  git commit -m "docs: fix htmx:confirm scope and add dropRequest() callback"
  ```

---

### Task 12: Fix `htmx.ajax()` method page

**Files:**
- Modify: `www-2/src/content/reference/05-methods/01-htmx-ajax.md`

**Sources to fetch:**
- https://four.htmx.org/api/#ajax

- [ ] **Step 1: Fetch the official htmx.ajax() docs**

- [ ] **Step 2: Add missing content**

  Known gaps:
  - All overload signatures: `(method, url, element)`, `(method, url, selector)`, `(method, url, context)`
  - Context object fields: `source`, `event`, `handler`, `values`, `headers`, `select`, `selectOOB`, `target`, `swap`
  - Method returns a `Promise`

- [ ] **Step 3: Commit**

  ```bash
  git add www-2/src/content/reference/05-methods/01-htmx-ajax.md
  git commit -m "docs: add overloads, context fields, and Promise return to htmx.ajax()"
  ```

---

## Chunk 6: Bucket 2 — Upgrade guide

### Task 13: Expand the upgrade guide

**Files:**
- Modify: `www-2/src/content/docs/01-get-started/02-upgrade-guide.md`

**Sources to fetch:**
- https://four.htmx.org/migration-guide-htmx-4/

- [ ] **Step 1: Fetch the official migration guide for htmx 4**

- [ ] **Step 2: Identify gaps against the current local upgrade guide**

  Known missing sections:
  - OOB swap order changes
  - Renamed/removed config keys
  - HTTP header changes
  - Removed validation/XHR events
  - New 4.x events list

- [ ] **Step 3: Add missing sections, adapting the content to our tone and structure**

  Keep our simplified, clean approach — don't just paste the official text. Use our existing sections as the backbone and fill in what's genuinely missing.

- [ ] **Step 4: Commit**

  ```bash
  git add www-2/src/content/docs/01-get-started/02-upgrade-guide.md
  git commit -m "docs: expand upgrade guide with missing htmx 4 migration sections"
  ```

---

## Chunk 7: Deferred pages backlog

### Task 14: Create deferred pages TODO document

**Files to create:**
- `docs/superpowers/plans/deferred-pages-backlog.md`

- [ ] **Step 1: Create the backlog document**

  See the deferred pages list below. Create the document listing each page with its official source URL and proposed location in the new structure.

- [ ] **Step 2: Commit**

  ```bash
  git add docs/superpowers/plans/deferred-pages-backlog.md
  git commit -m "docs: create deferred pages backlog"
  ```

---

# Deferred Pages Backlog

The following pages existed on the official htmx 4 site but have no equivalent in `www-2/` yet. They should be created in a follow-up pass after the site launches.

> **For each page:** fetch the source URL, then adapt content to the simplified www-2 style.

## Extension Docs

| Official page | Source URL | Proposed location |
|---|---|---|
| Extensions: Building | https://four.htmx.org/extensions/building/ | `www-2/src/content/docs/06-extensions/11-building.md` |
| Extensions: Migration guide | https://four.htmx.org/extensions/migration-guide/ | `www-2/src/content/docs/06-extensions/12-migration-guide.md` |

## Standalone Guides

| Official page | Source URL | Proposed location |
|---|---|---|
| Morphing | https://four.htmx.org/morphing/ | `www-2/src/content/docs/03-features/10-morphing.md` |
| Server examples | https://four.htmx.org/server-examples/ | `www-2/src/content/docs/09-server-examples/index.md` (new section) |
| What's new in htmx 4 | https://four.htmx.org/whats-new-in-htmx-4/ | `www-2/src/content/docs/01-get-started/03-whats-new.md` |
| Help | https://four.htmx.org/help/ | `www-2/src/content/help/index.md` (new top-level section) |

## Migration Guides

| Official page | Source URL | Proposed location |
|---|---|---|
| From htmx 2 | https://four.htmx.org/migration-guide-htmx-2/ | `www-2/src/content/docs/01-get-started/04-migration-from-htmx-2.md` |
| From Intercooler.js | https://four.htmx.org/migration-guide-intercooler/ | `www-2/src/content/docs/01-get-started/05-migration-from-intercooler.md` |
| From Hotwire/Turbo | https://four.htmx.org/migration-guide-hotwire-turbo/ | `www-2/src/content/docs/01-get-started/06-migration-from-hotwire.md` |

## Patterns

| Official page | Source URL | Proposed location |
|---|---|---|
| Confirm pattern | https://four.htmx.org/patterns/confirm/ | `www-2/src/content/patterns/02-forms/06-confirm.md` |
| Edit row pattern | https://four.htmx.org/patterns/edit-row/ | `www-2/src/content/patterns/03-records/05-edit-row.md` |
| Modal (Bootstrap) | https://four.htmx.org/patterns/modal-bootstrap/ | Consider expanding `04-display/02-dialogs.md` with a Bootstrap section, or create a dedicated page |
| Modal (UIkit) | https://four.htmx.org/patterns/modal-uikit/ | Consider expanding `04-display/02-dialogs.md` with a UIkit section, or create a dedicated page |
| Modal (custom) | https://four.htmx.org/patterns/modal-custom/ | Consider expanding `04-display/02-dialogs.md` with a custom section |
