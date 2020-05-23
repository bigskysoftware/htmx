describe("hx-push-url attribute", function() {

    var KUTTY_HISTORY_CACHE = "htmx-history-cache";
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
        localStorage.removeItem(KUTTY_HISTORY_CACHE);
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
        localStorage.removeItem(KUTTY_HISTORY_CACHE);
    });

    it("navigation should push an element into the cache ", function () {
        this.server.respondWith("GET", "/test", "second");
        getWorkArea().innerHTML.should.be.equal("");
        var div = make('<div hx-push-url="true" hx-get="/test">first</div>');
        div.click();
        this.server.respond();
        getWorkArea().textContent.should.equal("second")
        var cache = JSON.parse(localStorage.getItem(KUTTY_HISTORY_CACHE));
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

        var cache = JSON.parse(localStorage.getItem(KUTTY_HISTORY_CACHE));

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
        var cache = JSON.parse(localStorage.getItem(KUTTY_HISTORY_CACHE));
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

        var cache = JSON.parse(localStorage.getItem(KUTTY_HISTORY_CACHE));

        cache.length.should.equal(2);
        localStorage.removeItem(KUTTY_HISTORY_CACHE); // clear cache
        htmx._('restoreHistory')("/test1")
        this.server.respond();
        getWorkArea().textContent.should.equal("test1")
    });

    function stringRepeat(str, num) {
        num = Number(num);

        var result = '';
        while (true) {
            if (num & 1) { // (1)
                result += str;
            }
            num >>>= 1; // (2)
            if (num <= 0) break;
            str += str;
        }

        return result;
    }

    it("implementation details should be fast", function(){
        // create an entry with a large content string (256k) and see how fast we can write and read it
        // to local storage as a single entry
        var entry = {url: stringRepeat("x", 32), content:stringRepeat("x", 256*1024)}
        var array = [];
        for (var i = 0; i < 10; i++) {
            array.push(entry);
        }
        var start = performance.now();
        var string = JSON.stringify(array);
        localStorage.setItem(KUTTY_HISTORY_CACHE, string);
        var reReadString = localStorage.getItem(KUTTY_HISTORY_CACHE);
        var finalJson = JSON.parse(reReadString);
        var end = performance.now();
        var timeInMs = end - start;
        chai.assert(timeInMs < 300, "Should take less than 300ms on most platforms");
    })

});