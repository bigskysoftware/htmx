import { test, expect } from './_fixtures';

test.describe('/docs sidebar', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/docs');
        await page.waitForSelector('.sidebar-link');
        await page.waitForTimeout(300);
    });

    test('sidebar links are hash-only anchors, not full paths', async ({ page }) => {
        const hrefs = await page.locator('.sidebar-link').evaluateAll(
            links => links.map(l => l.getAttribute('href'))
        );
        for (const href of hrefs) {
            expect(href).toMatch(/^#/);
        }
    });

    test('clicking a sidebar link scrolls to the matching heading', async ({ page }) => {
        await page.locator('.sidebar-link[href="#hypermedia-controls"]').click();
        await page.waitForTimeout(500);

        const heading = page.locator('h2#hypermedia-controls');
        await expect(heading).toBeInViewport();
    });

    test('clicking a sidebar link marks it as active', async ({ page }) => {
        const link = page.locator('.sidebar-link[href="#hypermedia-controls"]');
        await link.click();
        await page.waitForTimeout(800);

        await expect(link).toHaveAttribute('aria-current', 'true');
        await expect(page.locator('.sidebar-link[aria-current]')).toHaveCount(1);
    });

    test('clicking a second sidebar link moves active to it', async ({ page }) => {
        const first = page.locator('.sidebar-link[href="#hypermedia-controls"]');
        const second = page.locator('.sidebar-link[href="#multi-target-updates"]');

        await first.click();
        await page.waitForTimeout(800);
        await expect(first).toHaveAttribute('aria-current', 'true');

        await second.click();
        await page.waitForTimeout(800);
        await expect(second).toHaveAttribute('aria-current', 'true');
        await expect(first).not.toHaveAttribute('aria-current');
    });

    test('clicking a sidebar link ABOVE the current active one activates it', async ({ page }) => {
        const lower = page.locator('.sidebar-link[href="#multi-target-updates"]');
        await lower.click();
        await page.waitForTimeout(800);
        await expect(lower).toHaveAttribute('aria-current', 'true');

        const upper = page.locator('.sidebar-link[href="#hypermedia-controls"]');
        await upper.click();
        await page.waitForTimeout(800);
        await expect(upper).toHaveAttribute('aria-current', 'true');
        await expect(lower).not.toHaveAttribute('aria-current');
    });

    test('clicking a sidebar link does not fetch a new page', async ({ page }) => {
        const docRequests: string[] = [];
        page.on('request', req => {
            if (req.resourceType() === 'document') docRequests.push(req.url());
        });

        await page.locator('.sidebar-link[href="#installation"]').click();
        await page.waitForTimeout(500);

        expect(docRequests).toHaveLength(0);
    });

    test('scrolling the page activates the corresponding sidebar link', async ({ page }) => {
        // Scroll into the section by clicking, then verify scrollspy tracked it
        await page.locator('.sidebar-link[href="#css-transitions"]').click();
        await page.waitForTimeout(800);

        // Scroll a bit further into the section so the observer catches up
        await page.evaluate(() => window.scrollBy(0, 200));
        await page.waitForTimeout(500);

        const link = page.locator('.sidebar-link[href="#css-transitions"]');
        await expect(link).toHaveAttribute('aria-current', 'true');
    });
});
