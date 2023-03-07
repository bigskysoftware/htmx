describe("event-header extension", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('Sends the Triggering-Event header', function () {
        this.server.respondWith("GET", "/test", function (xhr) {
            xhr.respond(200, {}, xhr.requestHeaders['Triggering-Event'])
        });
        var btn = make('<button hx-get="/test" hx-ext="event-header">Click Me!</button>')
        btn.click();
        this.server.respond();
        var json = JSON.parse(btn.innerText);
        json.type.should.equal("click");
        json.target.should.equal("button");
    });

});