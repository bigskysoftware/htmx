import {test, expect} from '../../fixtures.mjs'

test.describe('hx-post', () => {
    test('issues a POST request with proper method', async ({html, mock, find, requests}) => {
        await mock('POST', '/test', 'Posted!')
        await html('<button hx-post="/test">Click</button>')
        await find('button').click()
        await expect(find('button')).toHaveText('Posted!')
        expect(requests.last.method()).toBe('POST')
    })
})
