describe('hx-preserve attribute', function() {

    beforeEach(() => {
        setupTest()
    })

    afterEach(() => {
        cleanupTest()
    })

    it('preserves element with hx-preserve during swap', async function () {
        mockResponse('GET', '/test', '<div id="preserved" hx-preserve>Preserved</div><div>New</div>')
        let div = initHTML('<div hx-get="/test"><div id="preserved" hx-preserve>Original</div></div>');
        await clickAndWait(div)
        assertTextContentIs('#preserved', 'Original')
    })

    it('preserves element state during swap', async function () {
        mockResponse('GET', '/test', '<input id="inp" hx-preserve value="new"/>')
        let div = initHTML('<div hx-get="/test"><input id="inp" hx-preserve value="old"/></div>');
        findElt('#inp').value = 'modified';
        await clickAndWait(div)
        assert.equal(findElt('#inp').value, 'modified')
    })
})
