/**
 * lib/content.ts
 *
 * Filesystem-first content tree builder.
 *
 * Provides a clean API for navigating content as folders and files.
 * Data objects (ContentFile, ContentFolder) are plain data with
 * pre-computed derived fields. render() is a separate action.
 *
 * Built on import.meta.glob for md/mdx (keys for path enumeration at module
 * init, lazy imports for content) and direct fs reads for yaml/json data files.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';

// Case-preserving filesystem paths (strings only — no modules loaded, no circular dependency)
const allPaths = Object.keys(import.meta.glob('/src/content/**/*.{md,mdx}'));

// Lazy module loaders — called inside async functions, not at module init
const lazyModules: Record<string, () => Promise<any>> = import.meta.glob('/src/content/**/*.{md,mdx}');


// Cache for loaded modules to avoid re-importing
const moduleCache = new Map<string, any>();

async function loadModule(fullPath: string): Promise<any> {
    if (moduleCache.has(fullPath)) return moduleCache.get(fullPath);
    const loader = lazyModules[fullPath];
    if (!loader) return null;
    const mod = await loader();
    moduleCache.set(fullPath, mod);
    return mod;
}

function isDataFile(path: string): boolean {
    return /\.(yaml|yml|json)$/.test(path);
}



// --- Types ---

export interface Breadcrumb {
    label: string;
    href?: string;
}

export interface ContentFile {
    path: string;
    folder: string;
    slug: string;
    url: string;
    frontmatter: Record<string, any>;
    breadcrumbs: Breadcrumb[];
    prev?: ContentFile;
    next?: ContentFile;
}

export interface ContentFolder {
    path: string;
    folder: string;
    slug: string;
    url: string;
    frontmatter: Record<string, any>;
    breadcrumbs: Breadcrumb[];
    files: ContentFile[];
    folders: ContentFolder[];
    allFiles: ContentFile[];
}

// --- Helpers ---

function getFolderName(path: string): string {
    return path.split('/')[0];
}

function cleanPath(path: string): string {
    return path
        .split('/')
        .map(segment => segment.replace(/^\d+-/, '').replace(/\.(md|mdx)$/, ''))
        .join('/');
}

function sortContentFiles(a: ContentFile, b: ContentFile): number {
    const aCreated = a.frontmatter?.created;
    const bCreated = b.frontmatter?.created;
    if (aCreated && bCreated) {
        return new Date(bCreated).getTime() - new Date(aCreated).getTime();
    }
    return a.path.localeCompare(b.path);
}



// --- Constants ---

export const COLLECTIONS = ['home', 'about', 'docs', 'reference', 'patterns', 'essays', 'interviews', 'podcasts', 'memes'] as const;

export const TAG_ORDER = [
    {tag: 'foundations', label: 'Foundations'},
    {tag: 'the-case-for-hypermedia', label: 'The Case for Hypermedia'},
    {tag: 'case-studies', label: 'Case Studies'},
    {tag: 'guides', label: 'Guides'},
    {tag: 'simplicity', label: 'Simplicity'},
] as const;

// --- Actions ---

/**
 * Render a content file or folder. Separate from data — this is I/O.
 */
export async function render(item: ContentFile | ContentFolder): Promise<{ Content: any; headings: any[] }> {
    const mod = await loadModule(`/src/content/${item.path}`);
    if (!mod) return {Content: null, headings: []};
    return {
        Content: mod.default,
        headings: mod.getHeadings?.() || []
    };
}

// --- Functions ---

/**
 * Get content folder tree.
 *
 * @param path - Folder path (e.g., 'docs', 'reference')
 * @returns ContentFolder representing the folder with nested structure
 */
