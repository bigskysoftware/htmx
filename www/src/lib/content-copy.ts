const rawContentModules = import.meta.glob('/src/content/**/*.{md,mdx}', {
    query: '?raw',
    import: 'default',
    eager: true
}) as Record<string, string>;

/**
 * Builds cleaned markdown for the "copy page content" feature.
 * Returns empty string if raw content is not found.
 */
export function buildCopyContent(fileId: string, siteUrl: string): string {
    const raw = rawContentModules[`/src/content/${fileId}`];
    if (!raw) return '';

    // Extract title from frontmatter
    const frontmatterMatch = raw.match(/^---\s*\n([\s\S]*?)\n---/);
    const titleMatch = frontmatterMatch?.[1].match(/^title:\s*(.+)$/m);
    const title = titleMatch?.[1].replace(/^["']|["']$/g, '').trim() || '';

    const cleaned = raw
        .replace(/^---[\s\S]*?---\n*/, '')
        .replace(/<script>[\s\S]*?server\.start[\s\S]*?<\/script>\s*/g, '')
        .replace(/\]\(\//g, `](${siteUrl}/`)
        .trim();
    return title ? `# ${title}\n\n${cleaned}` : cleaned;
}
