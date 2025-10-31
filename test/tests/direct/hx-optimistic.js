describe('direct hx-optimistic attribute test', function() {

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })

    it('shows optimistic content then replaces with response w/innerHTML', async function () {
        mockResponse('GET', '/test', 'Server Response')
        let btn = createProcessedHTML('<button hx-get="/test" hx-optimistic="#optimistic-source">Initial</button><div id="optimistic-source">Optimistic</div>');
        let promise = directlyInvokeHandler(btn);
        btn.innerText.should.equal("InitialOptimistic") // text content is hidden
        await promise
        btn.innerText.should.equal("Server Response")
    })

    it('shows optimistic content then reverts on request failure w/innerHTML', async function () {
        mockFailure('GET', '/test', 'Network error')
        let btn = createProcessedHTML('<button hx-get="/test" hx-optimistic="#optimistic-source">Initial</button><div id="optimistic-source">Optimistic</div>');
        let promise = directlyInvokeHandler(btn);
        btn.innerText.should.equal("InitialOptimistic")
        await promise.catch(() => {}) // swallow error
        btn.innerText.should.equal("Initial") // reverts to original
    })

    it('shows optimistic content then replaces with response w/outerHTML', async function () {
        mockResponse('GET', '/test', 'Server Response')
        let btn = createProcessedHTML('<button hx-get="/test" hx-optimistic="#optimistic-source" hx-swap="outerHTML">Initial</button><div id="optimistic-source">Optimistic</div>');
        let promise = directlyInvokeHandler(btn);
        playground().innerText.trim().should.include("Optimistic")
        await promise
        playground().innerText.trim().should.include("Server Response")
    })

    it('shows optimistic content then reverts on request failure w/outerHTML', async function () {
        mockFailure('GET', '/test', 'Network error')
        let btn = createProcessedHTML('<button hx-get="/test" hx-optimistic="#optimistic-source" hx-swap="outerHTML">Initial</button><div id="optimistic-source">Optimistic</div>');
        let promise = directlyInvokeHandler(btn);
        playground().innerText.should.equal("Optimistic\nOptimistic")
        await promise.catch(() => {}) // swallow error
        playground().innerText.should.equal("Initial\nOptimistic") // reverts to original
    })

})
