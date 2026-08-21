/**
 * lib/page-nav.js
 *
 * Resolves the left rail for a page. A page declares its rail in frontmatter:
 *
 *   nav: true              derive the rail from this page's headings (default)
 *   nav: false             no rail
 *   nav: docs-nav.html     inject this authored HTML file, adjacent to the page
 *
 * Both modes return one HTML string so the rendered DOM is identical, and one
 * stylesheet covers both. Authored files carry no classes; the rail styles
 * plain `ul`, `li` and `a` by selector.
 */

import {dirname, normalize} from 'node:path';

// Raw nav files. import.meta.glob (not readFileSync) so Vite tracks them and
// an edit triggers HMR. Mirrors the rawSources pattern in content.js.
/** @type {Record<string, string>} */
const navFiles = import.meta.glob('/src/content/**/*.html', {
    query: '?raw',
    import: 'default',
    eager: true,
});

// A one-entry rail is not a table of contents. Raise to 1 to always render.
const MIN_NAV_ITEMS = 2;

const MIN_DEPTH = 2;
const MAX_DEPTH = 3;

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Render headings as a nested list. Depth changes open and close `ul` levels,
 * so CSS indents by nesting rather than by a class per level.
 * @param {{depth: number, slug: string, text: string}[]} items
 */
function renderHeadings(items) {
    const base = Math.min(...items.map(h => h.depth));
    const out = [];
    let level = 0;

    for (const item of items) {
        const target = item.depth - base;

        while (level < target) {
            out.push('<ul>');
            level++;
        }
        while (level > target) {
            out.push('</li></ul>');
            level--;
        }
        if (out.length && out[out.length - 1] !== '<ul>') out.push('</li>');

        out.push(`<li><a href="#${item.slug}">${escapeHtml(item.text)}</a>`);
    }

    while (level >= 0) {
        out.push('</li></ul>');
        level--;
    }

    return '<ul>' + out.join('');
}

/**
 * Every anchor in an authored nav must resolve to a heading on the page.
 * Without this a renamed heading breaks the link silently.
 */
function checkAnchors(html, headings, navPath) {
    const ids = new Set(headings.map(h => h.slug));
    const missing = [];

    for (const match of html.matchAll(/href="#([^"]+)"/g)) {
        if (!ids.has(match[1])) missing.push(match[1]);
    }

    if (missing.length) {
        throw new Error(
            `${navPath} links to ${missing.length} anchor(s) that do not exist ` +
            `on the page: ${missing.join(', ')}. ` +
            `Rename the link or restore the heading.`
        );
    }
}

/**
 * @param {{path: string, frontmatter: Record<string, any>}} page
 * @param {{depth: number, slug: string, text: string}[]} headings
 * @param {boolean} authored - true when the page exported getPageHeadings()
 * @returns {{mode: 'html' | 'headings', html: string} | null}
 */
export function resolvePageNav(page, headings, authored = false) {
    const nav = page.frontmatter?.nav;

    if (nav === false) return null;

    if (typeof nav === 'string') {
        const navPath = normalize(`/src/content/${dirname(page.path)}/${nav}`);
        const html = navFiles[navPath];

        if (html === undefined) {
            throw new Error(
                `${page.path} sets nav: ${nav}, but ${navPath} does not exist. ` +
                `Put the nav file next to the page.`
            );
        }

        checkAnchors(html, headings, navPath);
        return {mode: 'html', html};
    }

    // A generated index page exported its own headings. That is a deliberate
    // nav, so render it whatever its length.
    if (authored && headings.length) {
        return {mode: 'headings', html: renderHeadings(headings)};
    }

    const items = headings.filter(h => h.depth >= MIN_DEPTH && h.depth <= MAX_DEPTH);
    if (items.length < MIN_NAV_ITEMS) return null;

    return {mode: 'headings', html: renderHeadings(items)};
}
