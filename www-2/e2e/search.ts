import { test, expect } from './_fixtures';

// Helper to open search modal (hyperscript-driven, so we call showModal directly)
async function openSearch(page: any) {
    await page.evaluate(() => {
        const dialog = document.querySelector('dialog#search-modal') as HTMLDialogElement;
        dialog?.showModal();
    });
    await expect(page.locator('dialog#search-modal')).toBeVisible();
}

test.describe('Search', () => {
    test('search modal can be opened', async ({ page }) => {
        await page.goto('/');
        const dialog = page.locator('dialog#search-modal');
        await expect(dialog).not.toBeVisible();

        await openSearch(page);
        await expect(dialog).toBeVisible();
    });

    test('search modal can be closed with Escape', async ({ page }) => {
        await page.goto('/');
        await openSearch(page);

        await page.keyboard.press('Escape');
        await expect(page.locator('dialog#search-modal')).not.toBeVisible();
    });

    test('search input exists and is interactive', async ({ page }) => {
        await page.goto('/');
        await openSearch(page);

        const input = page.locator('#search-input');
        await expect(input).toBeVisible();
        await input.fill('hx-get');
        await expect(input).toHaveValue('hx-get');
    });

    test('search results container exists', async ({ page }) => {
        await page.goto('/');
        await openSearch(page);
        await expect(page.locator('#search-results')).toBeAttached();
    });

    test('search dialog has correct structure', async ({ page }) => {
        await page.goto('/');
        const dialog = page.locator('dialog#search-modal');
        await expect(dialog).toHaveAttribute('role', 'alertdialog');
        await expect(dialog).toHaveAttribute('aria-modal', 'true');
        await expect(dialog).toHaveAttribute('aria-label', 'Search documentation');
    });

    test('search-index.json is valid and populated', async ({ request }) => {
        const response = await request.get('/search-index.json');
        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(data.results.length).toBeGreaterThan(50);
    });
});
