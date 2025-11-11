describe('htmx.config.relaxedJSON functionality', function() {

    beforeEach(function() {
        setupTest(this);
    });

    afterEach(function() {
        cleanupTest();
    });

    it("defaults to true", function() {
        assert.equal(htmx.config.relaxedJSON, true)
    })

    it("can be disabled to require strict JSON", function() {
        const originalValue = htmx.config.relaxedJSON

        try {
            htmx.config.relaxedJSON = false

            // Now parseJSON should require strict JSON
            assert.throws(() => htmx.parseJSON('timeout: 5000'))
            assert.throws(() => htmx.parseJSON('{timeout: 5000}'))

            // But strict JSON should work
            const parsed = htmx.parseJSON('{"timeout": 5000}')
            assert.equal(parsed.timeout, 5000)
        } finally {
            htmx.config.relaxedJSON = originalValue
        }
    })

    it("supports relaxed JSON in meta config", function() {
        // Verify parseJSON works with relaxed syntax for meta config content
        const parsed = htmx.parseJSON('defaultSwap: "outerHTML", timeout: 30000')
        assert.equal(parsed.defaultSwap, 'outerHTML')
        assert.equal(parsed.timeout, 30000)
    })

    it("allows meta config to disable relaxedJSON for rest of page", function() {
        const originalValue = htmx.config.relaxedJSON

        try {
            // Simulate what would happen if meta tag set relaxedJSON: false
            htmx.config.relaxedJSON = false

            // Now parseJSON should require strict JSON
            assert.throws(() => htmx.parseJSON('timeout: 5000'))

            // But strict JSON should work
            const parsed = htmx.parseJSON('{"timeout": 5000}')
            assert.equal(parsed.timeout, 5000)
        } finally {
            htmx.config.relaxedJSON = originalValue
        }
    })

    it("works with hx-config when enabled", async function() {
        mockResponse('GET', '/test', 'Done')
        let ctx = null
        document.addEventListener('htmx:config:request', function(e) {
            ctx = e.detail.ctx
        }, {once: true})

        let btn = createProcessedHTML('<button hx-get="/test" hx-config=\'timeout: 5000\'>Click</button>')
        btn.click()
        await forRequest()
        assert.equal(ctx.request.timeout, 5000)
    })

    it("parseJSON requires strict JSON when disabled", function() {
        const originalValue = htmx.config.relaxedJSON

        try {
            htmx.config.relaxedJSON = false

            // parseJSON should throw with relaxed syntax
            assert.throws(() => htmx.parseJSON('timeout: 5000'))
            assert.throws(() => htmx.parseJSON('{timeout: 5000}'))

            // But strict JSON should work
            const parsed = htmx.parseJSON('{"timeout": 5000}')
            assert.equal(parsed.timeout, 5000)
        } finally {
            htmx.config.relaxedJSON = originalValue
        }
    })

});
