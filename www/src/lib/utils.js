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
    // Frontmatter dates are date-only, so they parse as UTC midnight. Without
    // this the site renders the previous day in any timezone west of UTC.
    return d.toLocaleDateString('en-US', { month: format, day: 'numeric', year: 'numeric', timeZone: 'UTC' });
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
