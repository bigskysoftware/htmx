describe('Basic Functionality', () => {

    afterEach(() => {
        cleanupTest();
    })

    it('Button click triggers fetch and swaps content', async ()=> {
        // Set up mock response
        mockResponse('GET', '/demo', '<div id="result">Success!</div>');
        // Create test button
        createProcessedHTML('<button id="test-btn" hx-action="/demo" hx-target="#target">Click</button><div id="target">Original</div>');
        // Click the button
        find("#test-btn").click()
        await forRequest();

        // Verify the swap occurred
        assertTextContentIs("#target", "Success!");
    })

    it('validation errors prevent submission of a form', async function() {
        // Set up mock response
        mockResponse('POST', '/demo', '<div id="result">Success!</div>');

        createProcessedHTML('<form><input id="i1" required/><button id="b1" hx-post="/demo" hx-validate="true">Demo</button></form>');

        find('#b1').click();
        assert.equal(fetchMock.pendingRequests.length, 0);

        // fill in the required value
        find("#i1").value = "foo"
        find('#b1').click()
        await forRequest();

        assert.isUndefined(find('#target'));
        assertTextContentIs("#result", "Success!");
    })

    it('validation errors do not prevent submission of an element within a form marked as hx-validate=false', async function() {
        // Set up mock response
        mockResponse('POST', '/demo', new MockResponse('<div id="result">Success!</div>'));
        // Create test button
        createProcessedHTML('<form><input id="i1" required/><button id="b1" hx-post="/demo" hx-validate="false">Demo</button></form>');

        // Click the button
        find('#b1').click()
        await forRequest();

        assert.isUndefined(find('#target'));
        assertTextContentIs("#result", "Success!");
    })

//     it('Button added dynamically still triggers fetch and swaps', async function() {
//         // Set up mock response
//         fetchMock.mockResponse('/demo', new MockResponse('<div id="d1">Foo</div>'));
//         // Add button dynamically
//         const playground = find('#test-playground');
//         playground.insertAdjacentHTML('beforeend', `<button hx-action="/demo">Button 1</button>`);
//         // Wait for htmx to initialize the new element
//         await htmx.forEvent("mx:init", 2000);
//         // Click the button
//         find('button').click();
//         // Wait for the swap to complete
//         await htmx.forEvent("htmx:after:swap", 2000);
//         // Verify the swap occurred
//         const result = find('#d1');
//         assertExists(result);
//         assertEquals("Foo", result.textContent);
//     })
//
//     it('Button with hx-target swaps into target element', async function() {
//         // Set up mock response
//         fetchMock.mockResponse('/demo', new MockResponse('<div id="d1">Foo</div>'));
//         // Create test button with target
//         await initLiveContent(`
//             <button hx-action="/demo" hx-target="#output1">Button 1</button>
//             <output id="output1">Bar</output>
//         `);
//         // Click the button
//         find('button').click();
//         // Wait for the swap to complete
//         await htmx.forEvent("htmx:after:swap", 2000);
//         // Verify the swap occurred in the target
//         const result = find('#d1');
//         assertExists(result);
//         assertEquals("Foo", result.textContent);
//     })
//
//     it('Button with swap afterend swaps after the end of the target', async function() {
//         // Set up mock response
//         fetchMock.mockResponse('/demo', new MockResponse('<div id="d1">Foo</div>'));
//         // Create test button with target
//         await initLiveContent(`
//                 <button id="b1" hx-action="/demo" hx-swap="afterend">Button 1</button>`);
//         // Click the button
//         find('button').click();
//         // Wait for the swap to complete
//         await htmx.forEvent("htmx:after:swap", 2000);
//
//         // Verify the swap occurred after the target
//         const btn = find('#b1');
//         assertExists(btn);
//         assertEquals("Button 1", btn.textContent);
//
//         // Verify the swap occurred after the target
//         const result = btn.nextElementSibling;
//         assertExists(result);
//         assertEquals("Foo", result.textContent);
//     })
//
//     it('Test attributes can be explicity inherited to children', async function() {
//         // Set up mock response
//         fetchMock.mockResponse('/demo1', new MockResponse('<div>Foo</div>'));
//         fetchMock.mockResponse('/demo2', new MockResponse('<div>Bar</div>'));
//         // Create test button with target
//         await initLiveContent(`
//             <div hx-swap:inherited="beforeend" hx-target:inherited="#output">
//                 <button id="b1" hx-action="/demo1">Button 1</button>
//                 <button id="b2" hx-action="/demo2">Button 2</button>
//            </div>
//            <div id="output"></div>
//         `);
//         // Click the button
//         find('#b1').click();
//         await htmx.forEvent("htmx:after:swap", 2000);
//
//         // Verify the swap occurred after the target
//         const output = find('#output');
//         assertExists(output);
//         assertEquals("Foo", output.textContent);
//
//         find('#b2').click();
//         await htmx.forEvent("htmx:after:swap", 2000);
//
//         assertEquals("FooBar", output.textContent);
//     })
// })
//
// describe('Advanced Triggers', function() {
//     afterEach(function() {
//         cleanup()
//     })
//
//     it('Test multiple events can trigger', async function() {
//         // Set up mock response
//         fetchMock.mockResponse('/demo', new MockResponse('<div>Foo</div>'));
//         // Create test button with target
//         await initLiveContent(`
//            <button id="b1" hx-action="/demo" hx-target="#output" hx-swap="beforeend" hx-trigger="foo, bar">Button 1</button>
//            <output id="output"></output>
//         `);
//         // Click the button
//         let btn = find('#b1');
//         htmx.trigger(btn, 'foo');
//         await htmx.forEvent("htmx:after:swap", 2000);
//
//         // Verify the swap occurred after the target
//         const output = find('#output');
//         assertExists(output);
//         assertEquals("Foo", output.textContent);
//
//         htmx.trigger(btn, 'bar');
//         await htmx.forEvent("htmx:after:swap", 2000);
//
//         assertEquals("FooFoo", output.textContent);
//     })
//
//     it('Test delay can delay a trigger', async function() {
//         fetchMock.mockResponse('/demo', new MockResponse('<div>Foo</div>'));
//         await initLiveContent(`
//            <div id="d1" hx-action="/demo" hx-swap="innerHTML" hx-trigger="foo delay:1s">Div 1</div>
//         `);
//
//         let div = find('#d1');
//         htmx.trigger(div, 'foo');
//         // should still be Div 1
//         await htmx.timeout(300);
//         assertEquals("Div 1", div.textContent);
//
//         // delay should trigger eventually
//         await htmx.forEvent("htmx:after:swap", 2000);
//         assertEquals("Foo", div.textContent);
//     })
//
//     it('Test delay debounces a trigger', async function() {
//         fetchMock.mockResponse('/demo', new MockResponse('<div>Foo</div>'));
//         await initLiveContent(`
//            <div id="d1" hx-action="/demo" hx-swap="innerHTML" hx-trigger="foo delay:1s">Div 1</div>
//         `);
//
//         let div = find('#d1');
//         htmx.trigger(div, 'foo');
//         // should still be Div 1
//         await htmx.timeout(600);
//         assertEquals("Div 1", div.textContent);
//
//         htmx.trigger(div, 'foo');
//         // should still be Div 1 due to retrigger
//         await htmx.timeout(600);
//         assertEquals("Div 1", div.textContent);
//
//         // delay should trigger eventually
//         await htmx.forEvent("htmx:after:swap", 2000);
//         assertEquals("Foo", div.textContent);
//     })
//
//     it('Test \'every\' polls properly', async function() {
//         fetchMock.mockResponse('/demo', new MockResponse('<div>Foo</div>'));
//         await initLiveContent(`
//            <div id="d1" hx-action="/demo" hx-swap="innerHTML" hx-trigger="every 1s">Div 1</div>
//         `);
//
//         let div = find('#d1');
//
//         // should still be Div 1
//         await htmx.timeout(600);
//         assertEquals("Div 1", div.textContent);
//
//         // delay should trigger eventually
//         await htmx.forEvent("htmx:after:swap", 2000);
//         assertEquals("Foo", div.textContent);
//     })
})


