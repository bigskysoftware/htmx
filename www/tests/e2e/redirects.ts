import { test, expect } from './_fixtures';

// Redirects from the htmx 2.x site live in public/_redirects and are applied
// by Netlify, not by the preview server, so they cannot be tested here.
// These cover the ones astro.config.mjs generates.
test.describe('Redirects', () => {
    const REDIRECTS: [string, string][] = [
        ['/help', '/about'],
        ['/patterns/forms/active-search', '/patterns/active-search'],
    ];

    for (const [from, to] of REDIRECTS) {
        test(`${from} -> ${to}`, async ({ page }) => {
            await page.goto(from);
            await expect(page).toHaveURL(to);
        });
    }

    // These land on an anchor of a page that must exist.
    const ANCHOR_REDIRECTS = ['/htmx-4', '/whats-new-in-htmx-4', '/migration-guide-htmx-2'];

    for (const from of ANCHOR_REDIRECTS) {
        test(`${from} -> /docs#migration-from-htmx-2x`, async ({ page }) => {
            await page.goto(from);
            await expect(page).toHaveURL(/\/docs#migration-from-htmx-2x$/);
            await expect(page.locator('#migration-from-htmx-2x')).toBeAttached();
        });
    }
});
