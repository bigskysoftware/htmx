describe("include-vals extension", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('Includes values properly', function () {
        var params = {};
        this.server.respondWith("POST", "/test", function (xhr) {
            params = getParameters(xhr);
            xhr.respond(200, {}, "clicked");
        });
        var btn = make('<button hx-post="/test" hx-ext="include-vals" include-vals="foo:\'bar\'">Click Me!</button>')
        btn.click();
        this.server.respond();
        params['foo'].should.equal("bar");
    });

});