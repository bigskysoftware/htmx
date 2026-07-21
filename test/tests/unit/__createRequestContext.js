describe('__createRequestContext unit tests', function() {

    beforeEach(function() {
        setupTest()
    })

    afterEach(function() {
        cleanupTest()
    })

    it('constructs canonical swap and action state', function() {
        createProcessedHTML('<div id="target"></div><button hx-get="/test" hx-target="#fallback" hx-swap="outerHTML target:#target select:#selected selectOOB:#oob transition:true settle:200ms content:\'Initial content\'" hx-push-url="/pushed" hx-replace-url="/replaced"></button>')
        let source = find('button')
        let ctx = htmx.__createRequestContext(source, new Event('click'))

        assert.deepEqual(Object.keys(ctx.swap), [
            'content',
            'target',
            'style',
            'select',
            'selectOOB',
            'transition',
            'settleDelay'
        ])
        assert.equal(ctx.swap.content, 'Initial content')
        assert.equal(ctx.swap.target?.id, 'target')
        assert.equal(ctx.swap.style, 'outerHTML')
        assert.equal(ctx.swap.select, '#selected')
        assert.equal(ctx.swap.selectOOB, '#oob')
        assert.isTrue(ctx.swap.transition)
        assert.equal(ctx.swap.settleDelay, '200ms')
        assert.deepEqual(ctx.actions, {
            pushUrl: '/pushed',
            replaceUrl: '/replaced'
        })
    })

    // Modifier-only hx-swap currently treats the full default string as its style.
    // Layer defaults separately to preserve both the style and its modifiers.
    it('layers modifier-only hx-swap over global swap defaults', function() {
        let originalDefaultSwap = htmx.config.defaultSwap
        try {
            htmx.config.defaultSwap = 'outerHTML settle:200ms'
            let source = createProcessedHTML('<button hx-get="/test" hx-swap="transition:true"></button>')
            let ctx = htmx.__createRequestContext(source, new Event('click'))

            assert.equal(ctx.swap.style, 'outerHTML')
            assert.equal(ctx.swap.settleDelay, '200ms')
            assert.isTrue(ctx.swap.transition)
        } finally {
            htmx.config.defaultSwap = originalDefaultSwap
        }
    })

    // An explicit style currently replaces the default string and drops its modifiers.
    // Layer hx-swap over parsed defaults to retain unspecified global fields.
    it('preserves global swap modifiers when hx-swap overrides style', function() {
        let originalDefaultSwap = htmx.config.defaultSwap
        try {
            htmx.config.defaultSwap = 'innerHTML settle:200ms'
            let source = createProcessedHTML('<button hx-get="/test" hx-swap="outerHTML"></button>')
            let ctx = htmx.__createRequestContext(source, new Event('click'))

            assert.equal(ctx.swap.style, 'outerHTML')
            assert.equal(ctx.swap.settleDelay, '200ms')
        } finally {
            htmx.config.defaultSwap = originalDefaultSwap
        }
    })

    it('accepts structured global swap defaults', function() {
        let originalDefaultSwap = htmx.config.defaultSwap
        try {
            htmx.config.defaultSwap = {style: 'outerHTML', settleDelay: '200ms'}
            let source = createProcessedHTML('<button hx-get="/test"></button>')
            let ctx = htmx.__createRequestContext(source, new Event('click'))

            assert.equal(ctx.swap.style, 'outerHTML')
            assert.equal(ctx.swap.settleDelay, '200ms')
        } finally {
            htmx.config.defaultSwap = originalDefaultSwap
        }
    })

    // Post-construction AJAX mutation leaves derived headers stale.
    // Canonical overrides apply before target and header derivation.
    it('applies canonical overrides during construction', function() {
        createProcessedHTML('<div id="attribute-target"></div><div id="override-target"></div><button hx-get="/test" hx-target="#attribute-target"></button>')
        let source = find('button')
        let target = find('#override-target')
        let ctx = htmx.__createRequestContext(source, new Event('click'), {
            swap: {
                target,
                select: '#selection'
            },
            actions: {
                pushUrl: '/override'
            }
        })

        assert.equal(ctx.swap.target?.id, 'override-target')
        assert.equal(ctx.actions.pushUrl, '/override')
        assert.equal(ctx.request.headers['HX-Target'], 'div#override-target')
        assert.equal(ctx.request.headers['HX-Request-Type'], 'full')
    })

    // Replacing request options currently discards generated defaults.
    // Merge plain request records while replacing opaque platform values.
    it('merges request overrides with generated defaults', function() {
        let source = createProcessedHTML('<button hx-get="/test"></button>')
        let signal = new AbortController().signal
        let ctx = htmx.__createRequestContext(source, new Event('click'), {
            request: {
                signal,
                headers: {
                    'X-Test': 'true'
                }
            }
        })

        assert.equal(ctx.request.headers['HX-Request'], 'true')
        assert.equal(ctx.request.headers['X-Test'], 'true')
        assert.strictEqual(ctx.request.signal, signal)
        assert.equal(ctx.request.mode, htmx.config.mode)
    })
})
