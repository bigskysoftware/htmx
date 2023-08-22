describe("debug extension", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('works on basic request', function () {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<button hx-get="/test" hx-ext="debug">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Clicked!");
    });

});