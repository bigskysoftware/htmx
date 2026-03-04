import {test, expect} from '../../fixtures.mjs'

test.describe('hx-indicator', () => {
    test('adds htmx-request class with no explicit indicator', async ({html, find, page}) => {
        let fulfill
        await page.route('**/test', route => {
            fulfill = () => route.fulfill({body: 'Done', contentType: 'text/html'})
        })
        await html('<button hx-get="/test">Click</button>')
        await find('button').click()
        await expect(find('button')).toHaveClass(/htmx-request/)
        fulfill()
        await expect(find('button')).not.toHaveClass(/htmx-request/)
    })

    test('adds htmx-request class to explicit indicators', async ({html, find, page}) => {
        let fulfill
        await page.route('**/test', route => {
            fulfill = () => route.fulfill({body: 'Done', contentType: 'text/html'})
        })
        await html(`
            <button hx-get="/test" hx-indicator="#spinner1, #spinner2">Click</button>
            <span id="spinner1"></span>
            <span id="spinner2"></span>
        `)
        await find('button').click()
        await expect(find('button')).not.toHaveClass(/htmx-request/)
        await expect(find('#spinner1')).toHaveClass(/htmx-request/)
        await expect(find('#spinner2')).toHaveClass(/htmx-request/)
        fulfill()
        await expect(find('#spinner1')).not.toHaveClass(/htmx-request/)
        await expect(find('#spinner2')).not.toHaveClass(/htmx-request/)
    })

    test('supports closest syntax', async ({html, find, page}) => {
        let fulfill
        await page.route('**/test', route => {
            fulfill = () => route.fulfill({body: 'Done', contentType: 'text/html'})
        })
        await html(`
            <div id="wrapper">
                <button hx-get="/test" hx-indicator="closest div">Click</button>
            </div>
        `)
        await find('button').click()
        await expect(find('button')).not.toHaveClass(/htmx-request/)
        await expect(find('#wrapper')).toHaveClass(/htmx-request/)
        fulfill()
        await expect(find('#wrapper')).not.toHaveClass(/htmx-request/)
    })

    test('supports this syntax with inheritance', async ({html, find, page}) => {
        let fulfill
        await page.route('**/test', route => {
            fulfill = () => route.fulfill({body: 'Done', contentType: 'text/html'})
        })
        await html(`
            <div id="wrapper" hx-indicator:inherited="this">
                <button hx-get="/test">Click</button>
            </div>
        `)
        await find('button').click()
        await expect(find('button')).not.toHaveClass(/htmx-request/)
        await expect(find('#wrapper')).toHaveClass(/htmx-request/)
        fulfill()
        await expect(find('#wrapper')).not.toHaveClass(/htmx-request/)
    })
})
