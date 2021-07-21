describe("BOOTSTRAP - htmx AJAX Tests", function(){
    beforeEach(function() {
        this.server = makeServer();
        clearWorkArea();
    });
    afterEach(function()  {
        this.server.restore();
        clearWorkArea();
    });

    it('properly handles a partial of HTML', function()
    {
        var i = 1;
        this.server.respondWith("GET", "/test", "<div id='d1'>foo</div><div id='d2'>bar</div>");
        var div = make('<div hx-get="/test" hx-select="#d1"></div>');
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("<div id=\"d1\">foo</div>");
    });

    it('properly handles a full HTML document', function()
    {
        var i = 1;
        this.server.respondWith("GET", "/test", "<html><body><div id='d1'>foo</div><div id='d2'>bar</div></body></html>");
        var div = make('<div hx-get="/test" hx-select="#d1"></div>');
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("<div id=\"d1\">foo</div>");
    });

    it('properly handles a full HTML document  w/ data-* prefix', function()
    {
        var i = 1;
        this.server.respondWith("GET", "/test", "<html><body><div id='d1'>foo</div><div id='d2'>bar</div></body></html>");
        var div = make('<div hx-get="/test" data-hx-select="#d1"></div>');
        div.click();
        this.server.respond();
        div.innerHTML.should.equal("<div id=\"d1\">foo</div>");
    });

    it("inherits the parent's hx-select", function()
    {
        this.server.respondWith("GET", "/test", '<section><p id="d2"></p></section>');
        var parent = make('<div id="parent" hx-select="#d2"><div id="child" hx-get="/test"></div></div>');
        var child = parent.querySelector('#child');
        child.click();
        this.server.respond();
        child.innerHTML.should.equal('<p id="d2"></p>');
    });

    it("overrides the parent's hx-select when using an empty hx-select", function()
    {
        this.server.respondWith("GET", "/test", '<section><p id="d2"></p></section>');
        var parent = make('<div id="parent" hx-select="#d2"><div id="child" hx-get="/test" hx-select=""></div></div>');
        var child = parent.querySelector('#child');
        child.click();
        this.server.respond();
        child.innerHTML.should.equal('<section><p id="d2"></p></section>');
    });
})
