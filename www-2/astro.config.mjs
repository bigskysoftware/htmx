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
        "/migration-guide-hotwire-turbo": "/docs/migration/turbo-to-htmx",
        "/migration-guide-htmx-1": "/docs/migration/htmx-1-to-2",
        "/migration-guide-htmx-4": "/docs/migration/htmx-2-to-4",
        "/migration-guide-intercooler": "/docs/migration/intercooler-to-htmx",
        "/htmx-4": "/guides/migration/htmx-2-to-4",
    },

    integrations: [mdx()],

    trailingSlash: "never",
});