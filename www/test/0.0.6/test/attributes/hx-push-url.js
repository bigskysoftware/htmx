describe("hx-push-url attribute", function() {

    var HTMX_HISTORY_CACHE_NAME = "htmx-history-cache";

    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
        localStorage.removeItem(HTMX_HISTORY_CACHE_NAME);
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
        localStorage.removeItem(HTMX_HISTORY_CACHE_NAME);
    });

    it("navigation should push an element into the cache ", function () {
        this.server.respondWith("GET", "/test", "second");
        getWorkArea().innerHTML.should.be.equal("");
        var div = make('<div hx-push-url="true" hx-get="/test">first</div>');
        div.click();
        this.server.respond();
        getWorkArea().textContent.should.equal("second")
        var cache = JSON.parse(localStorage.getItem(HTMX_HISTORY_CACHE_NAME));
        cache.length.should.equal(1);
    });

    it("restore should return old value", function () {
        this.server.respondWith("GET", "/test1", '<div id="d2" hx-push-url="true" hx-get="/test2" hx-swap="outerHTML settle:0">test1</div>');
        this.server.respondWith("GET", "/test2", '<div id="d3" hx-push-url="true" hx-get="/test3" hx-swap="outerHTML settle:0">test2</div>');

        make('<div id="d1" hx-push-url="true" hx-get="/test1" hx-swap="outerHTML settle:0">init</div>');

        byId("d1").click();
        this.server.respond();
        var workArea = getWorkArea();
        workArea.textContent.should.equal("test1")

        byId("d2").click();
        this.server.respond();
        workArea.textContent.should.equal("test2")

        var cache = JSON.parse(localStorage.getItem(HTMX_HISTORY_CACHE_NAME));

        cache.length.should.equal(2);
        htmx._('restoreHistory')("/test1")
        this.server.respond();
        getWorkArea().textContent.should.equal("test1")
    });

    it("cache should only store 10 entries", function () {
        var x = 0;
        this.server.respondWith("GET", /test.*/, function(xhr){
            x++;
            xhr.respond(200, {}, '<div id="d1" hx-push-url="true" hx-get="/test' + x + '" hx-swap="outerHTML settle:0"></div>')
        });
        getWorkArea().innerHTML.should.be.equal("");
        make('<div id="d1" hx-push-url="true" hx-get="/test" hx-swap="outerHTML settle:0"></div>');
        for (var i = 0; i < 20; i++) { // issue 20 requests
            byId("d1").click();
            this.server.respond();
        }
        var cache = JSON.parse(localStorage.getItem(HTMX_HISTORY_CACHE_NAME));
        cache.length.should.equal(10); // should only be 10 elements
    });

    it("cache miss should issue another GET", function () {
        this.server.respondWith("GET", "/test1", '<div id="d2" hx-push-url="true" hx-get="/test2" hx-swap="outerHTML settle:0">test1</div>');
        this.server.respondWith("GET", "/test2", '<div id="d3" hx-push-url="true" hx-get="/test3" hx-swap="outerHTML settle:0">test2</div>');

        make('<div id="d1" hx-push-url="true" hx-get="/test1" hx-swap="outerHTML settle:0">init</div>');

        byId("d1").click();
        this.server.respond();
        var workArea = getWorkArea();
        workArea.textContent.should.equal("test1")

        byId("d2").click();
        this.server.respond();
        workArea.textContent.should.equal("test2")

        var cache = JSON.parse(localStorage.getItem(HTMX_HISTORY_CACHE_NAME));

        cache.length.should.equal(2);
        localStorage.removeItem(HTMX_HISTORY_CACHE_NAME); // clear cache
        htmx._('restoreHistory')("/test1")
        this.server.respond();
        getWorkArea().textContent.should.equal("test1")
    });

    it("navigation should push an element into the cache  w/ data-* prefix", function () {
        this.server.respondWith("GET", "/test", "second");
        getWorkArea().innerHTML.should.be.equal("");
        var div = make('<div data-hx-push-url="true" data-hx-get="/test">first</div>');
        div.click();
        this.server.respond();
        getWorkArea().textContent.should.equal("second")
        var cache = JSON.parse(localStorage.getItem(HTMX_HISTORY_CACHE_NAME));
        cache.length.should.equal(1);
    });

    it("deals with malformed JSON in history cache when getting", function () {
        localStorage.setItem(HTMX_HISTORY_CACHE_NAME, "Invalid JSON");
        var history = htmx._('getCachedHistory')('url');
        should.equal(history, null);
    });

    it("deals with malformed JSON in history cache when saving", function () {
        localStorage.setItem(HTMX_HISTORY_CACHE_NAME, "Invalid JSON");
        htmx._('saveToHistoryCache')('url', 'content', 'title', 'scroll');
        var cache = JSON.parse(localStorage.getItem(HTMX_HISTORY_CACHE_NAME));
        cache.length.should.equal(1);
    });


    it("afterSettle.htmx is called when replacing outerHTML", function () {
        var called = false;
        var handler = htmx.on("afterSettle.htmx", function (evt) {
            called = true;
        });
        try {
            this.server.respondWith("POST", "/test", function (xhr) {
                xhr.respond(200, {}, "<button>Bar</button>");
            });
            var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>");
            div.click();
            this.server.respond();
            should.equal(called, true);
        } finally {
            htmx.off("afterSettle.htmx", handler);
        }
    });

    it("should include parameters on a get", function () {
        var path = "";
        var handler = htmx.on("pushedIntoHistory.htmx", function (evt) {
            path = evt.detail.path;
        });
        try {
            this.server.respondWith("GET", /test.*/, function (xhr) {
                xhr.respond(200, {}, "second")
            });
            var form = make('<form hx-trigger="click" hx-push-url="true" hx-get="/test"><input type="hidden" name="foo" value="bar"/>first</form>');
            form.click();
            this.server.respond();
            form.textContent.should.equal("second")
            path.should.equal("/test?foo=bar")
        } finally {
            htmx.off("pushedIntoHistory.htmx", handler);
        }
    });

});
