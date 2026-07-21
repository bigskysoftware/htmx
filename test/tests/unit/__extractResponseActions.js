describe('__extractResponseActions unit tests', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    it('extracts HX headers from response', function () {
        let response = {
            headers: new Headers({
                'HX-Trigger': 'myEvent',
                'HX-Redirect': '/new-page',
                'Content-Type': 'text/html'
            })
        }

        let actions = htmx.__extractResponseActions(response)

        assert.equal(actions.trigger, 'myEvent')
        assert.equal(actions.redirect, '/new-page')
        assert.isUndefined(actions.contentType)
    })

    it('converts header names to camelCase', function () {
        let response = {
            headers: new Headers({
                'HX-Push-Url': '/new-url',
                'HX-Replace-Url': '/replace-url',
                'HX-Reswap': 'outerHTML'
            })
        }

        let actions = htmx.__extractResponseActions(response)

        assert.equal(actions.pushUrl, '/new-url')
        assert.equal(actions.replaceUrl, '/replace-url')
        assert.equal(actions.reswap, 'outerHTML')
    })

    it('extracts unknown HX headers as custom actions', function () {
        let response = {
            headers: new Headers({
                'HX-Toast': 'Saved!',
                'HX-Foo-Bar': 'baz'
            })
        }

        let actions = htmx.__extractResponseActions(response)

        assert.equal(actions.toast, 'Saved!')
        assert.equal(actions.fooBar, 'baz')
    })

    it('handles empty headers', function () {
        let response = { headers: new Headers() }

        assert.deepEqual(htmx.__extractResponseActions(response), {})
    })

    it('only extracts headers that start with HX-', function () {
        let response = {
            headers: new Headers({
                'HX-Trigger': 'myEvent',
                'X-Custom-Header': 'value',
                'Content-Type': 'text/html',
                'HX-Refresh': 'true'
            })
        }

        let actions = htmx.__extractResponseActions(response)

        assert.equal(actions.trigger, 'myEvent')
        assert.equal(actions.refresh, 'true')
        assert.isUndefined(actions.customHeader)
        assert.isUndefined(actions.contentType)
    })

    it('handles case-insensitive HX- prefix', function () {
        let response = {
            headers: new Headers({
                'hx-trigger': 'lowercase',
                'Hx-Redirect': 'mixedcase',
                'HX-REFRESH': 'uppercase'
            })
        }

        let actions = htmx.__extractResponseActions(response)

        assert.equal(actions.trigger, 'lowercase')
        assert.equal(actions.redirect, 'mixedcase')
        assert.equal(actions.refresh, 'uppercase')
    })

});
