// @ts-check
import {defineConfig} from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import {rehypeSections} from "./src/lib/rehype-sections.js";
import {remarkCdnVersion} from "./src/lib/remark-cdn-version.js";
import {codeBlockTransformer} from "./src/lib/shiki-transformers.js";
import {readdirSync, readFileSync} from "node:fs";

// Single source of truth for the version shown in CDN/npm snippets.
// Generated from package.json by `npm run update-sha` at release time.
const {version} = JSON.parse(readFileSync("./src/data/integrity.json", "utf8"));

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

function slugifyPathSegment(value) {
    return value
        .replace(/^\d+-/, '')
        .replace(/\.(md|mdx)$/, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Build category redirects dynamically from folder structure.
// Each category folder (e.g. reference/attributes/) redirects to its first file.
function buildCategoryRedirects() {
    const redirects = {};
    for (const collection of ['reference']) {
        const base = `./src/content/${collection}`;
        let subfolders;
        try { subfolders = readdirSync(base, {withFileTypes: true}).filter(d => d.isDirectory() && d.name !== 'index'); } catch { continue; }
        for (const dir of subfolders.sort((a, b) => a.name.localeCompare(b.name))) {
            const files = readdirSync(`${base}/${dir.name}`).filter(f => /\.(md|mdx)$/.test(f) && !f.startsWith('index')).sort();
            if (files.length === 0) continue;
            const hasIndexFile = readdirSync(`${base}/${dir.name}`).some(f => f === 'index.md' || f === 'index.mdx');
            if (hasIndexFile) continue; // real page exists, no redirect needed
            const catSlug = slugifyPathSegment(dir.name);
            const firstSlug = slugifyPathSegment(files[0]);
            redirects[`/${collection}/${catSlug}`] = `/${collection}/${catSlug}/${firstSlug}`;
        }
    }
    return redirects;
}

function buildPatternRedirects() {
    const redirects = {};
    const base = './src/content/patterns';
    let files;
    try { files = readdirSync(base).filter(f => /\.(md|mdx)$/.test(f) && !f.startsWith('index')); } catch { return redirects; }

    for (const fileName of files) {
        const raw = readFileSync(`${base}/${fileName}`, 'utf8');
        const category = raw.match(/^category:\s*["']?(.+?)["']?\s*$/m)?.[1];
        if (!category) continue;

        const categorySlug = slugifyPathSegment(category);
        const fileSlug = slugifyPathSegment(fileName);
        redirects[`/patterns/${categorySlug}`] = `/patterns#${categorySlug}`;
        redirects[`/patterns/${categorySlug}/${fileSlug}`] = `/patterns/${fileSlug}`;
    }

    return redirects;
}

// https://astro.build/config
export default defineConfig({
    site: "https://four.htmx.org",

    server: {
        host: true,
    },

    vite: {
        plugins: [tailwindcss()],
        // Force dep re-optimization on every dev start. Avoids the recurring
        // "504 Outdated Optimize Dep" errors that show up after `bun add` /
        // `bun remove` when Vite's hash check misses a lockfile change. Cold
        // start cost ~1-2s; production builds are unaffected.
        optimizeDeps: { force: true },
    },

    markdown: {
        remarkPlugins: [
            [remarkCdnVersion, {version}],
        ],
        rehypePlugins: [
            rehypeSlug,
            [rehypeSections, {split: 'h2'}], // /docs sticky h2s need containing blocks to unstick naturally
            [
                rehypeAutolinkHeadings,
                {
                    behavior: "wrap",
                    test: (node) => node.tagName !== 'h1',
                },
            ],
            [
                rehypeExternalLinks,
                {
                    target: "_blank",
                    rel: ["noopener", "noreferrer"],
                },
            ],
        ],
        shikiConfig: {
            theme: "css-variables",
            transformers: [codeBlockTransformer]
        },
    },

    redirects: {
        "/sitemap.xml": "/sitemap-index.xml",

        // Category index redirects (computed from folder structure)
        ...buildCategoryRedirects(),
        ...buildPatternRedirects(),

        // /docs sub-page URLs (htmx 2.x/3.x layout) -> anchors on the new one-page /docs.
        "/docs/get-started": "/docs#installation",
        "/docs/get-started/installation": "/docs#installation",
        "/docs/get-started/migration": "/docs#migration",
        "/docs/core-concepts": "/docs#mental-model",
        "/docs/core-concepts/mental-model": "/docs#mental-model",
        "/docs/core-concepts/hypermedia-controls": "/docs#hypermedia-controls",
        "/docs/core-concepts/requests-and-responses": "/docs#requests--responses",
        "/docs/core-concepts/client-scripting": "/docs#client-side-scripting",
        "/docs/core-concepts/multi-target-updates": "/docs#multi-target-updates",
        "/docs/core-concepts/hcon": "/docs#hcon",
        "/docs/features": "/docs#css-transitions",
        "/docs/features/css-transitions": "/docs#css-transitions",
        "/docs/features/synchronization": "/docs#synchronization",
        "/docs/features/confirmations": "/docs#confirmations",
        "/docs/features/boosting": "/docs#boosting",
        "/docs/features/history": "/docs#history",
        "/docs/features/validation": "/docs#validation",
        "/docs/features/web-components": "/docs#web-components",
        "/docs/features/attribute-inheritance": "/docs#attribute-inheritance",
        "/docs/features/extended-selectors": "/docs#extended-selectors-1",
        "/docs/features/extensions": "/docs#extensions",
        "/docs/security": "/docs#best-practices",
        "/docs/security/best-practices": "/docs#best-practices",
        "/docs/security/caching": "/docs#caching",
        "/docs/troubleshoot": "/docs#debugging",
        "/docs/troubleshoot/debugging": "/docs#debugging",
        "/docs/troubleshoot/configuration": "/docs#configuration",
        "/docs/editors": "/docs#vs-code",
        "/docs/editors/vscode": "/docs#vs-code",
        "/docs/full": "/docs",

        // Old site: migration guides
        // TODO: Create these migration guide pages (content exists on old site):
        //   - /docs/get-started/migration-turbo (from Hotwire Turbo)
        //   - /docs/get-started/migration-htmx-1 (from htmx 1.x)
        //   - /docs/get-started/migration-intercooler (from Intercooler.js)
        "/migration-guide-hotwire-turbo": "/docs/get-started/migration-turbo",
        "/migration-guide-htmx-1": "/docs/get-started/migration-htmx-1",
        "/migration-guide-htmx-2": "/docs/get-started/migration",
        "/migration-guide-htmx-4": "/docs/get-started/migration",
        "/migration-guide-intercooler": "/docs/get-started/migration-intercooler",
        "/htmx-4": "/docs/get-started/migration",
        "/whats-new-in-htmx-4": "/docs/get-started/migration",

        // Old site: simple redirects
        "/discord": "https://htmx.org/discord",
        "/events": "/reference",

        // Reference subcategory URLs now live as anchors on /reference
        "/reference/attributes": "/reference",
        "/reference/headers": "/reference",
        "/reference/events": "/reference",
        "/reference/config": "/reference",
        "/reference/methods": "/reference",
        "/reference/tags": "/reference",
        "/help": "/about",
        "/server-examples": "/about",

        // Old site: /examples/* → /patterns/*
        "/examples": "/patterns",
        "/examples/click-to-load": "/patterns/click-to-load",
        "/examples/infinite-scroll": "/patterns/infinite-scroll",
        "/examples/lazy-load": "/patterns/lazy-load",
        "/examples/progress-bar": "/patterns/progress-bar",
        "/examples/active-search": "/patterns/active-search",
        "/examples/inline-validation": "/patterns/active-validation",
        "/examples/file-upload": "/patterns/file-upload",
        "/examples/file-upload-input": "/patterns/file-upload",
        "/examples/value-select": "/patterns/linked-selects",
        "/examples/reset-user-input": "/patterns/reset-on-submit",
        "/examples/bulk-update": "/patterns/bulk-actions",
        "/examples/delete-row": "/patterns/delete-in-place",
        "/examples/sortable": "/patterns/drag-to-reorder",
        "/examples/click-to-edit": "/patterns/edit-in-place",
        "/examples/edit-row": "/patterns/edit-in-place",
        "/examples/animations": "/patterns/animations",
        "/examples/dialogs": "/patterns/dialogs",
        "/examples/modal-uikit": "/patterns/dialogs",
        "/examples/modal-bootstrap": "/patterns/dialogs",
        "/examples/modal-custom": "/patterns/dialogs",
        "/examples/tabs-hateoas": "/patterns",
        "/examples/tabs-javascript": "/patterns",
        "/examples/keyboard-shortcuts": "/patterns/keyboard-shortcuts",
        "/examples/update-other-content": "/patterns",
        "/examples/confirm": "/patterns",
        "/examples/async-auth": "/patterns",
        "/examples/web-components": "/patterns",
        "/examples/move-before": "/patterns",

        // htmx 2.x extension paths → current /extensions/hx-* slugs.
        "/extensions/sse": "/extensions/hx-sse",
        "/extensions/ws": "/extensions/hx-ws",
        "/extensions/head-support": "/extensions/hx-head",
        "/extensions/preload": "/extensions/hx-preload",
        "/extensions/browser-indicator": "/extensions/hx-browser-indicator",
        "/extensions/alpine-compat": "/extensions/hx-alpine-compat",
        "/extensions/optimistic": "/extensions/hx-optimistic",
        "/extensions/upsert": "/extensions/hx-upsert",
        "/extensions/building": "/docs/features/extensions",

        // /docs/extensions/* paths → current locations.
        "/docs/extensions": "/extensions",
        "/docs/extensions/using-extensions": "/docs/features/extensions",
        "/docs/extensions/extension-migration": "/docs/get-started/migration",
        "/docs/extensions/htmx-2-compat": "/extensions/htmx-2-compat",
        "/docs/extensions/sse": "/extensions/hx-sse",
        "/docs/extensions/ws": "/extensions/hx-ws",
        "/docs/extensions/head-support": "/extensions/hx-head",
        "/docs/extensions/preload": "/extensions/hx-preload",
        "/docs/extensions/optimistic": "/extensions/hx-optimistic",
        "/docs/extensions/download": "/extensions/hx-download",
        "/docs/extensions/upsert": "/extensions/hx-upsert",
        "/docs/extensions/targets": "/extensions/hx-targets",
        "/docs/extensions/ptag": "/extensions/hx-ptag",
        "/docs/extensions/browser-indicator": "/extensions/hx-browser-indicator",
        "/docs/extensions/alpine-compat": "/extensions/hx-alpine-compat",
        "/docs/extensions/history-cache": "/extensions/hx-history-cache",

        // Old site: interviews were under /essays/
        "/essays/interviews/henning-koch": "/interviews/henning-koch",
        "/essays/interviews/makinde-adeagbo": "/interviews/makinde-adeagbo",
        "/essays/interviews/chris-wanstrath": "/interviews/chris-wanstrath",
        "/essays/interviews/mike-amundsen": "/interviews/mike-amundsen",
        "/essays/interviews/leonard-richardson": "/interviews/leonard-richardson",
    },

    integrations: [
        mdx(),
        sitemap({
            filter(page) {
                const { pathname } = new URL(page);

                // Exclude hidden/deprecated pages
                if (pathname === '/reference/headers/HX-Push') {
                    return false;
                }

                return true;
            },
        }),
    ],

    trailingSlash: "never",
});