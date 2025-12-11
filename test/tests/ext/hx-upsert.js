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

    it('sorts by id with sort modifier', async function () {
        mockResponse('GET', '/test', '<div id="item-2">Two</div>')
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="upsert sort"><div id="item-3">Three</div><div id="item-1">One</div></div>');
        div.click()
        await htmx.timeout(20)
        assert.equal(div.children[0].id, 'item-1')
        assert.equal(div.children[1].id, 'item-2')
        assert.equal(div.children[2].id, 'item-3')
    })

    it('uses data-upsert-key attribute', async function () {
        mockResponse('GET', '/test', '<div data-upsert-key="abc">Updated</div>')
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="upsert"><div data-upsert-key="abc">Original</div></div>');
        div.click()
        await htmx.timeout(20)
        assert.equal(div.querySelector('[data-upsert-key="abc"]').textContent, 'Updated')
    })

    it('uses custom key attribute', async function () {
        mockResponse('GET', '/test', '<div data-sku="123">Updated</div>')
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="upsert key:data-sku"><div data-sku="123">Original</div></div>');
        div.click()
        await htmx.timeout(20)
        assert.equal(div.querySelector('[data-sku="123"]').textContent, 'Updated')
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

    it('appends new elements by default', async function () {
        mockResponse('GET', '/test', '<div id="item-2">Two</div><div id="item-1">One</div>')
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="upsert"><div id="item-3">Three</div></div>');
        div.click()
        await htmx.timeout(20)
        assert.equal(div.children[0].id, 'item-3')
        assert.equal(div.children[1].id, 'item-2')
        assert.equal(div.children[2].id, 'item-1')
    })

    it('combines sort and custom key', async function () {
        mockResponse('GET', '/test', '<div data-order="2">Two</div>')
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="upsert key:data-order sort"><div data-order="3">Three</div><div data-order="1">One</div></div>');
        div.click()
        await htmx.timeout(20)
        assert.equal(div.children[0].getAttribute('data-order'), '1')
        assert.equal(div.children[1].getAttribute('data-order'), '2')
        assert.equal(div.children[2].getAttribute('data-order'), '3')
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

    it('works with hx-swap-oob upsert prepend sort', async function () {
        mockResponse('GET', '/test', '<div id="main-item">Main</div><div id="other" hx-swap-oob="upsert prepend sort"><div id="oob-2">Two</div><div>Unkeyed</div></div>')
        let container = createProcessedHTML('<div><div hx-get="/test" hx-swap="innerHTML">Original</div><div id="other"><div id="oob-3">Three</div><div id="oob-1">One</div></div></div>');
        let div = container.children[0]
        div.click()
        await htmx.timeout(50)
        let updatedOther = container.querySelector('#other')
        assert.equal(div.querySelector('#main-item').textContent, 'Main')
        assert.equal(updatedOther.children.length, 4)
        assert.equal(updatedOther.children[0].textContent, 'Unkeyed')
        assert.equal(updatedOther.children[1].id, 'oob-1')
        assert.equal(updatedOther.children[2].id, 'oob-2')
        assert.equal(updatedOther.children[3].id, 'oob-3')
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

    it('adds temp IDs for elements without id', async function () {
        mockResponse('GET', '/test', '<div data-sku="b"><span>B</span></div>')
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="upsert key:data-sku sort"><div data-sku="c"><span>C</span></div><div data-sku="a"><span>A</span></div></div>');
        div.click()
        await htmx.timeout(20)
        assert.equal(div.children[0].getAttribute('data-sku'), 'a')
        assert.equal(div.children[1].getAttribute('data-sku'), 'b')
        assert.equal(div.children[2].getAttribute('data-sku'), 'c')
        assert.equal(div.children[0].id, '')
        assert.equal(div.children[1].id, '')
        assert.equal(div.children[2].id, '')
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

    it('sort:desc with prepend puts unkeyed first', async function () {
        mockResponse('GET', '/test', '<div id="item-2">Two</div><div>Unkeyed</div>')
        let div = createProcessedHTML('<div hx-get="/test" hx-swap="upsert sort:desc prepend"><div id="item-1">One</div></div>');
        div.click()
        await htmx.timeout(20)
        assert.equal(div.children[0].textContent, 'Unkeyed')
        assert.equal(div.children[1].id, 'item-2')
        assert.equal(div.children[2].id, 'item-1')
    })
})
