import {test as base, expect} from '@playwright/test'
import path from 'path'

const htmxPath = path.resolve(import.meta.dirname, '..', 'dist', 'htmx.js')

export {expect}

export const test = base.extend({
    // Auto-use: every test gets a page with htmx loaded
    page: async ({page}, use) => {
        await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <base href="http://localhost/">
      </head>
      <body></body>
      </html>
    `)
        await page.addScriptTag({path: htmxPath})
        await page.waitForFunction(() => typeof htmx !== 'undefined' && htmx.version)
        await use(page)
    },

    // Inject HTML into body and init htmx
    html: async ({page}, use) => {
        await use(async (markup) => {
            await page.evaluate((h) => {
                document.body.innerHTML = h
                htmx.init(document.body)
            }, markup)
        })
    },

    // find(selector) — shorthand for page.locator(selector)
    //
    // Returns a Playwright Locator with one addition: .submit() calls
    // requestSubmit() on the located form element. Unlike form.submit(),
    // requestSubmit() fires the 'submit' event, which is what htmx listens for.
    //
    //   await find('form').submit()
    //   await find('form').click()    // standard Locator methods work too
    //
    find: async ({page}, use) => {
        await use((selector) => {
            const locator = page.locator(selector)
            locator.submit = () => locator.evaluate(el => el.requestSubmit())
            return locator
        })
    },

    // confirm(result) — stub window.confirm to return the given value
    //
    //   await confirm(true)   // next confirm() call returns true
    //   await confirm(false)  // next confirm() call returns false
    //
    confirm: async ({evaluate}, use) => {
        await use(async (result) => {
            await evaluate((r) => window.confirm = () => r, result)
        })
    },

    // evaluate(fn) — shorthand for page.evaluate(fn)
    //
    // Runs a function in the browser. Useful for testing htmx APIs directly:
    //   const match = await evaluate(() => htmx.find('body') === document.body)
    //
    evaluate: async ({page}, use) => {
        await use((...args) => page.evaluate(...args))
    },

    // Shared request tracking — populated by mock(), read via requests fixture
    _trackedRequests: async ({}, use) => {
        await use([])
    },

    // mock(method, url, body) — intercept requests and respond with mock data
    mock: async ({page, _trackedRequests}, use) => {
        await use(async (method, url, body, options = {}) => {
            const pattern = url.startsWith('*') ? url : `**${url}`
            await page.route(pattern, route => {
                if (route.request().method() !== method.toUpperCase()) {
                    return route.fallback()
                }
                _trackedRequests.push(route.request())
                return route.fulfill({
                    status: options.status ?? 200,
                    contentType: options.contentType ?? 'text/html',
                    body,
                })
            })
        })
    },

    // requests.last / requests.all — inspect requests intercepted by mock()
    //
    // Use after a DOM assertion (which auto-waits for the request cycle to complete):
    //   await expect(find('body')).toHaveText('Clicked!')
    //   expect(requests.last.url()).toBe('http://localhost/test')
    //
    // For hx-swap="none" (no DOM change to wait on), use expect.poll:
    //   await expect.poll(() => requests.last?.method()).toBe('POST')
    //
    requests: async ({_trackedRequests}, use) => {
        await use({
            get last() { return _trackedRequests[_trackedRequests.length - 1] ?? null },
            get all() { return [..._trackedRequests] },
        })
    },
})
