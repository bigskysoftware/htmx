import { test, expect, NAV_ITEMS } from './_fixtures';

test.describe('Desktop navigation', () => {
    test('header contains all nav links', async ({ page }) => {
        await page.goto('/');
        const nav = page.locator('nav#navigation');
        for (const item of NAV_ITEMS) {
            await expect(nav.locator(`a[href="/${item}"]`)).toBeVisible();
        }
    });

    test('logo links to homepage', async ({ page }) => {
        await page.goto('/docs');
        await page.locator('a[aria-label="HTMX Homepage"]').click();
        await expect(page).toHaveURL('/');
    });

    test('aria-current=page is set on active nav item', async ({ page }) => {
        await page.goto('/docs');
        const docsLink = page.locator('nav#navigation a[href="/docs"]');
        await expect(docsLink).toHaveAttribute('aria-current', 'page');

        const refLink = page.locator('nav#navigation a[href="/reference"]');
        await expect(refLink).not.toHaveAttribute('aria-current', 'page');
    });

    test('aria-current persists on sub-pages', async ({ page }) => {
        await page.goto('/docs/get-started/installation');
        const docsLink = page.locator('nav#navigation a[href="/docs"]');
        await expect(docsLink).toHaveAttribute('aria-current', 'page');
    });

    test('version selector is present', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('select[aria-label="Select htmx version"]')).toBeVisible();
    });
});
