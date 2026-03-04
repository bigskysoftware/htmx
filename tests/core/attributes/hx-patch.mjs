import {test, expect} from '../../fixtures.mjs'

test.describe('hx-patch', () => {
    test('issues a PATCH request and swaps content', async ({html, mock, find}) => {
        await mock('PATCH', '/test', 'Patched!')
        await html('<button hx-patch="/test">Click</button>')
        await find('button').click()
        await expect(find('button')).toHaveText('Patched!')
    })
})
