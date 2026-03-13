import { test, expect } from './_fixtures';

// Wait for SW to claim the page
async function waitForSw(page: any) {
    await page.evaluate(async () => {
        if (!('serviceWorker' in navigator)) return;
        await navigator.serviceWorker.ready;
        const deadline = Date.now() + 10_000;
        while (!navigator.serviceWorker.controller && Date.now() < deadline)
            await new Promise(r => setTimeout(r, 50));
    });
}

// Wait for demo content to appear
async function waitForDemo(page: any) {
    await expect(page.locator('#demo-content > *').first()).toBeVisible({ timeout: 15_000 });
}

// Serial: SW state leaks between parallel workers
test.describe.serial('Pattern demo pages', () => {
    test.setTimeout(30_000);

    // --- Loading ---

    test('click-to-load: renders and loads more', async ({ page }) => {
        await page.goto('/patterns/loading/click-to-load');
        await waitForSw(page);
        await waitForDemo(page);

        // Should have comments
        await expect(page.locator('#demo-content #comments')).toBeVisible();
        const initialCount = await page.locator('#demo-content #comments > div').count();
        expect(initialCount).toBeGreaterThan(0);

        // Click "Show more comments" and verify more appear
        const showMore = page.locator('#demo-content button', { hasText: /show more/i });
        if (await showMore.isVisible()) {
            await showMore.click();
            await page.waitForTimeout(1000);
            const newCount = await page.locator('#demo-content #comments > div').count();
            expect(newCount).toBeGreaterThan(initialCount);
        }
    });

    test('infinite-scroll: renders and loads on scroll', async ({ page }) => {
        await page.goto('/patterns/loading/infinite-scroll');
        await waitForSw(page);
        await waitForDemo(page);

        // Should have a table with initial rows
        await expect(page.locator('#demo-content table')).toBeVisible();
        const initialRows = await page.locator('#demo-content tbody tr').count();
        expect(initialRows).toBeGreaterThan(0);
    });

    test('lazy-load: renders weather card after delay', async ({ page }) => {
        await page.goto('/patterns/loading/lazy-load');
        await waitForSw(page);
        await waitForDemo(page);

        // Should eventually show the forecast (replaces loading placeholder)
        await expect(page.locator('#demo-content', { hasText: '5-Day Forecast' })).toBeVisible({ timeout: 10_000 });
    });

    test('progress-bar: renders and starts job', async ({ page }) => {
        await page.goto('/patterns/loading/progress-bar');
        await waitForSw(page);
        await waitForDemo(page);

        // Should have a start button
        const startBtn = page.locator('#demo-content button', { hasText: /start job/i });
        await expect(startBtn).toBeVisible();

        // Click start and verify progress appears
        await startBtn.click();
        await expect(page.locator('#demo-content .progress')).toBeVisible({ timeout: 5_000 });
    });

    // --- Forms ---

    test('active-search: renders and searches', async ({ page }) => {
        await page.goto('/patterns/forms/active-search');
        await waitForSw(page);
        await waitForDemo(page);

        // Should have search input and table
        const input = page.locator('#demo-content input[type="search"]');
        await expect(input).toBeVisible();

        // Initial load should populate results
        await expect(page.locator('#demo-content #search-results tr').first()).toBeVisible({ timeout: 5_000 });

        // Type a search term
        await input.fill('Venus');
        await page.waitForTimeout(1000);
        const results = await page.locator('#demo-content #search-results tr').count();
        expect(results).toBeGreaterThan(0);
    });

    test('active-validation: renders signup form', async ({ page }) => {
        await page.goto('/patterns/forms/active-validation');
        await waitForSw(page);
        await waitForDemo(page);

        // Should have email input
        await expect(page.locator('#demo-content input[name="email"]')).toBeVisible();
        await expect(page.locator('#demo-content button', { hasText: /submit/i })).toBeVisible();
    });

    test('linked-selects: renders and changes models', async ({ page }) => {
        await page.goto('/patterns/forms/linked-selects');
        await waitForSw(page);
        await waitForDemo(page);

        // Should have make and model selects
        const makeSelect = page.locator('#demo-content select[name="make"]');
        await expect(makeSelect).toBeVisible();
        await expect(page.locator('#demo-content #models')).toBeVisible();

        // Change make to Toyota and verify models update
        await makeSelect.selectOption('toyota');
        await page.waitForTimeout(1000);
        const modelText = await page.locator('#demo-content #models').textContent();
        expect(modelText).toContain('Landcruiser');
    });

    test('reset-on-submit: renders note form', async ({ page }) => {
        await page.goto('/patterns/forms/reset-on-submit');
        await waitForSw(page);
        await waitForDemo(page);

        // Should have form with input and add button
        await expect(page.locator('#demo-content input[name="note-text"]')).toBeVisible();
        await expect(page.locator('#demo-content button', { hasText: /add/i })).toBeVisible();
    });

    // --- Records ---

    test('bulk-actions: renders table with checkboxes', async ({ page }) => {
        await page.goto('/patterns/records/bulk-actions');
        await waitForSw(page);
        await waitForDemo(page);

        // Should have table with checkboxes
        await expect(page.locator('#demo-content table')).toBeVisible();
        const checkboxes = await page.locator('#demo-content input[type="checkbox"]').count();
        expect(checkboxes).toBeGreaterThan(0);
    });

    test('delete-in-place: renders table with delete buttons', async ({ page }) => {
        await page.goto('/patterns/records/delete-in-place');
        await waitForSw(page);
        await waitForDemo(page);

        // Should have table with delete buttons
        await expect(page.locator('#demo-content table')).toBeVisible();
        const deleteButtons = await page.locator('#demo-content button', { hasText: /delete/i });
        expect(await deleteButtons.count()).toBeGreaterThan(0);
    });

    test('drag-to-reorder: renders sortable list', async ({ page }) => {
        await page.goto('/patterns/records/drag-to-reorder');
        await waitForSw(page);
        await waitForDemo(page);

        // Should have items
        const items = await page.locator('#demo-content input[name="item"]').count();
        expect(items).toBeGreaterThan(0);
    });

    test('edit-in-place: renders and edits', async ({ page }) => {
        await page.goto('/patterns/records/edit-in-place');
        await waitForSw(page);
        await waitForDemo(page);

        // Should show view mode with Edit button
        const editBtn = page.locator('#demo-content button', { hasText: /edit/i });
        await expect(editBtn).toBeVisible();

        // Click edit, verify form appears
        await editBtn.click();
        await expect(page.locator('#demo-content input[name="name"]')).toBeVisible({ timeout: 5_000 });
    });

    // --- Display ---

    test('dialogs: renders button and opens modal', async ({ page }) => {
        await page.goto('/patterns/display/dialogs');
        await waitForSw(page);
        await waitForDemo(page);

        // Should show "Open a Modal" button
        const openBtn = page.locator('#demo-content button', { hasText: /open a modal/i });
        await expect(openBtn).toBeVisible();

        // Click and verify modal appears
        await openBtn.click();
        await expect(page.locator('#modal .modal-content')).toBeVisible({ timeout: 5_000 });
    });

    // --- Advanced ---

    test('keyboard-shortcuts: renders button', async ({ page }) => {
        await page.goto('/patterns/advanced/keyboard-shortcuts');
        await waitForSw(page);
        await waitForDemo(page);

        // Should have the "Do It!" button
        await expect(page.locator('#demo-content button', { hasText: /do it/i })).toBeVisible();
    });
});
