import {test, expect} from '../../fixtures.mjs'

test.describe('hx-get', () => {
    test('issues a GET request on click and swaps content', async ({html, mock, find}) => {
        await mock('GET', '/test', 'Clicked!')
        await html('<button hx-get="/test">Click Me!</button>')
        await find('button').click()
        await expect(find('button')).toHaveText('Clicked!')
    })

    test.skip('GET does not include surrounding data by default', async ({html, mock, find, requests}) => {
        // TODO do we want to drop this behavior except in the case of boosted links?
        await mock('GET', '/test', 'Clicked!')
        await html(`
            <form>
                <input name="username" value="joe"/>
                <button hx-get="/test">Click Me!</button>
            </form>
        `)
        await find('button').click()
        await expect(find('button')).toHaveText('Clicked!')
        expect(requests.last.url()).toBe('http://localhost/test')
    })

    test('GET on form includes its own data by default', async ({html, mock, find, requests}) => {
        await mock('GET', '/test', 'Clicked!')
        await html(`
            <form hx-get="/test" hx-swap="outerHTML">
                <input name="username" value="joe"/>
            </form>
        `)
        await find('form').submit()
        await expect(find('body')).toHaveText('Clicked!')
        expect(requests.last.url()).toBe('http://localhost/test?username=joe')
    })

    test('GET on form with existing parameters works properly', async ({html, mock, find, requests}) => {
        await mock('GET', '/test', 'Clicked!')
        await html(`
            <form hx-get="/test?foo=bar" hx-swap="outerHTML">
                <input name="username" value="joe"/>
            </form>
        `)
        await find('form').submit()
        await expect(find('body')).toHaveText('Clicked!')
        expect(requests.last.url()).toBe('http://localhost/test?foo=bar&username=joe')
    })

    test('GET on form with fragment strips it from request URL', async ({html, mock, find, requests}) => {
        await mock('GET', '/test', 'Clicked!')
        await html(`
            <form hx-get="/test?foo=bar#foo" hx-swap="outerHTML">
                <input name="username" value="joe"/>
            </form>
        `)
        await find('form').submit()
        await expect(find('body')).toHaveText('Clicked!')
        expect(requests.last.url()).toBe('http://localhost/test?foo=bar&username=joe')
    })

    test('GET on form with anchor works properly and scrolls to anchor id', async ({html, mock, find, requests}) => {
        await mock('GET', '/test', '<div id="foo">Clicked</div>')
        await -html(`
            <form hx-trigger="click" hx-get="/test?foo=bar#foo" hx-swap="outerHTML">
                <input name="username" value="joe"/>
            </form>
        `)
        await find('form').click()
        await expect(find('body')).toContainText('Clicked')
        expect(requests.last.url()).toBe('http://localhost/test?foo=bar&username=joe')
        // TODO: Add assertion for scroll behavior to #foo
    })
})
