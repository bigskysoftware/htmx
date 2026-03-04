import {test, expect} from '../../fixtures.mjs'

test.describe('hx-headers', () => {
    test('basic hx-headers works', async ({html, mock, find, requests}) => {
        await mock('POST', '/test', 'Clicked!')
        await html('<button hx-post="/test" hx-headers=\'{"x-custom":"test"}\'>Click</button>')
        await find('button').click()
        await expect(find('button')).toHaveText('Clicked!')
        expect(requests.last.headers()['x-custom']).toBe('test')
    })

    test('multiple hx-headers works', async ({html, mock, find, requests}) => {
        await mock('POST', '/test', 'Clicked!')
        await html('<button hx-post="/test" hx-headers=\'{"x-v1":"test", "x-v2":"42"}\'>Click</button>')
        await find('button').click()
        await expect(find('button')).toHaveText('Clicked!')
        expect(requests.last.headers()['x-v1']).toBe('test')
        expect(requests.last.headers()['x-v2']).toBe('42')
    })

    test('can be inherited from parents', async ({html, mock, find, requests}) => {
        await mock('POST', '/test', 'Clicked!')
        await html(`
            <div hx-headers:inherited='{"x-custom":"test"}'>
                <button hx-post="/test">Click</button>
            </div>
        `)
        await find('button').click()
        await expect(find('button')).toHaveText('Clicked!')
        expect(requests.last.headers()['x-custom']).toBe('test')
    })

    test('child hx-headers can override parent', async ({html, mock, find, requests}) => {
        await mock('POST', '/test', 'Clicked!')
        await html(`
            <div hx-headers:inherited='{"x-custom":"test"}'>
                <button hx-headers='{"x-custom":"best"}' hx-post="/test">Click</button>
            </div>
        `)
        await find('button').click()
        await expect(find('button')).toHaveText('Clicked!')
        expect(requests.last.headers()['x-custom']).toBe('best')
    })

    test('javascript: prefix works', async ({html, mock, find, requests}) => {
        await mock('POST', '/test', 'Clicked!')
        await html('<button hx-post="/test" hx-headers="javascript:x_custom:\'test\'">Click</button>')
        await find('button').click()
        await expect(find('button')).toHaveText('Clicked!')
        expect(requests.last.headers()['x_custom']).toBe('test')
    })
})
