import {test, expect} from '../../fixtures.mjs'

test.describe('hx-put', () => {
    test('issues a PUT request and swaps content', async ({html, mock, find}) => {
        await mock('PUT', '/test', 'Put!')
        await html('<button hx-put="/test">Click</button>')
        await find('button').click()
        await expect(find('button')).toHaveText('Put!')
    })
})
