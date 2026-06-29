/**
 * lib/feed.js
 *
 * Builds a unified Feed instance (essays + interviews) used by both
 * /atom.xml and /rss.xml endpoints. One source of truth, two output
 * formats — RSS 2.0 and Atom 1.0 stay in lockstep.
 *
 * Content pipeline:
 *   raw .md/.mdx body
 *     → remark-parse + remark-mdx          (parse Markdown + JSX nodes)
 *     → strip MDX import/export/JSX nodes  (feeds can't run JSX)
 *     → remark-rehype                      (MDAST → HAST)
 *     → absolutize relative href/src       (feed readers need absolute URLs)
 *     → rehype-stringify                   (HAST → HTML)
 *
 * The old htmx.org Zola site emitted /atom.xml with full essay HTML; we
 * preserve that subscriber experience.
 */

import { Feed } from 'feed';
import rehypeStringify from 'rehype-stringify';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

import { fileAsMarkdown, getFolder } from './content';

/** Collections surfaced in the feed, ordered by appearance only — final sort is by date. */
const FEED_COLLECTIONS = ['essays', 'interviews'];

const FEED_TITLE       = '</> htmx - high power tools for html';
const FEED_DESCRIPTION = 'Essays and interviews from the htmx project.';
const FEED_LANGUAGE    = 'en';

/**
 * remark plugin: drop MDX-specific AST nodes that don't belong in feeds
 * (ES imports/exports, JSX elements). Feeds are static HTML; MDX components
 * can't render in a feed reader.
 */
function remarkStripMdxNodes() {
    /** @param {any} tree */
    return (tree) => {
        if (!Array.isArray(tree.children)) return;
        const drop = new Set(['mdxjsEsm', 'mdxJsxFlowElement', 'mdxJsxTextElement', 'mdxFlowExpression', 'mdxTextExpression']);
        /** @param {any} node */
        const walk = (node) => {
            if (Array.isArray(node.children)) {
                node.children = node.children.filter(/** @param {any} c */ (c) => !drop.has(c.type));
                node.children.forEach(walk);
            }
        };
        walk(tree);
    };
}

/**
 * rehype plugin: rewrite root-relative `href` / `src` attributes to absolute
 * URLs anchored at the site origin. Feed readers don't know our domain, so
 * `/img/foo.png` would 404 inside a reader.
 *
 * @param {string} origin - Site origin, no trailing slash.
 */
function rehypeAbsoluteUrls(origin) {
    // Rewrite root-relative URLs inside raw HTML strings (preserved by
    // `allowDangerousHtml`). Handles single- and double-quoted attributes.
    const rawRe = /\b(href|src)=("|')(\/[^/][^"']*?)\2/g;
    /** @param {any} tree */
    return (tree) => {
        /** @param {any} node */
        const walk = (node) => {
            if (node.type === 'element' && node.properties) {
                for (const attr of ['href', 'src']) {
                    const v = node.properties[attr];
                    if (typeof v === 'string' && v.startsWith('/') && !v.startsWith('//')) {
                        node.properties[attr] = origin + v;
                    }
                }
            } else if (node.type === 'raw' && typeof node.value === 'string') {
                node.value = node.value.replace(rawRe, (_m, attr, q, path) => `${attr}=${q}${origin}${path}${q}`);
            }
            if (Array.isArray(node.children)) node.children.forEach(walk);
        };
        walk(tree);
    };
}

/**
 * Convert a Markdown or MDX body to feed-ready HTML. Only `.mdx` sources go
 * through `remark-mdx`; plain `.md` content can contain raw HTML fragments
 * that the MDX parser rejects (e.g. unclosed tags inside code prose).
 *
 * @param {string} markdown
 * @param {string} origin
 * @param {boolean} isMdx
 * @returns {Promise<string>}
 */
async function markdownToHtml(markdown, origin, isMdx) {
    let processor = unified().use(remarkParse);
    if (isMdx) processor = processor.use(remarkMdx).use(remarkStripMdxNodes);
    processor = processor
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(() => rehypeAbsoluteUrls(origin))
        .use(rehypeStringify, { allowDangerousHtml: true });
    const result = await processor.process(markdown);
    return String(result);
}

/** `fileAsMarkdown` prepends `# <title>`; feeds carry the title separately so we strip it. */
function stripTitlePrefix(md) {
    return md.replace(/^# [^\n]*\n+/, '');
}

/**
 * Build a `feed` package Feed instance covering all feed-eligible content.
 * Caller invokes `.atom1()` or `.rss2()` to serialize.
 *
 * @param {URL | undefined} site - Astro context.site (origin trusted source).
 * @returns {Promise<Feed>}
 */
export async function buildFeed(site) {
    const origin = (site?.href ?? 'https://htmx.org/').replace(/\/$/, '');

    const feed = new Feed({
        title: FEED_TITLE,
        description: FEED_DESCRIPTION,
        id: `${origin}/`,
        link: `${origin}/`,
        language: FEED_LANGUAGE,
        feedLinks: {
            atom: `${origin}/atom.xml`,
            rss:  `${origin}/rss.xml`,
        },
        copyright: '',
    });

    /** @type {Array<{ file: any, published: Date, updated: Date }>} */
    const entries = [];
    for (const collection of FEED_COLLECTIONS) {
        const folder = await getFolder(collection);
        for (const file of folder.allFiles) {
            const fm = file.frontmatter;
            if (!fm.created) continue;
            entries.push({
                file,
                published: new Date(fm.created),
                updated:   fm.modified ? new Date(fm.modified) : new Date(fm.created),
            });
        }
    }
    entries.sort((a, b) => b.published.getTime() - a.published.getTime());

    for (const { file, published, updated } of entries) {
        const body = stripTitlePrefix(fileAsMarkdown(file.path));
        const isMdx = file.path.endsWith('.mdx');
        const content = await markdownToHtml(body, origin, isMdx);
        const link = `${origin}${file.url}`;

        feed.addItem({
            title: file.frontmatter.title,
            id: link,
            link,
            description: file.frontmatter.description ?? '',
            content,
            date: updated,
            published,
            author: (file.frontmatter.authors ?? []).map(/** @param {string} name */ (name) => ({ name })),
            category: (file.frontmatter.tags ?? []).map(/** @param {string} name */ (name) => ({ name })),
        });
    }

    return feed;
}
