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

    it("should handle simple comma separated list HX-Trigger response header properly", function () {
        this.server.respondWith("GET", "/test", [200, {"HX-Trigger": "foo, bar"}, ""]);

        var div = make('<div hx-get="/test"></div>');
        var invokedEventFoo = false;
        var invokedEventBar = false;
        div.addEventListener("foo", function (evt) {
            invokedEventFoo = true;
        });
        div.addEventListener("bar", function (evt) {
            invokedEventBar = true;
        });
        div.click();
        this.server.respond();
        invokedEventFoo.should.equal(true);
        invokedEventBar.should.equal(true);
    })

    it("should handle simple comma separated list without space HX-Trigger response header properly", function () {
        this.server.respondWith("GET", "/test", [200, {"HX-Trigger": "foo,bar"}, ""]);

        var div = make('<div hx-get="/test"></div>');
        var invokedEventFoo = false;
        var invokedEventBar = false;
        div.addEventListener("foo", function (evt) {
            invokedEventFoo = true;
        });
        div.addEventListener("bar", function (evt) {
            invokedEventBar = true;
        });
        div.click();
        this.server.respond();
        invokedEventFoo.should.equal(true);
        invokedEventBar.should.equal(true);
    })

    it("should handle dot path in comma separated list HX-Trigger response header properly", function () {
        this.server.respondWith("GET", "/test", [200, {"HX-Trigger": "foo.bar,bar.baz"}, ""]);

        var div = make('<div hx-get="/test"></div>');
        var invokedEventFoo = false;
        var invokedEventBar = false;
        div.addEventListener("foo.bar", function (evt) {
            invokedEventFoo = true;
        });
        div.addEventListener("bar.baz", function (evt) {
            invokedEventBar = true;
        });
        div.click();
        this.server.respond();
        invokedEventFoo.should.equal(true);
        invokedEventBar.should.equal(true);
    })

    it("should handle a namespaced comma separated list HX-Trigger response header properly", function () {
        this.server.respondWith("GET", "/test", [200, {"HX-Trigger": "namespace:foo,bar"}, ""]);

        var div = make('<div hx-get="/test"></div>');
        var invokedEventFoo = false;
        var invokedEventBar = false;
        div.addEventListener("namespace:foo", function (evt) {
            invokedEventFoo = true;
        });
        div.addEventListener("bar", function (evt) {
            invokedEventBar = true;
        });
        div.click();
        this.server.respond();
        invokedEventFoo.should.equal(true);
        invokedEventBar.should.equal(true);
    })

    it("should handle HX-Retarget", function () {
        this.server.respondWith("GET", "/test", [200, {"HX-Retarget": "#d2"}, "Result"]);

        var div1 = make('<div id="d1" hx-get="/test"></div>');
        var div2 = make('<div id="d2"></div>');
        div1.click();
        this.server.respond();
        div1.innerHTML.should.equal("");
        div2.innerHTML.should.equal("Result");
    })

    it("should handle HX-Retarget that targets a non-existent element", function() {
        this.server.respondWith('GET', '/test', [200, {'HX-Retarget': 'closest #d2'}, 'Result']);

        var div1 = make('<div id="d1" hx-get="/test"></div>');
        var invokedEventTargetError = false;
        var eventTargetErrorDetails = {};
        div1.addEventListener('htmx:targetError', function(evt) {
            console.error(evt);
            invokedEventTargetError = true;
            eventTargetErrorDetails = evt.detail;
        });

        div1.click();
        this.server.respond();

        invokedEventTargetError.should.equal(true);
        eventTargetErrorDetails.error.should.equal('htmx:targetError');
        eventTargetErrorDetails.target.should.equal('closest #d2');
    })

    it("should handle HX-Reswap", function () {
        this.server.respondWith("GET", "/test", [200, {"HX-Reswap": "innerHTML"}, "Result"]);

        var div1 = make('<div id="d1" hx-get="/test" hx-swap="outerHTML"></div>');
        div1.click();
        this.server.respond();
        div1.innerHTML.should.equal("Result");
    })

    it("should handle HX-Reselect", function () {
        this.server.respondWith("GET", "/test", [200, {"HX-Reselect": "#d2"}, "<div id='d1'>foo</div><div id='d2'>bar</div>"]);

        var div = make('<div hx-get="/test" hx-select="#d1"></div>');
        div.click();
        this.server.respond();

        div.innerHTML.should.equal('<div id="d2">bar</div>');
    });

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

    it("should handle simple comma separated list HX-Trigger-After-Swap response header properly w/ outerHTML swap", function () {
        this.server.respondWith("GET", "/test", [200, {"HX-Trigger-After-Swap": "foo, bar"}, ""]);

        var div = make('<div hx-swap="outerHTML" hx-get="/test"></div>');
        var invokedEventFoo = false;
        var invokedEventBar = false;
        var handlerFoo = htmx.on('foo', function (evt) {
            invokedEventFoo = true;
        });
        var handlerBar = htmx.on('bar', function (evt) {
            invokedEventBar = true;
        });
        div.click();
        this.server.respond();
        invokedEventFoo.should.equal(true);
        invokedEventBar.should.equal(true);
        htmx.off('foo', handlerFoo);
        htmx.off('bar', handlerBar);
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

    it("should handle simple comma separated list HX-Trigger-After-Settle response header properly w/ outerHTML swap", function () {
        this.server.respondWith("GET", "/test", [200, {"HX-Trigger-After-Settle": "foo, bar"}, ""]);

        var div = make('<div hx-swap="outerHTML" hx-get="/test"></div>');
        var invokedEventFoo = false;
        var invokedEventBar = false;
        var handlerFoo = htmx.on('foo', function (evt) {
            invokedEventFoo = true;
        });
        var handlerBar = htmx.on('bar', function (evt) {
            invokedEventBar = true;
        });
        div.click();
        this.server.respond();
        invokedEventFoo.should.equal(true);
        invokedEventBar.should.equal(true);
        htmx.off('foo', handlerFoo);
        htmx.off('bar', handlerBar);
    })


    it("should change body content on HX-Location", function () {
        this.server.respondWith("GET", "/test", [200, {"HX-Location": '{"path":"/test2", "target":"#testdiv"}'}, ""]);
        this.server.respondWith("GET", "/test2", [200, {}, "<div>Yay! Welcome</div>"]);
        var div = make('<div id="testdiv" hx-trigger="click" hx-get="/test"></div>');
        div.click();
        this.server.respond();
        this.server.respond();
        div.innerHTML.should.equal('<div>Yay! Welcome</div>');
    })

    it('request to restore history should include the HX-Request header', function () {
        this.server.respondWith('GET', '/test', function (xhr) {
            xhr.requestHeaders['HX-Request'].should.be.equal('true');
            xhr.respond(200, {}, '');
        });
        htmx._('loadHistoryFromServer')('/test');
        this.server.respond();
    });

    it('request to restore history should include the HX-History-Restore-Request header', function () {
        this.server.respondWith('GET', '/test', function (xhr) {
            xhr.requestHeaders['HX-History-Restore-Request'].should.be.equal('true');
            xhr.respond(200, {}, '');
        });
        htmx._('loadHistoryFromServer')('/test');
        this.server.respond();
    });

    it('request to restore history should include the HX-Current-URL header', function () {
        this.server.respondWith('GET', '/test', function (xhr) {
            chai.assert(typeof xhr.requestHeaders['HX-Current-URL'] !== 'undefined', 'HX-Current-URL should not be undefined');
            xhr.respond(200, {}, '');
        });
        htmx._('loadHistoryFromServer')('/test');
        this.server.respond();
    });
});
