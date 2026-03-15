import { chromium } from '@playwright/test';

const PAGES = [
    { url: '/docs', name: 'docs-index', width: 1440 },
    { url: '/docs', name: 'docs-index-wide', width: 1920 },
    { url: '/reference', name: 'reference-index', width: 1440 },
    { url: '/', name: 'landing', width: 1440 },
];

(async () => {
    const browser = await chromium.launch();

    for (const { url, name, width } of PAGES) {
        const context = await browser.newContext({
            viewport: { width, height: 900 },
            colorScheme: 'dark',
        });
        const page = await context.newPage();
        await page.goto(`http://localhost:4321${url}`, { waitUntil: 'networkidle' });
        await page.screenshot({ path: `/tmp/screenshot-${name}.png`, fullPage: false });
        await page.close();
        await context.close();
    }

    await browser.close();
    console.log('Screenshots saved to /tmp/screenshot-*.png');
})();
