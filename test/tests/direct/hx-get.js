describe('direct hx-get attribute test', function() {

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })

    it('properly swaps content', async function () {
        mockResponse('GET', '/test', 'Clicked!')
        let btn = createProcessedHTML('<button hx-get="/test">Click Me!</button> Hey!');
        await directlyInvokeHandler(btn)
        playground().innerText.should.equal('Clicked! Hey!')
    })

    it('properly swaps content with outer swap', async function () {
        mockResponse('GET', '/test', 'Clicked!')
        let btn = createProcessedHTML('<button hx-get="/test" hx-swap="outerHTML">Click Me!</button>');
        await directlyInvokeHandler(btn)
        playground().innerHTML.should.equal('Clicked!')
    })

})
