describe("Core htmx Events", function() {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it("htmx:load fires properly", function () {
        var called = false;
        var handler = htmx.on("htmx:load", function (evt) {
            called = true;
        });
        try {
            this.server.respondWith("GET", "/test", "");
            this.server.respondWith("GET", "/test", "<div></div>");
            var div = make("<div hx-get='/test'></div>");
            div.click();
            this.server.respond();
            should.equal(called, true);
        } finally {
            htmx.off("htmx:load", handler);
        }
    });

    it("htmx:configRequest allows attribute addition", function () {
        var handler = htmx.on("htmx:configRequest", function (evt) {
            evt.detail.parameters['param'] = "true";
        });
        try {
            var param = null;
            this.server.respondWith("POST", "/test", function (xhr) {
                param = getParameters(xhr)['param'];
                xhr.respond(200, {}, "");
            });
            var div = make("<div hx-post='/test'></div>");
            div.click();
            this.server.respond();
            param.should.equal("true");
        } finally {
            htmx.off("htmx:configRequest", handler);
        }
    });

    it("htmx:configRequest is also dispatched in kebab-case", function () {
        var handler = htmx.on("htmx:config-request", function (evt) {
            evt.detail.parameters['param'] = "true";
        });
        try {
            var param = null;
            this.server.respondWith("POST", "/test", function (xhr) {
                param = getParameters(xhr)['param'];
                xhr.respond(200, {}, "");
            });
            var div = make("<div hx-post='/test'></div>");
            div.click();
            this.server.respond();
            param.should.equal("true");
        } finally {
            htmx.off("htmx:config-request", handler);
        }
    });

    it("events are only dispatched once if kebab and camel case match", function () {
        var invoked = 0;
        var handler = htmx.on("custom", function () {
            invoked = invoked + 1
        });
        try {
            var div = make("<div hx-post='/test'></div>");
            htmx.trigger(div, "custom");
            invoked.should.equal(1);
        } finally {
            htmx.off("custom", handler);
        }
    });

    it("htmx:configRequest allows attribute removal", function () {
        var param = "foo";
        var handler = htmx.on("htmx:configRequest", function (evt) {
            delete evt.detail.parameters['param'];
        });
        try {
            this.server.respondWith("POST", "/test", function (xhr) {
                param = getParameters(xhr)['param'];
                xhr.respond(200, {}, "");
            });
            var div = make("<form hx-trigger='click' hx-post='/test'><input name='param' value='foo'></form>");
            div.click();
            this.server.respond();
            should.equal(param, undefined);
        } finally {
            htmx.off("htmx:configRequest", handler);
        }
    });

    it("htmx:configRequest allows header tweaking", function () {
        var header = "foo";
        var handler = htmx.on("htmx:configRequest", function (evt) {
            evt.detail.headers['X-My-Header'] = "bar";
        });
        try {
            this.server.respondWith("POST", "/test", function (xhr) {
                header = xhr.requestHeaders['X-My-Header'];
                xhr.respond(200, {}, "");
            });
            var div = make("<form hx-trigger='click' hx-post='/test'><input name='param' value='foo'></form>");
            div.click();
            this.server.respond();
            should.equal(header, "bar");
        } finally {
            htmx.off("htmx:configRequest", handler);
        }
    });

    it("htmx:afterSwap is called when replacing outerHTML", function () {
        var called = false;
        var handler = htmx.on("htmx:afterSwap", function (evt) {
            called = true;
        });
        try {
            this.server.respondWith("POST", "/test", function (xhr) {
                xhr.respond(200, {}, "<button>Bar</button>");
            });
            var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>");
            div.click();
            this.server.respond();
            should.equal(called, true);
        } finally {
            htmx.off("htmx:afterSwap", handler);
        }
    });

    it("htmx:beforeOOBSwap is called before swap", function () {
        var called = false;
        var handler = htmx.on("htmx:beforeOOBSwap", function (evt) {
            called = true;
        });
        try {
            this.server.respondWith("POST", "/test", function (xhr) {
                xhr.respond(200, {}, "<button>Bar</button><div hx-swap-oob='true' id='d1'>Baz</div>");
            });
            var oob = make('<div id="d1">Blip</div>');
            var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>");
            div.click();
            this.server.respond();
            byId("d1").innerHTML.should.equal("Baz");
            should.equal(called, true);
        } finally {
            htmx.off("htmx:beforeOOBSwap", handler);
        }
    });

    it("htmx:beforeOOBSwap is not called on an oob miss", function () {
        var called = false;
        var handler = htmx.on("htmx:beforeOOBSwap", function (evt) {
            called = true;
        });
        try {
            this.server.respondWith("POST", "/test", function (xhr) {
                xhr.respond(200, {}, "<button>Bar</button><div hx-swap-oob='true' id='test'>Baz</div>");
            });
            var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>");
            div.click();
            this.server.respond();
            should.equal(called, false);
        } finally {
            htmx.off("htmx:beforeOOBSwap", handler);
        }
    });

    it("htmx:afterOOBSwap is called after swap", function () {
        var called = false;
        var handler = htmx.on("htmx:afterOOBSwap", function (evt) {
            called = true;
        });
        try {
            this.server.respondWith("POST", "/test", function (xhr) {
                xhr.respond(200, {}, "<button>Bar</button><div hx-swap-oob='true' id='d1'>Baz</div>");
            });
            var oob = make('<div id="d1">Blip</div>');
            var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>");
            div.click();
            this.server.respond();
            byId("d1").innerHTML.should.equal("Baz");
            should.equal(called, true);
        } finally {
            htmx.off("htmx:afterOOBSwap", handler);
        }
    });

    it("htmx:afterOOBSwap is not called on an oob miss", function () {
        var called = false;
        var handler = htmx.on("htmx:afterOOBSwap", function (evt) {
            called = true;
        });
        try {
            this.server.respondWith("POST", "/test", function (xhr) {
                xhr.respond(200, {}, "<button>Bar</button><div hx-swap-oob='true' id='test'>Baz</div>");
            });
            var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>");
            div.click();
            this.server.respond();
            should.equal(called, false);
        } finally {
            htmx.off("htmx:afterOOBSwap", handler);
        }
    });

    it("htmx:afterSettle is called once when replacing outerHTML", function () {
        var called = 0;
        var handler = htmx.on("htmx:afterSettle", function (evt) {
            called++;
        });
        try {
            this.server.respondWith("POST", "/test", function (xhr) {
                xhr.respond(200, {}, "<button>Bar</button>");
            });
            var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>");
            div.click();
            this.server.respond();
            should.equal(called, 1);
        } finally {
            htmx.off("htmx:afterSettle", handler);
        }
    });

    it("htmx:afterSettle is called once when replacing outerHTML with whitespace", function () {
        var called = 0;
        var handler = htmx.on("htmx:afterSettle", function (evt) {
            called++;
        });
        try {
            this.server.respondWith("POST", "/test", function (xhr) {
                xhr.respond(200, {}, "<button>Bar</button>\n");
            });
            var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>");
            div.click();
            this.server.respond();
            should.equal(called, 1);
        } finally {
            htmx.off("htmx:afterSettle", handler);
        }
    });

    it("htmx:afterSettle is called twice when replacing outerHTML with whitespace separated elements", function () {
        var called = 0;
        var handler = htmx.on("htmx:afterSettle", function (evt) {
            called++;
        });
        try {
            this.server.respondWith("POST", "/test", function (xhr) {
                xhr.respond(200, {}, "<button>Bar</button>\n <a>Foo</a>");
            });
            var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>");
            div.click();
            this.server.respond();
            should.equal(called, 2);
        } finally {
            htmx.off("htmx:afterSettle", handler);
        }
    });

    it("htmx:afterRequest is called after a successful request", function () {
        var called = false;
        var handler = htmx.on("htmx:afterRequest", function (evt) {
            called = true;
        });
        try {
            this.server.respondWith("POST", "/test", function (xhr) {
                xhr.respond(200, {}, "");
            });
            var div = make("<button hx-post='/test'>Foo</button>");
            div.click();
            this.server.respond();
            should.equal(called, true);
        } finally {
            htmx.off("htmx:afterRequest", handler);
        }
    });

    it("htmx:afterOnLoad is called after a successful request", function () {
        var called = false;
        var handler = htmx.on("htmx:afterOnLoad", function (evt) {
            called = true;
        });
        try {
            this.server.respondWith("POST", "/test", function (xhr) {
                xhr.respond(200, {}, "");
            });
            var div = make("<button hx-post='/test'>Foo</button>");
            div.click();
            this.server.respond();
            should.equal(called, true);
        } finally {
            htmx.off("htmx:afterOnLoad", handler);
        }
    });

    it("htmx:afterRequest is called after a failed request", function () {
        var called = false;
        var handler = htmx.on("htmx:afterRequest", function (evt) {
            called = true;
        });
        try {
            this.server.respondWith("POST", "/test", function (xhr) {
                xhr.respond(500, {}, "");
            });
            var div = make("<button hx-post='/test'>Foo</button>");
            div.click();
            this.server.respond();
            should.equal(called, true);
        } finally {
            htmx.off("htmx:afterRequest", handler);
        }
    });

    it("htmx:sendError is called after a failed request", function (done) {
        var called = false;
        var handler = htmx.on("htmx:sendError", function (evt) {
            called = true;
        });
        this.server.restore(); // turn off server mock so connection doesn't work
        var div = make("<button hx-post='file://foo'>Foo</button>");
        div.click();
        setTimeout(function () {
            htmx.off("htmx:sendError", handler);
            should.equal(called, true);
            done();
        }, 30);
    });

    it("htmx:afterRequest is called when replacing outerHTML", function () {
        var called = false;
        var handler = htmx.on("htmx:afterRequest", function (evt) {
            called = true;
        });
        try {
            this.server.respondWith("POST", "/test", function (xhr) {
                xhr.respond(200, {}, "<button>Bar</button>");
            });
            var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>");
            div.click();
            this.server.respond();
            should.equal(called, true);
        } finally {
            htmx.off("htmx:afterRequest", handler);
        }
    });

    it("htmx:afterOnLoad is called when replacing outerHTML", function () {
        var called = false;
        var handler = htmx.on("htmx:afterOnLoad", function (evt) {
            called = true;
        });
        try {
            this.server.respondWith("POST", "/test", function (xhr) {
                xhr.respond(200, {}, "<button>Bar</button>");
            });
            var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>");
            div.click();
            this.server.respond();
            should.equal(called, true);
        } finally {
            htmx.off("htmx:afterOnLoad", handler);
        }
    });

    it("htmx:beforeProcessNode is called when replacing outerHTML", function () {
        var called = false;
        var handler = htmx.on("htmx:beforeProcessNode", function (evt) {
            called = true;
        });
        try {
            this.server.respondWith("POST", "/test", function (xhr) {
                xhr.respond(200, {}, "<button>Bar</button>");
            });
            var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>");
            div.click();
            this.server.respond();
            should.equal(called, true);
        } finally {
            htmx.off("htmx:beforeProcessNode", handler);
        }
    });

    it("htmx:beforeProcessNode allows htmx attribute tweaking", function () {
        var called = false;
        var handler = htmx.on("htmx:beforeProcessNode", function (evt) {
            evt.target.setAttribute("hx-post", "/success")
            called = true;
        });
        try {
            this.server.respondWith("POST", "/success", function (xhr) {
                xhr.respond(200, {}, "<button>Bar</button>");
            });
            var div = make("<button hx-post='/fail' hx-swap='outerHTML'>Foo</button>");
            div.click();
            this.server.respond();
            should.equal(called, true);
        } finally {
            htmx.off("htmx:beforeProcessNode", handler);
        }
    });

    it("htmx:afterProcessNode is called after replacing outerHTML", function () {
        var called = false;
        var handler = htmx.on("htmx:afterProcessNode", function (evt) {
            called = true;
        });
        try {
            this.server.respondWith("POST", "/test", function (xhr) {
                xhr.respond(200, {}, "<button>Bar</button>");
            });
            var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>");
            div.click();
            this.server.respond();
            should.equal(called, true);
        } finally {
            htmx.off("htmx:afterProcessNode", handler);
        }
    });

    it("htmx:afterRequest is called when targeting a parent div", function () {
        var called = false;
        var handler = htmx.on("htmx:afterRequest", function (evt) {
            called = true;
        });
        try {
            this.server.respondWith("POST", "/test", function (xhr) {
                xhr.respond(200, {}, "<button>Bar</button>");
            });
            var div = make("<div hx-target='this'><button id='b1' hx-post='/test' hx-swap='outerHTML'>Foo</button></div>");
            var button = byId('b1');
            button.click();
            this.server.respond();
            should.equal(called, true);
        } finally {
            htmx.off("htmx:afterRequest", handler);
        }
    });

    it("adding an error in htmx:configRequest stops the request", function () {
        try {
            var handler = htmx.on("htmx:configRequest", function (evt) {
                evt.detail.errors.push("An error");
            });
            var request = false;
            this.server.respondWith("POST", "/test", function (xhr) {
                request = true;
                xhr.respond(200, {}, "<button>Bar</button>");
            });
            var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>");
            div.click();
            this.server.respond();
            should.equal(request, false);
        } finally {
            htmx.off("htmx:configRequest", handler);
        }
    });

    it("preventDefault() in htmx:configRequest stops the request", function () {
        try {
            var handler = htmx.on("htmx:configRequest", function (evt) {
                evt.detail.errors.push("An error");
            });
            var request = false;
            this.server.respondWith("POST", "/test", function (xhr) {
                request = true;
                xhr.respond(200, {}, "<button>Bar</button>");
            });
            var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>");
            div.click();
            this.server.respond();
            should.equal(request, false);
        } finally {
            htmx.off("htmx:configRequest", handler);
        }
    });

    it("preventDefault() in the htmx:beforeRequest event cancels the request", function () {
        try {
            var handler = htmx.on("htmx:beforeRequest", function (evt) {
                evt.preventDefault();
            });
            var request = false;
            this.server.respondWith("POST", "/test", function (xhr) {
                request = true;
                xhr.respond(200, {}, "<button>Bar</button>");
            });
            var div = make("<button hx-post='/test' hx-swap='outerHTML'>Foo</button>");
            div.click();
            this.server.respond();
            should.equal(request, false);
        } finally {
            htmx.off("htmx:beforeRequest", handler);
        }
    });

    it("preventDefault() in the htmx:beforeOnLoad event cancels the swap", function () {
        try {
            var handler = htmx.on("htmx:beforeOnLoad", function (evt) {
                evt.preventDefault();
            });
            var request = false;
            this.server.respondWith("POST", "/test", function (xhr) {
                request = true;
                xhr.respond(200, {}, "Bar");
            });
            var div = make("<button hx-post='/test'>Foo</button>");
            div.click();
            this.server.respond();
            should.equal(request, true);
            div.innerText.should.equal("Foo");
        } finally {
            htmx.off("htmx:beforeOnLoad", handler);
        }
    });

    it("htmx:afterRequest event contains 'successful' and 'failed' properties indicating success after successful request", function () {
        var successful = false;
        var failed = true;
        var handler = htmx.on("htmx:afterRequest", function (evt) {
            successful = evt.detail.successful;
            failed = evt.detail.failed;
        });
        try {
            this.server.respondWith("POST", "/test", function (xhr) {
                xhr.respond(200, {}, "");
            });
            var div = make("<button hx-post='/test'>Foo</button>");
            div.click();
            this.server.respond();
            should.equal(successful, true);
            should.equal(failed, false);
        } finally {
            htmx.off("htmx:afterRequest", handler);
        }
    });

    it("htmx:afterRequest event contains 'successful' and 'failed' properties indicating failure after failed request", function () {
        var successful = true;
        var failed = false;
        var handler = htmx.on("htmx:afterRequest", function (evt) {
            successful = evt.detail.successful;
            failed = evt.detail.failed;
        });
        try {
            this.server.respondWith("POST", "/test", function (xhr) {
                xhr.respond(500, {}, "");
            });
            var div = make("<button hx-post='/test'>Foo</button>");
            div.click();
            this.server.respond();
            should.equal(successful, false);
            should.equal(failed, true);
        } finally {
            htmx.off("htmx:afterRequest", handler);
        }
    });


});
