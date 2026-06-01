import { test, expect } from './_fixtures';

async function openSearch(page: any) {
    await page.evaluate(() => {
        const dialog = document.querySelector('dialog#search-modal') as HTMLDialogElement;
        dialog?.showModal();
    });
    await expect(page.locator('dialog#search-modal')).toBeVisible();
}

async function searchFor(page: any, query: string) {
    await openSearch(page);

    // Wait for custom element upgrade, then load the index
    await page.evaluate(() => customElements.whenDefined('search-index'));
    await page.evaluate(() =>
        (document.querySelector('search-index') as any)?.load()
    );

    const input = page.locator('#search-input');
    await input.fill(query);

    await expect(page.locator('.result').first()).toBeAttached({ timeout: 5000 });
}

test.describe('Search interaction', () => {
    test('results are <a> links with valid href', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
        await searchFor(page, 'hx-get');

        const firstResult = page.locator('.result').first();
        const tagName = await firstResult.evaluate((el: Element) => el.tagName);
        expect(tagName).toBe('A');

        const href = await firstResult.getAttribute('href');
        expect(href).toBeTruthy();
        expect(href).toMatch(/^\//); // internal link
    });

    test('click result navigates to the page', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
        await searchFor(page, 'hx-get');

        const firstResult = page.locator('.result').first();
        const href = await firstResult.getAttribute('href');

        await firstResult.click();
        await expect(page).toHaveURL(href!);
    });

    test('Enter navigates to the selected result', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
        await searchFor(page, 'hx-get');

        const firstResult = page.locator('.result').first();
        const href = await firstResult.getAttribute('href');

        await page.keyboard.press('Enter');
        await expect(page).toHaveURL(href!);
    });

    test('arrow keys move selection', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
        await searchFor(page, 'hx-');

        // First result should be selected initially
        const first = page.locator('.result').first();
        await expect(first).toHaveAttribute('aria-selected', 'true');

        // Press ArrowDown — selection moves to second
        await page.keyboard.press('ArrowDown');
        const second = page.locator('.result').nth(1);
        await expect(second).toHaveAttribute('aria-selected', 'true');
        await expect(first).not.toHaveAttribute('aria-selected');

        // Press ArrowUp — selection moves back to first
        await page.keyboard.press('ArrowUp');
        await expect(first).toHaveAttribute('aria-selected', 'true');
        await expect(second).not.toHaveAttribute('aria-selected');
    });

    test('modal closes after clicking a result', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
        await searchFor(page, 'hx-get');

        await page.locator('.result').first().click();

        // Wait for navigation then check modal is gone
        await page.waitForURL(/hx-get/);
        await expect(page.locator('dialog#search-modal')).not.toBeVisible();
    });

    test('modal closes after pressing Enter', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
        await searchFor(page, 'hx-get');

        await page.keyboard.press('Enter');

        await page.waitForURL(/hx-get/);
        await expect(page.locator('dialog#search-modal')).not.toBeVisible();
    });

    test('Escape closes modal and clears input', async ({ page }) => {
        await page.goto('/', { waitUntil: 'networkidle' });
        await searchFor(page, 'hx-get');

        await page.keyboard.press('Escape');
        await expect(page.locator('dialog#search-modal')).not.toBeVisible();

        // Re-open — input should be cleared
        await openSearch(page);
        await expect(page.locator('#search-input')).toHaveValue('');
    });
});
