/**
 * lib/content.js
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
import { join, dirname, resolve } from 'node:path';
import yaml from 'js-yaml';
import integrity from '../data/integrity.json';

/**
 * @typedef {Object} Breadcrumb
 * @property {string} label
 * @property {string} [href]
 */

/**
 * @typedef {Object} ContentFile
 * @property {string} path
 * @property {string} folder
 * @property {string} slug
 * @property {string} url
 * @property {Record<string, any>} frontmatter
 * @property {Breadcrumb[]} breadcrumbs
 * @property {ContentFile} [prev]
 * @property {ContentFile} [next]
 */

/**
 * @typedef {Object} ContentFolder
 * @property {string} path
 * @property {string} folder
 * @property {string} slug
 * @property {string} url
 * @property {Record<string, any>} frontmatter
 * @property {Breadcrumb[]} breadcrumbs
 * @property {ContentFile[]} files
 * @property {ContentFolder[]} folders
 * @property {ContentFile[]} allFiles
 */

// Case-preserving filesystem paths (strings only, no modules loaded, no circular dependency)
const allPaths = Object.keys(import.meta.glob('/src/content/**/*.{md,mdx}'));

// Lazy module loaders, called inside async functions, not at module init
/** @type {Record<string, () => Promise<any>>} */
const lazyModules = import.meta.glob('/src/content/**/*.{md,mdx}');

// Raw authored sources, eagerly loaded. Used by fileAsMarkdown to serve the
// `.md` companion endpoint for every prose page.
/** @type {Record<string, string>} */
const rawSources = import.meta.glob('/src/content/**/*.{md,mdx}', {
    query: '?raw',
    import: 'default',
    eager: true,
});


// Cache for loaded modules to avoid re-importing
const moduleCache = new Map();

async function loadModule(fullPath) {
    if (moduleCache.has(fullPath)) return moduleCache.get(fullPath);
    const loader = lazyModules[fullPath];
    if (!loader) return null;
    const mod = await loader();
    moduleCache.set(fullPath, mod);
    return mod;
}

/**
 * Convention: a file with slug `full` in a collection is the aggregate view
 * of that collection. It's excluded from sidebar lists and prev/next nav,
 * and its body is synthesised at content-load time by
 * aggregateCollectionMarkdown().
 * @param {{ slug: string }} file
 */
export function isAggregate(file) {
    return file.slug === 'full';
}

