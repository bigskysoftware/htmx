import {defineConfig} from '@playwright/test'

export default defineConfig({
    testDir: '.',
    testMatch: '**/*.mjs',
    testIgnore: ['fixtures.mjs'],
    use: {},
    projects: [
        {name: 'chromium', use: {browserName: 'chromium'}},
    ],
    workers: process.env.CI ? undefined : 1,
    retries: process.env.CI ? 1 : 0,
    reporter: [['list']],
})
