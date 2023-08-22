describe("kt-target attribute", function(){
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
        var btn = make('<button kt-target="#d1" kt-get="/test">Click Me!</button>')
        var div1 = make('<div id="d1"></div>')
        btn.click();
        this.server.respond();
        div1.innerHTML.should.equal("Clicked!");
    });

    it('targets a parent element properly', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");
        var div1 = make('<div id="d1"><button id="b1" kt-target="#d1" kt-get="/test">Click Me!</button></div>')
        var btn = byId("b1")
        btn.click();
        this.server.respond();
        div1.innerHTML.should.equal("Clicked!");
    });

    it('targets a `this` element properly', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");
        var div1 = make('<div kt-target="this"><button id="b1" kt-get="/test">Click Me!</button></div>')
        var btn = byId("b1")
        btn.click();
        this.server.respond();
        div1.innerHTML.should.equal("Clicked!");
    });

    it('targets a `closest` element properly', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");
        var div1 = make('<div><p><i><button id="b1" kt-target="closest div" kt-get="/test">Click Me!</button></i></p></div>')
        var btn = byId("b1")
        btn.click();
        this.server.respond();
        div1.innerHTML.should.equal("Clicked!");
    });

    it('targets an inner element properly', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<button kt-target="#d1" kt-get="/test">Click Me!<div id="d1"></div></button>')
        var div1 = byId("d1")
        btn.click();
        this.server.respond();
        div1.innerHTML.should.equal("Clicked!");
    });


    it('handles bad target gracefully', function()
    {
        this.server.respondWith("GET", "/test", "Clicked!");
        var btn = make('<button kt-target="bad" kt-get="/test">Click Me!</button>')
        btn.click();
        this.server.respond();
        btn.innerHTML.should.equal("Click Me!");
    });

})
