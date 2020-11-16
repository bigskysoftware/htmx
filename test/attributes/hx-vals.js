describe("hx-vals attribute", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('basic hx-vals works', function () {
        this.server.respondWith("POST", "/vars", function (xhr) {
            var params = getParameters(xhr);
            params['i1'].should.equal("test");
            xhr.respond(200, {}, "Clicked!")
        });
        var div = make("<div hx-post='/vars' hx-vals='\"i1\":\"test\"'></div>")
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("Clicked!");
    });

    it('multiple hx-vals works', function () {
        this.server.respondWith("POST", "/vars", function (xhr) {
            var params = getParameters(xhr);
            params['v1'].should.equal("test");
            params['v2'].should.equal("42");
            xhr.respond(200, {}, "Clicked!")
        });
        var div = make("<div hx-post='/vars' hx-vals='\"v1\":\"test\", \"v2\":42'></div>")
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("Clicked!");
    });

    it('hx-vals can be on parents', function () {
        this.server.respondWith("POST", "/vars", function (xhr) {
            var params = getParameters(xhr);
            params['i1'].should.equal("test");
            xhr.respond(200, {}, "Clicked!")
        });
        make("<div hx-vals='\"i1\":\"test\"'><div id='d1' hx-post='/vars'></div></div>");
        var div = byId("d1");
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("Clicked!");
    });

    it('hx-vals can override parents', function () {
        this.server.respondWith("POST", "/vars", function (xhr) {
            var params = getParameters(xhr);
            params['i1'].should.equal("best");
            xhr.respond(200, {}, "Clicked!")
        });
        make("<div hx-vals='\"i1\":\"test\"'><div id='d1' hx-vals='\"i1\":\"best\"' hx-post='/vars'></div></div>");
        var div = byId("d1");
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("Clicked!");
    });

    it('hx-vals overrides inputs', function () {
        this.server.respondWith("POST", "/include", function (xhr) {
            var params = getParameters(xhr);
            params['i1'].should.equal("best");
            xhr.respond(200, {}, "Clicked!")
        });
        var div = make("<div hx-target='this'><input hx-post='/include' hx-vals='\"i1\":\"best\"' hx-trigger='click' id='i1' name='i1' value='test'/></div>")
        var input = byId("i1")
        input.click();
        this.server.respond();
        div.innerHTML.should.equal("Clicked!");
    });

    it('hx-vals overrides hx-vars', function () {
        this.server.respondWith("POST", "/vars", function (xhr) {
            var params = getParameters(xhr);
            params['i1'].should.equal("test");
            xhr.respond(200, {}, "Clicked!")
        });
        var div = make("<div hx-post='/vars' hx-vals='\"i1\":\"test\"' hx-vars='\"i1\":\"best\"'></div>")
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("Clicked!");
    });

});