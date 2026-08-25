/**
 * Shared category grouping for flat content collections.
 */

export const EXTENSION_CATEGORIES = ['Networking', 'UX', 'Performance', 'Swaps', 'Compatibility', 'Security'];
export const PATTERN_CATEGORIES = ['Loading', 'Forms', 'Records', 'Display', 'Streaming HTML', 'Advanced'];

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
