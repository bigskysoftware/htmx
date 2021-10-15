describe("swap-error extension", function() {
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
            xhr.respond(400, {}, xhr.responseHeaders['HX-SWAP-ERRORS'])
        });
        var btn = make('<button hx-get="/test" hx-ext="swap-errors">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("XMLHttpRequest");
    });

});