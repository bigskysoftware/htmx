export function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    if (/^\d{4}$/.test(dateStr)) return dateStr;
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
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
 */
export function slugify(str: string): string {
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

