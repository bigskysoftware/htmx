import {test, expect} from '../../fixtures.mjs'

test.describe('hx-confirm', () => {
    test('blocks request when confirm returns false', async ({html, mock, find, confirm, evaluate, requests}) => {
        await confirm(false)
        await mock('GET', '/test', 'Success')
        await html('<button hx-get="/test" hx-confirm="Are you sure?">Click</button>')
        await find('button').click()
        await evaluate(() => new Promise(r => setTimeout(r, 50)))
        expect(requests.all.length).toBe(0)
        await expect(find('button')).toHaveText('Click')
    })

    test('allows request when confirm returns true', async ({html, mock, find, confirm}) => {
        await confirm(true)
        await mock('GET', '/test', 'Success')
        await html('<button hx-get="/test" hx-confirm="Are you sure?">Click</button>')
        await find('button').click()
        await expect(find('button')).toHaveText('Success')
    })

    test('fires htmx:confirm event', async ({html, mock, find, confirm, evaluate}) => {
        await confirm(true)
        await mock('GET', '/test', 'Success')
        await html('<button hx-get="/test" hx-confirm="Delete this?">Click</button>')
        await evaluate(() => {
            window._confirmFired = false
            document.querySelector('button').addEventListener('htmx:confirm', () => window._confirmFired = true)
        })
        await find('button').click()
        await expect(find('button')).toHaveText('Success')
        const fired = await evaluate(() => window._confirmFired)
        expect(fired).toBe(true)
    })

    test('supports js: expressions', async ({html, mock, find}) => {
        await mock('GET', '/test', 'JS confirmed')
        await html('<button hx-get="/test" hx-confirm="js:true">Click</button>')
        await find('button').click()
        await expect(find('button')).toHaveText('JS confirmed')
    })

    test('blocks request with js: returning false', async ({html, mock, find, evaluate, requests}) => {
        await mock('GET', '/test', 'Success')
        await html('<button hx-get="/test" hx-confirm="js:false">Click</button>')
        await find('button').click()
        await evaluate(() => new Promise(r => setTimeout(r, 50)))
        expect(requests.all.length).toBe(0)
        await expect(find('button')).toHaveText('Click')
    })

    test('allows custom confirmation UI with issueRequest callback', async ({html, mock, find, evaluate}) => {
        await mock('GET', '/test', 'Custom confirmed')
        await html('<button hx-get="/test" hx-confirm="Custom?">Click</button>')
        await evaluate(() => {
            document.querySelector('button').addEventListener('htmx:confirm', e => {
                e.preventDefault()
                setTimeout(() => e.detail.issueRequest(true), 10)
            })
        })
        await find('button').click()
        await expect(find('button')).toHaveText('Custom confirmed')
    })

    test('cancels request when issueRequest called with false', async ({html, mock, find, evaluate, requests}) => {
        await mock('GET', '/test', 'Success')
        await html('<button hx-get="/test" hx-confirm="Cancel?">Click</button>')
        await evaluate(() => {
            document.querySelector('button').addEventListener('htmx:confirm', e => {
                e.preventDefault()
                e.detail.issueRequest(false)
            })
        })
        await find('button').click()
        await evaluate(() => new Promise(r => setTimeout(r, 50)))
        expect(requests.all.length).toBe(0)
        await expect(find('button')).toHaveText('Click')
    })

    test('works with forms', async ({html, mock, find, confirm}) => {
        await confirm(true)
        await mock('POST', '/test', 'Form submitted')
        await html('<form hx-post="/test" hx-confirm="Submit form?">Submit</form>')
        await find('form').submit()
        await expect(find('body')).toContainText('Form submitted')
    })
})
