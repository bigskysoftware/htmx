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

/**
 * Shift the depth of every ATX heading in a markdown string by `shift` levels,
 * capped at H6. Fence-aware: does not touch `#` lines inside ```/~~~ code blocks.
 *
 * Used when composing a page out of several standalone documents — each
 * authored document keeps its own heading tree, and the composer nests that
 * tree under new parent headings.
 */
export function shiftHeadings(markdown: string, shift: number): string {
    if (shift <= 0) return markdown;
    const lines = markdown.split('\n');
    let fence: string | null = null;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const fenceMatch = line.match(/^(`{3,}|~{3,})/);
        if (fenceMatch) {
            if (fence === null) fence = fenceMatch[1][0];
            else if (line.startsWith(fence)) fence = null;
            continue;
        }
        if (fence) continue;
        const h = line.match(/^(#{1,6})(\s)/);
        if (h) {
            const newDepth = Math.min(6, h[1].length + shift);
            lines[i] = '#'.repeat(newDepth) + h[2] + line.slice(h[0].length);
        }
    }
    return lines.join('\n');
}

/**
 * Rewrite root-relative markdown links `](/foo)` to absolute `](origin/foo)`.
 * Used when serving a markdown document from a context where relative links
 * won't resolve (llms.txt consumers, raw `.md` exports).
 */
export function absolutizeRelativeLinks(markdown: string, origin: string): string {
    return markdown.replace(/\]\(\//g, `](${origin}/`);
}

