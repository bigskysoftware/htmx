describe('hx-swap modifiers', function() {

    beforeEach(() => {
        setupTest()
    })

    afterEach(() => {
        cleanupTest()
    })

    it('properly parses various swap specifications', function() {
        assert.equal(htmx.__parseSwapSpec('innerHTML').style, 'innerHTML')
        assert.equal(htmx.__parseSwapSpec('innerHTML').swapDelay, undefined)
        assert.equal(htmx.__parseSwapSpec('innerHTML swap:10').swapDelay, 10)
        assert.equal(htmx.__parseSwapSpec('innerHTML swap:0').swapDelay, 0)
        assert.equal(htmx.__parseSwapSpec('innerHTML swap:0ms').swapDelay, 0)
        assert.equal(htmx.__parseSwapSpec('innerHTML settle:10').settleDelay, 10)
        assert.equal(htmx.__parseSwapSpec('innerHTML settle:0').settleDelay, 0)
        assert.equal(htmx.__parseSwapSpec('innerHTML settle:0s').settleDelay, 0)
        assert.equal(htmx.__parseSwapSpec('innerHTML swap:10 settle:11').swapDelay, 10)
        assert.equal(htmx.__parseSwapSpec('innerHTML swap:10 settle:11').settleDelay, 11)
        assert.equal(htmx.__parseSwapSpec('innerHTML settle:11 swap:10').swapDelay, 10)
        assert.equal(htmx.__parseSwapSpec('innerHTML settle:11 swap:10').settleDelay, 11)
        assert.equal(htmx.__parseSwapSpec('innerHTML settle:0 swap:0').settleDelay, 0)
        assert.equal(htmx.__parseSwapSpec('innerHTML settle:0s swap:0ms').settleDelay, 0)
        assert.equal(htmx.__parseSwapSpec('innerHTML nonsense settle:11 swap:10').settleDelay, 11)
        assert.equal(htmx.__parseSwapSpec('innerHTML   nonsense   settle:11   swap:10  ').settleDelay, 11)

        assert.equal(htmx.__parseSwapSpec('swap:10').style, 'outerHTML')
        assert.equal(htmx.__parseSwapSpec('swap:10').swapDelay, 10)
        assert.equal(htmx.__parseSwapSpec('swap:0').swapDelay, 0)
        assert.equal(htmx.__parseSwapSpec('swap:0s').swapDelay, 0)

        assert.equal(htmx.__parseSwapSpec('settle:10').style, 'outerHTML')
        assert.equal(htmx.__parseSwapSpec('settle:10').settleDelay, 10)
        assert.equal(htmx.__parseSwapSpec('settle:0').settleDelay, 0)
        assert.equal(htmx.__parseSwapSpec('settle:0s').settleDelay, 0)

        assert.equal(htmx.__parseSwapSpec('swap:10 settle:11').style, 'outerHTML')
        assert.equal(htmx.__parseSwapSpec('swap:10 settle:11').swapDelay, 10)
        assert.equal(htmx.__parseSwapSpec('swap:10 settle:11').settleDelay, 11)
        assert.equal(htmx.__parseSwapSpec('swap:0s settle:0').swapDelay, 0)
        assert.equal(htmx.__parseSwapSpec('swap:0s settle:0').settleDelay, 0)

        assert.equal(htmx.__parseSwapSpec('settle:11 swap:10').style, 'outerHTML')
        assert.equal(htmx.__parseSwapSpec('settle:11 swap:10').swapDelay, 10)
        assert.equal(htmx.__parseSwapSpec('settle:11 swap:10').settleDelay, 11)
        assert.equal(htmx.__parseSwapSpec('settle:0s swap:10').swapDelay, 10)
        assert.equal(htmx.__parseSwapSpec('settle:0s swap:10').settleDelay, 0)

        assert.equal(htmx.__parseSwapSpec('transition:true').transition, true)
        assert.equal(htmx.__parseSwapSpec('strip:true').strip, true)
        assert.equal(htmx.__parseSwapSpec('target:#table tbody').target, '#table tbody')
        assert.equal(htmx.__parseSwapSpec('target:#table tbody swap:10s').target, '#table tbody')
        assert.equal(htmx.__parseSwapSpec('customstyle settle:11 swap:10').style, 'customstyle')
    })

    it('swap with scroll:top modifier scrolls to top', async function () {
        mockResponse('GET', '/test', '<div style="height:2000px">Tall content</div>')
        let div = initHTML('<div hx-get="/test" hx-swap="innerHTML scroll:top" style="height:100px;overflow:auto"><div style="height:2000px">Old</div></div>');
        div.scrollTop = 500;
        await clickAndWait(div)
        assert.equal(div.scrollTop, 0)
    })

    it('swap with scroll:bottom modifier scrolls to bottom', async function () {
        mockResponse('GET', '/test', '<div style="height:2000px">Tall content</div>')
        let div = initHTML('<div hx-get="/test" hx-swap="innerHTML scroll:bottom" style="height:100px;overflow:auto"><div style="height:2000px">Old</div></div>');
        await clickAndWait(div)
        assert.isAbove(div.scrollTop, 0)
    })

    it('processes scripts in swapped content', async function () {
        mockResponse('GET', '/test', '<div><script>window.testScriptRan = true;</script></div>')
        let div = initHTML('<div hx-get="/test">Old</div>');
        window.testScriptRan = false;
        await clickAndWait(div)
        assert.isTrue(window.testScriptRan)
        delete window.testScriptRan;
    })

    it('swap with delay (blocking - default behavior) waits for delay before completing request', async function () {
        mockResponse('GET', '/test', '<div>New Content</div>')
        initHTML('<div id="test-div" hx-get="/test" hx-swap="innerHTML swap:100ms">Old Content</div>');
        
        await clickAndWait('#test-div')
        assertTextContentIs('#test-div', 'New Content')
    })

    it('swap with delay (non-blocking) completes request immediately but delays swap', async function () {
        mockResponse('GET', '/test', '<div>New Content</div>')
        initHTML('<div id="test-div" hx-get="/test" hx-swap="innerHTML swap:100ms async:false">Old Content</div>');
        
        await clickAndWait('#test-div')
        
        // Should still be old content immediately after request completes
        assertTextContentIs('#test-div', 'Old Content')
        
        // Wait for the delayed swap to complete
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Now should be updated
        assertTextContentIs('#test-div', 'New Content')
    })
})
