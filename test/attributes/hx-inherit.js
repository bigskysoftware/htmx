describe("hx-inherit attribute", function() {

    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('basic inheritance sanity-check', function () {
        var response_inner = '<div id="snowflake" class="">Hello world</div>'
        var response = '<div id="unique" class="">' + response_inner + '</div>'
        this.server.respondWith("GET", "/test", response);

        var div = make('<div hx-select="#snowflake" hx-target="#cta" hx-swap="outerHTML"><button id="bx1" hx-get="/test"><span id="cta">Click Me!</span></button></div>')
        var btn = byId("bx1");
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal(response_inner);
    })


    it('inheritance exclude single attribute', function () {
        var response_inner = '<div id="snowflake" class="">Hello world</div>'
        var response = '<div id="unique">' + response_inner + '</div>'
        this.server.respondWith("GET", "/test", response);

        var div = make('<div hx-select="#snowflake" hx-target="#cta" hx-swap="beforebegin" hx-inherit="hx-select"><button id="bx1" hx-get="/test"><span id="cta">Click Me!</span></button></div>')
        var btn = byId("bx1");
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal(response + '<span id="cta" class="">Click Me!</span>');
    });

    it('inheritance exclude multiple attributes', function () {
        var response_inner = '<div id="snowflake">Hello world</div>'
        var response = '<div id="unique">' + response_inner + '</div>'
        this.server.respondWith("GET", "/test", response);

        var div = make('<div hx-select="#snowflake" hx-target="#cta" hx-swap="beforebegin" hx-inherit="hx-select hx-swap"><button id="bx1" hx-get="/test"><span id="cta">Click Me!</span></button></div>')
        var btn = byId("bx1");
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal('<span id="cta" class="">' + response + '</span>');
    });

    it('inheritance exclude all attributes', function () {
        var response_inner = '<div id="snowflake">Hello world</div>'
        var response = '<div id="unique">' + response_inner + '</div>'
        this.server.respondWith("GET", "/test", response);

        var div = make('<div hx-select="#snowflake" hx-target="#cta" hx-swap="beforebegin" hx-inherit="false"><button id="bx1" hx-get="/test"><span id="cta">Click Me!</span></button></div>')
        var btn = byId("bx1");
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal('<span id="cta" class="">' + response + '</span>');
    });

    it('same-element inheritance disable', function () {
        var response_inner = '<div id="snowflake" class="">Hello world</div>'
        var response = '<div id="unique">' + response_inner + '</div>'
        this.server.respondWith("GET", "/test", response);

        var btn = make('<button hx-select="#snowflake" hx-target="#container" hx-trigger="click" hx-get="/test" hx-swap="outerHTML" hx-inherit="false"><div id="container"></div></button>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal(response_inner);
    });

    /* Does not work properly yet; how can btn.innerHTML be true, but at the same time div.parentElement.innerHTML not contain the btn itself anymore? */
    it('same-element inheritance disable with child nodes', function () {
        var response_inner = '<div id="snowflake" class="">Hello world</div>'
        var response = '<div id="unique">' + response_inner + '</div>'
        this.server.respondWith("GET", "/test", response);
        this.server.respondWith("GET", "/test2", 'unique-snowflake');

        var div = make('<div hx-select="#snowflake" hx-target="#container" hx-get="/test" hx-swap="outerHTML" hx-inherit="false"><div id="container"><button id="bx1" hx-get="/test2" hx-trigger="click" hx-target="#target"><div id="target"></div></button></div></div>')
        var btn = byId("bx1");
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal('<div id="target" class="">unique-snowflake</div>');
        div.parentElement.innerHTML.should.equal('');
        var count = (div.innerHTML.match(/slowflake/g) || []).length;
        count.should.equal(1);
    });
});

