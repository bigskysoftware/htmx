describe("hx-get attribute", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('issues a GET request on click and swaps content', function () {
        this.server.respondWith("GET", "/test", "Clicked!");

        var btn = make('<button hx-get="/test">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Clicked!");
    });

    it('GET does not include surrounding data by default', function () {
        this.server.respondWith("GET", "/test", function (xhr) {
            xhr.respond(200, {}, "Clicked!");
        });
        make('<form><input name="i1" value="value"/><button id="b1" hx-get="/test">Click Me!</inputbutton></form>')
        var btn = byId("b1");
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Clicked!");
    });
});