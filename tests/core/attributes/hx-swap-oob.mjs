import {test, expect} from '../../fixtures.mjs'

test.describe('hx-swap-oob', () => {
    test('swaps oob element by id with default outerHTML', async ({html, mock, find}) => {
        await mock('GET', '/test', '<div>Main</div><div id="oob1" hx-swap-oob="true">OOB Content</div>')
        await html(`
            <button hx-get="/test">Click</button>
            <div id="oob1"></div>
        `)
        await find('button').click()
        await expect(find('#oob1')).toHaveText('OOB Content')
    })

    test('swaps oob element with innerHTML', async ({html, mock, find}) => {
        await mock('GET', '/test', '<div>Main</div><div id="oob2" hx-swap-oob="innerHTML">New Inner</div>')
        await html(`
            <button hx-get="/test">Click</button>
            <div id="oob2"></div>
        `)
        await find('button').click()
        await expect(find('#oob2')).toHaveText('New Inner')
    })

    test('swaps oob element with custom selector', async ({html, mock, find}) => {
        await mock('GET', '/test', '<div>Main</div><div id="x" hx-swap-oob="outerHTML:#target">OOB Target</div>')
        await html(`
            <button hx-get="/test">Click</button>
            <div id="target"></div>
        `)
        await find('button').click()
        await expect(find('#x')).toHaveText('OOB Target')
    })

    test('swaps multiple oob elements', async ({html, mock, find}) => {
        await mock('GET', '/test', '<div>Main</div><div id="a" hx-swap-oob="true">A</div><div id="b" hx-swap-oob="true">B</div>')
        await html(`
            <button hx-get="/test">Click</button>
            <div id="a"></div>
            <div id="b"></div>
        `)
        await find('button').click()
        await expect(find('#a')).toHaveText('A')
        await expect(find('#b')).toHaveText('B')
    })

    test('swaps oob with target: modifier', async ({html, mock, find}) => {
        await mock('GET', '/test', '<div>Main</div><div id="x" hx-swap-oob="innerHTML target:#custom">Target Content</div>')
        await html(`
            <button hx-get="/test">Click</button>
            <div id="custom"></div>
        `)
        await find('button').click()
        await expect(find('#custom')).toHaveText('Target Content')
    })

    test('swaps oob with legacy colon format', async ({html, mock, find}) => {
        await mock('GET', '/test', '<div>Main</div><div id="x" hx-swap-oob="innerHTML:#legacy">Legacy Format</div>')
        await html(`
            <button hx-get="/test">Click</button>
            <div id="legacy"></div>
        `)
        await find('button').click()
        await expect(find('#legacy')).toHaveText('Legacy Format')
    })
})
