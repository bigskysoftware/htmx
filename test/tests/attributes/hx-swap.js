describe('hx-swap modifiers', function() {

    beforeEach(() => {
        setupTest()
    })

    afterEach(() => {
        cleanupTest()
    })

    it('properly parses various swap specifications', function() {
        assert.equal(htmx.__parseSwapModifiers('innerHTML').style, 'innerHTML')
        assert.equal(htmx.__parseSwapModifiers('innerHTML').swapDelay, undefined)
        assert.equal(htmx.__parseSwapModifiers('innerHTML swap:10').swapDelay, 10)
        assert.equal(htmx.__parseSwapModifiers('innerHTML swap:0').swapDelay, 0)
        assert.equal(htmx.__parseSwapModifiers('innerHTML swap:0ms').swapDelay, 0)
        assert.equal(htmx.__parseSwapModifiers('innerHTML settle:10').settleDelay, 10)
        assert.equal(htmx.__parseSwapModifiers('innerHTML settle:0').settleDelay, 0)
        assert.equal(htmx.__parseSwapModifiers('innerHTML settle:0s').settleDelay, 0)
        assert.equal(htmx.__parseSwapModifiers('innerHTML swap:10 settle:11').swapDelay, 10)
        assert.equal(htmx.__parseSwapModifiers('innerHTML swap:10 settle:11').settleDelay, 11)
        assert.equal(htmx.__parseSwapModifiers('innerHTML settle:11 swap:10').swapDelay, 10)
        assert.equal(htmx.__parseSwapModifiers('innerHTML settle:11 swap:10').settleDelay, 11)
        assert.equal(htmx.__parseSwapModifiers('innerHTML settle:0 swap:0').settleDelay, 0)
        assert.equal(htmx.__parseSwapModifiers('innerHTML settle:0s swap:0ms').settleDelay, 0)
        assert.equal(htmx.__parseSwapModifiers('innerHTML nonsense settle:11 swap:10').settleDelay, 11)
        assert.equal(htmx.__parseSwapModifiers('innerHTML   nonsense   settle:11   swap:10  ').settleDelay, 11)

        assert.equal(htmx.__parseSwapModifiers('swap:10').style, 'outerHTML')
        assert.equal(htmx.__parseSwapModifiers('swap:10').swapDelay, 10)
        assert.equal(htmx.__parseSwapModifiers('swap:0').swapDelay, 0)
        assert.equal(htmx.__parseSwapModifiers('swap:0s').swapDelay, 0)

        assert.equal(htmx.__parseSwapModifiers('settle:10').style, 'outerHTML')
        assert.equal(htmx.__parseSwapModifiers('settle:10').settleDelay, 10)
        assert.equal(htmx.__parseSwapModifiers('settle:0').settleDelay, 0)
        assert.equal(htmx.__parseSwapModifiers('settle:0s').settleDelay, 0)

        assert.equal(htmx.__parseSwapModifiers('swap:10 settle:11').style, 'outerHTML')
        assert.equal(htmx.__parseSwapModifiers('swap:10 settle:11').swapDelay, 10)
        assert.equal(htmx.__parseSwapModifiers('swap:10 settle:11').settleDelay, 11)
        assert.equal(htmx.__parseSwapModifiers('swap:0s settle:0').swapDelay, 0)
        assert.equal(htmx.__parseSwapModifiers('swap:0s settle:0').settleDelay, 0)

        assert.equal(htmx.__parseSwapModifiers('settle:11 swap:10').style, 'outerHTML')
        assert.equal(htmx.__parseSwapModifiers('settle:11 swap:10').swapDelay, 10)
        assert.equal(htmx.__parseSwapModifiers('settle:11 swap:10').settleDelay, 11)
        assert.equal(htmx.__parseSwapModifiers('settle:0s swap:10').swapDelay, 10)
        assert.equal(htmx.__parseSwapModifiers('settle:0s swap:10').settleDelay, 0)

        assert.equal(htmx.__parseSwapModifiers('transition:true').transition, true)
        assert.equal(htmx.__parseSwapModifiers('strip:true').strip, true)
        assert.equal(htmx.__parseSwapModifiers('target:#table tbody').target, '#table tbody')
        assert.equal(htmx.__parseSwapModifiers('target:#table tbody swap:10s').target, '#table tbody')
        assert.equal(htmx.__parseSwapModifiers('customstyle settle:11 swap:10').style, 'customstyle')
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
})
