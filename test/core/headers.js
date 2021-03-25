describe("Core htmx AJAX headers", function () {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it("should include the HX-Request header", function () {
        this.server.respondWith("GET", "/test", function (xhr) {
            xhr.requestHeaders['HX-Request'].should.be.equal('true');
            xhr.respond(200, {}, "");
        });
        var div = make('<div hx-get="/test"></div>');
        div.click();
        this.server.respond();
    })

    it("should include the HX-Trigger header", function () {
        this.server.respondWith("GET", "/test", function (xhr) {
            xhr.requestHeaders['HX-Trigger'].should.equal('d1');
            xhr.respond(200, {}, "");
        });
        var div = make('<div id="d1" hx-get="/test"></div>');
        div.click();
        this.server.respond();
    })

    it("should include the HX-Trigger-Name header", function () {
        this.server.respondWith("GET", "/test", function (xhr) {
            xhr.requestHeaders['HX-Trigger-Name'].should.equal('n1');
            xhr.respond(200, {}, "");
        });
        var div = make('<button name="n1" hx-get="/test"></button>');
        div.click();
        this.server.respond();
    })

    it("should include the HX-Target header", function () {
        this.server.respondWith("GET", "/test", function (xhr) {
            xhr.requestHeaders['HX-Target'].should.equal('d1');
            xhr.respond(200, {}, "");
        });
        var div = make('<div hx-target="#d1" hx-get="/test"></div><div id="d1" ></div>');
        div.click();
        this.server.respond();
    })

    it("should handle simple string HX-Trigger response header properly", function () {
        this.server.respondWith("GET", "/test", [200, {"HX-Trigger": "foo"}, ""]);

        var div = make('<div hx-get="/test"></div>');
        var invokedEvent = false;
        div.addEventListener("foo", function (evt) {
            invokedEvent = true;
        });
        div.click();
        this.server.respond();
        invokedEvent.should.equal(true);
    })

    it("should handle dot path HX-Trigger response header properly", function () {
        this.server.respondWith("GET", "/test", [200, {"HX-Trigger": "foo.bar"}, ""]);

        var div = make('<div hx-get="/test"></div>');
        var invokedEvent = false;
        div.addEventListener("foo.bar", function (evt) {
            invokedEvent = true;
        });
        div.click();
        this.server.respond();
        invokedEvent.should.equal(true);
    })

    it("should handle simple string HX-Trigger response header in different case properly", function () {
        this.server.respondWith("GET", "/test", [200, {"hx-trigger": "foo"}, ""]);

        var div = make('<div hx-get="/test"></div>');
        var invokedEvent = false;
        div.addEventListener("foo", function (evt) {
            invokedEvent = true;
        });
        div.click();
        this.server.respond();
        invokedEvent.should.equal(true);
    })

    it("should handle a namespaced HX-Trigger response header properly", function () {
        this.server.respondWith("GET", "/test", [200, {"HX-Trigger": "namespace:foo"}, ""]);

        var div = make('<div hx-get="/test"></div>');
        var invokedEvent = false;
        div.addEventListener("namespace:foo", function (evt) {
            invokedEvent = true;
        });
        div.click();
        this.server.respond();
        invokedEvent.should.equal(true);
    })

    it("should handle basic JSON HX-Trigger response header properly", function () {
        this.server.respondWith("GET", "/test", [200, {"HX-Trigger": "{\"foo\":null}"}, ""]);

        var div = make('<div hx-get="/test"></div>');
        var invokedEvent = false;
        div.addEventListener("foo", function (evt) {
            invokedEvent = true;
            should.equal(null, evt.detail.value);
            evt.detail.elt.should.equal(div);
        });
        div.click();
        this.server.respond();
        invokedEvent.should.equal(true);
    })

    it("should handle JSON with array arg HX-Trigger response header properly", function () {
        this.server.respondWith("GET", "/test", [200, {"HX-Trigger": "{\"foo\":[1, 2, 3]}"}, ""]);

        var div = make('<div hx-get="/test"></div>');
        var invokedEvent = false;
        div.addEventListener("foo", function (evt) {
            invokedEvent = true;
            evt.detail.elt.should.equal(div);
            evt.detail.value.should.deep.equal([1, 2, 3]);
        });
        div.click();
        this.server.respond();
        invokedEvent.should.equal(true);
    })

    it("should handle JSON with array arg HX-Trigger response header properly", function () {
        this.server.respondWith("GET", "/test", [200, {"HX-Trigger": "{\"foo\":{\"a\":1, \"b\":2}}"}, ""]);

        var div = make('<div hx-get="/test"></div>');
        var invokedEvent = false;
        div.addEventListener("foo", function (evt) {
            invokedEvent = true;
            evt.detail.elt.should.equal(div);
            evt.detail.a.should.equal(1);
            evt.detail.b.should.equal(2);
        });
        div.click();
        this.server.respond();
        invokedEvent.should.equal(true);
    })

    it("should survive malformed JSON in HX-Trigger response header", function () {
        this.server.respondWith("GET", "/test", [200, {"HX-Trigger": "{not: valid}"}, ""]);

        var div = make('<div hx-get="/test"></div>');
        div.click();
        this.server.respond();
    })

    it("should handle simple string HX-Trigger response header properly w/ outerHTML swap", function () {
        this.server.respondWith("GET", "/test", [200, {"HX-Trigger": "foo"}, ""]);

        var div = make('<div hx-swap="outerHTML" hx-get="/test"></div>');
        var invokedEvent = false;
        var handler = htmx.on('foo', function (evt) {
            invokedEvent = true;
        });
        div.click();
        this.server.respond();
        invokedEvent.should.equal(true);
        htmx.off('foo', handler);
    })


    it("should handle simple string HX-Trigger-After-Swap response header properly w/ outerHTML swap", function () {
        this.server.respondWith("GET", "/test", [200, {"HX-Trigger-After-Swap": "foo"}, ""]);

        var div = make('<div hx-swap="outerHTML" hx-get="/test"></div>');
        var invokedEvent = false;
        var handler = htmx.on('foo', function (evt) {
            invokedEvent = true;
        });
        div.click();
        this.server.respond();
        invokedEvent.should.equal(true);
        htmx.off('foo', handler);
    })

    it("should handle simple string HX-Trigger-After-Settle response header properly w/ outerHTML swap", function () {
        this.server.respondWith("GET", "/test", [200, {"HX-Trigger-After-Settle": "foo"}, ""]);

        var div = make('<div hx-swap="outerHTML" hx-get="/test"></div>');
        var invokedEvent = false;
        var handler = htmx.on('foo', function (evt) {
            invokedEvent = true;
        });
        div.click();
        this.server.respond();
        invokedEvent.should.equal(true);
        htmx.off('foo', handler);
    })


});
