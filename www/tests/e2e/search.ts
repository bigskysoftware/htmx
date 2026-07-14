import { test, expect } from './_fixtures';

// Helper to open search modal (hyperscript-driven, so we call showModal directly)
async function openSearch(page: any) {
    await page.evaluate(() => {
        const dialog = document.querySelector('dialog#search-modal') as HTMLDialogElement;
        dialog?.showModal();
    });
    const dialog = page.locator('dialog#search-modal');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('#search-input')).toBeVisible();
    await expect(dialog.locator('#search-input')).toBeEnabled();
}

test.describe('Search', () => {
    test('search modal can be opened', async ({ page }) => {
        await page.goto('/');
        const dialog = page.locator('dialog#search-modal');
        await expect(dialog).not.toBeVisible();

        await openSearch(page);
        await expect(dialog).toBeVisible();
    });

    test('search modal can be closed with Escape', async ({ page }) => {
        await page.goto('/');
        await openSearch(page);

        await page.keyboard.press('Escape');
        await expect(page.locator('dialog#search-modal')).not.toBeVisible();
    });

    test('search input exists and is interactive', async ({ page }) => {
        await page.goto('/');
        await openSearch(page);

        const input = page.locator('#search-input');
        await expect(input).toBeVisible();
        await input.fill('hx-get');
        await expect(input).toHaveValue('hx-get');
    });

    test('search results container exists', async ({ page }) => {
        await page.goto('/');
        await openSearch(page);
        await expect(page.locator('#search-results')).toBeAttached();
    });

    test('search dialog has correct structure', async ({ page }) => {
        await page.goto('/');
        const dialog = page.locator('dialog#search-modal');
        await expect(dialog).toHaveAttribute('role', 'alertdialog');
        await expect(dialog).toHaveAttribute('aria-modal', 'true');
        await expect(dialog).toHaveAttribute('aria-label', 'Search documentation');
    });

    test('search-index.json is valid and populated', async ({ request }) => {
        const response = await request.get('/search-index.json');
        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(data.results.length).toBeGreaterThan(50);
    });
});

/**
 * Search ranking tests — verifies the first result for common queries.
 *
 * Each entry: [queries, expected title of the first result]
 *   - queries can be a single string or an array of strings
 *   - each query in the array generates a separate test
 *
 * We assert on the TITLE (what the user sees), not the URL. This means:
 * - Pages can be moved/reorganized without breaking tests
 * - Tests read naturally: "searching X should show X first"
 * - Case matters: "HX-Trigger" (header) vs "hx-trigger" (attribute)
 */
const SEARCH_RANKING: [string | string[], string][] = [
    // ── Attributes (lowercase hx-*) ──
    ['hx-get', 'hx-get'],
    ['hx-post', 'hx-post'],
    ['hx-swap', 'hx-swap'],
    ['hx-target', 'hx-target'],
    ['hx-trigger', 'hx-trigger'],
    ['hx-boost', 'hx-boost'],
    ['hx-push-url', 'hx-push-url'],
    ['hx-select', 'hx-select'],
    ['hx-swap-oob', 'hx-swap-oob'],
    ['hx-on', 'hx-on'],
    ['hx-include', 'hx-include'],
    ['hx-vals', 'hx-vals'],
    ['hx-confirm', 'hx-confirm'],
    ['hx-indicator', 'hx-indicator'],
    ['hx-sync', 'hx-sync'],
    ['hx-headers', 'hx-headers'],
    ['hx-delete', 'hx-delete'],
    ['hx-preserve', 'hx-preserve'],

    // ── Headers (uppercase HX-*) — must beat same-name attributes ──
    ['headers', 'Headers'],
    ['HX-Trigger', 'HX-Trigger'],
    ['HX-Target', 'HX-Target'],
    ['HX-Redirect', 'HX-Redirect'],
    ['HX-Location', 'HX-Location'],
    ['HX-Request', 'HX-Request'],
    ['HX-Refresh', 'HX-Refresh'],
    ['HX-Boosted', 'HX-Boosted'],

    // ── Reference index pages ──
    ['attributes', 'Attributes'],
    ['events', 'Events'],

    // ── Docs (with keyword aliases) ──
    [['installation', 'install', 'cdn', 'npm', 'getting started', 'quick start'], 'Installation'],
    [['boosting', 'boost', 'progressive enhancement'], 'Boosting'],
    [['history', 'back button', 'pushState'], 'History'],
    ['extensions', 'Extensions'],
    [['websockets', 'ws'], 'hx-ws'],
    [['server-sent events', 'server sent events', 'event stream'], 'hx-sse'],
    ['validation', 'Validation'],
    ['inheritance', 'Attribute Inheritance'],
    [['synchronization', 'sync', 'debounce', 'throttle', 'race condition'], 'Synchronization'],
    [['CSS Transitions', 'fade'], 'CSS Transitions'],
    [['oob', 'out of band'], 'Multi-Target Updates'],
    [['javascript', 'scripting', 'hyperscript'], 'Client-Side Scripting'],
    ['alpine', 'hx-alpine-compat'],
    ['caching', 'Caching'],
    ['cache', 'hx-history-cache'],
    ['etag', 'hx-ptag'],
    [['configuration', 'settings', 'meta tag'], 'Configuration'],
    ['config', 'Config'],
    [['debugging', 'debug', 'devtools', 'logAll'], 'Debugging'],
    ['XHR', 'Requests & Responses'],

    // ── Patterns ──
    ['infinite scroll', 'Infinite Scroll'],
    ['lazy load', 'Lazy Load'],
    ['active search', 'Active Search'],
    ['file upload', 'File Upload'],
    ['delete in place', 'Delete in Place'],
    ['dialogs', 'Dialogs'],
    ['tabs', 'Tabs'],
    ['polling', 'Polling'],

    // ── Methods ──
    ['htmx.ajax', 'htmx.ajax()'],

    // ── Essays ──
    ['HATEOAS', 'HATEOAS'],
    ['locality of behaviour', 'Locality of Behaviour (LoB)'],
];

test.describe('Search ranking', () => {
    test('first result matches expected title for each query', async ({ page }) => {
        await page.goto('/', { waitUntil: 'load' });
        await openSearch(page);

        await page.evaluate(() => customElements.whenDefined('search-index'));
        await page.evaluate(async () =>
            await (document.querySelector('search-index') as any)?.load()
        );

        const input = page.locator('#search-input');
        const firstResult = page.locator('.result').first();

        for (const [queries, expectedTitle] of SEARCH_RANKING) {
            for (const query of Array.isArray(queries) ? queries : [queries]) {
                await test.step(`"${query}" → ${expectedTitle}`, async () => {
                    await input.evaluate((el, val) => {
                        el.value = val;
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                    }, query);
                    await expect(firstResult).toBeAttached({ timeout: 2000 });

                    const titleEl = firstResult.locator('~ article .truncate.leading-tight');
                    await expect(titleEl).toHaveText(expectedTitle, { timeout: 2000 });
                });
            }
        }
    });
});
