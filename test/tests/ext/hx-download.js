describe('hx-download extension', function() {

    let extBackup
    let originalCreateObjectURL
    let originalRevokeObjectURL
    let originalAnchorClick

    before(async function() {
        extBackup = backupExtensions()
        clearExtensions()
        htmx.config.extensions = 'download'

        let script = document.createElement('script')
        script.src = '../src/ext/hx-download.js'
        await new Promise(resolve => {
            script.onload = resolve
            document.head.appendChild(script)
        })
    })

    after(function() {
        restoreExtensions(extBackup)
    })

    beforeEach(function() {
        setupTest()
        originalCreateObjectURL = URL.createObjectURL
        originalRevokeObjectURL = URL.revokeObjectURL
        originalAnchorClick = HTMLAnchorElement.prototype.click
    })

    afterEach(function() {
        URL.createObjectURL = originalCreateObjectURL
        URL.revokeObjectURL = originalRevokeObjectURL
        HTMLAnchorElement.prototype.click = originalAnchorClick
        cleanupTest()
    })

    // The download swap style streams the response instead of swapping it.
    it('activates from ctx.swap', async function() {
        let filename
        URL.createObjectURL = () => 'blob:test'
        URL.revokeObjectURL = () => {}
        HTMLAnchorElement.prototype.click = function() {
            filename = this.download
        }

        fetchMock.mockResponse('GET', '/report.txt', new Response('report', {
            headers: {
                'Content-Disposition': 'inline',
                'Content-Type': 'text/plain'
            }
        }))
        let button = createProcessedHTML('<button hx-get="/report.txt" hx-swap="download">Download</button>')
        let complete = waitForEvent('htmx:download:complete')

        button.click()
        await complete

        assert.equal(filename, 'report.txt')
        assert.equal(button.innerText, 'Download')
    })
})
