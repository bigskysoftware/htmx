import {render, readRaw} from './content';

/**
 * Build the /docs sidebar from the raw MDX source.
 *
 * Groups are `<hr data-sidebar-group="Name" />` markers in docs.mdx.
 * Each h2 after a marker belongs to that group until the next marker.
 *
 * @param {import('./content').ContentFolder} folder
 */
export async function buildDocsSidebar(folder) {
    const {headings} = await render(folder);
    const source = readRaw(`/src/content/${folder.path}`);

    const sections = [];
    let section = null;
    const re = /^<hr\s+data-sidebar-group="([^"]*)".*\/>$|^## (.+)$/gm;

    for (let m; (m = re.exec(source));) {
        if (m[1] != null) {
            section = {path: '', folder: 'docs', slug: '', url: '', frontmatter: {title: m[1]}, files: [], folders: [], allFiles: [], breadcrumbs: []};
            sections.push(section);
        } else if (m[2] && section) {
            const heading = headings.find(h => h.depth === 2 && h.text === m[2].trim());
            const slug = heading?.slug ?? m[2].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            section.files.push({
                path: '', folder: 'docs', slug,
                url: `#${slug}`,
                frontmatter: {title: heading?.text ?? m[2].trim()},
                breadcrumbs: [],
            });
        }
    }

    const allFiles = sections.flatMap(s => s.files);
    return {headings, sidebar: {...folder, folders: sections, files: [], allFiles}};
}
