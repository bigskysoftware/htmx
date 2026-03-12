/**
 * SEO tag checks — reads built HTML from dist/ directly.
 * Run after `bun run build` with: bun test seo.test.ts
 */
import { describe, test, expect } from 'bun:test';
import { readFileSync } from 'fs';

function readPage(path: string): string {
    const filePath = `./dist${path}/index.html`;
    return readFileSync(filePath, 'utf-8');
}

function readFile(path: string): string {
    return readFileSync(`./dist${path}`, 'utf-8');
}

function getMeta(html: string, selector: string): string | null {
    const match = html.match(new RegExp(`<meta[^>]+${selector}[^>]+content="([^"]*)"`, 'i'))
        ?? html.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+${selector}`, 'i'));
    return match?.[1] ?? null;
}

function getProperty(html: string, property: string): string | null {
    return getMeta(html, `property="${property}"`);
}

function getName(html: string, name: string): string | null {
    return getMeta(html, `name="${name}"`);
}

function getJsonLd(html: string): Record<string, any> {
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (!match) throw new Error('No JSON-LD script found');
    return JSON.parse(match[1]);
}

// ─── Pages to check for common tags ──────────────────────────────────────────

const COMMON_PAGES = ['', '/docs/get-started/installation', '/essays/hateoas', '/about'];

describe('common tags (all pages)', () => {
    for (const path of COMMON_PAGES) {
        test(`${path || '/'} has required meta tags`, () => {
            const html = readPage(path);

            expect(html).toContain('<title>');
            expect(getName(html, 'description')).toBeTruthy();
            expect(html).toContain(`rel="canonical"`);

            expect(getProperty(html, 'og:title')).toBeTruthy();
            expect(getProperty(html, 'og:description')).toBeTruthy();
            expect(getProperty(html, 'og:url')).toBeTruthy();
            expect(getProperty(html, 'og:image')).toBeTruthy();
            expect(getProperty(html, 'og:site_name')).toBe('htmx');
            expect(getProperty(html, 'og:locale')).toBe('en_US');

            expect(getName(html, 'twitter:card')).toBe('summary_large_image');
            expect(getName(html, 'twitter:site')).toBe('@htmx_org');
            expect(getName(html, 'twitter:title')).toBeTruthy();
            expect(getName(html, 'twitter:image')).toBeTruthy();

            expect(html).toContain('href="/sitemap-index.xml"');
        });
    }
});

// ─── Home page ────────────────────────────────────────────────────────────────

describe('home page', () => {
    const html = readPage('');

    test('og:type is website', () => {
        expect(getProperty(html, 'og:type')).toBe('website');
    });

    test('JSON-LD is WebSite schema', () => {
        const ld = getJsonLd(html);
        expect(ld['@context']).toBe('https://schema.org');
        expect(ld['@type']).toBe('WebSite');
        expect(ld.name).toBe('htmx');
        expect(ld.url).toBeTruthy();
        expect(ld.description).toBeTruthy();
    });
});

// ─── Essay page (hateoas: dates, author, tag) ─────────────────────────────────

describe('essay page (/essays/hateoas)', () => {
    const html = readPage('/essays/hateoas');

    test('og:type is article', () => {
        expect(getProperty(html, 'og:type')).toBe('article');
    });

    test('article:published_time is 2021', () => {
        const t = getProperty(html, 'article:published_time');
        expect(t).toBeTruthy();
        expect(new Date(t!).getFullYear()).toBe(2021);
    });

    test('article:modified_time is 2022', () => {
        const t = getProperty(html, 'article:modified_time');
        expect(t).toBeTruthy();
        expect(new Date(t!).getFullYear()).toBe(2022);
    });

    test('article:author is Carson Gross', () => {
        expect(getProperty(html, 'article:author')).toBe('Carson Gross');
    });

    test('article:tag is foundations', () => {
        expect(getProperty(html, 'article:tag')).toBe('foundations');
    });

    test('JSON-LD is Article with full metadata', () => {
        const ld = getJsonLd(html);
        expect(ld['@type']).toBe('Article');
        expect(ld.headline).toBeTruthy();
        expect(ld.datePublished).toBeTruthy();
        expect(ld.dateModified).toBeTruthy();
        expect(ld.author).toHaveLength(1);
        expect(ld.author[0]['@type']).toBe('Person');
        expect(ld.author[0].name).toBe('Carson Gross');
        expect(ld.publisher['@type']).toBe('Organization');
        expect(ld.publisher.name).toBe('htmx');
    });
});

// ─── Docs page (no dates or authors) ─────────────────────────────────────────

describe('docs page (/docs/get-started/installation)', () => {
    const html = readPage('/docs/get-started/installation');

    test('og:type is article', () => {
        expect(getProperty(html, 'og:type')).toBe('article');
    });

    test('no article:published_time (docs have no dates)', () => {
        expect(html).not.toContain('article:published_time');
    });

    test('no article:author (docs have no authors)', () => {
        expect(html).not.toContain('article:author');
    });

    test('JSON-LD Article has no author or datePublished', () => {
        const ld = getJsonLd(html);
        expect(ld['@type']).toBe('Article');
        expect(ld.datePublished).toBeUndefined();
        expect(ld.author).toBeUndefined();
    });
});

// ─── robots.txt and sitemap ───────────────────────────────────────────────────

describe('robots.txt', () => {
    const txt = readFile('/robots.txt');

    test('exists and allows all', () => {
        expect(txt).toContain('User-agent: *');
        expect(txt).toContain('Allow: /');
    });

    test('references sitemap', () => {
        expect(txt).toContain('Sitemap:');
        expect(txt).toContain('sitemap-index.xml');
    });
});

describe('sitemap', () => {
    test('sitemap-index.xml is valid', () => {
        const xml = readFile('/sitemap-index.xml');
        expect(xml).toContain('<sitemapindex');
        expect(xml).toContain('<sitemap>');
    });

    test('sitemap-0.xml contains real pages', () => {
        const xml = readFile('/sitemap-0.xml');
        expect(xml).toContain('/docs/get-started/installation');
        expect(xml).toContain('/essays/hateoas');
        expect(xml).toContain('/reference/attributes/hx-get');
    });

    test('sitemap-0.xml excludes hidden page', () => {
        const xml = readFile('/sitemap-0.xml');
        expect(xml).not.toContain('/reference/headers/HX-Push<');
    });

    test('sitemap-0.xml excludes category redirects', () => {
        const xml = readFile('/sitemap-0.xml');
        expect(xml).not.toContain('>https://four.htmx.org/reference/attributes<');
        expect(xml).not.toContain('>https://four.htmx.org/docs/get-started<');
    });
});
