describe('__handleTriggerEvent unit tests', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    it('returns early if element not connected', async function () {
        let div = createProcessedHTML('<div hx-get="js:window.testExecuted = true"></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))
        div.remove()
        await htmx.__handleTriggerEvent(ctx)
        assert.isUndefined(window.testExecuted)
    })

    it('returns early if modifier key click', async function () {
        let div = createProcessedHTML('<div hx-get="js:window.testExecuted = true"></div>')
        let evt = new MouseEvent('click', {ctrlKey: true})
        let ctx = htmx.__createRequestContext(div, evt)
        await htmx.__handleTriggerEvent(ctx)
        assert.isUndefined(window.testExecuted)
    })

    it('prevents default when shouldCancel returns true', async function () {
        let link = createProcessedHTML('<a href="/test" hx-get="js:">Link</a>')
        let evt = new MouseEvent('click', {bubbles: true, cancelable: true})
        Object.defineProperty(evt, 'currentTarget', {value: link, writable: false})
        let ctx = htmx.__createRequestContext(link, evt)
        await htmx.__handleTriggerEvent(ctx)
        assert.isTrue(evt.defaultPrevented)
    })

    it('resolves target from ctx.target', async function () {
        createProcessedHTML('<div id="target"></div><button hx-get="js:" hx-target="#target"></button>')
        let button = document.querySelector('button')
        let ctx = htmx.__createRequestContext(button, new Event('click'))
        await htmx.__handleTriggerEvent(ctx)
        assert.equal(ctx.target.id, 'target')
    })

    it('collects form data from element', async function () {
        let form = createProcessedHTML('<form><input name="field" value="test"><button hx-post="js:"></button></form>')
        let button = form.querySelector('button')
        let ctx = htmx.__createRequestContext(button, new Event('click'))
        await htmx.__handleTriggerEvent(ctx)
        assert.equal(ctx.request.body.get('field'), 'test')
    })

    it('applies hx-vals to body', async function () {
        let div = createProcessedHTML('<div hx-get="js:window.foo = extra" hx-vals=\'{"extra":"value"}\'></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))
        await htmx.__handleTriggerEvent(ctx)
        assert.equal(window.foo, 'value')
        delete window.foo
    })

    it('applies ctx.values to body', async function () {
        let div = createProcessedHTML('<div hx-get="js:window.foo = custom"></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))
        ctx.values = {custom: 'data'}
        await htmx.__handleTriggerEvent(ctx)
        assert.equal(window.foo, 'data')
        delete window.foo
    })

    it('ctx.values override form data', async function () {
        let form = createProcessedHTML('<form><input name="field" value="original"><button hx-post="js:"></button></form>')
        let button = form.querySelector('button')
        let ctx = htmx.__createRequestContext(button, new Event('click'))
        ctx.values = {field: 'override'}
        await htmx.__handleTriggerEvent(ctx)
        assert.equal(ctx.request.body.get('field'), 'override')
    })

    it('strips anchor from action', async function () {
        let div = createProcessedHTML('<div hx-get="js:#anchor"></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))
        await htmx.__handleTriggerEvent(ctx)
        assert.equal(ctx.request.action, 'js:')
    })

    it('stores originalAction before stripping anchor', async function () {
        let div = createProcessedHTML('<div hx-get="js:#anchor"></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))
        await htmx.__handleTriggerEvent(ctx)
        assert.equal(ctx.request.originalAction, 'js:#anchor')
    })

    it('returns early if htmx:config:request cancelled', async function () {
        let div = createProcessedHTML('<div hx-get="js:window.testExecuted = true"></div>')
        div.addEventListener('htmx:config:request', (e) => e.preventDefault())
        let ctx = htmx.__createRequestContext(div, new Event('click'))
        await htmx.__handleTriggerEvent(ctx)
        assert.isUndefined(window.testExecuted)
    })

    it('returns early if method not in verbs list', async function () {
        let div = createProcessedHTML('<div hx-get="js:window.testExecuted = true"></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))
        ctx.request.method = 'INVALID'
        await htmx.__handleTriggerEvent(ctx)
        assert.isUndefined(window.testExecuted)
    })

    it('executes javascript when action starts with js:', async function () {
        let div = createProcessedHTML('<div hx-get="js:window.testExecuted = true"></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))
        await htmx.__handleTriggerEvent(ctx)
        assert.isTrue(window.testExecuted)
        delete window.testExecuted
    })

    it('executes javascript when action starts with javascript:', async function () {
        let div = createProcessedHTML('<div hx-get="javascript:window.testExecuted = true"></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))
        await htmx.__handleTriggerEvent(ctx)
        assert.isTrue(window.testExecuted)
        delete window.testExecuted
    })

    it('appends query params to GET action', async function () {
        let form = createProcessedHTML('<form><input name="q" value="search"><button hx-get="/test"></button></form>')
        let button = form.querySelector('button')
        let ctx = htmx.__createRequestContext(button, new Event('click'))
        await htmx.__handleTriggerEvent(ctx)
        assert.include(ctx.request.action, '/test?q=search')
    })

    it('sets body to null for GET with params', async function () {
        let form = createProcessedHTML('<form><input name="q" value="search"><button hx-get="/test"></button></form>')
        let button = form.querySelector('button')
        let ctx = htmx.__createRequestContext(button, new Event('click'))
        await htmx.__handleTriggerEvent(ctx)
        assert.isNull(ctx.request.body)
    })

    it('appends query params to DELETE action', async function () {
        let form = createProcessedHTML('<form><input name="id" value="123"><button hx-delete="/test"></button></form>')
        let button = form.querySelector('button')
        let ctx = htmx.__createRequestContext(button, new Event('click'))
        await htmx.__handleTriggerEvent(ctx)
        assert.include(ctx.request.action, '/test?id=123')
    })

    it('converts body to URLSearchParams for POST', async function () {
        let form = createProcessedHTML('<form><input name="field" value="test"><button hx-post="js:"></button></form>')
        let button = form.querySelector('button')
        let ctx = htmx.__createRequestContext(button, new Event('click'))
        await htmx.__handleTriggerEvent(ctx)
        assert.instanceOf(ctx.request.body, URLSearchParams)
    })

    it('keeps multipart form data as FormData', async function () {
        let form = createProcessedHTML('<form><input name="field" value="test"><button hx-post="js:" hx-encoding="multipart/form-data"></button></form>')
        let button = form.querySelector('button')
        let ctx = htmx.__createRequestContext(button, new Event('click'))
        await htmx.__handleTriggerEvent(ctx)
        assert.instanceOf(ctx.request.body, FormData)
    })

    it('stores form in ctx.request', async function () {
        let form = createProcessedHTML('<form><button hx-post="js:"></button></form>')
        let button = form.querySelector('button')
        let ctx = htmx.__createRequestContext(button, new Event('click'))
        await htmx.__handleTriggerEvent(ctx)
        assert.equal(ctx.request.form, form)
    })

    it('stores submitter in ctx.request', async function () {
        let form = createProcessedHTML('<form><button name="action" value="save" hx-post="js:"></button></form>')
        let button = form.querySelector('button')
        let evt = {type: 'submit', submitter: button}
        let ctx = htmx.__createRequestContext(button, evt)
        await htmx.__handleTriggerEvent(ctx)
        assert.equal(ctx.request.submitter, button)
    })

    it('sets credentials to same-origin', async function () {
        let div = createProcessedHTML('<div hx-get="js:"></div>')
        let ctx = htmx.__createRequestContext(div, new Event('click'))
        await htmx.__handleTriggerEvent(ctx)
        assert.equal(ctx.request.credentials, 'same-origin')
    })

    it('appends to existing query string with &', async function () {
        let form = createProcessedHTML('<form><input name="new" value="val"><button hx-get="/test?existing=1"></button></form>')
        let button = form.querySelector('button')
        let ctx = htmx.__createRequestContext(button, new Event('click'))
        await htmx.__handleTriggerEvent(ctx)
        assert.include(ctx.request.action, '/test?existing=1&new=val')
    })

});