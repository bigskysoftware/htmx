describe("hx-select-oob attribute", function () {
    beforeEach(function () {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function () {
        this.server.restore();
        clearWorkArea();
    });

    it('basic hx-select-oob works', function()
    {
        this.server.respondWith("GET", "/test", "<div id='d1'>foo</div><div id='d2'>bar</div>");
        var div = make('<div hx-get="/test" hx-select="#d1" hx-select-oob="#d2"></div>');
        make('<div id="d2"></div>');
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("<div id=\"d1\">foo</div>");
        var div2 = byId('d2');
        div2.innerHTML.should.equal("bar");
    });

    it('multiple hx-select-oobs works', function()
    {
        this.server.respondWith("GET", "/test", "<div id='d1'>foo</div><div id='d2'>bar</div><div id='d3'>bar</div>");
        var div = make('<div hx-get="/test" hx-select="#d1" hx-select-oob="#d2, #d3"></div>');
        make('<div id="d2"></div>');
        make('<div id="d3"></div>');
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("<div id=\"d1\">foo</div>");

        var div2 = byId('d2');
        div2.innerHTML.should.equal("bar");

        var div3 = byId('d2');
        div3.innerHTML.should.equal("bar");
    });

    it('basic hx-select-oob ignores bad selector', function()
    {
        this.server.respondWith("GET", "/test", "<div id='d1'>foo</div><div id='d2'>bar</div>");
        var div = make('<div hx-get="/test" hx-select="#d1" hx-select-oob="#bad"></div>');
        make('<div id="d2"></div>');
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("<div id=\"d1\">foo</div>");
        var div2 = byId('d2');
        div2.innerHTML.should.equal("");
    });


});

