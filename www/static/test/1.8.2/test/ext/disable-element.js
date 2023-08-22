describe("disable-element extension", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('disables the triggering element during htmx request', function () {
        // GIVEN:
        // - A button triggering an htmx request with disable-element extension
        // - The button is enabled
        this.server.respondWith("GET", "/test", function (xhr) {
            xhr.respond(200, {})
        });
        var btn = make('<button hx-get="/test" hx-ext="disable-element" hx-disable-element="self">Click Me!</button>')
        btn.disabled.should.equal(false);

        // WHEN clicking
        btn.click();

        // THEN it's disabled
        btn.disabled.should.equal(true);

        // WHEN server response has arrived
        this.server.respond();

        // THEN it's re-enabled
        btn.disabled.should.equal(false);
    });

    it('disables the designated element during htmx request', function () {
        // GIVEN:
        // - A button triggering an htmx request with disable-element extension
        // - Another button that needs to be disabled during the htmx request
        // - Both buttons are enabled
        this.server.respondWith("GET", "/test", function (xhr) {
            xhr.respond(200, {})
        });
        var btn = make('<button hx-get="/test" hx-ext="disable-element" hx-disable-element="#should-be-disabled">Click Me!</button>')
        var btn2 = make('<button id="should-be-disabled">Should be disabled</button>')
        btn.disabled.should.equal(false);
        btn2.disabled.should.equal(false);

        // WHEN clicking
        btn.click();

        // THEN it's not disabled, but the other one is
        btn.disabled.should.equal(false);
        btn2.disabled.should.equal(true);

        // WHEN server response has arrived
        this.server.respond();

        // THEN both buttons are back enabled
        btn.disabled.should.equal(false);
        btn2.disabled.should.equal(false);
    });

});