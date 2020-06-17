describe("Core htmx perf Tests", function() {

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

    it("DOM processing should be fast", function(){
        this.server.respondWith("GET", "/test", "Clicked!");

        // create an entry with a large content string (256k) and see how fast we can write and read it
        // to local storage as a single entry
        var str = stringRepeat("<div>", 30) + stringRepeat("<div><div><span><button hx-get='/test'> Test Get Button </button></span></div></div>\n", 1000) + stringRepeat("</div>", 30);
        console.log(str);
        var start = performance.now();
        var stuff = make(str);
        var end = performance.now();
        var timeInMs = end - start;

        // make sure the DOM actually processed
        var firstBtn = stuff.querySelector("button");
        firstBtn.click();
        this.server.respond();
        firstBtn.innerHTML.should.equal("Clicked!");

        chai.assert(timeInMs < 100, "Should take less than 100ms on most platforms, took: " + timeInMs + "ms");
    })

    it("history implementation should be fast", function(){
        // create an entry with a large content string (256k) and see how fast we can write and read it
        // to local storage as a single entry
        var entry = {url: stringRepeat("x", 32), content:stringRepeat("x", 256*1024)}
        var array = [];
        for (var i = 0; i < 10; i++) {
            array.push(entry);
        }
        var start = performance.now();
        var string = JSON.stringify(array);
        localStorage.setItem(HTMX_HISTORY_CACHE_NAME, string);
        var reReadString = localStorage.getItem(HTMX_HISTORY_CACHE_NAME);
        var finalJson = JSON.parse(reReadString);
        var end = performance.now();
        var timeInMs = end - start;
        chai.assert(timeInMs < 300, "Should take less than 300ms on most platforms");
    })

})