import { test, expect, TOP_LEVEL_PAGES } from './_fixtures';

const KNOWN_ERRORS = [
    'init is not defined',
    'favicon',
];

function isKnown(msg: string): boolean {
    return KNOWN_ERRORS.some(known => msg.includes(known));
}

function collectErrors(page: any): string[] {
    const errors: string[] = [];
    page.on('pageerror', (err: Error) => errors.push(`[pageerror] ${err.message}`));
    page.on('console', (msg: any) => {
        if (msg.type() === 'error') errors.push(`[console.error] ${msg.text()}`);
    });
    return errors;
}

const SAMPLE_PAGES = [
    '/',
    '/docs',
    '/reference',
    '/patterns',
    '/essays',
    '/about',
    '/reference/attributes/hx-get',
    '/reference/attributes/hx-post',
    '/patterns/loading/click-to-load',
];

test.describe('Console errors', () => {
    for (const path of SAMPLE_PAGES) {
        test(`no console errors on ${path}`, async ({ page }) => {
            const errors = collectErrors(page);

            await page.goto(path, { waitUntil: 'networkidle' });

            const realErrors = errors.filter(e => !isKnown(e));
            expect(realErrors).toEqual([]);
        });
    }

    test('no hyperscript parse errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', (msg: any) => {
            if (msg.text().includes('parse error')) {
                errors.push(msg.text());
            }
        });

        await page.goto('/', { waitUntil: 'networkidle' });

        expect(errors).toEqual([]);
    });

    test('no console errors after morph navigation', async ({ page }) => {
        await page.goto('/reference/attributes/hx-get', { waitUntil: 'networkidle' });

        const errors = collectErrors(page);

        const sidebarToggle = page.locator('label[for="sidebar-toggle-mobile"]');
        if (await sidebarToggle.isVisible()) {
            await sidebarToggle.click();
        }
        await page.locator('#sidebar-nav a[href="/reference/attributes/hx-post"]').click();

        await expect(page).toHaveURL(/hx-post/);
        await page.waitForTimeout(500);

        const realErrors = errors.filter(e => !isKnown(e));
        expect(realErrors).toEqual([]);
    });
});
