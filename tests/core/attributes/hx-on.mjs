import {test, expect} from '../../fixtures.mjs'

test.describe('hx-on', () => {
    test('handles basic click event', async ({html, find, evaluate}) => {
        await html('<button hx-on:click="window._hxtest = true">Click</button>')
        await find('button').click()
        const result = await evaluate(() => window._hxtest)
        expect(result).toBe(true)
        await evaluate(() => delete window._hxtest)
    })

    test('handles custom events', async ({html, evaluate}) => {
        await html('<button hx-on:foo="window._hxtest = true">Click</button>')
        await evaluate(() => htmx.trigger(document.querySelector('button'), 'foo'))
        const result = await evaluate(() => window._hxtest)
        expect(result).toBe(true)
        await evaluate(() => delete window._hxtest)
    })

    test('event symbol works', async ({html, evaluate}) => {
        await html('<button hx-on:foo="window._hxtest = event.type">Click</button>')
        await evaluate(() => {
            document.querySelector('button').dispatchEvent(new CustomEvent('foo'))
        })
        const result = await evaluate(() => window._hxtest)
        expect(result).toBe('foo')
        await evaluate(() => delete window._hxtest)
    })

    test('this symbol refers to the element', async ({html, evaluate}) => {
        await html('<button id="my-btn" hx-on:foo="window._hxtest = this.id">Click</button>')
        await evaluate(() => {
            document.querySelector('button').dispatchEvent(new CustomEvent('foo'))
        })
        const result = await evaluate(() => window._hxtest)
        expect(result).toBe('my-btn')
        await evaluate(() => delete window._hxtest)
    })

    test('htmx API works in handler', async ({html, evaluate}) => {
        await html('<button hx-on:foo="await timeout(1); window._hxtest = 10">Click</button>')
        await evaluate(() => {
            document.querySelector('button').dispatchEvent(new CustomEvent('foo'))
        })
        await expect.poll(() => evaluate(() => window._hxtest)).toBe(10)
        await evaluate(() => delete window._hxtest)
    })

    test('find works relative to element in handler', async ({html, evaluate}) => {
        await html(`
            <button hx-on:foo="window._hxtest = find('next div').id">Click</button>
            <div id="target"></div>
        `)
        await evaluate(() => {
            document.querySelector('button').dispatchEvent(new CustomEvent('foo'))
        })
        const result = await evaluate(() => window._hxtest)
        expect(result).toBe('target')
        await evaluate(() => delete window._hxtest)
    })
})
