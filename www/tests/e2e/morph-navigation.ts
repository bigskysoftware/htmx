import { test, expect } from './_fixtures';

const START = '/reference/attributes/hx-get';
const TARGET_HREF = '/reference/attributes/hx-post';
const TARGET_URL = /hx-post/;

async function navigateToTarget(page: any) {
    const sidebarToggle = page.locator('label[for="sidebar-toggle-mobile"]');
    if (await sidebarToggle.isVisible()) {
        await sidebarToggle.click();
    }
    await page.locator(`#sidebar-nav a[href="${TARGET_HREF}"]`).click();
}

test.describe('Morph navigation', () => {
    test('sidebar link navigates without full reload', async ({ page }) => {
        await page.goto(START, { waitUntil: 'networkidle' });

        await page.evaluate(() => {
            const el = document.querySelector('search-index');
            if (el) (el as any).__morphTest = true;
        });

        await navigateToTarget(page);
        await expect(page).toHaveURL(TARGET_URL);

        const survived = await page.evaluate(() => {
            const el = document.querySelector('search-index');
            return el && (el as any).__morphTest === true;
        });
        expect(survived).toBe(true);
    });

    test('content updates after morph navigation', async ({ page }) => {
        await page.goto(START, { waitUntil: 'networkidle' });

        const initialContent = await page.locator('.prose').textContent();

        await navigateToTarget(page);
        await expect(page).toHaveURL(TARGET_URL);

        const newContent = await page.locator('.prose').textContent();
        expect(newContent).not.toBe(initialContent);
    });

    test('no errors after morph navigation', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err: Error) => errors.push(err.message));
        page.on('console', (msg: any) => {
            if (msg.type() === 'error') errors.push(msg.text());
        });

        await page.goto(START, { waitUntil: 'networkidle' });

        await navigateToTarget(page);
        await expect(page).toHaveURL(TARGET_URL);
        await page.waitForTimeout(500);

        const realErrors = errors.filter(e =>
            !e.includes('init is not defined') &&
            !e.includes('favicon')
        );
        expect(realErrors).toEqual([]);
    });

    test('browser back works after morph navigation', async ({ page }) => {
        await page.goto(START, { waitUntil: 'networkidle' });

        await navigateToTarget(page);
        await expect(page).toHaveURL(TARGET_URL);

        await page.goBack();
        await expect(page).toHaveURL(/hx-get/);
    });

    test('morph navigation scrolls to top', async ({ page }) => {
        await page.goto(START, { waitUntil: 'networkidle' });

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        const scrolledY = await page.evaluate(() => window.scrollY);
        expect(scrolledY).toBeGreaterThan(100);

        await navigateToTarget(page);
        await expect(page).toHaveURL(TARGET_URL);

        const topY = await page.evaluate(() => window.scrollY);
        expect(topY).toBeLessThan(50);
    });
});
