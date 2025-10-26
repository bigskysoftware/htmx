describe('Server-Sent Events', function() {
    afterEach(function() {
        cleanupTest()
    })

    it('SSE message swaps content into target element', async function() {
        // Set up initial content with a target div
        initHTML('<div id="sse-target">Original Content</div>');

        await sendSSEAndWait(`
            <partial hx-target="#sse-target">
              <div id="sse-result">Updated via SSE</div>
            </partial>
        `);

        // Verify the content was swapped
        assertTextContentIs("#sse-result", "Updated via SSE")
    })
})