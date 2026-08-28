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

    it('textContent swap replaces text only', async function () {
        mockResponse('GET', '/test', '<div><b>Bold</b> Text</div>')
        createProcessedHTML('<div id="target" hx-get="/test" hx-swap="textContent"><span>Old</span></div>');
        find('#target').click()
        await forRequest()
        assert.equal(find('#target').textContent, 'Bold Text')
        assert.equal(find('#target').innerHTML, 'Bold Text')
    })

    it('textContent swap preserves target element', async function () {
        mockResponse('GET', '/test', '<p>New Text</p>')
        createProcessedHTML('<div id="target" class="test" hx-get="/test" hx-swap="textContent">Old</div>');
        find('#target').click()
        await forRequest()
        assert.equal(find('#target').tagName, 'DIV')
        assert.equal(find('#target').className, 'test')
        assert.equal(find('#target').textContent, 'New Text')
    })

    it('outerHTML with body fragment on non-body target strips body wrapper', async function () {
        mockResponse('GET', '/test', '<body class="from-response"><p>New content</p></body>')
        createProcessedHTML('<button id="btn" hx-get="/test" hx-target="#target" hx-swap="outerHTML">Get</button><div id="target" class="original">Old</div>');
        find('#btn').click()
        await forRequest()
        // Target should be replaced by <p>, body wrapper stripped
        assert.isUndefined(find('#target'), 'Target should be replaced')
        let p = find('p')
        assert.exists(p)
        assert.equal(p.textContent, 'New content')
        assert.equal(p.parentElement.id, 'test-playground')
    })

    it('outerHTML with full HTML document on non-body target strips body wrapper', async function () {
        mockResponse('GET', '/test', '<!DOCTYPE html><html><head><title>Page</title></head><body class="page"><div class="content">Content</div></body></html>')
        createProcessedHTML('<button id="btn" hx-get="/test" hx-target="#target" hx-swap="outerHTML">Get</button><div id="target" class="widget">Widget</div>');
        find('#btn').click()
        await forRequest()
        assert.isUndefined(find('#target'), 'Target should be replaced')
        let content = find('.content')
        assert.exists(content)
        assert.equal(content.parentElement.id, 'test-playground')
    })

    it('innerHTML with body fragment strips body wrapper', async function () {
        mockResponse('GET', '/test', '<body class="ignored"><span>A</span><span>B</span></body>')
        createProcessedHTML('<button id="btn" hx-get="/test" hx-target="#target" hx-swap="innerHTML">Get</button><div id="target" class="keep-me">Old</div>');
        find('#btn').click()
        await forRequest()
        let target = find('#target')
        assert.exists(target)
        assert.equal(target.className, 'keep-me', 'Target keeps its attributes')
        assert.equal(target.children.length, 2)
        assert.equal(target.children[0].tagName, 'SPAN')
    })
})
