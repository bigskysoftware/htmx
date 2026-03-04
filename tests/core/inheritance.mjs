import {test, expect} from '../fixtures.mjs'

test.describe('inheritance', () => {
    test('grandchild inherits from :inherited ancestor', async ({html, evaluate}) => {
        await html(`
            <div hx-target:inherited="#from-parent">
                <div>
                    <button id="gc" hx-get="/test">Go</button>
                </div>
            </div>
        `)
        const val = await evaluate(() => {
            return htmx.attr(document.getElementById('gc'), 'hx-target', {as: 'selector'})
        })
        expect(val?.selector).toBe('#from-parent')
    })

    test('direct attribute wins over inherited', async ({html, evaluate}) => {
        await html(`
            <div hx-target:inherited="#from-parent">
                <button id="child" hx-get="/test" hx-target="#own-target">Go</button>
            </div>
        `)
        const val = await evaluate(() => {
            return htmx.attr(document.getElementById('child'), 'hx-target', {as: 'selector'})
        })
        expect(val?.selector).toBe('#own-target')
    })

    test('plain hx-target does NOT inherit in explicit mode', async ({html, evaluate}) => {
        await html(`
            <div hx-target="#not-inherited">
                <button id="child" hx-get="/test">Go</button>
            </div>
        `)
        const val = await evaluate(() => {
            return htmx.attr(document.getElementById('child'), 'hx-target', {as: 'selector'})
        })
        expect(val).toBeNull()
    })

    test('inherit:false skips inheritance lookup', async ({html, evaluate}) => {
        await html(`
            <div hx-target:inherited="#from-parent">
                <div>
                    <button id="gc" hx-get="/test">Go</button>
                </div>
            </div>
        `)
        const val = await evaluate(() => {
            return htmx.attr(document.getElementById('gc'), 'hx-target', {as: 'selector', inherit: false})
        })
        expect(val).toBeNull()
    })

    test(':inherited on element itself reads its own value', async ({html, evaluate}) => {
        await html('<div id="self" hx-swap:inherited="outerHTML"></div>')
        const val = await evaluate(() => {
            return htmx.attr(document.getElementById('self'), 'hx-swap', {as: 'style'})
        })
        expect(val?.style).toBe('outerHTML')
    })
})
