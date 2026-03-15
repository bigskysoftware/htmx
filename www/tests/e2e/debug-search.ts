import { test, expect } from './_fixtures';
test('debug search indicator', async ({ page }) => {
    await page.goto('/patterns/forms/active-search');
    await page.waitForTimeout(3000);
    
    const spinner = page.locator('#search-spinner');
    const exists = await spinner.count();
    console.log('SPINNER_EXISTS:', exists);
    
    if (exists) {
        const classes = await spinner.getAttribute('class');
        console.log('SPINNER_CLASSES:', classes);
        const styles = await spinner.evaluate(el => {
            const cs = getComputedStyle(el);
            return { opacity: cs.opacity, display: cs.display, visibility: cs.visibility, width: cs.width, height: cs.height };
        });
        console.log('SPINNER_STYLES:', JSON.stringify(styles));
    }

    // Type to trigger a search
    const input = page.locator('#demo-content input[type="search"]');
    await input.fill('V');
    
    // Check spinner immediately while request is in flight
    await page.waitForTimeout(50);
    if (exists) {
        const classes2 = await spinner.getAttribute('class');
        console.log('SPINNER_DURING_REQUEST:', classes2);
        const styles2 = await spinner.evaluate(el => getComputedStyle(el).opacity);
        console.log('SPINNER_OPACITY_DURING:', styles2);
    }
});
