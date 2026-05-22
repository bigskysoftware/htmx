import { test, expect } from './_fixtures';

test.describe('Code blocks', () => {
    test('code blocks have syntax highlighting', async ({ page }) => {
        await page.goto('/docs/get-started/installation');

        const codeBlock = page.locator('.prose pre code').first();
        await expect(codeBlock).toBeVisible();

        // Shiki wraps tokens in <span> elements for highlighting
        const spanCount = await codeBlock.locator('span').count();
        expect(spanCount).toBeGreaterThan(0);
    });

    test('code blocks are not empty', async ({ page }) => {
        await page.goto('/docs/get-started/installation');

        const codeBlocks = page.locator('.prose pre code');
        const count = await codeBlocks.count();
        expect(count).toBeGreaterThan(0);

        for (let i = 0; i < Math.min(count, 3); i++) {
            const text = await codeBlocks.nth(i).textContent();
            expect(text?.trim().length, `code block ${i} should not be empty`).toBeGreaterThan(0);
        }
    });

    test('code blocks survive morph navigation', async ({ page }) => {
        await page.goto('/docs/get-started/installation', { waitUntil: 'networkidle' });

        // Navigate to another page with code blocks via sidebar
        const sidebarToggle = page.locator('label[for="sidebar-toggle-mobile"]');
        if (await sidebarToggle.isVisible()) {
            await sidebarToggle.click();
        }
        await page.locator('#sidebar-nav details summary', { hasText: 'Core Concepts' }).click();
        await page.locator('#sidebar-nav a', { hasText: 'Mental Model' }).click();
        await expect(page).toHaveURL(/mental-model/);

        // Code blocks should still render with highlighting
        const codeBlock = page.locator('.prose pre code').first();
        if (await codeBlock.isVisible()) {
            const spanCount = await codeBlock.locator('span').count();
            expect(spanCount).toBeGreaterThan(0);
        }
    });
});
