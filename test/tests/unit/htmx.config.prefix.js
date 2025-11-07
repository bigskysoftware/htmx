describe('htmx.config.prefix functionality', function() {

    beforeEach(function() {
        setupTest(this);
    });

    afterEach(function() {
        cleanupTest();
    });

    it('default prefix (empty string) works normally', async function() {
        htmx.config.prefix = "";
        mockResponse('GET', '/test', 'Success');

        createProcessedHTML('<button id="btn" hx-get="/test">Click</button>');
        find('#btn').click()
        await forRequest();

        let lastCall = lastFetch();
        assert.equal(lastCall.url, '/test');
    });

    it('custom prefix replaces hx- in attributes', function() {
        htmx.config.prefix = "data-hx-";

        let result = htmx.__prefix("hx-get");
        assert.equal(result, "data-hx-get");

        result = htmx.__prefix("hx-target");
        assert.equal(result, "data-hx-target");

        htmx.config.prefix = "";
    });

    it('custom prefix is used in __attributeValue', function() {
        htmx.config.prefix = "data-hx-";

        let btn = createDisconnectedHTML('<button data-hx-get="/custom" data-hx-target="#result">Click</button>');

        let getValue = htmx.__attributeValue(btn, "hx-get");
        assert.equal(getValue, "/custom");

        let targetValue = htmx.__attributeValue(btn, "hx-target");
        assert.equal(targetValue, "#result");

        htmx.config.prefix = "";
    });

    it('custom prefix works with trigger attribute', function() {
        htmx.config.prefix = "data-hx-";

        let called = 0;
        let btn = createDisconnectedHTML('<button>Click</button>');
        btn.setAttribute('data-hx-trigger', 'click');
        btn._htmx = {};
        htmx.__initializeTriggers(btn, () => called++);

        btn.click();
        assert.equal(called, 1);

        htmx.config.prefix = "";
    });

    it('empty prefix value is handled correctly', function() {
        htmx.config.prefix = "";

        let result = htmx.__prefix("hx-get");
        assert.equal(result, "hx-get");
    });
});
