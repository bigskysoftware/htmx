import type {APIRoute} from 'astro';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

import {getFolder, COLLECTIONS} from '../lib/content';

/**
 * Strip markdown/HTML to plain text for search indexing
 */
function toPlainText(markdown: string): string {
    return markdown
        .replace(/```[\s\S]*?```/g, '')           // Remove code blocks
        .replace(/`([^`]+)`/g, '$1')              // Keep inline code content
        .replace(/<[^>]+>/g, '')                  // Remove HTML tags
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Keep link text
        .replace(/[*_~#]/g, '')                   // Remove markdown formatting
        .replace(/\s+/g, ' ')                     // Normalize whitespace
        .trim();
}

/**
 * Extract H2/H3 sections from markdown for deep linking
 */
function extractSections(markdown: string): Array<{title: string, anchor: string, content: string}> {
    const withoutFrontmatter = markdown.replace(/^---\n[\s\S]*?\n---\n/, '');
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    const matches = [...withoutFrontmatter.matchAll(headingRegex)];
    const sections: Array<{title: string, anchor: string, content: string}> = [];

    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const title = match[2].trim();
        const level = match[1].length;
        const anchor = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

        // Get content until next heading of same or higher level
        const startPos = match.index! + match[0].length;
        let endPos = withoutFrontmatter.length;
        for (let j = i + 1; j < matches.length; j++) {
            if (matches[j][1].length <= level) {
                endPos = matches[j].index!;
                break;
            }
        }

        const content = toPlainText(withoutFrontmatter.slice(startPos, endPos));
        if (content.length > 20) {
            sections.push({title, anchor, content: content.slice(0, 200)});
        }
    }

    return sections;
}



export const GET: APIRoute = async () => {
    const results: any[] = [];

    await Promise.all(
        COLLECTIONS.map(async (collectionId) => {
            try {
                const folder = await getFolder(collectionId);
                const files = folder.allFiles;
                const collection = folder.frontmatter.title;

                // Add the collection index page itself
                results.push({
                    id: folder.url,
                    url: folder.url,
                    title: folder.frontmatter.title,
                    description: folder.frontmatter.description || '',
                    keywords: folder.frontmatter.keywords?.join(', ') || '',
                    parent: null,
                    collection,
                    breadcrumb: []
                });

                // Add subfolder entries (e.g., Reference > Headers, Docs > Getting Started)
                const addSubfolders = (parentFolder: typeof folder) => {
                    for (const subfolder of parentFolder.subfolders) {
                        const breadcrumb = subfolder.breadcrumbs
                            .slice(1, -1)
                            .map(b => b.label);

                        results.push({
                            id: subfolder.url,
                            url: subfolder.url,
                            title: subfolder.frontmatter.title,
                            description: subfolder.frontmatter.description || '',
                            keywords: subfolder.frontmatter.keywords?.join(', ') || '',
                            parent: null,
                            collection,
                            breadcrumb
                        });

                        addSubfolders(subfolder);
                    }
                };
                addSubfolders(folder);

                for (const file of files) {
                    let sections: Array<{title: string, anchor: string, content: string}> = [];
                    const fileId = file.id.startsWith(`${collectionId}/`)
                        ? file.id.replace(`${collectionId}/`, '')
                        : file.id;

                    for (const ext of ['.md', '.mdx']) {
                        try {
                            const path = join(process.cwd(), 'src', 'content', collectionId, fileId + ext);
                            sections = extractSections(await readFile(path, 'utf-8'));
                            break;
                        } catch {}
                    }

                    // Use breadcrumbs from content system (skip first=collection, last=current page)
                    const breadcrumb = file.breadcrumbs
                        .slice(1, -1)
                        .map(b => b.label);

                    const keywords = file.frontmatter.keywords?.join(', ') || '';

                    results.push({
                        id: file.url,
                        url: file.url,
                        title: file.frontmatter.title,
                        description: file.frontmatter.description || '',
                        keywords,
                        parent: null,
                        collection,
                        breadcrumb
                    });

                    for (const section of sections) {
                        results.push({
                            id: `${file.url}#${section.anchor}`,
                            url: `${file.url}#${section.anchor}`,
                            title: section.title,
                            description: section.content,
                            parent: file.frontmatter.title,
                            collection,
                            breadcrumb
                        });
                    }
                }
            } catch (error) {
                console.warn(`Skipping ${collectionId}:`, error);
            }
        })
    );

    return new Response(
        JSON.stringify({results}),
        {status: 200, headers: {'Content-Type': 'application/json'}}
    );
};
