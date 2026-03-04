import {test, expect} from '../fixtures.mjs'

test.describe('default-trigger', () => {
    test('button gets click', async ({html, evaluate}) => {
        await evaluate(() => {
            window._trigger = null
            document.body.addEventListener('htmx:before:init', (e) => {
                if (e.detail.element.tagName === 'BUTTON') window._trigger = e.detail.trigger.eventName
            }, {once: true})
        })
        await html('<button hx-get="/x">Go</button>')
        const trigger = await evaluate(() => window._trigger)
        expect(trigger).toBe('click')
    })

    test('input gets change', async ({html, evaluate}) => {
        await evaluate(() => {
            window._trigger = null
            document.body.addEventListener('htmx:before:init', (e) => {
                if (e.detail.element.tagName === 'INPUT') window._trigger = e.detail.trigger.eventName
            }, {once: true})
        })
        await html('<input hx-get="/x">')
        const trigger = await evaluate(() => window._trigger)
        expect(trigger).toBe('change')
    })

    test('form gets submit', async ({html, evaluate}) => {
        await evaluate(() => {
            window._trigger = null
            document.body.addEventListener('htmx:before:init', (e) => {
                if (e.detail.element.tagName === 'FORM') window._trigger = e.detail.trigger.eventName
            }, {once: true})
        })
        await html('<form hx-get="/x"></form>')
        const trigger = await evaluate(() => window._trigger)
        expect(trigger).toBe('submit')
    })
})
