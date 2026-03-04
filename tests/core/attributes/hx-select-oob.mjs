import {test, expect} from '../../fixtures.mjs'

test.describe('hx-select-oob', () => {
    test('basic hx-select-oob works', async ({html, mock, find}) => {
        await mock('GET', '/test', '<div id="d1">foo</div><div id="d2">bar</div>')
        await html(`
            <div id="target"
                 hx-get="/test"
                 hx-select="#d1"
                 hx-select-oob="#d2">Click</div>
            <div id="d2"></div>
        `)
        await find('#target').click()
        await expect(find('#target')).toHaveText('foo')
        await expect(find('#d2')).toHaveText('bar')
    })

    test('multiple hx-select-oobs works', async ({html, mock, find}) => {
        await mock('GET', '/test', '<div id="d1">foo</div><div id="d2">bar</div><div id="d3">baz</div>')
        await html(`
            <div id="target"
                 hx-get="/test"
                 hx-select="#d1"
                 hx-select-oob="#d2, #d3">Click</div>
            <div id="d2"></div>
            <div id="d3"></div>
        `)
        await find('#target').click()
        await expect(find('#target')).toHaveText('foo')
        await expect(find('#d2')).toHaveText('bar')
        await expect(find('#d3')).toHaveText('baz')
    })

    test('ignores bad selector', async ({html, mock, find}) => {
        await mock('GET', '/test', '<div id="d1">foo</div><div id="d2">bar</div>')
        await html(`
            <div id="target"
                 hx-get="/test"
                 hx-select="#d1"
                 hx-select-oob="#bad">Click</div>
            <div id="d2"></div>
        `)
        await find('#target').click()
        await expect(find('#target')).toHaveText('foo')
        await expect(find('#d2')).toHaveText('')
    })

    test('supports non-id-based selectors', async ({html, mock, find, evaluate}) => {
        await mock('GET', '/test', '<div id="d1">foo</div><div class="foo" id="d2">bar</div>')
        await html(`
            <div id="target"
                 hx-get="/test"
                 hx-select="#d1"
                 hx-select-oob=".foo">Click</div>
            <div id="d2"></div>
        `)
        await find('#target').click()
        await expect(find('#target')).toHaveText('foo')
        await expect(find('#d2')).toHaveText('bar')
        const hasFoo = await evaluate(() => document.getElementById('d2').classList.contains('foo'))
        expect(hasFoo).toBe(true)
    })

    test('can select multiple elements with a selector', async ({html, mock, find, evaluate}) => {
        await mock('GET', '/test', '<div id="d1">foo</div><div class="foo" id="d2">bar</div><div class="foo" id="d3">baz</div>')
        await html(`
            <div id="target"
                 hx-get="/test"
                 hx-select="#d1"
                 hx-select-oob=".foo">Click</div>
            <div id="d2"></div>
            <div id="d3"></div>
        `)
        await find('#target').click()
        await expect(find('#target')).toHaveText('foo')
        await expect(find('#d2')).toHaveText('bar')
        await expect(find('#d3')).toHaveText('baz')
    })
})
