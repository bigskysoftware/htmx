import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import GithubSlugger from 'github-slugger';

import { getFolder, COLLECTIONS } from '../lib/content';

/**
 * Strip markdown/HTML to plain text for search indexing
 * @param {string} markdown
 * @returns {string}
 */
function toPlainText(markdown) {
    return markdown
        .replace(/```[\s\S]*?```/g, '')           // Remove code blocks
        .replace(/`([^`]+)`/g, '$1')              // Keep inline code content
        .replace(/<[^>]+>/g, '')                  // Remove HTML tags
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Keep link text
        .replace(/[*_~#]/g, '')                   // Remove markdown formatting
        .replace(/\s+/g, ' ')                     // Normalize whitespace
        .trim();
}

/**
 * Extract H2/H3 sections from markdown for deep linking.
 * @param {string} markdown
 * @returns {Array<{title: string, anchor: string, content: string}>}
 */
function extractSections(markdown) {
    const withoutFrontmatter = markdown.replace(/^---\n[\s\S]*?\n---\n/, '');
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    const matches = [...withoutFrontmatter.matchAll(headingRegex)];
    /** @type {Array<{title: string, anchor: string, content: string}>} */
    const sections = [];

    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const title = match[2].trim();
        const level = match[1].length;
        const anchor = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

        // Get content until next heading of same or higher level
        const startPos = (match.index ?? 0) + match[0].length;
        let endPos = withoutFrontmatter.length;
        for (let j = i + 1; j < matches.length; j++) {
            if (matches[j][1].length <= level) {
                endPos = matches[j].index ?? withoutFrontmatter.length;
                break;
            }
        }

        const content = toPlainText(withoutFrontmatter.slice(startPos, endPos));
        if (content.length > 20) {
            sections.push({title, anchor, content: content.slice(0, 200)});
        }
    }

    return sections;
}


/** @type {import('astro').APIRoute} */
export const GET = async () => {
    /** @type {any[]} */
    const results = [];

    await Promise.all(
        COLLECTIONS.map(async (collectionId) => {
            try {
                const folder = await getFolder(collectionId);
                const files = folder.allFiles;
                const collection = folder.frontmatter.title;

                // Slug as a keyword so "docs" -> "Documentation" etc.
                results.push({
                    id: folder.url,
                    url: folder.url,
                    title: folder.frontmatter.title,
                    description: folder.frontmatter.description || '',
                    keywords: [collectionId, ...(folder.frontmatter.keywords || [])].join(', '),
                    parent: null,
                    collection,
                    breadcrumb: []
                });

                // Explicit aliases for /docs H2 anchors. Covers user phrasings that
                // don't appear in headings or body text (e.g. "back button" -> History).
                const DOCS_ALIASES = {
                    installation: ['install', 'getting started', 'quick start'],
                    boosting: ['boost', 'progressive enhancement'],
                    history: ['back button', 'pushState'],
                    synchronization: ['sync', 'debounce', 'throttle', 'race condition'],
                    'css-transitions': ['fade'],
                    'multi-target-updates': ['oob', 'out of band'],
                    'client-side-scripting': ['javascript', 'hyperscript'],
                    configuration: ['settings', 'meta tag'],
                    debugging: ['debug', 'devtools', 'logAll'],
                    'requests--responses': ['XHR', 'fetch', 'ajax'],
                };

                // Index each H2 in docs.mdx as a search hit; H3s become child hits with the H2 as breadcrumb.
                if (collectionId === 'docs' && folder.path) {
                    const raw = await readFile(join(process.cwd(), 'src', 'content', folder.path), 'utf-8');
                    const body = raw.replace(/^---\n[\s\S]*?\n---\n/, '').replace(/```[\s\S]*?```/g, '');
                    const slugger = new GithubSlugger();
                    const headingRe = /^(#{1,6})[ \t]+(.+?)[ \t]*$/gm;
                    const headings = [...body.matchAll(headingRe)].map(m => ({
                        depth: m[1].length,
                        text: m[2].trim(),
                        lineEnd: (m.index ?? 0) + m[0].length,
                        index: m.index ?? 0,
                        anchor: slugger.slug(m[2].trim().replace(/`/g, '')),
                    }));
                    // children of `h` with depth in (h.depth, maxDepth], stopping
                    // at the next heading of equal-or-shallower depth.
                    const subHeadings = (h, maxDepth) => {
                        const start = headings.indexOf(h) + 1;
                        const out = [];
                        for (let j = start; j < headings.length; j++) {
                            const c = headings[j];
                            if (c.depth <= h.depth) break;
                            if (c.depth <= maxDepth) out.push(c);
                        }
                        return out;
                    };
                    let currentH1 = null, currentH2 = null;
                    for (let i = 0; i < headings.length; i++) {
                        const h = headings[i];
                        if (h.depth > 3) continue;
                        if (h.depth === 1) currentH1 = h.text;
                        if (h.depth === 2) currentH2 = h.text;
                        const next = headings.slice(i + 1).find(n => n.depth <= h.depth);
                        const content = toPlainText(body.slice(h.lineEnd, next?.index ?? body.length)).slice(0, 200);
                        const keywords = h.depth === 1
                            ? subHeadings(h, 2).map(c => c.text).join(', ')
                            : h.depth === 2
                                ? [currentH1, ...(DOCS_ALIASES[h.anchor] || []), ...subHeadings(h, 4).map(c => c.text)].filter(Boolean).join(', ')
                                : '';
                        results.push({
                            id: `/docs#${h.anchor}`,
                            url: `/docs#${h.anchor}`,
                            title: h.text,
                            description: content,
                            keywords,
                            parent: h.depth >= 3 ? currentH2 : null,
                            collection,
                            breadcrumb: h.depth >= 3 ? [currentH2].filter(Boolean) : [],
                        });
                    }
                    return;
                }

                // Add subfolder entries (e.g., Reference > Headers, Docs > Getting Started)
                /** @param {typeof folder} parentFolder */
                const addSubfolders = (parentFolder) => {
                    for (const subfolder of parentFolder.folders) {
                        const breadcrumb = subfolder.breadcrumbs
                            .slice(1, -1)
                            .map(b => b.label);

                        results.push({
                            id: subfolder.url,
                            url: subfolder.url,
                            title: subfolder.frontmatter.title,
                            description: subfolder.frontmatter.description || '',
                            keywords: subfolder.frontmatter.keywords?.join(', ') || '',
                            parent: null,
                            collection,
                            breadcrumb
                        });

                        addSubfolders(subfolder);
                    }
                };
                addSubfolders(folder);

                for (const file of files) {
                    /** @type {Array<{title: string, anchor: string, content: string}>} */
                    let sections = [];
                    const fileId = file.path.startsWith(`${collectionId}/`)
                        ? file.path.replace(`${collectionId}/`, '')
                        : file.path;

                    for (const ext of ['.md', '.mdx']) {
                        try {
                            const path = join(process.cwd(), 'src', 'content', collectionId, fileId + ext);
                            sections = extractSections(await readFile(path, 'utf-8'));
                            break;
                        } catch {}
                    }

                    // Use breadcrumbs from content system (skip first=collection, last=current page)
                    const breadcrumb = file.breadcrumbs
                        .slice(1, -1)
                        .map(b => b.label);

                    const keywords = file.frontmatter.keywords?.join(', ') || '';

                    results.push({
                        id: file.url,
                        url: file.url,
                        title: file.frontmatter.title,
                        description: file.frontmatter.description || '',
                        keywords,
                        parent: null,
                        collection,
                        breadcrumb
                    });

                    for (const section of sections) {
                        results.push({
                            id: `${file.url}#${section.anchor}`,
                            url: `${file.url}#${section.anchor}`,
                            title: section.title,
                            description: section.content,
                            parent: file.frontmatter.title,
                            collection,
                            breadcrumb
                        });
                    }
                }
            } catch (error) {
                console.warn(`Skipping ${collectionId}:`, error);
            }
        })
    );

    return new Response(
        JSON.stringify({results}),
        {status: 200, headers: {'Content-Type': 'application/json'}}
    );
};
