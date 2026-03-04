import {test, expect} from '../../fixtures.mjs'

test.describe('hx-swap', () => {
    test('scroll:top modifier scrolls to top', async ({html, mock, find, evaluate}) => {
        await mock('GET', '/test', '<div style="height:2000px">Tall content</div>')
        await html(`
            <div id="box" hx-get="/test" hx-swap="scroll:top"
                 style="height:100px;overflow:auto">
                <div style="height:2000px">x</div>
            </div>
        `)
        await evaluate(() => document.getElementById('box').scrollTop = 500)
        await find('#box').click()
        await expect(find('#box')).toContainText('Tall content')
        const scrollTop = await evaluate(() => document.getElementById('box').scrollTop)
        expect(scrollTop).toBe(0)
    })

    test('scroll:bottom modifier scrolls to bottom', async ({html, mock, find, evaluate}) => {
        await mock('GET', '/test', '<div style="height:2000px">Tall content</div>')
        await html(`
            <div id="box" hx-get="/test" hx-swap="scroll:bottom"
                 style="height:100px;overflow:auto">
                <div style="height:2000px">x</div>
            </div>
        `)
        await find('#box').click()
        await expect(find('#box')).toContainText('Tall content')
        const scrollTop = await evaluate(() => document.getElementById('box').scrollTop)
        expect(scrollTop).toBeGreaterThan(0)
    })

    test('processes scripts in swapped content', async ({html, mock, find, evaluate}) => {
        await mock('GET', '/test', '<div><script>window.testScriptRan = true;</script></div>')
        await evaluate(() => window.testScriptRan = false)
        await html('<button hx-get="/test">Click</button>')
        await find('button').click()
        await expect.poll(() => evaluate(() => window.testScriptRan)).toBe(true)
    })

    test('swap with delay waits before swapping', async ({html, mock, find, evaluate}) => {
        await mock('GET', '/test', '<div>New Content</div>')
        await html('<div hx-get="/test" hx-swap="swap:100ms">Click</div>')
        await find('div').click()
        await expect(find('div')).toHaveText('New Content')
    })
})
