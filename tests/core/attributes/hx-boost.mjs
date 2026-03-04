import {test, expect} from '../../fixtures.mjs'

test.describe('hx-boost', () => {
    test('handles basic anchor', async ({html, mock, find}) => {
        await mock('GET', '/test', 'Boosted')
        await html('<a hx-boost="true" hx-target="this" hx-swap="outerHTML" href="/test">link</a>')
        await find('a').click()
        await expect(find('body')).toContainText('Boosted')
    })

    test('handles basic form post', async ({html, mock, find}) => {
        await mock('POST', '/test', 'Boosted')
        await html(`
            <div hx-target:inherited="this" hx-swap:inherited="outerHTML" hx-boost:inherited="true">
                <form action="/test" method="post">
                    <button>Submit</button>
                </form>
            </div>
        `)
        await find('button').click()
        await expect(find('body')).toContainText('Boosted')
    })

    test('handles form post with button formaction', async ({html, mock, find}) => {
        await mock('POST', '/test', 'Boosted')
        await html(`
            <div hx-target:inherited="this" hx-swap:inherited="outerHTML" hx-boost:inherited="true">
                <form action="/bad" method="post">
                    <button formaction="/test">Submit</button>
                </form>
            </div>
        `)
        await find('button').click()
        await expect(find('body')).toContainText('Boosted')
    })

    test('handles form post with button formmethod', async ({html, mock, find}) => {
        await mock('POST', '/test', 'Boosted')
        await html(`
            <div hx-target:inherited="this" hx-swap:inherited="outerHTML" hx-boost:inherited="true">
                <form action="/test" method="get">
                    <button formmethod="post">Submit</button>
                </form>
            </div>
        `)
        await find('button').click()
        await expect(find('body')).toContainText('Boosted')
    })

    test('handles form post with button formmethod and formaction', async ({html, mock, find}) => {
        await mock('POST', '/test', 'Boosted')
        await html(`
            <div hx-target:inherited="this" hx-swap:inherited="outerHTML" hx-boost:inherited="true">
                <form action="/bad" method="get">
                    <button formmethod="post" formaction="/test">Submit</button>
                </form>
            </div>
        `)
        await find('button').click()
        await expect(find('body')).toContainText('Boosted')
    })

    test('handles form post with explicit action and hx-boost on form', async ({html, mock, find}) => {
        await mock('POST', '/test', 'Boosted')
        await html('<form action="/test" method="post" hx-boost="true" hx-target="this" hx-swap="outerHTML"></form>')
        await find('form').submit()
        await expect(find('body')).toContainText('Boosted')
    })

    test('handles basic form get', async ({html, mock, find}) => {
        await mock('GET', '/test', 'Boosted')
        await html(`
            <div hx-target:inherited="this" hx-swap:inherited="outerHTML" hx-boost:inherited="true">
                <form action="/test" method="get">
                    <button>Submit</button>
                </form>
            </div>
        `)
        await find('button').click()
        await expect(find('body')).toContainText('Boosted')
    })

    test('handles form with no explicit method', async ({html, mock, find}) => {
        await mock('GET', '/test', 'Boosted')
        await html(`
            <div hx-target:inherited="this" hx-swap:inherited="outerHTML" hx-boost:inherited="true">
                <form action="/test">
                    <button>Submit</button>
                </form>
            </div>
        `)
        await find('button').click()
        await expect(find('body')).toContainText('Boosted')
    })

    test('does not boost forms with method="dialog"', async ({html, mock, find, evaluate, requests}) => {
        await mock('GET', '/test', 'Boosted')
        await html(`
            <div hx-boost:inherited="true">
                <form action="/test" method="dialog">
                    <button>Close</button>
                </form>
            </div>
        `)
        await find('button').click()
        await evaluate(() => new Promise(r => setTimeout(r, 50)))
        expect(requests.all.length).toBe(0)
    })

    test('does not boost buttons with formmethod="dialog"', async ({html, mock, find, evaluate, requests}) => {
        await mock('GET', '/test', 'Boosted')
        await html(`
            <div hx-boost:inherited="true">
                <form action="/test" method="get">
                    <button formmethod="dialog">Close</button>
                </form>
            </div>
        `)
        await find('button').click()
        await evaluate(() => new Promise(r => setTimeout(r, 50)))
        expect(requests.all.length).toBe(0)
    })
})
