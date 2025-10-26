describe('hx-select', function() {

    beforeEach(() => {
        setupTest()
    })

    afterEach(() => {
        cleanupTest()
    })

    it('selects content from response', async function () {
        mockResponse('GET', '/test', '<div><div id="content">Selected</div><div id="other">Not selected</div></div>')
        let div = initHTML('<div hx-get="/test" hx-select="#content" hx-swap="innerHTML">Old</div>');
        await clickAndWait(div)
        assert.equal(div.innerHTML, 'Selected')
    })

    it('selects nested content from response', async function () {
        mockResponse('GET', '/test', '<html><body><nav>Nav</nav><main id="main">Main content</main><footer>Footer</footer></body></html>')
        let div = initHTML('<div hx-get="/test" hx-select="#main" hx-swap="innerHTML">Old</div>');
        await clickAndWait(div)
        assert.equal(div.innerHTML, 'Main content')
    })

    it('does not affect OOB swaps', async function () {
        mockResponse('GET', '/test', '<div><div id="content">Selected</div><div id="oob" hx-swap-oob="true">OOB content</div></div>')
        let div = initHTML('<div hx-get="/test" hx-select="#content" hx-swap="innerHTML">Old</div><div id="oob">Old OOB</div>');
        await clickAndWait(div)
        assert.equal(div.innerHTML, 'Selected')
        assert.equal(document.getElementById('oob').innerHTML, 'OOB content')
    })

    it('returns empty string if selector not found', async function () {
        mockResponse('GET', '/test', '<div><div id="content">Content</div></div>')
        let div = initHTML('<div hx-get="/test" hx-select="#notfound" hx-swap="innerHTML">Old</div>');
        await clickAndWait(div)
        assert.equal(div.innerHTML, '')
    })

    it('works with class selectors', async function () {
        mockResponse('GET', '/test', '<div><div class="selected">Selected</div><div class="other">Not selected</div></div>')
        let div = initHTML('<div hx-get="/test" hx-select=".selected" hx-swap="innerHTML">Old</div>');
        await clickAndWait(div)
        assert.equal(div.innerHTML, 'Selected')
    })

    it('works with complex selectors', async function () {
        mockResponse('GET', '/test', '<div><table><tbody><tr><td>Cell</td></tr></tbody></table></div>')
        let table = initHTML('<table hx-get="/test" hx-select="table tbody" hx-swap="innerHTML"><tbody><tr><td>Old</td></tr></tbody></table>');
        await clickAndWait(table)
        assert.include(table.innerHTML, '<tr><td>Cell</td></tr>')
    })
})
