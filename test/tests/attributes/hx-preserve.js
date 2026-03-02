describe('hx-preserve attribute', function() {

    beforeEach(() => {
        setupTest()
    })

    afterEach(() => {
        cleanupTest()
    })

    it('preserves element with hx-preserve during swap', async function () {
        mockResponse('GET', '/test', '<div id="preserved" hx-preserve>Preserved</div><div>New</div>')
        let div = createProcessedHTML('<div hx-get="/test"><div id="preserved" hx-preserve>Original</div></div>');
        div.click()
        await forRequest()
        assertTextContentIs('#preserved', 'Original')
    })

    it('preserves element state during swap', async function () {
        mockResponse('GET', '/test', '<input id="inp" hx-preserve value="new"/>')
        let div = createProcessedHTML('<div hx-get="/test"><input id="inp" hx-preserve value="old"/></div>');
        find('#inp').value = 'modified';
        div.click()
        await forRequest()
        assert.equal(find('#inp').value, 'modified')
    })

    it('handles hx-preserve when element does not exist in current page', async function () {
        mockResponse('GET', '/test', '<div id="new-preserved" hx-preserve>New Preserved</div><div>Content</div>')
        let div = createProcessedHTML('<div hx-get="/test"><div>Original Content</div></div>');
        div.click()
        await forRequest()
        assertTextContentIs('#new-preserved', 'New Preserved')
    })

    it('preserves multiple hx-preserve elements without skipping any', async function () {
        mockResponse('GET', '/test',
            '<div id="p1" hx-preserve>New1</div>' +
            '<div id="p2" hx-preserve>New2</div>' +
            '<div id="p3" hx-preserve>New3</div>' +
            '<div>Other</div>')
        let div = createProcessedHTML(
            '<div hx-get="/test">' +
            '<div id="p1" hx-preserve>Original1</div>' +
            '<div id="p2" hx-preserve>Original2</div>' +
            '<div id="p3" hx-preserve>Original3</div>' +
            '</div>');
        div.click()
        await forRequest()
        // All three should retain original content — bug causes p2 to be lost
        assertTextContentIs('#p1', 'Original1')
        assertTextContentIs('#p2', 'Original2')
        assertTextContentIs('#p3', 'Original3')
    })
})
