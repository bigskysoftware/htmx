// @ts-check
import {defineConfig} from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import {codeBlockTransformer} from "./src/lib/shiki-transformers.js";

import mdx from "@astrojs/mdx";

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
        "/examples": "/patterns",

        // Old site: flat /patterns/* → nested /patterns/*
        "/patterns/active-search": "/patterns/forms/active-search",
        "/patterns/active-validation": "/patterns/forms/active-validation",
        "/patterns/file-upload": "/patterns/forms/file-upload",
        "/patterns/linked-selects": "/patterns/forms/linked-selects",
        "/patterns/reset-on-submit": "/patterns/forms/reset-on-submit",
        "/patterns/click-to-load": "/patterns/loading/click-to-load",
        "/patterns/infinite-scroll": "/patterns/loading/infinite-scroll",
        "/patterns/lazy-load": "/patterns/loading/lazy-load",
        "/patterns/progress-bar": "/patterns/loading/progress-bar",
        "/patterns/bulk-actions": "/patterns/records/bulk-actions",
        "/patterns/delete-in-place": "/patterns/records/delete-in-place",
        "/patterns/drag-to-reorder": "/patterns/records/drag-to-reorder",
        "/patterns/edit-in-place": "/patterns/records/edit-in-place",
        "/patterns/animations": "/patterns/display/animations",
        "/patterns/dialogs": "/patterns/display/dialogs",
        "/patterns/tabs": "/patterns/display/tabs",
        "/patterns/keyboard-shortcuts": "/patterns/advanced/keyboard-shortcuts",
        "/patterns/update-other-content": "/patterns/advanced/update-other-content",
        "/patterns/confirm": "/patterns/display/dialogs",
        "/patterns/modal-bootstrap": "/patterns/display/dialogs",
        "/patterns/modal-custom": "/patterns/display/dialogs",
        "/patterns/modal-uikit": "/patterns/display/dialogs",
        "/patterns/edit-row": "/patterns/records/edit-in-place",

        // Old site: interviews were under /essays/
        "/essays/interviews/henning-koch": "/interviews/henning-koch",
        "/essays/interviews/makinde-adeagbo": "/interviews/makinde-adeagbo",
        "/essays/interviews/chris-wanstrath": "/interviews/chris-wanstrath",
        "/essays/interviews/mike-amundsen": "/interviews/mike-amundsen",
        "/essays/interviews/leonard-richardson": "/interviews/leonard-richardson",
    },

    integrations: [mdx()],

    trailingSlash: "never",
});