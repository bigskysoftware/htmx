import { test, expect } from './_fixtures';

test.describe('Content page structure', () => {
    test('docs page has sidebar with sections', async ({ page }) => {
        await page.goto('/docs');
        const sidebar = page.locator('#sidebar-nav');
        await expect(sidebar).toBeVisible();

        const sections = sidebar.locator('details');
        expect(await sections.count()).toBeGreaterThanOrEqual(6);
    });

    test('sidebar highlights current page', async ({ page }) => {
        await page.goto('/docs/get-started/installation');
        const activeLink = page.locator('#sidebar-nav a[aria-current="page"]');
        await expect(activeLink).toHaveCount(1);
        await expect(activeLink).toContainText('Installation');
    });

    test('sidebar section auto-opens for current page', async ({ page }) => {
        await page.goto('/docs/core-concepts/mental-model');
        const openSection = page.locator('#sidebar-nav details[open]');
        await expect(openSection).toBeVisible();
        await expect(openSection.locator('summary')).toContainText('Core Concepts');
    });

    test('sidebar navigation works', async ({ page }) => {
        await page.goto('/docs');
        const sidebarToggle = page.locator('label[for="sidebar-toggle-mobile"]');
        if (await sidebarToggle.isVisible()) {
            await sidebarToggle.click();
        }
        await page.locator('#sidebar-nav details summary', { hasText: 'Get Started' }).click();
        await page.locator('#sidebar-nav a', { hasText: 'Installation' }).click();
        await expect(page).toHaveURL('/docs/get-started/installation');
    });

    test('reference sidebar uses monospace font', async ({ page }) => {
        await page.goto('/reference/attributes/hx-get');
        const activeLink = page.locator('#sidebar-nav a[aria-current="page"]');
        await expect(activeLink).toHaveCSS('font-family', /monospace|JetBrains/);
    });

    test('table of contents visible on wide viewport', async ({ page }) => {
        await page.setViewportSize({ width: 1400, height: 900 });
        await page.goto('/docs/get-started/installation');
        await expect(page.locator('#page-outline')).toBeVisible();
    });

    test('table of contents hidden on narrow viewport', async ({ page }) => {
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.goto('/docs/get-started/installation');
        await expect(page.locator('#page-outline')).not.toBeVisible();
    });

    test('category URLs redirect to reference index', async ({ page }) => {
        await page.goto('/reference/attributes');
        await expect(page).toHaveURL(/\/reference/);
    });

    test('patterns page has pattern links', async ({ page }) => {
        await page.goto('/patterns');
        const patternLinks = page.locator('a[href*="/patterns/"]');
        expect(await patternLinks.count()).toBeGreaterThan(5);
    });
});
