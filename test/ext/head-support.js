describe("event-header extension", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('Add tests here', function () {
        this.server.respondWith("GET", "/test", function (xhr) {
            xhr.respond(200, {}, "<head><!-- TODO add content --></head>")
        });
        var btn = make('<button hx-get="/test" hx-ext="head-support">Click Me!</button>')
        btn.click();
        this.server.respond();
        // test head response here, here is an example assertion
        "foo".should.equal('foo');  // the new button is loaded
    });

});