import {test, expect} from '../../fixtures.mjs'

test.describe('hx-preserve', () => {
    test('preserves element during swap', async ({html, mock, find}) => {
        await mock('GET', '/test', '<div id="preserved" hx-preserve>Preserved</div><div>New</div>')
        await html(`
            <div hx-get="/test">
                <div id="preserved" hx-preserve>Original</div>
            </div>
        `)
        await find('[hx-get]').click()
        await expect(find('#preserved')).toHaveText('Original')
    })

    test('preserves element state during swap', async ({html, mock, find, evaluate}) => {
        await mock('GET', '/test', '<input id="inp" hx-preserve value="new"/>')
        await html(`
            <div hx-get="/test">
                <input id="inp" hx-preserve value="old"/>
            </div>
        `)
        await evaluate(() => document.getElementById('inp').value = 'modified')
        await find('[hx-get]').click()
        await expect.poll(() => evaluate(() => document.getElementById('inp').value)).toBe('modified')
    })
})
