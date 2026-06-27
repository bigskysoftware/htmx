/**
 * Shared category grouping for flat content collections.
 */

export const EXTENSION_CATEGORIES = ['Networking', 'Performance', 'UX', 'Swap behaviors', 'Compatibility', 'Security'];
export const PATTERN_CATEGORIES = ['Loading', 'Forms', 'Records', 'Display', 'Real-time', 'Advanced'];

export function categorySlug(category) {
    return category
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function groupFilesByCategory(files, categories) {
    return categories.map(category => ({
        category,
        slug: categorySlug(category),
        files: files.filter(file => file.frontmatter.category === category),
    })).filter(group => group.files.length > 0);
}

export function buildCategorySidebar(folder, categories) {
    return {
        ...folder,
        files: [],
        folders: groupFilesByCategory(folder.files, categories).map(group => ({
            path: `${folder.path}#${group.slug}`,
            folder: folder.folder,
            slug: group.slug,
            url: `${folder.url}#${group.slug}`,
            frontmatter: {title: group.category},
            breadcrumbs: [],
            files: group.files,
            folders: [],
            allFiles: group.files,
        })),
    };
}
