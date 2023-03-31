describe("hx-on attribute", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it("can handle basic events w/ no other attributes", function () {
        var btn = make("<button hx-on='click: window.foo = true'>Foo</button>");
        btn.click();
        window.foo.should.equal(true);
        delete window.foo;
    });

    it("can modify a parameter via htmx:configRequest", function () {
        this.server.respondWith("POST", "/test", function (xhr) {
            var params = parseParams(xhr.requestBody);
            xhr.respond(200, {}, params.foo);
        });
        var btn = make("<button hx-on='htmx:configRequest: event.detail.parameters.foo = \"bar\"' hx-post='/test'>Foo</button>");
        btn.click();
        this.server.respond();
        btn.innerText.should.equal("bar");
    });

    it("can cancel an event via preventDefault for htmx:configRequest", function () {
        this.server.respondWith("POST", "/test", function (xhr) {
            xhr.respond(200, {}, "<button>Bar</button>");
        });
        var btn = make("<button hx-on='htmx:configRequest: event.preventDefault()' hx-post='/test' hx-swap='outerHTML'>Foo</button>");
        btn.click();
        this.server.respond();
        btn.innerText.should.equal("Foo");
    });

    it("can respond to kebab-case events", function () {
        this.server.respondWith("POST", "/test", function (xhr) {
            var params = parseParams(xhr.requestBody);
            xhr.respond(200, {}, params.foo);
        });
        var btn = make("<button hx-on='htmx:config-request: event.detail.parameters.foo = \"bar\"' hx-post='/test'>Foo</button>");
        btn.click();
        this.server.respond();
        btn.innerText.should.equal("bar");
    });

    it("has the this symbol set to the element", function () {
        this.server.respondWith("POST", "/test", function (xhr) {
            xhr.respond(200, {}, "foo");
        });
        var btn = make("<button hx-on='htmx:config-request: window.elt = this' hx-post='/test'>Foo</button>");
        btn.click();
        this.server.respond();
        btn.innerText.should.equal("foo");
        btn.should.equal(window.elt);
        delete window.elt;
    });

    it("can handle multi-line JSON", function () {
        this.server.respondWith("POST", "/test", function (xhr) {
            xhr.respond(200, {}, "foo");
        });
        var btn = make("<button hx-on='htmx:config-request: window.elt = {foo: true,\n" +
            "                                                             bar: false}' hx-post='/test'>Foo</button>");
        btn.click();
        this.server.respond();
        btn.innerText.should.equal("foo");
        var obj = {foo: true, bar: false};
        obj.should.deep.equal(window.elt);
        delete window.elt;
    });

    it("can handle multiple event handlers in the presence of multi-line JSON", function () {
        this.server.respondWith("POST", "/test", function (xhr) {
            xhr.respond(200, {}, "foo");
        });
        var btn = make("<button hx-on='htmx:config-request: window.elt = {foo: true,\n" +
            "                                                             bar: false}\n" +
            "                          htmx:afterRequest: window.foo = true'" +
            " hx-post='/test'>Foo</button>");
        btn.click();
        this.server.respond();
        btn.innerText.should.equal("foo");

        var obj = {foo: true, bar: false};
        obj.should.deep.equal(window.elt);
        delete window.elt;

        window.foo.should.equal(true);
        delete window.foo;
    });

});
