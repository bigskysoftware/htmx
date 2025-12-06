describe('hx-swap modifiers', function() {

    beforeEach(() => {
        setupTest()
    })

    afterEach(() => {
        cleanupTest()
    })

    it('properly parses various swap specifications', function() {
        assert.equal(htmx.__parseSwapSpec('innerHTML').style, 'innerHTML')
        assert.equal(htmx.__parseSwapSpec('innerHTML').swap, undefined)
        assert.equal(htmx.__parseSwapSpec('innerHTML swap:10').swap, '10')
        assert.equal(htmx.__parseSwapSpec('innerHTML swap:0').swap, '0')
        assert.equal(htmx.__parseSwapSpec('innerHTML swap:0ms').swap, '0ms')

        assert.equal(htmx.__parseSwapSpec('swap:10').style, 'innerHTML')
        assert.equal(htmx.__parseSwapSpec('swap:10').swap, '10')
        assert.equal(htmx.__parseSwapSpec('swap:0').swap, '0')
        assert.equal(htmx.__parseSwapSpec('swap:0s').swap, '0s')

        assert.equal(htmx.__parseSwapSpec('transition:true').transition, true)
        assert.equal(htmx.__parseSwapSpec('strip:true').strip, true)
        assert.equal(htmx.__parseSwapSpec('target:"#table tbody"').target, '#table tbody')
        assert.equal(htmx.__parseSwapSpec('target:"#table tbody" swap:10s').target, '#table tbody')
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
        createProcessedHTML('<div id="test-div" hx-get="/test" hx-swap="innerHTML swap:100ms transistion:false">Old Content</div>');
        
        find('#test-div').click()
        await forRequest()
        assertTextContentIs('#test-div', 'New Content')
    })

    it('main swap with delay respects blocking behavior', async function () {
        mockResponse('GET', '/test', 'Main Content')
        createProcessedHTML('<div id="main" hx-get="/test" hx-swap="innerHTML swap:100ms">Original</div>');
        
        let startTime = Date.now();
        find('#main').click()
        await forRequest()
        let elapsed = Date.now() - startTime;
        
        // Should have waited for the delay (blocking)
        assert.isAtLeast(elapsed, 100, 'Should wait at least 100ms')
        assertTextContentIs('#main', 'Main Content')
    })
})
