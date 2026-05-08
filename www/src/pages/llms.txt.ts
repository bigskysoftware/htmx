import type { APIRoute } from 'astro';
import { getFolder } from '../lib/content';

/**
 * llms.txt — standardized entrypoint for LLM-aware clients.
 * See https://llmstxt.org/ for the convention.
 *
 * Emits a short site blurb followed by a sectioned list of markdown-form
 * pages. Each listed URL resolves to the `.md` endpoint served by
 * pages/[...slug].md.ts.
 */

const SECTIONS = [
    { collection: 'docs', heading: 'Documentation' },
    { collection: 'reference', heading: 'Reference' },
    { collection: 'patterns', heading: 'Patterns' },
    { collection: 'essays', heading: 'Essays' },
    { collection: 'interviews', heading: 'Interviews' },
] as const;

export const GET: APIRoute = async ({ site }) => {
    const origin = site?.origin || 'https://htmx.org';
    const lines: string[] = [];

    lines.push('# htmx');
    lines.push('');
    lines.push('> htmx gives you access to AJAX, CSS Transitions, WebSockets, and Server-Sent Events directly in HTML, using attributes, so you can build modern user interfaces with the simplicity and power of hypermedia.');
    lines.push('');
    lines.push(`The full documentation concatenated into a single file is available at [${origin}/docs/full.md](${origin}/docs/full.md).`);
    lines.push('');

    for (const { collection, heading } of SECTIONS) {
        const folder = await getFolder(collection);
        if (!folder.allFiles.length) continue;
        lines.push(`## ${heading}`);
        lines.push('');
        for (const file of folder.allFiles) {
            // Skip the /docs/full aggregation from the index — it's surfaced
            // separately above. Skip anything flagged hidden in frontmatter.
            if (file.slug === 'full') continue;
            if (file.frontmatter?.hidden) continue;
            const title = file.frontmatter?.title ?? file.slug;
            const desc = file.frontmatter?.description;
            const url = `${origin}${file.url}.md`;
            lines.push(desc ? `- [${title}](${url}): ${desc}` : `- [${title}](${url})`);
        }
        lines.push('');
    }

    return new Response(lines.join('\n'), {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
        },
    });
};