export async function getFolder(path: string): Promise<ContentFolder> {
    // Handle root-level files (e.g. 'home' → index.mdx, 'about' → about.mdx)
    const rootFileMap: Record<string, string> = {home: 'index'};
    const rootFileName = rootFileMap[path] ?? path;
    const rootFullPath = allPaths.find(p =>
        p === `/src/content/${rootFileName}.mdx` || p === `/src/content/${rootFileName}.md`
    );
    const hasFolder = allPaths.some(p =>
        p.startsWith(`/src/content/${path}/index.md`) || p.startsWith(`/src/content/${path}/index.mdx`)
    );

    if (rootFullPath && !hasFolder) {
        const rootMod = await loadModule(rootFullPath);
        const rootRelPath = rootFullPath.replace('/src/content/', '');
        const isHome = path === 'home';
        return {
            path: rootRelPath,
            folder: path,
            slug: '',
            url: isHome ? '/' : `/${path}`,
            frontmatter: rootMod.frontmatter || {},
            files: [],
            folders: [],
            allFiles: [],
            breadcrumbs: []
        };
    }

    const folderName = path.split('/')[0];
    const prefix = `/src/content/${folderName}/`;

    // All paths under this folder
    const folderPaths = allPaths.filter(p => p.startsWith(prefix));

    // Build the folder structure recursively
    const buildFolder = async (basePath: string, parentBreadcrumbs: Breadcrumb[] = []): Promise<ContentFolder | null> => {
        const indexPath = basePath ? `${basePath}/index` : `${folderName}/index`;

        // Find the index file
        const indexFullPath = folderPaths.find(p => {
            const rel = p.replace('/src/content/', '').replace(/\.(md|mdx)$/, '');
            return rel === indexPath;
        });
        if (!indexFullPath) return null;

        const indexRelPath = indexFullPath.replace('/src/content/', '');

        // Read frontmatter from disk to avoid executing MDX module bodies.
        // Index .mdx files may call getFolder() themselves — loading them
        // as modules here would create a circular call.
        let indexFrontmatter: Record<string, any> = {};
        try {
            const raw = readFileSync(join(process.cwd(), 'src', 'content', indexRelPath), 'utf-8');
            const match = raw.match(/^---\s*\n([\s\S]*?)\n---/);
            if (match) indexFrontmatter = yaml.load(match[1]) as Record<string, any> ?? {};
        } catch {}

        // Compute slug and URL
        const pathWithoutIndex = indexRelPath.replace(/\/index\.(md|mdx)$/, '');
        const pathWithoutFolder = pathWithoutIndex === folderName ? '' : pathWithoutIndex.replace(`${folderName}/`, '');
        const slug = cleanPath(pathWithoutFolder);
        const folderUrl = slug ? `/${folderName}/${slug}` : `/${folderName}`;

        // Breadcrumbs
        const thisFolderBreadcrumb: Breadcrumb = {
            label: indexFrontmatter.title,
            href: folderUrl
        };
        const breadcrumbsWithHref = [...parentBreadcrumbs, thisFolderBreadcrumb];
        const folderBreadcrumbs = parentBreadcrumbs.length > 0
            ? [...parentBreadcrumbs, {label: indexFrontmatter.title}]
            : [{label: indexFrontmatter.title}];

        // Direct child files (not in subfolders, excluding index)
        const directFilePaths = folderPaths
            .filter(p => {
                const rel = p.replace('/src/content/', '');
                if (rel.endsWith('index.md') || rel.endsWith('index.mdx')) return false;
                const withoutExt = rel.replace(/\.(md|mdx)$/, '');
                const fileFolder = withoutExt.substring(0, withoutExt.lastIndexOf('/'));
                return fileFolder === basePath;
            })
            .sort();

        // Direct child folders
        const childFolderPaths = new Set<string>();
        for (const p of folderPaths) {
            const rel = p.replace('/src/content/', '');
            if (!basePath || rel.startsWith(basePath + '/')) {
                const afterBase = basePath ? rel.substring(basePath.length + 1) : rel;
                const firstSlash = afterBase.indexOf('/');
                if (firstSlash > 0) {
                    const folderPath = basePath ? `${basePath}/${afterBase.substring(0, firstSlash)}` : afterBase.substring(0, firstSlash);
                    childFolderPaths.add(folderPath);
                }
            }
        }

        const childFolders: ContentFolder[] = [];
        for (const childPath of Array.from(childFolderPaths).sort()) {
            const child = await buildFolder(childPath, breadcrumbsWithHref);
            if (child) childFolders.push(child);
        }

        // Load files
        const files: ContentFile[] = await Promise.all(
            directFilePaths.map(async (fullPath) => {
                const mod = await loadModule(fullPath);
                const relPath = fullPath.replace('/src/content/', '');
                const folder = getFolderName(relPath);
                const slug = cleanPath(relPath.replace(`${folder}/`, ''));
                return {
                    path: relPath,
                    folder,
                    slug,
                    url: `/${folder}/${slug}`,
                    frontmatter: mod.frontmatter || {},
                    breadcrumbs: [
                        ...breadcrumbsWithHref,
                        {label: mod.frontmatter?.title}
                    ]
                };
            })
        );

        // allFiles includes hidden (for routing); files excludes hidden
        const allFilesFlat = [...files.sort(sortContentFiles), ...childFolders.flatMap(f => f.allFiles)];

        return {
            path: indexRelPath,
            folder: folderName,
            slug,
            url: folderUrl,
            frontmatter: indexFrontmatter || {},
            breadcrumbs: folderBreadcrumbs,
            files: files.filter(f => !f.frontmatter?.hidden).sort(sortContentFiles),
            folders: childFolders,
            allFiles: allFilesFlat
        };
    };

    const rootPath = path === folderName ? folderName : path;
    const folder = await buildFolder(rootPath.replace(/^\//, ''));

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
 * Get a single content file.
 *
 * @param path - File path with extension, relative to src/content/
 *               e.g., 'reference/01-attributes/01-hx-get.md' or 'team.yaml'
 * @returns ContentFile or null if not found
 */
export async function getFile(path: string): Promise<ContentFile | null> {
    // YAML/JSON data files — read from disk, parse, resolve images
    if (isDataFile(path)) {
        try {
            const diskPath = join(process.cwd(), 'src', 'content', path);
            const raw = readFileSync(diskPath, 'utf-8');
            const data = path.endsWith('.json') ? JSON.parse(raw) : yaml.load(raw);
            return {
                path,
                folder: '',
                slug: '',
                url: '',
                frontmatter: data,
                breadcrumbs: []
            };
        } catch {
            return null;
        }
    }

    // MD/MDX content files — load via lazy glob
    const fullPath = `/src/content/${path}`;
    if (!allPaths.includes(fullPath)) return null;

    const mod = await loadModule(fullPath);
    if (!mod) return null;

    const frontmatter = mod.frontmatter || {};
    const folder = getFolderName(path);
    const slug = cleanPath(path.replace(`${folder}/`, ''));
    const fileUrl = `/${folder}/${slug}`;

    // Build breadcrumbs and prev/next from folder tree
    const rootFolder = await getFolder(folder);
    const breadcrumbs: Breadcrumb[] = [
        {label: rootFolder.frontmatter.title, href: rootFolder.url}
    ];

    const slugParts = slug.split('/');
    if (slugParts.length > 1) {
        let currentFolder = rootFolder;
        for (let i = 0; i < slugParts.length - 1; i++) {
            const partialSlug = slugParts.slice(0, i + 1).join('/');
            const subfolder = currentFolder.folders.find(sf => sf.slug === partialSlug);
            if (subfolder) {
                breadcrumbs.push({label: subfolder.frontmatter.title, href: subfolder.url});
                currentFolder = subfolder;
            }
        }
    }

    breadcrumbs.push({label: frontmatter.title});

    const allFiles = rootFolder.allFiles;
    const fileIndex = allFiles.findIndex(f => f.path === path);
    const prev = fileIndex > 0 ? allFiles[fileIndex - 1] : undefined;
    const next = fileIndex < allFiles.length - 1 ? allFiles[fileIndex + 1] : undefined;

    return {
        path,
        folder,
        slug,
        url: fileUrl,
        frontmatter,
        breadcrumbs,
        prev,
        next
    };
}
