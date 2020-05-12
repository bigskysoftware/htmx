describe("kutty AJAX Headers Tests", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it("should include the X-KT-Request header", function(){
        this.server.respondWith("GET", "/test", function(xhr){
            xhr.requestHeaders['X-KT-Request'].should.be.equal('true');
            xhr.respond(200, {}, "");
        });
        var div = make('<div kt-get="/test"></div>');
        div.click();
        this.server.respond();
    })

    it("should include the X-KT-Trigger header", function(){
        this.server.respondWith("GET", "/test", function(xhr){
            xhr.requestHeaders['X-KT-Trigger'].should.equal('d1');
            xhr.respond(200, {}, "");
        });
        var div = make('<div id="d1" kt-get="/test"></div>');
        div.click();
        this.server.respond();
    })

    it("should include the X-KT-Trigger-Name header", function(){
        this.server.respondWith("GET", "/test", function(xhr){
            xhr.requestHeaders['X-KT-Trigger-Name'].should.equal('n1');
            xhr.respond(200, {}, "");
        });
        var div = make('<button name="n1" kt-get="/test"></button>');
        div.click();
        this.server.respond();
    })

    it("should include the X-KT-Target header", function(){
        this.server.respondWith("GET", "/test", function(xhr){
            xhr.requestHeaders['X-KT-Target'].should.equal('d1');
            xhr.respond(200, {}, "");
        });
        var div = make('<div kt-target="#d1" kt-get="/test"></div><div id="d1" ></div>');
        div.click();
        this.server.respond();
    })

    it("should handle simple string X-KT-Trigger response header properly", function(){
        this.server.respondWith("GET", "/test", [200, {"X-KT-Trigger" : "foo"}, ""]);

        var div = make('<div kt-get="/test"></div>');
        var invokedEvent = false;
        div.addEventListener("foo", function (evt) {
            invokedEvent = true;
        });
        div.click();
        this.server.respond();
        invokedEvent.should.equal(true);
    })

    it("should handle basic JSON X-KT-Trigger response header properly", function(){
        this.server.respondWith("GET", "/test", [200, {"X-KT-Trigger" : "{\"foo\":null}"}, ""]);

        var div = make('<div kt-get="/test"></div>');
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

    it("should handle JSON with array arg X-KT-Trigger response header properly", function(){
        this.server.respondWith("GET", "/test", [200, {"X-KT-Trigger" : "{\"foo\":[1, 2, 3]}"}, ""]);

        var div = make('<div kt-get="/test"></div>');
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

    it("should handle JSON with array arg X-KT-Trigger response header properly", function(){
        this.server.respondWith("GET", "/test", [200, {"X-KT-Trigger" : "{\"foo\":{\"a\":1, \"b\":2}}"}, ""]);

        var div = make('<div kt-get="/test"></div>');
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