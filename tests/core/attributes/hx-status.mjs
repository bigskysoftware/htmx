import {test, expect} from '../../fixtures.mjs'

test.describe('hx-status', () => {
    test('applies swap override for exact status match', async ({html, find, page}) => {
        await page.route('**/test', route => {
            route.fulfill({status: 404, contentType: 'text/html', body: '<div id="result">Error</div>'})
        })
        await html(`
            <div id="target"></div>
            <button hx-get="/test" hx-target="#target" hx-status:404="swap:outerHTML">Click</button>
        `)
        await find('button').click()
        await expect(find('#result')).toHaveText('Error')
    })

    test('applies swap override for wildcard pattern', async ({html, find, page}) => {
        await page.route('**/test', route => {
            route.fulfill({status: 500, contentType: 'text/html', body: '<div>Server Error</div>'})
        })
        await html(`
            <div id="target"></div>
            <button hx-get="/test" hx-target="#target" hx-status:5xx="swap:innerHTML">Click</button>
        `)
        await find('button').click()
        await expect(find('#target')).toHaveText('Server Error')
    })

    test('can change target based on status', async ({html, find, page}) => {
        await page.route('**/test', route => {
            route.fulfill({status: 404, contentType: 'text/html', body: '<span>Not Found</span>'})
        })
        await html(`
            <div id="success"></div>
            <div id="error"></div>
            <button hx-get="/test" hx-target="#success" hx-status:404="target:#error">Click</button>
        `)
        await find('button').click()
        await expect(find('#error')).toHaveText('Not Found')
        await expect(find('#success')).toHaveText('')
    })

    test('can select different content based on status', async ({html, find, page}) => {
        await page.route('**/test', route => {
            route.fulfill({status: 422, contentType: 'text/html', body: '<div id="success-msg">Success!</div><div id="error-msg">Failed!</div>'})
        })
        await html(`
            <div id="target"></div>
            <button hx-get="/test" hx-target="#target" hx-status:422="select:#error-msg">Click</button>
        `)
        await find('button').click()
        await expect(find('#target')).toContainText('Failed!')
    })

    test('does not apply when status does not match', async ({html, find, page}) => {
        await page.route('**/test', route => {
            route.fulfill({status: 200, contentType: 'text/html', body: '<div>Success</div>'})
        })
        await html(`
            <div id="target"></div>
            <button hx-get="/test" hx-target="#target" hx-status:404="swap:none">Click</button>
        `)
        await find('button').click()
        await expect(find('#target')).toHaveText('Success')
    })

    test('can set swap to none on error', async ({html, find, page, evaluate}) => {
        await page.route('**/test', route => {
            route.fulfill({status: 500, contentType: 'text/html', body: '<div>Error Content</div>'})
        })
        await html(`
            <div id="target">Original</div>
            <button hx-get="/test" hx-target="#target" hx-status:500="swap:none">Click</button>
        `)
        await find('button').click()
        await evaluate(() => new Promise(r => setTimeout(r, 100)))
        await expect(find('#target')).toHaveText('Original')
    })

    test('works with 2-digit wildcard pattern', async ({html, find, page}) => {
        await page.route('**/test', route => {
            route.fulfill({status: 503, contentType: 'text/html', body: '<div>Server Error</div>'})
        })
        await html(`
            <div id="target"></div>
            <button hx-get="/test" hx-target="#target" hx-status:50x="swap:innerHTML">Click</button>
        `)
        await find('button').click()
        await expect(find('#target')).toHaveText('Server Error')
    })
})
