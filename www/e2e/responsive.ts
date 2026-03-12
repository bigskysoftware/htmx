import { test, expect, NAV_ITEMS } from './_fixtures';

test.describe('Responsive behavior', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('desktop nav links are hidden on mobile', async ({ page }) => {
        await page.goto('/');
        // Desktop nav links container has "hidden lg:flex"
        const desktopNav = page.locator('nav#navigation div[aria-label="Main"]');
        await expect(desktopNav).toBeHidden();
    });

    test('mobile nav toggle is visible', async ({ page }) => {
        await page.goto('/');
        const toggle = page.locator('label[for="mobile-navigation-toggle"]');
        await expect(toggle).toBeVisible();
    });

    test('mobile nav opens and shows links', async ({ page }) => {
        await page.goto('/');
        const mobileNav = page.locator('#mobile-navigation');

        // Initially hidden (opacity-0 + pointer-events-none)
        await expect(mobileNav).toHaveCSS('opacity', '0');

        // Click hamburger
        await page.locator('label[for="mobile-navigation-toggle"]').click();

        // Nav should now be visible
        await expect(mobileNav).toHaveCSS('opacity', '1');

        // All nav items present
        for (const item of NAV_ITEMS) {
            await expect(mobileNav.locator(`a[href="/${item}"]`)).toBeVisible();
        }
    });

    test('mobile nav link navigates', async ({ page }) => {
        await page.goto('/');
        await page.locator('label[for="mobile-navigation-toggle"]').click();
        await page.locator('#mobile-navigation a[href="/docs"]').click();
        await expect(page).toHaveURL('/docs');
    });

    test('mobile sidebar toggle works on content pages', async ({ page }) => {
        await page.goto('/docs');

        // Click sidebar toggle
        await page.locator('label[for="sidebar-toggle-mobile"]').click();

        // Sidebar nav should become visible
        await expect(page.locator('#sidebar-nav')).toBeVisible();
    });

    test('mobile search opens via evaluate', async ({ page }) => {
        await page.goto('/');
        // Search uses hyperscript, so open via JS
        await page.evaluate(() => {
            const dialog = document.querySelector('dialog#search-modal') as HTMLDialogElement;
            dialog?.showModal();
        });
        await expect(page.locator('dialog#search-modal')).toBeVisible();
    });
});
