describe("hx-preserve attribute", function () {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('handles basic response properly', function () {
        this.server.respondWith("GET", "/test", "<div id='d1' hx-preserve>New Content</div><div id='d2'>New Content</div>");
        var div = make("<div hx-get='/test'><div id='d1' hx-preserve>Old Content</div><div id='d2'>Old Content</div></div>");
        div.click();
        this.server.respond();
        byId("d1").innerHTML.should.equal("Old Content");
        byId("d2").innerHTML.should.equal("New Content");
    })

    it('handles preserved element that might not be existing', function () {
        this.server.respondWith("GET", "/test", "<div id='d1' hx-preserve>New Content</div><div id='d2'>New Content</div>");
        var div = make("<div hx-get='/test'><div id='d2'>Old Content</div></div>");
        div.click();
        this.server.respond();
        byId("d1").innerHTML.should.equal("New Content");
        byId("d2").innerHTML.should.equal("New Content");
    })

    it('preserved element should not be swapped if it lies outside of hx-select', function () {
        this.server.respondWith("GET", "/test", "<div id='d1' hx-preserve>New Content</div><div id='d2'>New Content</div>");
        var div = make("<div hx-get='/test' hx-target='#d2' hx-select='#d2' hx-swap='outerHTML'><div id='d1' hx-preserve>Old Content</div><div id='d2'>Old Content</div></div>");
        div.click();
        this.server.respond();
        byId("d1").innerHTML.should.equal("Old Content");
        byId("d2").innerHTML.should.equal("New Content");
    })

});

