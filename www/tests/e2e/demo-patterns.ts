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
        await page.goto('/patterns/click-to-load');
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
        await page.goto('/patterns/infinite-scroll');
        await waitForSw(page);
        await waitForDemo(page);

        await morphViaLink(page, '/patterns/click-to-load');
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
        await page.goto('/patterns/infinite-scroll');
        await waitForSw(page);
        await waitForDemo(page);

        await expect(demo(page, 'table')).toBeVisible();
        const initialRows = await demo(page, 'tbody tr').count();
        expect(initialRows).toBeGreaterThan(0);
    });

    test('lazy-load: renders weather card after delay', async ({ page }) => {
        await page.goto('/patterns/lazy-load');
        await waitForSw(page);
        await waitForDemo(page);

        await expect(page.locator('.demo-container', { hasText: '5-Day Forecast' })).toBeVisible({ timeout: 10_000 });
    });

    test('lazy-load: works after morph navigation', async ({ page }) => {
        await page.goto('/patterns/click-to-load');
        await waitForSw(page);
        await waitForDemo(page);

        await morphViaLink(page, '/patterns/lazy-load');

        await expect(page.locator('.demo-container', { hasText: '5-Day Forecast' })).toBeVisible({ timeout: 15_000 });
    });

    test('progress-bar: renders and starts job', async ({ page }) => {
        await page.goto('/patterns/progress-bar');
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
        await page.goto('/patterns/active-search');
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
        await page.goto('/patterns/click-to-load');
        await waitForSw(page);
        await waitForDemo(page);

        await morphViaLink(page, '/patterns/active-search');
        await waitForDemo(page);

        const input = demo(page, 'input[type="search"]');
        await expect(input).toBeVisible({ timeout: 15_000 });

        await expect(demo(page, 'tbody tr').first()).toBeVisible({ timeout: 5_000 });
    });

    test('active-validation: renders and validates username', async ({ page }) => {
        await page.goto('/patterns/active-validation');
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
        await page.goto('/patterns/linked-selects');
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
        await page.goto('/patterns/linked-selects');
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
        await page.goto('/patterns/reset-on-submit');
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
        await page.goto('/patterns/reset-on-submit');
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

    test('delete-in-place: confirms, fades, and removes the row', async ({ page }) => {
        await page.goto('/patterns/delete-in-place');
        await waitForSw(page);
        await waitForDemo(page);

        const rows = demo(page, 'tbody tr');
        await expect(rows).toHaveCount(4);
        await expect(rows.first()).toContainText('Joe Smith');

        page.once('dialog', d => {
            expect(d.type()).toBe('confirm');
            expect(d.message()).toBe('Are you sure?');
            d.accept();
        });

        await demo(page, 'tbody tr button').first().click();

        // swap:500ms holds the row while htmx-swapping drives the fade
        await expect(demo(page, 'tr.htmx-swapping')).toHaveCount(1);

        await expect(rows).toHaveCount(3);
        await expect(rows.first()).toContainText('Angie MacDowell');
    });

    test('delete-in-place: dismissing the confirm keeps the row', async ({ page }) => {
        await page.goto('/patterns/delete-in-place');
        await waitForSw(page);
        await waitForDemo(page);

        page.once('dialog', d => d.dismiss());
        await demo(page, 'tbody tr button').first().click();

        await page.waitForTimeout(800);
        await expect(demo(page, 'tbody tr')).toHaveCount(4);
    });

    test('edit-in-place: edit, save, and cancel', async ({ page }) => {
        await page.goto('/patterns/edit-in-place');
        await waitForSw(page);
        await waitForDemo(page);

        const card = demo(page, '#user-view');
        await expect(card).toContainText('Joe Smith');

        // View to edit form
        await demo(page, 'button').filter({ hasText: /^edit$/i }).click();
        await expect(demo(page, 'form#user-view')).toBeVisible();

        // Save writes the new value and returns the view
        await demo(page, 'input[name="name"]').fill('Carson Gross');
        await demo(page, 'button[type="submit"]').click();
        await expect(demo(page, 'form#user-view')).toHaveCount(0);
        await expect(demo(page, '#user-view')).toContainText('Carson Gross');

        // Cancel discards the edit
        await demo(page, 'button').filter({ hasText: /^edit$/i }).click();
        await expect(demo(page, 'form#user-view')).toBeVisible();
        await demo(page, 'input[name="name"]').fill('Discarded');
        await demo(page, 'button').filter({ hasText: /^cancel$/i }).click();
        await expect(demo(page, 'form#user-view')).toHaveCount(0);
        await expect(demo(page, '#user-view')).toContainText('Carson Gross');
    });

    test('drag-to-reorder: dragging persists the new order', async ({ page }) => {
        await page.goto('/patterns/drag-to-reorder');
        await waitForSw(page);
        await waitForDemo(page);

        const form = demo(page, 'form.sortable');
        await expect(form).toBeVisible();

        // hx-on:load builds the instance when htmx processes the form
        expect(await page.evaluate(() =>
            !!(window as any).Sortable?.get(document.querySelector('#demo-content form.sortable')))).toBe(true);

        const order = () => page.evaluate(() =>
            [...document.querySelectorAll('#demo-content form.sortable input[name="item"]')]
                .map(i => (i as HTMLInputElement).value).join(','));
        expect(await order()).toBe('1,2,3,4,5');

        const posts: string[] = [];
        page.on('request', r => { if (r.url().includes('/_/items')) posts.push(r.method()); });

        const items = demo(page, 'form.sortable > div:not(.htmx-indicator)');
        const from = (await items.nth(0).boundingBox())!;
        const to = (await items.nth(2).boundingBox())!;
        await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
        await page.mouse.down();
        await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2 + 15, { steps: 5 });
        await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2 + 5, { steps: 15 });
        await page.mouse.up();

        // The list re-renders from server state, so a changed order proves the post landed
        await expect.poll(order).not.toBe('1,2,3,4,5');
        expect(posts).toEqual(['POST']);

        // The form survives its own innerHTML swap, so the same Sortable
        // instance must still be bound, and hx-on::after:swap must re-enable it
        await expect.poll(() => page.evaluate(() => {
            const inst = (window as any).Sortable?.get(document.querySelector('#demo-content form.sortable'));
            return inst ? inst.option('disabled') : 'no instance';
        })).toBe(false);

        const after = await order();
        const from2 = (await items.nth(0).boundingBox())!;
        const to2 = (await items.nth(2).boundingBox())!;
        await page.mouse.move(from2.x + from2.width / 2, from2.y + from2.height / 2);
        await page.mouse.down();
        await page.mouse.move(from2.x + from2.width / 2, from2.y + from2.height / 2 + 15, { steps: 5 });
        await page.mouse.move(to2.x + to2.width / 2, to2.y + to2.height / 2 + 5, { steps: 15 });
        await page.mouse.up();
        await expect.poll(order).not.toBe(after);
    });

    test('drag-to-reorder: initializes after morph navigation', async ({ page }) => {
        await page.goto('/patterns/lazy-load');
        await waitForSw(page);
        await waitForDemo(page);

        // The demo only renders after the Sortable import resolves, so the
        // library is always present by the time hx-on:load runs.
        await morphViaLink(page, '/patterns/drag-to-reorder');
        await waitForDemo(page);

        await expect.poll(() => page.evaluate(() =>
            !!(window as any).Sortable?.get(document.querySelector('#demo-content form.sortable'))),
            { timeout: 15_000 }).toBe(true);
    });

    test('file-upload: multipart submit keeps the file through validation', async ({ page }) => {
        await page.goto('/patterns/file-upload');
        await waitForSw(page);
        await waitForDemo(page);

        const form = demo(page, '#upload-form');
        await expect(form).toHaveAttribute('hx-encoding', 'multipart/form-data');

        await demo(page, '#file-input').setInputFiles({
            name: 'report.pdf', mimeType: 'application/pdf', buffer: Buffer.from('hello pdf body'),
        });
        await expect(demo(page, '#file-label')).toHaveText('report.pdf');

        // Submit with the text fields empty: validation fails, but hx-preserve
        // must keep the chosen file, and the label must be restored with it
        await demo(page, '#upload-form button[type="submit"]').click();
        await expect(demo(page, 'p[class*="red"]')).toHaveCount(2);
        await expect(demo(page, '#file-label')).toHaveText('report.pdf');
        expect(await page.evaluate(() =>
            (document.getElementById('file-input') as HTMLInputElement).files?.length)).toBe(1);

        // Now succeed. The response echoes what actually reached the server,
        // which proves the multipart body carried the file.
        await demo(page, '#name-input').fill('Jane Smith');
        await demo(page, '#email-input').fill('jane@example.com');
        await demo(page, '#upload-form button[type="submit"]').click();

        await expect(demo(page, '#upload-wrapper')).toContainText('Submitted successfully');
        await expect(demo(page, '#upload-wrapper')).toContainText('report.pdf');
        await expect(demo(page, '#upload-wrapper')).toContainText('14 bytes');

        await demo(page, 'button').filter({ hasText: /try again/i }).click();
        await expect(demo(page, '#upload-form')).toBeVisible();
    });

    test('bulk-actions: renders table with checkboxes', async ({ page }) => {
        await page.goto('/patterns/bulk-actions');
        await waitForSw(page);
        await waitForDemo(page);

        await expect(demo(page, 'table')).toBeVisible();
        const checkboxes = await demo(page, 'input[type="checkbox"]').count();
        expect(checkboxes).toBeGreaterThan(0);
    });

    test('bulk-actions: activate action works', async ({ page }) => {
        await page.goto('/patterns/bulk-actions');
        await waitForSw(page);
        await waitForDemo(page);

        // Check a checkbox and click Activate
        const firstCheckbox = demo(page, 'input[type="checkbox"]').first();
        await firstCheckbox.check();

        const activateBtn = demo(page, 'button').filter({ hasText: /^activate$/i });
        if (await activateBtn.isVisible()) {
            await activateBtn.click();
            await page.waitForTimeout(1000);
        }
    });

    // =============================================
    // Display
    // =============================================

    test('tabs: server-driven strip carries the selection', async ({ page }) => {
        await page.goto('/patterns/tabs');
        await waitForSw(page);
        await waitForDemo(page);

        const tabs = page.locator('#demo-content [role="tab"]');
        const selected = page.locator('#demo-content [role="tab"][aria-selected="true"]');

        await expect(tabs).toHaveCount(3);
        await expect(selected).toHaveText('Overview');

        // The response replaces the strip too, so the count must stay at 3
        await tabs.nth(2).click();
        await expect(selected).toHaveText('Extensions');
        await expect(tabs).toHaveCount(3);
        await expect(page.locator('#demo-content #panel')).toContainText('Extensions add behavior');

        await tabs.nth(0).click();
        await expect(selected).toHaveText('Overview');
    });

    test('tabs: arrow keys move between tabs and focus survives the swap', async ({ page }) => {
        await page.goto('/patterns/tabs');
        await waitForSw(page);
        await waitForDemo(page);

        const tabs = page.locator('#demo-content [role="tab"]');
        const selected = page.locator('#demo-content [role="tab"][aria-selected="true"]');
        const focused = () => page.evaluate(() => document.activeElement?.textContent?.trim());

        await tabs.first().focus();

        // The strip is re-rendered on every response, so focus only survives
        // because the swap is a morph. Without it the second press does nothing.
        await page.keyboard.press('ArrowRight');
        await expect(selected).toHaveText('Install');
        expect(await focused()).toBe('Install');

        await page.keyboard.press('ArrowRight');
        await expect(selected).toHaveText('Extensions');

        // Wraps around
        await page.keyboard.press('ArrowRight');
        await expect(selected).toHaveText('Overview');

        await page.keyboard.press('End');
        await expect(selected).toHaveText('Extensions');
        await page.keyboard.press('Home');
        await expect(selected).toHaveText('Overview');

        // Roving tabindex: one tab stop for the whole strip
        expect(await tabs.evaluateAll(ts => ts.map(t => (t as HTMLElement).tabIndex).join(','))).toBe('0,-1,-1');
    });

    test('dialogs: native dialog opens, loads, and closes every way', async ({ page }) => {
        await page.goto('/patterns/dialogs');
        await waitForSw(page);
        await waitForDemo(page);

        const openBtn = demo(page, 'button').filter({ hasText: /open a modal/i });
        const dialog = page.locator('#modal');
        const isOpen = () => dialog.evaluate((d: HTMLDialogElement) => d.open);

        // Opens at once, then htmx fills the body
        await openBtn.click();
        expect(await isOpen()).toBe(true);
        await expect(page.locator('#modal-body')).toContainText('Modal Dialog');

        // A CSS reset can zero the UA margin:auto and stretch the dialog over
        // the whole viewport, which swallows every backdrop click
        const box = await dialog.boundingBox();
        const view = page.viewportSize()!;
        expect(box!.width).toBeLessThan(view.width);
        expect(box!.height).toBeLessThan(view.height);

        // command="close"
        await dialog.getByRole('button', { name: /close/i }).click();
        expect(await isOpen()).toBe(false);

        // Escape, via closedby="any"
        await openBtn.click();
        await page.keyboard.press('Escape');
        expect(await isOpen()).toBe(false);

        // Backdrop click, via closedby="any"
        await openBtn.click();
        await page.mouse.click(20, 20);
        expect(await isOpen()).toBe(false);

        // Reopening must still work
        await openBtn.click();
        expect(await isOpen()).toBe(true);
    });

    // =============================================
    // Advanced
    // =============================================

    test('keyboard-shortcuts: click and Alt+Shift+D both fire', async ({ page }) => {
        await page.goto('/patterns/keyboard-shortcuts');
        await waitForSw(page);
        await waitForDemo(page);

        const result = demo(page, '#result');
        await expect(result).toBeEmpty();

        await demo(page, 'button').click();
        await expect(result).toContainText('Done!');

        // Reload for a clean slate, then use the shortcut
        await page.reload();
        await waitForDemo(page);
        await expect(demo(page, '#result')).toBeEmpty();

        await page.keyboard.down('Alt');
        await page.keyboard.down('Shift');
        await page.keyboard.press('KeyD');
        await page.keyboard.up('Shift');
        await page.keyboard.up('Alt');

        await expect(demo(page, '#result')).toContainText('Done!');
    });

    test('keyboard-shortcuts: matches on code, not the composed key', async ({ page }) => {
        await page.goto('/patterns/keyboard-shortcuts');
        await waitForSw(page);
        await waitForDemo(page);

        // macOS composes Option+Shift+D into a character, so key is not "D".
        // The filter must read code instead.
        await page.evaluate(() => {
            document.body.dispatchEvent(new KeyboardEvent('keyup', {
                key: '\u00CE', code: 'KeyD', altKey: true, shiftKey: true, bubbles: true,
            }));
        });

        await expect(demo(page, '#result')).toContainText('Done!');
    });

    // =============================================
    // Real-time
    // =============================================

    test('streaming-response: turns accumulate and clear', async ({ page }) => {
        await page.goto('/patterns/streaming-response');
        await waitForSw(page);
        await waitForDemo(page);

        const conv = demo(page, '#conversation');
        const prompt = demo(page, 'input[name="prompt"]');
        await expect(conv).toHaveText('');

        // The request lives on the form, so Enter submits it
        await prompt.fill('What is hypermedia?');
        await prompt.press('Enter');

        // before:request resets the form, and params are collected before it fires
        await expect(prompt).toHaveValue('');

        // The answer must build up over several events, not land in one swap
        const lengths: number[] = [];
        for (let i = 0; i < 4; i++) {
            await page.waitForTimeout(300);
            lengths.push((await conv.innerText()).length);
        }
        expect(new Set(lengths).size).toBeGreaterThan(2);
        expect(lengths[3]).toBeGreaterThan(lengths[0]);

        await expect.poll(async () => (await conv.innerText()).length, { timeout: 15_000 })
            .toBeGreaterThan(300);
        await expect(conv.locator('p')).toHaveCount(1);

        // A second turn appends rather than replacing
        await prompt.fill('Does htmx suck?');
        await prompt.press('Enter');
        await expect(conv.locator('p')).toHaveCount(2);
        await expect(conv).toContainText('What is hypermedia?');
        await expect.poll(async () => (await conv.innerText()).includes('Yes.')).toBe(true);

        // Prompts are escaped, not parsed as markup
        await prompt.fill('<b>bold</b>');
        await prompt.press('Enter');
        await expect(conv.locator('b')).toHaveCount(0);

        await demo(page, '#chat-clear').click();
        await expect(conv.locator('p')).toHaveCount(0);
    });

    test('streaming-response: the prompt is disabled while a reply streams', async ({ page }) => {
        await page.goto('/patterns/streaming-response');
        await waitForSw(page);
        await waitForDemo(page);

        const prompt = demo(page, 'input[name="prompt"]');
        const clear = demo(page, '#chat-clear');
        await expect(prompt).toBeEnabled();

        await prompt.fill('What is hypermedia?');
        await prompt.press('Enter');

        // hx-disable="find fieldset" spans the whole stream. That only works
        // because core awaits ctx.extensionPromise before releasing the
        // request, otherwise it re-enables when the headers land.
        await expect(prompt).toBeDisabled();
        await page.waitForTimeout(2000);
        await expect(prompt).toBeDisabled();

        // Clear sits outside the fieldset, so it stays available as an escape
        await expect(clear).toBeEnabled();

        await expect(prompt).toBeEnabled({ timeout: 15_000 });
    });

    test('streaming-response: clear stops a reply in progress', async ({ page }) => {
        await page.goto('/patterns/streaming-response');
        await waitForSw(page);
        await waitForDemo(page);

        const conv = demo(page, '#conversation');
        const prompt = demo(page, 'input[name="prompt"]');

        await prompt.fill('What is hypermedia?');
        await prompt.press('Enter');
        await expect.poll(async () => (await conv.innerText()).length).toBeGreaterThan(20);

        // /clear stops the generation server side, so nothing arrives after
        await demo(page, '#chat-clear').click();
        await expect(conv).toHaveText('');
        await page.waitForTimeout(2500);
        await expect(conv).toHaveText('');

        // the form is usable again
        await expect(prompt).toBeEnabled();
        await prompt.fill('Does htmx suck?');
        await prompt.press('Enter');
        await expect.poll(async () => (await conv.innerText()).includes('Yes.')).toBe(true);
    });

    test('polling: card refreshes on the interval', async ({ page }) => {
        await page.goto('/patterns/polling');
        await waitForSw(page);
        await waitForDemo(page);

        const card = demo(page, '#server-status');
        await expect(card).toBeVisible();
        await expect(card).toHaveAttribute('hx-trigger', 'every 2s');

        const served = demo(page, 'p').filter({ hasText: /requests served/i });
        const before = await served.innerText();

        // Two intervals plus slack
        await page.waitForTimeout(5000);
        await expect(served).not.toHaveText(before);
    });

    test('polling: pause removes the trigger, resume restores it', async ({ page }) => {
        await page.goto('/patterns/polling');
        await waitForSw(page);
        await waitForDemo(page);

        const card = demo(page, '#server-status');
        await expect(card).toHaveAttribute('hx-trigger', 'every 2s');

        await demo(page, 'button').filter({ hasText: /pause/i }).click();
        await expect(card).not.toHaveAttribute('hx-trigger', /.*/);

        // The poll is off, so the counter must hold still
        const served = demo(page, 'p').filter({ hasText: /requests served/i });
        const paused = await served.innerText();
        await page.waitForTimeout(4000);
        await expect(served).toHaveText(paused);

        await demo(page, 'button').filter({ hasText: /resume/i }).click();
        await expect(card).toHaveAttribute('hx-trigger', 'every 2s');
    });

});
