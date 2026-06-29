import { test, expect } from './_fixtures';

async function checkLinks(hrefs: (string | null)[], request: any) {
    const internal = hrefs.filter((h): h is string => !!h && !h.startsWith('#') && !h.startsWith('http'));
    const results = await Promise.all(
        internal.map(async (href) => {
            const response = await request.get(href);
            return { href, status: response.status() };
        })
    );
    const broken = results.filter(r => r.status === 404);
    expect(broken, `Broken links: ${broken.map(r => r.href).join(', ')}`).toEqual([]);
}

test.describe('Internal link integrity', () => {
    test('sidebar links resolve (docs)', async ({ page, request }) => {
        await page.goto('/docs');

        const hrefs = await page.locator('#sidebar-nav a[href]').evaluateAll(
            (els: HTMLAnchorElement[]) => els.map(el => el.getAttribute('href'))
        );

        expect(hrefs.length).toBeGreaterThan(10);
        await checkLinks(hrefs, request);
    });

    test('sidebar links resolve (reference)', async ({ page, request }) => {
        await page.goto('/reference/attributes/hx-get');

        const hrefs = await page.locator('#sidebar-nav a[href]').evaluateAll(
            (els: HTMLAnchorElement[]) => els.map(el => el.getAttribute('href'))
        );

        expect(hrefs.length).toBeGreaterThan(10);
        await checkLinks(hrefs, request);
    });

    test('breadcrumb links resolve', async ({ page, request }) => {
        await page.goto('/reference/attributes/hx-get');

        const hrefs = await page.locator('nav[aria-label="Breadcrumb"] a[href]').evaluateAll(
            (els: HTMLAnchorElement[]) => els.map(el => el.getAttribute('href'))
        );

        await checkLinks(hrefs, request);
    });

    test('pagination links resolve', async ({ page, request }) => {
        await page.goto('/reference/attributes/hx-get');

        const hrefs = await page.locator('nav[aria-label="Pagination"] a[href]').evaluateAll(
            (els: HTMLAnchorElement[]) => els.map(el => el.getAttribute('href'))
        );

        await checkLinks(hrefs, request);
    });
});
