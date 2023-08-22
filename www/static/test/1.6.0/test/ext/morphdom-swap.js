describe("morphdom-swap extension", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('works on basic request', function () {
        this.server.respondWith("GET", "/test", "<button>Clicked!</button>!");
        var btn = make('<button hx-get="/test" hx-ext="morphdom-swap" hx-swap="morphdom" >Click Me!</button>')
        btn.click();
        should.equal(btn.getAttribute("hx-get"), "/test");
        this.server.respond();
        should.equal(btn.getAttribute("hx-get"), null);
        btn.innerHTML.should.equal("Clicked!");
    });

    it('works with htmx elements in new content', function () {
        this.server.respondWith("GET", "/test", '<button>Clicked!<span hx-get="/test-inner" hx-trigger="load" hx-swap="morphdom"></span></button>');
        this.server.respondWith("GET", "/test-inner", 'Loaded!');
        var btn = make('<div hx-ext="morphdom-swap"><button hx-get="/test" hx-swap="morphdom">Click Me!</button></div>').querySelector('button');
        btn.click();
        this.server.respond(); // call /test via button trigger=click
        this.server.respond(); // call /test-inner via span trigger=load
        btn.innerHTML.should.equal("Clicked!Loaded!");
    });

    it('works with hx-select', function () {
        this.server.respondWith("GET", "/test", "<button>Clicked!</button>!");
        var btn = make('<button hx-get="/test" hx-ext="morphdom-swap" hx-swap="morphdom" hx-select="button" >Click Me!</button>')
        btn.click();
        should.equal(btn.getAttribute("hx-get"), "/test");
        this.server.respond();
        should.equal(btn.getAttribute("hx-get"), null);
        btn.innerHTML.should.equal("Clicked!");
    });
});
