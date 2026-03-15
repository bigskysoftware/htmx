import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    testMatch: '*.ts',
    testIgnore: '_fixtures.ts',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? 'github' : 'list',
    timeout: 10_000,

    use: {
        baseURL: 'http://localhost:4321',
        trace: 'on-first-retry',
        ...devices['Desktop Chrome'],
    },

    webServer: {
        command: 'bun run preview',
        port: 4321,
        reuseExistingServer: !process.env.CI,
    },
});
