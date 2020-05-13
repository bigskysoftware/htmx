describe("Core kutty Events", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it("load.kutty fires properly", function () {
        var handler = kutty.on("load.kutty", function (evt) {
            called = true;
        });
        try {
            this.server.respondWith("GET", "/test", "<div></div>");
            var called = false;
            var div = make("<div kt-get='/test'></div>");
            div.click();
            this.server.respond();
            should.equal(called, true);
        } finally {
            kutty.off("load.kutty", handler);
        }
    });

    it("configRequest.kutty allows attribute addition", function () {
        var handler = kutty.on("configRequest.kutty", function (evt) {
            evt.detail.parameters['param'] = "true";
        });
        try {
            var param = null;
            this.server.respondWith("POST", "/test", function (xhr) {
                param = parseParams(xhr.requestBody)['param'];
            });
            var div = make("<div kt-post='/test'></div>");
            div.click();
            this.server.respond();
            param.should.equal("true");
        } finally {
            kutty.off("configRequest.kutty", handler);
        }
    });

    it("configRequest.kutty allows attribute removal", function () {
        var param = "foo";
        var handler = kutty.on("configRequest.kutty", function (evt) {
            delete evt.detail.parameters['param'];
        });
        try {
            this.server.respondWith("POST", "/test", function (xhr) {
                param = parseParams(xhr.requestBody)['param'];
            });
            var div = make("<form kt-trigger='click' kt-post='/test'><input name='param' value='foo'></form>");
            div.click();
            this.server.respond();
            should.equal(param, undefined);
        } finally {
            kutty.off("configRequest.kutty", handler);
        }
    });

    it("configRequest.kutty allows header tweaking", function () {
        var header = "foo";
        var handler = kutty.on("configRequest.kutty", function (evt) {
            evt.detail.headers['X-My-Header'] = "bar";
        });
        try {
            this.server.respondWith("POST", "/test", function (xhr) {
                header = xhr.requestHeaders['X-My-Header'];
            });
            var div = make("<form kt-trigger='click' kt-post='/test'><input name='param' value='foo'></form>");
            div.click();
            this.server.respond();
            should.equal(header, "bar");
        } finally {
            kutty.off("configRequest.kutty", handler);
        }
    });

});

