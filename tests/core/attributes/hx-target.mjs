import {test, expect} from '../../fixtures.mjs'

test.describe('hx-target', () => {
    test('swaps into targeted element', async ({html, mock, find}) => {
        await mock('GET', '/api/hello', '<p>Swapped!</p>')
        await html(`
            <button hx-get="/api/hello" hx-target="#target"></button>
            <div id="target"></div>
        `)
        await find('button').click()
        await expect(find('#target')).toHaveText('Swapped!')
    })
})
