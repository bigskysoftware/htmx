describe("hx-target attribute", function(){
    beforeEach(function() {
        this.server = sinon.fakeServer.create();
        clearWorkArea();
    });
    afterEach(function()  {
        this.server.restore();
        clearWorkArea();
    });

    it('targets an adjacent element properly', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<button hx-target="#d1" hx-get="/test">Click Me!</button>')
        var div1 = make('<div id="d1"></div>')
        btn.click();
        this.server.respond();
        div1.innerHTML.should.equal("Clicked!");
    });

    it('targets a parent element properly', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");
        var div1 = make('<div id="d1"><button id="b1" hx-target="#d1" hx-get="/test">Click Me!</button></div>')
        var btn = byId("b1")
        btn.click();
        this.server.respond();
        div1.innerHTML.should.equal("Clicked!");
    });

    it('targets a `this` element properly', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");
        var div1 = make('<div hx-target="this"><button id="b1" hx-get="/test">Click Me!</button></div>')
        var btn = byId("b1")
        btn.click();
        this.server.respond();
        div1.innerHTML.should.equal("Clicked!");
    });

    it('targets a `closest` element properly', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");
        var div1 = make('<div><p><i><button id="b1" hx-target="closest div" hx-get="/test">Click Me!</button></i></p></div>')
        var btn = byId("b1")
        btn.click();
        this.server.respond();
        div1.innerHTML.should.equal("Clicked!");
    });
    
    it('targets a `find` element properly', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");
        var div1 = make('<div hx-target="find span" hx-get="/test">Click Me! <div><span id="s1"></span><span id="s2"></span></div></div>')
        div1.click();
        this.server.respond();
        var span1 = byId("s1")
        var span2 = byId("s2")
        span1.innerHTML.should.equal("Clicked!");
        span2.innerHTML.should.equal("");
    });

    it('targets an inner element properly', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<button hx-target="#d1" hx-get="/test">Click Me!<div id="d1"></div></button>')
        var div1 = byId("d1")
        btn.click();
        this.server.respond();
        div1.innerHTML.should.equal("Clicked!");
    });


    it('handles bad target gracefully', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<button hx-target="bad" hx-get="/test">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Click Me!");
    });


    it('targets an adjacent element properly w/ data-* prefix', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<button data-hx-target="#d1" data-hx-get="/test">Click Me!</button>')
        var div1 = make('<div id="d1"></div>')
        btn.click();
        this.server.respond();
        div1.innerHTML.should.equal("Clicked!");
    });


})
