import {test, expect} from '../../fixtures.mjs'

test.describe('hx-select', () => {
    test('selects content from response', async ({html, mock, find, evaluate}) => {
        await mock('GET', '/test', '<div><div id="content">Selected</div><div id="other">Not selected</div></div>')
        await html('<div hx-get="/test" hx-select="#content">Click</div>')
        await find('div').click()
        const inner = await evaluate(() => document.querySelector('[hx-get]').innerHTML)
        expect(inner).toBe('<div id="content">Selected</div>')
    })

    test('selects nested content from response', async ({html, mock, find, evaluate}) => {
        await mock('GET', '/test', '<html><body><nav>Nav</nav><main id="main">Main content</main><footer>Footer</footer></body></html>')
        await html('<div hx-get="/test" hx-select="#main">Click</div>')
        await find('div').click()
        const inner = await evaluate(() => document.querySelector('[hx-get]').innerHTML)
        expect(inner).toBe('<main id="main">Main content</main>')
    })

    test('returns empty if selector not found', async ({html, mock, find, evaluate}) => {
        await mock('GET', '/test', '<div><div id="content">Content</div></div>')
        await html('<div id="target" hx-get="/test" hx-select="#notfound">Click</div>')
        await find('#target').click()
        await expect.poll(() => evaluate(() => document.getElementById('target').innerHTML)).toBe('')
    })

    test('works with class selectors', async ({html, mock, find, evaluate}) => {
        await mock('GET', '/test', '<div><div class="selected">Selected</div><div class="other">Not</div></div>')
        await html('<div id="target" hx-get="/test" hx-select=".selected">Click</div>')
        await find('#target').click()
        const inner = await evaluate(() => document.getElementById('target').innerHTML)
        expect(inner).toContain('Selected')
    })

    test('works with complex selectors', async ({html, mock, find, evaluate}) => {
        await mock('GET', '/test', '<div><table><tbody><tr><td>Cell</td></tr></tbody></table></div>')
        await html(`
            <table id="target" hx-get="/test" hx-select="table tbody">
                <tbody><tr><td>x</td></tr></tbody>
            </table>
        `)
        await find('#target').click()
        const inner = await evaluate(() => document.getElementById('target').innerHTML)
        expect(inner).toContain('<tr><td>Cell</td></tr>')
    })
})
