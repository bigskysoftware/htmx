describe('hx-upsert extension', function() {

    let extBackup;

    before(async () => {
        extBackup = backupExtensions();
        clearExtensions();
        let script = document.createElement('script');
        script.src = '../src/ext/hx-upsert.js';
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

    it('updates existing element by id', async function () {
        mockResponse('GET', '/test', '<div id="item-1">Updated</div>')
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="upsert"><div id="item-1">Original</div></div>');
        div.click()
        await htmx.timeout(20)
        assert.equal(div.querySelector('#item-1').textContent, 'Updated')
    })

    it('inserts new element', async function () {
        mockResponse('GET', '/test', '<div id="item-2">New</div>')
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="upsert"><div id="item-1">Original</div></div>');
        div.click()
        await htmx.timeout(20)
        assert.equal(div.children.length, 2)
        assert.equal(div.querySelector('#item-2').textContent, 'New')
    })

    it('preserves existing elements not in response', async function () {
        mockResponse('GET', '/test', '<div id="item-2">New</div>')
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="upsert"><div id="item-1">Original</div></div>');
        div.click()
        await htmx.timeout(20)
        assert.equal(div.children.length, 2)
        assert.equal(div.querySelector('#item-1').textContent, 'Original')
    })







    it('prepends unmatched elements', async function () {
        mockResponse('GET', '/test', '<div>No Key</div>')
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="upsert prepend"><div id="item-1">Original</div></div>');
        div.click()
        await htmx.timeout(20)
        assert.equal(div.children[0].textContent, 'No Key')
        assert.equal(div.children[1].id, 'item-1')
    })

    it('appends unmatched elements by default', async function () {
        mockResponse('GET', '/test', '<div>No Key</div>')
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="upsert"><div id="item-1">Original</div></div>');
        div.click()
        await htmx.timeout(20)
        assert.equal(div.children[0].id, 'item-1')
        assert.equal(div.children[1].textContent, 'No Key')
    })





    it('updates multiple existing elements', async function () {
        mockResponse('GET', '/test', '<div id="item-1">Updated 1</div><div id="item-2">Updated 2</div>')
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="upsert"><div id="item-1">Original 1</div><div id="item-2">Original 2</div></div>');
        div.click()
        await htmx.timeout(20)
        assert.equal(div.querySelector('#item-1').textContent, 'Updated 1')
        assert.equal(div.querySelector('#item-2').textContent, 'Updated 2')
    })

    it('handles mixed keyed and unkeyed elements', async function () {
        mockResponse('GET', '/test', '<div id="item-2">Two</div><div>Unkeyed</div>')
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="upsert"><div id="item-1">One</div></div>');
        div.click()
        await htmx.timeout(20)
        assert.equal(div.children.length, 3)
        assert.equal(div.children[0].id, 'item-1')
        assert.equal(div.children[1].id, 'item-2')
        assert.equal(div.children[2].textContent, 'Unkeyed')
    })

    it('sort with prepend puts unkeyed first', async function () {
        mockResponse('GET', '/test', '<div id="item-2">Two</div><div>Unkeyed</div>')
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="upsert sort prepend"><div id="item-1">One</div></div>');
        div.click()
        await htmx.timeout(20)
        assert.equal(div.children[0].textContent, 'Unkeyed')
        assert.equal(div.children[1].id, 'item-1')
        assert.equal(div.children[2].id, 'item-2')
    })

    it('preserves element order when all matched', async function () {
        mockResponse('GET', '/test', '<div id="item-2">Updated 2</div><div id="item-1">Updated 1</div>')
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="upsert"><div id="item-1">Original 1</div><div id="item-2">Original 2</div></div>');
        div.click()
        await htmx.timeout(20)
        assert.equal(div.children[0].id, 'item-1')
        assert.equal(div.children[1].id, 'item-2')
        assert.equal(div.children[0].textContent, 'Updated 1')
        assert.equal(div.children[1].textContent, 'Updated 2')
    })

    it('handles empty response', async function () {
        mockResponse('GET', '/test', '')
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="upsert"><div id="item-1">Original</div></div>');
        div.click()
        await htmx.timeout(20)
        assert.equal(div.children.length, 1)
        assert.equal(div.querySelector('#item-1').textContent, 'Original')
    })

    it('works with hx-swap-oob upsert', async function () {
        mockResponse('GET', '/test', '<div id="main-item">Main</div><div id="other" hx-swap-oob="upsert"><div id="oob-1">OOB</div></div>')
        let container = createProcessedHTML('<div><div hx-get="/test" hx-swap="innerHTML">Original</div><div id="other"><div id="oob-2">Existing</div></div></div>');
        let div = container.children[0]
        div.click()
        await htmx.timeout(50)
        let updatedOther = container.querySelector('#other')
        let mainItem = div.querySelector('#main-item')
        assert.isNotNull(mainItem)
        assert.equal(mainItem.textContent, 'Main')
        assert.equal(updatedOther.children.length, 2)
        assert.equal(updatedOther.querySelector('#oob-1').textContent, 'OOB')
        assert.equal(updatedOther.querySelector('#oob-2').textContent, 'Existing')
    })



    it('works with hx-partial', async function () {
        mockResponse('GET', '/test', '<hx-partial hx-target="#list1" hx-swap="upsert"><div id="item-2">Two</div></hx-partial><hx-partial hx-target="#list2" hx-swap="upsert"><div id="item-b">B</div></hx-partial>')
        let container = createProcessedHTML('<div hx-get="/test"><div id="list1"><div id="item-1">One</div></div><div id="list2"><div id="item-a">A</div></div></div>');
        container.click()
        await htmx.timeout(20)
        let list1 = container.querySelector('#list1')
        let list2 = container.querySelector('#list2')
        assert.equal(list1.children.length, 2)
        assert.equal(list1.querySelector('#item-1').textContent, 'One')
        assert.equal(list1.querySelector('#item-2').textContent, 'Two')
        assert.equal(list2.children.length, 2)
        assert.equal(list2.querySelector('#item-a').textContent, 'A')
        assert.equal(list2.querySelector('#item-b').textContent, 'B')
    })



    it('sorts descending with sort:desc', async function () {
        mockResponse('GET', '/test', '<div id="item-2">Two</div>')
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="upsert sort:desc"><div id="item-3">Three</div><div id="item-1">One</div></div>');
        div.click()
        await htmx.timeout(20)
        assert.equal(div.children[0].id, 'item-3')
        assert.equal(div.children[1].id, 'item-2')
        assert.equal(div.children[2].id, 'item-1')
    })


})
