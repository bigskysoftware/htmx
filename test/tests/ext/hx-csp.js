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

    // CSP rewrites canonical response content before core builds the swap fragment.
    it('scrubs the page nonce from ctx.swap.content', async function() {
        mockResponse('GET', '/test', '<script type="application/json" nonce="test-nonce">{}</script>')
        let button = createProcessedHTML('<button hx-get="/test" hx-target="#target" hx-nonce="test-nonce">Load</button><div id="target"></div>')
        let responseContent
        button.addEventListener('htmx:after:response', event => {
            responseContent = event.detail.ctx.swap.content
        })

        button.click()
        await forRequest()

        assert.notInclude(responseContent, 'test-nonce')
        assert.isFalse(find('#target script').hasAttribute('nonce'))
    })
})
