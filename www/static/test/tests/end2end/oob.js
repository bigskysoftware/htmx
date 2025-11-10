describe('Out of Band Swaps', function() {
    afterEach(function() {
        cleanupTest()
    })

    it('Basic OOB swap works', async function() {
        // Set up mock response
        mockResponse('GET', '/demo', new MockResponse(
            `<div id="result">Success!</div>
                   <htmx-action type="partial" hx-target="#d2">
                      <div id="d3">Success OOB!<p></p></div>
                   </htmx-action>`));
        // Create test button
        createProcessedHTML(`
          <button id="btn1" hx-action="/demo">Button</button>
          <div id="d1">Div 1</div>
          <div id="d2">Div 2</div>
        `);
        // Click the button
        find('#btn1').click()
        await forRequest();
        // verify the oob swap occurred
        assertTextContentIs('#d3', "Success OOB!");
    })
})
