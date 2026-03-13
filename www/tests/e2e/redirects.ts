import { test, expect } from './_fixtures';

test.describe('Redirects', () => {
    // Migration guides (target pages don't exist yet, but redirect HTML should be generated)
    const MIGRATION_REDIRECTS: [string, string][] = [
        ['/migration-guide-hotwire-turbo', '/docs/get-started/migration-turbo'],
        ['/migration-guide-htmx-1', '/docs/get-started/migration-htmx-1'],
        ['/migration-guide-htmx-4', '/docs/get-started/migration-htmx-4'],
        ['/migration-guide-htmx-2', '/docs/get-started/migration-htmx-4'],
        ['/migration-guide-intercooler', '/docs/get-started/migration-intercooler'],
        ['/htmx-4', '/docs/get-started/migration-htmx-4'],
        ['/whats-new-in-htmx-4', '/docs/get-started/migration-htmx-4'],
    ];

    const SIMPLE_REDIRECTS: [string, string][] = [
        ['/events', '/reference/events'],
        ['/help', '/about'],
        ['/server-examples', '/about'],
        ['/examples', '/patterns'],
    ];

    // Sample of old flat pattern URLs → new nested URLs
    const PATTERN_REDIRECTS: [string, string][] = [
        ['/patterns/active-search', '/patterns/forms/active-search'],
        ['/patterns/infinite-scroll', '/patterns/loading/infinite-scroll'],
        ['/patterns/bulk-actions', '/patterns/records/bulk-actions'],
        ['/patterns/animations', '/patterns/display/animations'],
        ['/patterns/keyboard-shortcuts', '/patterns/advanced/keyboard-shortcuts'],
        ['/patterns/confirm', '/patterns/display/dialogs'],
        ['/patterns/edit-row', '/patterns/records/edit-in-place'],
    ];

    // Simple redirects where the target page exists
    for (const [from, to] of SIMPLE_REDIRECTS) {
        test(`${from} → ${to}`, async ({ page }) => {
            await page.goto(from);
            await expect(page).toHaveURL(to);
        });
    }

    // Pattern redirects where the target page exists
    for (const [from, to] of PATTERN_REDIRECTS) {
        test(`${from} → ${to}`, async ({ page }) => {
            await page.goto(from);
            await expect(page).toHaveURL(to);
        });
    }

    // Migration redirects — only test that the redirect HTML is generated
    // (target pages don't exist yet, so we just verify the redirect page exists)
    for (const [from, to] of MIGRATION_REDIRECTS) {
        test(`${from} redirect page exists`, async ({ request }) => {
            const response = await request.get(from, { maxRedirects: 0 });
            // Astro generates HTML with meta refresh for redirects
            // The response should be 200 (HTML page) or 301/302
            expect([200, 301, 302]).toContain(response.status());
        });
    }
});
