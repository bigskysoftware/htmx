describe('hx-swap-oob', function() {

    beforeEach(() => {
        setupTest()
    })

    afterEach(() => {
        cleanupTest()
    })

    it('swaps oob element by id with default outerHTML', async function () {
        mockResponse('GET', '/test', '<div>Main</div><div id="oob1" hx-swap-oob="true">OOB Content</div>')
        createProcessedHTML('<div hx-get="/test">Click</div><div id="oob1">Original</div>');
        find('[hx-get]').click()
        await forRequest()
        assertTextContentIs('#oob1', 'OOB Content')
    })

    it('swaps oob element with innerHTML', async function () {
        mockResponse('GET', '/test', '<div>Main</div><div id="oob2" hx-swap-oob="innerHTML">New Inner</div>')
        createProcessedHTML('<div hx-get="/test">Click</div><div id="oob2"><span>Old</span></div>');
        find('[hx-get]').click()
        await forRequest()
        assertTextContentIs('#oob2', 'New Inner')
    })

    it('swaps oob element with custom selector', async function () {
        mockResponse('GET', '/test', '<div>Main</div><div id="x" hx-swap-oob="outerHTML:#target">OOB Target</div>')
        createProcessedHTML('<div hx-get="/test">Click</div><div id="target">Original Target</div>');
        find('[hx-get]').click()
        await forRequest()
        assertTextContentIs('#x', 'OOB Target')
    })

    it('swaps multiple oob elements', async function () {
        mockResponse('GET', '/test', '<div>Main</div><div id="a" hx-swap-oob="true">A</div><div id="b" hx-swap-oob="true">B</div>')
        createProcessedHTML('<div hx-get="/test">Click</div><div id="a">Old A</div><div id="b">Old B</div>');
        find('[hx-get]').click()
        await forRequest()
        assertTextContentIs('#a', 'A')
        assertTextContentIs('#b', 'B')
    })

    it('swaps oob with target: modifier', async function () {
        mockResponse('GET', '/test', '<div>Main</div><div id="x" hx-swap-oob="innerHTML target:#custom">Target Content</div>')
        createProcessedHTML('<div hx-get="/test">Click</div><div id="custom">Original</div>');
        find('[hx-get]').click()
        await forRequest()
        assertTextContentIs('#custom', 'Target Content')
    })

    it('swaps oob with target: modifier and multi-word selector', async function () {
        mockResponse('GET', '/test', '<div>Main</div><div id="x" hx-swap-oob="innerHTML target:.foo .bar">Multi Selector</div>')
        createProcessedHTML('<div hx-get="/test">Click</div><div class="foo"><div class="bar">Original</div></div>');
        find('[hx-get]').click()
        await forRequest()
        assertTextContentIs('.foo .bar', 'Multi Selector')
    })

    it('swaps oob with target: modifier and other modifiers (non-blocking)', async function () {
        mockResponse('GET', '/test', '<div>Main</div><div id="x" hx-swap-oob="innerHTML target:#tgt swap:100ms">With Delay</div>')
        createProcessedHTML('<div hx-get="/test">Click</div><div id="tgt">Original</div>');
        
        find('[hx-get]').click()
        await forRequest()
        
        // Should still be original immediately after request completes
        assertTextContentIs('#tgt', 'Original')
        
        // Wait for the delayed swap to complete
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Now should be updated
        assertTextContentIs('#tgt', 'With Delay')
    })

    it('swaps oob with legacy colon format', async function () {
        mockResponse('GET', '/test', '<div>Main</div><div id="x" hx-swap-oob="innerHTML:#legacy">Legacy Format</div>')
        createProcessedHTML('<div hx-get="/test">Click</div><div id="legacy">Original</div>');
        find('[hx-get]').click()
        await forRequest()
        assertTextContentIs('#legacy', 'Legacy Format')
    })
})