export function readRaw(fullPath) {
    try {
        return readFileSync(join(process.cwd(), fullPath.replace(/^\//, '')), 'utf-8');
    } catch {
        return '';
    }
}

function rawBody(fullPath) {
    return readRaw(fullPath)
        .replace(/^---[\s\S]*?---\n*/, '')
        .replace(/<script>[\s\S]*?server\.start[\s\S]*?<\/script>\s*/g, '')
        .trim();
}

function rawTitle(fullPath) {
    const raw = readRaw(fullPath);
    const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---/);
    const titleMatch = fmMatch?.[1].match(/^title:\s*(.+)$/m);
    return titleMatch?.[1].replace(/^["']|["']$/g, '').trim() || '';
}

/**
 * Strip MDX-only constructs from a body so it reads as plain markdown:
 * top-level `import` lines, `{/* ... *\/}` comments, `<Code lang="X"
 * code={`Y`} ... />` components (unwrapped to fenced blocks), and
 * `${data.field}` interpolations (resolved against any JSON imports).
 *
 * Fence-aware: never touches lines inside ``` / ~~~ code blocks.
 */
function stripMdxForMarkdown(body, sourcePath) {
    const baseDir = dirname(join(process.cwd(), 'src', 'content', sourcePath));
    /** @type {Record<string, any>} */
    const data = {};
    const out = [];
    let inFence = false;

    for (const line of body.split('\n')) {
        if (/^(`{3,}|~{3,})/.test(line)) {
            inFence = !inFence;
            out.push(line);
            continue;
        }
        if (inFence) { out.push(line); continue; }

        const jsonImport = line.match(/^import\s+(\w+)\s+from\s+['"](.+\.json)['"];?\s*$/);
        if (jsonImport) {
            const [, name, path] = jsonImport;
            try { data[name] = JSON.parse(readFileSync(resolve(baseDir, path), 'utf-8')); } catch {}
            continue;
        }
        if (/^import\s+/.test(line)) continue;

        out.push(line);
    }

    return out.join('\n')
        .replace(/\{\/\*[\s\S]*?\*\/\}\s*/g, '')
        .replace(
            /<Code\s+lang=["']([^"']+)["']\s+code=\{`([\s\S]*?)`\}[^>]*\/>/g,
            (_, lang, code) => `\`\`\`${lang}\n${code}\n\`\`\``
        )
        .replace(/\$\{(\w+)(?:\.(\w+))?\}/g, (match, name, field) => {
            if (!(name in data)) return match;
            const v = field !== undefined ? data[name][field] : data[name];
            return v !== undefined && v !== null ? String(v) : match;
        })
        .trim();
}

/**
 * Return a content file's authored markdown as a standalone document:
 * `# <title>` prepended (unless the body already starts with an H1),
 * frontmatter and inline demo-server scripts stripped, and MDX-only
 * constructs reduced to plain markdown. Consumed by the `.md` companion
 * endpoint for every prose page.
 * @param {string} path
 * @returns {string}
 */
export function fileAsMarkdown(path) {
    const fullPath = `/src/content/${path}`;
    let body = rawBody(fullPath);
    if (!body) return '';
    if (path.endsWith('.mdx')) body = stripMdxForMarkdown(body, path);
    // Resolve the CDN/npm version token (single source: integrity.json); the
    // remark plugin handles the rendered HTML, this covers raw-markdown exports.
    body = body.split('__VERSION__').join(integrity.version);
    const title = rawTitle(fullPath);
    return title && !/^#\s/.test(body) ? `# ${title}\n\n${body}` : body;
}

function isDataFile(path) {
    return /\.(yaml|yml|json)$/.test(path);
}


// --- Helpers ---

function getFolderName(path) {
    return path.split('/')[0];
}

function cleanPath(path) {
    return path
        .split('/')
        .map(segment => segment.replace(/^\d+-/, '').replace(/\.(md|mdx)$/, ''))
        .join('/');
}

/**
 * @param {ContentFile} a
 * @param {ContentFile} b
 */
function sortContentFiles(a, b) {
    const aCreated = a.frontmatter?.created;
    const bCreated = b.frontmatter?.created;
    if (aCreated && bCreated) {
        return new Date(bCreated).getTime() - new Date(aCreated).getTime();
    }
    return a.path.localeCompare(b.path);
}


// --- Constants ---

export const COLLECTIONS = ['home', 'about', 'docs', 'reference', 'extensions', 'patterns', 'essays', 'interviews', 'podcasts', 'memes'];

export const TAG_ORDER = [
    {tag: 'foundations', label: 'Foundations'},
    {tag: 'the-case-for-hypermedia', label: 'The Case for Hypermedia'},
    {tag: 'case-studies', label: 'Case Studies'},
    {tag: 'guides', label: 'Guides'},
    {tag: 'simplicity', label: 'Simplicity'},
];

// --- Actions ---

/**
 * Render a content file or folder. Separate from data, this is I/O.
 *
 * @param {ContentFile | ContentFolder} item
 * @returns {Promise<{ Content: any; headings: any[] }>}
 */
export async function render(item) {
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
 * @param {string} path - Folder path (e.g., 'docs', 'reference')
 * @returns {Promise<ContentFolder>} ContentFolder representing the folder with nested structure
 */
export async function getFolder(path) {
    // Handle root-level files (e.g. 'home' → index.mdx, 'about' → about.mdx)
    /** @type {Record<string, string>} */
    const rootFileMap = {home: 'index'};
    const rootFileName = rootFileMap[path] ?? path;
    const rootFullPath = allPaths.find(p =>
        p === `/src/content/${rootFileName}.mdx` || p === `/src/content/${rootFileName}.md`
    );
    const hasFolder = allPaths.some(p =>
        p.startsWith(`/src/content/${path}/index.md`) || p.startsWith(`/src/content/${path}/index.mdx`)
    );

    if (rootFullPath && !hasFolder) {
        const rootRelPath = rootFullPath.replace('/src/content/', '');
        const isHome = path === 'home';
        /** @type {Record<string, any>} */
        let rootFrontmatter = {};
        try {
            const raw = readFileSync(join(process.cwd(), 'src', 'content', rootRelPath), 'utf-8');
            const match = raw.match(/^---\s*\n([\s\S]*?)\n---/);
            if (match) rootFrontmatter = /** @type {Record<string, any>} */ (yaml.load(match[1])) ?? {};
        } catch {}
        return {
            path: rootRelPath,
            folder: path,
            slug: '',
            url: isHome ? '/' : `/${path}`,
            frontmatter: rootFrontmatter,
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

    /**
     * @param {string} basePath
     * @param {Breadcrumb[]} parentBreadcrumbs
     * @returns {Promise<ContentFolder | null>}
     */
    const buildFolder = async (basePath, parentBreadcrumbs = []) => {
        const indexPath = basePath ? `${basePath}/index` : `${folderName}/index`;

        // Find the index file
        const indexFullPath = folderPaths.find(p => {
            const rel = p.replace('/src/content/', '').replace(/\.(md|mdx)$/, '');
            return rel === indexPath;
        });
        if (!indexFullPath) return null;

        const indexRelPath = indexFullPath.replace('/src/content/', '');

        // Read frontmatter from disk to avoid executing MDX module bodies.
        // Index .mdx files may call getFolder() themselves, loading them
        // as modules here would create a circular call.
        /** @type {Record<string, any>} */
        let indexFrontmatter = {};
        try {
            const raw = readFileSync(join(process.cwd(), 'src', 'content', indexRelPath), 'utf-8');
            const match = raw.match(/^---\s*\n([\s\S]*?)\n---/);
            if (match) indexFrontmatter = /** @type {Record<string, any>} */ (yaml.load(match[1])) ?? {};
        } catch {}

        // Compute slug and URL
        const pathWithoutIndex = indexRelPath.replace(/\/index\.(md|mdx)$/, '');
        const pathWithoutFolder = pathWithoutIndex === folderName ? '' : pathWithoutIndex.replace(`${folderName}/`, '');
        const slug = cleanPath(pathWithoutFolder);
        const folderUrl = slug ? `/${folderName}/${slug}` : `/${folderName}`;

        // Breadcrumbs
        /** @type {Breadcrumb} */
        const thisFolderBreadcrumb = {
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
        const childFolderPaths = new Set();
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

        /** @type {ContentFolder[]} */
        const childFolders = [];
        for (const childPath of Array.from(childFolderPaths).sort()) {
            const child = await buildFolder(/** @type {string} */ (childPath), breadcrumbsWithHref);
            if (child) childFolders.push(child);
        }

        // Load files, read frontmatter from disk to avoid triggering the Vite
        // module runner during content sync (it closes before lazy imports resolve)
        /** @type {ContentFile[]} */
        const files = directFilePaths.map((fullPath) => {
            const relPath = fullPath.replace('/src/content/', '');
            const folder = getFolderName(relPath);
            const slug = cleanPath(relPath.replace(`${folder}/`, ''));

            /** @type {Record<string, any>} */
            let frontmatter = {};
            try {
                const raw = readFileSync(join(process.cwd(), 'src', 'content', relPath), 'utf-8');
                const match = raw.match(/^---\s*\n([\s\S]*?)\n---/);
                if (match) frontmatter = /** @type {Record<string, any>} */ (yaml.load(match[1])) ?? {};
            } catch {}

            return {
                path: relPath,
                folder,
                slug,
                url: `/${folder}/${slug}`,
                frontmatter,
                breadcrumbs: [...breadcrumbsWithHref, {label: frontmatter?.title}]
            };
        });

        // allFiles includes hidden files (for routing); files (sidebar) excludes them.
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

    // Add prev/next links, hidden and soon files are excluded from the nav sequence
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
 * @param {string} path - File path with extension, relative to src/content/
 *               e.g., 'reference/01-attributes/01-hx-get.md' or 'team.yaml'
 * @returns {Promise<ContentFile | null>} ContentFile or null if not found
 */
export async function getFile(path) {
    // YAML/JSON data files, read from disk, parse, resolve images
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
                frontmatter: /** @type {Record<string, any>} */ (data),
                breadcrumbs: []
            };
        } catch {
            return null;
        }
    }

    // MD/MDX content files, read frontmatter from disk (avoids Vite module runner)
    const fullPath = `/src/content/${path}`;
    if (!allPaths.includes(fullPath)) return null;

    /** @type {Record<string, any>} */
    let frontmatter = {};
    try {
        const raw = readFileSync(join(process.cwd(), 'src', 'content', path), 'utf-8');
        const match = raw.match(/^---\s*\n([\s\S]*?)\n---/);
        if (match) frontmatter = /** @type {Record<string, any>} */ (yaml.load(match[1])) ?? {};
    } catch {
        return null;
    }
    const folder = getFolderName(path);
    const slug = cleanPath(path.replace(`${folder}/`, ''));
    const fileUrl = `/${folder}/${slug}`;

    // Build breadcrumbs and prev/next from folder tree
    const rootFolder = await getFolder(folder);
    /** @type {Breadcrumb[]} */
    const breadcrumbs = [
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

