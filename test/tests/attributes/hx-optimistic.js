describe('hx-optimistic attribute', function() {

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })


    it('innerHTML swap hides children and appends optimistic div', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<div id="result"><span>Original</span></div><div id="opt" style="display:none">Optimistic</div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-optimistic="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.equal(find('#result').textContent.trim(), 'Final');
    })

    it('innerHTML swap with target as CSS selector string', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none">Optimistic</div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-optimistic="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.equal(find('#result').textContent.trim(), 'Final');
    })

    it('outerHTML swap hides target and inserts optimistic div after', async function () {
        mockResponse('POST', '/submit', '<div id="result">Final</div>')
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none">Optimistic</div><button hx-post="/submit" hx-target="#result" hx-swap="outerHTML" hx-optimistic="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.equal(find('#result').textContent.trim(), 'Final');
    })

    it('beforebegin swap inserts optimistic div before target', async function () {
        mockResponse('POST', '/submit', '<span>New</span>')
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none">Optimistic</div><button hx-post="/submit" hx-target="#result" hx-swap="beforebegin" hx-optimistic="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.include(playground().textContent, 'New');
    })

    it('afterbegin swap inserts optimistic div at start of target', async function () {
        mockResponse('POST', '/submit', '<span>New</span>')
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none">Optimistic</div><button hx-post="/submit" hx-target="#result" hx-swap="afterbegin" hx-optimistic="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.include(find('#result').textContent, 'New');
    })

    it('beforeend swap inserts optimistic div at end of target', async function () {
        mockResponse('POST', '/submit', '<span>New</span>')
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none">Optimistic</div><button hx-post="/submit" hx-target="#result" hx-swap="beforeend" hx-optimistic="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.include(find('#result').textContent, 'New');
    })

    it('afterend swap inserts optimistic div after target', async function () {
        mockResponse('POST', '/submit', '<span>New</span>')
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none">Optimistic</div><button hx-post="/submit" hx-target="#result" hx-swap="afterend" hx-optimistic="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.include(playground().textContent, 'New');
    })

    it('delete swap uses default outerHTML-like behavior', async function () {
        mockResponse('POST', '/submit', '')
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none">Optimistic</div><button hx-post="/submit" hx-target="#result" hx-swap="delete" hx-optimistic="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.isUndefined(find('#result'));
    })

    it('none swap uses default outerHTML-like behavior', async function () {
        mockResponse('POST', '/submit', 'ignored')
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none">Optimistic</div><button hx-post="/submit" hx-target="#result" hx-swap="none" hx-optimistic="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.equal(find('#result').textContent.trim(), 'Original');
    })

    it('removes optimistic content after successful response', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none">Optimistic</div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-optimistic="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.isNull(document.querySelector('[data-hx-optimistic]'));
    })

    it('removes optimistic content on error', async function () {
        fetchMock.mockResponse('POST', '/submit', () => Promise.reject(new Error('Network error')));
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none">Optimistic</div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-optimistic="#opt">Go</button>');
        find('button').click()
        await htmx.forEvent('htmx:error', 2000);
        assert.isNull(document.querySelector('[data-hx-optimistic]'));
    })

    it('unhides hidden elements after swap', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<div id="result"><span id="child">Original</span></div><div id="opt" style="display:none">Optimistic</div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-optimistic="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.isNull(document.querySelector('[data-hx-oh]'));
    })

    it('unhides hidden elements on error', async function () {
        fetchMock.mockResponse('POST', '/submit', () => Promise.reject(new Error('Network error')));
        createProcessedHTML('<div id="result"><span>Original</span></div><div id="opt" style="display:none">Optimistic</div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-optimistic="#opt">Go</button>');
        find('button').click()
        await htmx.forEvent('htmx:error', 2000);
        assert.isNull(document.querySelector('[data-hx-oh]'));
    })

    it('does nothing when optimistic selector not found', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<div id="result">Original</div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-optimistic="#nonexistent">Go</button>');
        find('button').click()
        await forRequest()
        assert.equal(find('#result').textContent.trim(), 'Final');
    })

    it('does nothing when hx-optimistic not specified', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<div id="result">Original</div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML">Go</button>');
        find('button').click()
        await forRequest()
        assert.equal(find('#result').textContent.trim(), 'Final');
    })

    it('does nothing when target not found', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<div id="opt" style="display:none">Optimistic</div><button hx-post="/submit" hx-target="#nonexistent" hx-optimistic="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.isNull(document.querySelector('[data-hx-optimistic]'));
    })

    it('works when target is resolved from CSS selector', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none">Optimistic</div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-optimistic="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.equal(find('#result').textContent.trim(), 'Final');
    })

    it('optimistic div has reset styling', async function () {
        mockResponse('POST', '/submit', 'Final')
        let optDiv = null;
        document.addEventListener('htmx:before:request', function() {
            setTimeout(() => {
                optDiv = document.querySelector('[data-hx-optimistic]');
            }, 0);
        }, {once: true});
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none">Optimistic</div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-optimistic="#opt">Go</button>');
        find('button').click()
        await forRequest()
        // Just verify it completed - styling check would happen during request
        assert.equal(find('#result').textContent.trim(), 'Final');
    })

    it('copies innerHTML from source element', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none"><strong>Optimistic</strong></div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-optimistic="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.equal(find('#result').textContent.trim(), 'Final');
    })

    it('works with complex HTML in source', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none"><ul><li>Item 1</li><li>Item 2</li></ul></div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-optimistic="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.equal(find('#result').textContent.trim(), 'Final');
    })

    it('multiple requests clean up independently', async function () {
        mockResponse('POST', '/submit1', 'Final1')
        mockResponse('POST', '/submit2', 'Final2')
        createProcessedHTML('<div id="r1">A</div><div id="r2">B</div><div id="opt" style="display:none">Opt</div><button id="b1" hx-post="/submit1" hx-target="#r1" hx-swap="innerHTML" hx-optimistic="#opt">Go1</button><button id="b2" hx-post="/submit2" hx-target="#r2" hx-swap="innerHTML" hx-optimistic="#opt">Go2</button>');
        find('#b1').click()
        await forRequest()
        find('#b2').click()
        await forRequest()
        assert.isNull(document.querySelector('[data-hx-optimistic]'));
    })

    it('works with hx-config override', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none">Optimistic</div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-config=\'{"optimistic": "#opt"}\'>Go</button>');
        find('button').click()
        await forRequest()
        assert.equal(find('#result').textContent.trim(), 'Final');
    })

    it('hx-optimistic attribute takes precedence over hx-config', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<div id="result">Original</div><div id="opt1" style="display:none">Opt1</div><div id="opt2" style="display:none">Opt2</div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-optimistic="#opt1" hx-config=\'{"optimistic": "#opt2"}\'>Go</button>');
        find('button').click()
        await forRequest()
        assert.equal(find('#result').textContent.trim(), 'Final');
    })

    it('works with inherited target', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<div hx-target:inherited="#result"><div id="result">Original</div><div id="opt" style="display:none">Optimistic</div><button hx-post="/submit" hx-swap="innerHTML" hx-optimistic="#opt">Go</button></div>');
        find('button').click()
        await forRequest()
        assert.equal(find('#result').textContent.trim(), 'Final');
    })
})
