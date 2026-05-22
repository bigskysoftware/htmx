import type { APIRoute } from 'astro';
import { getFolder, aggregateCollectionMarkdown, fileAsMarkdown } from '../lib/content';
import { absolutizeRelativeLinks } from '../lib/utils';

/**
 * Raw-markdown companion endpoints for every prose page.
 *
 * For each content file at /{collection}/{slug} we also serve the authored
 * markdown at /{collection}/{slug}.md. Consumers: LLM scrapers, the
 * "Copy page content" button, anyone who wants the text form of a page.
 *
 * Scope: only prose collections. Excluded: the homepage, collection root
 * landing pages (which have no authored body of their own), subfolder
 * index pages, and data-driven routes.
 *
 * Generic "full" convention: any file whose slug is `full` (e.g.
 * /docs/full) is treated as a single-page aggregation of its collection.
 * Its `.md` endpoint returns the complete concatenated markdown for that
 * collection, not the raw MDX stub that renders the HTML page.
 */

const MD_COLLECTIONS = ['docs', 'reference', 'patterns', 'essays', 'interviews', 'extensions'] as const;

interface PathProps {
    filePath: string;
    collection: string | null;
}

export async function getStaticPaths() {
    const paths: Array<{ params: { slug: string }; props: PathProps }> = [];

    // Standalone single-page prose: /about
    const about = await getFolder('about');
    if (about.path) {
        paths.push({ params: { slug: 'about' }, props: { filePath: about.path, collection: null } });
    }

    // Every content file across prose collections
    for (const collection of MD_COLLECTIONS) {
        const folder = await getFolder(collection);
        for (const file of folder.allFiles) {
            paths.push({
                params: { slug: `${collection}/${file.slug}` },
                props: { filePath: file.path, collection },
            });
        }
    }

    return paths;
}

export const GET: APIRoute = async ({ params, props, site }) => {
    const { filePath, collection } = props as PathProps;
    const origin = site?.origin || 'https://htmx.org';

    // Any page whose slug is `<collection>/full` gets the aggregated view.
    const isFullPage = !!collection && params.slug === `${collection}/full`;
    const markdown = isFullPage
        ? await aggregateCollectionMarkdown(collection!)
        : fileAsMarkdown(filePath);
    const content = absolutizeRelativeLinks(markdown, origin);

    return new Response(content, {
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
        },
    });
};
