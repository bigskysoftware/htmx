import {test, expect} from '../../fixtures.mjs'

test.describe('hx-config', () => {
    test('overrides action with JSON config', async ({html, mock, find, requests}) => {
        await mock('GET', '/override', 'Overridden!')
        await html('<button hx-get="/test" hx-config=\'{"action": "/override"}\'>Click</button>')
        await find('button').click()
        await expect(find('button')).toHaveText('Overridden!')
        expect(requests.last.url()).toContain('/override')
    })

    test('works with empty config object', async ({html, mock, find}) => {
        await mock('GET', '/test', 'Done')
        await html('<button hx-get="/test" hx-config=\'{}\'>Click</button>')
        await find('button').click()
        await expect(find('button')).toHaveText('Done')
    })

    test('can override method via config', async ({html, mock, find, requests}) => {
        await mock('PUT', '/test', 'Put request')
        await html('<button hx-get="/test" hx-config=\'{"method": "PUT"}\'>Click</button>')
        await find('button').click()
        await expect(find('button')).toHaveText('Put request')
        expect(requests.last.method()).toBe('PUT')
    })

    test('can set custom properties', async ({html, mock, find, evaluate}) => {
        await mock('GET', '/test', 'Done')
        await evaluate(() => {
            window._configCtx = null
            document.body.addEventListener('htmx:config:request', e => {
                window._configCtx = e.detail.ctx
            }, {once: true})
        })
        await html('<button hx-get="/test" hx-config=\'{"prop1": "value1", "prop2": 123}\'>Click</button>')
        await find('button').click()
        await expect(find('button')).toHaveText('Done')
        const prop1 = await evaluate(() => window._configCtx?.request?.prop1)
        const prop2 = await evaluate(() => window._configCtx?.request?.prop2)
        expect(prop1).toBe('value1')
        expect(prop2).toBe(123)
    })

    test('supports boolean values', async ({html, mock, find, evaluate}) => {
        await mock('GET', '/test', 'Done')
        await evaluate(() => {
            window._configCtx = null
            document.body.addEventListener('htmx:config:request', e => {
                window._configCtx = e.detail.ctx
            }, {once: true})
        })
        await html('<button hx-get="/test" hx-config=\'{"myFlag": true, "otherFlag": false}\'>Click</button>')
        await find('button').click()
        await expect(find('button')).toHaveText('Done')
        const myFlag = await evaluate(() => window._configCtx?.request?.myFlag)
        const otherFlag = await evaluate(() => window._configCtx?.request?.otherFlag)
        expect(myFlag).toBe(true)
        expect(otherFlag).toBe(false)
    })

    test('config can be inherited with :inherited suffix', async ({html, mock, find, requests}) => {
        await mock('GET', '/inherited', 'Inherited config')
        await html(`
            <div hx-config:inherited='{"action": "/inherited"}'>
                <button hx-get="/original">Click</button>
            </div>
        `)
        await find('button').click()
        await expect(find('button')).toHaveText('Inherited config')
        expect(requests.last.url()).toContain('/inherited')
    })

    test('child config takes precedence over inherited', async ({html, mock, find, requests}) => {
        await mock('GET', '/child', 'Child wins')
        await html(`
            <div hx-config:inherited='{"action": "/parent"}'>
                <button hx-get="/original" hx-config='{"action": "/child"}'>Click</button>
            </div>
        `)
        await find('button').click()
        await expect(find('button')).toHaveText('Child wins')
        expect(requests.last.url()).toContain('/child')
    })

    test('merges headers with + prefix', async ({html, mock, find, requests}) => {
        await mock('GET', '/test', 'Done')
        await html('<button hx-get="/test" hx-config=\'{"+headers": {"X-Custom": "value"}}\'>Click</button>')
        await find('button').click()
        await expect(find('button')).toHaveText('Done')
        expect(requests.last.headers()['x-custom']).toBe('value')
    })
})
