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

        let btn = createDisconnectedHTML('<button data-hx-get="/custom"></button>');
        assert.equal(htmx.__attr(btn, "hx-get"), "/custom");
        assert.equal(htmx.__attr(btn, "hx-target"), null);

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
        htmx.__htmxProp(btn);
        htmx.__initializeTriggers(btn, () => called++);

        btn.click();
        assert.equal(called, 1);

        htmx.config.prefix = "";
    });

    it('empty prefix disables secondary prefix', function() {
        htmx.config.prefix = "";

        let btn = createDisconnectedHTML('<button hx-get="/primary"></button>');
        assert.equal(htmx.__attr(btn, "hx-get"), "/primary");
    });

    it('hx- always works regardless of prefix setting', function() {
        htmx.config.prefix = "data-hx-";

        let btn = createDisconnectedHTML('<button hx-get="/primary"></button>');
        assert.equal(htmx.__attributeValue(btn, "hx-get"), "/primary");

        htmx.config.prefix = "";
    });

    it('secondary prefix found when hx- is absent', function() {
        htmx.config.prefix = "data-hx-";

        let btn = createDisconnectedHTML('<button data-hx-get="/secondary"></button>');
        assert.equal(htmx.__attributeValue(btn, "hx-get"), "/secondary");

        htmx.config.prefix = "";
    });

    it('hx- wins over secondary prefix when both present', function() {
        htmx.config.prefix = "data-hx-";

        let btn = createDisconnectedHTML('<button hx-get="/first" data-hx-get="/second"></button>');
        assert.equal(htmx.__attributeValue(btn, "hx-get"), "/first");

        htmx.config.prefix = "";
    });

    it('inheritance works with secondary prefix on parent', function() {
        htmx.config.prefix = "data-hx-";

        let container = createDisconnectedHTML(
            '<div data-hx-target:inherited="#output">' +
            '  <button hx-get="/test"></button>' +
            '</div>'
        );
        let button = container.querySelector('button');
        assert.equal(htmx.__attributeValue(button, "hx-target"), "#output");

        htmx.config.prefix = "";
    });

    it('custom prefix works with attribute inheritance', function() {
        htmx.config.prefix = "data-hx-";

        let container = createDisconnectedHTML(
            '<div data-hx-target:inherited="#output">' +
            '  <button data-hx-get="/test">Click</button>' +
            '</div>'
        );
        let button = container.querySelector('button');
        let targetValue = htmx.__attributeValue(button, "hx-target");
        assert.equal(targetValue, "#output");

        htmx.config.prefix = "";
    });
});
