// @ts-check
import {defineConfig} from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import {rehypeHeadingIds} from "@astrojs/markdown-remark";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import {rehypeSections} from "./src/lib/rehype-sections.js";
import {remarkCdnVersion} from "./src/lib/remark-cdn-version.js";
import {cdnTokens} from "./src/lib/cdn-tokens.js";
import remarkCodeTabs from "./src/lib/remark-code-tabs.js";
import {codeBlockTransformer, multipartHttpTransformer} from "./src/lib/shiki-transformers.js";
import {readFileSync} from "node:fs";

// Single source of truth for the version shown in CDN/npm snippets.
// Generated from package.json by `npm run update-sha` at release time.
const integrity = JSON.parse(readFileSync("./src/data/integrity.json", "utf8"));

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
        // Force dep re-optimization on every dev start. Avoids the recurring
        // "504 Outdated Optimize Dep" errors that show up after `bun add` /
        // `bun remove` when Vite's hash check misses a lockfile change. Cold
        // start cost ~1-2s; production builds are unaffected.
        optimizeDeps: { force: true },
    },

    markdown: {
        remarkPlugins: [
            [remarkCdnVersion, {tokens: cdnTokens(integrity)}],
            remarkCodeTabs,
        ],
        rehypePlugins: [
            // Assign and collect heading ids before the plugins below run.
            rehypeHeadingIds,
            [
                rehypeAutolinkHeadings,
                {
                    behavior: "wrap",
                    test: (node) => node.tagName !== 'h1',
                },
            ],
            [rehypeSections, {split: 'h2'}], // sticky h2s need containing blocks to unstick naturally
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
            transformers: [multipartHttpTransformer, codeBlockTransformer]
        },
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