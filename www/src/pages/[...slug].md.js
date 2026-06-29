import { getFolder, fileAsMarkdown } from '../lib/content';
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
 */

const MD_COLLECTIONS = ['reference', 'patterns', 'essays', 'interviews', 'extensions'];
const STANDALONE_PAGES = ['about', 'docs'];

/**
 * @typedef {Object} PathProps
 * @property {string} filePath
 */

export async function getStaticPaths() {
    /** @type {Array<{ params: { slug: string }; props: PathProps }>} */
    const paths = [];

    for (const slug of STANDALONE_PAGES) {
        const folder = await getFolder(slug);
        if (folder.path) {
            paths.push({ params: { slug }, props: { filePath: folder.path } });
        }
    }

    for (const collection of MD_COLLECTIONS) {
        const folder = await getFolder(collection);
        for (const file of folder.allFiles) {
            paths.push({
                params: { slug: `${collection}/${file.slug}` },
                props: { filePath: file.path },
            });
        }
    }

    return paths;
}

/** @type {import('astro').APIRoute} */
export const GET = async ({ props, site }) => {
    const { filePath } = /** @type {PathProps} */ (props);
    const origin = site?.origin || 'https://htmx.org';
    const content = absolutizeRelativeLinks(fileAsMarkdown(filePath), origin);

    return new Response(content, {
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
        },
    });
};
