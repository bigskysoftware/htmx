import { test, expect, TOP_LEVEL_PAGES, STANDALONE_PAGES } from './_fixtures';

// Known hyperscript issue — filter these out until fixed
const KNOWN_JS_ERRORS = ['init is not defined'];

function filterKnownErrors(errors: string[]): string[] {
    return errors.filter(e => !KNOWN_JS_ERRORS.some(known => e.includes(known)));
}

test.describe('Smoke tests', () => {
    for (const path of TOP_LEVEL_PAGES) {
        test(`${path} renders without errors`, async ({ page }) => {
            const errors: string[] = [];
            page.on('pageerror', (err) => errors.push(err.message));

            await page.goto(path);
            await expect(page.locator('main#main-content')).toBeVisible();
            expect(filterKnownErrors(errors)).toEqual([]);
        });
    }

    for (const path of STANDALONE_PAGES) {
        test(`${path} renders without errors`, async ({ page }) => {
            const errors: string[] = [];
            page.on('pageerror', (err) => errors.push(err.message));

            await page.goto(path);
            // Standalone pages don't use ContentLayout — just check page loaded
            await expect(page.locator('body')).toBeVisible();
            expect(filterKnownErrors(errors)).toEqual([]);
        });
    }

    const SAMPLE_CONTENT_PAGES = [
        '/docs/get-started/installation',
        '/docs/core-concepts/mental-model',
        '/reference/attributes/hx-get',
        '/reference/headers/HX-Request',
        '/reference/events',
        '/patterns/loading/click-to-load',
        '/patterns/forms/active-search',
        '/essays/locality-of-behaviour',
    ];

    for (const path of SAMPLE_CONTENT_PAGES) {
        test(`${path} renders content`, async ({ page }) => {
            const errors: string[] = [];
            page.on('pageerror', (err) => errors.push(err.message));

            await page.goto(path);
            await expect(page.locator('main#main-content')).toBeVisible();
            await expect(page.locator('.prose')).toBeVisible();
            expect(filterKnownErrors(errors)).toEqual([]);
        });
    }

    test('search-index.json is valid', async ({ request }) => {
        const response = await request.get('/search-index.json');
        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(data.results).toBeDefined();
        expect(data.results.length).toBeGreaterThan(50);
    });
});
