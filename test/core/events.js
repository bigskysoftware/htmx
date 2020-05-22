describe("Core htmx Events", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it("load.htmx fires properly", function () {
        var handler = htmx.on("load.htmx", function (evt) {
            called = true;
        });
        try {
            this.server.respondWith("GET", "/test", "<div></div>");
            var called = false;
            var div = make("<div hx-get='/test'></div>");
            div.click();
            this.server.respond();
            should.equal(called, true);
        } finally {
            htmx.off("load.htmx", handler);
        }
    });

    it("configRequest.htmx allows attribute addition", function () {
        var handler = htmx.on("configRequest.htmx", function (evt) {
            evt.detail.parameters['param'] = "true";
        });
        try {
            var param = null;
            this.server.respondWith("POST", "/test", function (xhr) {
                param = getParameters(xhr)['param'];
            });
            var div = make("<div hx-post='/test'></div>");
            div.click();
            this.server.respond();
            param.should.equal("true");
        } finally {
            htmx.off("configRequest.htmx", handler);
        }
    });

    it("configRequest.htmx allows attribute removal", function () {
        var param = "foo";
        var handler = htmx.on("configRequest.htmx", function (evt) {
            delete evt.detail.parameters['param'];
        });
        try {
            this.server.respondWith("POST", "/test", function (xhr) {
                param = getParameters(xhr)['param'];
            });
            var div = make("<form hx-trigger='click' hx-post='/test'><input name='param' value='foo'></form>");
            div.click();
            this.server.respond();
            should.equal(param, undefined);
        } finally {
            htmx.off("configRequest.htmx", handler);
        }
    });

    it("configRequest.htmx allows header tweaking", function () {
        var header = "foo";
        var handler = htmx.on("configRequest.htmx", function (evt) {
            evt.detail.headers['X-My-Header'] = "bar";
        });
        try {
            this.server.respondWith("POST", "/test", function (xhr) {
                header = xhr.requestHeaders['X-My-Header'];
            });
            var div = make("<form hx-trigger='click' hx-post='/test'><input name='param' value='foo'></form>");
            div.click();
            this.server.respond();
            should.equal(header, "bar");
        } finally {
            htmx.off("configRequest.htmx", handler);
        }
    });

});

