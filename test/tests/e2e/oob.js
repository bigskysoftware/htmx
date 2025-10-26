describe('Out of Band Swaps', function() {
    afterEach(function() {
        cleanupTest()
    })

    it('Basic OOB swap works', async function() {
        // Set up mock response
        mockResponse('GET', '/demo', new MockResponse(
            `<div id="result">Success!</div>
                   <partial hx-target="#d2">
                      <div id="d3">Success OOB!<p></p></div>
                   </partial>`));
        // Create test button
        initHTML(`
          <button id="btn1" hx-action="/demo">Button</button>
          <div id="d1">Div 1</div>
          <div id="d2">Div 2</div>
        `);
        // Click the button
        await clickAndWait('#btn1');

        // Verify the swap occurred
        assert.isNull(htmx.find('#btn1'));

        // verify the oob swap occured
        assert.isNull(htmx.find("#d2"));
        assertTextContentIs('#d3', "Success OOB!");
    })
})
