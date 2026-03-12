import { test, expect } from './_fixtures';

test.describe('Accessibility', () => {
    test('page has proper landmark structure', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('header[role="banner"]')).toBeVisible();
        await expect(page.locator('main#main-content')).toBeVisible();
    });

    test('navigation has aria-label', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('nav[aria-label="Primary Navigation"]')).toBeVisible();
        await expect(page.locator('nav[aria-label="Mobile Navigation"]')).toBeAttached();
    });

    test('content pages have sidebar with aria-label', async ({ page }) => {
        await page.goto('/docs');
        await expect(page.locator('nav[aria-label="Sidebar Navigation"]')).toBeVisible();
    });

    test('search dialog has correct aria attributes', async ({ page }) => {
        await page.goto('/');
        const dialog = page.locator('dialog#search-modal');
        await expect(dialog).toHaveAttribute('role', 'alertdialog');
        await expect(dialog).toHaveAttribute('aria-modal', 'true');
        await expect(dialog).toHaveAttribute('aria-label', 'Search documentation');
    });

    test('images on about page have alt text', async ({ page }) => {
        await page.goto('/about');
        const imagesWithoutAlt = page.locator('main img:not([alt])');
        await expect(imagesWithoutAlt).toHaveCount(0);
    });

    test('no duplicate IDs on a content page', async ({ page }) => {
        await page.goto('/docs/get-started/installation');
        const duplicates = await page.evaluate(() => {
            const ids = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
            return ids.filter((id, i) => ids.indexOf(id) !== i);
        });
        expect(duplicates).toEqual([]);
    });
});
