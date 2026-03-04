import {test, expect} from '../../fixtures.mjs'

test.describe('hx-delete', () => {
    test('issues a DELETE request and swaps content', async ({html, mock, find}) => {
        await mock('DELETE', '/test', 'Deleted!')
        await html('<button hx-delete="/test">Click</button>')
        await find('button').click()
        await expect(find('button')).toHaveText('Deleted!')
    })
})
