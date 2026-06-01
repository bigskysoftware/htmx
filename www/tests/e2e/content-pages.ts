import { test, expect } from './_fixtures';

test.describe('Content page structure', () => {
    test('docs page has sidebar with sections', async ({ page }) => {
        await page.goto('/docs');
        const sidebar = page.locator('#sidebar-nav');
        await expect(sidebar).toBeVisible();

        const sections = sidebar.locator('details');
        expect(await sections.count()).toBeGreaterThanOrEqual(6);
    });

    test('docs sidebar scrollspy highlights a page anchor', async ({ page }) => {
        await page.goto('/docs', { waitUntil: 'networkidle' });
        await page.waitForFunction(
            () => !!(document.querySelector('#sidebar-nav .border-l') as any)?._sidebarObserver,
            { timeout: 5000 }
        );
        // Scroll through the page; one of the H2s will land in the observer's band.
        for (let y = 0; y <= 2000; y += 300) {
            await page.evaluate((scrollY: number) => window.scrollTo(0, scrollY), y);
            await page.waitForTimeout(150);
            if (await page.locator('#sidebar-nav a.sidebar-link[data-active]').count() > 0) break;
        }
        const activeLink = page.locator('#sidebar-nav a.sidebar-link[data-active]');
        await expect(activeLink).toHaveCount(1);
        const href = await activeLink.getAttribute('href');
        expect(href).toMatch(/^\/docs#/);
    });

    test('reference sidebar highlights current page', async ({ page }) => {
        await page.goto('/reference/attributes/hx-get');
        const activeLink = page.locator('#sidebar-nav a[aria-current="page"]');
        await expect(activeLink).toHaveCount(1);
        await expect(activeLink).toContainText('hx-get');
    });

    test('reference sidebar section auto-opens for current page', async ({ page }) => {
        await page.goto('/reference/attributes/hx-get');
        const openSection = page.locator('#sidebar-nav details[open]');
        await expect(openSection.first()).toBeVisible();
        await expect(openSection.first().locator('summary')).toContainText('Attributes');
    });

    test('docs sidebar anchor navigates to in-page heading', async ({ page }) => {
        await page.goto('/docs');
        const sidebarToggle = page.locator('label[for="sidebar-toggle-mobile"]');
        if (await sidebarToggle.isVisible()) {
            await sidebarToggle.click();
        }
        const link = page.locator('#sidebar-nav a.sidebar-link', { hasText: 'Installation' }).first();
        const href = await link.getAttribute('href');
        expect(href).toBe('/docs#installation');
        await link.click();
        await expect(page).toHaveURL(href!);
    });

    test('reference sidebar uses monospace font', async ({ page }) => {
        await page.goto('/reference/attributes/hx-get');
        const activeLink = page.locator('#sidebar-nav a[aria-current="page"]');
        await expect(activeLink).toHaveCSS('font-family', /monospace|JetBrains/);
    });

    test('table of contents visible on wide viewport', async ({ page }) => {
        await page.setViewportSize({ width: 1400, height: 900 });
        await page.goto('/docs');
        await expect(page.locator('#page-outline')).toBeVisible();
    });

    test('table of contents hidden on narrow viewport', async ({ page }) => {
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.goto('/docs');
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
