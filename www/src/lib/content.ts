import {slugify} from './utils';

/**
 * lib/content.ts
 *
 * Clean primitives for working with content files and folders.
 *
 * This module provides a simple API for accessing content from src/content/
 * without being tied to Astro's Content Collections API. Validation still
 * happens via content.config.ts, but we read files directly from the filesystem.
 *
 * MAPPING:
 * 1. Filesystem Folder + _index.md -> ContentFolder
 * 2. Regular .md/.mdx file         -> ContentFile
 * 3. Folders can be nested recursively
 *
 * API:
 * - getFolder(path) -> ContentFolder (tree with .allFiles getter for flat list)
 * - getFile(path) -> ContentFile | null (single file)
 */

// Import all content files from src/content/
const contentModules = import.meta.glob('/src/content/**/*.{md,mdx}', {eager: true});

// ⚠️ KNOWN LIMITATION: content index files cannot call getFolder/getFile at module init time.
//
// This glob eagerly imports every content file, including collection index files (e.g.
// patterns/index.mdx). If one of those index files calls getFolder() in its module scope
// (i.e. via `export const x = await getFolder(...)`), it triggers a "Cannot access
// 'contentModules' before initialization" ReferenceError — because the eager glob is still
// resolving when the index file's module body runs, creating a circular init dependency.
//
// The workaround used in patterns/index.mdx (and essays/index.mdx) is to call
// getCollection() from 'astro:content' directly instead. But this defeats the whole point
// of content.ts, which was to provide a single abstraction so we never have to touch the
// Astro content collection API directly (which has an awkward interface).
//
// TODO: Resolve this properly. Options:
//   1. Make the glob lazy (remove `eager: true`) and dynamically import on demand —
//      but this changes the async model throughout and may have perf/SSG implications.
//   2. Split the glob into two: one for index files (used by getFolder) and one for
//      regular files, so index files don't re-import themselves.
//   3. Accept that content index files are a special case and provide a thin wrapper
//      around getCollection() in this file (e.g. `getCollectionItems`) so at least
//      all content access goes through content.ts even if the implementation differs.
//   4. Move away from eager glob entirely and lean into Astro's content collection API,
//      wrapping it here with a nicer interface.
//
// The worst outcome is the current state: some pages use content.ts and some call
// getCollection() directly — that's two systems to understand and keep in sync.
//
// Additional MDX constraint: in .mdx files, block-body arrow functions (=> { ... })
// inside other expressions (e.g. .map() arguments) fail to parse. Only top-level
// export const declarations can use block bodies. Expression-body arrows (=> expr)
// must be used everywhere else. This further limits what can be done in .mdx content files.

export interface Breadcrumb {
    label: string;
    href?: string;
}

export interface ContentFile {
    // File path relative to src/content/ (with numeric prefixes and extension)
    // Example: "docs/01-get-started/01-installation.md"
    id: string;

    // Base folder name (first segment of path)
    // Example: "docs", "reference", "pages"
    folder: string;

    // Clean URL slug (relative to folder, no numeric prefixes, no extension)
    // Example: "getting-started/installation"
    slug: string;

    // Full URL path
    // Example: "/docs/getting-started/installation"
    readonly url: string;

    // Frontmatter data from the file
    frontmatter: Record<string, any>;

    // Render the markdown content
    render: () => Promise<{ Content: any; headings: any[] }>;

    // Pre-computed breadcrumbs for this file
    readonly breadcrumbs: Breadcrumb[];

    // Navigation links to previous/next files in the collection
    prev?: ContentFile;
    next?: ContentFile;
}

export interface ContentFolder {
    // Folder path with _index (with numeric prefixes)
    // Example: "docs/01-get-started/_index.md"
    id: string;

    // Base folder name
    // Example: "docs", "reference"
    folder: string;

    // Clean URL slug (relative to folder, no numeric prefixes)
    // Example: "getting-started" or "" for root
    slug: string;

    // Full URL path
    // Example: "/docs/getting-started" or "/docs" for root
    readonly url: string;

    // Frontmatter from _index.md file
    frontmatter: Record<string, any>;

    // Tree structure
    subfiles: ContentFile[];
    subfolders: ContentFolder[];

    // Flattened list of all files (includes hidden — for routing; hidden excluded from prev/next)
    readonly allFiles: ContentFile[];

    // Render the _index.md content
    render: () => Promise<{ Content: any; headings: any[] }>;

    // Pre-computed breadcrumbs for this folder
    readonly breadcrumbs: Breadcrumb[];
}

/**
 * Helper to extract folder path from a file path
 */
function getFolderName(path: string): string {
    return path.split('/')[0];
}

/**
 * Helper to remove numeric prefixes and extension from path
 */
function cleanPath(path: string): string {
    return path
        .split('/')
        .map(segment => segment.replace(/^\d+-/, '').replace(/\.(md|mdx)$/, ''))
        .join('/');
}

/**
 * Sort content files by created date (newest first), falling back to path sort.
 */
