describe("HTMx AJAX Headers Tests", function() {
    beforeEach(function () {
        this.server = sinon.fakeServer.create();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it("should handle simple string X-HX-Trigger response header properly", function(){
        this.server.respondWith("GET", "/test", [200, {"X-HX-Trigger" : "foo"}, ""]);

        var div = make('<div hx-get="/test"></div>');
        var invokedEvent = false;
        div.addEventListener("foo", function (evt) {
            invokedEvent = true;
        });
        div.click();
        this.server.respond();
        invokedEvent.should.equal(true);
    })

    it("should handle basic JSON X-HX-Trigger response header properly", function(){
        this.server.respondWith("GET", "/test", [200, {"X-HX-Trigger" : "{\"foo\":null}"}, ""]);

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

    it("should handle JSON with array arg X-HX-Trigger response header properly", function(){
        this.server.respondWith("GET", "/test", [200, {"X-HX-Trigger" : "{\"foo\":[1, 2, 3]}"}, ""]);

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

    it("should handle JSON with array arg X-HX-Trigger response header properly", function(){
        this.server.respondWith("GET", "/test", [200, {"X-HX-Trigger" : "{\"foo\":{\"a\":1, \"b\":2}}"}, ""]);

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

});