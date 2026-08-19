import { test, expect } from './_fixtures';

test.describe('Content page structure', () => {
    test('docs page nav has group labels', async ({ page }) => {
        await page.goto('/docs');
        const nav = page.locator('#page-nav');
        await expect(nav).toBeVisible();

        // docs-nav.html groups the sections. A bare span is a group label.
        const groups = nav.locator('> ul > li > span');
        expect(await groups.count()).toBeGreaterThanOrEqual(6);
    });

    test('docs page nav scrollspy highlights a link on scroll', async ({ page }) => {
        await page.goto('/docs', { waitUntil: 'networkidle' });
        await page.waitForTimeout(300);

        // Scroll through the page until the observer activates a link
        for (let y = 0; y <= 2000; y += 300) {
            await page.evaluate((scrollY: number) => window.scrollTo(0, scrollY), y);
            await page.waitForTimeout(150);
            if (await page.locator('#page-nav a[aria-current]').count() > 0) break;
        }
        const activeLink = page.locator('#page-nav a[aria-current]');
        await expect(activeLink).toHaveCount(1);
        const href = await activeLink.getAttribute('href');
        expect(href).toMatch(/^#/);
    });

    test('docs page nav anchor navigates to in-page heading', async ({ page }) => {
        await page.goto('/docs');
        const link = page.locator('#page-nav a', { hasText: 'Installation' }).first();
        const href = await link.getAttribute('href');
        expect(href).toBe('#installation');
        await link.click();
        await expect(page).toHaveURL(/\/docs#installation/);
    });

    test('leaf page nav is derived from its own headings', async ({ page }) => {
        await page.goto('/reference/attributes/hx-swap');
        const links = page.locator('#page-nav a[href^="#"]');
        expect(await links.count()).toBeGreaterThan(1);
    });

    test('leaf page breadcrumb trails back to the collection', async ({ page }) => {
        await page.goto('/reference/attributes/hx-get');
        const crumbs = page.locator('nav[aria-label="Breadcrumb"]');
        await expect(crumbs).toContainText('Reference');
        await expect(crumbs).toContainText('hx-get');
        // The ol trail is the desktop crumb; .back-link is the mobile stand-in.
        await crumbs.locator('ol a[href="/reference"]').click();
        await expect(page).toHaveURL(/\/reference$/);
    });

    test('page nav visible on wide viewport', async ({ page }) => {
        await page.setViewportSize({ width: 1400, height: 900 });
        await page.goto('/docs');
        await expect(page.locator('#page-nav')).toBeVisible();
    });

    test('page nav hidden on narrow viewport', async ({ page }) => {
        await page.setViewportSize({ width: 900, height: 768 });
        await page.goto('/docs');
        await expect(page.locator('#page-nav')).not.toBeVisible();
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