function sortContentFiles(a: ContentFile, b: ContentFile): number {
    const aCreated = a.frontmatter?.created;
    const bCreated = b.frontmatter?.created;
    if (aCreated && bCreated) {
        return new Date(bCreated).getTime() - new Date(aCreated).getTime();
    }
    return a.id.localeCompare(b.id);
}

/** All content collections, in routing order. Single source of truth for the router and search index. */
export const COLLECTIONS = ['home', 'about', 'docs', 'reference', 'patterns', 'essays', 'interviews', 'podcasts', 'memes'] as const;

/**
 * Get content folder tree.
 *
 * @param path - Folder path (e.g., 'docs', 'reference/attributes')
 * @returns ContentFolder representing the folder with nested structure
 */
export async function getFolder(path: string): Promise<ContentFolder> {
    // Handle root-level .mdx files (e.g. content/index.mdx → 'home', content/about.mdx → 'about')
    // These are single-page "collections" that don't have a folder — just a file at the content root.
    const rootFileMap: Record<string, string> = { home: 'index' };
    const rootFileName = rootFileMap[path] ?? path;
    const rootMod = contentModules[`/src/content/${rootFileName}.mdx`] as any
        ?? contentModules[`/src/content/${rootFileName}.md`] as any;

    if (rootMod && !contentModules[`/src/content/${path}/index.mdx`] && !contentModules[`/src/content/${path}/index.md`]) {
        const isHome = path === 'home';
        return {
            id: `${rootFileName}.mdx`, folder: path, slug: '',
            get url() { return isHome ? '/' : `/${path}`; },
            frontmatter: rootMod.frontmatter,
            subfiles: [], subfolders: [],
            get allFiles() { return []; },
            render: async () => ({ Content: rootMod.default, headings: rootMod.getHeadings?.() || [] }),
            breadcrumbs: []
        };
    }

    const folderName = path.split('/')[0];

    // Get all modules for this folder
    const modules = Object.entries(contentModules).filter(([filePath]) => {
        const relativePath = filePath.replace('/src/content/', '');
        return relativePath.startsWith(folderName + '/');
    });

    // Build the folder structure
    const buildFolder = (basePath: string, parentBreadcrumbs: Breadcrumb[] = []): ContentFolder | null => {
        const indexPath = basePath ? `${basePath}/index` : `${folderName}/index`;

        // Find the index file (try .md and .mdx)
        const indexModule = modules.find(([filePath]) => {
            const relativePath = filePath.replace('/src/content/', '').replace(/\.(md|mdx)$/, '');
            return relativePath === indexPath;
        });

        if (!indexModule) return null;

        const [indexFilePath, indexContent] = indexModule as [string, any];
        const indexId = indexFilePath.replace('/src/content/', '');

        // Compute slug and URL for this folder
        const pathWithoutIndex = indexId.replace(/\/index\.(md|mdx)$/, '');
        const pathWithoutFolder = pathWithoutIndex === folderName ? '' : pathWithoutIndex.replace(`${folderName}/`, '');
        const slug = cleanPath(pathWithoutFolder);
        const folderUrl = slug ? `/${folderName}/${slug}` : `/${folderName}`;

        // Create breadcrumb for this folder
        const thisFolderBreadcrumb: Breadcrumb = {
            label: indexContent.frontmatter.title,
            href: folderUrl
        };

        // Breadcrumbs to pass to children (includes this folder)
        const breadcrumbsWithHref = [...parentBreadcrumbs, thisFolderBreadcrumb];

        // This folder's own breadcrumbs (last item without href)
        const folderBreadcrumbs = parentBreadcrumbs.length > 0
            ? [...parentBreadcrumbs, {label: indexContent.frontmatter.title}]
            : [{label: indexContent.frontmatter.title}];

        // Get direct child files (not in subfolders, excluding _index)
        const directFiles = modules
            .filter(([filePath]) => {
                const relativePath = filePath.replace('/src/content/', '');
                if (relativePath.endsWith('index.md') || relativePath.endsWith('index.mdx')) return false;

                const pathWithoutExt = relativePath.replace(/\.(md|mdx)$/, '');
                const fileFolder = pathWithoutExt.substring(0, pathWithoutExt.lastIndexOf('/'));
                return fileFolder === basePath;
            })
            .sort((a, b) => a[0].localeCompare(b[0]));

        // Get direct child folders
        const childFolderPaths = new Set<string>();
        modules.forEach(([filePath]) => {
            const relativePath = filePath.replace('/src/content/', '');
            if (!basePath || relativePath.startsWith(basePath + '/')) {
                const afterBase = basePath ? relativePath.substring(basePath.length + 1) : relativePath;
                const firstSlash = afterBase.indexOf('/');
                if (firstSlash > 0) {
                    const folderPath = basePath ? `${basePath}/${afterBase.substring(0, firstSlash)}` : afterBase.substring(0, firstSlash);
                    childFolderPaths.add(folderPath);
                }
            }
        });

        const childFolders = Array.from(childFolderPaths)
            .sort()
            .map(path => buildFolder(path, breadcrumbsWithHref))
            .filter((f): f is ContentFolder => f !== null);

        // Convert files to ContentFile format
        const files: ContentFile[] = directFiles.map(([filePath, module]: [string, any]) => {
            const id = filePath.replace('/src/content/', '');
            const folder = getFolderName(id);
            const slug = cleanPath(id.replace(`${folder}/`, ''));

            return {
                id,
                folder,
                slug,
                get url() {
                    return `/${folder}/${slug}`;
                },
                frontmatter: module.frontmatter || {},
                render: async () => ({
                    Content: module.default,
                    headings: module.getHeadings?.() || []
                }),
                breadcrumbs: [
                    ...breadcrumbsWithHref,
                    {label: module.frontmatter.title}
                ]
            };
        });

        return {
            id: indexId,
            folder: folderName,
            slug,
            get url() {
                return folderUrl;
            },
            frontmatter: indexContent.frontmatter || {},
            subfiles: files.filter(f => !f.frontmatter?.hidden).sort(sortContentFiles),
            subfolders: childFolders,
            get allFiles(): ContentFile[] {
                // Close over `files` (full list, includes hidden) so hidden pages still get routes
                const nested = childFolders.flatMap(f => f.allFiles);
                return [...files.sort(sortContentFiles), ...nested];
            },
            render: async () => ({
                Content: indexContent.default,
                headings: indexContent.getHeadings?.() || []
            }),
            breadcrumbs: folderBreadcrumbs
        };
    };

    const rootPath = path === folderName ? folderName : path;
    const folder = buildFolder(rootPath.replace(/^\//, ''));

    if (!folder) {
        throw new Error(`No index.md found for folder: ${path}`);
    }

    // Add prev/next links — hidden and soon files are excluded from the nav sequence
    const navFiles = folder.allFiles.filter(f => !f.frontmatter?.hidden && !f.frontmatter?.soon);
    for (let i = 0; i < navFiles.length; i++) {
        if (i > 0) navFiles[i].prev = navFiles[i - 1];
        if (i < navFiles.length - 1) navFiles[i].next = navFiles[i + 1];
    }

    return folder;
}


/**
 * Tag taxonomy for essays.
 * Order defines sidebar group sequence and prev/next navigation order.
 */
export const TAG_ORDER = [
    {tag: 'foundations', label: 'Foundations'},
    {tag: 'the-case-for-hypermedia', label: 'The Case for Hypermedia'},
    {tag: 'case-studies', label: 'Case Studies'},
    {tag: 'guides', label: 'Guides'},
    {tag: 'simplicity', label: 'Simplicity'},
] as const;

/**
 * Get a single content file.
 *
 * @param path - File path (e.g., 'pages/index', 'docs/getting-started/installation')
 * @returns ContentFile or null if not found
 */
export async function getFile(path: string): Promise<ContentFile | null> {
    // Try to find the module (with or without extension)
    const moduleEntry = Object.entries(contentModules).find(([filePath]) => {
        const relativePath = filePath.replace('/src/content/', '');
        const withoutExt = relativePath.replace(/\.(md|mdx)$/, '');
        return relativePath === path || withoutExt === path || relativePath === `${path}.md` || relativePath === `${path}.mdx`;
    });

    if (!moduleEntry) return null;

    const [filePath, module] = moduleEntry as [string, any];
    const id = filePath.replace('/src/content/', '');
    const folder = getFolderName(id);
    const slug = cleanPath(id.replace(`${folder}/`, ''));
    const fileUrl = `/${folder}/${slug}`;

    // Build breadcrumbs by loading the folder structure
    const rootFolder = await getFolder(folder);
    const breadcrumbs: Breadcrumb[] = [
        {label: rootFolder.frontmatter.title, href: rootFolder.url}
    ];

    // Parse slug to find parent folders
    const slugParts = slug.split('/');
    if (slugParts.length > 1) {
        let currentFolder = rootFolder;
        for (let i = 0; i < slugParts.length - 1; i++) {
            const partialSlug = slugParts.slice(0, i + 1).join('/');
            const subfolder = currentFolder.subfolders.find(sf => sf.slug === partialSlug);
            if (subfolder) {
                breadcrumbs.push({label: subfolder.frontmatter.title, href: subfolder.url});
                currentFolder = subfolder;
            }
        }
    }

    // Add current file (no href)
    breadcrumbs.push({label: module.frontmatter.title});

    // Find the file in allFiles to get prev/next links
    const allFiles = rootFolder.allFiles;
    const fileIndex = allFiles.findIndex(f => f.id === id);
    const prev = fileIndex > 0 ? allFiles[fileIndex - 1] : undefined;
    const next = fileIndex < allFiles.length - 1 ? allFiles[fileIndex + 1] : undefined;

    return {
        id,
        folder,
        slug,
        get url() {
            return fileUrl;
        },
        frontmatter: module.frontmatter || {},
        render: async () => ({
            Content: module.default,
            headings: module.getHeadings?.() || []
        }),
        breadcrumbs,
        prev,
        next
    };
}
