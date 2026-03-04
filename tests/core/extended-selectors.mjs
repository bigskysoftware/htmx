import {test, expect} from '../fixtures.mjs'

test.describe('extended-selectors', () => {
    test('this: returns element itself', async ({html, evaluate}) => {
        await html('<span id="subject">subject</span>')
        const match = await evaluate(() => {
            const el = document.getElementById('subject')
            return htmx.find('this', {from: el}) === el
        })
        expect(match).toBe(true)
    })

    test('body: returns document.body', async ({evaluate}) => {
        const match = await evaluate(() => htmx.find('body') === document.body)
        expect(match).toBe(true)
    })

    test('document: returns document', async ({evaluate}) => {
        const match = await evaluate(() => htmx.find('document') === document)
        expect(match).toBe(true)
    })

    test('window: returns window', async ({evaluate}) => {
        const match = await evaluate(() => htmx.find('window') === window)
        expect(match).toBe(true)
    })

    test('this with multiple: returns [element]', async ({html, evaluate}) => {
        await html('<span id="subject">subject</span>')
        const result = await evaluate(() => {
            const el = document.getElementById('subject')
            const r = htmx.find('this', {from: el, multiple: true})
            return Array.isArray(r) && r.length === 1 && r[0] === el
        })
        expect(result).toBe(true)
    })

    test('next: returns next sibling', async ({html, evaluate}) => {
        await html(`
            <span class="prev">prev</span>
            <span id="subject">subject</span>
            <span class="next-sib">next</span>
        `)
        const match = await evaluate(() => {
            const el = document.getElementById('subject')
            return htmx.find('next', {from: el})?.classList.contains('next-sib')
        })
        expect(match).toBe(true)
    })

    test('previous: returns previous sibling', async ({html, evaluate}) => {
        await html(`
            <span class="prev">prev</span>
            <span id="subject">subject</span>
            <span class="next-sib">next</span>
        `)
        const match = await evaluate(() => {
            const el = document.getElementById('subject')
            return htmx.find('previous', {from: el})?.classList.contains('prev')
        })
        expect(match).toBe(true)
    })

    test('closest: finds ancestor', async ({html, evaluate}) => {
        await html(`
            <div class="parent">
                <span id="subject">subject</span>
            </div>
        `)
        const match = await evaluate(() => {
            const el = document.getElementById('subject')
            return htmx.find('closest .parent', {from: el})?.classList.contains('parent')
        })
        expect(match).toBe(true)
    })

    test('next <sel>: scans forward for match', async ({html, evaluate}) => {
        await html(`
            <span id="subject">subject</span>
            <span class="next-sib">next</span>
        `)
        const match = await evaluate(() => {
            const el = document.getElementById('subject')
            return htmx.find('next .next-sib', {from: el})?.classList.contains('next-sib')
        })
        expect(match).toBe(true)
    })

    test('previous <sel>: scans backward for match', async ({html, evaluate}) => {
        await html(`
            <span class="prev">prev</span>
            <span id="subject">subject</span>
        `)
        const match = await evaluate(() => {
            const el = document.getElementById('subject')
            return htmx.find('previous .prev', {from: el})?.classList.contains('prev')
        })
        expect(match).toBe(true)
    })

    test('find <sel>: scoped search within element', async ({html, evaluate}) => {
        await html(`
            <div id="arena">
                <div class="inner"><span class="deep">deep</span></div>
            </div>
        `)
        const match = await evaluate(() => {
            const arena = document.getElementById('arena')
            return htmx.find('find .deep', {from: arena})?.classList.contains('deep')
        })
        expect(match).toBe(true)
    })

    test('plain CSS selector still works', async ({html, evaluate}) => {
        await html('<span id="subject">subject</span>')
        const match = await evaluate(() => {
            return htmx.find('#subject') === document.getElementById('subject')
        })
        expect(match).toBe(true)
    })

    test('plain CSS with multiple: returns array', async ({html, evaluate}) => {
        await html('<span>a</span><span>b</span>')
        const count = await evaluate(() => {
            return htmx.find('span', {multiple: true}).length
        })
        expect(count).toBeGreaterThan(0)
    })
})
