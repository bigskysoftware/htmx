describe('hx-csp extension', function() {

    let extBackup
    let nonceScript

    before(async function() {
        extBackup = backupExtensions()
        clearExtensions()
        htmx.config.extensions = 'hx-csp'

        nonceScript = document.createElement('script')
        nonceScript.setAttribute('nonce', 'test-nonce')
        nonceScript.nonce = 'test-nonce'
        nonceScript.type = 'application/json'
        nonceScript.textContent = '{}'
        document.head.appendChild(nonceScript)

        let script = document.createElement('script')
        script.nonce = 'test-nonce'
        script.src = '../src/ext/hx-csp.js'
        await new Promise(resolve => {
            script.onload = resolve
            document.head.appendChild(script)
        })
    })

    after(function() {
        nonceScript.remove()
        restoreExtensions(extBackup)
    })

    beforeEach(function() {
        setupTest()
    })

    afterEach(function() {
        cleanupTest()
    })

    // CSP rewrites response text before core builds the swap fragment.
    it('scrubs the page nonce from ctx.text', async function() {
        mockResponse('GET', '/test', '<script type="application/json" nonce="test-nonce">{}</script>')
        let button = createProcessedHTML('<button hx-get="/test" hx-target="#target" hx-nonce="test-nonce">Load</button><div id="target"></div>')
        let responseText
        button.addEventListener('htmx:after:request', event => {
            responseText = event.detail.ctx.text
        })

        button.click()
        await forRequest()

        assert.notInclude(responseText, 'test-nonce')
        assert.isFalse(find('#target script').hasAttribute('nonce'))
    })

    it('obeys metaCharacter when creating events', function() {
        let oldMetaCharacter = htmx.config.metaCharacter
        htmx.config.metaCharacter = '-'

        // Check one event and assume the rest are consistent with it
        let eventName
        let handler = event => eventName = event.type
        document.addEventListener('htmx:security:strip', handler)
        document.addEventListener('htmx-security-strip', handler)
        try {
            createProcessedHTML('<button hx-get="/test">Load</button>')
            assert.equal(eventName, 'htmx-security-strip', 'fired event uses metaCharacter')
        } finally {
            htmx.config.metaCharacter = oldMetaCharacter
            document.removeEventListener('htmx:security:strip', handler)
            document.removeEventListener('htmx-security-strip', handler)
        }
    })
})
