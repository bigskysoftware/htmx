import {test, expect} from '../../fixtures.mjs'

test.describe('hx-trigger', () => {
    test('non-default trigger works', async ({html, mock, find}) => {
        await mock('GET', '/test', 'Clicked!')
        await html('<form hx-get="/test" hx-trigger="click">Click</form>')
        await find('form').click()
        await expect(find('body')).toHaveText('Clicked!')
    })

    test('works with multiple events', async ({html, mock, find, evaluate, requests}) => {
        await mock('GET', '/test', 'Response')
        await html('<div hx-trigger="foo, bar" hx-get="/test">Click</div>')
        await evaluate(() => htmx.trigger(document.querySelector('div'), 'foo'))
        await expect.poll(() => requests.all.length).toBe(1)
        await evaluate(() => htmx.trigger(document.querySelector('div'), 'bar'))
        await expect.poll(() => requests.all.length).toBe(2)
    })

    test('filters with false expression', async ({html, mock, evaluate, requests}) => {
        await mock('GET', '/test', 'Called!')
        await html('<form hx-get="/test" hx-trigger="evt[false]"></form>')
        await evaluate(() => {
            document.querySelector('form').dispatchEvent(new CustomEvent('evt'))
        })
        await evaluate(() => new Promise(r => setTimeout(r, 50)))
        expect(requests.all.length).toBe(0)
    })

    test('filters with false event property', async ({html, mock, evaluate, requests}) => {
        await mock('GET', '/test', 'Called!')
        await html('<form hx-get="/test" hx-trigger="evt[foo]"></form>')
        await evaluate(() => {
            let e = new CustomEvent('evt')
            e.foo = false
            document.querySelector('form').dispatchEvent(e)
        })
        await evaluate(() => new Promise(r => setTimeout(r, 50)))
        expect(requests.all.length).toBe(0)
    })

    test('filters with true event property', async ({html, mock, evaluate, requests}) => {
        await mock('GET', '/test', 'Called!')
        await html('<form hx-get="/test" hx-trigger="evt[foo]"></form>')
        await evaluate(() => {
            let e = new CustomEvent('evt')
            e.foo = true
            document.querySelector('form').dispatchEvent(e)
        })
        await expect.poll(() => requests.all.length).toBe(1)
    })

    test('filters with true expression', async ({html, mock, evaluate, requests}) => {
        await mock('GET', '/test', 'Called!')
        await html('<form hx-get="/test" hx-trigger="evt[true]"></form>')
        await evaluate(() => {
            document.querySelector('form').dispatchEvent(new CustomEvent('evt'))
        })
        await expect.poll(() => requests.all.length).toBe(1)
    })

    test('once modifier works', async ({html, mock, find, evaluate, requests}) => {
        await mock('GET', '/test', 'Response')
        await html('<button hx-trigger="click once" hx-get="/test">Click</button>')
        await find('button').click()
        await expect.poll(() => requests.all.length).toBe(1)
        await find('button').click()
        await evaluate(() => new Promise(r => setTimeout(r, 50)))
        expect(requests.all.length).toBe(1)
    })

    test('event listeners can filter on target', async ({html, mock, find, evaluate, requests}) => {
        await mock('GET', '/test', 'foo')
        await html(`
            <div id="listener" hx-trigger="click from:body target:#target" hx-get="/test">Click</div>
            <div id="decoy"></div>
            <div id="target"></div>
        `)
        await evaluate(() => document.body.click())
        await evaluate(() => new Promise(r => setTimeout(r, 50)))
        expect(requests.all.length).toBe(0)

        await find('#listener').click()
        await evaluate(() => new Promise(r => setTimeout(r, 50)))
        expect(requests.all.length).toBe(0)

        await find('#decoy').click()
        await evaluate(() => new Promise(r => setTimeout(r, 50)))
        expect(requests.all.length).toBe(0)

        await find('#target').click()
        await expect.poll(() => requests.all.length).toBe(1)
    })

    test('consume prevents event propagation', async ({html, mock, find, evaluate, requests}) => {
        await mock('GET', '/outer', 'foo')
        await mock('GET', '/inner', 'bar')
        await html(`
            <div hx-trigger="click" hx-get="/outer" hx-target="#output">
                <div id="inner" hx-trigger="click consume" hx-get="/inner" style="min-height:1px"></div>
            </div>
            <div id="output">bar</div>
        `)
        await find('#inner').click()
        await expect.poll(() => requests.all.length).toBeGreaterThan(0)
        await evaluate(() => new Promise(r => setTimeout(r, 100)))
        await expect(find('#output')).toHaveText('bar')
    })

    test('load event triggers on element creation', async ({html, mock, find}) => {
        await mock('GET', '/test', 'Loaded!')
        await html('<div hx-get="/test" hx-trigger="load">x</div>')
        await expect(find('div')).toHaveText('Loaded!')
    })
})
