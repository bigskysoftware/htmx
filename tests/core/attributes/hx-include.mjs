import {test, expect} from '../../fixtures.mjs'

test.describe('hx-include', () => {
    test('input includes itself by default', async ({html, mock, find, requests}) => {
        await mock('POST', '/test', 'Clicked!')
        await html('<input hx-post="/test" hx-trigger="click" name="username" value="joe"/>')
        await find('input').click()
        await expect.poll(() => requests.last?.postData()).toContain('username=joe')
    })

    test('non-GET includes closest form', async ({html, mock, find, requests}) => {
        await mock('POST', '/test', 'Dummy')
        await html(`
            <form>
                <button hx-post="/test">Click</button>
                <input name="username" value="joe"/>
            </form>
        `)
        await find('button').click()
        await expect.poll(() => requests.last?.postData()).toContain('username=joe')
    })

    test('single input not included twice when in form', async ({html, mock, find, requests}) => {
        await mock('POST', '/test', 'Dummy')
        await html(`
            <form>
                <input hx-post="/test" hx-trigger="click" name="username" value="joe"/>
            </form>
        `)
        await find('input').click()
        await expect.poll(() => requests.last?.postData()).toBeTruthy()
        const body = requests.last.postData()
        const matches = body.match(/username=/g)
        expect(matches).toHaveLength(1)
    })
})
