import {test, expect} from '../../fixtures.mjs'

test.describe('hx-disable', () => {
    test('single element can be disabled with hx-disable="this"', async ({html, find, page}) => {
        let fulfill
        await page.route('**/test', route => {
            fulfill = () => route.fulfill({body: 'Done', contentType: 'text/html'})
        })
        await html('<button hx-get="/test" hx-disable="this">Click</button>')
        await find('button').click()
        await expect(find('button')).toHaveAttribute('disabled')
        fulfill()
        await expect(find('button')).not.toHaveAttribute('disabled')
    })

    test('can disable with closest syntax', async ({html, find, page}) => {
        let fulfill
        await page.route('**/test', route => {
            fulfill = () => route.fulfill({body: 'Done', contentType: 'text/html'})
        })
        await html(`
            <fieldset>
                <button hx-get="/test" hx-disable="closest fieldset">Click</button>
            </fieldset>
        `)
        await find('button').click()
        await expect(find('fieldset')).toHaveAttribute('disabled')
        fulfill()
        await expect(find('fieldset')).not.toHaveAttribute('disabled')
    })

    test('multiple elements can be disabled', async ({html, find, page}) => {
        let fulfill
        await page.route('**/test', route => {
            fulfill = () => route.fulfill({body: 'Done', contentType: 'text/html'})
        })
        await html(`
            <button id="b1" hx-get="/test" hx-disable="#b2, #b3">Click</button>
            <button id="b2"></button>
            <button id="b3"></button>
        `)
        await find('#b1').click()
        await expect(find('#b2')).toHaveAttribute('disabled')
        await expect(find('#b3')).toHaveAttribute('disabled')
        fulfill()
        await expect(find('#b2')).not.toHaveAttribute('disabled')
        await expect(find('#b3')).not.toHaveAttribute('disabled')
    })

    test('load trigger works with disable', async ({html, find, mock}) => {
        await mock('GET', '/test', 'Loaded!')
        await html(`
            <div hx-get="/test" hx-trigger="load" hx-disable="next button">x</div>
            <button></button>
        `)
        await expect(find('div')).toHaveText('Loaded!')
        await expect(find('button')).not.toHaveAttribute('disabled')
    })
})
