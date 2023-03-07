describe("ajax-header extension", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('Sends the X-Requested-With header', function () {
        this.server.respondWith("GET", "/test", function (xhr) {
            xhr.respond(200, {}, xhr.requestHeaders['X-Requested-With'])
        });
        var btn = make('<button hx-get="/test" hx-ext="ajax-header">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("XMLHttpRequest");
    });

});