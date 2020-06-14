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
        var calls = [];
        var handler = htmx.on("load.htmx", function (evt) {
            calls.push({detailElt: evt.detail.elt, eventTarget: evt.target});
        });
        try {
            this.server.respondWith("GET", "/test", "");
            this.server.respondWith("GET", "/test", "<div id='id1'><span></span></div><div id='id2'></div>");
            var div = make("<div hx-get='/test'></div>");
            div.click();
            this.server.respond();
            // called for new "parents" element, ie div id1 & id2 but not the span
            calls.length.should.equal(2);
            calls[0].eventTarget.id.should.equal('id1');
            calls[0].detailElt.id.should.equal('id1');
            calls[1].eventTarget.id.should.equal('id2');
            calls[1].detailElt.id.should.equal('id2');
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
                xhr.respond(200, {}, "");
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
                xhr.respond(200, {}, "");
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
                xhr.respond(200, {}, "");
            });
            var div = make("<form hx-trigger='click' hx-post='/test'><input name='param' value='foo'></form>");
            div.click();
            this.server.respond();
            should.equal(header, "bar");
        } finally {
            htmx.off("configRequest.htmx", handler);
        }
    });

    it("afterSwap.htmx is called when replacing outerHTML", function () {
        var called = false;
        var handler = htmx.on("afterSwap.htmx", function (evt) {
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
            htmx.off("afterSwap.htmx", handler);
        }
    });

    it("afterSettle.htmx is called when replacing outerHTML", function () {
        var called = false;
        var handler = htmx.on("afterSettle.htmx", function (evt) {
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
            htmx.off("afterSettle.htmx", handler);
        }
    });

    it("configureRequest.htmx should contain correct elements", function () {
        var calls = [];
        var handler = htmx.on("configRequest.htmx", function (evt) {
            calls.push({detailElt: evt.detail.elt, detailTrigger: evt.detail.trigger, detailTarget: evt.detail.target, eventTarget: evt.target});
        });
        try {
            this.server.respondWith("GET", "/test", "<div id='id1'></div><div id='id2'></div>");
            var div = make("<div hx-get='/test' id='id0'></div>");
            div.click();
            this.server.respond();
            calls.length.should.equal(1);
            calls[0].eventTarget.should.equal(div);
            calls[0].detailTrigger.should.equal(div);
            calls[0].detailTarget.should.equal(div);
            calls[0].detailElt.should.equal(div);
        } finally {
            htmx.off("configRequest.htmx", handler);
        }
    });

    it("beforeOnLoad.htmx should contain correct elements", function () {
        var calls = [];
        var handler = htmx.on("beforeOnLoad.htmx", function (evt) {
            calls.push({detailElt: evt.detail.elt, detailTrigger: evt.detail.trigger, detailTarget: evt.detail.target, eventTarget: evt.target});
        });
        try {
            this.server.respondWith("GET", "/test", "<div id='id1'></div><div id='id2'></div>");
            var div = make("<div hx-get='/test' id='id0'></div>");
            div.click();
            this.server.respond();
            calls.length.should.equal(1);
            calls[0].eventTarget.should.equal(div);
            calls[0].detailTrigger.should.equal(div);
            calls[0].detailTarget.should.equal(div);
            calls[0].detailElt.should.equal(div);
        } finally {
            htmx.off("beforeOnLoad.htmx", handler);
        }
    });

    it("beforeSwap.htmx should contain correct elements (target == trigger)", function () {
        var calls = [];
        var handler = htmx.on("beforeSwap.htmx", function (evt) {
            calls.push({detailElt: evt.detail.elt, detailTrigger: evt.detail.trigger, detailTarget: evt.detail.target, eventTarget: evt.target});
        });
        try {
            this.server.respondWith("GET", "/test", "<div id='id1'></div><div id='id2'></div>");
            var div = make("<div hx-get='/test' id='id0'></div>");
            div.click();
            this.server.respond();
            calls.length.should.equal(1);
            calls[0].eventTarget.should.equal(div);
            calls[0].detailTrigger.should.equal(div);
            calls[0].detailTarget.should.equal(div);
            calls[0].detailElt.should.equal(div);
        } finally {
            htmx.off("beforeSwap.htmx", handler);
        }
    });

    it("beforeSwap.htmx should contain correct elements (target != trigger)", function () {
        var calls = [];
        var handler = htmx.on("beforeSwap.htmx", function (evt) {
            calls.push({detailElt: evt.detail.elt, detailTrigger: evt.detail.trigger, detailTarget: evt.detail.target, eventTarget: evt.target});
        });
        try {
            this.server.respondWith("GET", "/test", "<div id='id1'></div><div id='id2'></div>");
            var trigger = make("<div hx-get='/test' id='id0' hx-target='#id00 '></div>");
            var target = make("<div id='id00'></div>");
            trigger.click();
            this.server.respond();
            calls.length.should.equal(1);
            calls[0].eventTarget.should.equal(target);
            calls[0].detailTrigger.should.equal(trigger);
            calls[0].detailTarget.should.equal(target);
            calls[0].detailElt.should.equal(target);
        } finally {
            htmx.off("beforeSwap.htmx", handler);
        }
    });

    it("afterSwap.htmx should contain correct elements (swap=innerHTML)", function () {
        var calls = [];
        var handler = htmx.on("afterSwap.htmx", function (evt) {
            calls.push({detailElt: evt.detail.elt, detailTrigger: evt.detail.trigger, detailTarget: evt.detail.target, eventTarget: evt.target});
        });
        try {
            this.server.respondWith("GET", "/test", "<div id='id1'></div><div id='id2'></div>");
            var div = make("<div hx-get='/test' id='id0' hx-swap='innerHTML'></div>");
            div.click();
            this.server.respond();
            // target is the only pseudo-root content updated
            calls.length.should.equal(1);
            calls[0].eventTarget.should.equal(div);
            calls[0].detailTrigger.should.equal(div);
            calls[0].detailTarget.should.equal(div);
            calls[0].detailElt.should.equal(div);
        } finally {
            htmx.off("afterSwap.htmx", handler);
        }
    });

    it("afterSwap.htmx should contain correct elements (swap=outerHTML)", function () {
        var calls = [];
        var handler = htmx.on("afterSwap.htmx", function (evt) {
            calls.push({detailElt: evt.detail.elt, detailTrigger: evt.detail.trigger, detailTarget: evt.detail.target, eventTarget: evt.target});
        });
        try {
            this.server.respondWith("GET", "/test", "<div id='id1'></div><div id='id2'></div>");
            var div = make("<div hx-get='/test' id='id0' hx-swap='outerHTML'></div>");
            div.click();
            this.server.respond();
            // target is replaced by two new pseudo-roots: id1 & id2
            calls.length.should.equal(2);
            calls[0].eventTarget.id.should.equal('id1');
            calls[0].detailTrigger.should.equal(div);
            calls[0].detailTarget.should.equal(div);
            calls[0].detailElt.id.should.equal('id1');
            calls[1].eventTarget.id.should.equal('id2');
            calls[1].detailTrigger.should.equal(div);
            calls[1].detailTarget.should.equal(div);
            calls[1].detailElt.id.should.equal('id2');
        } finally {
            htmx.off("afterSwap.htmx", handler);
        }
    });

    it("afterSwap.htmx should contain correct elements (swap=beforebegin)", function () {
        var calls = [];
        var handler = htmx.on("afterSwap.htmx", function (evt) {
            calls.push({detailElt: evt.detail.elt, detailTrigger: evt.detail.trigger, detailTarget: evt.detail.target, eventTarget: evt.target});
        });
        try {
            this.server.respondWith("GET", "/test", "<div id='id1'></div><div id='id2'></div>");
            var div = make("<div hx-get='/test' id='id0' hx-swap='beforebegin'></div>");
            div.click();
            this.server.respond();
            // target is preceded by two new pseudo-roots: id1 & id2
            calls.length.should.equal(3);
            calls[0].eventTarget.id.should.equal('id0');
            calls[0].detailTrigger.should.equal(div);
            calls[0].detailTarget.should.equal(div);
            calls[0].detailElt.id.should.equal('id0');
            calls[1].eventTarget.id.should.equal('id1');
            calls[1].detailTrigger.should.equal(div);
            calls[1].detailTarget.should.equal(div);
            calls[1].detailElt.id.should.equal('id1');
            calls[2].eventTarget.id.should.equal('id2');
            calls[2].detailTrigger.should.equal(div);
            calls[2].detailTarget.should.equal(div);
            calls[2].detailElt.id.should.equal('id2');
        } finally {
            htmx.off("afterSwap.htmx", handler);
        }
    });

    it("afterSwap.htmx should contain correct elements (swap=afterbegin)", function () {
        var calls = [];
        var handler = htmx.on("afterSwap.htmx", function (evt) {
            calls.push({detailElt: evt.detail.elt, detailTrigger: evt.detail.trigger, detailTarget: evt.detail.target, eventTarget: evt.target});
        });
        try {
            this.server.respondWith("GET", "/test", "<div id='id1'></div><div id='id2'></div>");
            var div = make("<div hx-get='/test' id='id0' hx-swap='afterbegin'></div>");
            div.click();
            this.server.respond();
            // target is still the only pseudo-root content updated
            calls.length.should.equal(1);
            calls[0].eventTarget.should.equal(div);
            calls[0].detailTrigger.should.equal(div);
            calls[0].detailTarget.should.equal(div);
            calls[0].detailElt.should.equal(div);
        } finally {
            htmx.off("afterSwap.htmx", handler);
        }
    });

    it("afterSwap.htmx should contain correct elements (swap=beforeend)", function () {
        var calls = [];
        var handler = htmx.on("afterSwap.htmx", function (evt) {
            calls.push({detailElt: evt.detail.elt, detailTrigger: evt.detail.trigger, detailTarget: evt.detail.target, eventTarget: evt.target});
        });
        try {
            this.server.respondWith("GET", "/test", "<div id='id1'></div><div id='id2'></div>");
            var div = make("<div hx-get='/test' id='id0' hx-swap='beforeend'></div>");
            div.click();
            this.server.respond();
            // target is still the only pseudo-root content updated
            calls.length.should.equal(1);
            calls[0].eventTarget.should.equal(div);
            calls[0].detailTrigger.should.equal(div);
            calls[0].detailTarget.should.equal(div);
            calls[0].detailElt.should.equal(div);
        } finally {
            htmx.off("afterSwap.htmx", handler);
        }
    });

    it("afterSwap.htmx should contain correct elements (swap=afterend)", function () {
        var calls = [];
        var handler = htmx.on("afterSwap.htmx", function (evt) {
            calls.push({detailElt: evt.detail.elt, detailTrigger: evt.detail.trigger, detailTarget: evt.detail.target, eventTarget: evt.target});
        });
        try {
            this.server.respondWith("GET", "/test", "<div id='id1'></div><div id='id2'></div>");
            var div = make("<div hx-get='/test' id='id0' hx-swap='afterend'></div>");
            div.click();
            this.server.respond();
            // target is followed by two new pseudo-roots: id1 & id2
            calls.length.should.equal(3);
            calls[0].eventTarget.id.should.equal('id0');
            calls[0].detailTrigger.should.equal(div);
            calls[0].detailTarget.should.equal(div);
            calls[0].detailElt.id.should.equal('id0');
            calls[1].eventTarget.id.should.equal('id1');
            calls[1].detailTrigger.should.equal(div);
            calls[1].detailTarget.should.equal(div);
            calls[1].detailElt.id.should.equal('id1');
            calls[2].eventTarget.id.should.equal('id2');
            calls[2].detailTrigger.should.equal(div);
            calls[2].detailTarget.should.equal(div);
            calls[2].detailElt.id.should.equal('id2');
        } finally {
            htmx.off("afterSwap.htmx", handler);
        }
    });

    it("afterOnLoad.htmx should contain correct elements", function () {
        var calls = [];
        var handler = htmx.on("afterOnLoad.htmx", function (evt) {
            calls.push({detailElt: evt.detail.elt, detailTrigger: evt.detail.trigger, detailTarget: evt.detail.target, eventTarget: evt.target});
        });
        try {
            this.server.respondWith("GET", "/test", "<div id='id1'></div><div id='id2'></div>");
            var div = make("<div hx-get='/test' id='id0'></div>");
            div.click();
            this.server.respond();
            calls.length.should.equal(1);
            calls[0].eventTarget.should.equal(div);
            calls[0].detailTrigger.should.equal(div);
            calls[0].detailTarget.should.equal(div);
            calls[0].detailElt.should.equal(div);
        } finally {
            htmx.off("afterSwap.htmx", handler);
        }
    });

});

