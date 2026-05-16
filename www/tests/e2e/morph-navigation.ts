import { test, expect } from './_fixtures';

test.describe('Morph navigation', () => {
    test('sidebar link navigates without full reload', async ({ page }) => {
        await page.goto('/docs/get-started/installation', { waitUntil: 'networkidle' });

        // Tag the search-index element to detect full page reload
        await page.evaluate(() => {
            const el = document.querySelector('search-index');
            if (el) (el as any).__morphTest = true;
        });

        // Open sidebar section and click a different page
        const sidebarToggle = page.locator('label[for="sidebar-toggle-mobile"]');
        if (await sidebarToggle.isVisible()) {
            await sidebarToggle.click();
        }
        await page.locator('#sidebar-nav details summary', { hasText: 'Core Concepts' }).click();
        await page.locator('#sidebar-nav a', { hasText: 'Mental Model' }).click();

        await expect(page).toHaveURL(/mental-model/);

        // The tagged element should still exist (morph, not full reload)
        const survived = await page.evaluate(() => {
            const el = document.querySelector('search-index');
            return el && (el as any).__morphTest === true;
        });
        expect(survived).toBe(true);
    });

    test('content updates after morph navigation', async ({ page }) => {
        await page.goto('/docs/get-started/installation', { waitUntil: 'networkidle' });

        const initialContent = await page.locator('.prose').textContent();

        // Navigate to a different page via sidebar
        const sidebarToggle = page.locator('label[for="sidebar-toggle-mobile"]');
        if (await sidebarToggle.isVisible()) {
            await sidebarToggle.click();
        }
        await page.locator('#sidebar-nav details summary', { hasText: 'Core Concepts' }).click();
        await page.locator('#sidebar-nav a', { hasText: 'Mental Model' }).click();

        await expect(page).toHaveURL(/mental-model/);

        const newContent = await page.locator('.prose').textContent();
        expect(newContent).not.toBe(initialContent);
    });

    test('no errors after morph navigation', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err: Error) => errors.push(err.message));
        page.on('console', (msg: any) => {
            if (msg.type() === 'error') errors.push(msg.text());
        });

        await page.goto('/docs/get-started/installation', { waitUntil: 'networkidle' });

        // Navigate via sidebar
        const sidebarToggle = page.locator('label[for="sidebar-toggle-mobile"]');
        if (await sidebarToggle.isVisible()) {
            await sidebarToggle.click();
        }
        await page.locator('#sidebar-nav details summary', { hasText: 'Core Concepts' }).click();
        await page.locator('#sidebar-nav a', { hasText: 'Mental Model' }).click();

        await expect(page).toHaveURL(/mental-model/);
        await page.waitForTimeout(500); // let async errors settle

        const realErrors = errors.filter(e =>
            !e.includes('init is not defined') &&
            !e.includes('favicon')
        );
        expect(realErrors).toEqual([]);
    });

    test('browser back works after morph navigation', async ({ page }) => {
        await page.goto('/docs/get-started/installation', { waitUntil: 'networkidle' });

        // Navigate forward via sidebar
        const sidebarToggle = page.locator('label[for="sidebar-toggle-mobile"]');
        if (await sidebarToggle.isVisible()) {
            await sidebarToggle.click();
        }
        await page.locator('#sidebar-nav details summary', { hasText: 'Core Concepts' }).click();
        await page.locator('#sidebar-nav a', { hasText: 'Mental Model' }).click();

        await expect(page).toHaveURL(/mental-model/);

        // Go back
        await page.goBack();
        await expect(page).toHaveURL(/installation/);
    });

    test('morph navigation scrolls to top', async ({ page }) => {
        await page.goto('/docs/get-started/installation', { waitUntil: 'networkidle' });

        // Scroll to bottom
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        const scrolledY = await page.evaluate(() => window.scrollY);
        expect(scrolledY).toBeGreaterThan(100);

        // Navigate via sidebar
        const sidebarToggle = page.locator('label[for="sidebar-toggle-mobile"]');
        if (await sidebarToggle.isVisible()) {
            await sidebarToggle.click();
        }
        await page.locator('#sidebar-nav details summary', { hasText: 'Core Concepts' }).click();
        await page.locator('#sidebar-nav a', { hasText: 'Mental Model' }).click();

        await expect(page).toHaveURL(/mental-model/);

        const topY = await page.evaluate(() => window.scrollY);
        expect(topY).toBeLessThan(50);
    });
});
