import type { APIRoute } from 'astro';
import { aggregateCollectionMarkdown } from '../lib/content';
import { absolutizeRelativeLinks } from '../lib/utils';

/**
 * llms-full.txt — the entire docs content as one plain-text blob, for
 * LLM-aware clients that prefer a single fetch over walking individual
 * page URLs. Identical output to /docs/full.md, served under the
 * llms.txt-adjacent conventional path.
 */

export const GET: APIRoute = async ({ site }) => {
    const origin = site?.origin || 'https://htmx.org';
    const content = absolutizeRelativeLinks(await aggregateCollectionMarkdown('docs'), origin);
    return new Response(content, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
        },
    });
};
