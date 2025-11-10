describe('htmx.config.metaCharacter functionality', function() {

    beforeEach(function() {
        setupTest(this);
        htmx.config.metaCharacter = "-";
    });

    afterEach(function() {
        cleanupTest();
        htmx.config.metaCharacter = null;
    });

    it('works with inherited modifier using custom meta character', async function() {
        mockResponse('GET', '/test', 'Success');
        createProcessedHTML('<div hx-target-inherited="#output"><button hx-get="/test" id="btn">Click</button><output id="output"></output></div>');
        find('#btn').click()
        await forRequest();
        var output = find("#output");
        output.innerText.should.equal("Success")
    });

    it('works with append modifier using custom meta character', function() {
        const container = createDisconnectedHTML(
            '<div hx-vals-inherited=\'"a":1\'>' +
            '  <button hx-vals-append=\'"b":2\'>Test</button>' +
            '</div>'
        );
        const button = container.querySelector('button');
        const result = htmx.__attributeValue(button, 'hx-vals');
        assert.equal(result, '"a":1,"b":2');
    });

    it('works with inherited-append modifier using custom meta character', function() {
        const container = createDisconnectedHTML(
            '<div hx-vals-inherited=\'"a":1\'>' +
            '  <div hx-vals-inherited-append=\'"b":2\'>' +
            '    <button hx-vals-append=\'"c":3\'>Test</button>' +
            '  </div>' +
            '</div>'
        );
        const button = container.querySelector('button');
        const result = htmx.__attributeValue(button, 'hx-vals');
        assert.equal(result, '"a":1,"b":2,"c":3');
    });

    it('works with hx-on events using custom meta character', async function() {
        let eventFired = false;
        createProcessedHTML('<button id="btn" hx-on-click="window.testEvent = true">Click</button>');

        find('#btn').click();
        await htmx.timeout(50);

        assert.equal(window.testEvent, true);
        delete window.testEvent;
    });

});
