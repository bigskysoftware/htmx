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

        assert.equal(htmx.__parseSwapSpec('swap:10').style, 'innerHTML')
        assert.equal(htmx.__parseSwapSpec('swap:10').swapDelay, 10)
        assert.equal(htmx.__parseSwapSpec('swap:0').swapDelay, 0)
        assert.equal(htmx.__parseSwapSpec('swap:0s').swapDelay, 0)

        assert.equal(htmx.__parseSwapSpec('transition:true').transition, true)
        assert.equal(htmx.__parseSwapSpec('strip:true').strip, true)
        assert.equal(htmx.__parseSwapSpec('target:#table tbody').target, '#table tbody')
        assert.equal(htmx.__parseSwapSpec('target:#table tbody swap:10s').target, '#table tbody')
        assert.equal(htmx.__parseSwapSpec('customstyle swap:10').style, 'customstyle')
    })

    it('swap with scroll:top modifier scrolls to top', async function () {
        mockResponse('GET', '/test', '<div style="height:2000px">Tall content</div>')
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="innerHTML scroll:top" style="height:100px;overflow:auto"><div style="height:2000px">Old</div></div>');
        div.scrollTop = 500;
        div.click()
        await forRequest()
        assert.equal(div.scrollTop, 0)
    })

    it('swap with scroll:bottom modifier scrolls to bottom', async function () {
        mockResponse('GET', '/test', '<div style="height:2000px">Tall content</div>')
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="innerHTML scroll:bottom" style="height:100px;overflow:auto"><div style="height:2000px">Old</div></div>');
        div.click()
        await forRequest()
        assert.isAbove(div.scrollTop, 0)
    })

    it('processes scripts in swapped content', async function () {
        mockResponse('GET', '/test', '<div><script>window.testScriptRan = true;</script></div>')
        let div = createProcessedHTML('<div hx-get="/test">Old</div>');
        window.testScriptRan = false;
        div.click()
        await forRequest()
        assert.isTrue(window.testScriptRan)
        delete window.testScriptRan;
    })

    it('swap with delay (blocking - default behavior) waits for delay before completing request', async function () {
        mockResponse('GET', '/test', '<div>New Content</div>')
        createProcessedHTML('<div id="test-div" hx-get="/test" hx-swap="innerHTML swap:100ms">Old Content</div>');
        
        find('#test-div').click()
        await forRequest()
        assertTextContentIs('#test-div', 'New Content')
    })

    it('swap with delay (non-blocking) completes request immediately but delays swap', async function () {
        mockResponse('GET', '/test', '<div>New Content</div>')
        createProcessedHTML('<div id="test-div" hx-get="/test" hx-swap="innerHTML swap:100ms transition:false">Old Content</div>');

        find('#test-div').click()
        await forRequest()

        // Should still be old content immediately after request completes
        assertTextContentIs('#test-div', 'Old Content')

        // Wait for the delayed swap to complete
        await new Promise(resolve => setTimeout(resolve, 150));

        // Now should be updated
        assertTextContentIs('#test-div', 'New Content')
    })
})
