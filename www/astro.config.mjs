// @ts-check
import {defineConfig} from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import {codeBlockTransformer} from "./src/lib/shiki-transformers.js";

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

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
                    test: (node) => node.tagName !== 'h1', // Skip h1 headings
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
        // Old site: migration guides (will live under /docs/get-started/)
        "/migration-guide-hotwire-turbo": "/docs/get-started/migration-turbo",
        "/migration-guide-htmx-1": "/docs/get-started/migration-htmx-1",
        "/migration-guide-htmx-4": "/docs/get-started/migration-htmx-4",
        "/migration-guide-htmx-2": "/docs/get-started/migration-htmx-4",
        "/migration-guide-intercooler": "/docs/get-started/migration-intercooler",
        "/htmx-4": "/docs/get-started/migration-htmx-4",
        "/whats-new-in-htmx-4": "/docs/get-started/migration-htmx-4",

        // Old site: simple redirects
        "/events": "/reference/events",
        "/help": "/about",
        "/server-examples": "/about",

        // Old site: /examples/* → /patterns/*
        "/examples": "/patterns",
        // Loading
        "/examples/click-to-load": "/patterns/loading/click-to-load",
        "/examples/infinite-scroll": "/patterns/loading/infinite-scroll",
        "/examples/lazy-load": "/patterns/loading/lazy-load",
        "/examples/progress-bar": "/patterns/loading/progress-bar",
        // Forms
        "/examples/active-search": "/patterns/forms/active-search",
        "/examples/inline-validation": "/patterns/forms/active-validation",
        "/examples/file-upload": "/patterns/forms/file-upload",
        "/examples/file-upload-input": "/patterns/forms/file-upload",
        "/examples/value-select": "/patterns/forms/linked-selects",
        "/examples/reset-user-input": "/patterns/forms/reset-on-submit",
        // Records
        "/examples/bulk-update": "/patterns/records/bulk-actions",
        "/examples/delete-row": "/patterns/records/delete-in-place",
        "/examples/sortable": "/patterns/records/drag-to-reorder",
        "/examples/click-to-edit": "/patterns/records/edit-in-place",
        "/examples/edit-row": "/patterns/records/edit-in-place",
        // Display
        "/examples/animations": "/patterns/display/animations",
        "/examples/dialogs": "/patterns/display/dialogs",
        "/examples/modal-uikit": "/patterns/display/dialogs",
        "/examples/modal-bootstrap": "/patterns/display/dialogs",
        "/examples/modal-custom": "/patterns/display/dialogs",
        "/examples/tabs-hateoas": "/patterns",
        "/examples/tabs-javascript": "/patterns",
        // Advanced
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
                const segments = pathname.split('/').filter(Boolean);

                // Exclude category redirect pages: /{docs|reference|patterns}/{category}
                // These are generated by [category].astro and return 302 redirects.
                if (
                    segments.length === 2 &&
                    ['docs', 'reference', 'patterns'].includes(segments[0])
                ) {
                    return false;
                }

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