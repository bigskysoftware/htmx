describe('Basic Live Functionality', function() {
    it('Input event triggers content sync', async function () {
        // Create test button
        initHTML('<input id="foo"><div id="d1" hx-live="bind innerText to #foo.value">Original</div>');
        let input = htmx.find('#foo');
        input.value = "Bar";
        await htmx.waitATick()
        let div = htmx.find('#d1');
        assert.exists(div);
        assert.equal(div.innerText, "Bar");
    })
})
