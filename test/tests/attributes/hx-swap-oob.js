describe('hx-swap-oob', function() {

    beforeEach(() => {
        setupTest()
    })

    afterEach(() => {
        cleanupTest()
    })

    it('swaps oob element by id with default outerHTML', async function () {
        mockResponse('GET', '/test', '<div>Main</div><div id="oob1" hx-swap-oob="true">OOB Content</div>')
        initHTML('<div hx-get="/test">Click</div><div id="oob1">Original</div>');
        await clickAndWait('[hx-get]')
        assertTextContentIs('#oob1', 'OOB Content')
    })

    it('swaps oob element with innerHTML', async function () {
        mockResponse('GET', '/test', '<div>Main</div><div id="oob2" hx-swap-oob="innerHTML">New Inner</div>')
        initHTML('<div hx-get="/test">Click</div><div id="oob2"><span>Old</span></div>');
        await clickAndWait('[hx-get]')
        assertTextContentIs('#oob2', 'New Inner')
    })

    it('swaps oob element with custom selector', async function () {
        mockResponse('GET', '/test', '<div>Main</div><div id="x" hx-swap-oob="outerHTML:#target">OOB Target</div>')
        initHTML('<div hx-get="/test">Click</div><div id="target">Original Target</div>');
        await clickAndWait('[hx-get]')
        assertTextContentIs('#x', 'OOB Target')
    })

    it('swaps multiple oob elements', async function () {
        mockResponse('GET', '/test', '<div>Main</div><div id="a" hx-swap-oob="true">A</div><div id="b" hx-swap-oob="true">B</div>')
        initHTML('<div hx-get="/test">Click</div><div id="a">Old A</div><div id="b">Old B</div>');
        await clickAndWait('[hx-get]')
        assertTextContentIs('#a', 'A')
        assertTextContentIs('#b', 'B')
    })

    it('swaps oob with target: modifier', async function () {
        mockResponse('GET', '/test', '<div>Main</div><div id="x" hx-swap-oob="innerHTML target:#custom">Target Content</div>')
        initHTML('<div hx-get="/test">Click</div><div id="custom">Original</div>');
        await clickAndWait('[hx-get]')
        assertTextContentIs('#custom', 'Target Content')
    })

    it('swaps oob with target: modifier and multi-word selector', async function () {
        mockResponse('GET', '/test', '<div>Main</div><div id="x" hx-swap-oob="innerHTML target:.foo .bar">Multi Selector</div>')
        initHTML('<div hx-get="/test">Click</div><div class="foo"><div class="bar">Original</div></div>');
        await clickAndWait('[hx-get]')
        assertTextContentIs('.foo .bar', 'Multi Selector')
    })

    it('swaps oob with target: modifier and other modifiers', async function () {
        mockResponse('GET', '/test', '<div>Main</div><div id="x" hx-swap-oob="innerHTML target:#tgt swap:100ms">With Delay</div>')
        initHTML('<div hx-get="/test">Click</div><div id="tgt">Original</div>');
        await clickAndWait('[hx-get]')
        assertTextContentIs('#tgt', 'With Delay')
    })

    it('swaps oob with legacy colon format', async function () {
        mockResponse('GET', '/test', '<div>Main</div><div id="x" hx-swap-oob="innerHTML:#legacy">Legacy Format</div>')
        initHTML('<div hx-get="/test">Click</div><div id="legacy">Original</div>');
        await clickAndWait('[hx-get]')
        assertTextContentIs('#legacy', 'Legacy Format')
    })
})
