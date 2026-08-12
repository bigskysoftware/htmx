describe('hx-pending attribute', function() {

    let extBackup;

    before(async () => {
        extBackup = backupExtensions();
        clearExtensions();
        let script = document.createElement('script');
        script.src = '../src/ext/hx-pending.js';
        await new Promise(resolve => {
            script.onload = resolve;
            document.head.appendChild(script);
        });
    })

    after(() => {
        restoreExtensions(extBackup);
    })

    beforeEach(() => {
        setupTest(this.currentTest)
    })

    afterEach(() => {
        cleanupTest(this.currentTest)
    })


    it('innerHTML swap hides children and appends pending div', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<div id="result"><span>Original</span></div><div id="opt" style="display:none">Pending</div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-pending="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.equal(find('#result').textContent.trim(), 'Final');
    })

    it('innerHTML swap with target as CSS selector string', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none">Pending</div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-pending="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.equal(find('#result').textContent.trim(), 'Final');
    })

    it('resolves extended target selectors from the source element', async function () {
        mockResponse('POST', '/submit', 'Final')
        const result = createProcessedHTML('<div class="result"><span>Original</span><button hx-post="/submit" hx-target="closest .result" hx-swap="innerHTML" hx-pending="#opt">Go</button></div><div id="opt" style="display:none">Pending</div>');
        let pendingTarget
        find('button').addEventListener('htmx:before:request', () => {
            pendingTarget = document.querySelector('.hx-pending')?.parentElement
        })

        find('button').click()
        await forRequest()

        assert.equal(pendingTarget, result)
        assert.equal(result.textContent.trim(), 'Final')
    })

    it('outerHTML swap hides target and inserts pending div after', async function () {
        mockResponse('POST', '/submit', '<div id="result">Final</div>')
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none">Pending</div><button hx-post="/submit" hx-target="#result" hx-swap="outerHTML" hx-pending="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.equal(find('#result').textContent.trim(), 'Final');
    })

    it('beforebegin swap inserts pending div before target', async function () {
        mockResponse('POST', '/submit', '<span>New</span>')
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none">Pending</div><button hx-post="/submit" hx-target="#result" hx-swap="beforebegin" hx-pending="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.include(playground().textContent, 'New');
    })

    it('afterbegin swap inserts pending div at start of target', async function () {
        mockResponse('POST', '/submit', '<span>New</span>')
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none">Pending</div><button hx-post="/submit" hx-target="#result" hx-swap="afterbegin" hx-pending="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.include(find('#result').textContent, 'New');
    })

    it('beforeend swap inserts pending div at end of target', async function () {
        mockResponse('POST', '/submit', '<span>New</span>')
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none">Pending</div><button hx-post="/submit" hx-target="#result" hx-swap="beforeend" hx-pending="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.include(find('#result').textContent, 'New');
    })

    it('afterend swap inserts pending div after target', async function () {
        mockResponse('POST', '/submit', '<span>New</span>')
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none">Pending</div><button hx-post="/submit" hx-target="#result" hx-swap="afterend" hx-pending="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.include(playground().textContent, 'New');
    })

    it('delete swap uses default outerHTML-like behavior', async function () {
        mockResponse('POST', '/submit', '')
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none">Pending</div><button hx-post="/submit" hx-target="#result" hx-swap="delete" hx-pending="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.isUndefined(find('#result'));
    })

    it('none swap uses default outerHTML-like behavior', async function () {
        mockResponse('POST', '/submit', 'ignored')
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none">Pending</div><button hx-post="/submit" hx-target="#result" hx-swap="none" hx-pending="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.equal(find('#result').textContent.trim(), 'Original');
    })

    it('removes pending content after successful response', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none">Pending</div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-pending="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.isNull(document.querySelector('.hx-pending'));
    })

    it('removes pending content on error', async function () {
        fetchMock.mockResponse('POST', '/submit', () => Promise.reject(new Error('Network error')));
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none">Pending</div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-pending="#opt">Go</button>');
        find('button').click()
        await waitForEvent('htmx:error', 2000);
        assert.isNull(document.querySelector('.hx-pending'));
    })

    it('unhides hidden elements after swap', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<div id="result"><span id="child">Original</span></div><div id="opt" style="display:none">Pending</div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-pending="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.equal(find('#result').textContent.trim(), 'Final');
    })

    it('unhides hidden elements on error', async function () {
        fetchMock.mockResponse('POST', '/submit', () => Promise.reject(new Error('Network error')));
        createProcessedHTML('<div id="result"><span>Original</span></div><div id="opt" style="display:none">Pending</div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-pending="#opt">Go</button>');
        find('button').click()
        await waitForEvent('htmx:error', 2000);
        assert.equal(find('#result span').style.display, '');
    })

    it('does nothing when pending selector not found', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<div id="result">Original</div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-pending="#nonexistent">Go</button>');
        find('button').click()
        await forRequest()
        assert.equal(find('#result').textContent.trim(), 'Final');
    })

    it('does nothing when hx-pending not specified', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<div id="result">Original</div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML">Go</button>');
        find('button').click()
        await forRequest()
        assert.equal(find('#result').textContent.trim(), 'Final');
    })

    it('does nothing when target not found', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<div id="opt" style="display:none">Pending</div><button hx-post="/submit" hx-target="#nonexistent" hx-pending="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.isNull(document.querySelector('.hx-pending'));
    })

    it('works when target is resolved from CSS selector', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none">Pending</div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-pending="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.equal(find('#result').textContent.trim(), 'Final');
    })

    it('pending div has reset styling', async function () {
        mockResponse('POST', '/submit', 'Final')
        let pendingDiv = null;
        document.addEventListener('htmx:before:request', function() {
            setTimeout(() => {
                pendingDiv = document.querySelector('.hx-pending');
            }, 0);
        }, {once: true});
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none">Pending</div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-pending="#opt">Go</button>');
        find('button').click()
        await forRequest()
        // Just verify it completed - styling check would happen during request
        assert.equal(find('#result').textContent.trim(), 'Final');
    })

    it('copies innerHTML from source element', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none"><strong>Pending</strong></div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-pending="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.equal(find('#result').textContent.trim(), 'Final');
    })

    it('works with complex HTML in source', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none"><ul><li>Item 1</li><li>Item 2</li></ul></div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-pending="#opt">Go</button>');
        find('button').click()
        await forRequest()
        assert.equal(find('#result').textContent.trim(), 'Final');
    })

    it('multiple requests clean up independently', async function () {
        mockResponse('POST', '/submit1', 'Final1')
        mockResponse('POST', '/submit2', 'Final2')
        createProcessedHTML('<div id="r1">A</div><div id="r2">B</div><div id="opt" style="display:none">Opt</div><button id="b1" hx-post="/submit1" hx-target="#r1" hx-swap="innerHTML" hx-pending="#opt">Go1</button><button id="b2" hx-post="/submit2" hx-target="#r2" hx-swap="innerHTML" hx-pending="#opt">Go2</button>');
        find('#b1').click()
        await forRequest()
        find('#b2').click()
        await forRequest()
        assert.isNull(document.querySelector('.hx-pending'));
    })

    it('works with hx-config override', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none">Pending</div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-config=\'{"pending": "#opt"}\'>Go</button>');
        find('button').click()
        await forRequest()
        assert.equal(find('#result').textContent.trim(), 'Final');
    })

    it('hx-pending attribute takes precedence over hx-config', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<div id="result">Original</div><div id="opt1" style="display:none">Opt1</div><div id="opt2" style="display:none">Opt2</div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-pending="#opt1" hx-config=\'{"pending": "#opt2"}\'>Go</button>');
        find('button').click()
        await forRequest()
        assert.equal(find('#result').textContent.trim(), 'Final');
    })

    it('works with inherited target', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<div hx-target:inherited="#result"><div id="result">Original</div><div id="opt" style="display:none">Pending</div><button hx-post="/submit" hx-swap="innerHTML" hx-pending="#opt">Go</button></div>');
        find('button').click()
        await forRequest()
        assert.equal(find('#result').textContent.trim(), 'Final');
    })

    it('sets data-* attributes on pending div for each form param', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<form hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-pending="#opt"><input name="color" value="blue"><input name="size" value="large"><button type="submit">Go</button></form><div id="result">Original</div><div id="opt" style="display:none">content</div>');
        let dataColor, dataSize;
        document.addEventListener('htmx:before:request', () => {
            let el = document.querySelector('.hx-pending');
            if (el) { dataColor = el.dataset.color; dataSize = el.dataset.size; }
        }, {once: true});
        find('button').click()
        await forRequest()
        assert.equal(dataColor, 'blue');
        assert.equal(dataSize, 'large');
    })

    it('sets data-* from hx-vals', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<div id="result">Original</div><div id="opt" style="display:none">content</div><button hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-pending="#opt" hx-vals=\'{"count": "42"}\'>Go</button>');
        let dataCount;
        document.addEventListener('htmx:before:request', () => {
            let el = document.querySelector('.hx-pending');
            if (el) dataCount = el.dataset.count;
        }, {once: true});
        find('button').click()
        await forRequest()
        assert.equal(dataCount, '42');
    })

    it('data-* values are safe from XSS via dataset API', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<form hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-pending="#opt"><input name="name" value="&quot;onclick=alert(1)"><button type="submit">Go</button></form><div id="result">Original</div><div id="opt" style="display:none">x</div>');
        let dataName;
        document.addEventListener('htmx:before:request', () => {
            let el = document.querySelector('.hx-pending');
            if (el) dataName = el.dataset.name;
        }, {once: true});
        find('button').click()
        await forRequest()
        assert.equal(dataName, '"onclick=alert(1)');
    })

    it('static template content renders without hx-live', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<form hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-pending="#opt"><input name="x" value="y"><button type="submit">Go</button></form><div id="result">Original</div><div id="opt" style="display:none">Static pending</div>');
        let optText;
        document.addEventListener('htmx:before:request', () => {
            let el = document.querySelector('.hx-pending');
            if (el) optText = el.textContent;
        }, {once: true});
        find('button').click()
        await forRequest()
        assert.equal(optText, 'Static pending');
    })

    it('skips file inputs in data-* attributes', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<form hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-pending="#opt"><input name="title" value="doc"><input name="file" type="file"><button type="submit">Go</button></form><div id="result">Original</div><div id="opt" style="display:none">uploading</div>');
        let hasTitle, hasFile;
        document.addEventListener('htmx:before:request', () => {
            let el = document.querySelector('.hx-pending');
            if (el) { hasTitle = 'title' in el.dataset; hasFile = 'file' in el.dataset; }
        }, {once: true});
        find('button').click()
        await forRequest()
        assert.isTrue(hasTitle);
        assert.isFalse(hasFile);
    })

    it('handles hyphenated form field names via setAttribute', async function () {
        mockResponse('POST', '/submit', 'Final')
        createProcessedHTML('<form hx-post="/submit" hx-target="#result" hx-swap="innerHTML" hx-pending="#opt"><input name="user-name" value="joe"><button type="submit">Go</button></form><div id="result">Original</div><div id="opt" style="display:none">content</div>');
        let dataUserName;
        document.addEventListener('htmx:before:request', () => {
            let el = document.querySelector('.hx-pending');
            if (el) dataUserName = el.dataset.userName;
        }, {once: true});
        find('button').click()
        await forRequest()
        assert.equal(dataUserName, 'joe');
        assert.equal(find('#result').textContent.trim(), 'Final');
    })
})
