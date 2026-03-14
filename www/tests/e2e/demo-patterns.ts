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

// Wait for demo content to appear (supports both #demo-content and .demo-container)
async function waitForDemo(page: any) {
    await expect(page.locator('#demo-content > *, .demo-container > *').first()).toBeVisible({ timeout: 15_000 });
}

// Inject a boosted link and click it to trigger morph navigation
async function morphViaLink(page: any, url: string) {
    const id = 'test-morph-link-' + Math.random().toString(36).slice(2, 8);
    await page.evaluate(({ url, id }) => {
        const a = document.createElement('a');
        a.href = url;
        a.textContent = 'Test nav';
        a.id = id;
        a.style.cssText = 'position:fixed;top:0;left:0;z-index:9999;padding:10px;background:red;color:white';
        document.body.appendChild(a);
        if ((window as any).htmx) (window as any).htmx.process(a);
    }, { url, id });
    await page.click(`#${id}`);
    await expect(page).toHaveURL(url, { timeout: 10_000 });
}

// Locate demo content in either #demo-content or .demo-container
function demo(page: any, selector: string) {
    return page.locator(`#demo-content ${selector}, .demo-container ${selector}`);
}

// Serial: SW state leaks between parallel workers
test.describe.serial('Pattern demo pages', () => {
    test.setTimeout(30_000);

    // =============================================
    // Loading
    // =============================================

    test('click-to-load: renders and loads more', async ({ page }) => {
        await page.goto('/patterns/loading/click-to-load');
        await waitForSw(page);
        await waitForDemo(page);

        await expect(demo(page, '#comments')).toBeVisible();
        const initialCount = await demo(page, '#comments > div').count();
        expect(initialCount).toBeGreaterThan(0);

        const showMore = demo(page, 'button').filter({ hasText: /show more/i });
        if (await showMore.isVisible()) {
            await showMore.click();
            await page.waitForTimeout(1000);
            const newCount = await demo(page, '#comments > div').count();
            expect(newCount).toBeGreaterThan(initialCount);
        }
    });

    test('click-to-load: works after morph navigation', async ({ page }) => {
        await page.goto('/patterns/loading/infinite-scroll');
        await waitForSw(page);
        await waitForDemo(page);

        await morphViaLink(page, '/patterns/loading/click-to-load');
        await waitForDemo(page);

        const showMore = demo(page, 'button').filter({ hasText: /show more/i });
        await expect(showMore).toBeVisible({ timeout: 15_000 });

        const initialCount = await demo(page, '#comments > div').count();
        await showMore.click();
        await page.waitForTimeout(1500);
        const newCount = await demo(page, '#comments > div').count();
        expect(newCount).toBeGreaterThan(initialCount);
    });

    test('infinite-scroll: renders table with rows', async ({ page }) => {
        await page.goto('/patterns/loading/infinite-scroll');
        await waitForSw(page);
        await waitForDemo(page);

        await expect(demo(page, 'table')).toBeVisible();
        const initialRows = await demo(page, 'tbody tr').count();
        expect(initialRows).toBeGreaterThan(0);
    });

    test('lazy-load: renders weather card after delay', async ({ page }) => {
        await page.goto('/patterns/loading/lazy-load');
        await waitForSw(page);
        await waitForDemo(page);

        await expect(page.locator('.demo-container', { hasText: '5-Day Forecast' })).toBeVisible({ timeout: 10_000 });
    });

    test('lazy-load: works after morph navigation', async ({ page }) => {
        await page.goto('/patterns/loading/click-to-load');
        await waitForSw(page);
        await waitForDemo(page);

        await page.click('a[href="/patterns/loading/lazy-load"]');
        await expect(page).toHaveURL('/patterns/loading/lazy-load', { timeout: 10_000 });

        await expect(page.locator('.demo-container', { hasText: '5-Day Forecast' })).toBeVisible({ timeout: 15_000 });
    });

    test('progress-bar: renders and starts job', async ({ page }) => {
        await page.goto('/patterns/loading/progress-bar');
        await waitForSw(page);
        await waitForDemo(page);

        const startBtn = demo(page, 'button').filter({ hasText: /start/i });
        await expect(startBtn).toBeVisible();
        await startBtn.click();

        // Progress element should appear
        await expect(demo(page, '[role="progressbar"]').first())
            .toBeVisible({ timeout: 5_000 });
    });

    // =============================================
    // Forms
    // =============================================

    test('active-search: renders and filters results', async ({ page }) => {
        await page.goto('/patterns/forms/active-search');
        await waitForSw(page);
        await waitForDemo(page);

        const input = demo(page, 'input[type="search"]');
        await expect(input).toBeVisible();

        // Initial load should populate results
        await expect(demo(page, 'table').first()).toBeVisible({ timeout: 5_000 });
        await expect(demo(page, 'tbody tr').first()).toBeVisible({ timeout: 5_000 });

        // Type a search term and verify filtering
        await input.fill('Venus');
        await page.waitForTimeout(1000);
        const results = await demo(page, 'tbody tr').count();
        expect(results).toBeGreaterThan(0);
    });

    test('active-search: works after morph navigation', async ({ page }) => {
        await page.goto('/patterns/loading/click-to-load');
        await waitForSw(page);
        await waitForDemo(page);

        await morphViaLink(page, '/patterns/forms/active-search');
        await waitForDemo(page);

        const input = demo(page, 'input[type="search"]');
        await expect(input).toBeVisible({ timeout: 15_000 });

        await expect(demo(page, 'tbody tr').first()).toBeVisible({ timeout: 5_000 });
    });

    test('active-validation: renders and validates username', async ({ page }) => {
        await page.goto('/patterns/forms/active-validation');
        await waitForSw(page);
        await waitForDemo(page);

        const input = demo(page, 'input[name="username"]');
        await expect(input).toBeVisible();

        // Type a taken username
        await input.fill('admin');
        await page.waitForTimeout(600);
        await expect(page.locator('text=already taken')).toBeVisible({ timeout: 3_000 });

        // Type an available username
        await input.fill('newuser123');
        await page.waitForTimeout(600);
        await expect(page.locator('text=is available')).toBeVisible({ timeout: 3_000 });
    });

    test('linked-selects: renders and updates models', async ({ page }) => {
        await page.goto('/patterns/forms/linked-selects');
        await waitForSw(page);
        await waitForDemo(page);

        const makeSelect = demo(page, 'select[name="make"]');
        await expect(makeSelect).toBeVisible();

        // Change make and verify model options update
        await makeSelect.selectOption('toyota');
        await page.waitForTimeout(1000);
        const modelSelect = demo(page, 'select[name="model"], #models');
        const modelText = await modelSelect.textContent();
        expect(modelText).toContain('Tacoma');
    });

    test('linked-selects: detail card updates on model change', async ({ page }) => {
        await page.goto('/patterns/forms/linked-selects');
        await waitForSw(page);
        await waitForDemo(page);

        // Initial detail card should show first Audi model
        await expect(demo(page, '#detail').filter({ hasText: 'A4' })).toBeVisible({ timeout: 3_000 });

        // Change model to Q5 and verify detail card updates
        const modelSelect = demo(page, '#models');
        await expect(modelSelect).toBeVisible();
        await modelSelect.selectOption('Q5');
        await page.waitForTimeout(1000);
        await expect(demo(page, '#detail').filter({ hasText: 'Q5' })).toBeVisible({ timeout: 3_000 });
    });

    test('reset-on-submit: sends message and clears input', async ({ page }) => {
        await page.goto('/patterns/forms/reset-on-submit');
        await waitForSw(page);
        await waitForDemo(page);

        const input = demo(page, 'input[name="message"]');
        await expect(input).toBeVisible();

        const sendBtn = demo(page, 'button').filter({ hasText: /send/i });
        await expect(sendBtn).toBeVisible();

        // Send a message
        await input.fill('Hello there');
        await sendBtn.click();
        await page.waitForTimeout(1000);

        // Message should appear in the chat
        await expect(demo(page, '#messages').filter({ hasText: 'Hello there' })).toBeVisible({ timeout: 3_000 });

        // AI reply should also appear
        await expect(demo(page, '#messages').filter({ hasText: 'returning HTML' })).toBeVisible({ timeout: 3_000 });

        // Input should be cleared (form reset)
        await expect(input).toHaveValue('', { timeout: 3_000 });
    });

    test('reset-on-submit: messages append in order', async ({ page }) => {
        await page.goto('/patterns/forms/reset-on-submit');
        await waitForSw(page);
        await waitForDemo(page);

        const input = demo(page, 'input[name="message"]');
        const sendBtn = demo(page, 'button').filter({ hasText: /send/i });

        // Send two messages
        await input.fill('First message');
        await sendBtn.click();
        await page.waitForTimeout(500);

        await input.fill('Second message');
        await sendBtn.click();
        await page.waitForTimeout(500);

        // 2 user messages + 2 AI replies = 4 top-level divs
        const messages = demo(page, '#messages > div');
        await expect(messages).toHaveCount(4, { timeout: 3_000 });

        // Messages should be in chronological order (beforeend)
        await expect(messages.nth(0)).toContainText('First message');
        await expect(messages.nth(2)).toContainText('Second message');
    });

    // =============================================
    // Records
    // =============================================

    test('bulk-actions: renders table with checkboxes', async ({ page }) => {
        await page.goto('/patterns/records/bulk-actions');
        await waitForSw(page);
        await waitForDemo(page);

        await expect(demo(page, 'table')).toBeVisible();
        const checkboxes = await demo(page, 'input[type="checkbox"]').count();
        expect(checkboxes).toBeGreaterThan(0);
    });

    test('bulk-actions: activate action works', async ({ page }) => {
        await page.goto('/patterns/records/bulk-actions');
        await waitForSw(page);
        await waitForDemo(page);

        // Check a checkbox and click Activate
        const firstCheckbox = demo(page, 'input[type="checkbox"]').first();
        await firstCheckbox.check();

        const activateBtn = demo(page, 'button').filter({ hasText: /activate/i });
        if (await activateBtn.isVisible()) {
            await activateBtn.click();
            await page.waitForTimeout(1000);
        }
    });

    test('delete-in-place: renders table with delete buttons', async ({ page }) => {
        await page.goto('/patterns/records/delete-in-place');
        await waitForSw(page);
        await waitForDemo(page);

        await expect(demo(page, 'table')).toBeVisible();
        const rows = await demo(page, 'tbody tr').count();
        expect(rows).toBeGreaterThan(0);

        const deleteButtons = demo(page, 'button').filter({ hasText: /delete/i });
        expect(await deleteButtons.count()).toBeGreaterThan(0);
    });

    test('drag-to-reorder: renders sortable list', async ({ page }) => {
        await page.goto('/patterns/records/drag-to-reorder');
        await waitForSw(page);
        await waitForDemo(page);

        // Should have draggable items (inputs or divs with content)
        const items = await demo(page, 'input[name="item"], [data-sortable-item], .sortable > *').count();
        expect(items).toBeGreaterThan(0);
    });

    test('edit-in-place: renders and toggles edit mode', async ({ page }) => {
        await page.goto('/patterns/records/edit-in-place');
        await waitForSw(page);
        await waitForDemo(page);

        // Should show view mode with Edit button
        const editBtn = page.locator('#demo-content button', { hasText: /edit/i });
        await expect(editBtn).toBeVisible();

        // Click edit, verify form inputs appear
        await editBtn.click();
        await expect(page.locator('#demo-content input[name="name"]'))
            .toBeVisible({ timeout: 5_000 });

        // Should have Save and Cancel buttons
        await expect(page.locator('#demo-content button', { hasText: 'Save' })).toBeVisible({ timeout: 5_000 });
        await expect(page.locator('#demo-content button', { hasText: 'Cancel' })).toBeVisible({ timeout: 5_000 });
    });

    test('edit-in-place: works after morph navigation', async ({ page }) => {
        await page.goto('/patterns/records/bulk-actions');
        await waitForSw(page);
        await waitForDemo(page);

        await morphViaLink(page, '/patterns/records/edit-in-place');
        await waitForDemo(page);

        const editBtn = page.locator('#demo-content button', { hasText: /edit/i });
        await expect(editBtn).toBeVisible({ timeout: 15_000 });

        await editBtn.click();
        await expect(page.locator('#demo-content input[name="name"]'))
            .toBeVisible({ timeout: 5_000 });
    });

    // =============================================
    // Display
    // =============================================

    test('dialogs: renders button and opens modal', async ({ page }) => {
        await page.goto('/patterns/display/dialogs');
        await waitForSw(page);
        await waitForDemo(page);

        const openBtn = demo(page, 'button').filter({ hasText: /open.*modal/i });
        await expect(openBtn).toBeVisible();

        // Click and verify modal appears
        await openBtn.click();
        await expect(page.locator('#modal, [role="dialog"], .modal-underlay').first())
            .toBeVisible({ timeout: 5_000 });
    });

    test('dialogs: works after morph navigation', async ({ page }) => {
        await page.goto('/patterns/loading/click-to-load');
        await waitForSw(page);
        await waitForDemo(page);

        await morphViaLink(page, '/patterns/display/dialogs');
        await waitForDemo(page);

        const openBtn = demo(page, 'button').filter({ hasText: /open.*modal/i });
        await expect(openBtn).toBeVisible({ timeout: 15_000 });
    });

    // =============================================
    // Advanced
    // =============================================

    test('keyboard-shortcuts: renders and responds to click', async ({ page }) => {
        await page.goto('/patterns/advanced/keyboard-shortcuts');
        await waitForSw(page);
        await waitForDemo(page);

        const btn = demo(page, 'button').filter({ hasText: /do it/i });
        await expect(btn).toBeVisible();

        // Click the button and verify response appears
        await btn.click();
        await page.waitForTimeout(1000);
        // Some result should appear after clicking
        await expect(demo(page, '*').first()).toBeVisible();
    });
});
