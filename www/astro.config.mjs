// @ts-check
import {defineConfig} from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import {codeBlockTransformer} from "./src/lib/shiki-transformers.js";
import {readdirSync} from "node:fs";

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// Build category redirects dynamically from folder structure.
// Each category folder (e.g. docs/01-get-started/) redirects to its first file.
function buildCategoryRedirects() {
    const redirects = {};
    for (const collection of ['docs', 'reference', 'patterns']) {
        const base = `./src/content/${collection}`;
        let subfolders;
        try { subfolders = readdirSync(base, {withFileTypes: true}).filter(d => d.isDirectory() && d.name !== 'index'); } catch { continue; }
        for (const dir of subfolders.sort((a, b) => a.name.localeCompare(b.name))) {
            const files = readdirSync(`${base}/${dir.name}`).filter(f => /\.(md|mdx)$/.test(f) && !f.startsWith('index')).sort();
            if (files.length === 0) continue;
            const catSlug = dir.name.replace(/^\d+-/, '');
            const firstSlug = files[0].replace(/\.(md|mdx)$/, '').replace(/^\d+-/, '');
            redirects[`/${collection}/${catSlug}`] = `/${collection}/${catSlug}/${firstSlug}`;
        }
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
    },

    markdown: {
        rehypePlugins: [
            rehypeSlug,
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
        "/events": "/reference/events",
        "/help": "/about",
        "/server-examples": "/about",

        // Old site: /examples/* → /patterns/*
        "/examples": "/patterns",
        "/examples/click-to-load": "/patterns/loading/click-to-load",
        "/examples/infinite-scroll": "/patterns/loading/infinite-scroll",
        "/examples/lazy-load": "/patterns/loading/lazy-load",
        "/examples/progress-bar": "/patterns/loading/progress-bar",
        "/examples/active-search": "/patterns/forms/active-search",
        "/examples/inline-validation": "/patterns/forms/active-validation",
        "/examples/file-upload": "/patterns/forms/file-upload",
        "/examples/file-upload-input": "/patterns/forms/file-upload",
        "/examples/value-select": "/patterns/forms/linked-selects",
        "/examples/reset-user-input": "/patterns/forms/reset-on-submit",
        "/examples/bulk-update": "/patterns/records/bulk-actions",
        "/examples/delete-row": "/patterns/records/delete-in-place",
        "/examples/sortable": "/patterns/records/drag-to-reorder",
        "/examples/click-to-edit": "/patterns/records/edit-in-place",
        "/examples/edit-row": "/patterns/records/edit-in-place",
        "/examples/animations": "/patterns/display/animations",
        "/examples/dialogs": "/patterns/display/dialogs",
        "/examples/modal-uikit": "/patterns/display/dialogs",
        "/examples/modal-bootstrap": "/patterns/display/dialogs",
        "/examples/modal-custom": "/patterns/display/dialogs",
        "/examples/tabs-hateoas": "/patterns",
        "/examples/tabs-javascript": "/patterns",
        "/examples/keyboard-shortcuts": "/patterns/advanced/keyboard-shortcuts",
        "/examples/update-other-content": "/patterns",
        "/examples/confirm": "/patterns",
        "/examples/async-auth": "/patterns",
        "/examples/web-components": "/patterns",
        "/examples/move-before": "/patterns",

        // Old site: extensions were top-level
        "/extensions": "/docs/extensions",
        "/extensions/sse": "/docs/extensions/sse",
        "/extensions/ws": "/docs/extensions/ws",
        "/extensions/head-support": "/docs/extensions/head-support",
        "/extensions/preload": "/docs/extensions/preload",
        "/extensions/browser-indicator": "/docs/extensions/browser-indicator",
        "/extensions/alpine-compat": "/docs/extensions/alpine-compat",
        "/extensions/htmx-2-compat": "/docs/extensions/htmx-2-compat",
        "/extensions/optimistic": "/docs/extensions/optimistic",
        "/extensions/upsert": "/docs/extensions/upsert",
        "/extensions/building": "/docs/extensions/overview",

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