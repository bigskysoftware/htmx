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

const DEMO_A = '/patterns/loading/click-to-load';
const DEMO_B = '/patterns/loading/lazy-load';
const STUB = '/patterns/real-time/polling';

// Serial: SW state leaks between parallel workers
test.describe.serial('Pattern demos', () => {
    test('renders on direct navigation', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto(DEMO_A);
        await waitForSw(page);
        await waitForDemo(page);

        expect(errors).toEqual([]);
    });

    test('renders after reload', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto(DEMO_A);
        await waitForSw(page);
        await waitForDemo(page);

        await page.reload();
        await waitForSw(page);
        await waitForDemo(page);

        expect(errors).toEqual([]);
    });

    test('renders after morph away then browser back', async ({ page }) => {
        await page.goto(DEMO_A);
        await waitForSw(page);
        await waitForDemo(page);

        await page.click('nav a[href="/about"]');
        await expect(page).toHaveURL('/about', { timeout: 10_000 });

        await page.goBack();
        await expect(page).toHaveURL(DEMO_A, { timeout: 10_000 });
        await waitForDemo(page);
    });

    test('renders after morph between demo pages and history nav', async ({ page }) => {
        await page.goto(DEMO_A);
        await waitForSw(page);
        await waitForDemo(page);

        // Morph to demo B
        await page.click(`a[href="${DEMO_B}"]`);
        await expect(page).toHaveURL(DEMO_B, { timeout: 10_000 });
        await waitForDemo(page);

        // Back to A
        await page.goBack();
        await expect(page).toHaveURL(DEMO_A, { timeout: 10_000 });
        await waitForDemo(page);

        // Forward to B
        await page.goForward();
        await expect(page).toHaveURL(DEMO_B, { timeout: 10_000 });
        await waitForDemo(page);
    });

    test('shows placeholder on pages without demos', async ({ page }) => {
        await page.goto(STUB);
        await expect(page.locator('[data-demo-container]')).toBeVisible();

        const content = await page.evaluate(() => {
            const el = document.querySelector('#demo-content');
            return el ? getComputedStyle(el, '::before').content : null;
        });
        expect(content).toContain('Demo coming soon');
    });

    test('no errors on pages without demos', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto(STUB);
        await expect(page.locator('.prose')).toBeVisible();

        expect(errors).toEqual([]);
    });
});
