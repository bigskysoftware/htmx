describe('__runActions unit tests', function() {

    let originalUrl
    let originalState

    beforeEach(function() {
        setupTest();
        originalUrl = window.location.href
        originalState = history.state
    });

    afterEach(function() {
        cleanupTest();
        history.replaceState(originalState, '', originalUrl)
    });

    it('runs trigger action', function () {
        let triggerFired = false
        let container = createProcessedHTML('<div></div>')
        container.addEventListener('myEvent', () => { triggerFired = true })

        let terminal = htmx.__runActions({trigger: 'myEvent'}, container)

        assert.isNotOk(terminal)
        assert.isTrue(triggerFired)
    })

    it('returns falsy when no terminal action ran', function () {
        let container = createProcessedHTML('<div></div>')

        assert.isNotOk(htmx.__runActions({}, container))
        assert.isNotOk(htmx.__runActions({trigger: 'someEvent'}, container))
    })

    it('fires htmx:before:actions and htmx:after:actions', function () {
        let events = []
        let container = createProcessedHTML('<div></div>')
        container.addEventListener('htmx:before:actions', e => events.push(['before', e.detail.actions, e.detail.ctx]))
        container.addEventListener('htmx:after:actions', e => events.push(['after', e.detail.actions, e.detail.ctx]))

        htmx.__runActions({trigger: 'someEvent'}, container)

        assert.equal(events.length, 2)
        assert.equal(events[0][0], 'before')
        assert.equal(events[0][1].trigger, 'someEvent')
        assert.equal(events[1][0], 'after')
        assert.isUndefined(events[0][2])
        assert.isUndefined(events[1][2])
    })

    it('cancelling htmx:before:actions skips execution and htmx:after:actions', function () {
        let triggerFired = false
        let afterFired = false
        let container = createProcessedHTML('<div></div>')
        container.addEventListener('myEvent', () => { triggerFired = true })
        container.addEventListener('htmx:before:actions', e => e.preventDefault())
        container.addEventListener('htmx:after:actions', () => { afterFired = true })

        let terminal = htmx.__runActions({trigger: 'myEvent'}, container)

        assert.isNotOk(terminal)
        assert.isFalse(triggerFired)
        assert.isFalse(afterFired)
    })

    it('extensions consume custom actions in htmx:before:actions', function () {
        let toastMessage = null
        let container = createProcessedHTML('<div></div>')
        container.addEventListener('htmx:before:actions', e => {
            if (e.detail.actions.toast) toastMessage = e.detail.actions.toast
        })

        htmx.__runActions({toast: 'Saved!'}, container)

        assert.equal(toastMessage, 'Saved!')
    })

    it('ignores unknown action keys', function () {
        let container = createProcessedHTML('<div></div>')

        assert.isNotOk(htmx.__runActions({toast: 'Saved!'}, container))
    })

    it('pushUrl action pushes into history with history events', function () {
        let events = []
        let container = createProcessedHTML('<div></div>')
        let onBefore = e => events.push(['before', e.detail.history])
        let onAfter = e => events.push(['after', e.detail.history])
        document.addEventListener('htmx:before:history:update', onBefore)
        document.addEventListener('htmx:after:history:update', onAfter)

        htmx.__runActions({pushUrl: '/pushed-path'}, container)

        document.removeEventListener('htmx:before:history:update', onBefore)
        document.removeEventListener('htmx:after:history:update', onAfter)

        assert.include(window.location.href, '/pushed-path')
        assert.equal(events.length, 2)
        assert.equal(events[0][1].type, 'push')
        assert.equal(events[0][1].path, '/pushed-path')
    })

    it('replaceUrl action replaces the URL', function () {
        let container = createProcessedHTML('<div></div>')

        htmx.__runActions({replaceUrl: '/replaced-path'}, container)

        assert.include(window.location.href, '/replaced-path')
    })

    it('cancelling htmx:before:history:update skips the history update', function () {
        let container = createProcessedHTML('<div></div>')
        let onBefore = e => e.preventDefault()
        document.addEventListener('htmx:before:history:update', onBefore)

        htmx.__runActions({pushUrl: '/cancelled-path'}, container)

        document.removeEventListener('htmx:before:history:update', onBefore)

        assert.equal(window.location.href, originalUrl)
    })

    it('pushUrl "false" does not update history', function () {
        let container = createProcessedHTML('<div></div>')

        htmx.__runActions({pushUrl: 'false'}, container)

        assert.equal(window.location.href, originalUrl)
    })

    it('does not run history events when history is disabled', function () {
        let events = 0
        let container = createProcessedHTML('<div></div>')
        let onBefore = () => events++
        let onAfter = () => events++
        let originalHistory = htmx.config.history
        htmx.config.history = false
        document.addEventListener('htmx:before:history:update', onBefore)
        document.addEventListener('htmx:after:history:update', onAfter)

        try {
            htmx.__runActions({pushUrl: '/disabled-history'}, container)
        } finally {
            htmx.config.history = originalHistory
            document.removeEventListener('htmx:before:history:update', onBefore)
            document.removeEventListener('htmx:after:history:update', onAfter)
        }

        assert.equal(events, 0)
    })

    it('forwards custom detail to action events', function () {
        let seenPart
        let container = createProcessedHTML('<div></div>')
        let part = {id: 1}
        container.addEventListener('htmx:before:actions', e => { seenPart = e.detail.part })

        htmx.__runActions({toast: 'Saved!'}, container, {part})

        assert.strictEqual(seenPart, part)
    })

    it('ajax push option normalizes to the pushUrl action', async function () {
        mockResponse('GET', '/test', 'Done')
        createProcessedHTML('<div id="ajax-target"></div>')

        await htmx.ajax('GET', '/test', {target: '#ajax-target', push: '/ajax-pushed'})

        assert.include(window.location.href, '/ajax-pushed')
    })

    it('HX-Push-Url header overrides hx-push-url attribute', async function () {
        mockResponse('GET', '/test', 'Done', {headers: {'HX-Push-Url': '/from-header'}})
        let div = createProcessedHTML('<div hx-get="/test" hx-push-url="/from-attr"></div>')

        div.click()
        await forRequest()

        assert.include(window.location.href, '/from-header')
    })

    it('custom HX headers and ctx reach htmx:before:actions during requests', async function () {
        let toast = null
        let actionCtx
        mockResponse('GET', '/test', 'Done', {headers: {'HX-Toast': 'Saved!'}})
        let div = createProcessedHTML('<div hx-get="/test"></div>')
        div.addEventListener('htmx:before:actions', e => {
            toast = e.detail.actions.toast
            actionCtx = e.detail.ctx
        })

        div.click()
        await forRequest()

        assert.equal(toast, 'Saved!')
        assert.equal(actionCtx.sourceElement, div)
        assert.equal(div.textContent, 'Done')
    })

    it('HX-Location pushes history by default', async function () {
        mockResponse('GET', '/test', 'ignored', {headers: {'HX-Location': 'path:/location-path, target:#dest'}})
        mockResponse('GET', '/location-path', 'Located')
        createProcessedHTML('<div id="dest"></div><div id="loc-source" hx-get="/test"></div>')

        find('#loc-source').click()
        await htmx.timeout(50)

        assert.equal(find('#dest').textContent, 'Located')
        assert.include(window.location.href, '/location-path')
    })

    it('HX-Location honors replace', async function () {
        mockResponse('GET', '/test', 'ignored', {headers: {'HX-Location': 'path:/location-replaced, target:#dest, replace:/location-replaced'}})
        mockResponse('GET', '/location-replaced', 'Located')
        createProcessedHTML('<div id="dest"></div><div id="loc-source" hx-get="/test"></div>')

        find('#loc-source').click()
        await htmx.timeout(50)

        assert.equal(find('#dest').textContent, 'Located')
        assert.include(window.location.href, '/location-replaced')
        assert.equal(history.state?.htmx, true)
    })

});
