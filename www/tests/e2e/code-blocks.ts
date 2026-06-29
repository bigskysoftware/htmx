import { test, expect } from './_fixtures';

const CODE_BLOCK_PAGE = '/reference/attributes/hx-get';

test.describe('Code blocks', () => {
    test('code blocks have syntax highlighting', async ({ page }) => {
        await page.goto(CODE_BLOCK_PAGE);

        const codeBlock = page.locator('.prose pre code').first();
        await expect(codeBlock).toBeVisible();

        const spanCount = await codeBlock.locator('span').count();
        expect(spanCount).toBeGreaterThan(0);
    });

    test('code blocks are not empty', async ({ page }) => {
        await page.goto(CODE_BLOCK_PAGE);

        const codeBlocks = page.locator('.prose pre code');
        const count = await codeBlocks.count();
        expect(count).toBeGreaterThan(0);

        for (let i = 0; i < Math.min(count, 3); i++) {
            const text = await codeBlocks.nth(i).textContent();
            expect(text?.trim().length, `code block ${i} should not be empty`).toBeGreaterThan(0);
        }
    });

    test('code blocks survive morph navigation', async ({ page }) => {
        await page.goto(CODE_BLOCK_PAGE, { waitUntil: 'networkidle' });

        const sidebarToggle = page.locator('label[for="sidebar-toggle-mobile"]');
        if (await sidebarToggle.isVisible()) {
            await sidebarToggle.click();
        }
        await page.locator('#sidebar-nav a[href="/reference/attributes/hx-post"]').click();
        await expect(page).toHaveURL(/hx-post/);

        const codeBlock = page.locator('.prose pre code').first();
        if (await codeBlock.isVisible()) {
            const spanCount = await codeBlock.locator('span').count();
            expect(spanCount).toBeGreaterThan(0);
        }
    });
});
