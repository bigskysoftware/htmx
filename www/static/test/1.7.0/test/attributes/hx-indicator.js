describe("hx-indicator attribute", function(){
    beforeEach(function() {
        this.server = sinon.fakeServer.create();
        clearWorkArea();
    });
    afterEach(function()  {
        this.server.restore();
        clearWorkArea();
    });

    it('Indicator classes are properly put on element with no explicit indicator', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<button hx-get="/test">Click Me!</button>')
        btn.click();
        btn.classList.contains("htmx-request").should.equal(true);
        this.server.respond();
        btn.classList.contains("htmx-request").should.equal(false);
    });

    it('Indicator classes are properly put on element with explicit indicator', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<button hx-get="/test" hx-indicator="#a1, #a2">Click Me!</button>')
        var a1 = make('<a id="a1"></a>')
        var a2 = make('<a id="a2"></a>')
        btn.click();
        btn.classList.contains("htmx-request").should.equal(false);
        a1.classList.contains("htmx-request").should.equal(true);
        a2.classList.contains("htmx-request").should.equal(true);
        this.server.respond();
        btn.classList.contains("htmx-request").should.equal(false);
        a1.classList.contains("htmx-request").should.equal(false);
        a2.classList.contains("htmx-request").should.equal(false);
    });

    it('Indicator classes are properly put on element with explicit indicator w/ data-* prefix', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<button hx-get="/test" data-hx-indicator="#a1, #a2">Click Me!</button>')
        var a1 = make('<a id="a1"></a>')
        var a2 = make('<a id="a2"></a>')
        btn.click();
        btn.classList.contains("htmx-request").should.equal(false);
        a1.classList.contains("htmx-request").should.equal(true);
        a2.classList.contains("htmx-request").should.equal(true);
        this.server.respond();
        btn.classList.contains("htmx-request").should.equal(false);
        a1.classList.contains("htmx-request").should.equal(false);
        a2.classList.contains("htmx-request").should.equal(false);
    });

    it('allows closest syntax in hx-indicator', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");
        var div = make('<div id="d1"><button id="b1" hx-get="/test" hx-indicator="closest div">Click Me!</button></div>')
        var btn = byId("b1");
        btn.click();
        btn.classList.contains("htmx-request").should.equal(false);
        div.classList.contains("htmx-request").should.equal(true);
        this.server.respond();
        btn.classList.contains("htmx-request").should.equal(false);
        div.classList.contains("htmx-request").should.equal(false);
    });

    it('is removed when initiating element is removed from the DOM', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");
        var indicator = make('<div id="ind1">Indicator</div>')
        var div = make('<div id="d1" hx-target="this" hx-indicator="#ind1"><button id="b1" hx-get="/test">Click Me!</button></div>')
        var btn = byId("b1");
        btn.click();
        indicator.classList.contains("htmx-request").should.equal(true);
        this.server.respond();
        indicator.classList.contains("htmx-request").should.equal(false);
    });

    it('allows this syntax in hx-indicator', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");
        var div = make('<div id="d1" hx-indicator="this"><button id="b1" hx-get="/test">Click Me!</button></div>')
        var btn = byId("b1");
        btn.click();
        btn.classList.contains("htmx-request").should.equal(false);
        div.classList.contains("htmx-request").should.equal(true);
        this.server.respond();
        btn.classList.contains("htmx-request").should.equal(false);
        div.classList.contains("htmx-request").should.equal(false);
    });


})
