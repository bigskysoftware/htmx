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

// Inject a visible boosted link and click it to trigger morph navigation
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

const DEMO_A = '/patterns/loading/click-to-load';
const DEMO_B = '/patterns/loading/lazy-load';
const STUB = '/patterns/real-time/polling';

// Serial: SW state leaks between parallel workers
test.describe.serial('Pattern demos', () => {
    test.setTimeout(30_000);

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

    test('renders after morph from non-demo page', async ({ page }) => {
        await page.goto('/about');
        await expect(page.locator('.prose')).toBeVisible({ timeout: 10_000 });

        await morphViaLink(page, DEMO_A);
        await waitForSw(page);

        // Check for pattern-specific content, not just any demo content
        await expect(page.locator('#demo-content button', { hasText: /show more/i }))
            .toBeVisible({ timeout: 15_000 });
    });

    test('renders after morph between same-group demos', async ({ page }) => {
        await page.goto('/patterns/loading/infinite-scroll');
        await waitForSw(page);
        await waitForDemo(page);

        // Morph to click-to-load via sidebar link
        await page.click('a[href="/patterns/loading/click-to-load"]');
        await expect(page).toHaveURL('/patterns/loading/click-to-load', { timeout: 10_000 });

        // Verify click-to-load specific content appears (not stale infinite-scroll)
        await expect(page.locator('#demo-content button', { hasText: /show more/i }))
            .toBeVisible({ timeout: 15_000 });
    });

    test('renders after morph between cross-group demos', async ({ page }) => {
        await page.goto(DEMO_A);
        await waitForSw(page);
        await waitForDemo(page);

        // Cross-group navigation (Loading → Forms) via injected link
        await morphViaLink(page, '/patterns/forms/active-search');

        await expect(page.locator('#demo-content input[type="search"]'))
            .toBeVisible({ timeout: 15_000 });
    });

    test('Load More works after morph navigation', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto('/patterns/loading/infinite-scroll');
        await waitForSw(page);
        await waitForDemo(page);

        // Morph to click-to-load
        await page.click('a[href="/patterns/loading/click-to-load"]');
        await expect(page).toHaveURL('/patterns/loading/click-to-load', { timeout: 10_000 });

        const loadMore = page.locator('#demo-content button', { hasText: /show more/i });
        await expect(loadMore).toBeVisible({ timeout: 15_000 });

        const initialCount = await page.locator('#demo-content #comments > div').count();
        await loadMore.click();
        await page.waitForTimeout(1500);
        const newCount = await page.locator('#demo-content #comments > div').count();
        expect(newCount).toBeGreaterThan(initialCount);
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

    test('no demo container on stub pages', async ({ page }) => {
        await page.goto(STUB);
        await expect(page.locator('.prose')).toBeVisible();

        // Stub pages don't have a demo container (it's author-placed, not layout-injected)
        const demoCount = await page.locator('#demo-content, .demo-container').count();
        expect(demoCount).toBe(0);
    });

    test('no errors on pages without demos', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto(STUB);
        await expect(page.locator('.prose')).toBeVisible();

        expect(errors).toEqual([]);
    });
});
