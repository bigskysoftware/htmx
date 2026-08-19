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
import {readdirSync, readFileSync} from "node:fs";

// Single source of truth for the version shown in CDN/npm snippets.
// Generated from package.json by `npm run update-sha` at release time.
const integrity = JSON.parse(readFileSync("./src/data/integrity.json", "utf8"));

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

    redirects: {
        // This site's own URL changes. Redirects from the htmx 2.x site
        // (htmx.org) live in public/_redirects instead.

        "/sitemap.xml": "/sitemap-index.xml",
        "/help": "/about",

        // Category index redirects (computed from folder structure)
        ...buildCategoryRedirects(),
        ...buildPatternRedirects(),

        // Names floated for the 4.0 release notes before they had a home.
        "/migration-guide-htmx-2": "/docs#migration-from-htmx-2x",
        "/migration-guide-htmx-4": "/docs#migration-from-htmx-2x",
        "/htmx-4": "/docs#migration-from-htmx-2x",
        "/whats-new-in-htmx-4": "/docs#migration-from-htmx-2x",

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