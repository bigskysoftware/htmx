describe('__extractHxHeaders unit tests', function() {

    beforeEach(function() {
        setupTest();
    });

    afterEach(function() {
        cleanupTest();
    });

    it('extracts HX headers from response', function () {
        let ctx = {
            response: {
                raw: {
                    headers: new Headers({
                        'HX-Trigger': 'myEvent',
                        'HX-Redirect': '/new-page',
                        'Content-Type': 'text/html'
                    })
                }
            }
        }

        htmx.__extractHxHeaders(ctx)

        assert.equal(ctx.hx.trigger, 'myEvent')
        assert.equal(ctx.hx.redirect, '/new-page')
        assert.isUndefined(ctx.hx.contenttype)
    })

    it('converts header names to lowercase and removes hyphens', function () {
        let ctx = {
            response: {
                raw: {
                    headers: new Headers({
                        'HX-Push-Url': '/new-url',
                        'HX-Replace-Url': '/replace-url',
                        'HX-Re-Swap': 'outerHTML'
                    })
                }
            }
        }

        htmx.__extractHxHeaders(ctx)

        assert.equal(ctx.hx.pushurl, '/new-url')
        assert.equal(ctx.hx.replaceurl, '/replace-url')
        assert.equal(ctx.hx.reswap, 'outerHTML')
    })

    it('handles empty headers', function () {
        let ctx = {
            response: {
                raw: {
                    headers: new Headers()
                }
            }
        }

        htmx.__extractHxHeaders(ctx)

        assert.deepEqual(ctx.hx, {})
    })

    it('only extracts headers that start with HX-', function () {
        let ctx = {
            response: {
                raw: {
                    headers: new Headers({
                        'HX-Trigger': 'myEvent',
                        'X-Custom-Header': 'value',
                        'Content-Type': 'text/html',
                        'HX-Refresh': 'true'
                    })
                }
            }
        }

        htmx.__extractHxHeaders(ctx)

        assert.equal(ctx.hx.trigger, 'myEvent')
        assert.equal(ctx.hx.refresh, 'true')
        assert.isUndefined(ctx.hx.customheader)
        assert.isUndefined(ctx.hx.contenttype)
    })

    it('handles case-insensitive HX- prefix', function () {
        let ctx = {
            response: {
                raw: {
                    headers: new Headers({
                        'hx-trigger': 'lowercase',
                        'Hx-Redirect': 'mixedcase',
                        'HX-REFRESH': 'uppercase'
                    })
                }
            }
        }

        htmx.__extractHxHeaders(ctx)

        assert.equal(ctx.hx.trigger, 'lowercase')
        assert.equal(ctx.hx.redirect, 'mixedcase')
        assert.equal(ctx.hx.refresh, 'uppercase')
    })

    it('overwrites existing ctx.hx object', function () {
        let ctx = {
            hx: {
                oldValue: 'should be removed'
            },
            response: {
                raw: {
                    headers: new Headers({
                        'HX-Trigger': 'newEvent'
                    })
                }
            }
        }

        htmx.__extractHxHeaders(ctx)

        assert.equal(ctx.hx.trigger, 'newEvent')
        assert.isUndefined(ctx.hx.oldValue)
    })

});
