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

        // TODO: redirect htmx.org/examples/* to their new /patterns/* locations
        // e.g. /examples/click-to-edit → /patterns/records/edit-in-place
        //      /examples/bulk-update → /patterns/records/bulk-actions
        //      /examples/active-search → /patterns/forms/active-search
        //      etc.
        "/examples": "/patterns",

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

    integrations: [mdx()],

    trailingSlash: "never",
});