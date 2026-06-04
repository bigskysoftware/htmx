import {render} from './content';

/**
 * The one-page /docs is authored as a single MDX file. Project its H1/H2
 * outline into the ContentFolder shape so the regular Sidebar can render
 * it; each H2 becomes a virtual file whose `url` is an anchor on /docs.
 *
 * @param {import('./content').ContentFolder} folder
 * @returns {Promise<{ headings: any[]; sidebar: import('./content').ContentFolder }>}
 */
export async function buildDocsSidebar(folder) {
    const {headings} = await render(folder);
    /** @type {import('./content').ContentFolder[]} */
    const sections = [];
    /** @type {import('./content').ContentFolder | null} */
    let section = null;
    for (const h of headings) {
        if (h.depth === 1) {
            section = {path: '', folder: 'docs', slug: '', url: '', frontmatter: {title: h.text}, files: [], folders: [], allFiles: [], breadcrumbs: []};
            sections.push(section);
        } else if (h.depth === 2 && section) {
            section.files.push({
                path: '', folder: 'docs', slug: h.slug,
                url: `/docs#${h.slug}`,
                frontmatter: {title: h.text},
                breadcrumbs: [],
            });
        }
    }
    const allFiles = sections.flatMap(s => s.files);
    return {headings, sidebar: {...folder, folders: sections, files: [], allFiles}};
}
