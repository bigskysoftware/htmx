/**
 * Returns true when `linkHref` matches the current page `pathname` —
 * used to mark nav links as active. Exact match for "/", prefix match otherwise.
 * @param {string} pathname
 * @param {string} [linkHref]
 * @returns {boolean}
 */
export function isCurrentPath(pathname, linkHref) {
    if (!linkHref) return false;
    if (linkHref === '/') return pathname === '/';
    return pathname.startsWith(linkHref);
}

/**
 * Format a date as `Sep 5, 2024` (short) or `September 5, 2024` (long).
 * 4-digit year strings (`"2021"`) are returned as-is.
 * @param {Date|string|null|undefined} value
 * @param {'short'|'long'} [format='short']
 * @returns {string}
 */
export function formatDate(value, format = 'short') {
    if (!value) return '';
    if (typeof value === 'string' && /^\d{4}$/.test(value)) return value;
    const d = value instanceof Date ? value : new Date(value);
    return d.toLocaleDateString('en-US', { month: format, day: 'numeric', year: 'numeric' });
}

/**
 * Converts any string into a URL-safe slug.
 * Handles special characters, whitespace, unicode, file paths, and number prefixes.
 *
 * Examples:
 * - "Alex Petros" → "alex-petros"
 * - "JetBrains" → "jetbrains"
 * - "Stack Overflow" → "stack-overflow"
 * - "02-forms/05-reset-on-submit.md" → "forms/reset-on-submit"
 *
 * @param {string} str
 * @returns {string}
 */
export function slugify(str) {
    return str
        // Remove common file extensions
        .replace(/\.(astro|md|mdx|json|yaml|yml|toml)$/, '')
        // Split by slash for path handling
        .split('/')
        .map(part =>
            part
                // Remove number prefixes like "01-"
                .replace(/^\d+-/, '')
                .toLowerCase()
                .trim()
                // Remove special characters (keep word chars, spaces, hyphens)
                .replace(/[^\w\s-]/g, '')
                // Collapse whitespace/underscores/hyphens to single hyphen
                .replace(/[\s_-]+/g, '-')
                // Remove leading/trailing hyphens
                .replace(/^-+|-+$/g, '')
        )
        .join('/');
}

/**
 * Rewrite root-relative markdown links `](/foo)` to absolute `](origin/foo)`.
 * Used when serving a markdown document from a context where relative links
 * won't resolve (llms.txt consumers, raw `.md` exports).
 *
 * @param {string} markdown
 * @param {string} origin
 * @returns {string}
 */
export function absolutizeRelativeLinks(markdown, origin) {
    return markdown.replace(/\]\(\//g, `](${origin}/`);
}
